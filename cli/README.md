# VibeGrid CLI

![npm version](https://img.shields.io/npm/v/vibegrid)
![license](https://img.shields.io/npm/l/vibegrid)

> The official command-line interface for **VibeGrid** — a modern, AI-ready desktop terminal multiplexer built with Tauri 2 and Rust.

VibeGrid CLI helps you effortlessly install, manage, and launch the VibeGrid desktop application. It also provides built-in integration with the **Model Context Protocol (MCP)**, allowing AI agents to seamlessly read the state of your terminal panes.

## Installation

Install the CLI globally via npm:

```bash
npm install -g vibegrid
```

## Getting Started

To download and install the VibeGrid desktop application on your machine, simply run:

```bash
vibegrid install
```

This will automatically detect your OS (macOS or Windows) and architecture, download the latest release, and set it up for you.

To launch the app after installation, use:

```bash
vibegrid open
```
*(You can also just run `vibegrid` without any arguments to launch the app).*

## Command Reference

| Command | Description |
|---------|-------------|
| `vibegrid` | Launch the desktop app (will prompt to install if missing) |
| `vibegrid install` | Download & install the latest release for your OS/arch |
| `vibegrid open` | Launch the desktop app |
| `vibegrid --mcp` | Print MCP connection information for AI agents |
| `vibegrid --mcp-serve` | Run the MCP stdio server (bridges to a running VibeGrid) |
| `vibegrid --version` | Print the installed CLI version |
| `vibegrid help` | Show help and usage instructions |

## AI Integration (Model Context Protocol)

VibeGrid is built to work alongside AI agents. By utilizing the Model Context Protocol (MCP), agents can securely read the current output of all your active terminal panes, giving them unprecedented context of your development environment.

### How it works:

VibeGrid exposes a tool called `vibegrid_get_panes` which returns the current stdout/stderr of your active terminal sessions. You can connect your AI agent using two methods:

#### 1. STDIO Server (Recommended for Desktop Agents)
Add the following to your MCP client configuration (e.g., Claude Desktop's `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "vibegrid": {
      "command": "vibegrid",
      "args": ["--mcp-serve"]
    }
  }
}
```
*Note: The VibeGrid desktop app must be running for this to work.*

#### 2. Local HTTP API
VibeGrid also runs a local HTTP server exposing its state. 
You can view the connection info, port, and API endpoints by running:
```bash
vibegrid --mcp
```

## Contributing

See the [main repository](https://github.com/abuzarkhan1/VibeGrid) for details on contributing to VibeGrid.

## License

[MIT](LICENSE)
