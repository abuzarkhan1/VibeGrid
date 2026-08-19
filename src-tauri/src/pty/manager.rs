use std::collections::HashMap;
use std::io::Write;
use std::sync::Arc;
use std::env;
use std::thread;
use std::time::Duration;
use parking_lot::Mutex;
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize, Child};
use uuid::Uuid;

#[cfg(unix)]
use libc;

use crate::ipc::IpcBatcher;
use crate::pty::reader::spawn_pty_reader;
use tauri::Runtime;

pub const ERR_PANE_NOT_FOUND: &str = "Pane ID not found";

pub const MIN_PTY_COLS: u16 = 20;
pub const MIN_PTY_ROWS: u16 = 5;

pub struct PaneSession {
    pub master: Box<dyn MasterPty + Send>,
    pub writer: Box<dyn Write + Send>,
    pub child: Box<dyn Child + Send + Sync>,
}

pub struct PtyManager<R: Runtime = tauri::Wry> {
    sessions: Arc<Mutex<HashMap<String, PaneSession>>>,
    batcher: Arc<parking_lot::Mutex<Option<IpcBatcher<R>>>>,
}

impl<R: Runtime> Clone for PtyManager<R> {
    fn clone(&self) -> Self {
        Self {
            sessions: self.sessions.clone(),
            batcher: self.batcher.clone(),
        }
    }
}

impl Default for PtyManager {
    fn default() -> Self {
        Self::new()
    }
}

impl<R: Runtime> PtyManager<R> {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            batcher: Arc::new(parking_lot::Mutex::new(None)),
        }
    }

    pub fn set_batcher(&self, batcher: IpcBatcher<R>) {
        *self.batcher.lock() = Some(batcher);
    }

    #[allow(clippy::too_many_arguments)]
    pub fn spawn_pane(
        &self,
        cols: u16,
        rows: u16,
        cwd: Option<String>,
        shell: Option<String>,
        shell_args: Option<Vec<String>>,
        shell_env: Option<HashMap<String, String>>,
        batcher: IpcBatcher<R>,
    ) -> Result<String, String> {
        let pane_id = Uuid::new_v4().to_string();
        let pty_system = native_pty_system();

        let safe_cols = std::cmp::max(MIN_PTY_COLS, cols);
        let safe_rows = std::cmp::max(MIN_PTY_ROWS, rows);

        let size = PtySize {
            rows: safe_rows,
            cols: safe_cols,
            pixel_width: 0,
            pixel_height: 0,
        };

        let pair = pty_system
            .openpty(size)
            .map_err(|e| format!("Failed to open PTY: {}", e))?;

        let shell = shell.unwrap_or_else(get_default_shell);
        let mut cmd = CommandBuilder::new(&shell);

        if let Some(args) = shell_args {
            for arg in args {
                cmd.arg(arg);
            }
        }
        if let Some(env) = shell_env {
            for (key, value) in env {
                cmd.env(key, value);
            }
        }

        cmd.env("TERM", "xterm-256color");
        cmd.env("COLORTERM", "truecolor");
        cmd.env("LANG", "en_US.UTF-8");
        cmd.env("VIBEGRID", "1");

        if let Some(dir) = cwd {
            if !dir.is_empty() {
                cmd.cwd(dir);
            }
        }

        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| format!("Failed to spawn shell process ({}): {}", shell, e))?;

        let reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| format!("Failed to clone PTY reader: {}", e))?;

        let writer = pair
            .master
            .take_writer()
            .map_err(|e| format!("Failed to take PTY writer: {}", e))?;

        let session = PaneSession {
            master: pair.master,
            writer,
            child,
        };

        self.sessions.lock().insert(pane_id.clone(), session);

        spawn_pty_reader(pane_id.clone(), reader, batcher, self.clone());

        Ok(pane_id)
    }

    pub fn write_to_pane(&self, pane_id: &str, data: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock();
        if let Some(session) = sessions.get_mut(pane_id) {
            session
                .writer
                .write_all(data.as_bytes())
                .map_err(|e| format!("Failed to write to PTY: {}", e))?;
            session
                .writer
                .flush()
                .map_err(|e| format!("Failed to flush PTY writer: {}", e))?;
            Ok(())
        } else {
            Err(format!("{ERR_PANE_NOT_FOUND}: {pane_id}"))
        }
    }

    pub fn resize_pane(&self, pane_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let sessions = self.sessions.lock();
        if let Some(session) = sessions.get(pane_id) {
            let safe_cols = std::cmp::max(MIN_PTY_COLS, cols);
            let safe_rows = std::cmp::max(MIN_PTY_ROWS, rows);

            let size = PtySize {
                rows: safe_rows,
                cols: safe_cols,
                pixel_width: 0,
                pixel_height: 0,
            };
            session
                .master
                .resize(size)
                .map_err(|e| format!("Failed to resize PTY: {}", e))?;
            Ok(())
        } else {
            Err(format!("{ERR_PANE_NOT_FOUND}: {pane_id}"))
        }
    }

    pub fn remove_session(&self, pane_id: &str) {

        let session = self.sessions.lock().remove(pane_id);
        drop(session);
    }

    pub fn kill_pane(&self, pane_id: &str) -> Result<(), String> {

        let Some(mut session) = self.sessions.lock().remove(pane_id) else {
            return Err(format!("{ERR_PANE_NOT_FOUND}: {pane_id}"));
        };
        {

            if let Some(batcher) = self.batcher.lock().as_ref() {
                batcher.cleanup_pane(pane_id);
            }
            #[cfg(unix)]
            {
                if let Some(pid) = session.child.process_id() {
                    let pid_i = pid as i32;

                    if unsafe { libc::getpgid(pid_i) } == pid_i {
                        let _ = unsafe { libc::kill(-pid_i, libc::SIGHUP) };
                    }
                }
            }
            let _ = session.child.kill();

            #[cfg(unix)]
            {
                let deadline = std::time::Instant::now() + Duration::from_millis(500);
                loop {
                    match session.child.try_wait() {
                        Ok(Some(_)) => break,
                        Ok(None) if std::time::Instant::now() < deadline => {
                            thread::sleep(Duration::from_millis(20));
                        }
                        Ok(None) => {

                            if let Some(pid) = session.child.process_id() {
                                let _ = unsafe { libc::kill(pid as i32, libc::SIGKILL) };
                            }
                            break;
                        }
                        Err(_) => break,
                    }
                }
            }
            #[cfg(not(unix))]
            {
                thread::sleep(Duration::from_millis(50));
            }
        }
        Ok(())
    }

    pub fn kill_all_panes(&self) {
        let mut sessions = self.sessions.lock();
        let batcher_guard = self.batcher.lock();
        for (pane_id, mut session) in sessions.drain() {
            let _ = session.child.kill();
            if let Some(batcher) = batcher_guard.as_ref() {
                batcher.cleanup_pane(&pane_id);
            }
        }
    }
}

fn get_default_shell() -> String {
    if cfg!(target_os = "windows") {
        env::var("COMSPEC").unwrap_or_else(|_| "powershell.exe".to_string())
    } else {
        env::var("SHELL").unwrap_or_else(|_| {
            if cfg!(target_os = "macos") {
                "/bin/zsh".to_string()
            } else {
                "/bin/bash".to_string()
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_shell_detection() {
        let shell = get_default_shell();
        assert!(!shell.is_empty());
    }

    #[test]
    fn test_pty_manager_creation() {

        let manager: PtyManager = PtyManager::new();
        assert!(manager.sessions.lock().is_empty());
    }

    #[test]
    #[cfg(unix)]
    fn test_pty_lifecycle_spawn_write_read_kill() {
        let app = tauri::test::mock_builder()
            .build(tauri::test::mock_context(tauri::test::noop_assets()))
            .expect("mock app builds");
        let batcher: IpcBatcher<tauri::test::MockRuntime> = IpcBatcher::new(app.handle().clone());
        let manager: PtyManager<tauri::test::MockRuntime> = PtyManager::new();

        manager.set_batcher(batcher.clone());

        let pane_id = manager
            .spawn_pane(80, 24, None, None, None, None, batcher.clone())
            .expect("spawn_pane should succeed");
        assert!(
            manager.sessions.lock().contains_key(&pane_id),
            "session should exist after spawn"
        );

        let marker = format!("VG_PTY_TEST_{}", Uuid::new_v4().simple());
        let cmd = format!("printf '{}'; printf '\\r\\n'; sleep 30\n", marker);
        manager
            .write_to_pane(&pane_id, &cmd)
            .expect("write_to_pane should succeed");

        let deadline = std::time::Instant::now() + Duration::from_secs(10);
        let mut seen = String::new();
        while std::time::Instant::now() < deadline {
            seen = batcher
                .mcp_history
                .lock()
                .get(&pane_id)
                .cloned()
                .unwrap_or_default();
            if seen.contains(&marker) {
                break;
            }
            thread::sleep(Duration::from_millis(25));
        }
        assert!(
            seen.contains(&marker),
            "expected marker in pane output; got: {seen:?}"
        );

        manager.kill_pane(&pane_id).expect("kill_pane should succeed");
        assert!(
            !manager.sessions.lock().contains_key(&pane_id),
            "session should be removed after kill"
        );
        assert!(
            !batcher.mcp_history.lock().contains_key(&pane_id),
            "batcher should release the pane's output history after kill"
        );

        let err = manager.kill_pane(&pane_id).unwrap_err();
        assert!(
            err.contains(ERR_PANE_NOT_FOUND),
            "double-kill should report pane not found, got: {err}"
        );
    }

    #[test]
    #[cfg(unix)]
    fn test_spawn_applies_shell_args_and_env() {
        let app = tauri::test::mock_builder()
            .build(tauri::test::mock_context(tauri::test::noop_assets()))
            .expect("mock app builds");
        let batcher: IpcBatcher<tauri::test::MockRuntime> = IpcBatcher::new(app.handle().clone());
        let manager: PtyManager<tauri::test::MockRuntime> = PtyManager::new();
        manager.set_batcher(batcher.clone());

        let marker = format!("VG_ENV_{}", Uuid::new_v4().simple());
        let mut env = HashMap::new();
        env.insert("VG_TEST_MARKER".to_string(), marker.clone());

        let pane_id = manager
            .spawn_pane(
                80,
                24,
                None,
                Some("/bin/sh".to_string()),
                Some(vec![
                    "-c".to_string(),
                    format!("printf '%s' \"$VG_TEST_MARKER\"; sleep 30"),
                ]),
                Some(env),
                batcher.clone(),
            )
            .expect("spawn_pane should succeed");

        let deadline = std::time::Instant::now() + Duration::from_secs(10);
        let mut seen = String::new();
        while std::time::Instant::now() < deadline {
            seen = batcher
                .mcp_history
                .lock()
                .get(&pane_id)
                .cloned()
                .unwrap_or_default();
            if seen.contains(&marker) {
                break;
            }
            thread::sleep(Duration::from_millis(25));
        }
        assert!(seen.contains(&marker), "env/args not applied; got: {seen:?}");

        manager.kill_pane(&pane_id).ok();
    }
}
