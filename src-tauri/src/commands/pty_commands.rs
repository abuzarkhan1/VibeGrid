use tauri::State;
use crate::AppState;

#[tauri::command]
pub async fn spawn_pty(
    state: State<'_, AppState>,
    cols: u16,
    rows: u16,
    cwd: Option<String>,
) -> Result<String, String> {
    state
        .pty_manager
        .spawn_pane(cols, rows, cwd, state.batcher.clone())
}

#[tauri::command]
pub async fn write_to_pty(
    state: State<'_, AppState>,
    pane_id: String,
    data: String,
) -> Result<(), String> {
    state.pty_manager.write_to_pane(&pane_id, &data)
}

#[tauri::command]
pub async fn resize_pty(
    state: State<'_, AppState>,
    pane_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    state.pty_manager.resize_pane(&pane_id, cols, rows)
}

#[tauri::command]
pub async fn kill_pty(
    state: State<'_, AppState>,
    pane_id: String,
) -> Result<(), String> {
    state.pty_manager.kill_pane(&pane_id)
}
