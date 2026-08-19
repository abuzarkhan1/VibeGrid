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

pub const TARGET_SAMPLE_RATE: u32 = 16_000;

pub const MODEL_SIZES: [&str; 4] = ["tiny", "base", "small", "medium"];

const MAX_RECORD_SECS: u64 = 60;

const LEVEL_VOICE_THRESHOLD: f32 = 0.12;

const SILENCE_TIMEOUT_DEFAULT_MS: u64 = 1600;

const NO_SPEECH_TIMEOUT: Duration = Duration::from_secs(15);

const TRIM_RMS_THRESHOLD: f32 = 0.004;

const TRIM_PAD_SECS: f32 = 0.15;

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

    _stream: cpal::Stream,

    receiver: Mutex<std::sync::mpsc::Receiver<Vec<f32>>>,
    sample_rate: u32,

    meter: Arc<AudioMeter>,
}

pub struct SpeechManager {
    recorder: Mutex<Option<ActiveRecording>>,
    whisper: Mutex<Option<Arc<WhisperContext>>>,

    silence_timeout_ms: AtomicU64,

    preferred_input: Mutex<Option<String>>,

    language: Mutex<String>,

    model_size: Mutex<String>,
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
            language: Mutex::new(String::from("auto")),
            model_size: Mutex::new(String::from("base")),
        }
    }

    pub fn is_recording(&self) -> bool {
        self.recorder.lock().is_some()
    }

    pub fn set_silence_timeout_ms(&self, ms: u64) -> u64 {
        let clamped = ms.clamp(600, 5_000);
        self.silence_timeout_ms.store(clamped, Ordering::Relaxed);
        clamped
    }

    pub fn silence_timeout_ms(&self) -> u64 {
        self.silence_timeout_ms.load(Ordering::Relaxed)
    }

    pub fn set_input_device(&self, name: String) {
        *self.preferred_input.lock() = if name.is_empty() {
            None
        } else {
            Some(name)
        };
    }

    pub fn model_path(&self, app: &AppHandle) -> Result<PathBuf, String> {
        let dir = crate::utils::paths::get_models_dir()
            .or_else(|| app.path().app_data_dir().ok().map(|d| d.join("models")))
            .ok_or_else(|| "Could not resolve models directory".to_string())?;
        Ok(dir.join(self.model_file_name()))
    }

    pub fn model_ready(&self, app: &AppHandle) -> bool {
        self.model_path(app).map(|p| p.exists()).unwrap_or(false)
    }

    pub fn set_language(&self, language: String) -> String {
        let lang = language.trim().to_lowercase();
        let lang = if lang.is_empty() { String::from("auto") } else { lang };
        let mut guard = self.language.lock();
        let changed = *guard != lang;
        if changed {
            *guard = lang.clone();
            *self.whisper.lock() = None;
        }
        lang
    }

    pub fn set_model_size(&self, size: String) -> String {
        let size = size.trim().to_lowercase();
        let size = if MODEL_SIZES.contains(&size.as_str()) {
            size
        } else {
            String::from("base")
        };
        let mut guard = self.model_size.lock();
        let changed = *guard != size;
        if changed {
            *guard = size.clone();
            *self.whisper.lock() = None;
        }
        size
    }

    pub fn model_file_name(&self) -> String {
        let size = self.model_size.lock().clone();
        let lang = self.language.lock().clone();
        if lang == "en" {
            format!("ggml-{size}.en.bin")
        } else {
            format!("ggml-{size}.bin")
        }
    }

    pub fn list_input_devices() -> Vec<String> {
        let host = cpal::default_host();
        match host.input_devices() {
            Ok(devices) => devices
                .map(|d| d.to_string())
                .filter(|n| !n.is_empty())
                .collect(),
            Err(_) => Vec::new(),
        }
    }

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

            eprintln!("[VibeGrid] Preferred mic '{name}' not found; using default.");
        }
        host.default_input_device()
            .ok_or_else(|| "No microphone input device found. Connect a microphone or grant microphone access in System Settings → Privacy & Security → Microphone.".to_string())
    }

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
        let (sender, receiver) = std::sync::mpsc::channel::<Vec<f32>>();
        let meter = Arc::new(AudioMeter::new());
        let err_fn = |e| eprintln!("[VibeGrid] audio stream error: {e}");

        let build = |format: cpal::SampleFormat| -> Result<cpal::Stream, String> {
            match format {
                cpal::SampleFormat::F32 => Self::build_input::<f32>(
                    &device,
                    &stream_config,
                    sender.clone(),
                    meter.clone(),
                    channels,
                    err_fn,
                ),
                cpal::SampleFormat::I16 => Self::build_input::<i16>(
                    &device,
                    &stream_config,
                    sender.clone(),
                    meter.clone(),
                    channels,
                    err_fn,
                ),
                cpal::SampleFormat::U16 => Self::build_input::<u16>(
                    &device,
                    &stream_config,
                    sender.clone(),
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
            receiver: Mutex::new(receiver),
            sample_rate,
            meter,
        });
        Ok(())
    }

    fn build_input<T>(
        device: &cpal::Device,
        config: &cpal::StreamConfig,
        sender: std::sync::mpsc::Sender<Vec<f32>>,
        meter: Arc<AudioMeter>,
        channels: usize,
        err_fn: impl FnMut(cpal::Error) + Send + 'static,
    ) -> Result<cpal::Stream, String>
    where
        T: cpal::SizedSample + cpal::Sample<Float = f32>,
    {
        let data_fn = move |data: &[T], _: &cpal::InputCallbackInfo| {

            let frame_count = data.len() / channels.max(1);
            let mut chunk = Vec::with_capacity(frame_count);
            let mut sum_sq: f32 = 0.0;
            let mut frames: usize = 0;
            for frame in data.chunks(channels.max(1)) {
                let avg: f32 = frame.iter().map(|s| s.to_float_sample()).sum::<f32>()
                    / frame.len().max(1) as f32;
                chunk.push(avg);
                sum_sq += avg * avg;
                frames += 1;
            }
            if frames > 0 {
                meter.set_rms((sum_sq / frames as f32).sqrt());
            }
            let _ = sender.send(chunk);
        };
        device
            .build_input_stream(*config, data_fn, err_fn, None)
            .map_err(|e| format!("Failed to build input stream: {e}"))
    }

    pub fn current_level(&self) -> f32 {
        self.meter()
            .map(|m| (m.rms() * 8.0).clamp(0.0, 1.0))
            .unwrap_or(0.0)
    }

    fn meter(&self) -> Option<Arc<AudioMeter>> {
        self.recorder.lock().as_ref().map(|a| a.meter.clone())
    }

    pub fn cancel_recording(&self) {
        let mut guard = self.recorder.lock();
        let _ = guard.take();
    }

    fn take_audio(&self) -> Option<Vec<f32>> {
        let recording = self.recorder.lock().take()?;
        drop(recording._stream);
        let raw: Vec<f32> = {
            let guard = recording.receiver.lock();
            guard.try_iter().flatten().collect()
        };
        if raw.is_empty() {
            return None;
        }

        let max_samples = (recording.sample_rate as usize).saturating_mul(MAX_RECORD_SECS as usize);
        let raw = if raw.len() > max_samples {
            raw[..max_samples].to_vec()
        } else {
            raw
        };
        let mut audio = resample(&raw, recording.sample_rate, TARGET_SAMPLE_RATE);

        audio = trim_silence(&audio);
        Some(audio)
    }

    fn transcribe(&self, model: &std::path::Path, audio: &[f32]) -> Result<String, String> {
        if audio.is_empty() {

            return Err("No speech detected".into());
        }

        let ctx: Arc<WhisperContext> = {
            let mut guard = self.whisper.lock();
            if guard.is_none() {
                let params = WhisperContextParameters::default();
                let loaded = WhisperContext::new_with_params(model, params)
                    .map_err(|e| format!("Failed to load Whisper model: {e}"))?;
                *guard = Some(Arc::new(loaded));
            }
            guard
                .as_ref()
                .cloned()
                .ok_or_else(|| "Whisper model not initialized".to_string())?
        };

        let language = self.language.lock().clone();

        let mut state: WhisperState = ctx
            .create_state()
            .map_err(|e| format!("Failed to create Whisper state: {e}"))?;

        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });

        if language == "auto" {
            params.set_language(None);
        } else {
            params.set_language(Some(&language));
        }
        params.set_suppress_blank(true);

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

    pub fn stop_and_transcribe(&self, model: &std::path::Path) -> Result<String, String> {
        match self.take_audio() {
            Some(audio) => self.transcribe(model, &audio),
            None => Err("No audio captured".into()),
        }
    }

    pub fn spawn_auto_stop_watcher(app: AppHandle, this: Arc<Self>, model: PathBuf) {
        std::thread::spawn(move || {
            let start = Instant::now();
            let mut last_emit = Instant::now();

            let mut last_voice: Option<Instant> = None;
            let mut smoothed: f32 = 0.0;

            while this.is_recording() {
                std::thread::sleep(Duration::from_millis(80));
                let raw = this.current_level();

                smoothed = smoothed * 0.65 + raw * 0.35;

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

                    let timeout = Duration::from_millis(this.silence_timeout_ms());
                    if now.duration_since(lv) >= timeout {
                        this.finish_dictation(&app, &model);
                        break;
                    }
                }

                if last_voice.is_none() && now.duration_since(start) >= NO_SPEECH_TIMEOUT {
                    this.finish_dictation(&app, &model);
                    break;
                }
            }
        });
    }

    fn finish_dictation(&self, app: &AppHandle, model: &std::path::Path) {
        match self.stop_and_transcribe(model) {
            Ok(text) => {
                let _ = app.emit(
                    "vibegrid://dictation-result",
                    serde_json::json!({ "text": text, "auto": true }),
                );
            }
            Err(e) => {

                if e != "No audio captured" {
                    let _ = app.emit(
                        "vibegrid://dictation-error",
                        serde_json::json!({ "error": e }),
                    );
                }
            }
        }
    }

    pub fn ensure_model(&self, app: &AppHandle) -> Result<PathBuf, String> {
        let path = self.model_path(app)?;
        if path.exists() {
            return Ok(path);
        }
        if let Some(dir) = path.parent() {
            std::fs::create_dir_all(dir).map_err(|e| format!("Failed to create model dir: {e}"))?;
        }

        let model_file = self.model_file_name();
        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(model_file.as_str());
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
            "Failed to download Whisper model ({model_file}). {last_error}"
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

    let tmp = path.with_extension("bin.part");
    let mut file = std::fs::File::create(&tmp).map_err(|e| format!("Write failed: {e}"))?;
    let mut downloaded: u64 = 0;

    use std::io::{Read, Write};

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

#[cfg(test)]
mod meter_tests {
    use super::*;

    #[test]
    fn audio_meter_starts_silent() {
        let meter = AudioMeter::new();
        assert_eq!(meter.rms(), 0.0);
    }

    #[test]
    fn audio_meter_roundtrips_rms() {
        let meter = AudioMeter::new();
        meter.set_rms(0.5);
        assert!((meter.rms() - 0.5).abs() < f32::EPSILON);
        meter.set_rms(-0.25);
        assert!((meter.rms() - -0.25).abs() < f32::EPSILON);
        meter.set_rms(0.0);
        assert_eq!(meter.rms(), 0.0);
    }

    #[test]
    fn audio_meter_is_lock_free_ordered_relaxed() {

        let meter = Arc::new(AudioMeter::new());
        let mut handles = Vec::new();
        for i in 0..8 {
            let m = meter.clone();
            handles.push(std::thread::spawn(move || {
                for _ in 0..1000 {
                    m.set_rms(i as f32 / 8.0);
                    let _ = m.rms();
                }
            }));
        }
        for h in handles {
            h.join().unwrap();
        }

        let v = meter.rms();

        assert!(!v.is_nan());
    }

    #[test]
    fn silence_timeout_clamps_to_supported_range() {
        let mgr = SpeechManager::new();

        let clamped = mgr.set_silence_timeout_ms(100);
        assert_eq!(clamped, 600);
        let clamped = mgr.set_silence_timeout_ms(99_999);
        assert_eq!(clamped, 5000);
        let clamped = mgr.set_silence_timeout_ms(1200);
        assert_eq!(clamped, 1200);
        assert_eq!(mgr.silence_timeout_ms(), 1200);
    }
}

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

        assert!(trim_silence(&loud(TARGET_SAMPLE_RATE as usize / 20)).is_empty());
    }

    #[test]
    fn keeps_speech_and_pads_around_it() {
        let sr = TARGET_SAMPLE_RATE as usize;
        let mut audio = Vec::new();
        audio.extend(zeros(sr * 2));
        audio.extend(loud(sr));
        audio.extend(zeros(sr * 3));

        let trimmed = trim_silence(&audio);
        assert!(!trimmed.is_empty());

        let hop = sr / 40;
        let ideal = sr + (TRIM_PAD_SECS * sr as f32) as usize * 2;
        assert!(
            trimmed.len() >= ideal - hop && trimmed.len() <= ideal + hop * 2,
            "trimmed len {} not within hop of {} (±{})",
            trimmed.len(),
            ideal,
            hop
        );

        assert!(trimmed.iter().any(|&s| s > 0.4));

        assert!(trimmed.len() < audio.len() / 2);
    }

    #[test]
    fn pad_clamps_at_buffer_edges() {
        let sr = TARGET_SAMPLE_RATE as usize;

        let mut audio = loud(sr);
        audio.extend(zeros(sr));
        let trimmed = trim_silence(&audio);
        assert_eq!(trimmed.len(), sr + (TRIM_PAD_SECS * sr as f32) as usize);
        assert_eq!(trimmed[0], 0.5);
    }

    #[test]
    fn quiet_hiss_is_trimmed_but_loud_is_kept() {
        let sr = TARGET_SAMPLE_RATE as usize;
        let mut audio = Vec::new();
        audio.extend(vec![0.001; sr]);
        audio.extend(vec![0.05; sr]);
        audio.extend(vec![0.001; sr]);
        let trimmed = trim_silence(&audio);
        assert!(!trimmed.is_empty());

        assert!(trimmed.iter().any(|&s| s > 0.04));
    }
}

fn trim_silence(audio: &[f32]) -> Vec<f32> {
    if audio.len() < TARGET_SAMPLE_RATE as usize / 10 {
        return Vec::new();
    }
    let frame = TARGET_SAMPLE_RATE as usize;
    let window = frame / 20;
    let hop = window / 2;

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
        return Vec::new();
    };
    let last = voiced.iter().rposition(|&v| v).unwrap_or(first);

    let pad = (TRIM_PAD_SECS * TARGET_SAMPLE_RATE as f32) as usize;
    let start = (first * hop).saturating_sub(pad);
    let end = ((last + 1) * hop).min(audio.len()).saturating_add(pad).min(audio.len());
    audio[start..end].to_vec()
}

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
