use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitFileEntry {
    pub path: String,
    pub status: String, // "modified", "added", "deleted", "untracked"
    pub staged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitDiffLine {
    pub line_type: String, // "context", "add", "remove"
    pub line_old: Option<u32>,
    pub line_new: Option<u32>,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitDiffStats {
    pub additions: u32,
    pub deletions: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitDiffResponse {
    pub is_git_repo: bool,
    pub branch: String,
    pub files: Vec<GitFileEntry>,
    pub active_file: String,
    pub diff_lines: Vec<GitDiffLine>,
    pub stats: GitDiffStats,
    pub error: Option<String>,
}

fn find_git_root(start: &Path) -> Option<PathBuf> {
    let mut current = start.to_path_buf();
    loop {
        if current.join(".git").exists() {
            return Some(current);
        }
        if !current.pop() {
            return None;
        }
    }
}

#[tauri::command]
pub async fn get_git_diff(
    cwd: Option<String>,
    file_path: Option<String>,
) -> Result<GitDiffResponse, String> {
    tokio::task::spawn_blocking(move || {
        let work_dir = match &cwd {
            Some(c) if !c.is_empty() => PathBuf::from(c),
            _ => std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
        };

        let git_root = match find_git_root(&work_dir) {
            Some(root) => root,
            None => {
                return Ok(GitDiffResponse {
                    is_git_repo: false,
                    branch: "".to_string(),
                    files: vec![],
                    active_file: "".to_string(),
                    diff_lines: vec![],
                    stats: GitDiffStats {
                        additions: 0,
                        deletions: 0,
                    },
                    error: Some("Current workspace is not a Git repository".to_string()),
                });
            }
        };

        // 1. Get branch name
        let branch_output = Command::new("git")
            .arg("rev-parse")
            .arg("--abbrev-ref")
            .arg("HEAD")
            .current_dir(&git_root)
            .output();

        let branch = branch_output
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim().to_string())
            .unwrap_or_else(|| "main".to_string());

        // 2. Get status porcelain
        let status_output = Command::new("git")
            .arg("status")
            .arg("--porcelain")
            .arg("-uall")
            .current_dir(&git_root)
            .output();

        let mut files: Vec<GitFileEntry> = Vec::new();

        if let Ok(out) = status_output {
            if let Ok(text) = String::from_utf8(out.stdout) {
                for line in text.lines() {
                    if line.len() < 3 {
                        continue;
                    }
                    let index_status = &line[0..1];
                    let work_status = &line[1..2];
                    let rel_path = line[3..].trim().to_string();

                    let status_str = if index_status == "?" || work_status == "?" {
                        "untracked"
                    } else if index_status == "A" || work_status == "A" {
                        "added"
                    } else if index_status == "D" || work_status == "D" {
                        "deleted"
                    } else {
                        "modified"
                    };

                    let staged = index_status != " " && index_status != "?";

                    files.push(GitFileEntry {
                        path: rel_path,
                        status: status_str.to_string(),
                        staged,
                    });
                }
            }
        }

        // Determine active file
        let active = match &file_path {
            Some(f) if !f.is_empty() => f.clone(),
            _ => files
                .first()
                .map(|f| f.path.clone())
                .unwrap_or_default(),
        };

        if active.is_empty() {
            return Ok(GitDiffResponse {
                is_git_repo: true,
                branch,
                files,
                active_file: "".to_string(),
                diff_lines: vec![],
                stats: GitDiffStats {
                    additions: 0,
                    deletions: 0,
                },
                error: None,
            });
        }

        // 3. Get diff for active file
        // Try git diff HEAD -- <active>, then fallback to git diff -- <active>
        let mut diff_cmd = Command::new("git");
        diff_cmd
            .arg("diff")
            .arg("HEAD")
            .arg("--")
            .arg(&active)
            .current_dir(&git_root);

        let mut diff_raw = String::new();
        if let Ok(out) = diff_cmd.output() {
            if let Ok(s) = String::from_utf8(out.stdout) {
                diff_raw = s;
            }
        }

        if diff_raw.trim().is_empty() {
            // Check if untracked or staged diff
            let mut diff_unstaged = Command::new("git");
            diff_unstaged
                .arg("diff")
                .arg("--")
                .arg(&active)
                .current_dir(&git_root);
            if let Ok(out) = diff_unstaged.output() {
                if let Ok(s) = String::from_utf8(out.stdout) {
                    diff_raw = s;
                }
            }
        }

        // If file is untracked, generate pseudo-diff from file content
        if diff_raw.trim().is_empty() {
            let full_path = git_root.join(&active);
            if full_path.is_file() {
                if let Ok(content) = std::fs::read_to_string(&full_path) {
                    let mut diff_lines = Vec::new();
                    let mut additions = 0;
                    for (idx, line) in content.lines().enumerate() {
                        additions += 1;
                        diff_lines.push(GitDiffLine {
                            line_type: "add".to_string(),
                            line_old: None,
                            line_new: Some((idx + 1) as u32),
                            text: format!("+ {line}"),
                        });
                    }
                    return Ok(GitDiffResponse {
                        is_git_repo: true,
                        branch,
                        files,
                        active_file: active,
                        diff_lines,
                        stats: GitDiffStats {
                            additions,
                            deletions: 0,
                        },
                        error: None,
                    });
                }
            }
        }

        // Parse unified diff lines
        let mut diff_lines = Vec::new();
        let mut additions = 0;
        let mut deletions = 0;
        let mut old_line_num: u32 = 1;
        let mut new_line_num: u32 = 1;
        let mut in_hunk = false;

        for line in diff_raw.lines() {
            if line.starts_with("@@") {
                in_hunk = true;
                // Parse @@ -old,count +new,count @@
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 3 {
                    if let Some(old_part) = parts[1].strip_prefix('-') {
                        let old_start = old_part.split(',').next().unwrap_or("1");
                        old_line_num = old_start.parse::<u32>().unwrap_or(1);
                    }
                    if let Some(new_part) = parts[2].strip_prefix('+') {
                        let new_start = new_part.split(',').next().unwrap_or("1");
                        new_line_num = new_start.parse::<u32>().unwrap_or(1);
                    }
                }
                continue;
            }

            if !in_hunk {
                continue;
            }

            if line.starts_with('+') {
                additions += 1;
                diff_lines.push(GitDiffLine {
                    line_type: "add".to_string(),
                    line_old: None,
                    line_new: Some(new_line_num),
                    text: line.to_string(),
                });
                new_line_num += 1;
            } else if line.starts_with('-') {
                deletions += 1;
                diff_lines.push(GitDiffLine {
                    line_type: "remove".to_string(),
                    line_old: Some(old_line_num),
                    line_new: None,
                    text: line.to_string(),
                });
                old_line_num += 1;
            } else if line.starts_with(' ') || line.is_empty() {
                diff_lines.push(GitDiffLine {
                    line_type: "context".to_string(),
                    line_old: Some(old_line_num),
                    line_new: Some(new_line_num),
                    text: line.to_string(),
                });
                old_line_num += 1;
                new_line_num += 1;
            }
        }

        Ok(GitDiffResponse {
            is_git_repo: true,
            branch,
            files,
            active_file: active,
            diff_lines,
            stats: GitDiffStats {
                additions,
                deletions,
            },
            error: None,
        })
    })
    .await
    .map_err(|e| format!("Git diff task failed: {e}"))?
}
