use tauri::{async_runtime::spawn_blocking, State};
use crate::AppState;

/// Spawn a new PTY session. `shell` optionally overrides the default shell for
/// this pane (audit: the per-pane shell field is now wired end-to-end).
///
/// The underlying `openpty` + process spawn is blocking work — run it off the
/// async runtime thread (audit improvement: spawn_blocking) so a slow spawn
/// can't stall other IPC commands.
#[tauri::command]
pub async fn spawn_pty(
    state: State<'_, AppState>,
    cols: u16,
    rows: u16,
    cwd: Option<String>,
    shell: Option<String>,
) -> Result<String, String> {
    let manager = state.pty_manager.clone();
    let batcher = state.batcher.clone();
    spawn_blocking(move || manager.spawn_pane(cols, rows, cwd, shell, batcher))
        .await
        .map_err(|e| format!("Spawn task failed: {e}"))?
}

/// Write input to a pane. The writer is a blocking pipe — run the write off the
/// async runtime thread (audit improvement) so slow/hung shells don't stall IPC.
#[tauri::command]
pub async fn write_to_pty(
    state: State<'_, AppState>,
    pane_id: String,
    data: String,
) -> Result<(), String> {
    let manager = state.pty_manager.clone();
    spawn_blocking(move || manager.write_to_pane(&pane_id, &data))
        .await
        .map_err(|e| format!("Write task failed: {e}"))?
}

/// Resize a pane. `resize` touches the PTY master synchronously — off-thread.
#[tauri::command]
pub async fn resize_pty(
    state: State<'_, AppState>,
    pane_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let manager = state.pty_manager.clone();
    spawn_blocking(move || manager.resize_pane(&pane_id, cols, rows))
        .await
        .map_err(|e| format!("Resize task failed: {e}"))?
}

/// Kill a pane and its process group. `kill_pane` waits up to 500 ms for the
/// shell to exit — off-thread so the IPC channel stays responsive.
#[tauri::command]
pub async fn kill_pty(
    state: State<'_, AppState>,
    pane_id: String,
) -> Result<(), String> {
    let manager = state.pty_manager.clone();
    spawn_blocking(move || manager.kill_pane(&pane_id))
        .await
        .map_err(|e| format!("Kill task failed: {e}"))?
}
