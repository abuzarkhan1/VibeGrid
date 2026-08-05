// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn print_version() {
    println!("VibeGrid {}", env!("CARGO_PKG_VERSION"));
}

fn print_help() {
    println!("VibeGrid {} — free, open-source GPU-accelerated terminal workspace", env!("CARGO_PKG_VERSION"));
    println!();
    println!("USAGE:");
    println!("  vibegrid                 Launch the desktop app");
    println!("  vibegrid --mcp           Run the MCP stdio server (streams JSON-RPC over stdin/stdout)");
    println!("  vibegrid --mcp-serve     Alias for --mcp");
    println!("  vibegrid --version       Print the app version");
    println!("  vibegrid --help          Show this help");
    println!();
    println!("While the app is running, terminal state is exposed over MCP:");
    println!("  http://127.0.0.1:8792/panes  (falls back to the next free port if busy)");
    println!("Port override: VIBEGRID_HTTP_PORT=<port>");
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.iter().any(|arg| arg == "--mcp" || arg == "--mcp-serve") {
        vibegrid::mcp_server::run_mcp_stdio_server();
    } else if args.iter().any(|arg| arg == "--version" || arg == "-v") {
        print_version();
    } else if args.iter().any(|arg| arg == "--help" || arg == "-h" || arg == "help") {
        print_help();
    } else {
        vibegrid::run();
    }
}
