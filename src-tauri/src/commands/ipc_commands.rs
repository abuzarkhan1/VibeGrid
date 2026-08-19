use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn set_batch_interval(
    state: State<'_, AppState>,
    interval_ms: u64,
) -> Result<u64, String> {
    Ok(state.batcher.set_interval(interval_ms))
}

#[tauri::command]
pub fn get_http_port() -> u16 {
    crate::http_server::http_port()
}

#[tauri::command]
pub async fn pane_snapshot(
    state: State<'_, AppState>,
    pane_id: String,
) -> Result<(String, bool), String> {
    Ok(state.batcher.pane_snapshot(&pane_id))
}
