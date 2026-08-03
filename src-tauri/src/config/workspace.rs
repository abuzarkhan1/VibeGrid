use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WorkspaceData {
    pub id: String,
    pub name: String,
    pub layout: serde_json::Value,
    pub created_at: u64,
    pub updated_at: u64,
}

pub struct WorkspaceManager {
    storage_dir: PathBuf,
}

impl Default for WorkspaceManager {
    fn default() -> Self {
        Self::new()
    }
}

impl WorkspaceManager {
    pub fn new() -> Self {
        let storage_dir = dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("vibegrid")
            .join("workspaces");

        if !storage_dir.exists() {
            let _ = fs::create_dir_all(&storage_dir);
        }

        Self { storage_dir }
    }

    /// Atomically save workspace to JSON using temp file and rename (NFR-014)
    pub fn save_workspace(&self, workspace: &WorkspaceData) -> Result<(), String> {
        let file_path = self.storage_dir.join(format!("{}.json", workspace.id));
        let temp_path = self.storage_dir.join(format!("{}.tmp", workspace.id));

        let json_data = serde_json::to_string_pretty(workspace)
            .map_err(|e| format!("Failed to serialize workspace: {}", e))?;

        let mut temp_file = File::create(&temp_path)
            .map_err(|e| format!("Failed to create temp file: {}", e))?;

        temp_file
            .write_all(json_data.as_bytes())
            .map_err(|e| format!("Failed to write workspace data: {}", e))?;

        temp_file.flush().map_err(|e| format!("Failed to flush temp file: {}", e))?;

        fs::rename(&temp_path, &file_path)
            .map_err(|e| format!("Failed to rename temp workspace file: {}", e))?;

        Ok(())
    }

    /// Load workspace by ID
    pub fn load_workspace(&self, id: &str) -> Result<WorkspaceData, String> {
        let file_path = self.storage_dir.join(format!("{}.json", id));
        if !file_path.exists() {
            return Err(format!("Workspace {} not found", id));
        }

        let content = fs::read_to_string(&file_path)
            .map_err(|e| format!("Failed to read workspace file: {}", e))?;

        let workspace: WorkspaceData = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse workspace JSON: {}", e))?;

        Ok(workspace)
    }

    /// List all persisted workspaces
    pub fn list_workspaces(&self) -> Result<Vec<WorkspaceData>, String> {
        let mut result = Vec::new();
        if !self.storage_dir.exists() {
            return Ok(result);
        }

        let entries = fs::read_dir(&self.storage_dir)
            .map_err(|e| format!("Failed to read workspace directory: {}", e))?;

        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(ws) = serde_json::from_str::<WorkspaceData>(&content) {
                        result.push(ws);
                    }
                }
            }
        }

        result.sort_by_key(|b| std::cmp::Reverse(b.updated_at));
        Ok(result)
    }

    /// Delete workspace by ID
    pub fn delete_workspace(&self, id: &str) -> Result<(), String> {
        let file_path = self.storage_dir.join(format!("{}.json", id));
        if file_path.exists() {
            fs::remove_file(file_path)
                .map_err(|e| format!("Failed to delete workspace file: {}", e))?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_workspace_atomic_save_load_delete() {
        let dir = tempdir().unwrap();
        let manager = WorkspaceManager {
            storage_dir: dir.path().to_path_buf(),
        };

        let ws = WorkspaceData {
            id: "ws-test-1".to_string(),
            name: "Test Workspace".to_string(),
            layout: serde_json::json!({"type": "terminal"}),
            created_at: 1000,
            updated_at: 1000,
        };

        assert!(manager.save_workspace(&ws).is_ok());

        let loaded = manager.load_workspace("ws-test-1").unwrap();
        assert_eq!(loaded.name, "Test Workspace");

        let list = manager.list_workspaces().unwrap();
        assert_eq!(list.len(), 1);

        assert!(manager.delete_workspace("ws-test-1").is_ok());
        assert!(manager.load_workspace("ws-test-1").is_err());
    }
}
