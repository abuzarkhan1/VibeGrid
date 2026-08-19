use tauri::State;
use crate::AppState;
use crate::config::WorkspaceData;

#[tauri::command]
pub async fn save_workspace(
    workspace: WorkspaceData,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let wm = state.workspace_manager.clone();
    tokio::task::spawn_blocking(move || wm.save_workspace(&workspace))
        .await
        .map_err(|e| format!("Save workspace task failed: {e}"))?
}

#[tauri::command]
pub async fn list_workspaces(
    state: State<'_, AppState>,
) -> Result<Vec<WorkspaceData>, String> {
    let wm = state.workspace_manager.clone();
    tokio::task::spawn_blocking(move || wm.list_workspaces())
        .await
        .map_err(|e| format!("List workspaces task failed: {e}"))?
}

#[tauri::command]
pub async fn delete_workspace(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let wm = state.workspace_manager.clone();
    tokio::task::spawn_blocking(move || wm.delete_workspace(&id))
        .await
        .map_err(|e| format!("Delete workspace task failed: {e}"))?
}
