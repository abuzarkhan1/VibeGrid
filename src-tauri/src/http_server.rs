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
        for port in requested..requested.saturating_add(5) {
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
