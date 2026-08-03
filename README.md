# VibeGrid ⚡

> **The free, open-source, GPU-accelerated multi-pane terminal workspace for Mac and Windows.**

VibeGrid is a high-performance desktop application designed for developers orchestrating multiple shells and AI coding agents in parallel. Built with **Tauri 2**, **Rust**, **React**, **TypeScript**, and **xterm.js with WebGL GPU rendering**, VibeGrid delivers sub-10ms keystroke latency, 60 FPS streaming, and dynamic binary-tree multi-pane multiplexing for 1 to 16 panes.

---

## Key Features

- **🚀 Native & Lean**: Built on Tauri v2 + Rust backend. Minimal RAM footprint (<400MB at 16 panes).
- **⚡ GPU-Accelerated**: Powered by WebGL rendering via xterm.js (with automatic Canvas fallback).
- **🔀 Dynamic Pane Grid (1–16 Panes)**: Split horizontally (`Cmd/Ctrl+D`), vertically (`Cmd/Ctrl+Shift+D`), or close (`Cmd/Ctrl+W`). Never forced to a fixed grid layout.
- **⚡ 16ms IPC Batching**: Low-overhead output streaming with backpressure control via portable-pty.
- **⌨️ Keyboard-First**: Seamless navigation (`Cmd/Ctrl+Arrows`), pane maximize (`Cmd/Ctrl+Shift+Enter`), and fuzzy Command Palette (`Cmd/Ctrl+Shift+P`).
- **🎨 Theme System**: Includes VibeDark, Dracula, Solarized Dark themes.

---

## Tech Stack

- **Backend**: Rust, Tauri v2, `portable-pty`, `tokio`, `serde`, `parking_lot`
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Terminal Engine**: `@xterm/xterm`, `@xterm/addon-webgl`, `@xterm/addon-fit`, `@xterm/addon-search`, `@xterm/addon-web-links`
- **Layout Engine**: `allotment` with recursive binary-tree renderer
- **State Management**: `zustand`

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/) (v1.75+)
- Xcode Command Line Tools (macOS) or Visual Studio Build Tools (Windows)

### Installation & Running Locally

1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Run in development mode with Tauri v2:
   ```bash
   npm run tauri dev
   ```

3. Build production binary:
   ```bash
   npm run tauri build
   ```

---

## License

[MIT License](LICENSE) — Free and open source forever.
