//! Centralized path resolution for VibeGrid.
//!
//! Provides a single source of truth for application directories, config paths,
//! and environment-variable fallbacks.

use std::path::PathBuf;

/// Resolve the user's home directory across platforms (respecting $HOME or %USERPROFILE%).
pub fn get_home_dir() -> Option<PathBuf> {
    std::env::var("HOME")
        .ok()
        .or_else(|| std::env::var("USERPROFILE").ok())
        .map(PathBuf::from)
        .or_else(dirs::home_dir)
}

/// Resolve the base application data / state directory for VibeGrid.
///
/// Precedence order:
/// 1. `VIBEGRID_HOME` environment variable (if explicitly set and non-empty)
/// 2. `$HOME/.vibegrid` / `%USERPROFILE%/.vibegrid`
/// 3. Standard system data directory: `dirs::data_dir().join("vibegrid")`
pub fn get_app_data_dir() -> Option<PathBuf> {
    if let Ok(explicit) = std::env::var("VIBEGRID_HOME") {
        let trimmed = explicit.trim();
        if !trimmed.is_empty() {
            return Some(PathBuf::from(trimmed));
        }
    }

    if let Some(home) = get_home_dir() {
        return Some(home.join(".vibegrid"));
    }

    dirs::data_dir().map(|d| d.join("vibegrid"))
}

/// Path to the workspaces storage directory.
pub fn get_workspaces_dir() -> PathBuf {
    get_app_data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("workspaces")
}

/// Path to the AI voice model storage directory.
pub fn get_models_dir() -> Option<PathBuf> {
    Some(get_app_data_dir()?.join("models"))
}

/// Path to the platform-specific autostart / launch-agent entry.
pub fn get_autostart_path(label: &str) -> Option<PathBuf> {
    let home = get_home_dir()?;
    #[cfg(target_os = "macos")]
    {
        Some(
            home.join("Library")
                .join("LaunchAgents")
                .join(format!("{label}.plist")),
        )
    }
    #[cfg(target_os = "linux")]
    {
        Some(
            home.join(".config")
                .join("autostart")
                .join("vibegrid.desktop"),
        )
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    {
        let _ = label;
        let _ = home;
        None
    }
}
