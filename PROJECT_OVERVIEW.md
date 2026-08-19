# VIBEGRID: COMPREHENSIVE ARCHITECTURAL ENCYCLOPEDIA & DEEP AUDIT SPECIFICATION

> **Version**: 2.5.0 (Exhaustive Edition)  
> **Repository**: `abuzar/VibeGrid`  
> **Audience**: AI Agents, System Architects, Senior Full-Stack Engineers  
> **Stack**: Tauri v2, Rust 2021, React 18, TypeScript 5, Vite 6, Tailwind CSS 3, Zustand, xterm.js (WebGL), Whisper.cpp, Axum, Model Context Protocol (MCP)

---

## 1. Executive Summary & Product Vision

### 1.1 What is VibeGrid?
**VibeGrid** is a desktop command center engineered for developers orchestrating swarms of local and cloud-based AI coding agents. Instead of running coding agents in siloed, uncoordinated terminal tabs, VibeGrid provides a **multi-pane terminal matrix**, **visual layout studio**, **heterogeneous AI role pods**, **real-time on-device voice dictation (Whisper.cpp)**, **in-memory secrets vault**, **Model Context Protocol (MCP) server**, and a **custom WebGL retro CRT shader engine**.

### 1.2 Core Value Proposition & Key Pillars
1. **Multi-Agent Orchestration**: Provision complementary teams of AI agents (e.g., Claude Code as Architect, Aider as Refactorer, Ollama/DeepSeek as Local Logic Engine, and Shell for test runners) across partitioned terminal panes with 1 click.
2. **High-Performance Terminal Grid**: Hardware-accelerated terminal emulation (xterm.js + WebGL) supporting 1 to 64 panes with arbitrary recursive binary splits, golden ratios, and zero PTY leaks.
3. **Universal Agent Support**: Out-of-the-box discovery and sandboxed execution for 13 leading CLI agents: Claude Code, OpenAI Codex, Antigravity, Grok CLI, Kimi CLI, Qwen Coder, Aider, OpenHands, Ollama, DeepSeek CLI, Gemini CLI, Goose, Cline CLI, and Native Shells (Zsh, Bash, PowerShell).
4. **On-Device Voice-to-Terminal**: Private, offline speech-to-text powered by local Whisper.cpp models with automatic Voice Activity Detection (VAD), lock-free RMS audio metering, and auto-injection into focused terminals.
5. **Two-Way Agent Telemetry & MCP**: Exposes an authenticated local Axum REST API (Port 8792) and stdio MCP server for agent self-inspection of active terminal states.
6. **Functional Glassmorphism & Cyberpunk Aesthetics**: Pure black aesthetic (`#1A1B26`), multi-tier glass refraction layers, custom Web Audio brand sound synthesis, and real-time WebGL CRT scanline shaders.

---

## 2. Complete Technology Stack & System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             REACT FRONTEND                              │
│  React 18 • TypeScript • Tailwind CSS • Zustand Stores • Allotment Grid │
│  xterm.js (WebGL/Canvas Addons) • WebGL Retro Shaders • Web Audio Synth  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ Tauri v2 IPC (Events & Invocations)
┌────────────────────────────────────▼─────────────────────────────────────┐
│                           TAURI RUST BACKEND                             │
│  Tauri v2 Core Runtime • Tokio Async Pool • Axum 0.8 REST API (Port 8792)│
│  portable-pty (Process Isolation) • IPC Output Batcher (16ms ~60fps)     │
│  Whisper.cpp (Local Speech Engine) • cpal (Low-Latency Audio Capture)    │
│  Model Context Protocol (JSON-RPC 2.0 Stdio MCP Server)                 │
└──────────────────────────────────────────────────────────────────────────┘
```

| Layer | Technologies & Dependencies | Purpose |
|---|---|---|
| **Desktop Runtime** | Tauri v2 (`@tauri-apps/api`, `tauri` crate) | Cross-platform lightweight native wrapper (macOS, Linux, Windows) with minimal memory footprint compared to Electron. |
| **Backend Core** | Rust 2021 (`tokio`, `parking_lot`, `serde`, `uuid`) | Safe, zero-cost concurrent process management, memory safety, and thread orchestration. |
| **PTY Management** | `portable-pty` (0.8), `libc` | Spawns pseudo-terminals, pipes stdin/stdout, and controls Unix process group signaling (`SIGHUP` -> `SIGKILL`). |
| **IPC Batching** | Custom Tokio stream coalescer | Aggregates high-throughput terminal stdout into 16ms/60fps batches with backpressure flags to prevent UI thread choking. |
| **Audio & Speech** | `cpal` (0.18), `whisper-rs` (0.16) | Native hardware mic audio stream capture, 16kHz linear resampling, silence trimming, and on-device Whisper inference. |
| **Networking & MCP**| `axum` (0.8.9), `reqwest` (0.12) | Local authenticated REST state API and stdio JSON-RPC 2.0 Model Context Protocol server. |
| **Frontend Framework**| React 18, TypeScript 5, Vite 6 | Reactive UI components, state routing, and type-safe development. |
| **Terminal Engine** | `xterm` (5.3), `@xterm/addon-webgl`, `@xterm/addon-fit`, `@xterm/addon-search`, `@xterm/addon-web-links` | High-performance terminal emulation with GPU-accelerated glyph rendering. |
| **State Management**| Zustand (11 specialized stores) | Lightweight decoupled state management with selective subscriptions and disk synchronization. |
| **Layout & Grid** | `allotment` (1.20) | High-performance resizable split pane engine managing recursive binary layout trees. |
| **Styling & Shaders**| Tailwind CSS 3, Custom GLSL shaders (WebGL 1.0) | Functional Glassmorphism design tokens, CSS variables, and real-time CRT barrel/scanline post-processing. |
| **Audio Synthesis** | Web Audio API (Native browser) | Dynamic procedural audio synthesis (swept sines, resonant noise bursts) with zero audio asset files. |

---

## 3. Exhaustive Frontend Component & UI Capabilities

### 3.1 Workspace Sidebar (`src/components/common/WorkspaceSidebar.tsx`)
- **Collapsed / Minimized Mode**:
  - `ChevronRight` expand button with hover effects.
  - Quick "+ New Workspace" action pill button.
  - Pinned `Settings` gear icon button to open preferences (`Cmd/Ctrl+,`).
- **Header & Project Creation**:
  - `+ New Workspace` pill button triggering native directory picker (`@tauri-apps/plugin-dialog` `open({ directory: true })`) with folder name pre-fill and `defaultCwd` recording.
  - `PROJECTS` uppercase header with a quick-add plus button for `InputModal` workspace creation.
- **Tree Rows & Project Items**:
  - Expand/collapse chevron (`ChevronRight`) with smooth 90° rotation.
  - Active workspace emblem / folder vector icon with glow.
  - Single-click activates and switches workspace (`switchWorkspace(id)`).
  - Sub-thread rows (e.g. `VibeGrid now`) navigating directly to terminal grid mode (`'grid'`).
  - Action buttons on row hover:
    - **Rename**: `Edit2` icon button opening `InputModal` with max length limits.
    - **Duplicate**: `Copy` icon button cloning workspace and displaying a success toast.
    - **Delete / Reset**: `Trash2` icon button (red hover). If 1 workspace exists, acts as "Reset Project to Default" with confirmation; if multiple, acts as "Delete Project".
- **Right-Click Context Menu (`onContextMenu`)**:
  - Positioned at cursor with viewport clamping.
  - Actions: **Switch to Project**, **Rename**, **Duplicate**, and **Delete / Reset Project** (styled in danger rose).
- **Settings Navigation Mode**:
  - When the Settings modal is open, the sidebar dynamically transitions into a dedicated navigation menu with tabs: Font & Appearance, Themes, Terminal Engine, Workspaces, Limits, UI Chrome, Keybindings, and Profiles.

### 3.2 Terminal Pane Engine (`src/components/terminal/TerminalPane.tsx`)
- **GPU Accelerated Rendering & Context Leasing**:
  - Dynamic WebGL slot allocation via `acquireWebglSlot(id)` (max 12 slots), with automatic fallback to `CanvasAddon` or standard DOM on context exhaustion.
  - Dynamic WebGL context restoration handling (`webglAddon.onContextLoss`).
- **Session Replay & Hydration**:
  - Instant output rehydration using `paneSnapshot(ptyId)` without spawning fresh shells.
  - Trailing overlap deduplication (`overlapSuffix`) during output streaming.
- **Drag-and-Drop File Path Injection**:
  - Listens to Tauri native window drag-and-drop events (`onDragDropEvent`).
  - Renders visual dashed border drop zone (`"Release to insert path(s)"`).
  - Escapes spaces and special characters with platform-aware escaping (`escapeShellPath`) and bracketed paste.
- **Bracketed Paste & Multi-Line Safety**:
  - Wraps pasted strings inside `\x1b[200~` and `\x1b[201~`.
  - Prompts confirmation if pasting multiple lines when `pasteConfirmNewlines` is enabled.
- **Exhaustive Right-Click Context Menu (12 Actions & Dividers)**:
  1. `Copy`: Copies active selection to clipboard (disabled if no text selected).
  2. `Copy as HTML (with colors)`: Extracts terminal cells, ANSI 16 and 24-bit true colors, generating an HTML `<pre>` block preserving exact terminal colors.
  3. `Paste`: Reads system clipboard and writes with bracketed paste.
  4. `Set Shell for This Pane…`: Per-pane shell override modal.
  5. `Appearance for This Pane…`: Customizes per-pane Theme, Font Size, and Opacity independently, or clears overrides.
  6. `Find in Terminal`: Toggles floating regex/case-aware SearchBar.
  7. `Clear Scrollback`: Clears buffer via `term.clear()`.
  8. *Divider*
  9. `Split Right`: Horizontal split (`splitPane(id, 'horizontal')`).
  10. `Split Down`: Vertical split (`splitPane(id, 'vertical')`).
  11. *Divider*
  12. `Swap with Next Pane`: Swaps PTY session with adjacent pane.
  13. `Swap with Previous Pane`: Swaps PTY session with prior pane.
  14. *Divider*
  15. `Close Pane`: Terminates process and removes pane (`requestClosePane(id)`).
- **Process Exit Indicator Overlay**:
  - Triggered by `terminal-exit` backend event.
  - Animated pulsing beacon and "Process exited" badge.
  - **Relaunch Button**: Restarts shell session in place.
  - **Close Button**: Closes pane.
- **Clickable URLs**: `WebLinksAddon` supporting click modifier keys (`click`, `meta`, `ctrl`, `alt`) and native system browser opening.
- **Terminal Bell**: Procedural 880Hz audio sine beep on ASCII bell character `\x07`.

### 3.3 Terminal Toolbar (`src/components/terminal/TerminalToolbar.tsx`)
- **Pane Index Badge**: Pure white numbered badge (`1`, `2`, `3`...).
- **Terminal Icon & Badge**: Vector Lucide `Terminal` icon.
- **Editable Inline Title**: Click title or pencil icon to edit; `Enter` saves, `Escape` cancels, `onBlur` persists.
- **CWD Indicator**: Compact badge displaying current working directory path.
- **Activity Beacon**: Animated green ping beacon for background stdout activity when pane is unfocused.
- **Toolbar Action Buttons**:
  - Split Right (`Columns` icon, `Cmd/Ctrl+D`).
  - Split Down (`Rows` icon, `Cmd/Ctrl+Shift+D` / `Mod+Shift+E`).
  - Maximize / Restore (`Maximize2` / `Minimize2`, `Cmd/Ctrl+Shift+Enter`). Double-click on toolbar also maximizes/restores.
  - Close Pane (`X` icon, `Cmd/Ctrl+W`).

### 3.4 Content-Aware Diff Viewer (`src/components/terminal/ContentAwareDiffViewer.tsx`)
- **Slide-Out Panel**: Functional glassmorphic drawer (`w-[440px]`).
- **Header**: File path display, `GitCommit` icon, and additions/deletions badge (`+N / -N`).
- **Actions**: "Copy Raw Diff" button with temporary checkmark feedback; "Close Panel" button.
- **Diff Table Renderer**:
  - Two line-number columns: `Old` line number and `New` line number.
  - Marker column: `+` for additions (green accent), `-` for removals (red accent), blank for context lines.
  - Syntax highlighted tokens with line-by-line diff styling.
- **Footer**: `Stage Ready` status beacon, character encoding info (`UTF-8`, `LF`).

### 3.5 WebGL Retro CRT Shader Overlay (`src/components/terminal/RetroCrtOverlay.tsx`)
- **6 Calibrated CRT Presets**:
  1. `default`: Balanced barrel curvature, fine scanlines, and soft phosphor bloom.
  2. `cyberpunk`: Cyberpunk 1984 aesthetic with heavy chromatic aberration and neon flare.
  3. `matrix`: Monochrome green phosphor glow with vertical raster lines.
  4. `arcade`: Deep arcade cabinet curvature with heavy horizontal scanlines.
  5. `subtle`: Minimal hairline scanlines for modern ergonomics.
  6. `off`: Completely disables WebGL shader overlay.
- **Shader Pipeline Parameters**:
  - Barrel curvature (0.0 to 0.25).
  - Scanline intensity (0.0 to 1.0) and scanline count (300 to 800).
  - Phosphor bloom and glow lighting.
  - Chromatic aberration RGB offset.
  - Vignette corner light attenuation.

### 3.6 In-Pane Search Bar (`src/components/ui/SearchBar.tsx`)
- **Floating HUD**: Glassmorphic search bar floating in the top-right of active terminals (`Mod+F`).
- **Search Controls**:
  - Real-time text query matching.
  - Previous match button (`ChevronUp`, `Shift+Enter`).
  - Next match button (`ChevronDown`, `Enter`).
  - Close button (`X`, `Escape`).
  - Custom decorations: Yellow overview ruler markers and green active match highlights.

### 3.7 Central Prompt Card & Hub Mode (`src/components/home/CentralPromptCard.tsx`)
- **View Modes**: Supports switching between Hub mode (`'hub'`) and Terminal Grid mode (`'grid'`).
- **Workspace Identity Card**:
  - Active workspace emblem / folder vector icon in glass container.
  - Workspace title display.
  - Live pulse status beacon (`"Ready to launch workspace"`).
  - Workspace Hub indicator badge.
- **6 Interactive SVG Blueprint Layout Cards**:
  1. **Solo (1×1)**: Single full-bleed cell.
  2. **Dual (1×2)**: Side-by-side vertical split.
  3. **Quad (2×2)**: 4 equal quadrant matrix.
  4. **Hex (3×2)**: 6-pane 3x2 matrix.
  5. **Hive (3×3)**: 9-pane 3x3 matrix.
  6. **Matrix (4×4)**: 16-pane 4x4 matrix.
- **1-Click Launch Action**: Clicking any card immediately configures layout geometry and transitions view mode to `'grid'`.

### 3.8 Visual Layout Selection Studio (`src/components/studio/`)
- **LayoutStudioModal (`LayoutStudioModal.tsx`)**:
  - Header with tab switcher (`Preset Gallery` vs `Custom Matrix Studio`).
  - Quick-switch numeric keys `1`–`9` select presets instantly.
  - `Enter` deploys layout, `Escape` dismisses.
  - Deploys `--sash-size` and `--pane-radius` CSS tokens, mounts tree into `usePaneStore`, saves workspace, and routes to agent launcher.
- **16 Built-in Gallery Presets**:
  1. `solo`: 1-Pane Full-Bleed (`1`).
  2. `2-horizontal`: 2-Pane Side-by-Side (`2`).
  3. `2-vertical`: 2-Pane Top/Bottom Stack (`Alt+2`).
  4. `3-t-top`: 3-Pane T-Split Top (`3`).
  5. `3-t-bottom`: 3-Pane T-Split Bottom (`Alt+3`).
  6. `3-columns`: 3 Parallel Vertical Columns (`Ctrl+3`).
  7. `3-rows`: 3 Parallel Horizontal Rows (`Alt+R`).
  8. `4-quad`: 4-Quadrant 2×2 Balanced Matrix (`4`).
  9. `4-master-detail`: 4-Pane Master Left + 3 Stack Right (`Alt+4`).
  10. `4-columns`: 4 Parallel Columns (`Ctrl+4`).
  11. `6-matrix`: 6-Pane 2×3 Matrix (`6`).
  12. `6-command`: 6-Pane Command Center 1 Master + 5 Satellites (`Alt+6`).
  13. `8-fleet`: 8-Pane 2×4 Microservices Fleet (`8`).
  14. `8-satellite`: 8-Pane 2 Master + 6 Workers (`Alt+8`).
  15. `9-hivemind`: 9-Pane 3×3 Symmetric Matrix (`9`).
  16. `16-godmode`: 16-Pane 4×4 Maximum Grid (`0`).
- **Custom Matrix Builder (`CustomGridBuilder.tsx`)**:
  - Interactive 8×8 grid canvas supporting arbitrary $R \times C$ matrices (up to 64 panes).
  - Split Ratio Architecture: Equal (50/50), Golden (61.8/38.2), Hero Sidebar (70/30), Tri-Split (25/50/25), or Continuous Custom Slider (10% to 90%).
  - Gutter / Sash Width: 0px (Borderless), 2px (Hairline), 4px (Standard), 8px (Spacious).
  - Corner Radius: 0px, 4px, 8px, 12px, 16px.
  - Terminal Inner Padding: 0px, 4px, 8px, 12px, 16px.

### 3.9 AI Agent Fleet & Launcher Subsystem (`src/components/agent/`)
- **AgentLauncherModal (`AgentLauncherModal.tsx`)**:
  - 4 tabs: **Batch Launch**, **Role Pods**, **Per-Pane Matrix**, and **Vault & 1-Click Install**.
- **13 Supported AI Agents + Native Shell**:
  1. **Claude Code** (`claude-code`) — Claude 3.7 Sonnet / 3.5 Haiku
  2. **OpenAI Codex** (`codex`) — o3-mini, o1, GPT-4o
  3. **Antigravity** (`antigravity`) — Gemini 2.5 Pro / Flash
  4. **Grok CLI** (`grok`) — Grok 2
  5. **Kimi CLI** (`kimi`) — Moonshot Kimi k1.5 (2M context)
  6. **Qwen Coder** (`qwen`) — Qwen 2.5 Coder 32B / 7B
  7. **Aider** (`aider`) — Multi-model Git-aware pair programmer
  8. **OpenHands** (`openhands`) — Autonomous software developer
  9. **Ollama** (`ollama`) — Local offline LLMs (DeepSeek R1 32B/8B, Qwen 2.5 Coder 32B/7B, Llama 3.3 70B, Codestral)
  10. **DeepSeek CLI** (`deepseek`) — DeepSeek R1 / V3
  11. **Gemini CLI** (`gemini`) — Google Gemini 2.5 Pro / Flash
  12. **Goose** (`goose`) — Block extensible coding agent
  13. **Cline CLI** (`cline`) — Autonomous coding agent
  14. **Native Shell** (`shell`) — Zsh, Bash, PowerShell
- **Multi-Path Probing & Scanning**:
  - Scans system `$PATH` plus standard paths (`/opt/homebrew/bin`, `~/.cargo/bin`, `~/.nvm`, etc.).
  - Executes `--version` with a 3-second non-blocking timeout.
- **3 Pre-Configured Heterogeneous Role Pods**:
  1. *Autonomous Feature Pod* (4-Pane Quad): Claude Code Architect + Aider Refactorer + Ollama DeepSeek R1 Local Reasoning + Terminal Runner.
  2. *AI Pair Programmer* (3-Pane): Claude Architect + Aider Pair + Test Watcher.
  3. *Air-Gapped Privacy Swarm* (4-Pane Local): DeepSeek R1 + Qwen Coder + Llama 3.3 + Local Terminal.
- **Per-Pane Assignment Matrix (`PaneAgentMatrix.tsx`)**: Maps each pane to a specific agent, target model, custom CLI flags, initial prompt, and auto-start toggle.
- **Quick Install Drawer (`QuickInstallDrawer.tsx`)**: One-click clipboard copy for missing agent CLI installation commands (npm, brew, pip, curl).

### 3.10 Workspace Customizer & Theme Studio (`src/components/customizer/`)
- **Identity Customizer (`IdentitySection.tsx`)**:
  - 22 vector emblem icons across 4 categories (AI & Intelligence, Development & Terminal, Infrastructure & Cloud, Workspace & Vibe).
  - Smart name auto-detection from project directory.
  - 10 color identity ring swatches + native color picker.
- **Theme Studio Laboratory (`ThemeStudioSection.tsx`)**:
  - 3 Semantic color roles (Background, Surface, Ink text, Accent).
  - Real-time **WCAG 2.1 Contrast Scorer** with AAA/AA grading badges.
  - Custom diff colors (Add `+` and Remove `-`).
  - 20+ built-in themes (Tokyo Night, Dracula, Monokai, Nord, Catppuccin, Gruvbox, Cyberpunk, Forest Matrix, VibeDark).
  - UI font & Code font pickers, size slider (8–32px), line height (0.8–2.2x), opacity (10–100%), ligatures toggle, cursor styling.
  - **Codex Theme v1 JSON Import/Export** drawer.
- **Directory, Git & Secret Vault (`DirectoryEnvSection.tsx`)**:
  - Native directory picker (`@tauri-apps/plugin-dialog`).
  - Git branch and uncommitted changes inspector (`● Uncommitted Changes` vs `✓ Clean Working Tree`).
  - **Secret API Key Vault**: Quick-add chips (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `GITHUB_TOKEN`, `OLLAMA_HOST`), password masking, eye reveal toggle, clipboard copy, delete confirmation modal, and out-of-band injection into PTYs.

### 3.11 Setup & Onboarding Wizard (`src/components/onboarding/OnboardingWizard.tsx`)
- **4-Step Sequential Flow**: `splash` -> `layout` -> `agents` -> `customizer` -> `launch`.
- Interactive progress bar with step jump capability.
- Skip confirmation dialog on `Escape` or "Skip".
- Batch PTY provisioning on completion (`batchSpawnPanes`), attaching live PTY handles and saving initial workspace.

### 3.12 Command Palette (`src/components/ui/CommandPalette.tsx`)
- **Fuzzy Search**: Real-time fuzzy query scoring (`fuzzyScore`) against labels and categories.
- **Recent Commands Cache**: MRU cache of frequently executed actions.
- **Operations Supported**:
  - Workspace management (Switch, Duplicate, Delete, Reset to Default, Save Now).
  - Layout presets and studio modals.
  - Pane operations (Split horizontal/vertical, close, maximize, swap, edit title, split in folder).
  - Theme switches and font size scaling.
  - User-authored custom commands (`UserCommand` authoring dialog).
  - Macro execution triggers.
  - Voice-to-Terminal toggling and transcript re-insertion.

### 3.13 Settings Modal (`src/components/ui/SettingsModal.tsx`)
- **8 Dedicated Tab Views**:
  1. `font` (Font & Appearance): Font family, size, ligatures, line height, cursor styling, opacity.
  2. `theme` (Themes & Palettes): Custom theme creator, 22-slot color editor, duplication, export/import.
  3. `terminal` (Terminal Engine): Default shell, shell args, shell env, scrollback, click links, paste newline confirm, bell.
  4. `workspaces` (Workspaces & Overrides): Per-workspace CWD/font/theme overrides, archive toggles.
  5. `limits` (Limits & Confirmations): Max panes (1–16), min pane size, divider snap, double-click equalize, quit confirmation settings.
  6. `appearance` (UI Chrome & Styling): UI Zoom, compact mode, animations toggle, sidebar width, status badges.
  7. `keyboard` (Keybindings & Macros): Visual keybinding remapper with conflict detection and multi-step macro builder (action + delay steps).
  8. `profiles` (Profiles & Endpoints): Configuration profiles (Save/Load/Delete) and HTTP API port status.
- **Export / Import**: Full settings backup to JSON and file upload restore.

### 3.14 AI Chat Panel (`src/components/chat/`)
- Slide-out conversation panel (`AgentConversationPanel.tsx`).
- Chat message bubbles (`ChatMessage.tsx`) with agent/user avatars, model badges, timestamps, and typing cursor animations.
- Syntax-highlighted code blocks (`ChatCodeBlock.tsx`) with copy actions.

---

## 4. Complete Zustand State Stores Function-by-Function Inventory

### 4.1 `useUIStore.ts`
- **Properties**: `isCommandPaletteOpen`, `isSettingsOpen`, `isAboutOpen`, `activeSettingsTab`, `isCheatsheetOpen`, `isDiffViewerOpen`, `isChatOpen`, `toasts`, `activeWebglPanes`, `maxWebglSlots` (12), `pendingClosePaneId`, `pendingQuit`, `pendingLayoutAction`, `isCreateWsModalOpen`, `activeViewMode` (`'hub'` | `'grid'`), `activeThreadTitle`.
- **Actions**:
  - `toggleCommandPalette()`, `setCommandPaletteOpen(open)`
  - `toggleSettings()`, `setAboutOpen(open)`, `toggleAbout()`, `setActiveSettingsTab(tab)`
  - `setCheatsheetOpen(open)`
  - `toggleDiffViewer()`, `setDiffViewerOpen(open)`
  - `toggleChat()`, `setChatOpen(open)`
  - `addToast(toast)`, `updateToast(id, patch)`, `removeToast(id)`
  - `acquireWebglSlot(paneId): boolean`, `releaseWebglSlot(paneId)`
  - `requestClosePane(paneId)`, `cancelPendingClose()`
  - `requestQuit()`, `cancelQuit()`
  - `requestSetLayoutPreset(count)`, `requestResetLayout()`, `confirmPendingLayoutAction()`, `cancelPendingLayoutAction()`
  - `requestSwitchWorkspace(wsId)`, `requestCreateWorkspace(name, opts)`, `openCreateWsModal()`, `closeCreateWsModal()`
  - `notifyMaxPanes()`
  - `setActiveViewMode(mode)`, `setActiveThreadTitle(title)`

### 4.2 `useWorkspaceStore.ts`
- **Properties**: `workspaces: Workspace[]`, `activeWorkspaceId: string`, `isLoading: boolean`.
- **Actions & Helpers**:
  - `createWorkspace(name, opts?: { activate, defaultCwd, overrides })`: Creates workspace, preserves background terminals, writes to disk.
  - `switchWorkspace(id)`: Preserves current workspace's live layout and view state in memory, writes sanitized copy to disk, hydrates target workspace layout and re-attaches running PTYs.
  - `renameWorkspace(id, newName)`: Renames workspace and persists immediately.
  - `duplicateWorkspace(id)`: Clones workspace with sanitized layout (fresh shells).
  - `setWorkspaceOverrides(id, overrides)`: Updates per-workspace appearance/font/shell overrides.
  - `setWorkspaceEmoji(id, emoji)`: Sets workspace emblem badge.
  - `toggleArchive(id)`: Toggles archived status; switches active workspace if archived.
  - `freshDefaultWorkspace(): Workspace`: Returns clean single-terminal workspace.
  - `deleteWorkspace(id)`: Terminates live PTYs; resets to fresh default workspace if deleting last workspace.
  - `loadWorkspaces(): Promise<void>`: Reads workspaces from disk, migrates schemas, restores sidebar order.
  - `saveCurrentWorkspace(): Promise<void>`: Sanitizes layout (strips PTY handles) and persists to disk.

### 4.3 `usePaneStore.ts`
- **Properties**: `root: PaneNode`, `focusedPaneId: string | null`, `maximizedPaneId: string | null`, `paneCount: number`, `maxPanes: number`, `layoutMode: 'preset' | 'custom'`, `presetCount: PresetCount`, `gridVersion: number`.
- **Actions & Helpers**:
  - `splitPane(targetId, direction: 'horizontal' | 'vertical'): boolean`: Splits target pane; sets ratio 0.5.
  - `closePane(targetId)`: Terminates PTY, removes node, promotes sibling, updates focus.
  - `setRatio(splitId, ratio)`: Updates split ratio clamped between `0.02` and `0.98`.
  - `setFocusedPane(id)`: Updates active pane focus.
  - `setPanePtyId(nodeId, ptyPaneId)`: Associates live backend PTY UUID.
  - `setPaneTitle(nodeId, title)`, `setPaneCwd(nodeId, cwd)`, `setPaneShell(nodeId, shell)`: Node property setters.
  - `setPaneAppearance(nodeId, patch)` / `clearPaneAppearance(nodeId)`: Per-pane appearance overrides.
  - `swapPanes(idA, idB)`: Swaps contents of two terminal nodes while preserving physical layout positions.
  - `toggleMaximize(id?)`: Toggles maximization state of specified or focused pane.
  - `navigateFocus(direction: 'left' | 'right' | 'up' | 'down' | 'next' | 'prev')`: 2D spatial Euclidean distance focus navigation or cyclic navigation.
  - `setLayoutPreset(count: PresetCount)`: Expands/shrinks grid to preset size non-destructively.
  - `resetLayout()`: Collapses grid to single pane, preserving active focused PTY.

### 4.4 `useSettingsStore.ts`
- **50+ Configuration Fields**: `fontSize`, `fontFamily`, `themeName`, `themeMode`, `scrollback`, `cursorBlink`, `cursorStyle`, `ipcBatchIntervalMs`, `fontLigatures`, `lineHeight`, `terminalOpacity`, `copyOnSelect`, `minimizeToTray`, `defaultShell`, `voiceToTerminal`, `voiceSilenceTimeoutMs`, `voiceInputDevice`, `maxPanes` (16), `minPaneSize` (120), `dividerSnap`, `snapEpsilon`, `doubleClickEqualize`, `toastMaxCount`, `toastDefaultDurationMs`, `paletteRecentsMax`, `autosaveIntervalMs`, `showSplash`, `confirmations`, `uiAccentColor`, `animationsEnabled`, `uiZoom`, `compactMode`, `sidebarWidth`, `rightClickPaste`, `clickableLinks`, `linkModifier`, `terminalBell`, `scrollOnOutput`, `wordSeparators`, `pasteConfirmNewlines`, `terminalPadding`, `cursorWidth`, `defaultCwd`, `shellArgs`, `shellEnv`, `maxWebglSlots`, `voiceLanguage`, `voiceModelSize`, `customThemes`, `userCommands`, `macros`, `launchAtLogin`, `startMaximized`, `startHidden`, `closeToTray`, `systemPrefersDark`.
- **Actions**:
  - `setFontSize(size)`, `increaseFontSize()`, `decreaseFontSize()`, `resetFontSize()`
  - `setFontFamily(family)`, `setThemeName(name)`, `setScrollback(lines)`, `setCursorBlink(blink)`, `setCursorStyle(style)`
  - `setIpcBatchIntervalMs(ms)`: Syncs to Rust backend.
  - `setVoiceSilenceTimeoutMs(ms)`, `setVoiceInputDevice(name)`: Syncs to Rust backend.
  - `updateSettings(patch)`: Updates settings, updates CSS variables, and synchronizes Rust backend.
  - `resetSettings()`: Restores defaults.
  - `exportSettings(): string` / `importSettings(json): boolean`: Settings JSON backup/restore.
  - `saveSettingsProfile(name)` / `loadSettingsProfile(name)` / `deleteSettingsProfile(name)` / `listSettingsProfiles()`: Named profile management.
  - `saveThemeAs(name, base)` / `duplicateTheme(id)` / `renameTheme(id, name)` / `deleteTheme(id)` / `updateThemeColors(id, patch)` / `importTheme(json)` / `exportTheme(id)`: Custom theme laboratory.

### 4.5 `useKeybindingsStore.ts`
- **Properties**: `keybindings: Record<string, Keybinding>`.
- **Actions**:
  - `updateKeybinding(id, newKey): boolean`: Updates keybinding with collision detection.
  - `resetKeybindings()`: Resets all 21 keybindings to defaults.
  - `getKeybinding(id): string`: Returns accelerator string.
  - `matchesKeybinding(e: KeyboardEvent, id): boolean`: Evaluates keyboard event matching.

### 4.6 `useVoiceStore.ts`
- **Properties**: `isListening: boolean`, `level: number` (0.0..1.0), `phase: VoicePhase` (`'idle'` | `'listening'` | `'transcribing'` | `'inserted'`), `lastTranscript: string | null`.
- **Actions**: `setListening(isListening)`, `setLevel(level)`, `setPhase(phase)`, `setLastTranscript(text)`.

### 4.7 `useAgentStore.ts`
- **Properties**: `isOpen`, `agents: DiscoveredAgent[]` (14 agents), `isScanning: boolean`, `selectedAgentId`, `selectedModel`, `selectedCliArgs`, `selectedInitialPrompt`, `selectedAutoStart`, `paneAssignments: Record<string, PaneAgentConfig>`.
- **Actions**:
  - `openLauncher()`, `closeLauncher()`
  - `setSelectedAgent(id)`, `setSelectedModel(model)`, `setSelectedCliArgs(args)`, `setSelectedInitialPrompt(prompt)`, `setSelectedAutoStart(autoStart)`
  - `assignAgentToPane(paneNodeId, config)`, `batchAssignAgentToAll(paneNodeIds, agentId, ...)`
  - `applyRolePod(pod, paneNodeIds)`: Provisions multi-agent heterogeneous pods.
  - `scanInstalledAgents(): Promise<void>`: Probes system PATH for CLI agents.
  - `provisionActivePanes(): Promise<number>`: Executes agent CLI commands across PTY panes.

### 4.8 `useCustomizationStore.ts`
- **Properties**: `isOpen`, `activeSection`, `workspaceName`, `workspaceIcon`, `colorRingHex`, `defaultCwd`, `gitBranch`, `isGitDirty`, `envVars`, `retroShader`, `stagedTheme`.
- **Actions**:
  - `openCustomizer(section)`, `closeCustomizer()`, `setActiveSection(section)`
  - `setWorkspaceName(name)`, `setWorkspaceIcon(icon)`, `setColorRingHex(hex)`, `setDefaultCwd(cwd)`, `setGitBranch(branch, isDirty)`, `setEnvVars(env)`
  - `setRetroShader(config)`, `applyShaderPreset(preset)`
  - `setDraftTheme(themeName)`, `setDraftFontFamily(family)`, `setDraftFontSize(size)`, `setDraftOpacity(opacity)`, etc.
  - `exportCodexThemeJson(): string`, `importCodexThemeJson(rawJson): boolean`, `applyCodexPreset(presetKey)`
  - `syncFromCurrentState()`

### 4.9 `useLayoutStudioStore.ts`
- **Properties**: `isOpen`, `activeTab` (`'presets'` | `'custom'`), `selectedPresetId`, `customRows`, `customCols`, `ratioMode`, `customRatioValue`, `gutterWidth`, `cornerRadius`, `terminalPadding`.
- **Actions**: `openStudio(presetId)`, `closeStudio()`, `setActiveTab(tab)`, `selectPreset(id)`, `setCustomGrid(rows, cols)`, `setRatioMode(mode, val)`, `setGutterWidth(w)`, `setCornerRadius(r)`, `setTerminalPadding(p)`, `buildActiveLayout(): PaneNode`.

### 4.10 `useOnboardingStore.ts`
- **Properties**: `isOpen`, `currentStep` (`'splash'` | `'layout'` | `'agents'` | `'customizer'` | `'launch'`), `draftLayout: PaneNode`, `presetSelected`, `paneAgentAssignments`, `workspaceName`, `workspaceEmoji`, `workspaceCwd`, `workspaceEnv`, `isLaunching`.
- **Actions**: `openOnboarding(step)`, `setStep(step)`, `nextStep()`, `prevStep()`, `skipToDefault()`, `setPresetSelected(preset)`, `assignAgentToPane(paneNodeId, config)`, `setWorkspaceIdentity(name, emoji, cwd)`, `setWorkspaceEnv(env)`, `completeAndLaunch(): Promise<void>`.

---

## 5. Exhaustive Rust Backend & System Subsystems (`src-tauri/`)

### 5.1 All 24 Registered `#[tauri::command]` Handlers

| # | Command Name | Arguments | Return Type | Details & Validation |
|---|---|---|---|---|
| 1 | `spawn_pty` | `cols: u16, rows: u16, cwd: Option<String>, shell: Option<String>, shell_args: Option<Vec<String>>, shell_env: Option<HashMap<String, String>>, env: Option<HashMap<String, String>>` | `Result<String, String>` | Clamps `cols >= 20`, `rows >= 5`. Spawns child in background thread. Returns live PTY UUID. |
| 2 | `batch_spawn_panes` | `specs: Vec<PaneSpawnSpec>` | `Result<Vec<BatchSpawnResult>, String>` | Sequentially spawns PTYs for all specs and runs optional initial commands. |
| 3 | `write_to_pty` | `pane_id: String, data: String` | `Result<(), String>` | Writes data bytes to target PTY stdin and flushes. |
| 4 | `resize_pty` | `pane_id: String, cols: u16, rows: u16` | `Result<(), String>` | Clamps `cols = max(20, cols)`, `rows = max(5, rows)`. Calls `MasterPty::resize`. |
| 5 | `kill_pty` | `pane_id: String` | `Result<(), String>` | Removes session; purges batcher; Unix: sends `SIGHUP` to process group (`-pid`), calls `child.kill()`, waits up to 500ms, sends `SIGKILL` if still alive. |
| 6 | `pane_snapshot` | `pane_id: String` | `Result<(String, bool), String>` | Returns snapshot tuple `(output_str, is_exited)` from `mcp_history` and `exited_panes`. |
| 7 | `discover_installed_agents` | None | `Result<Vec<AgentDiscoveryResult>, String>` | Scans system PATH and standard paths for 14 agent CLI tools with a 3s timeout per probe. |
| 8 | `set_batch_interval` | `interval_ms: u64` | `Result<u64, String>` | Clamps interval between 4ms and 2000ms. Updates `AtomicU64`. |
| 9 | `get_http_port` | None | `u16` | Returns HTTP port configured for MCP server (`VIBEGRID_HTTP_PORT` or default `8792`). |
| 10 | `save_workspace` | `workspace: WorkspaceData` | `Result<(), String>` | Validates `is_safe_id`. Writes to atomic `.tmp` file, flushes, `sync_all()`, renames. |
| 11 | `list_workspaces` | None | `Result<Vec<WorkspaceData>, String>` | Reads all `*.json` workspace files, parses, migrates, and sorts descending by `updated_at`. |
| 12 | `delete_workspace` | `id: String` | `Result<(), String>` | Validates `is_safe_id`. Deletes `{id}.json` file. |
| 13 | `voice_model_status` | None | `Result<VoiceModelStatus, String>` | Checks Whisper model file existence and byte size for active size/language. |
| 14 | `voice_ensure_model` | None | `Result<String, String>` | Downloads Whisper `.bin` file with progress events (`vibegrid://model-progress`) from HuggingFace mirrors to `.part`, flushes `sync_all()`, renames. |
| 15 | `voice_start_recording` | None | `Result<(), String>` | Starts low-latency `cpal` input stream, initializes `AudioMeter`, spawns VAD silence watcher. |
| 16 | `voice_stop_recording` | None | `Result<String, String>` | Stops stream, resamples to 16kHz, trims silence, runs Whisper inference. |
| 17 | `voice_cancel_recording` | None | `Result<(), String>` | Discards audio buffers without transcription. |
| 18 | `voice_set_silence_timeout` | `ms: u64` | `u64` | Clamps `ms` between 600ms and 5000ms. |
| 19 | `voice_set_input_device` | `name: String` | `Result<(), String>` | Sets preferred microphone input device name. |
| 20 | `voice_list_input_devices` | None | `Vec<String>` | Enumerates available host audio input device names via `cpal`. |
| 21 | `voice_set_language` | `language: String` | `String` | Configures language code (`"auto"`, `"en"`, etc.). Invalidates cached Whisper context if changed. |
| 22 | `voice_set_model_size` | `size: String` | `String` | Configures model size (`tiny`, `base`, `small`, `medium`). Invalidates context if changed. |
| 23 | `set_global_summon` | `accel: String` | `Result<String, String>` | Re-binds system-wide global summon accelerator key. |
| 24 | `autostart_set_enabled` | `enabled: bool` | `Result<(), String>` | Configures launch-at-login in OS registry/LaunchAgent. |

### 5.2 PTY Subsystem (`src-tauri/src/pty/`)
- **PtyManager (`manager.rs`)**:
  - Holds `Arc<Mutex<HashMap<String, PaneSession>>>`.
  - Default shell detection: Windows `COMSPEC` -> `powershell.exe`; macOS `SHELL` -> `/bin/zsh`; Linux `SHELL` -> `/bin/bash`.
  - Injects `TERM=xterm-256color`, `COLORTERM=truecolor`, `LANG=en_US.UTF-8`, `VIBEGRID=1` and custom environment variables.
  - Process group killing: sends `SIGHUP` to process group leader (`-pid`), calls `child.kill()`, polls with 500ms deadline, escalates to `SIGKILL`.
- **PtyReader (`reader.rs`)**:
  - Spawns a native OS thread per PTY.
  - Reads in 8KB chunks.
  - Evaluates `AtomicBool` backpressure flag: sleeps 10ms when buffer exceeds high watermark.

### 5.3 IPC Batcher (`src-tauri/src/ipc/`)
- **IpcBatcher (`batcher.rs`)**:
  - Default flush interval: `BATCH_INTERVAL_MS = 16` (~60 fps).
  - Interval dynamically clamped between 4ms and 2000ms.
  - Flow control watermarks: `HIGH_WATERMARK_BYTES = 10MB` (pauses reader), `LOW_WATERMARK_BYTES = 1MB` (resumes reader).
  - Output ring buffer: Retains latest 256KB per pane in `mcp_history`.
  - Multi-byte UTF-8 boundary slicing: Drains valid characters, keeps incomplete multibyte trailing bytes in buffer for next tick.
  - Emits `"terminal-batch"` and `"terminal-exit"`. Bounded exited pane cache (500 max, auto-pruned to 400).

### 5.4 Networking & Model Context Protocol (MCP) Server
- **Axum REST Server (`http_server.rs`)**:
  - Bound to port `8792` with fallback hunting `[port..port+5]`.
  - Protected with UUID v4 Bearer token with POSIX `0o600` permissions at `~/.vibegrid/token`.
  - `GET /panes` endpoint returns latest 32KB tail output per pane.
- **Stdio MCP Server (`mcp_server.rs`, `--mcp`)**:
  - Implements JSON-RPC 2.0 Model Context Protocol (`protocolVersion: 2024-11-05`).
  - Handlers: `initialize`, `notifications/initialized`, `tools/list`, and `tools/call` for `vibegrid_get_panes`.

### 5.5 Speech-to-Text Engine (`src-tauri/src/speech.rs`)
- **Audio Capture (`cpal`)**: Mono 16kHz linear resampling, lock-free `AtomicU32` RMS audio metering.
- **VAD Silence Watcher**: 80ms poll interval, exponential smoothing (`smoothed = smoothed * 0.65 + raw * 0.35`), 0.12 voice threshold, 600–5000ms silence timeout, 15s no-speech safety timeout.
- **Silence Trimming**: 50ms windows, 25ms hops, 150ms speech padding.
- **Whisper Inference**: Greedy sampling, suppress blank, multi-language support. Model download with HuggingFace fallback mirrors and streaming progress events (`vibegrid://model-progress`).

### 5.6 Autostart & Config Utilities
- **Autostart (`autostart.rs`)**: macOS LaunchAgent plist (`com.vibegrid.VibeGrid.plist`), Linux XDG desktop file, Windows registry key (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`).
- **Workspace Security (`config/workspace.rs`)**: Strict ID validation (`is_safe_id`: 1–128 alphanumeric, `-`, `_`), atomic persistence (`.tmp` write, flush, `sync_all()`, rename).

---

## 6. Complete Keyboard Shortcuts Reference

| Action ID | Action Description | Default Keybinding |
| :--- | :--- | :--- |
| `command-palette` | Open Command Palette | `Mod+Shift+P` |
| `open-settings` | Open Settings Panel | `Mod+,` |
| `toggle-sidebar` | Toggle Workspace Sidebar | `Mod+B` |
| `split-horizontal` | Split Pane Horizontally (Side by Side) | `Mod+D` |
| `split-vertical` | Split Pane Vertically (Stacked) | `Mod+Shift+E` |
| `close-pane` | Close Focused Pane | `Mod+W` |
| `toggle-maximize` | Maximize / Restore Focused Pane | `Mod+Shift+Enter` |
| `search-terminal` | Find in Terminal | `Mod+F` |
| `clear-terminal` | Clear Terminal Scrollback | `Mod+K` |
| `new-workspace` | Create New Workspace | `Mod+Shift+N` |
| `cycle-focus-next` | Cycle Focus to Next Pane | `Mod+Tab` |
| `cycle-focus-prev` | Cycle Focus to Previous Pane | `Mod+Shift+Tab` |
| `focus-left` | Move Focus Left | `Mod+ArrowLeft` |
| `focus-right` | Move Focus Right | `Mod+ArrowRight` |
| `focus-up` | Move Focus Up | `Mod+ArrowUp` |
| `focus-down` | Move Focus Down | `Mod+ArrowDown` |
| `switch-workspace-prev`| Switch to Previous Workspace | `Mod+Shift+ArrowLeft` |
| `switch-workspace-next`| Switch to Next Workspace | `Mod+Shift+ArrowRight`|
| `font-increase` | Increase Terminal Font Size | `Mod+=` (`Mod+Plus`) |
| `font-decrease` | Decrease Terminal Font Size | `Mod+-` (`Mod+Minus`) |
| `font-reset` | Reset Terminal Font Size | `Mod+0` |
| `open-layout-studio` | Open Layout Selection Studio | `Mod+Shift+L` |
| `open-agent-launcher` | Open AI Agent Launcher Modal | `Mod+Shift+A` |
| `toggle-diff-viewer` | Toggle Content-Aware Diff Viewer | `Mod+Shift+D` |
| `toggle-chat` | Toggle AI Agent Conversation Chat | `Mod+Shift+C` |
| `voice-toggle` | Toggle Voice-to-Terminal Dictation | `Mod+Shift+V` |
| `global-summon` | Summon VibeGrid Window (System-wide) | `Mod+Shift+Space` |

*(Note: `Mod` dynamically resolves to `Cmd` on macOS and `Ctrl` on Windows/Linux).*

---

## 7. Strategic Expansion Vectors for External AI Consultation

When sharing this specification with another AI agent or system architect, here are the top 6 areas ready for high-impact architectural proposals:

1. **Embedded Relational Database & Full-Text Search Layer**:
   - *Current*: Flat JSON files on disk and in-memory caches.
   - *Target*: Embedded SQLite (`rusqlite` / `tauri-plugin-sql`) with an **FTS5 index** across all historical terminal outputs. Enables sub-millisecond keyword searches across millions of lines of historical agent logs, compiler outputs, and execution transcripts.
2. **Hardware Security Vault Integration**:
   - *Current*: API keys stored in `localStorage` (`vibegrid_vault_v1`).
   - *Target*: Bridge into OS-native hardware keychains (`keyring-rs`): Apple Keychain Services, Windows Credential Manager / DPAPI, and Linux SecretService.
3. **Bidirectional Actionable MCP Gateway**:
   - *Current*: MCP server is read-only (`vibegrid_get_panes`).
   - *Target*: Add actionable MCP tools (`vibegrid_split_pane`, `vibegrid_write_pane`, `vibegrid_focus_pane`, `vibegrid_execute_macro`), allowing autonomous agents (Claude Code, Antigravity) to dynamically reshape their own multi-pane workspace layout based on task complexity.
4. **VT100 Session Recording & Time-Travel Playback**:
   - *Target*: Capture raw PTY byte streams with timestamps into compressed `.zst` recording files, allowing developers to scrub back in time to review how an agent refactored code step-by-step.
5. **Sandboxed WASM Plugin Marketplace**:
   - *Target*: Extensible plugin engine (Wasmtime / Extism) allowing community developers to contribute custom AI agent CLI definitions, procedural layout engines, and WebGL post-processing shaders.
6. **Realtime Multi-User Collaborative AI War Rooms**:
   - *Target*: Encrypted P2P pairing over WebRTC + CRDT (Yjs) so distributed engineering teams can co-pilot autonomous agent swarms running on a single host machine.

---
*End of Comprehensive VibeGrid Architectural Encyclopedia.*
