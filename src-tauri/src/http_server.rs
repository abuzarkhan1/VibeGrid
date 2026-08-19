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

const MCP_OUTPUT_CAP_BYTES: usize = 32 * 1024;

pub fn http_port() -> u16 {
    std::env::var("VIBEGRID_HTTP_PORT")
        .ok()
        .and_then(|s| s.parse::<u16>().ok())
        .unwrap_or(8792)
}

pub fn fallback_window_end(requested: u16) -> u16 {
    requested.saturating_add(5)
}

fn state_dir() -> Option<std::path::PathBuf> {
    crate::utils::paths::get_app_data_dir()
}

fn port_state_file() -> Option<std::path::PathBuf> {
    Some(state_dir()?.join("port"))
}

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

pub fn write_token_state(token: &str) {
    use std::io::Write;
    if let Some(path) = token_state_file() {
        if let Some(dir) = path.parent() {
            let _ = std::fs::create_dir_all(dir);
        }
        #[cfg(unix)]
        {

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

        let _ = std::fs::write(&path, token);
    }
}

pub fn persisted_http_port() -> Option<u16> {
    let path = port_state_file()?;
    std::fs::read_to_string(path)
        .ok()
        .and_then(|s| s.trim().parse::<u16>().ok())
}

pub fn persisted_token() -> Option<String> {
    let path = token_state_file()?;
    let token = std::fs::read_to_string(path).ok()?;
    let token = token.trim().to_string();
    if token.is_empty() { None } else { Some(token) }
}

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
            output: crate::utils::utf8::tail_utf8(out, MCP_OUTPUT_CAP_BYTES).to_string(),
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

        let requested = http_port();
        let mut bound = None;
        let mut last_err = None;

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

    #[test]
    fn http_port_env_override_cases() {

        unsafe { std::env::remove_var("VIBEGRID_HTTP_PORT") };
        assert_eq!(http_port(), 8792);

        unsafe { std::env::set_var("VIBEGRID_HTTP_PORT", "9300") };
        assert_eq!(http_port(), 9300);

        unsafe { std::env::set_var("VIBEGRID_HTTP_PORT", "not-a-port") };
        assert_eq!(http_port(), 8792);

        unsafe { std::env::remove_var("VIBEGRID_HTTP_PORT") };
    }

    #[test]
    fn fallback_window_clamps_at_u16_max() {

        assert_eq!(fallback_window_end(65533), u16::MAX);
        assert_eq!(fallback_window_end(65535), u16::MAX);

        assert_eq!(fallback_window_end(8792), 8797);
        assert_eq!(fallback_window_end(65530), 65535);
    }

    #[test]
    fn token_state_roundtrips() {

        let home = std::env::temp_dir().join(format!("vg-token-test-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&home);
        std::env::set_var("VIBEGRID_HOME", &home);

        assert_eq!(persisted_token(), None);
        write_token_state("tok-abc-123");
        assert_eq!(persisted_token().as_deref(), Some("tok-abc-123"));

        let path = token_state_file().unwrap();
        std::fs::write(&path, "  tok-with-space  ").unwrap();
        assert_eq!(persisted_token().as_deref(), Some("tok-with-space"));

        std::fs::write(&path, "").unwrap();
        assert_eq!(persisted_token(), None);

        let _ = std::fs::remove_dir_all(&home);
        unsafe { std::env::remove_var("VIBEGRID_HOME") };
    }

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

            let (status, _) = panes_handler(HeaderMap::new(), state.clone(), token.clone()).await;
            assert_eq!(status, StatusCode::UNAUTHORIZED);

            let mut wrong = HeaderMap::new();
            wrong.insert(AUTHORIZATION, "Bearer nope".parse().unwrap());
            let (status, _) = panes_handler(wrong, state.clone(), token.clone()).await;
            assert_eq!(status, StatusCode::UNAUTHORIZED);

            let mut ok = HeaderMap::new();
            ok.insert(AUTHORIZATION, format!("Bearer {token}").parse().unwrap());
            let (status, body) = panes_handler(ok, state.clone(), token.clone()).await;
            assert_eq!(status, StatusCode::OK);
            let panes = body.0;
            assert_eq!(panes.len(), 2);
            let big_pane = panes.iter().find(|p| p.id == "pane-1").unwrap();
            assert!(big_pane.output.len() <= MCP_OUTPUT_CAP_BYTES + 4);
            assert!(big_pane.output.ends_with("f") || big_pane.output.ends_with("0"));
            let short_pane = panes.iter().find(|p| p.id == "pane-2").unwrap();
            assert_eq!(short_pane.output, "short");
        });
    }

    #[test]
    fn tail_keeps_last_bytes_without_splitting_utf8() {
        use crate::utils::utf8::tail_utf8 as tail;
        let s = "hello wörld ünïcode";
        assert_eq!(tail(s, 1000), s);
        let t = tail(s, 6);
        assert!(t.len() <= 6 + 3);
        assert!(t.ends_with("ö") || t.ends_with("ü") || t.ends_with('e') || t.ends_with(' '));

        assert!(s.ends_with(t));

        assert_eq!(tail("abcdefgh", 4), "efgh");
    }
}
