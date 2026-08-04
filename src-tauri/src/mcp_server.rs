use serde_json::{json, Value};
use std::io::{self, BufRead, Write};

pub fn run_mcp_stdio_server() {
    let stdin = io::stdin();
    let mut stdout = io::stdout();

    for line in stdin.lock().lines() {
        if let Ok(line) = line {
            if let Ok(req) = serde_json::from_str::<Value>(&line) {
                if let Some(method) = req.get("method").and_then(|m| m.as_str()) {
                    let id = req.get("id");
                    
                    match method {
                        "initialize" => {
                            if let Some(id) = id {
                                let res = json!({
                                    "jsonrpc": "2.0",
                                    "id": id,
                                    "result": {
                                        "protocolVersion": "2024-11-05",
                                        "capabilities": {
                                            "tools": {}
                                        },
                                        "serverInfo": {
                                            "name": "vibegrid",
                                            "version": "0.1.0"
                                        }
                                    }
                                });
                                writeln!(stdout, "{}", res).unwrap();
                                stdout.flush().unwrap();
                            }
                        }
                        "notifications/initialized" => {
                            // Do nothing
                        }
                        "tools/list" => {
                            if let Some(id) = id {
                                let res = json!({
                                    "jsonrpc": "2.0",
                                    "id": id,
                                    "result": {
                                        "tools": [
                                            {
                                                "name": "vibegrid_get_panes",
                                                "description": "Get the output and state of all active terminal panes in VibeGrid",
                                                "inputSchema": {
                                                    "type": "object",
                                                    "properties": {}
                                                }
                                            }
                                        ]
                                    }
                                });
                                writeln!(stdout, "{}", res).unwrap();
                                stdout.flush().unwrap();
                            }
                        }
                        "tools/call" => {
                            if let Some(id) = id {
                                let tool_name = req.get("params").and_then(|p| p.get("name")).and_then(|n| n.as_str()).unwrap_or("");
                                
                                if tool_name == "vibegrid_get_panes" {
                                    // Make HTTP request to VibeGrid (audit find 8:
                                    // share the port override with the app so both
                                    // sides stay in sync). Prefer the port the app
                                    // actually bound (persisted on launch); if that
                                    // is stale (app restarted/crashed) retry once
                                    // against VIBEGRID_HTTP_PORT / the default.
                                    let mut port = crate::http_server::persisted_http_port()
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
                                                match send(fallback) {
                                                    Ok(t) => {
                                                        port = fallback;
                                                        t
                                                    }
                                                    Err(_) => format!("Error connecting to VibeGrid: {}", e),
                                                }
                                            } else {
                                                format!("Error connecting to VibeGrid: {}", e)
                                            }
                                        }
                                    };
                                    
                                    let res = json!({
                                        "jsonrpc": "2.0",
                                        "id": id,
                                        "result": {
                                            "content": [
                                                {
                                                    "type": "text",
                                                    "text": text
                                                }
                                            ]
                                        }
                                    });
                                    writeln!(stdout, "{}", res).unwrap();
                                    stdout.flush().unwrap();
                                } else {
                                    let res = json!({
                                        "jsonrpc": "2.0",
                                        "id": id,
                                        "error": {
                                            "code": -32601,
                                            "message": "Method not found"
                                        }
                                    });
                                    writeln!(stdout, "{}", res).unwrap();
                                    stdout.flush().unwrap();
                                }
                            }
                        }
                        _ => {
                            if let Some(id) = id {
                                let res = json!({
                                    "jsonrpc": "2.0",
                                    "id": id,
                                    "error": {
                                        "code": -32601,
                                        "message": "Method not found"
                                    }
                                });
                                writeln!(stdout, "{}", res).unwrap();
                                stdout.flush().unwrap();
                            }
                        }
                    }
                }
            }
        }
    }
}
