use tauri::State;
use crate::AppState;
use crate::config::WorkspaceData;

#[tauri::command]
pub async fn save_workspace(
    workspace: WorkspaceData,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.workspace_manager.save_workspace(&workspace)
}

#[tauri::command]
pub async fn load_workspace(
    id: String,
    state: State<'_, AppState>,
) -> Result<WorkspaceData, String> {
    state.workspace_manager.load_workspace(&id)
}

#[tauri::command]
pub async fn list_workspaces(
    state: State<'_, AppState>,
) -> Result<Vec<WorkspaceData>, String> {
    state.workspace_manager.list_workspaces()
}

#[tauri::command]
pub async fn delete_workspace(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.workspace_manager.delete_workspace(&id)
}
