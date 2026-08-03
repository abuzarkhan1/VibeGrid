# VibeGrid — Tech Stack & Architecture
## Exact BridgeSpace Technology Replication

---

## 1. Technology Selection Philosophy

This document defines the complete technology stack for VibeGrid. Every
technology choice is made to exactly replicate the architecture used by
BridgeSpace, as described on their website: "Native, not Electron. Built with
Tauri 2 and Rust — a lean desktop binary that starts fast on macOS, Windows,
and Linux."

VibeGrid will use the identical core technologies. No substitutions. No
alternatives. The goal is to produce an application that is architecturally
indistinguishable from BridgeSpace's terminal grid.

---

## 2. Core Framework: Tauri 2

### 2.1 What is Tauri?
Tauri is a framework for building desktop applications using web technologies
for the frontend and Rust for the backend. It is the direct competitor to
Electron, but with fundamental architectural differences:

Electron bundles the entire Chromium browser engine and Node.js runtime into
every application. This results in large binary sizes (150-300 MB), high memory
usage (100-200 MB idle), and slow startup times (2-5 seconds).

Tauri uses the operating system's native WebView component for rendering and a
compiled Rust binary for the backend. This results in small binary sizes (5-15 MB),
low memory usage (30-80 MB idle), and fast startup times (under 1 second).

### 2.2 Why Tauri 2 Specifically?
BridgeSpace explicitly states it uses Tauri 2, not Tauri 1. Tauri 2 is the
latest major version and includes significant improvements:

- Stable API with long-term support commitments
- Improved security model with fine-grained permission system
- Better IPC performance with reduced serialization overhead
- Support for mobile targets (iOS, Android) for future expansion
- Enhanced window management APIs
- Native support for system tray, notifications, and global shortcuts
- Improved WebView2 integration on Windows
- Better WKWebView integration on macOS

### 2.3 Tauri's Role in VibeGrid
In VibeGrid, Tauri serves as the bridge between the frontend and backend:

**Window Management:** Tauri creates and manages the application window. It
handles window creation, sizing, positioning, minimization, maximization, and
closing. It manages the window's title bar, traffic lights (on macOS), and
system menu.

**IPC Bridge:** Tauri provides the communication channel between the frontend
(JavaScript/TypeScript running in the WebView) and the backend (Rust running as
a native process). This channel supports both command-style calls (frontend
requests an action from the backend) and event-style notifications (backend
pushes data to the frontend).

**Plugin System:** Tauri provides a plugin system for common desktop functionality:
file dialogs, clipboard access, global shortcuts, auto-start, notifications,
and system tray integration.

**Security Model:** Tauri enforces a permission-based security model. The
frontend cannot access system resources (file system, network, processes) unless
explicitly granted permission in the Tauri configuration. This prevents
accidental or malicious access to sensitive system resources.

**Bundling:** Tauri handles the packaging of the application into platform-
specific installers. On macOS, it produces a .dmg disk image. On Windows, it
produces an .msi installer or .exe executable. On Linux, it produces .deb, .rpm,
or .AppImage packages.

### 2.4 Tauri Configuration
VibeGrid's Tauri configuration will define:

**Application Identity:**
- Product Name: VibeGrid
- Version: Starting at 0.1.0
- Identifier: com.vibegrid.app (reverse domain notation)
- Author: VibeGrid Open Source Community

**Window Configuration:**
- Default window size: 1400 x 900 pixels
- Minimum window size: 800 x 600 pixels
- Resizable: Yes
- Fullscreen: No (user can toggle)
- Decorations: Yes (native title bar)
- Transparent: No
- Center on screen at launch: Yes

**Security Configuration:**
- Content Security Policy: Restrict scripts and styles to self-origin only
- No external network access from WebView
- No file system access from WebView (all file operations go through Rust)
- No shell access from WebView (all process operations go through Rust)

**Build Configuration:**
- Frontend build command: Standard Vite build
- Development server URL: localhost on port 1420
- Output directory: dist/

**Bundle Configuration:**
- Targets: All supported platforms
- Icons: Multiple sizes for macOS, Windows, and Linux
- macOS minimum version: 10.15 (Catalina)
- Windows WebView2 installation: Download bootstrapper if not present

---

## 3. Backend Language: Rust

### 3.1 Why Rust?
BridgeSpace uses Rust for its backend, and VibeGrid will do the same. Rust is
the ideal language for this application because:

**Memory Safety Without Garbage Collection:** Rust's ownership system prevents
memory errors (null pointer dereferences, use-after-free, data races) at compile
time. This is critical for a long-running application that manages multiple
concurrent processes. A memory leak in a terminal manager could cause the
application to consume increasing amounts of RAM over hours of use. Rust
eliminates this class of bugs entirely.

**Zero-Cost Abstractions:** Rust's abstractions (traits, generics, iterators)
compile down to the same machine code as hand-written C. There is no runtime
overhead. This means VibeGrid's PTY management, IPC batching, and configuration
parsing all run at maximum speed.

**Fearless Concurrency:** Rust's type system prevents data races at compile time.
VibeGrid's backend must handle 16 concurrent PTY read loops, an IPC batching
timer, and configuration management simultaneously. Rust's ownership model
ensures that these concurrent operations do not interfere with each other.

**Cross-Platform Compilation:** Rust compiles natively for macOS (both Intel
and Apple Silicon), Windows (x64 and ARM64), and Linux (x64, ARM64, and others).
A single codebase produces native binaries for all target platforms.

**Small Binary Size:** Rust produces statically-linked binaries with no runtime
dependencies. The entire Rust backend compiles to a few megabytes, contributing
to VibeGrid's small overall binary size.

### 3.2 Rust Version and Toolchain
VibeGrid will use:
- Rust: Latest stable release (1.75 or newer at time of writing)
- Cargo: Rust's package manager and build system (bundled with Rust)
- rustup: Rust toolchain manager for installing and updating Rust

Target compilation platforms:
- x86_64-apple-darwin: macOS on Intel processors
- aarch64-apple-darwin: macOS on Apple Silicon (M1, M2, M3, M4)
- x86_64-pc-windows-msvc: Windows 64-bit using Microsoft Visual C++ toolchain
- x86_64-unknown-linux-gnu: Linux 64-bit using GNU toolchain

### 3.3 Rust Backend Architecture
The Rust backend is organized into several modules, each responsible for a
specific aspect of the application:

**PTY Manager Module:**
This is the core module. It maintains a registry of all active terminal panes.
Each pane has a unique identifier (a UUID string), a PTY master handle, and
metadata (shell process ID, current dimensions, alive status).

The PTY Manager provides the following operations:
- Spawn a new pane: Creates a PTY pair, spawns a shell process, registers the pane
- Write to a pane: Sends input bytes to the pane's PTY master
- Resize a pane: Changes the pane's terminal dimensions and notifies the shell
- Kill a pane: Terminates the shell process and cleans up PTY resources
- List panes: Returns metadata for all active panes

**PTY Reader Module:**
This module runs asynchronous read loops for each active PTY. When a shell
process produces output, the reader captures the bytes and forwards them to the
IPC Batcher.

Each reader runs on a separate asynchronous task (using the tokio runtime). This
ensures that output from one terminal does not block output from another. If a
shell process produces a large amount of output (e.g., compiling a large project),
only that terminal's reader is busy; the other 15 readers continue operating
normally.

**IPC Batcher Module:**
This module collects output from all PTY readers and batches it into periodic
IPC events. The batching interval is 16 milliseconds (one frame at 60 FPS).

The batcher maintains an internal buffer: a map from pane identifier to
accumulated output bytes. Every 16 milliseconds, the batcher checks if the
buffer is non-empty. If so, it serializes the buffer into a single payload and
emits it as a Tauri event. The buffer is then cleared.

The batcher also implements backpressure: if the buffer exceeds a maximum size
(10 MB), the batcher signals the PTY readers to pause reading until the frontend
catches up. This prevents unbounded memory growth if the frontend is temporarily
unable to process output (e.g., during a window resize or tab switch).

**Configuration Module:**
This module handles loading and saving user settings. Settings include:
- Font family and size
- Color theme
- Keyboard shortcuts
- Default shell path
- Scrollback buffer size
- Window size and position
- Workspace configurations

Settings are stored in a TOML file in the user's application data directory.
The configuration module reads this file on startup and writes it on change.
It provides a typed API for accessing settings throughout the application.

**Workspace Module:**
This module manages workspace persistence. Each workspace's layout and metadata
are stored as a JSON file. The workspace module handles creating, loading,
saving, and deleting workspace files.

---

## 4. Frontend Technology: React + TypeScript

### 4.1 Why React?
BridgeSpace's frontend runs inside a WebView, which means it uses web
technologies (HTML, CSS, JavaScript). The specific frontend framework is not
publicly disclosed by BridgeMind, but React is the most likely choice given its
dominance in the web development ecosystem and its suitability for complex,
stateful user interfaces.

VibeGrid will use React for the following reasons:

**Component Model:** React's component model maps naturally to VibeGrid's UI.
Each terminal pane is a component. The grid layout is a component. The toolbar
is a component. The command palette is a component. This modular structure makes
the codebase maintainable and testable.

**State Management:** React's state management (via hooks and external stores)
handles the complex state of a multi-pane terminal grid: which pane is focused,
the layout tree, split ratios, workspace configurations, and settings.

**Ecosystem:** React has the largest ecosystem of libraries and tools in the
frontend world. For VibeGrid, this means access to mature libraries for layout
management, keyboard handling, state management, and UI components.

**Performance:** React's virtual DOM and reconciliation algorithm ensure that
only the parts of the UI that actually changed are re-rendered. This is
important for a terminal grid where 16 panes may be updating simultaneously.

### 4.2 Why TypeScript?
TypeScript adds static typing to JavaScript. VibeGrid will use TypeScript for
the following reasons:

**Type Safety:** Terminal grid state is complex. Pane IDs are strings. Split
directions are either "horizontal" or "vertical." Split ratios are numbers
between 0 and 1. TypeScript ensures that these types are used correctly throughout
the codebase, catching errors at compile time rather than runtime.

**IDE Support:** TypeScript provides excellent autocompletion, refactoring, and
error checking in modern IDEs. This accelerates development and reduces bugs.

**Documentation:** TypeScript types serve as living documentation. A developer
can look at a function's type signature and understand exactly what parameters
it accepts and what it returns, without reading the implementation.

**Maintainability:** As the codebase grows, TypeScript's type system becomes
increasingly valuable. It prevents accidental misuse of APIs and makes refactoring
safer.

### 4.3 Frontend Build Tool: Vite
Vite is a modern build tool that provides:

**Development Server:** During development, Vite serves the frontend with
instant hot module replacement (HMR). When a developer edits a file, the change
appears in the application immediately without a full rebuild. This is essential
for productive development.

**Optimized Builds:** For production, Vite bundles the frontend code using
Rollup, applying tree-shaking, code-splitting, and minification. The resulting
bundle is small and fast to load.

**Tauri Integration:** Tauri v2 has first-class support for Vite. The Tauri CLI
automatically starts the Vite dev server during development and uses the Vite
build output for production bundling.

### 4.4 Frontend Architecture
The frontend is organized into the following layers:

**Component Layer:**
This layer contains all React components. Components are organized by feature:
- Terminal components: TerminalGrid, TerminalPane, TerminalToolbar
- Layout components: SplitNode, GridRenderer, MaximizedView
- UI components: CommandPalette, SettingsModal, StatusBar
- Common components: Button, Tooltip, Badge, Spinner

**State Layer:**
This layer manages application state using Zustand, a lightweight state
management library. Zustand is chosen over Redux because it is simpler, requires
less boilerplate, and integrates well with React's concurrent features.

State stores:
- Pane Store: Manages the layout tree, pane count, focused pane, and split ratios
- Settings Store: Manages user preferences (font, theme, keybindings)
- Workspace Store: Manages workspace list, active workspace, and workspace metadata
- UI Store: Manages transient UI state (command palette open/closed, settings
  modal open/closed, notification queue)

**Service Layer:**
This layer encapsulates communication with the Rust backend. All Tauri IPC calls
go through service functions that handle serialization, error handling, and
retry logic. The component layer never calls Tauri APIs directly.

Services:
- PTY Service: spawn, write, resize, kill
- Workspace Service: create, load, save, delete, list
- Settings Service: load, save, update
- Theme Service: apply theme, list themes

**Hook Layer:**
This layer provides custom React hooks that encapsulate complex logic:
- useTerminal: Manages the lifecycle of a single xterm.js instance
- useGridLayout: Manages the recursive layout tree rendering
- useKeyboard: Manages keyboard shortcut handling
- useTheme: Manages theme application and switching
- useWorkspace: Manages workspace switching and persistence

---

## 5. Terminal Rendering: xterm.js

### 5.1 What is xterm.js?
xterm.js is a terminal emulator component for the web. It is the engine that
powers VS Code's integrated terminal, Hyper terminal, and many other web-based
terminal applications. It is maintained by Microsoft and is the industry standard
for rendering terminals in web-based environments.

BridgeSpace, running inside a Tauri WebView, almost certainly uses xterm.js (or
a derivative) for terminal rendering. VibeGrid will use xterm.js to achieve
identical rendering behavior.

### 5.2 xterm.js Capabilities
xterm.js provides:

**ANSI Escape Code Parsing:** xterm.js includes a complete parser for ANSI escape
sequences. It handles all standard sequences: cursor movement, color setting,
screen clearing, scrolling regions, character sets, and more. This parser is
battle-tested and handles edge cases that would take months to implement from
scratch.

**Grid State Management:** xterm.js maintains an internal grid of cells. Each
cell contains a character, foreground color, background color, and attributes
(bold, italic, underline, strikethrough, inverse). The grid supports scrollback
— a configurable number of lines that scroll off the top of the visible area
but remain accessible.

**Input Handling:** xterm.js captures keyboard input and translates it into the
appropriate byte sequences for the shell. It handles regular characters, special
keys (Enter, Tab, Escape, Backspace), arrow keys, function keys, and modifier
key combinations (Ctrl, Alt, Shift, Meta).

**Selection and Clipboard:** xterm.js supports text selection with the mouse and
keyboard. Selected text can be copied to the system clipboard. Text can be pasted
from the clipboard into the terminal.

**Search:** xterm.js includes a search addon that allows the user to search for
text within the terminal's scrollback buffer.

**Unicode Support:** xterm.js supports full Unicode, including CJK characters,
emoji, and combining characters. It correctly handles wide characters that occupy
two cell widths.

### 5.3 xterm.js Addons
VibeGrid will use the following xterm.js addons:

**WebGL Addon:**
This is the critical addon for GPU-accelerated rendering. It replaces the default
DOM-based renderer with a WebGL-based renderer that draws terminal content using
the GPU. The WebGL addon creates a texture atlas of glyphs and renders each cell
as a textured quad. This enables smooth rendering of 16 simultaneous terminals.

The WebGL addon includes automatic fallback: if the GPU context is lost (e.g.,
due to a GPU driver crash), the addon detects this and falls back to the Canvas
2D renderer. This ensures that the terminal remains functional even if GPU
acceleration becomes unavailable.

**Fit Addon:**
This addon automatically resizes the terminal to fit its container element. When
a pane is resized (by dragging a divider or maximizing), the fit addon recalculates
the number of columns and rows that fit in the new dimensions and calls the
terminal's resize method. This triggers a PTY resize in the backend, which
notifies the shell process of the new window size.

**Canvas Addon:**
This is the fallback renderer. If WebGL is not available (e.g., on a system
without GPU acceleration, or if the WebGL context limit is reached), the Canvas
addon renders terminal content using the 2D Canvas API. This is slower than WebGL
but faster than DOM rendering.

**Web Links Addon:**
This addon detects URLs in terminal output and makes them clickable. When the
user hovers over a URL, it is underlined. When the user clicks it, the URL is
opened in the default web browser. This is useful when AI agents output links
to documentation, pull requests, or preview URLs.

**Search Addon:**
This addon provides search functionality within the terminal. The user can press
Cmd/Ctrl+F to open a search bar, type a query, and navigate through matches.
This is essential for finding specific output in long terminal sessions.

**Unicode11 Addon:**
This addon enables full Unicode 11 support, including proper handling of emoji,
CJK characters, and other wide characters. Without this addon, some Unicode
characters may render incorrectly.

### 5.4 Terminal Configuration
Each xterm.js instance in VibeGrid will be configured with the following settings:

**Font:**
- Font Family: A bundled monospace font (JetBrains Mono or similar)
- Font Size: Default 14px, user-adjustable from 8px to 32px
- Line Height: 1.0 (standard terminal spacing)
- Letter Spacing: 0 (standard terminal spacing)

**Cursor:**
- Cursor Style: Block (default), configurable to Bar or Underline
- Cursor Blink: Enabled (configurable)
- Cursor Color: Configurable via theme

**Scrollback:**
- Scrollback Buffer: Default 5000 lines, configurable from 100 to 100000
- Scrollback is stored in memory per terminal pane
- Total scrollback memory for 16 panes at 5000 lines: approximately 80 MB

**Colors:**
- Theme: Configurable, default is a dark theme
- Foreground: Light gray (#e0e0e0)
- Background: Very dark (#0a0a0f)
- Cursor: Bright accent color (#00ff88)
- Selection: Semi-transparent blue (#264f78)
- ANSI 16 colors: Standard terminal color palette
- True color: Enabled (24-bit RGB)

**Behavior:**
- Windows Mode: Enabled on Windows (improves rendering on Windows)
- Allow Proposed API: Enabled (required for WebGL addon)
- Bell: Visual bell (flash the pane border) instead of audio bell
- Word Separator: Standard separators for double-click word selection

---

## 6. Layout Engine

### 6.1 Requirements
The layout engine must support:
- Splitting any pane horizontally or vertically
- Resizing panes by dragging dividers
- Maximizing and restoring panes
- Nested splits (a split within a split)
- Dynamic pane count from 1 to 16
- Smooth resize animations
- Keyboard navigation between panes

### 6.2 Layout Library: allotment
VibeGrid will use the "allotment" library for the layout engine. Allotment is a
React component library that provides VS Code-style split views. It is chosen
because:

- It supports nested horizontal and vertical splits
- It handles divider dragging with smooth animations
- It supports programmatic resizing and visibility toggling
- It is lightweight and has no external dependencies
- It is actively maintained and well-tested
- It integrates naturally with React's component model

### 6.3 Layout Tree Rendering
The layout tree (a binary tree of split nodes and terminal nodes) is rendered
recursively:

1. The root node is examined.
2. If the root is a terminal node, a single TerminalPane component is rendered.
3. If the root is a split node, an Allotment component is rendered with the
   appropriate direction (horizontal or vertical).
4. Each child of the split node is rendered recursively inside an Allotment.Pane.
5. The split ratio is applied to the Allotment component.
6. When a divider is dragged, the Allotment component fires an onChange event.
7. The onChange handler updates the split ratio in the Pane Store.
8. The layout re-renders with the new ratio.

---

## 7. State Management: Zustand

### 7.1 Why Zustand?
Zustand is a small, fast, and flexible state management library for React. It
is chosen over alternatives (Redux, MobX, Jotai) because:

- Minimal boilerplate: A store is defined in a few lines
- No providers: No need to wrap the app in a Provider component
- No Context API: Avoids React Context performance issues
- Built-in support for middleware (persist, immer, devtools)
- Excellent TypeScript support
- Small bundle size (under 1 KB)

### 7.2 State Stores
VibeGrid defines the following Zustand stores:

**Pane Store:**
- root: The root node of the layout tree
- focusedPaneId: The ID of the currently focused pane
- paneCount: The current number of terminal panes
- maxPanes: The maximum allowed panes (16)
- maximizedPaneId: The ID of the maximized pane (null if none)
- Actions: splitPane, closePane, focusPane, maximizePane, restorePane, setSplitRatio

**Settings Store:**
- fontFamily: The terminal font family
- fontSize: The terminal font size in pixels
- theme: The current color theme name
- scrollbackLines: The number of scrollback lines per terminal
- defaultShell: The default shell path (empty = auto-detect)
- keybindings: Custom keyboard shortcut mappings
- Actions: updateSetting, resetToDefaults, loadSettings, saveSettings

**Workspace Store:**
- workspaces: List of workspace metadata (name, ID, last accessed)
- activeWorkspaceId: The ID of the currently active workspace
- Actions: createWorkspace, deleteWorkspace, switchWorkspace, renameWorkspace

**UI Store:**
- isCommandPaletteOpen: Whether the command palette is visible
- isSettingsOpen: Whether the settings modal is visible
- notifications: Queue of notification messages
- Actions: openCommandPalette, closeCommandPalette, openSettings, closeSettings,
  addNotification, removeNotification

---

## 8. Styling: Tailwind CSS

### 8.1 Why Tailwind CSS?
Tailwind CSS is a utility-first CSS framework. VibeGrid uses Tailwind because:

- Rapid prototyping: Styles are applied directly in JSX, eliminating the need
  for separate CSS files
- Consistency: The design system is defined in a configuration file, ensuring
  consistent spacing, colors, and typography
- Small bundle size: Tailwind purges unused utilities in production builds
- Dark mode: Tailwind has built-in dark mode support, which is essential for
  a terminal application

### 8.2 Theme System
VibeGrid's color theme system defines the following theme elements:

- Application background: The color of the window background behind the panes
- Pane background: The color of each terminal pane's background
- Pane border: The color of the divider lines between panes
- Pane focus indicator: The color of the border around the focused pane
- Toolbar background: The color of the pane toolbar
- Toolbar text: The color of text in the toolbar
- Status bar background: The color of the bottom status bar
- Status bar text: The color of text in the status bar
- Terminal colors: The 16 ANSI colors, foreground, background, cursor, selection

Themes are defined as JSON objects and applied by setting CSS custom properties
on the document root. The terminal renderer reads these properties to configure
its color scheme.

VibeGrid will ship with several built-in themes:
- VibeDark (default): Very dark background, green accent
- VibeLight: Light background for daytime use
- Midnight Blue: Dark blue background, blue accent
- Solarized Dark: Classic Solarized dark color scheme
- Solarized Light: Classic Solarized light color scheme
- Dracula: Popular Dracula color scheme
- Nord: Popular Nord color scheme

Users can also create custom themes by editing a JSON file.

---

## 9. Build and Packaging

### 9.1 Development Workflow
The development workflow is:

1. The developer runs "npm run tauri dev"
2. Tauri CLI starts the Vite development server on port 1420
3. Tauri CLI compiles the Rust backend and launches the application
4. The application window opens, loading the frontend from the Vite dev server
5. The developer edits frontend code; changes appear instantly via HMR
6. The developer edits Rust code; the backend recompiles and restarts
7. The developer tests on macOS, Windows, and Linux

### 9.2 Production Build
The production build process is:

1. Run "npm run tauri build"
2. Vite builds the frontend into optimized static files (dist/)
3. Cargo compiles the Rust backend in release mode with optimizations
4. Tauri bundles the frontend files into the Rust binary
5. Tauri creates platform-specific installers:
   - macOS: .dmg disk image with application bundle
   - Windows: .msi installer and/or .exe executable
   - Linux: .AppImage, .deb, and .rpm packages
6. Icons, metadata, and license files are included in the bundle

### 9.3 Continuous Integration / Continuous Deployment (CI/CD)
VibeGrid will use GitHub Actions for CI/CD:

**On every pull request:**
- Run frontend type checking (TypeScript compiler)
- Run frontend linting (ESLint)
- Run frontend unit tests (Vitest)
- Run Rust unit tests (cargo test)
- Run Rust linting (clippy)
- Build the application for all target platforms (to verify compilation)

**On every release tag:**
- Build the application for all target platforms
- Run integration tests
- Create GitHub Release with downloadable binaries
- Generate checksums for each binary
- Sign binaries (if signing certificates are available)

Build matrix:
- macOS: x86_64 and aarch64 (Apple Silicon)
- Windows: x86_64
- Linux: x86_64

All CI/CD is free using GitHub Actions for public repositories.

---

## 10. Development Environment

### 10.1 Required Tools
Developers contributing to VibeGrid need:

- Rust toolchain (installed via rustup)
- Node.js (LTS version, for frontend development)
- npm or pnpm (package manager for frontend dependencies)
- Git (version control)
- A code editor (VS Code recommended, with Rust and TypeScript extensions)

### 10.2 Platform-Specific Requirements

**macOS:**
- Xcode Command Line Tools (for compiling Rust and building the app bundle)
- macOS 10.15 or newer

**Windows:**
- Microsoft Visual Studio C++ Build Tools (for compiling Rust)
- WebView2 Runtime (pre-installed on Windows 11, auto-installed on Windows 10)
- Windows 10 1809 or newer (for ConPTY support)

**Linux:**
- Build essentials (gcc, make, etc.)
- WebKitGTK development libraries
- GTK development libraries (for Tauri's Linux support)
- libappindicator (for system tray on Linux)

### 10.3 Project Initialization
The project is initialized using the Tauri CLI:

1. Create a new Tauri project with React and TypeScript template
2. Add Rust dependencies to Cargo.toml
3. Add frontend dependencies to package.json
4. Configure Tauri settings in tauri.conf.json
5. Set up Tailwind CSS
6. Set up ESLint and Prettier for code quality
7. Set up Vitest for frontend unit tests
8. Set up GitHub Actions CI/CD workflows
9. Initialize Git repository
10. Create initial project structure

---

## 11. Cost Analysis

### 11.1 Development Costs
Every tool and service used in VibeGrid's development is free:

| Item | Cost |
|------|------|
| Rust toolchain | Free (open source) |
| Node.js | Free (open source) |
| Tauri framework | Free (open source, MIT license) |
| React | Free (open source, MIT license) |
| TypeScript | Free (open source, Apache 2.0 license) |
| xterm.js | Free (open source, MIT license) |
| Tailwind CSS | Free (open source, MIT license) |
| Zustand | Free (open source, MIT license) |
| allotment | Free (open source, MIT license) |
| Vite | Free (open source, MIT license) |
| GitHub (repository) | Free (public repo) |
| GitHub Actions (CI/CD) | Free (public repo, 2000 min/month) |
| GitHub Releases (distribution) | Free (unlimited releases) |
| Code editor (VS Code) | Free |

**Total Development Cost: $0.00**

### 11.2 Distribution Costs
VibeGrid is distributed as compiled binaries via GitHub Releases:

| Item | Cost |
|------|------|
| GitHub Releases hosting | Free |
| Domain name (optional) | $0 if using github.io |
| Code signing (optional) | $0 if not signing |
| CDN (optional) | $0 if using GitHub CDN |

**Total Distribution Cost: $0.00**

### 11.3 User Costs
VibeGrid is free for users:

| Item | Cost to User |
|------|-------------|
| Download and install | Free |
| Use the application | Free |
| Updates | Free |
| AI model usage | Free (local models) or user's own API keys |

**Total User Cost: $0.00**

---

## 12. Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop Framework | Tauri 2 | Window management, IPC, bundling |
| Backend Language | Rust | PTY management, IPC batching, config |
| Async Runtime | Tokio | Async I/O for PTY reads |
| PTY Library | portable-pty | Cross-platform PTY abstraction |
| Frontend Framework | React 18 | UI component rendering |
| Frontend Language | TypeScript | Type-safe frontend code |
| Build Tool | Vite | Frontend bundling and dev server |
| Terminal Renderer | xterm.js | Terminal emulation and rendering |
| GPU Rendering | xterm WebGL Addon | GPU-accelerated terminal display |
| Layout Engine | allotment | Split pane layout management |
| State Management | Zustand | Application state management |
| Styling | Tailwind CSS | Utility-first CSS styling |
| Version Control | Git | Source code management |
| CI/CD | GitHub Actions | Automated builds and releases |
| Distribution | GitHub Releases | Binary hosting and download |

This technology stack exactly replicates BridgeSpace's architecture while
remaining 100% free and open source.