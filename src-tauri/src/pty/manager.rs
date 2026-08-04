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

pub struct PaneSession {
    pub id: String,
    pub master: Box<dyn MasterPty + Send>,
    pub writer: Box<dyn Write + Send>,
    pub child: Box<dyn Child + Send + Sync>,
}

#[derive(Clone)]
pub struct PtyManager {
    sessions: Arc<Mutex<HashMap<String, PaneSession>>>,
}

impl Default for PtyManager {
    fn default() -> Self {
        Self::new()
    }
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Spawns a new PTY session with default shell and returns the assigned pane_id (UUID)
    pub fn spawn_pane(
        &self,
        cols: u16,
        rows: u16,
        cwd: Option<String>,
        batcher: IpcBatcher,
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

        let shell = get_default_shell();
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
            Err(format!("Pane ID {} not found", pane_id))
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
            Err(format!("Pane ID {} not found", pane_id))
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
        let mut sessions = self.sessions.lock();
        if let Some(mut session) = sessions.remove(pane_id) {
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
            Ok(())
        } else {
            Err(format!("Pane ID {} not found", pane_id))
        }
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
        let manager = PtyManager::new();
        assert!(manager.sessions.lock().is_empty());
    }
}
