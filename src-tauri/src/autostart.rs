//! Launch-at-login (customization audit C9).
//!
//! Implements autostart natively on each platform with the standard OS
//! mechanism — no extra crate, so there is nothing new to vendor or maintain:
//!
//! - macOS: a LaunchAgent plist in `~/Library/LaunchAgents`.
//! - Windows: the `HKCU\...\CurrentVersion\Run` registry value via `reg.exe`.
//! - Linux: an XDG autostart `.desktop` entry in `~/.config/autostart`.
//!
//! The binary path comes from `std::env::current_exe()` (the .app bundle's
//! executable when packaged).

use std::path::PathBuf;

#[cfg(target_os = "macos")]
const LABEL: &str = "com.vibegrid.VibeGrid";

/// Is VibeGrid currently configured to launch at login?
/// - macOS/Linux: the autostart file exists.
/// - Windows: the HKCU Run registry value exists (checked via reg.exe).
///
/// Only used by tests to assert state after enable/disable.
#[cfg(test)]
pub fn is_enabled() -> bool {
    #[cfg(target_os = "macos")]
    {
        autostart_path().map(|p| p.exists()).unwrap_or(false)
    }
    #[cfg(target_os = "linux")]
    {
        autostart_path().map(|p| p.exists()).unwrap_or(false)
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("reg")
            .args(["query", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run", "/v", "VibeGrid"])
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        false
    }
}

/// Enable or disable launch-at-login. Errors surface as user-facing toasts.
pub fn set_enabled(enabled: bool) -> Result<(), String> {
    if enabled {
        enable()
    } else {
        disable()
    }
}

/// The OS-specific file the autostart state lives in (macOS/Linux only — the
/// Windows backend uses the registry).
fn autostart_path() -> Option<PathBuf> {
    crate::utils::paths::get_autostart_path(LABEL)
}

#[cfg(target_os = "macos")]
fn enable() -> Result<(), String> {
    let exe = std::env::current_exe().map_err(|e| format!("Could not resolve app executable: {e}"))?;
    let path = autostart_path().ok_or("Unsupported platform for autostart")?;
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| format!("Could not create LaunchAgents dir: {e}"))?;
    }
    let exe = exe.display();
    let plist = format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>{LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>{exe}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
"#
    );
    std::fs::write(&path, plist).map_err(|e| format!("Could not write LaunchAgent: {e}"))
}

#[cfg(target_os = "macos")]
fn disable() -> Result<(), String> {
    match autostart_path() {
        Some(path) if path.exists() => std::fs::remove_file(&path)
            .map_err(|e| format!("Could not remove LaunchAgent: {e}")),
        _ => Ok(()),
    }
}

#[cfg(target_os = "windows")]
fn enable() -> Result<(), String> {
    let exe = std::env::current_exe().map_err(|e| format!("Could not resolve app executable: {e}"))?;
    let status = std::process::Command::new("reg")
        .args([
            "add",
            r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
            "/v",
            "VibeGrid",
            "/t",
            "REG_SZ",
            "/d",
            &exe.display().to_string(),
            "/f",
        ])
        .status()
        .map_err(|e| format!("Could not run reg.exe: {e}"))?;
    if status.success() {
        Ok(())
    } else {
        Err("Windows registry update failed".into())
    }
}

#[cfg(target_os = "windows")]
fn disable() -> Result<(), String> {
    let status = std::process::Command::new("reg")
        .args([
            "delete",
            r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
            "/v",
            "VibeGrid",
            "/f",
        ])
        .status()
        .map_err(|e| format!("Could not run reg.exe: {e}"))?;
    // "The system cannot find the file specified" when the value never existed
    // is fine — deleting a non-existent autostart entry is a no-op success.
    if status.success() {
        Ok(())
    } else {
        Err("Windows registry update failed".into())
    }
}

#[cfg(target_os = "linux")]
fn enable() -> Result<(), String> {
    let exe = std::env::current_exe().map_err(|e| format!("Could not resolve app executable: {e}"))?;
    let path = autostart_path().ok_or("Unsupported platform for autostart")?;
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| format!("Could not create autostart dir: {e}"))?;
    }
    let desktop = format!(
        "[Desktop Entry]\nType=Application\nName=VibeGrid\nExec={}\nHidden=false\nX-GNOME-Autostart-enabled=true\n",
        exe.display()
    );
    std::fs::write(&path, desktop).map_err(|e| format!("Could not write autostart entry: {e}"))
}

#[cfg(target_os = "linux")]
fn disable() -> Result<(), String> {
    match autostart_path() {
        Some(path) if path.exists() => std::fs::remove_file(&path)
            .map_err(|e| format!("Could not remove autostart entry: {e}")),
        _ => Ok(()),
    }
}

// Fallbacks so `set_enabled`/the tests compile on any target, even ones with
// no autostart backend (they fail gracefully instead of panicking).
#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
fn enable() -> Result<(), String> {
    Err("Launch-at-login is not supported on this platform".into())
}

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
fn disable() -> Result<(), String> {
    Err("Launch-at-login is not supported on this platform".into())
}

// The command wrappers live here so the platform code stays private.
#[tauri::command]
pub fn autostart_set_enabled(enabled: bool) -> Result<(), String> {
    set_enabled(enabled)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The autostart backend writes real files under $HOME, so the test points
    /// HOME at a temp dir and never touches the user's LaunchAgents/autostart
    /// folder (same env-override pattern as the http_server tests; edition 2024
    /// makes set_var unsafe). Windows (registry backend) is skipped entirely.
    #[test]
    fn toggling_autostart_roundtrips_on_supported_platforms() {
        #[cfg(any(target_os = "macos", target_os = "linux"))]
        {
            let tmp = std::env::temp_dir().join(format!("vg-autostart-test-{}", std::process::id()));
            std::fs::create_dir_all(&tmp).expect("create temp HOME");
            let prev_home = std::env::var_os("HOME");
            unsafe { std::env::set_var("HOME", &tmp) };

            let result = (|| -> Result<(), String> {
                set_enabled(true)?;
                assert!(is_enabled(), "autostart should be enabled after enable()");
                set_enabled(false)?;
                assert!(!is_enabled(), "autostart should be disabled after disable()");
                Ok(())
            })();

            // Restore the user's HOME and remove the temp dir.
            match prev_home {
                Some(h) => unsafe { std::env::set_var("HOME", h) },
                None => unsafe { std::env::remove_var("HOME") },
            }
            let _ = std::fs::remove_dir_all(&tmp);

            result.expect("autostart toggle should succeed on macOS/Linux");
        }

        // Unsupported platforms: the toggle must fail gracefully, not panic.
        #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
        {
            assert!(set_enabled(true).is_err());
            assert!(!is_enabled());
        }
    }
}
