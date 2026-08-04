pub mod commands;
pub mod config;
pub mod ipc;
pub mod pty;
pub mod speech;
pub mod http_server;
pub mod mcp_server;

use std::sync::Arc;

use config::WorkspaceManager;
use ipc::IpcBatcher;
use pty::PtyManager;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, RunEvent,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

pub struct AppState {
    pub pty_manager: PtyManager,
    pub batcher: IpcBatcher,
    pub workspace_manager: WorkspaceManager,
    pub speech: Arc<speech::SpeechManager>,
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pty_manager = PtyManager::new();
    let pty_manager_cleanup = pty_manager.clone();

    let app = tauri::Builder::default()
        // Single-instance: focus the existing window instead of duplicating PTYs
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            show_main_window(app);
        }))
        // Persist window position/size across restarts
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .build()
        )
        // Native open (links/files) + native dialogs (folder picker)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let batcher = IpcBatcher::new(handle);
            let workspace_manager = WorkspaceManager::new();

            http_server::start_server(batcher.mcp_history.clone());

            app.manage(AppState {
                pty_manager,
                batcher,
                workspace_manager,
                speech: Arc::new(speech::SpeechManager::new()),
            });

            // System tray icon: show / quit (UX audit 5.2)
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
            }
            tray_builder.build(app)?;

            // Global summon shortcut: Cmd/Ctrl+Shift+Space toggles the window (UX audit 5.3).
            // NOTE: `on_shortcut` registers the shortcut internally — do NOT call `register`
            // again (double registration can fail AND overwrite the handler with None).
            // Registration is best-effort: if the OS rejects it (e.g. another instance or
            // app already holds the hotkey), warn instead of crashing the app.
            let summon = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::Space);
            if let Err(e) = app.global_shortcut().on_shortcut(summon, |app, _shortcut, _event| {
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        show_main_window(app);
                    }
                }
            }) {
                eprintln!(
                    "[VibeGrid] Warning: could not register global summon shortcut (Cmd/Ctrl+Shift+Space): {e}"
                );
                eprintln!(
                    "[VibeGrid] The app will continue without this shortcut. Another VibeGrid instance or app may already hold it."
                );
                // Surface the issue in the UI (emitted on a delay so the webview is ready to listen)
                let handle = app.handle().clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(1200));
                    let _ = handle.emit(
                        "vibegrid://shortcut-warning",
                        "Global summon shortcut (Cmd/Ctrl+Shift+Space) could not be registered. Another VibeGrid instance or app may already be using it.",
                    );
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::spawn_pty,
            commands::write_to_pty,
            commands::resize_pty,
            commands::kill_pty,
            commands::set_batch_interval,
            commands::save_workspace,
            commands::load_workspace,
            commands::list_workspaces,
            commands::delete_workspace,
            commands::voice_model_status,
            commands::voice_ensure_model,
            commands::voice_start_recording,
            commands::voice_stop_recording,
            commands::voice_cancel_recording,
            commands::voice_is_recording,
            commands::voice_set_silence_timeout,
            commands::voice_set_input_device,
            commands::voice_list_input_devices,
        ])
        .build(tauri::generate_context!())
        .expect("error while building VibeGrid application");

    app.run(move |_app_handle, event| {
        if let RunEvent::ExitRequested { .. } = event {
            // Terminate all active PTY processes on exit to prevent orphan processes
            pty_manager_cleanup.kill_all_panes();
        }
    });
}
