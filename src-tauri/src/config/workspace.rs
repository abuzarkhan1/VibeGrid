use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};

const WORKSPACE_SCHEMA_VERSION: u32 = 1;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct WorkspaceData {
    pub id: String,
    pub name: String,
    pub layout: serde_json::Value,
    pub created_at: u64,
    pub updated_at: u64,

    pub version: u32,

    pub overrides: Option<serde_json::Value>,

    pub emoji: Option<String>,

    pub archived: Option<bool>,
}

impl Default for WorkspaceData {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            layout: serde_json::Value::Null,
            created_at: 0,
            updated_at: 0,
            version: WORKSPACE_SCHEMA_VERSION,
            overrides: None,
            emoji: None,
            archived: None,
        }
    }
}

impl WorkspaceData {

    pub fn migrate(&mut self) {
        if self.version < WORKSPACE_SCHEMA_VERSION {

            self.version = WORKSPACE_SCHEMA_VERSION;
        }
    }
}

fn is_safe_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 128
        && id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

#[derive(Clone)]
pub struct WorkspaceManager {
    storage_dir: PathBuf,

    write_lock: Arc<Mutex<()>>,

    temp_counter: Arc<AtomicU64>,
}

impl Default for WorkspaceManager {
    fn default() -> Self {
        Self::new()
    }
}

impl WorkspaceManager {
    pub fn new() -> Self {
        let storage_dir = crate::utils::paths::get_workspaces_dir();

        if !storage_dir.exists() {
            let _ = fs::create_dir_all(&storage_dir);
        }

        Self::with_storage_dir(storage_dir)
    }

    pub fn with_storage_dir(storage_dir: PathBuf) -> Self {
        Self {
            storage_dir,
            write_lock: Arc::new(Mutex::new(())),
            temp_counter: Arc::new(AtomicU64::new(0)),
        }
    }

    pub fn save_workspace(&self, workspace: &WorkspaceData) -> Result<(), String> {
        if !is_safe_id(&workspace.id) {
            return Err(format!("Refusing to save workspace with unsafe id: {:?}", workspace.id));
        }
        let _guard = self.write_lock.lock();

        let file_path = self.storage_dir.join(format!("{}.json", workspace.id));
        let unique = self.temp_counter.fetch_add(1, Ordering::Relaxed);
        let temp_path = self.storage_dir.join(format!("{}.tmp.{}", workspace.id, unique));

        let json_data = serde_json::to_string_pretty(workspace)
            .map_err(|e| format!("Failed to serialize workspace: {}", e))?;

        let mut temp_file = File::create(&temp_path)
            .map_err(|e| format!("Failed to create temp file: {}", e))?;

        temp_file
            .write_all(json_data.as_bytes())
            .map_err(|e| format!("Failed to write workspace data: {}", e))?;

        temp_file
            .flush()
            .map_err(|e| format!("Failed to flush temp file: {}", e))?;
        temp_file
            .sync_all()
            .map_err(|e| format!("Failed to sync temp file: {}", e))?;
        drop(temp_file);

        fs::rename(&temp_path, &file_path)
            .map_err(|e| format!("Failed to rename temp workspace file: {}", e))?;

        Ok(())
    }

    pub fn load_workspace(&self, id: &str) -> Result<WorkspaceData, String> {
        if !is_safe_id(id) {
            return Err(format!("Refusing to load workspace with unsafe id: {:?}", id));
        }
        let file_path = self.storage_dir.join(format!("{}.json", id));
        if !file_path.exists() {
            return Err(format!("Workspace {} not found", id));
        }

        let content = fs::read_to_string(&file_path)
            .map_err(|e| format!("Failed to read workspace file: {}", e))?;

        let mut workspace: WorkspaceData = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse workspace JSON: {}", e))?;

        workspace.migrate();

        Ok(workspace)
    }

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
                    if let Ok(mut ws) = serde_json::from_str::<WorkspaceData>(&content) {

                        ws.migrate();
                        result.push(ws);
                    }
                }
            }
        }

        result.sort_by_key(|b| std::cmp::Reverse(b.updated_at));
        Ok(result)
    }

    pub fn delete_workspace(&self, id: &str) -> Result<(), String> {
        if !is_safe_id(id) {
            return Err(format!("Refusing to delete workspace with unsafe id: {:?}", id));
        }
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
        let manager = WorkspaceManager::with_storage_dir(dir.path().to_path_buf());

        let ws = WorkspaceData {
            id: "ws-test-1".to_string(),
            name: "Test Workspace".to_string(),
            layout: serde_json::json!({"type": "terminal"}),
            created_at: 1000,
            updated_at: 1000,
            version: 1,
            overrides: Some(serde_json::json!({"themeName": "nord"})),
            emoji: Some("🚀".to_string()),
            archived: Some(false),
        };

        assert!(manager.save_workspace(&ws).is_ok());

        let loaded = manager.load_workspace("ws-test-1").unwrap();
        assert_eq!(loaded.name, "Test Workspace");
        assert_eq!(loaded.version, 1);

        let list = manager.list_workspaces().unwrap();
        assert_eq!(list.len(), 1);

        assert!(manager.delete_workspace("ws-test-1").is_ok());
        assert!(manager.load_workspace("ws-test-1").is_err());
    }

    #[test]
    fn test_concurrent_saves_never_clobber_each_other() {
        let dir = tempdir().unwrap();
        let manager = WorkspaceManager::with_storage_dir(dir.path().to_path_buf());

        let manager = std::sync::Arc::new(manager);
        let handles: Vec<_> = (0..32)
            .map(|i| {
                let manager = std::sync::Arc::clone(&manager);
                std::thread::spawn(move || {
                    let ws = WorkspaceData {
                        id: "ws-race".to_string(),
                        name: format!("Race {i}"),
                        layout: serde_json::json!({ "type": "terminal", "id": format!("term-{i}") }),
                        created_at: 0,
                        updated_at: i as u64,
                        version: 1,
                        overrides: None,
                        emoji: None,
                        archived: None,
                    };
                    manager.save_workspace(&ws).unwrap();
                })
            })
            .collect();
        for h in handles {
            h.join().unwrap();
        }

        let leftovers: Vec<_> = fs::read_dir(dir.path())
            .unwrap()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_name().to_string_lossy().contains(".tmp."))
            .collect();
        assert!(leftovers.is_empty(), "temp files left behind: {:?}", leftovers.len());

        let loaded = manager.load_workspace("ws-race").unwrap();
        assert!(loaded.name.starts_with("Race "));
        assert!(loaded.layout.is_object());
    }

    #[test]
    fn test_rejects_unsafe_ids() {

        let dir = tempdir().unwrap();
        let manager = WorkspaceManager::with_storage_dir(dir.path().to_path_buf());

        for bad in ["../escape", "a/b", "a\\b", "a b", "a:0", ""] {
            let ws = WorkspaceData {
                id: bad.to_string(),
                name: "x".to_string(),
                layout: serde_json::json!({}),
                created_at: 0,
                updated_at: 0,
                version: 1,
                overrides: None,
                emoji: None,
                archived: None,
            };
            assert!(manager.save_workspace(&ws).is_err(), "save should refuse {bad:?}");
            assert!(manager.load_workspace(bad).is_err(), "load should refuse {bad:?}");
            assert!(manager.delete_workspace(bad).is_err(), "delete should refuse {bad:?}");
        }

        let ok = WorkspaceData {
            id: "ws-1720000000000".to_string(),
            name: "x".to_string(),
            layout: serde_json::json!({}),
            created_at: 0,
            updated_at: 0,
            version: 1,
            overrides: None,
            emoji: None,
            archived: None,
        };
        assert!(manager.save_workspace(&ok).is_ok());
    }

    #[test]
    fn test_save_leaves_no_temp_files() {
        let dir = tempdir().unwrap();
        let manager = WorkspaceManager::with_storage_dir(dir.path().to_path_buf());

        let ws = WorkspaceData {
            id: "ws-clean".to_string(),
            name: "Clean".to_string(),
            layout: serde_json::json!({ "type": "terminal" }),
            created_at: 0,
            updated_at: 0,
            version: 1,
            overrides: None,
            emoji: None,
            archived: None,
        };
        manager.save_workspace(&ws).unwrap();

        let files: Vec<String> = fs::read_dir(dir.path())
            .unwrap()
            .filter_map(|e| e.ok())
            .map(|e| e.file_name().to_string_lossy().to_string())
            .filter(|n| n.ends_with(".json"))
            .collect();
        assert_eq!(files, vec!["ws-clean.json"]);
    }
}
