use serde_json::{json, Value};
use std::io::{self, BufRead, Write};

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
                    "serverInfo": { "name": "vibegrid", "version": "0.1.0" }
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
                // Make HTTP request to VibeGrid (audit find 8:
                // share the port override with the app so both
                // sides stay in sync). Prefer the port the app
                // actually bound (persisted on launch); if that
                // is stale (app restarted/crashed) retry once
                // against VIBEGRID_HTTP_PORT / the default.
                let port = crate::http_server::persisted_http_port()
                    .unwrap_or_else(crate::http_server::http_port);
                let send = |port: u16| {
                    let client = reqwest::blocking::Client::new();
                    client
                        .get(format!("http://127.0.0.1:{port}/panes"))
                        .send()
                        .and_then(|res| res.text())
                };
                let text = match send(port) {
                    Ok(t) => t,
                    Err(e) => {
                        let fallback = crate::http_server::http_port();
                        if port != fallback {
                            send(fallback)
                                .unwrap_or_else(|_| format!("Error connecting to VibeGrid: {e}"))
                        } else {
                            format!("Error connecting to VibeGrid: {e}")
                        }
                    }
                };
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
