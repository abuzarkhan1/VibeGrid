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

        if let Ok(listener) = TcpListener::bind("127.0.0.1:8792").await {
            println!("VibeGrid MCP state API listening on http://127.0.0.1:8792");
            let _ = axum::serve(listener, app).await;
        } else {
            eprintln!("Failed to bind VibeGrid state API on 8792");
        }
    });
}
