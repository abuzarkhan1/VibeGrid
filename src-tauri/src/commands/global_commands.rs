use crate::{AppState, toggle_main_window};
use std::str::FromStr;
use tauri::State;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

/// Translate the app's accelerator format ("Mod+Shift+Space") into the
/// global-hotkey format ("CmdOrCtrl+Shift+Space") that Shortcut::from_str
/// parses. `Mod` follows the app-wide convention: Command on macOS, Control
/// everywhere else.
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

/// Parse an app-format accelerator into a global-hotkey Shortcut.
pub(crate) fn parse_shortcut(accel: &str) -> Result<Shortcut, String> {
    let translated = to_global_hotkey_accel(accel);
    Shortcut::from_str(&translated)
        .map_err(|e| format!("Invalid global shortcut \"{accel}\": {e}"))
}

/// Register (or re-register) the global summon shortcut from a user-chosen
/// accelerator (audit: previously hardcoded, impossible to reassign). The old
/// binding is unregistered first; failures surface to the caller instead of
/// crashing. Returns the accelerator now in effect.
#[tauri::command]
pub fn set_global_summon(app: tauri::AppHandle, state: State<'_, AppState>, accel: String) -> Result<String, String> {
    let shortcut = parse_shortcut(&accel)?;

    let mut guard = state.global_summon.lock();

    // Unregister the previous binding (best-effort — it may not be registered).
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
