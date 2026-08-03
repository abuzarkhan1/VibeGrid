# VibeGrid — Developer Guide 🛠️

This guide explains how to set up, build, test, and contribute to VibeGrid.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or newer
- **Rust**: v1.75.0 or newer
- **Platform Build Tools**:
  - macOS: Xcode Command Line Tools (`xcode-select --install`)
  - Windows: Visual Studio C++ Build Tools
  - Linux: `build-essential libwebkit2gtk-4.1-dev libgtk-3-dev`

---

## 2. Project Architecture

VibeGrid uses a 3-layer architecture:

1. **Presentation Layer (Frontend)**: React 18, TypeScript, Vite, Tailwind CSS, xterm.js with `@xterm/addon-webgl` GPU rendering, and `allotment` for binary tree split layouts.
2. **Application Layer (Backend)**: Tauri 2 + Rust process managing PTY sessions (`portable-pty`), Tokio async runtime, 16ms output batching (`IpcBatcher`), and atomic workspace file persistence.
3. **OS Layer**: Native OS PTY subsystem (`/dev/pty` on Unix/macOS, `ConPTY` on Windows).

---

## 3. Building & Testing

```bash
# Install Node dependencies
npm install

# Run TypeScript type check
npx tsc --noEmit

# Run Rust unit tests
cd src-tauri && cargo test && cd ..

# Launch Tauri development server
npm run tauri dev

# Build production binary
npm run tauri build
```
