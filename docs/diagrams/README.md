# VibeGrid — Diagrams

Excalidraw diagrams covering the VibeGrid desktop app and its release pipeline.
Open any file by dragging it into https://excalidraw.com or the **Excalidraw**
VS Code extension (File → Open).

| File | Type | What it shows |
|------|------|---------------|
| `01-vibegrid-system-architecture.excalidraw` | Architecture | Frontend (React/xterm/Zustand) → Tauri IPC → Rust services (PtyManager, IpcBatcher, WorkspaceManager, SpeechManager, HTTP/MCP) → external systems (shell, HuggingFace, MCP clients, disk) |
| `02-voice-to-terminal-flow.excalidraw` | Flowchart | Mic capture (cpal) → silence detection → Whisper transcribe (model size/language) → dictation-result event → text injected into the focused pane, incl. manual Enter/Esc paths |
| `03-pty-data-flow-sequence.excalidraw` | Sequence | Keystroke round trip: xterm → write_to_pty → PTY master → shell → reader → IpcBatcher → terminal-batch event → render; notes on resize, pane_snapshot, exit, backpressure |
| `04-workspace-persistence-er.excalidraw` | ER | WorkspaceData entity (layout JSON, overrides, emoji, archived), PaneNode tree (Terminal/Split), PTY session FK, atomic JSON storage on disk |
| `05-frontend-state-dataflow.excalidraw` | DFD | User → UI components → tauri.ts bridge → Tauri backend, with Zustand stores as the data store; appearance cascade (global → workspace → pane) |
| `06-website-marketing-mindmap.excalidraw` | Mind map | Marketing site structure: pages, layout, hero/motion, interactive sections, distribution |
| `07-ci-cd-release-pipeline.excalidraw` | Flowchart | GitHub Actions CI checks → release matrix (macOS universal DMG, Ubuntu deb/rpm/AppImage, Windows NSIS/MSI) → tauri-action bundling → GitHub Release + checksums |

## Viewing

1. Visit https://excalidraw.com
2. Drag and drop the `.excalidraw` file onto the canvas
3. Or File → Open in the Excalidraw VS Code extension

All files use Excalidraw v2 format (JSON), unique element ids, and the
Excalifont font family for text.
