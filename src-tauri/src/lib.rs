pub mod commands;
pub mod config;
pub mod ipc;
pub mod pty;

use config::WorkspaceManager;
use ipc::IpcBatcher;
use pty::PtyManager;
use tauri::{Manager, RunEvent};

pub struct AppState {
    pub pty_manager: PtyManager,
    pub batcher: IpcBatcher,
    pub workspace_manager: WorkspaceManager,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pty_manager = PtyManager::new();
    let pty_manager_cleanup = pty_manager.clone();

    let app = tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();
            let batcher = IpcBatcher::new(handle);
            let workspace_manager = WorkspaceManager::new();

            app.manage(AppState {
                pty_manager,
                batcher,
                workspace_manager,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::spawn_pty,
            commands::write_to_pty,
            commands::resize_pty,
            commands::kill_pty,
            commands::save_workspace,
            commands::load_workspace,
            commands::list_workspaces,
            commands::delete_workspace,
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
