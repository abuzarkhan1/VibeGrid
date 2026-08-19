use serde_json::{json, Value};
use std::io::{self, BufRead, Write};
use std::time::Duration;

/// Query the VibeGrid HTTP server for pane state, with automatic fallback and per-launch bearer token auth.
fn fetch_panes_with_fallback() -> String {
    let primary_port = crate::http_server::persisted_http_port()
        .unwrap_or_else(crate::http_server::http_port);
    let token = crate::http_server::persisted_token();

    let send = |port: u16| -> Result<(String, bool), String> {
        let client = reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(5))
            .build()
            .map_err(|e| e.to_string())?;
        let mut req = client.get(format!("http://127.0.0.1:{port}/panes"));
        if let Some(tok) = &token {
            req = req.bearer_auth(tok);
        }
        match req.send() {
            Ok(res) => {
                let authorized = res.status().is_success();
                let text = res.text().unwrap_or_default();
                Ok((text, authorized))
            }
            Err(e) => Err(e.to_string()),
        }
    };

    match send(primary_port) {
        Ok((text, true)) => text,
        Ok((_, false)) => {
            let fallback = crate::http_server::http_port();
            if primary_port != fallback {
                send(fallback)
                    .map(|(t, _)| t)
                    .unwrap_or_else(|e| format!("Error connecting to VibeGrid: {e}"))
            } else {
                "Error connecting to VibeGrid: unauthorized".to_string()
            }
        }
        Err(e) => {
            let fallback = crate::http_server::http_port();
            if primary_port != fallback {
                send(fallback)
                    .map(|(t, _)| t)
                    .unwrap_or_else(|_| format!("Error connecting to VibeGrid: {e}"))
            } else {
                format!("Error connecting to VibeGrid: {e}")
            }
        }
    }
}

/// Build the JSON-RPC response (or `None` when there is no response, e.g. a
/// notification) for one incoming line. Extracted into a pure function so the
/// protocol logic is unit-testable without a stdio pipe (audit: Rust tests for
/// the MCP server were missing).
fn respond_to(line: &str) -> Option<Value> {
    let req: Value = serde_json::from_str(line).ok()?;
    let method = req.get("method").and_then(|m| m.as_str())?;
    let id = req.get("id").cloned();

    match method {
        "initialize" => {
            let id = id?;
            Some(json!({
                "jsonrpc": "2.0",
                "id": id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": { "tools": {} },
                    "serverInfo": { "name": "vibegrid", "version": env!("CARGO_PKG_VERSION") }
                }
            }))
        }
        "notifications/initialized" => None,
        "tools/list" => {
            let id = id?;
            Some(json!({
                "jsonrpc": "2.0",
                "id": id,
                "result": {
                    "tools": [
                        {
                            "name": "vibegrid_get_panes",
                            "description": "Get the output and state of all active terminal panes in VibeGrid",
                            "inputSchema": { "type": "object", "properties": {} }
                        }
                    ]
                }
            }))
        }
        "tools/call" => {
            let id = id?;
            let tool_name = req
                .get("params")
                .and_then(|p| p.get("name"))
                .and_then(|n| n.as_str())
                .unwrap_or("");
            if tool_name == "vibegrid_get_panes" {
                let text = fetch_panes_with_fallback();
                Some(json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "result": {
                        "content": [{ "type": "text", "text": text }]
                    }
                }))
            } else {
                Some(json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "error": { "code": -32601, "message": "Method not found" }
                }))
            }
        }
        _ => {
            let id = id?;
            Some(json!({
                "jsonrpc": "2.0",
                "id": id,
                "error": { "code": -32601, "message": "Method not found" }
            }))
        }
    }
}

pub fn run_mcp_stdio_server() {
    let stdin = io::stdin();
    let mut stdout = io::stdout();

    for line in stdin.lock().lines().map_while(Result::ok) {
        if let Some(res) = respond_to(&line) {
            let _ = writeln!(stdout, "{res}");
            let _ = stdout.flush();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn initialize_reports_server_info() {
        let res = respond_to(r#"{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}"#)
            .expect("initialize should respond");
        assert_eq!(res["id"], 1);
        assert_eq!(res["result"]["serverInfo"]["name"], "vibegrid");
        assert_eq!(res["result"]["protocolVersion"], "2024-11-05");
        // Audit: the version must come from the crate, not a hardcoded string.
        assert_eq!(res["result"]["serverInfo"]["version"], env!("CARGO_PKG_VERSION"));
    }

    #[test]
    fn initialized_notification_is_silent() {
        assert_eq!(
            respond_to(r#"{"jsonrpc":"2.0","method":"notifications/initialized"}"#),
            None
        );
    }

    #[test]
    fn tools_list_exposes_get_panes() {
        let res = respond_to(r#"{"jsonrpc":"2.0","id":2,"method":"tools/list"}"#)
            .expect("tools/list should respond");
        let tools = res["result"]["tools"].as_array().unwrap();
        assert_eq!(tools.len(), 1);
        assert_eq!(tools[0]["name"], "vibegrid_get_panes");
    }

    #[test]
    fn unknown_method_returns_error() {
        let res = respond_to(r#"{"jsonrpc":"2.0","id":3,"method":"bogus/method"}"#).unwrap();
        assert_eq!(res["error"]["code"], -32601);
    }

    #[test]
    fn malformed_line_is_ignored() {
        assert_eq!(respond_to("not json at all"), None);
    }
}
