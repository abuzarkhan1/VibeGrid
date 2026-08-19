use serde::{Deserialize, Serialize};
use std::env;
use std::path::PathBuf;
use std::process::Command;
use std::time::Duration;
use tauri::{async_runtime::spawn_blocking, command};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentDiscoveryResult {
    pub agent_id: String,
    pub is_installed: bool,
    pub binary_path: Option<String>,
    pub detected_version: Option<String>,
    pub binary_source: Option<String>,
}

fn search_binary_in_paths(binary_name: &str) -> Option<PathBuf> {

    if let Ok(path_var) = env::var("PATH") {
        for dir in env::split_paths(&path_var) {
            let full_path = dir.join(binary_name);
            if full_path.is_file() {
                return Some(full_path);
            }
            #[cfg(windows)]
            {
                let full_exe = dir.join(format!("{}.exe", binary_name));
                if full_exe.is_file() {
                    return Some(full_exe);
                }
                let full_cmd = dir.join(format!("{}.cmd", binary_name));
                if full_cmd.is_file() {
                    return Some(full_cmd);
                }
                let full_bat = dir.join(format!("{}.bat", binary_name));
                if full_bat.is_file() {
                    return Some(full_bat);
                }
            }
        }
    }

    let home = crate::utils::paths::get_home_dir();
    let candidate_dirs: Vec<PathBuf> = vec![
        PathBuf::from("/opt/homebrew/bin"),
        PathBuf::from("/usr/local/bin"),
        PathBuf::from("/usr/bin"),
        PathBuf::from("/bin"),
        home.as_ref().map(|h| h.join(".cargo/bin")).unwrap_or_default(),
        home.as_ref().map(|h| h.join(".local/bin")).unwrap_or_default(),
        home.as_ref().map(|h| h.join(".npm-global/bin")).unwrap_or_default(),
        home.as_ref().map(|h| h.join(".bun/bin")).unwrap_or_default(),
        home.as_ref().map(|h| h.join(".local/share/pnpm")).unwrap_or_default(),
        home.as_ref().map(|h| h.join("Library/pnpm")).unwrap_or_default(),
        home.as_ref().map(|h| h.join(".pyenv/shims")).unwrap_or_default(),
    ];

    for dir in candidate_dirs {
        if dir.as_os_str().is_empty() {
            continue;
        }
        let full_path = dir.join(binary_name);
        if full_path.is_file() {
            return Some(full_path);
        }
    }

    if let Some(ref h) = home {
        let nvm_dir = h.join(".nvm/versions/node");
        if nvm_dir.is_dir() {
            if let Ok(entries) = std::fs::read_dir(nvm_dir) {
                for entry in entries.flatten() {
                    let bin_path = entry.path().join("bin").join(binary_name);
                    if bin_path.is_file() {
                        return Some(bin_path);
                    }
                }
            }
        }
    }

    None
}

fn search_first_available_binary(candidates: &[&str]) -> Option<PathBuf> {
    for candidate in candidates {
        if let Some(path) = search_binary_in_paths(candidate) {
            return Some(path);
        }
    }
    None
}

#[command]
pub async fn discover_installed_agents() -> Result<Vec<AgentDiscoveryResult>, String> {
    spawn_blocking(move || {
        let agent_definitions: Vec<(&str, Vec<&str>, Vec<&str>)> = vec![
            ("claude-code", vec!["claude", "claude-code"], vec!["--version"]),
            ("codex", vec!["codex", "codex-cli", "openai"], vec!["--version"]),
            ("antigravity", vec!["agy", "antigravity"], vec!["--version"]),
            ("grok", vec!["grok", "grok-cli", "xai"], vec!["--version"]),
            ("kimi", vec!["kimi", "kimi-cli"], vec!["--version"]),
            ("qwen", vec!["qwen", "qwen-coder", "qwen-coder-cli"], vec!["--version"]),
            ("aider", vec!["aider", "aider-chat"], vec!["--version"]),
            ("openhands", vec!["openhands", "all-hands"], vec!["--version"]),
            ("ollama", vec!["ollama"], vec!["--version"]),
            ("deepseek", vec!["deepseek", "deepseek-cli"], vec!["--version"]),
            ("gemini", vec!["gemini", "gemini-cli"], vec!["--version"]),
            ("goose", vec!["goose"], vec!["--version"]),
            ("cline", vec!["cline", "cline-cli"], vec!["--version"]),
            ("shell", vec!["zsh", "bash", "sh", "pwsh", "powershell"], vec!["--version"]),
        ];

        let mut results = Vec::new();

        for (id, binary_candidates, version_args) in agent_definitions {
            if let Some(path) = search_first_available_binary(&binary_candidates) {

                let (tx, rx) = std::sync::mpsc::channel();
                let path_clone = path.clone();
                let args_clone = version_args.clone();
                std::thread::spawn(move || {
                    let result = Command::new(&path_clone).args(&args_clone).output().ok();
                    let _ = tx.send(result);
                });
                let output = rx.recv_timeout(Duration::from_secs(3)).ok().flatten();

                let version = output.and_then(|out| {
                    let text = String::from_utf8(out.stdout).ok().or_else(|| String::from_utf8(out.stderr).ok())?;
                    let first_line = text.lines().next().unwrap_or("").trim().to_string();
                    if first_line.is_empty() {
                        None
                    } else {
                        Some(first_line)
                    }
                });

                results.push(AgentDiscoveryResult {
                    agent_id: id.to_string(),
                    is_installed: true,
                    binary_path: Some(path.to_string_lossy().to_string()),
                    detected_version: version,
                    binary_source: Some("detected".into()),
                });
            } else {
                results.push(AgentDiscoveryResult {
                    agent_id: id.to_string(),
                    is_installed: false,
                    binary_path: None,
                    detected_version: None,
                    binary_source: None,
                });
            }
        }

        Ok(results)
    })
    .await
    .map_err(|e| format!("Agent discovery task failed: {e}"))?
}
