# Changelog

All notable changes to VibeGrid will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **POSIX installer script** (`scripts/install.sh`, served at `https://vibegrid.vercel.app/install.sh`) that detects OS/arch and downloads the matching release.
- **MCP port sync**: the desktop app persists the actually-bound HTTP port to `~/.vibegrid/port`, and the MCP stdio server reads it, so the tool stays correct even when 8792 falls back to a free port.
- **MCP auth token**: `/panes` now requires a per-launch bearer token (persisted to `~/.vibegrid/token` with 0600 permissions); responses are capped at 32 KB per pane; MCP requests time out after 5 s.
- **Auto-updater**: signed with a real ed25519 keypair (`~/.vibegrid/vibegrid-updater.key`), pubkey wired into `tauri.conf.json`, `active: true`, with CI signing + notarization secrets plumbed through `release.yml`.
- **Reassignable global shortcuts**: the system-wide summon and voice-toggle now live in the keybindings store and sync to the Rust backend via `set_global_summon`.
- **PTY lifecycle integration test** (spawn → write → read → kill → cleanup) plus AudioMeter/VAD unit tests.
- **CI**: typechecks and builds the marketing website; `Cargo.lock` committed for reproducible builds.

### Changed
- MCP output now matches the implementation (port 8792, `/panes` endpoint, `vibegrid_get_panes` tool).
- macOS hardened-runtime entitlements (JIT, unsigned executable memory, network client) + `LSApplicationCategoryType` + `minimumSystemVersion`.
- Windows release build installs CMake (whisper-rs dependency); release matrix drops Linux (not yet shipped) and adds Windows signing env vars.
- Platform-aware shell escaping: POSIX `'\''` vs PowerShell `''` vs raw cmd paste; fixed a bug where `/win/i` matched macOS `darwin`.
- Workspace IDs sanitized on the Rust side (path-safe charset) and made collision-proof on the frontend; `kill_pane` no longer holds the sessions lock during its exit wait.
- Website postcss bumped to 8.5.25 (audit: 2 → 1 high, remaining next.js advisories require a React 19 migration).
- **Brand identity**: green accent palette replaced with the azure-blue `oklch(0.66 0.16 252)` family across the marketing site and desktop app; unified styling using VibeGrid's `vg-*` CSS classes. Note: `VibeDark`'s ANSI green now renders azure (#3c95f0) by design, so colored `ls`/git output in the default theme is blue.

### Removed
- Removed ~137 stale build artifacts from `website/public` (hashed chunks, analytics scripts, and third-party artifacts).
- Removed one-off scratch files (`patch.js`, `remove_black.py`, `test_find.js`, `src-tauri/test_utf8`, `src-tauri/mcp_req.txt`).
- Dead code: duplicate `AppSettings` interface, unused `voice_is_recording` command, unused `isVoiceShortcut` helper, orphaned website CSS, unused npm deps.

## [0.1.0] - 2026-08-03

### Added
- **Core Architecture**: Initial release of VibeGrid using Tauri v2, Rust backend (`portable-pty`), React 18, TypeScript, and Vite.
- **GPU Terminal Engine**: Integrated `xterm.js` with `@xterm/addon-webgl` for GPU-accelerated 60 FPS rendering with automatic Canvas fallback.
- **IPC Batching**: 16ms interval output batching with 10MB backpressure high/low watermark control.
- **Dynamic Binary-Tree Multi-Pane Grid**: Support for 1 to 16 terminal panes with horizontal (`Cmd+D`) and vertical (`Cmd+Shift+D`) splits, Allotment resizer, focus tracking, and pane toolbars.
- **Terminal Operations**: Search overlay (`Cmd+F`), Clear terminal (`Cmd+K`), Copy selection (`Cmd+C`), Paste (`Cmd+V`), font size adjustment (`Cmd+Plus/Minus/0`), maximize/restore (`Cmd+Shift+Enter` & double-click).
- **Workspace System**: Multi-workspace creation (`Cmd+Shift+N`), workspace switching (`Cmd+Shift+Left/Right`), atomic Rust JSON file persistence, and background PTY session retention.
- **Command Palette & Settings**: Fuzzy search command palette (`Cmd+Shift+P`), tabbed Settings Modal (`Cmd+,`), 7 built-in themes (VibeDark, VibeLight, Midnight Blue, Solarized Dark, Solarized Light, Dracula, Nord), dynamic keybindings editor, Status bar, and About dialog.
