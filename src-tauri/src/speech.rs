//! Native Whisper-based voice-to-terminal.
//!
//! Replaces the Web Speech API (which WKWebView does not provide and which
//! crashed the webview when getUserMedia was used). Audio is captured with
//! `cpal` on a background thread, resampled to 16 kHz mono f32, and
//! transcribed locally with `whisper-rs` (whisper.cpp). The model is
//! auto-downloaded on first use into the app data dir.

use std::path::PathBuf;
use std::sync::atomic::{AtomicU32, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use parking_lot::Mutex;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use tauri::{AppHandle, Emitter, Manager};
use whisper_rs::{
    FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters, WhisperState,
};

/// Model used for transcription (English, ~142 MB, good accuracy/speed balance).
/// Override with `VIBEGRID_WHISPER_MODEL` env var (e.g. ggml-tiny.en.bin).
pub const MODEL_FILE: &str = "ggml-base.en.bin";

/// Whisper expects 16 kHz mono f32 PCM.
pub const TARGET_SAMPLE_RATE: u32 = 16_000;

/// Soft safety cap on recording length (seconds). Keeps an abandoned recording
/// from growing memory indefinitely — audio past this point is truncated.
const MAX_RECORD_SECS: u64 = 60;

/// Scaled (x8, clamped 0..1) level above which we treat input as speech —
/// matches the `current_level()` scaling used by the UI waveform. Roughly
/// corresponds to a raw RMS of ~0.015 (≈ -37 dBFS).
const LEVEL_VOICE_THRESHOLD: f32 = 0.12;

/// Default continuous silence (after at least one voiced segment) before
/// dictation auto-stops and transcribes. Configurable at runtime via
/// `voice_set_silence_timeout` (gap 10); the default matches the frontend
/// settings value (1600 ms).
const SILENCE_TIMEOUT_DEFAULT_MS: u64 = 1600;

/// If the user never speaks within this window, stop quietly so the mic is
/// not left open indefinitely.
const NO_SPEECH_TIMEOUT: Duration = Duration::from_secs(15);

/// Minimum per-window RMS (0..1) that counts as "speech" when trimming
/// boundary silence. ~ -45 dBFS: cuts mic hiss / room tone without touching
/// quiet words.
///
/// NOTE: this is deliberately MORE lenient than the auto-stop watcher's voice
/// gate (LEVEL_VOICE_THRESHOLD = 0.12 scaled ≈ 0.015 raw RMS). Trimming must
/// preserve every syllable Whisper might transcribe, while auto-stop only needs
/// to notice the loud parts. Don't "align" them — trimming too aggressively
/// clips quiet speech.
const TRIM_RMS_THRESHOLD: f32 = 0.004;

/// Padding (seconds) kept around detected speech so word onsets/offsets are
/// never clipped by the trim.
const TRIM_PAD_SECS: f32 = 0.15;

/// Lock-free live audio level shared between the cpal callback thread (writer)
/// and the auto-stop watcher thread (reader). Atomics keep the real-time audio
/// thread from ever blocking on a mutex.
pub struct AudioMeter {
    rms: AtomicU32,
}

impl AudioMeter {
    fn new() -> Self {
        Self {
            rms: AtomicU32::new(0f32.to_bits()),
        }
    }

    fn set_rms(&self, rms: f32) {
        self.rms.store(rms.to_bits(), Ordering::Relaxed);
    }

    pub fn rms(&self) -> f32 {
        f32::from_bits(self.rms.load(Ordering::Relaxed))
    }
}

struct ActiveRecording {
    /// Keeping the stream alive keeps capture running.
    _stream: cpal::Stream,
    /// Mono f32 samples captured at the device sample rate.
    samples: Arc<Mutex<Vec<f32>>>,
    sample_rate: u32,
    /// Live RMS level for the waveform + auto-stop watcher.
    meter: Arc<AudioMeter>,
}

/// Managed speech state shared with Tauri commands.
pub struct SpeechManager {
    recorder: Mutex<Option<ActiveRecording>>,
    whisper: Mutex<Option<WhisperContext>>,
    /// Auto-stop silence timeout in ms (gap 10) — read by the watcher thread.
    silence_timeout_ms: AtomicU64,
    /// Preferred input device name ('' = system default) (gap 14).
    preferred_input: Mutex<Option<String>>,
}

impl Default for SpeechManager {
    fn default() -> Self {
        Self::new()
    }
}

impl SpeechManager {
    pub fn new() -> Self {
        Self {
            recorder: Mutex::new(None),
            whisper: Mutex::new(None),
            silence_timeout_ms: AtomicU64::new(SILENCE_TIMEOUT_DEFAULT_MS),
            preferred_input: Mutex::new(None),
        }
    }

    pub fn is_recording(&self) -> bool {
        self.recorder.lock().is_some()
    }

    /// Set the auto-stop silence timeout (ms), clamped to [600, 5000] — the
    /// same range the Settings slider offers (audit find 9: Rust used to allow
    /// [400, 10000], values the UI could never produce).
    pub fn set_silence_timeout_ms(&self, ms: u64) -> u64 {
        let clamped = ms.clamp(600, 5_000);
        self.silence_timeout_ms.store(clamped, Ordering::Relaxed);
        clamped
    }

    pub fn silence_timeout_ms(&self) -> u64 {
        self.silence_timeout_ms.load(Ordering::Relaxed)
    }

    /// Prefer a specific input device by name ('' = system default).
    pub fn set_input_device(&self, name: String) {
        *self.preferred_input.lock() = if name.is_empty() {
            None
        } else {
            Some(name)
        };
    }

    /// Enumerate available input (microphone) device names for the Settings UI.
    pub fn list_input_devices() -> Vec<String> {
        let host = cpal::default_host();
        match host.input_devices() {
            // cpal 0.18 exposes the device name via Display (DeviceTrait::name was
            // replaced by `description()` / `to_string()`).
            Ok(devices) => devices
                .map(|d| d.to_string())
                .filter(|n| !n.is_empty())
                .collect(),
            Err(_) => Vec::new(),
        }
    }

    /// Resolve the input device to use: the preferred one if still present,
    /// otherwise the system default.
    fn resolve_input_device(&self) -> Result<cpal::Device, String> {
        let host = cpal::default_host();
        let preferred = self.preferred_input.lock().clone();
        if let Some(name) = preferred {
            if let Ok(devices) = host.input_devices() {
                for device in devices {
                    if device.to_string() == name {
                        return Ok(device);
                    }
                }
            }
            // Preferred device vanished — fall back to default silently.
            eprintln!("[VibeGrid] Preferred mic '{name}' not found; using default.");
        }
        host.default_input_device()
            .ok_or_else(|| "No microphone input device found. Connect a microphone or grant microphone access in System Settings → Privacy & Security → Microphone.".to_string())
    }

    /// Resolve the model file path inside the app data dir.
    pub fn model_path(app: &AppHandle) -> Result<PathBuf, String> {
        let dir = app
            .path()
            .app_data_dir()
            .map_err(|e| format!("Could not resolve app data dir: {e}"))?
            .join("models");
        Ok(dir.join(MODEL_FILE))
    }

    /// True when the model file already exists on disk.
    pub fn model_ready(app: &AppHandle) -> bool {
        Self::model_path(app).map(|p| p.exists()).unwrap_or(false)
    }

    /// Start capturing microphone audio into a buffer.
    pub fn start_recording(&self) -> Result<(), String> {
        if self.is_recording() {
            return Err("Already recording".into());
        }

        let device = self.resolve_input_device()?;
        let config = device
            .default_input_config()
            .map_err(|e| format!("Failed to get the microphone input config: {e}"))?;

        let sample_rate = config.sample_rate();
        let channels = config.channels() as usize;
        let stream_config: cpal::StreamConfig = config.config();
        let samples: Arc<Mutex<Vec<f32>>> = Arc::new(Mutex::new(Vec::new()));
        let meter = Arc::new(AudioMeter::new());
        let err_fn = |e| eprintln!("[VibeGrid] audio stream error: {e}");

        let build = |format: cpal::SampleFormat| -> Result<cpal::Stream, String> {
            match format {
                cpal::SampleFormat::F32 => Self::build_input::<f32>(
                    &device,
                    &stream_config,
                    samples.clone(),
                    meter.clone(),
                    channels,
                    err_fn,
                ),
                cpal::SampleFormat::I16 => Self::build_input::<i16>(
                    &device,
                    &stream_config,
                    samples.clone(),
                    meter.clone(),
                    channels,
                    err_fn,
                ),
                cpal::SampleFormat::U16 => Self::build_input::<u16>(
                    &device,
                    &stream_config,
                    samples.clone(),
                    meter.clone(),
                    channels,
                    err_fn,
                ),
                other => Err(format!("Unsupported audio sample format: {other:?}")),
            }
        };

        let stream = build(config.sample_format())?;
        stream
            .play()
            .map_err(|e| format!("Failed to start microphone: {e}"))?;

        *self.recorder.lock() = Some(ActiveRecording {
            _stream: stream,
            samples,
            sample_rate,
            meter,
        });
        Ok(())
    }

    fn build_input<T>(
        device: &cpal::Device,
        config: &cpal::StreamConfig,
        samples: Arc<Mutex<Vec<f32>>>,
        meter: Arc<AudioMeter>,
        channels: usize,
        err_fn: impl FnMut(cpal::Error) + Send + 'static,
    ) -> Result<cpal::Stream, String>
    where
        T: cpal::SizedSample + cpal::Sample<Float = f32>,
    {
        let data_fn = move |data: &[T], _: &cpal::InputCallbackInfo| {
            let mut buf = samples.lock();
            // Downmix to mono by averaging frames across channels, tracking the
            // live RMS for the waveform UI (lock-free atomic, audio-thread safe).
            let mut sum_sq: f32 = 0.0;
            let mut frames: usize = 0;
            for frame in data.chunks(channels.max(1)) {
                let avg: f32 = frame.iter().map(|s| s.to_float_sample()).sum::<f32>()
                    / frame.len().max(1) as f32;
                buf.push(avg);
                sum_sq += avg * avg;
                frames += 1;
            }
            if frames > 0 {
                meter.set_rms((sum_sq / frames as f32).sqrt());
            }
        };
        device
            .build_input_stream(*config, data_fn, err_fn, None)
            .map_err(|e| format!("Failed to build input stream: {e}"))
    }

    /// Read the current live audio level (0..1-ish RMS) for the waveform UI.
    pub fn current_level(&self) -> f32 {
        self.meter()
            .map(|m| (m.rms() * 8.0).clamp(0.0, 1.0))
            .unwrap_or(0.0)
    }

    /// Access the live meter shared with the recording, if any.
    fn meter(&self) -> Option<Arc<AudioMeter>> {
        self.recorder.lock().as_ref().map(|a| a.meter.clone())
    }

    /// Stop capture and discard the audio without transcribing (Esc / cancel).
    pub fn cancel_recording(&self) {
        let mut guard = self.recorder.lock();
        let _ = guard.take();
    }

    /// Stop recording, resample to 16 kHz mono, trim boundary silence and
    /// return the captured audio. Returns `None` only when there was no active
    /// recording (e.g. already consumed by Enter/Esc) — NOT when it was silent.
    fn take_audio(&self) -> Option<Vec<f32>> {
        let recording = self.recorder.lock().take()?;
        drop(recording._stream); // stop capture
        let raw = {
            let mut buf = recording.samples.lock();
            std::mem::take(&mut *buf)
        };
        if raw.is_empty() {
            return None;
        }
        // Soft cap: keep at most the first MAX_RECORD_SECS of audio.
        let max_samples = (recording.sample_rate as usize).saturating_mul(MAX_RECORD_SECS as usize);
        let raw = if raw.len() > max_samples {
            raw[..max_samples].to_vec()
        } else {
            raw
        };
        let mut audio = resample(&raw, recording.sample_rate, TARGET_SAMPLE_RATE);
        // Trim boundary silence so Whisper doesn't repeat/hallucinate over the
        // silence tail captured while waiting for auto-stop (see trim_silence).
        audio = trim_silence(&audio);
        Some(audio)
    }

    /// Transcribe a 16 kHz mono f32 buffer. Loads the model lazily (cached).
    fn transcribe(&self, model: &std::path::Path, audio: &[f32]) -> Result<String, String> {
        if audio.is_empty() {
            // Distinct from "No audio captured" (no recording at all): the mic
            // captured something, but it was all silence.
            return Err("No speech detected".into());
        }

        let mut whisper = self.whisper.lock();
        if whisper.is_none() {
            let params = WhisperContextParameters::default();
            *whisper = Some(
                WhisperContext::new_with_params(model, params)
                    .map_err(|e| format!("Failed to load Whisper model: {e}"))?,
            );
        }
        let ctx = whisper.as_ref().unwrap();

        let mut state: WhisperState = ctx
            .create_state()
            .map_err(|e| format!("Failed to create Whisper state: {e}"))?;

        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
        params.set_language(Some("en"));
        params.set_suppress_blank(true);
        // Anti-hallucination for short dictations:
        // - no_context: don't condition on previous segment text (avoids
        //   latch-on-to-last-word repetition loops).
        // - suppress_nst: block non-speech token fallbacks ("yes", "(upbeat
        //   music)", "lol") that whisper emits when decoding collapses.
        params.set_no_context(true);
        params.set_suppress_nst(true);
        params.set_print_realtime(false);
        params.set_print_progress(false);
        params.set_translate(false);

        state
            .full(params, audio)
            .map_err(|e| format!("Transcription failed: {e}"))?;

        let n = state.full_n_segments();
        let mut out = String::new();
        for i in 0..n {
            if let Some(seg) = state.get_segment(i) {
                if let Ok(text) = seg.to_str() {
                    out.push_str(text);
                    out.push(' ');
                }
            }
        }
        Ok(out.trim().to_string())
    }

    /// Convenience: stop recording and return the transcript.
    pub fn stop_and_transcribe(&self, model: &std::path::Path) -> Result<String, String> {
        match self.take_audio() {
            Some(audio) => self.transcribe(model, &audio),
            None => Err("No audio captured".into()),
        }
    }

    /// Spawn a background watcher that (a) streams live audio levels to the UI
    /// as `vibegrid://audio-level` events for the waveform, and (b) auto-stops
    /// dictation after ~1.6s of silence, emitting `vibegrid://dictation-result`
    /// with the transcript so the frontend can type it into the terminal.
    ///
    /// Runs off the audio thread: it only reads the lock-free `AudioMeter`, so
    /// it can never jitter or drop mic frames.
    pub fn spawn_auto_stop_watcher(app: AppHandle, this: Arc<Self>, model: PathBuf) {
        std::thread::spawn(move || {
            let start = Instant::now();
            let mut last_emit = Instant::now();
            // None until the user actually speaks — so a silent session does not
            // auto-commit before they've had a chance to start talking.
            let mut last_voice: Option<Instant> = None;
            let mut smoothed: f32 = 0.0;

            while this.is_recording() {
                std::thread::sleep(Duration::from_millis(80));
                let raw = this.current_level();
                // Smooth the level so the UI waveform is not jittery.
                smoothed = smoothed * 0.65 + raw * 0.35;

                // ~10 level events / second → smooth waveform updates.
                if last_emit.elapsed() >= Duration::from_millis(100) {
                    last_emit = Instant::now();
                    let _ = app.emit(
                        "vibegrid://audio-level",
                        serde_json::json!({ "level": smoothed }),
                    );
                }

                let now = Instant::now();
                if smoothed >= LEVEL_VOICE_THRESHOLD {
                    last_voice = Some(now);
                } else if let Some(lv) = last_voice {
                    // Continuous silence long enough after real speech → auto-commit.
                    let timeout = Duration::from_millis(this.silence_timeout_ms());
                    if now.duration_since(lv) >= timeout {
                        this.finish_dictation(&app, &model);
                        break;
                    }
                }

                // Safety: never spoke within a generous window → stop quietly so
                // the mic isn't left open.
                if last_voice.is_none() && now.duration_since(start) >= NO_SPEECH_TIMEOUT {
                    this.finish_dictation(&app, &model);
                    break;
                }
            }
        });
    }

    /// Stop and transcribe, emitting the result to the UI. If recording was
    /// already consumed (e.g. the user pressed Enter at the same moment), stop
    /// silently instead of surfacing a confusing error.
    fn finish_dictation(&self, app: &AppHandle, model: &std::path::Path) {
        match self.stop_and_transcribe(model) {
            Ok(text) => {
                let _ = app.emit(
                    "vibegrid://dictation-result",
                    serde_json::json!({ "text": text, "auto": true }),
                );
            }
            Err(e) => {
                // "No audio captured" means another path (Enter/Esc/manual stop)
                // already took the recording — that path reports its own outcome.
                if e != "No audio captured" {
                    let _ = app.emit(
                        "vibegrid://dictation-error",
                        serde_json::json!({ "error": e }),
                    );
                }
            }
        }
    }

    /// Download the Whisper model if missing, emitting progress events.
    pub fn ensure_model(app: &AppHandle) -> Result<PathBuf, String> {
        let path = Self::model_path(app)?;
        if path.exists() {
            return Ok(path);
        }
        if let Some(dir) = path.parent() {
            std::fs::create_dir_all(dir).map_err(|e| format!("Failed to create model dir: {e}"))?;
        }

        // Direct download from the whisper.cpp HuggingFace repo (env-overridable).
        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(MODEL_FILE);
        let mut urls = vec![
            format!("https://huggingface.co/ggerganov/whisper.cpp/resolve/main/{name}"),
            format!("https://huggingface.co/ggml-org/whisper.cpp/resolve/main/{name}"),
        ];
        if let Ok(custom) = std::env::var("VIBEGRID_WHISPER_URL") {
            if !custom.is_empty() {
                urls.insert(0, custom);
            }
        }

        let client = reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(300))
            .build()
            .map_err(|e| format!("Failed to build download client: {e}"))?;

        let mut last_error = String::new();
        for url in urls {
            eprintln!("[VibeGrid] Downloading Whisper model from {url}");
            match download_to(&client, &url, &path, app) {
                Ok(()) => {
                    eprintln!("[VibeGrid] Whisper model ready: {}", path.display());
                    return Ok(path);
                }
                Err(e) => last_error = e,
            }
        }
        Err(format!(
            "Failed to download Whisper model ({MODEL_FILE}). {last_error}"
        ))
    }
}

fn download_to(
    client: &reqwest::blocking::Client,
    url: &str,
    path: &std::path::Path,
    app: &AppHandle,
) -> Result<(), String> {
    let mut resp = client
        .get(url)
        .send()
        .map_err(|e| format!("Request failed: {e}"))?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status()));
    }

    let total: u64 = resp
        .content_length()
        .unwrap_or(0);

    // Write to a temp file first so a partial download never looks "ready".
    let tmp = path.with_extension("bin.part");
    let mut file = std::fs::File::create(&tmp).map_err(|e| format!("Write failed: {e}"))?;
    let mut downloaded: u64 = 0;

    use std::io::{Read, Write};

    // Emit progress on a byte AND time trigger so the toast never looks frozen:
    // every ~256 KB downloaded, or at least every 300 ms even on a slow link.
    let mut last_emit = std::time::Instant::now();
    let mut last_emit_bytes: u64 = 0;
    let mut buf = [0u8; 64 * 1024];
    loop {
        let n = resp
            .read(&mut buf)
            .map_err(|e| format!("Read failed: {e}"))?;
        if n == 0 {
            break;
        }
        file.write_all(&buf[..n]).map_err(|e| format!("Write failed: {e}"))?;
        downloaded += n as u64;
        if total > 0 {
            let byte_trigger = downloaded.saturating_sub(last_emit_bytes) >= 256 * 1024;
            let time_trigger = last_emit.elapsed() >= Duration::from_millis(300);
            if byte_trigger || time_trigger {
                last_emit = std::time::Instant::now();
                last_emit_bytes = downloaded;
                let _ = app.emit(
                    "vibegrid://model-progress",
                    serde_json::json!({
                        "downloaded": downloaded,
                        "total": total,
                        "percent": (downloaded as f64 / total as f64 * 100.0).round() as u32,
                    }),
                );
            }
        }
    }
    file.sync_all().map_err(|e| format!("Sync failed: {e}"))?;
    std::fs::rename(&tmp, path).map_err(|e| format!("Finalize failed: {e}"))?;
    let _ = app.emit(
        "vibegrid://model-progress",
        serde_json::json!({ "downloaded": downloaded, "total": total, "percent": 100 }),
    );
    Ok(())
}

/// Cut leading/trailing silence from a 16 kHz mono buffer.
///
/// Whisper is very sensitive to silence at the boundaries: a long silent tail
/// makes it latch onto the last spoken word and repeat it (the classic
/// "repetition loop"), and leading silence can make the first chunk decode as
/// a "single timestamp ending" skip. Trimming to the actual speech eliminates
/// both failure modes, so dictation stays accurate on short commands.
#[cfg(test)]
mod trim_tests {
    use super::*;

    fn zeros(n: usize) -> Vec<f32> {
        vec![0.0; n]
    }

    fn loud(n: usize) -> Vec<f32> {
        vec![0.5; n]
    }

    #[test]
    fn all_silence_is_empty() {
        assert!(trim_silence(&zeros(48_000)).is_empty());
    }

    #[test]
    fn sub_100ms_is_empty() {
        // 50 ms of loud audio — too short to be intelligible speech.
        assert!(trim_silence(&loud(TARGET_SAMPLE_RATE as usize / 20)).is_empty());
    }

    #[test]
    fn keeps_speech_and_pads_around_it() {
        let sr = TARGET_SAMPLE_RATE as usize;
        let mut audio = Vec::new();
        audio.extend(zeros(sr * 2)); // 2 s leading silence
        audio.extend(loud(sr)); // 1 s speech
        audio.extend(zeros(sr * 3)); // 3 s trailing silence

        let trimmed = trim_silence(&audio);
        assert!(!trimmed.is_empty());
        // Trimmed length: 1 s speech + 150 ms pad on each side. The trim runs on
        // 25 ms windows, so allow one hop of slack at either end.
        let hop = sr / 40;
        let ideal = sr + (TRIM_PAD_SECS * sr as f32) as usize * 2;
        assert!(
            trimmed.len() >= ideal - hop && trimmed.len() <= ideal + hop * 2,
            "trimmed len {} not within hop of {} (±{})",
            trimmed.len(),
            ideal,
            hop
        );
        // It kept the speech burst (all 0.5 samples survive).
        assert!(trimmed.iter().any(|&s| s > 0.4));
        // And it cut the long silence tails.
        assert!(trimmed.len() < audio.len() / 2);
    }

    #[test]
    fn pad_clamps_at_buffer_edges() {
        let sr = TARGET_SAMPLE_RATE as usize;
        // Speech starts at the very beginning — start pad must clamp to 0.
        let mut audio = loud(sr);
        audio.extend(zeros(sr));
        let trimmed = trim_silence(&audio);
        assert_eq!(trimmed.len(), sr + (TRIM_PAD_SECS * sr as f32) as usize);
        assert_eq!(trimmed[0], 0.5); // first speech sample preserved
    }

    #[test]
    fn quiet_hiss_is_trimmed_but_loud_is_kept() {
        let sr = TARGET_SAMPLE_RATE as usize;
        let mut audio = Vec::new();
        audio.extend(vec![0.001; sr]); // hiss-level noise — below threshold
        audio.extend(vec![0.05; sr]); // quiet but real speech — above threshold
        audio.extend(vec![0.001; sr]);
        let trimmed = trim_silence(&audio);
        assert!(!trimmed.is_empty());
        // The quiet-speech region survived.
        assert!(trimmed.iter().any(|&s| s > 0.04));
    }
}

fn trim_silence(audio: &[f32]) -> Vec<f32> {
    if audio.len() < TARGET_SAMPLE_RATE as usize / 10 {
        return Vec::new(); // < 100 ms — nothing intelligible
    }
    let frame = TARGET_SAMPLE_RATE as usize;
    let window = frame / 20; // 50 ms windows
    let hop = window / 2;

    // Per-window RMS → voiced mask.
    let n_win = audio.len().div_ceil(hop);
    let mut voiced = vec![false; n_win];
    for (i, chunk) in voiced.iter_mut().enumerate() {
        let start = i * hop;
        let end = (start + window).min(audio.len());
        if end <= start {
            continue;
        }
        let sum_sq: f32 = audio[start..end].iter().map(|s| s * s).sum();
        let rms = (sum_sq / (end - start) as f32).sqrt();
        *chunk = rms >= TRIM_RMS_THRESHOLD;
    }

    let Some(first) = voiced.iter().position(|&v| v) else {
        return Vec::new(); // no speech at all
    };
    let last = voiced.iter().rposition(|&v| v).unwrap_or(first);

    let pad = (TRIM_PAD_SECS * TARGET_SAMPLE_RATE as f32) as usize;
    let start = (first * hop).saturating_sub(pad);
    let end = ((last + 1) * hop).min(audio.len()).saturating_add(pad).min(audio.len());
    audio[start..end].to_vec()
}

/// Linear-interpolate a mono buffer from `src_rate` to `dst_rate`.
fn resample(src: &[f32], src_rate: u32, dst_rate: u32) -> Vec<f32> {
    if src_rate == dst_rate || src.is_empty() {
        return src.to_vec();
    }
    let ratio = dst_rate as f64 / src_rate as f64;
    let out_len = ((src.len() as f64) * ratio).ceil() as usize;
    let mut out = Vec::with_capacity(out_len);
    for i in 0..out_len {
        let pos = i as f64 / ratio;
        let idx = pos.floor() as usize;
        let frac = pos - idx as f64;
        let a = src.get(idx).copied().unwrap_or(0.0);
        let b = src.get(idx + 1).copied().unwrap_or(a);
        out.push(a + (b - a) * frac as f32);
    }
    out
}


