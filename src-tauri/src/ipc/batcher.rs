use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use parking_lot::Mutex;
use tauri::{async_runtime, AppHandle, Emitter};
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

#[derive(Clone)]
pub struct IpcBatcher {
    buffers: Arc<Mutex<HashMap<String, Vec<u8>>>>,
    backpressure_flags: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
    pub mcp_history: Arc<Mutex<HashMap<String, String>>>,
    exited_panes: Arc<Mutex<HashMap<String, bool>>>,
    interval_ms: Arc<AtomicU64>,
    app_handle: AppHandle,
}

impl IpcBatcher {
    pub fn new(app_handle: AppHandle) -> Self {
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
    pub fn push_output(&self, pane_id: String, data: &[u8]) {
        let flag = self.get_backpressure_flag(&pane_id);
        let mut buffers = self.buffers.lock();
        let buf = buffers.entry(pane_id).or_default();

        buf.extend_from_slice(data);

        if buf.len() > HIGH_WATERMARK_BYTES {
            flag.store(true, Ordering::Relaxed);
        }
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
                            let valid_up_to = match std::str::from_utf8(buf) {
                                Ok(valid_str) => valid_str.len(),
                                Err(utf8_err) => utf8_err.valid_up_to(),
                            };

                            if valid_up_to > 0 {
                                if let Ok(valid_str) = std::str::from_utf8(&buf[..valid_up_to]) {
                                    map.insert(pane_id.clone(), valid_str.to_string());
                                    
                                    // Track history for MCP
                                    let mut history = mcp_history.lock();
                                    let h = history.entry(pane_id.clone()).or_default();
                                    h.push_str(valid_str);
                                    if h.len() > HISTORY_CAP_BYTES {
                                        let mut keep = h.len() - HISTORY_CAP_BYTES;
                                        while keep < h.len() && !h.is_char_boundary(keep) {
                                            keep += 1;
                                        }
                                        h.drain(..keep);
                                    }
                                }

                                // Retain remaining trailing incomplete UTF-8 bytes for the next flush cycle
                                let remainder = buf[valid_up_to..].to_vec();
                                *buf = remainder;
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
}
