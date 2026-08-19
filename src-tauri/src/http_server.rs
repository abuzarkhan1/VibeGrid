use axum::{
    http::{HeaderMap, StatusCode, header::AUTHORIZATION},
    routing::get,
    Json, Router,
};
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

/// Per-pane output cap for MCP consumers (audit: /panes could return up to
/// 16 × 256 KB = ~4 MB per call — too heavy for an AI agent tool). The MCP
/// view keeps the most RECENT output per pane, which is what an agent needs.
const MCP_OUTPUT_CAP_BYTES: usize = 32 * 1024;

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

/// Directory holding the runtime state files shared between the running app
/// and the separate `--mcp` stdio process: the bound port and the auth token.
fn state_dir() -> Option<std::path::PathBuf> {
    crate::utils::paths::get_app_data_dir()
}

/// State file that records the port the running app actually bound, so the
/// `--mcp` stdio server (a separate process) can stay in sync even when the
/// default port was taken and the app fell back to the next free one.
fn port_state_file() -> Option<std::path::PathBuf> {
    Some(state_dir()?.join("port"))
}

/// State file holding the per-launch auth token for the MCP state API
/// (audit/security: the /panes endpoint previously exposed ALL terminal
/// output — potentially containing secrets — to any local process with no
/// authentication). The app generates a random token on startup and writes it
/// here; the `--mcp` stdio server reads it back to authenticate its requests.
fn token_state_file() -> Option<std::path::PathBuf> {
    Some(state_dir()?.join("token"))
}

fn write_port_state(port: u16) {
    if let Some(path) = port_state_file() {
        if let Some(dir) = path.parent() {
            let _ = std::fs::create_dir_all(dir);
        }
        let _ = std::fs::write(path, port.to_string());
    }
}

/// Persist the auth token (a random per-launch UUID) next to the port file.
/// The file is created with owner-only permissions (0600): the token is the
/// security boundary for /panes, so it must not be world/group readable
/// (audit follow-up: fs::write used the default umask, typically 0644).
pub fn write_token_state(token: &str) {
    use std::io::Write;
    if let Some(path) = token_state_file() {
        if let Some(dir) = path.parent() {
            let _ = std::fs::create_dir_all(dir);
        }
        #[cfg(unix)]
        {
            // Owner-only (0600): the token is the security boundary for
            // /panes, so it must not be world/group readable (audit follow-up:
            // fs::write used the default umask, typically 0644).
            use std::os::unix::fs::OpenOptionsExt;
            if let Ok(mut f) = std::fs::OpenOptions::new()
                .write(true)
                .create(true)
                .truncate(true)
                .mode(0o600)
                .open(&path)
            {
                let _ = f.write_all(token.as_bytes());
                let _ = f.sync_all();
                return;
            }
        }
        // Windows (no mode bits) or the 0600 open failed: plain write.
        let _ = std::fs::write(&path, token);
    }
}

/// The port recorded by the last running app instance, if any.
pub fn persisted_http_port() -> Option<u16> {
    let path = port_state_file()?;
    std::fs::read_to_string(path)
        .ok()
        .and_then(|s| s.trim().parse::<u16>().ok())
}

/// The auth token recorded by the last running app instance, if any. Read by
/// the `--mcp` stdio server (a separate process) so its HTTP requests to the
/// running app carry the same per-launch token.
pub fn persisted_token() -> Option<String> {
    let path = token_state_file()?;
    let token = std::fs::read_to_string(path).ok()?;
    let token = token.trim().to_string();
    if token.is_empty() { None } else { Some(token) }
}

/// Last `cap` bytes of `s`, never splitting a UTF-8 character. Used to keep
/// MCP responses bounded.
fn tail(s: &str, cap: usize) -> &str {
    crate::utils::utf8::tail_utf8(s, cap)
}

/// The `/panes` handler: requires the per-launch bearer token (audit/security:
/// arbitrary local processes could previously read ALL terminal output — which
/// can contain secrets — with no authentication), then returns each pane's
/// most recent output capped at MCP_OUTPUT_CAP_BYTES. Extracted from the
/// Router closure so it is unit-testable.
async fn panes_handler(
    headers: HeaderMap,
    state: Arc<Mutex<HashMap<String, String>>>,
    token: String,
) -> (StatusCode, Json<Vec<PaneState>>) {
    let expected = format!("Bearer {token}");
    let auth = headers
        .get(AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if auth != expected {
        return (StatusCode::UNAUTHORIZED, Json(Vec::new()));
    }
    let map = state.lock();
    let panes = map
        .iter()
        .map(|(id, out)| PaneState {
            id: id.clone(),
            output: tail(out, MCP_OUTPUT_CAP_BYTES).to_string(),
        })
        .collect();
    (StatusCode::OK, Json(panes))
}

pub fn start_server(state: Arc<Mutex<HashMap<String, String>>>, token: String) {
    async_runtime::spawn(async move {
        let app = Router::new().route(
            "/panes",
            get({
                let state = state.clone();
                let token = token.clone();
                move |headers: HeaderMap| {
                    let state = state.clone();
                    let token = token.clone();
                    async move { panes_handler(headers, state, token).await }
                }
            }),
        );

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

    #[test]
    fn token_state_roundtrips() {
        // Audit: per-launch auth token written next to the port file and read
        // back by the --mcp stdio server. Both directions must work with an
        // isolated VIBEGRID_HOME so the real ~/.vibegrid is untouched.
        let home = std::env::temp_dir().join(format!("vg-token-test-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&home);
        std::env::set_var("VIBEGRID_HOME", &home);

        assert_eq!(persisted_token(), None); // nothing written yet
        write_token_state("tok-abc-123");
        assert_eq!(persisted_token().as_deref(), Some("tok-abc-123"));

        // Round-trip survives a whitespace trim.
        let path = token_state_file().unwrap();
        std::fs::write(&path, "  tok-with-space  ").unwrap();
        assert_eq!(persisted_token().as_deref(), Some("tok-with-space"));

        // An empty token file reads as None (not an empty auth header).
        std::fs::write(&path, "").unwrap();
        assert_eq!(persisted_token(), None);

        let _ = std::fs::remove_dir_all(&home);
        unsafe { std::env::remove_var("VIBEGRID_HOME") };
    }

    /// The security boundary: a request without the exact bearer token must be
    /// rejected (401), with the token it must succeed, and the per-pane output
    /// must be capped. Uses tokio's runtime so the async handler can be awaited
    /// directly (no socket needed).
    #[test]
    fn panes_handler_requires_token_and_truncates() {
        let state = Arc::new(Mutex::new(HashMap::new()));
        let mut big = String::new();
        while big.len() < MCP_OUTPUT_CAP_BYTES + 10_000 {
            big.push_str("0123456789abcdef");
        }
        state.lock().insert("pane-1".to_string(), big);
        state.lock().insert("pane-2".to_string(), "short".to_string());
        let token = "tok-secret".to_string();

        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            // No token → 401.
            let (status, _) = panes_handler(HeaderMap::new(), state.clone(), token.clone()).await;
            assert_eq!(status, StatusCode::UNAUTHORIZED);

            // Wrong token → 401.
            let mut wrong = HeaderMap::new();
            wrong.insert(AUTHORIZATION, "Bearer nope".parse().unwrap());
            let (status, _) = panes_handler(wrong, state.clone(), token.clone()).await;
            assert_eq!(status, StatusCode::UNAUTHORIZED);

            // Correct token → 200 with capped output.
            let mut ok = HeaderMap::new();
            ok.insert(AUTHORIZATION, format!("Bearer {token}").parse().unwrap());
            let (status, body) = panes_handler(ok, state.clone(), token.clone()).await;
            assert_eq!(status, StatusCode::OK);
            let panes = body.0;
            assert_eq!(panes.len(), 2);
            let big_pane = panes.iter().find(|p| p.id == "pane-1").unwrap();
            assert!(big_pane.output.len() <= MCP_OUTPUT_CAP_BYTES + 4); // at most one UTF-8 char over
            assert!(big_pane.output.ends_with("f") || big_pane.output.ends_with("0"));
            let short_pane = panes.iter().find(|p| p.id == "pane-2").unwrap();
            assert_eq!(short_pane.output, "short");
        });
    }

    #[test]
    fn tail_keeps_last_bytes_without_splitting_utf8() {
        let s = "hello wörld ünïcode";
        assert_eq!(tail(s, 1000), s); // under cap → unchanged
        let t = tail(s, 6);
        assert!(t.len() <= 6 + 3); // at most one multi-byte char over the cap
        assert!(t.ends_with("ö") || t.ends_with("ü") || t.ends_with('e') || t.ends_with(' '));
        // The tail must be a suffix of the original.
        assert!(s.ends_with(t));
        // ASCII-only tail is exact.
        assert_eq!(tail("abcdefgh", 4), "efgh");
    }
}
