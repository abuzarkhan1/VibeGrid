use crate::{AppState, toggle_main_window};
use std::str::FromStr;
use tauri::State;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

fn to_global_hotkey_accel(accel: &str) -> String {
    accel
        .split('+')
        .map(|part| match part.trim() {
            "Mod" => "CmdOrCtrl",
            "Cmd" => "Cmd",
            "Ctrl" => "Ctrl",
            other => other,
        })
        .collect::<Vec<_>>()
        .join("+")
}

pub(crate) fn parse_shortcut(accel: &str) -> Result<Shortcut, String> {
    let translated = to_global_hotkey_accel(accel);
    Shortcut::from_str(&translated)
        .map_err(|e| format!("Invalid global shortcut \"{accel}\": {e}"))
}

#[tauri::command]
pub fn set_global_summon(app: tauri::AppHandle, state: State<'_, AppState>, accel: String) -> Result<String, String> {
    let shortcut = parse_shortcut(&accel)?;

    let mut guard = state.global_summon.lock();

    if let Some(prev) = guard.take() {
        let _ = app.global_shortcut().unregister(prev);
    }

    app.global_shortcut()
        .on_shortcut(shortcut, move |app, _shortcut, _event| {
            toggle_main_window(app);
        })
        .map_err(|e| format!("Could not register global shortcut {accel}: {e}"))?;

    *guard = Some(shortcut);
    Ok(accel)
}
