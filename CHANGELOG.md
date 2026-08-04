# Changelog

All notable changes to VibeGrid will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **POSIX installer script** (`scripts/install.sh`, served at `https://vibegrid.vercel.app/install.sh`) that detects OS/arch and downloads the matching release.
- **MCP port sync**: the desktop app persists the actually-bound HTTP port to `~/.vibegrid/port`, and the MCP stdio server reads it, so the tool stays correct even when 8792 falls back to a free port.

### Changed
- MCP output now matches the implementation (port 8792, `/panes` endpoint, `vibegrid_get_panes` tool).

### Removed
- Removed ~137 stale build artifacts from `website/public` (hashed chunks, analytics scripts, and a vendored third-party site directory that were served to production visitors).
- Removed one-off scratch files (`patch.js`, `remove_black.py`, `test_find.js`, `src-tauri/test_utf8`, `src-tauri/mcp_req.txt`).

## [0.1.0] - 2026-08-03

### Added
- **Core Architecture**: Initial release of VibeGrid using Tauri v2, Rust backend (`portable-pty`), React 18, TypeScript, and Vite.
- **GPU Terminal Engine**: Integrated `xterm.js` with `@xterm/addon-webgl` for GPU-accelerated 60 FPS rendering with automatic Canvas fallback.
- **IPC Batching**: 16ms interval output batching with 10MB backpressure high/low watermark control.
- **Dynamic Binary-Tree Multi-Pane Grid**: Support for 1 to 16 terminal panes with horizontal (`Cmd+D`) and vertical (`Cmd+Shift+D`) splits, Allotment resizer, focus tracking, and pane toolbars.
- **Terminal Operations**: Search overlay (`Cmd+F`), Clear terminal (`Cmd+K`), Copy selection (`Cmd+C`), Paste (`Cmd+V`), font size adjustment (`Cmd+Plus/Minus/0`), maximize/restore (`Cmd+Shift+Enter` & double-click).
- **Workspace System**: Multi-workspace creation (`Cmd+Shift+N`), workspace switching (`Cmd+Shift+Left/Right`), atomic Rust JSON file persistence, and background PTY session retention.
- **Command Palette & Settings**: Fuzzy search command palette (`Cmd+Shift+P`), tabbed Settings Modal (`Cmd+,`), 7 built-in themes (VibeDark, VibeLight, Midnight Blue, Solarized Dark, Solarized Light, Dracula, Nord), dynamic keybindings editor, Status bar, and About dialog.
