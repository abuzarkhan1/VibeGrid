use axum::{routing::get, Router, Json};
use serde::Serialize;
use std::sync::Arc;
use tokio::net::TcpListener;
use parking_lot::Mutex;
use std::collections::HashMap;
use tauri::async_runtime;

#[derive(Serialize)]
pub struct PaneState {
    pub id: String,
    pub output: String,
}

/// Default port for the MCP state API. Overridable with VIBEGRID_HTTP_PORT
/// (audit find 8: a hardcoded port silently killed the MCP tool when occupied,
/// with no way to point the `--mcp` stdio server at a different one).
pub fn http_port() -> u16 {
    std::env::var("VIBEGRID_HTTP_PORT")
        .ok()
        .and_then(|s| s.parse::<u16>().ok())
        .unwrap_or(8792)
}

/// The inclusive end of the port-fallback window. `saturating_add` already
/// clamps at u16::MAX, so VIBEGRID_HTTP_PORT near 65535 can never overflow
/// into a cryptic bind error (audit fix). Extracted for unit testing.
pub fn fallback_window_end(requested: u16) -> u16 {
    requested.saturating_add(5)
}

/// State file that records the port the running app actually bound, so the
/// `--mcp` stdio server (a separate process) can stay in sync even when the
/// default port was taken and the app fell back to the next free one.
fn port_state_file() -> Option<std::path::PathBuf> {
    let explicit = std::env::var("VIBEGRID_HOME").ok();
    let home = explicit
        .clone()
        .or_else(|| std::env::var("HOME").ok())
        .or_else(|| std::env::var("USERPROFILE").ok());
    let base = home?;
    let dir = if explicit.is_some() {
        std::path::PathBuf::from(base)
    } else {
        std::path::PathBuf::from(base).join(".vibegrid")
    };
    Some(dir.join("port"))
}

fn write_port_state(port: u16) {
    if let Some(path) = port_state_file() {
        if let Some(dir) = path.parent() {
            let _ = std::fs::create_dir_all(dir);
        }
        let _ = std::fs::write(path, port.to_string());
    }
}

/// The port recorded by the last running app instance, if any.
pub fn persisted_http_port() -> Option<u16> {
    let path = port_state_file()?;
    std::fs::read_to_string(path)
        .ok()
        .and_then(|s| s.trim().parse::<u16>().ok())
}

pub fn start_server(state: Arc<Mutex<HashMap<String, String>>>) {
    async_runtime::spawn(async move {
        let app = Router::new()
            .route("/panes", get({
                let state = state.clone();
                move || async move {
                    let map = state.lock();
                    let mut panes = Vec::new();
                    for (id, out) in map.iter() {
                        panes.push(PaneState {
                            id: id.clone(),
                            output: out.clone(),
                        });
                    }
                    Json(panes)
                }
            }));

        // Loopback-only (as before) + small port-fallback window so a collision
        // no longer kills the API silently — the actual port is printed so the
        // operator can point external MCP clients (or VIBEGRID_HTTP_PORT) at it.
        let requested = http_port();
        let mut bound = None;
        let mut last_err = None;
        // Clamp so the fallback window never exceeds u16::MAX (audit fix:
        // VIBEGRID_HTTP_PORT near 65535 used to produce a cryptic bind error).
        let window_end = fallback_window_end(requested);
        for port in requested..window_end {
            match TcpListener::bind(("127.0.0.1", port)).await {
                Ok(listener) => {
                    bound = Some((port, listener));
                    break;
                }
                Err(e) => last_err = Some(e),
            }
        }
        if let Some((port, listener)) = bound {
            write_port_state(port);
            println!("VibeGrid MCP state API listening on http://127.0.0.1:{port}");
            let _ = axum::serve(listener, app).await;
        } else {
            eprintln!("VibeGrid MCP state API failed to bind (tried {requested}..): {last_err:?}");
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The env var is process-global, so all override cases run inside a single
    /// test to avoid cross-test races when the test harness runs tests in parallel.
    #[test]
    fn http_port_env_override_cases() {
        // Unset → default.
        unsafe { std::env::remove_var("VIBEGRID_HTTP_PORT") };
        assert_eq!(http_port(), 8792);
        // Valid override → read.
        unsafe { std::env::set_var("VIBEGRID_HTTP_PORT", "9300") };
        assert_eq!(http_port(), 9300);
        // Garbage override → fall back to default.
        unsafe { std::env::set_var("VIBEGRID_HTTP_PORT", "not-a-port") };
        assert_eq!(http_port(), 8792);
        // Clean up so other tests see a pristine env.
        unsafe { std::env::remove_var("VIBEGRID_HTTP_PORT") };
    }

    #[test]
    fn fallback_window_clamps_at_u16_max() {
        // Near the top of the range the window must shrink, not overflow.
        assert_eq!(fallback_window_end(65533), u16::MAX);
        assert_eq!(fallback_window_end(65535), u16::MAX);
        // Normal range keeps the full 6-port window (requested..requested+5).
        assert_eq!(fallback_window_end(8792), 8797);
        assert_eq!(fallback_window_end(65530), 65535);
    }
}
