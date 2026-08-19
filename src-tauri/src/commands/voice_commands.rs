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
pub fn voice_model_status(app: AppHandle, state: State<'_, AppState>) -> Result<VoiceModelStatus, String> {
    let path = state.speech.model_path(&app)?;
    let size_bytes = std::fs::metadata(&path).ok().map(|m| m.len());
    Ok(VoiceModelStatus {
        ready: state.speech.model_ready(&app),
        path: Some(path.display().to_string()),
        size_bytes,
    })
}

#[tauri::command]
pub async fn voice_ensure_model(app: AppHandle, state: State<'_, AppState>) -> Result<String, String> {

    let handle = app.clone();
    let speech = state.speech.clone();
    tauri::async_runtime::spawn_blocking(move || speech.ensure_model(&handle))
        .await
        .map_err(|e| format!("Model download task failed: {e}"))?
        .map(|p| p.display().to_string())
}

#[tauri::command]
pub fn voice_start_recording(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {

    let model = state.speech.model_path(&app)?;
    state.speech.start_recording()?;

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

    let model = state.speech.model_path(&app)?;
    let speech = state.speech.clone();
    tauri::async_runtime::spawn_blocking(move || speech.stop_and_transcribe(&model))
        .await
        .map_err(|e| format!("Transcription task failed: {e}"))?
}

#[tauri::command]
pub fn voice_set_silence_timeout(state: State<'_, AppState>, ms: u64) -> u64 {
    state.speech.set_silence_timeout_ms(ms)
}

#[tauri::command]
pub fn voice_set_language(state: State<'_, AppState>, language: String) -> String {
    state.speech.set_language(language)
}

#[tauri::command]
pub fn voice_set_model_size(state: State<'_, AppState>, size: String) -> String {
    state.speech.set_model_size(size)
}

#[tauri::command]
pub fn voice_set_input_device(state: State<'_, AppState>, name: String) -> Result<(), String> {
    state.speech.set_input_device(name);
    Ok(())
}

#[tauri::command]
pub fn voice_list_input_devices() -> Vec<String> {
    SpeechManager::list_input_devices()
}
