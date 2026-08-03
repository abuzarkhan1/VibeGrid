use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn set_batch_interval(
    state: State<'_, AppState>,
    interval_ms: u64,
) -> Result<u64, String> {
    Ok(state.batcher.set_interval(interval_ms))
}