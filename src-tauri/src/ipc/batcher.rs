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

/// Clamps a requested IPC batching interval to the supported range 4..=2000.
fn clamp_interval_ms(interval_ms: u64) -> u64 {
    interval_ms.clamp(MIN_BATCH_INTERVAL_MS, MAX_BATCH_INTERVAL_MS)
}

#[derive(Clone)]
pub struct IpcBatcher {
    buffers: Arc<Mutex<HashMap<String, Vec<u8>>>>,
    backpressure_flags: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
    pub mcp_history: Arc<Mutex<HashMap<String, String>>>,
    interval_ms: Arc<AtomicU64>,
    app_handle: AppHandle,
}

impl IpcBatcher {
    pub fn new(app_handle: AppHandle) -> Self {
        let batcher = Self {
            buffers: Arc::new(Mutex::new(HashMap::new())),
            backpressure_flags: Arc::new(Mutex::new(HashMap::new())),
            mcp_history: Arc::new(Mutex::new(HashMap::new())),
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
        self.interval_ms.store(clamped, Ordering::SeqCst);
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
            flag.store(true, Ordering::SeqCst);
        }
    }

    /// Flushes collected output on a configurable interval to the frontend via a single Tauri event
    fn start_flush_loop(&self) {
        let buffers = self.buffers.clone();
        let backpressure_flags = self.backpressure_flags.clone();
        let mcp_history = self.mcp_history.clone();
        let interval_ms = self.interval_ms.clone();
        let app_handle = self.app_handle.clone();

        async_runtime::spawn(async move {
            let mut current_interval_ms = interval_ms.load(Ordering::SeqCst);
            let mut interval = time::interval(Duration::from_millis(current_interval_ms));
            loop {
                interval.tick().await;

                // Pick up live changes to the batching interval (set_batch_interval)
                let live_interval_ms = interval_ms.load(Ordering::SeqCst);
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
                                    let h = history.entry(pane_id.clone()).or_insert_with(String::new);
                                    h.push_str(valid_str);
                                    if h.len() > 16384 {
                                        let mut keep = h.len() - 16384;
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
                                if flag.load(Ordering::SeqCst) && buf.len() < LOW_WATERMARK_BYTES {
                                    flag.store(false, Ordering::SeqCst);
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
