use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{async_runtime::spawn_blocking, State};
use crate::AppState;

#[allow(clippy::too_many_arguments)]
#[tauri::command]
pub async fn spawn_pty(
    state: State<'_, AppState>,
    cols: u16,
    rows: u16,
    cwd: Option<String>,
    shell: Option<String>,
    shell_args: Option<Vec<String>>,
    shell_env: Option<HashMap<String, String>>,
    env: Option<HashMap<String, String>>,
) -> Result<String, String> {
    let effective_env = env.or(shell_env);
    let manager = state.pty_manager.clone();
    let batcher = state.batcher.clone();
    spawn_blocking(move || manager.spawn_pane(cols, rows, cwd, shell, shell_args, effective_env, batcher))
        .await
        .map_err(|e| format!("Spawn task failed: {e}"))?
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaneSpawnSpec {
    pub node_id: String,
    pub cols: u16,
    pub rows: u16,
    pub cwd: Option<String>,
    pub shell: Option<String>,
    pub shell_args: Option<Vec<String>>,
    pub env: Option<HashMap<String, String>>,
    pub initial_command: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchSpawnResult {
    pub node_id: String,
    pub pane_id: String,
    pub success: bool,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn batch_spawn_panes(
    state: State<'_, AppState>,
    specs: Vec<PaneSpawnSpec>,
) -> Result<Vec<BatchSpawnResult>, String> {
    let manager = state.pty_manager.clone();
    let batcher = state.batcher.clone();

    spawn_blocking(move || {
        let mut results = Vec::new();
        for spec in specs {
            match manager.spawn_pane(
                spec.cols,
                spec.rows,
                spec.cwd,
                spec.shell,
                spec.shell_args,
                spec.env,
                batcher.clone(),
            ) {
                Ok(pane_id) => {
                    if let Some(cmd) = spec.initial_command {
                        if !cmd.trim().is_empty() {
                            let _ = manager.write_to_pane(&pane_id, &format!("{cmd}\n"));
                        }
                    }
                    results.push(BatchSpawnResult {
                        node_id: spec.node_id,
                        pane_id,
                        success: true,
                        error: None,
                    });
                }
                Err(e) => {
                    results.push(BatchSpawnResult {
                        node_id: spec.node_id,
                        pane_id: String::new(),
                        success: false,
                        error: Some(e),
                    });
                }
            }
        }
        Ok(results)
    })
    .await
    .map_err(|e| format!("Batch spawn task failed: {e}"))?
}

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
