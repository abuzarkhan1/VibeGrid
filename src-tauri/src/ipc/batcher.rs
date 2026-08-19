use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use parking_lot::Mutex;
use tauri::{async_runtime, AppHandle, Emitter, Runtime, Wry};
use tokio::time::{self, Duration};

const BATCH_INTERVAL_MS: u64 = 16; // ~60 FPS IPC batching (default)
const MIN_BATCH_INTERVAL_MS: u64 = 4;
const MAX_BATCH_INTERVAL_MS: u64 = 2000;
const HIGH_WATERMARK_BYTES: usize = 10 * 1024 * 1024; // 10MB backpressure high watermark
const LOW_WATERMARK_BYTES: usize = 1024 * 1024; // 1MB low watermark
// Per-pane output history kept for MCP + `pane_snapshot` (workspace isolation:
// a hidden workspace's pane is unmounted, so this is what gets repainted when
// the user switches back — 256KB ≈ a healthy scrollback of build/server logs).
const HISTORY_CAP_BYTES: usize = 256 * 1024;

/// Clamps a requested IPC batching interval to the supported range 4..=2000.
fn clamp_interval_ms(interval_ms: u64) -> u64 {
    interval_ms.clamp(MIN_BATCH_INTERVAL_MS, MAX_BATCH_INTERVAL_MS)
}

pub struct IpcBatcher<R: Runtime = Wry> {
    buffers: Arc<Mutex<HashMap<String, Vec<u8>>>>,
    backpressure_flags: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
    pub mcp_history: Arc<Mutex<HashMap<String, String>>>,
    exited_panes: Arc<Mutex<HashMap<String, bool>>>,
    interval_ms: Arc<AtomicU64>,
    app_handle: AppHandle<R>,
}

impl<R: Runtime> Clone for IpcBatcher<R> {
    fn clone(&self) -> Self {
        Self {
            buffers: self.buffers.clone(),
            backpressure_flags: self.backpressure_flags.clone(),
            mcp_history: self.mcp_history.clone(),
            exited_panes: self.exited_panes.clone(),
            interval_ms: self.interval_ms.clone(),
            app_handle: self.app_handle.clone(),
        }
    }
}

impl<R: Runtime> IpcBatcher<R> {
    pub fn new(app_handle: AppHandle<R>) -> Self {
        let batcher = Self {
            buffers: Arc::new(Mutex::new(HashMap::new())),
            backpressure_flags: Arc::new(Mutex::new(HashMap::new())),
            mcp_history: Arc::new(Mutex::new(HashMap::new())),
            exited_panes: Arc::new(Mutex::new(HashMap::new())),
            interval_ms: Arc::new(AtomicU64::new(BATCH_INTERVAL_MS)),
            app_handle,
        };

        batcher.start_flush_loop();
        batcher
    }

    /// Sets the IPC batching interval in milliseconds, clamped to the supported range,
    /// and returns the clamped value that is now in effect.
    pub fn set_interval(&self, interval_ms: u64) -> u64 {

        let clamped = clamp_interval_ms(interval_ms);
        self.interval_ms.store(clamped, Ordering::Relaxed);
        clamped
    }

    /// Gets or creates a backpressure flag for a pane
    pub fn get_backpressure_flag(&self, pane_id: &str) -> Arc<AtomicBool> {
        let mut flags = self.backpressure_flags.lock();
        flags
            .entry(pane_id.to_string())
            .or_default()
            .clone()
    }

    /// Push bytes for a specific pane into the buffer batch
    pub fn push_output(&self, pane_id: &str, data: &[u8]) {
        let flag = self.get_backpressure_flag(pane_id);
        let mut buffers = self.buffers.lock();
        let buf = buffers.entry(pane_id.to_string()).or_default();

        buf.extend_from_slice(data);

        if buf.len() > HIGH_WATERMARK_BYTES {
            flag.store(true, Ordering::Relaxed);
        }
    }

    /// Explicitly release all state and memory tracked for a killed/deleted pane.
    pub fn cleanup_pane(&self, pane_id: &str) {
        self.buffers.lock().remove(pane_id);
        self.backpressure_flags.lock().remove(pane_id);
        self.mcp_history.lock().remove(pane_id);
        self.exited_panes.lock().remove(pane_id);
    }

    /// Return the recent output history kept for a pane (last ~256 KB) and
    /// whether its process already exited. Used by the frontend when a
    /// workspace is switched back to: the pane's terminal was unmounted while
    /// hidden, so its live events (incl. terminal-exit) were dropped — this
    /// restores what the process printed while the user was elsewhere and lets
    /// the pane show its "process exited" banner immediately
    /// (workspace isolation/persistence).
    pub fn pane_snapshot(&self, pane_id: &str) -> (String, bool) {
        let output = self
            .mcp_history
            .lock()
            .get(pane_id)
            .cloned()
            .unwrap_or_default();
        let exited = self.exited_panes.lock().get(pane_id).copied().unwrap_or(false);
        (output, exited)
    }

    /// Called by the PTY reader when a pane's process exits (EOF). Emits a
    /// `terminal-exit` event to the frontend (which shows a "process exited"
    /// banner) and releases all per-pane resources — the output buffer, the
    /// backpressure flag and the MCP history entry — so long sessions with
    /// many short-lived panes never leak memory.
    pub fn pane_exited(&self, pane_id: &str) {
        {
            let mut buffers = self.buffers.lock();
            buffers.remove(pane_id);
        }
        {
            let mut flags = self.backpressure_flags.lock();
            flags.remove(pane_id);
        }
        {
            let mut history = self.mcp_history.lock();
            history.remove(pane_id);
        }
        // Remember the exit so a re-attached pane (workspace switch-back) can
        // show the "process exited" banner even though it missed the live
        // terminal-exit event while unmounted.
        self.exited_panes.lock().insert(pane_id.to_string(), true);
        let _ = self
            .app_handle
            .emit("terminal-exit", serde_json::json!({ "paneId": pane_id }));
    }

    /// Flushes collected output on a configurable interval to the frontend via a single Tauri event
    fn start_flush_loop(&self) {
        let buffers = self.buffers.clone();
        let backpressure_flags = self.backpressure_flags.clone();
        let mcp_history = self.mcp_history.clone();
        let interval_ms = self.interval_ms.clone();
        let app_handle = self.app_handle.clone();

        async_runtime::spawn(async move {
            let mut current_interval_ms = interval_ms.load(Ordering::Relaxed);
            let mut interval = time::interval(Duration::from_millis(current_interval_ms));
            loop {
                interval.tick().await;

                // Pick up live changes to the batching interval (set_batch_interval)
                let live_interval_ms = interval_ms.load(Ordering::Relaxed);
                if live_interval_ms != current_interval_ms {
                    current_interval_ms = live_interval_ms;
                    interval = time::interval(Duration::from_millis(current_interval_ms));
                }

                let batch: HashMap<String, String> = {
                    let mut guard = buffers.lock();
                    let bp_flags = backpressure_flags.lock();

                    if guard.is_empty() {
                        continue;
                    }
                    let mut map = HashMap::new();
                    for (pane_id, buf) in guard.iter_mut() {
                        if !buf.is_empty() {
                            // Find the longest valid UTF-8 sequence boundary to prevent multi-byte UTF-8 character splitting
                            let (valid_chunk, bytes_to_drain) = match std::str::from_utf8(buf) {
                                Ok(valid_str) => (Some(valid_str.to_string()), buf.len()),
                                Err(utf8_err) => {
                                    let valid_up_to = utf8_err.valid_up_to();
                                    if valid_up_to > 0 {
                                        let valid_str = std::str::from_utf8(&buf[..valid_up_to]).unwrap_or("");
                                        (Some(valid_str.to_string()), valid_up_to)
                                    } else if let Some(error_len) = utf8_err.error_len() {
                                        // Non-UTF8 byte(s) at front of buffer: replace with replacement char and drain
                                        // to prevent infinite buffer growth and terminal freeze (DoS).
                                        (Some("\u{FFFD}".to_string()), error_len)
                                    } else {
                                        // Incomplete sequence at end of buffer. If buffer exceeds max UTF-8 codepoint length (4 bytes),
                                        // force-drain 1 invalid byte so buffer never stalls forever.
                                        if buf.len() > 4 {
                                            (Some("\u{FFFD}".to_string()), 1)
                                        } else {
                                            (None, 0)
                                        }
                                    }
                                }
                            };

                            if let Some(chunk) = valid_chunk {
                                if !chunk.is_empty() {
                                    map.insert(pane_id.clone(), chunk.clone());

                                    // Track history for MCP
                                    let mut history = mcp_history.lock();
                                    let h = history.entry(pane_id.clone()).or_default();
                                    h.push_str(&chunk);
                                    let drain = crate::utils::utf8::tail_drain_count(h, HISTORY_CAP_BYTES);
                                    if drain > 0 {
                                        h.drain(..drain);
                                    }
                                }
                            }

                            if bytes_to_drain > 0 {
                                buf.drain(..bytes_to_drain);
                            }

                            // Clear backpressure flag if buffer drops below low watermark
                            if let Some(flag) = bp_flags.get(pane_id) {
                                if flag.load(Ordering::Relaxed) && buf.len() < LOW_WATERMARK_BYTES {
                                    flag.store(false, Ordering::Relaxed);
                                }
                            }
                        }
                    }
                    map
                };

                if !batch.is_empty() {
                    let _ = app_handle.emit("terminal-batch", &batch);
                }
            }
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_interval_is_16ms() {
        assert_eq!(BATCH_INTERVAL_MS, 16);
    }

    #[test]
    fn clamp_keeps_in_range_values() {
        assert_eq!(clamp_interval_ms(16), 16);
        assert_eq!(clamp_interval_ms(8), 8);
    }

    #[test]
    fn clamp_lower_bounds_to_min() {
        assert_eq!(clamp_interval_ms(0), MIN_BATCH_INTERVAL_MS);
        assert_eq!(clamp_interval_ms(1), MIN_BATCH_INTERVAL_MS);
        assert_eq!(clamp_interval_ms(4), MIN_BATCH_INTERVAL_MS);
    }

    #[test]
    fn clamp_upper_bounds_to_max() {
        assert_eq!(clamp_interval_ms(5000), MAX_BATCH_INTERVAL_MS);
        assert_eq!(clamp_interval_ms(2000), MAX_BATCH_INTERVAL_MS);
    }

    #[test]
    fn cleanup_pane_purges_all_internal_maps() {
        let app = tauri::test::mock_app();
        let batcher = IpcBatcher::new(app.handle().clone());
        let pane_id = "test-pane-1";

        batcher.push_output(pane_id, b"hello world");
        assert_eq!(batcher.buffers.lock().len(), 1);
        assert_eq!(batcher.backpressure_flags.lock().len(), 1);

        batcher.exited_panes.lock().insert(pane_id.to_string(), true);
        assert_eq!(batcher.exited_panes.lock().len(), 1);

        batcher.cleanup_pane(pane_id);
        assert_eq!(batcher.buffers.lock().len(), 0);
        assert_eq!(batcher.backpressure_flags.lock().len(), 0);
        assert_eq!(batcher.mcp_history.lock().len(), 0);
        assert_eq!(batcher.exited_panes.lock().len(), 0);
    }
}
