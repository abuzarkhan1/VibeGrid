use std::sync::Arc;

use tauri::{AppHandle, State};
use crate::{speech::SpeechManager, AppState};

#[derive(serde::Serialize)]
pub struct VoiceModelStatus {
    pub ready: bool,
    pub path: Option<String>,
    pub size_bytes: Option<u64>,
}

#[tauri::command]
pub fn voice_model_status(app: AppHandle) -> Result<VoiceModelStatus, String> {
    let path = SpeechManager::model_path(&app)?;
    let size_bytes = std::fs::metadata(&path).ok().map(|m| m.len());
    Ok(VoiceModelStatus {
        ready: SpeechManager::model_ready(&app),
        path: Some(path.display().to_string()),
        size_bytes,
    })
}

#[tauri::command]
pub async fn voice_ensure_model(app: AppHandle) -> Result<String, String> {
    // Download (or confirm) the model on a blocking thread so the async runtime
    // is not stalled by a multi-MB download.
    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || SpeechManager::ensure_model(&handle))
        .await
        .map_err(|e| format!("Model download task failed: {e}"))?
        .map(|p| p.display().to_string())
}

#[tauri::command]
pub fn voice_start_recording(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.speech.start_recording()?;
    // Resolve the model path now (needed if auto-stop kicks in before the user
    // presses a key) and spawn the watcher that streams audio levels to the UI
    // and auto-commits after silence.
    let model = SpeechManager::model_path(&app)?;
    SpeechManager::spawn_auto_stop_watcher(app, Arc::clone(&state.speech), model);
    Ok(())
}

#[tauri::command]
pub fn voice_cancel_recording(state: State<'_, AppState>) -> Result<(), String> {
    state.speech.cancel_recording();
    Ok(())
}

#[tauri::command]
pub async fn voice_stop_recording(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    // Resolve the model path (cheap), then run Whisper inference on a blocking
    // thread so the main thread / UI is never frozen during transcription.
    let model = SpeechManager::model_path(&app)?;
    let speech = state.speech.clone();
    tauri::async_runtime::spawn_blocking(move || speech.stop_and_transcribe(&model))
        .await
        .map_err(|e| format!("Transcription task failed: {e}"))?
}

#[tauri::command]
pub fn voice_is_recording(state: State<'_, AppState>) -> bool {
    state.speech.is_recording()
}
