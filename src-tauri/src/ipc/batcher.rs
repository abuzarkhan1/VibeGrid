use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use parking_lot::Mutex;
use tauri::{async_runtime, AppHandle, Emitter};
use tokio::time::{self, Duration};

const BATCH_INTERVAL_MS: u64 = 16; // ~60 FPS IPC batching
const HIGH_WATERMARK_BYTES: usize = 10 * 1024 * 1024; // 10MB backpressure high watermark
const LOW_WATERMARK_BYTES: usize = 1024 * 1024; // 1MB low watermark

#[derive(Clone)]
pub struct IpcBatcher {
    buffers: Arc<Mutex<HashMap<String, Vec<u8>>>>,
    backpressure_flags: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
    app_handle: AppHandle,
}

impl IpcBatcher {
    pub fn new(app_handle: AppHandle) -> Self {
        let batcher = Self {
            buffers: Arc::new(Mutex::new(HashMap::new())),
            backpressure_flags: Arc::new(Mutex::new(HashMap::new())),
            app_handle,
        };

        batcher.start_flush_loop();
        batcher
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

    /// Flushes collected output every 16ms to the frontend via a single Tauri event
    fn start_flush_loop(&self) {
        let buffers = self.buffers.clone();
        let backpressure_flags = self.backpressure_flags.clone();
        let app_handle = self.app_handle.clone();

        async_runtime::spawn(async move {
            let mut interval = time::interval(Duration::from_millis(BATCH_INTERVAL_MS));
            loop {
                interval.tick().await;

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
