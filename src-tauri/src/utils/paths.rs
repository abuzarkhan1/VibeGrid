use std::path::PathBuf;

pub fn get_home_dir() -> Option<PathBuf> {
    std::env::var("HOME")
        .ok()
        .or_else(|| std::env::var("USERPROFILE").ok())
        .map(PathBuf::from)
        .or_else(dirs::home_dir)
}

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

pub fn get_workspaces_dir() -> PathBuf {
    get_app_data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("workspaces")
}

pub fn get_models_dir() -> Option<PathBuf> {
    Some(get_app_data_dir()?.join("models"))
}

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
