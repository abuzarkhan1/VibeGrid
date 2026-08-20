pub mod autostart;
pub mod commands;
pub mod config;
pub mod ipc;
pub mod pty;
pub mod speech;
pub mod http_server;
pub mod mcp_server;
pub mod utils;

use std::sync::Arc;

use config::WorkspaceManager;
use ipc::IpcBatcher;
use pty::PtyManager;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, RunEvent,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

pub struct AppState {
    pub pty_manager: PtyManager,
    pub batcher: IpcBatcher,
    pub workspace_manager: WorkspaceManager,
    pub speech: Arc<speech::SpeechManager>,

    pub global_summon: parking_lot::Mutex<Option<Shortcut>>,
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

pub(crate) fn toggle_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            show_main_window(app);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pty_manager = PtyManager::new();
    let pty_manager_cleanup = pty_manager.clone();

    let app = tauri::Builder::default()

        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            show_main_window(app);
        }))

        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .build()
        )

        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())

        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            let batcher = IpcBatcher::new(handle);
            let workspace_manager = WorkspaceManager::new();

            let mcp_token = uuid::Uuid::new_v4().to_string();
            http_server::write_token_state(&mcp_token);
            http_server::start_server(batcher.mcp_history.clone(), mcp_token);

            pty_manager.set_batcher(batcher.clone());

            app.manage(AppState {
                pty_manager,
                batcher,
                workspace_manager,
                speech: Arc::new(speech::SpeechManager::new()),
                global_summon: parking_lot::Mutex::new(None),
            });

            let show_item = MenuItem::with_id(app, "show", "Show VibeGrid", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit VibeGrid", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let mut tray_builder = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                });
            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_icon(icon.clone());
                }
            }
            tray_builder.build(app)?;

            let default_accel = "Mod+Shift+Space";
            match commands::parse_shortcut(default_accel) {
                Ok(summon) => match app.global_shortcut().on_shortcut(summon, |app, _s, _e| {
                    toggle_main_window(app);
                }) {
                    Ok(()) => {
                        *app.state::<AppState>().global_summon.lock() = Some(summon);
                    }
                    Err(e) => {
                        eprintln!(
                            "[VibeGrid] Warning: could not register global summon shortcut ({default_accel}): {e}"
                        );
                        eprintln!(
                            "[VibeGrid] The app will continue without this shortcut. Another VibeGrid instance or app may already hold it."
                        );

                        let handle = app.handle().clone();
                        std::thread::spawn(move || {
                            std::thread::sleep(std::time::Duration::from_millis(1200));
                            let _ = handle.emit(
                                "vibegrid://shortcut-warning",
                                "Global summon shortcut (Cmd/Ctrl+Shift+Space) could not be registered. Another VibeGrid instance or app may already be using it.",
                            );
                        });
                    }
                },
                Err(e) => {
                    eprintln!("[VibeGrid] Bug: default global summon accelerator failed to parse: {e}");
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::spawn_pty,
            commands::batch_spawn_panes,
            commands::discover_installed_agents,
            commands::write_to_pty,
            commands::resize_pty,
            commands::kill_pty,
            commands::set_batch_interval,
            commands::get_http_port,
            commands::pane_snapshot,
            commands::save_workspace,
            commands::list_workspaces,
            commands::delete_workspace,
            commands::get_git_diff,
            commands::voice_model_status,
            commands::voice_ensure_model,
            commands::voice_start_recording,
            commands::voice_stop_recording,
            commands::voice_cancel_recording,
            commands::voice_set_silence_timeout,
            commands::voice_set_input_device,
            commands::voice_list_input_devices,
            commands::voice_set_language,
            commands::voice_set_model_size,
            commands::set_global_summon,
            autostart::autostart_set_enabled,
        ])
        .build(tauri::generate_context!())
        .expect("error while building VibeGrid application");

    app.run(move |_app_handle, event| {
        if let RunEvent::ExitRequested { .. } = event {

            pty_manager_cleanup.kill_all_panes();
        }
    });
}
