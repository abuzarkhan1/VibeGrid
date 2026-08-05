use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn set_batch_interval(
    state: State<'_, AppState>,
    interval_ms: u64,
) -> Result<u64, String> {
    Ok(state.batcher.set_interval(interval_ms))
}

/// The port the MCP/HTTP endpoint listens on (customization audit S8 — the
/// Settings UI surfaces it so users can point external MCP clients at it).
/// Env-overridable via VIBEGRID_HTTP_PORT; defaults to 8792.
#[tauri::command]
pub fn get_http_port() -> u16 {
    crate::http_server::http_port()
}

/// Return the recent output history of a pane (last ~256 KB) plus whether its
/// process already exited. The frontend calls this when switching back to a
/// workspace so terminals that were unmounted while hidden can repaint what
/// their processes printed — and show the "process exited" banner even when
/// the live exit event was missed (workspace isolation).
#[tauri::command]
pub async fn pane_snapshot(
    state: State<'_, AppState>,
    pane_id: String,
) -> Result<(String, bool), String> {
    Ok(state.batcher.pane_snapshot(&pane_id))
}