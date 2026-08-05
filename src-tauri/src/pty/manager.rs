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

/// Shared error message for unknown pane ids (audit: error consts — the three
/// call sites used to hand-roll the same string, risking drift).
pub const ERR_PANE_NOT_FOUND: &str = "Pane ID not found";

pub struct PaneSession {
    pub id: String,
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

    /// The batcher is created in `setup` (needs the AppHandle); stash it so
    /// `kill_pane` can release per-pane buffers/history when a session is torn
    /// down before the reader thread observes EOF (audit: memory leak fix).
    pub fn set_batcher(&self, batcher: IpcBatcher<R>) {
        *self.batcher.lock() = Some(batcher);
    }

    /// Spawns a new PTY session and returns the assigned pane_id (UUID).
    /// `shell` optionally overrides the user's default shell per-pane
    /// (audit: the dead `TerminalNode.shell` field is now wired end-to-end).
    pub fn spawn_pane(
        &self,
        cols: u16,
        rows: u16,
        cwd: Option<String>,
        shell: Option<String>,
        batcher: IpcBatcher<R>,
    ) -> Result<String, String> {
        let pane_id = Uuid::new_v4().to_string();
        let pty_system = native_pty_system();

        // Enforce safe minimum PTY dimensions (min 20 cols, min 5 rows) to prevent EOF on initial mount
        let safe_cols = std::cmp::max(20, cols);
        let safe_rows = std::cmp::max(5, rows);

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

        // Configure Environment Variables
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

        // Start background async PTY reader
        spawn_pty_reader(pane_id.clone(), reader, batcher);

        let session = PaneSession {
            id: pane_id.clone(),
            master: pair.master,
            writer,
            child,
        };

        self.sessions.lock().insert(pane_id.clone(), session);

        Ok(pane_id)
    }

    /// Write input string/bytes to a specific PTY pane
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

    /// Resize terminal pane PTY
    pub fn resize_pane(&self, pane_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let sessions = self.sessions.lock();
        if let Some(session) = sessions.get(pane_id) {
            let safe_cols = std::cmp::max(20, cols);
            let safe_rows = std::cmp::max(5, rows);

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

    /// Terminate and remove a PTY pane session gracefully (FR-004).
    ///
    /// Audit find 10: portable-pty's `Child::kill()` sends SIGHUP to the shell
    /// process only — jobs it spawned can survive (and keep the PTY master
    /// open). Where the shell is its own process-group leader we signal the
    /// whole group; we then wait briefly for the shell to exit and force-kill
    /// it (SIGKILL) if it lingers, so closing a pane actually stops the process
    /// tree in the common case.
    pub fn kill_pane(&self, pane_id: &str) -> Result<(), String> {
        // Remove the session and DROP the sessions lock before signalling and
        // waiting for the child to exit (audit: the lock used to be held for the
        // whole up-to-500ms reap, stalling every other pane's write/resize/spawn
        // while one pane was closed). The temporary guard is dropped at the end
        // of this statement.
        let Some(mut session) = self.sessions.lock().remove(pane_id) else {
            return Err(format!("{ERR_PANE_NOT_FOUND}: {pane_id}"));
        };
        {
            // Release the pane's buffers/history immediately (audit: memory
            // leak fix) — the reader thread may be blocked or already gone.
            if let Some(batcher) = self.batcher.lock().as_ref() {
                batcher.pane_exited(pane_id);
            }
            #[cfg(unix)]
            {
                if let Some(pid) = session.child.process_id() {
                    let pid_i = pid as i32;
                    // Only signal the group if the shell really is its leader —
                    // killpg on a foreign group would be catastrophic. (Accepted
                    // risk: a theoretical pid-reuse window between getpgid and
                    // kill — microseconds, negligible for a local terminal app.)
                    if unsafe { libc::getpgid(pid_i) } == pid_i {
                        let _ = unsafe { libc::kill(-pid_i, libc::SIGHUP) };
                    }
                }
            }
            let _ = session.child.kill(); // SIGHUP on unix, TerminateProcess on windows

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
                            // SIGHUP was ignored — force kill.
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

    /// Terminate all PTY sessions on application exit (NFR-012)
    pub fn kill_all_panes(&self) {
        let mut sessions = self.sessions.lock();
        for (_, mut session) in sessions.drain() {
            let _ = session.child.kill();
        }
    }
}

/// Helper function to detect the user's default system shell
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
        // Explicit type so the default runtime (Wry) is selected.
        let manager: PtyManager = PtyManager::new();
        assert!(manager.sessions.lock().is_empty());
    }

    /// End-to-end PTY lifecycle (audit: the core spawn → write → read → kill
    /// path had zero coverage). Uses tauri's mock app so IpcBatcher can be
    /// constructed without a running desktop app; the reader thread drives
    /// real output through the batcher just like production.
    ///
    /// Unix-only: the marker command (`printf`) is POSIX, and the
    /// process-group kill path under test is `#[cfg(unix)]` anyway.
    #[test]
    #[cfg(unix)]
    fn test_pty_lifecycle_spawn_write_read_kill() {
        let app = tauri::test::mock_builder()
            .build(tauri::test::mock_context(tauri::test::noop_assets()))
            .expect("mock app builds");
        let batcher: IpcBatcher<tauri::test::MockRuntime> = IpcBatcher::new(app.handle().clone());
        let manager: PtyManager<tauri::test::MockRuntime> = PtyManager::new();
        // Wire the batcher in so kill_pane's per-pane buffer/history release
        // (the audit memory-leak fix) is actually exercised by this test.
        manager.set_batcher(batcher.clone());

        // 1. Spawn a real shell.
        let pane_id = manager
            .spawn_pane(80, 24, None, None, batcher.clone())
            .expect("spawn_pane should succeed");
        assert!(
            manager.sessions.lock().contains_key(&pane_id),
            "session should exist after spawn"
        );

        // 2. Write a command that echoes a unique marker, then read it back.
        let marker = format!("VG_PTY_TEST_{}", Uuid::new_v4().simple());
        let cmd = format!("printf '{}'; printf '\\r\\n'; exit\n", marker);
        manager
            .write_to_pane(&pane_id, &cmd)
            .expect("write_to_pane should succeed");

        // The reader thread pushes output into the batcher's mcp_history;
        // poll it (with a generous timeout) until the marker shows up.
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

        // 3. Kill the pane; the session must be removed, the child reaped, and
        //    the batcher must release the pane's output history (audit: memory
        //    leak fix — long sessions with many short-lived panes leaked).
        manager.kill_pane(&pane_id).expect("kill_pane should succeed");
        assert!(
            !manager.sessions.lock().contains_key(&pane_id),
            "session should be removed after kill"
        );
        assert!(
            !batcher.mcp_history.lock().contains_key(&pane_id),
            "batcher should release the pane's output history after kill"
        );

        // Killing an already-removed pane reports ERR_PANE_NOT_FOUND.
        let err = manager.kill_pane(&pane_id).unwrap_err();
        assert!(
            err.contains(ERR_PANE_NOT_FOUND),
            "double-kill should report pane not found, got: {err}"
        );
    }
}
