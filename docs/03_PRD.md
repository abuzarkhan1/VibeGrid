# VibeGrid — Product Requirements Document
## The Free, Open-Source Agentic Terminal Workspace

---

## 1. Product Overview

### 1.1 Product Name
**VibeGrid**

### 1.2 Tagline
"The free, open-source terminal grid for vibe coding."

### 1.3 Product Description
VibeGrid is a free, open-source desktop application that provides a GPU-
accelerated, multi-pane terminal workspace for developers who work with AI
coding agents. It replicates the core terminal grid experience of BridgeMind's
BridgeSpace — up to 16 terminal panes in a single window, with flexible
splitting, resizing, and workspace management — without any subscription fee,
cloud dependency, or proprietary lock-in.

VibeGrid is built with Tauri 2 and Rust, the same technology stack used by
BridgeSpace. It runs natively on macOS, Windows, and Linux. It is keyboard-first,
GPU-accelerated, and designed for developers who direct AI agents rather than
writing code by hand.

### 1.4 Product Vision
To democratize the agentic development workspace. BridgeSpace offers a powerful
terminal orchestration experience, but it is locked behind a $20/month
subscription. VibeGrid makes this experience available to every developer,
regardless of their budget, as a free and open-source application.

### 1.5 Product Mission
Build and maintain a production-quality terminal workspace that matches
BridgeSpace's terminal grid in performance, usability, and reliability, while
being completely free, open-source, and community-driven.

---

## 2. Target Audience

### 2.1 Primary Persona: The Solo AI Developer
**Name:** Alex
**Age:** 28
**Role:** Full-stack developer at a startup
**Technical Level:** Advanced
**Pain Points:**
- Uses multiple AI coding tools (Cursor, Claude Code, Aider) simultaneously
- Constantly switches between terminal windows to monitor different agents
- Cannot see all agents' progress at a glance
- Finds BridgeSpace's $20/month subscription expensive for a solo developer
**Needs:**
- A single window showing all AI agents working in parallel
- Fast, responsive terminal rendering that doesn't lag with many panes
- Free and open-source
**How VibeGrid Helps:**
- Alex opens VibeGrid, splits into 4 panes, and runs Cursor, Claude Code,
  Aider, and a test runner simultaneously
- Alex can see all four agents' output at a glance
- The GPU-accelerated rendering keeps everything smooth
- VibeGrid is free, so Alex saves $240/year

### 2.2 Secondary Persona: The Open Source Contributor
**Name:** Priya
**Age:** 32
**Role:** Open source maintainer
**Technical Level:** Expert
**Pain Points:**
- Wants a terminal multiplexer with GPU rendering
- tmux is powerful but lacks GPU acceleration and modern UX
- Warp terminal is polished but proprietary and expensive
- Wants to contribute to and customize the tool
**Needs:**
- A terminal workspace with modern rendering and UX
- Open source so it can be modified and extended
- Cross-platform support
**How VibeGrid Helps:**
- Priya uses VibeGrid as her daily terminal workspace
- She contributes bug fixes and new features to the project
- She customizes the theme and keybindings to her preference
- She runs VibeGrid on both her Mac and Linux machines

### 2.3 Tertiary Persona: The Student Developer
**Name:** Marcus
**Age:** 21
**Role:** Computer science student
**Technical Level:** Intermediate
**Pain Points:**
- Learning to use AI coding tools on a tight budget
- Cannot afford $20/month subscriptions
- Wants a professional-grade development environment
**Needs:**
- A free terminal workspace that supports AI tools
- Easy to install and use
- Works on his older laptop
**How VibeGrid Helps:**
- Marcus downloads VibeGrid for free
- He uses it to run local AI models (via Ollama) alongside his code editor
- The low memory footprint works well on his 8GB RAM laptop
- He learns terminal management skills that transfer to professional tools

### 2.4 Quaternary Persona: The Team Lead
**Name:** Sarah
**Age:** 35
**Role:** Engineering team lead
**Technical Level:** Advanced
**Pain Points:**
- Wants to standardize the team's terminal workspace
- Needs a tool that works on both Mac and Windows (team uses both)
- Concerned about data privacy (code should not leave the machine)
**Needs:**
- A cross-platform terminal workspace
- Local-first (no cloud dependency)
- Free (no per-seat licensing)
**How VibeGrid Helps:**
- Sarah recommends VibeGrid to her team
- Mac users and Windows users have the same experience
- All terminal sessions are local; no code is sent to external servers
- The team saves money compared to per-seat terminal licenses

---

## 3. User Stories

### 3.1 Terminal Pane Management

**US-001: Create First Terminal**
As a user, when I open VibeGrid, I see a single terminal pane occupying the
entire window, so that I can immediately start typing commands.
Acceptance Criteria:
- Application launches with exactly 1 terminal pane
- The terminal is focused and ready for input within 1 second
- The shell is the user's default shell (zsh on macOS, bash on Linux,
  PowerShell on Windows)

**US-002: Split Pane Horizontally**
As a user, I can split the focused pane horizontally (side by side) by pressing
Cmd/Ctrl+D, so that I can run two terminals next to each other.
Acceptance Criteria:
- Pressing Cmd/Ctrl+D splits the focused pane into two panes side by side
- The new pane spawns a new shell process
- Focus moves to the new pane
- The split ratio is 50/50 by default
- The operation takes less than 100ms

**US-003: Split Pane Vertically**
As a user, I can split the focused pane vertically (stacked) by pressing
Cmd/Ctrl+Shift+D, so that I can run two terminals on top of each other.
Acceptance Criteria:
- Pressing Cmd/Ctrl+Shift+D splits the focused pane into two stacked panes
- The new pane spawns a new shell process
- Focus moves to the new pane
- The split ratio is 50/50 by default
- The operation takes less than 100ms

**US-004: Close Pane**
As a user, I can close the focused pane by pressing Cmd/Ctrl+W, so that I can
reduce the number of terminals when I no longer need them.
Acceptance Criteria:
- Pressing Cmd/Ctrl+W closes the focused pane
- The shell process is terminated
- The sibling pane expands to fill the space
- Focus moves to the nearest remaining pane
- If the last pane is closed, a new empty terminal is created
- The operation takes less than 50ms

**US-005: Maximum Pane Limit**
As a user, I cannot create more than 16 panes, so that the application maintains
acceptable performance.
Acceptance Criteria:
- When the pane count is 16, pressing Cmd/Ctrl+D or Cmd/Ctrl+Shift+D does not
  create a new pane
- A notification is shown: "Maximum pane limit reached (16)"
- The notification auto-dismisses after 3 seconds

**US-006: Dynamic Pane Count**
As a user, I can have any number of panes from 1 to 16, so that I can customize
the workspace to my current task.
Acceptance Criteria:
- The user can create 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, or 16 panes
- The layout adapts to any number of panes
- There is no requirement to use all 16 panes

**US-007: Resize Panes**
As a user, I can resize panes by dragging the dividers between them, so that I
can give more space to the terminals I am focusing on.
Acceptance Criteria:
- Dragging a divider resizes the adjacent panes
- The minimum pane size is 10% of the available space
- The maximum pane size is 90% of the available space
- Resizing is smooth (no jitter or lag)
- The terminal content reflows to fit the new size
- The shell process is notified of the new size

**US-008: Maximize Pane**
As a user, I can maximize a pane to full screen by double-clicking it or pressing
Cmd/Ctrl+Shift+Enter, so that I can focus on a single terminal.
Acceptance Criteria:
- Double-clicking a pane maximizes it to fill the entire window
- Pressing Cmd/Ctrl+Shift+Enter toggles maximize/restore
- The layout is preserved and restored when the pane is un-maximized
- The maximized pane shows a visual indicator (e.g., a "Restore" button)

**US-009: Navigate Between Panes**
As a user, I can move focus between panes using keyboard shortcuts, so that I
can switch between terminals without reaching for the mouse.
Acceptance Criteria:
- Cmd/Ctrl+Arrow Left/Right/Up/Down moves focus to the adjacent pane in that
  direction
- Cmd/Ctrl+Tab cycles focus to the next pane
- Cmd/Ctrl+Shift+Tab cycles focus to the previous pane
- The focused pane is visually indicated (e.g., a highlighted border)

### 3.2 Terminal Operations

**US-010: Type Commands**
As a user, I can type commands into the focused terminal, so that I can interact
with the shell.
Acceptance Criteria:
- Keystrokes appear in the terminal within 10ms
- All standard keys work: letters, numbers, symbols, Enter, Tab, Backspace,
  Escape, arrow keys, Home, End, Page Up, Page Down
- Modifier keys work: Ctrl+C, Ctrl+D, Ctrl+Z, Ctrl+L, etc.
- The terminal responds to commands normally

**US-011: Copy and Paste**
As a user, I can copy text from the terminal and paste text into the terminal,
so that I can transfer data between the terminal and other applications.
Acceptance Criteria:
- Cmd/Ctrl+C copies selected text to the system clipboard
- Cmd/Ctrl+V pastes text from the system clipboard into the terminal
- Text selection works with mouse drag and Shift+Arrow keys
- Multi-line copy and paste works correctly

**US-012: Scroll Terminal**
As a user, I can scroll through the terminal's scrollback buffer, so that I can
review previous output.
Acceptance Criteria:
- Mouse wheel scrolls the terminal
- Shift+Page Up/Page Down scrolls the terminal
- The scrollback buffer holds at least 5000 lines (configurable)
- Scrolling is smooth and responsive

**US-013: Search in Terminal**
As a user, I can search for text in the terminal's scrollback buffer, so that I
can find specific output.
Acceptance Criteria:
- Cmd/Ctrl+F opens a search bar
- The search bar has a text input, next/previous buttons, and a close button
- Matches are highlighted in the terminal
- Enter finds the next match, Shift+Enter finds the previous match
- Escape closes the search bar

**US-014: Clear Terminal**
As a user, I can clear the terminal's scrollback buffer, so that I can start
with a clean view.
Acceptance Criteria:
- Cmd/Ctrl+K clears the scrollback buffer and the visible screen
- The shell process is not affected (it continues running)
- The operation is immediate

**US-015: Adjust Font Size**
As a user, I can increase or decrease the terminal font size, so that I can
read the terminal comfortably on different screen sizes.
Acceptance Criteria:
- Cmd/Ctrl+Plus increases font size by 1px
- Cmd/Ctrl+Minus decreases font size by 1px
- Cmd/Ctrl+0 resets font size to the default (14px)
- Font size range: 8px to 32px
- The change applies to all terminal panes
- The terminal reflows to fit the new font size

### 3.3 Workspace Management

**US-016: Create Workspace**
As a user, I can create a new workspace, so that I can group terminals by project.
Acceptance Criteria:
- Cmd/Ctrl+Shift+N creates a new workspace
- The new workspace starts with a single terminal pane
- The user can name the workspace
- The workspace appears in the workspace switcher

**US-017: Switch Workspace**
As a user, I can switch between workspaces, so that I can move between projects.
Acceptance Criteria:
- Cmd/Ctrl+Shift+Left/Right switches to the previous/next workspace
- The workspace switcher shows all workspaces with their names
- Switching workspaces restores the layout and terminal sessions
- Terminal processes continue running in the background when not visible
- Switching takes less than 200ms

**US-018: Workspace Persistence**
As a user, my workspaces are saved automatically, so that they survive application
restarts.
Acceptance Criteria:
- Workspace layouts are saved when the application exits
- Workspace layouts are loaded when the application starts
- The user returns to the last active workspace on startup
- Terminal content (scrollback) is NOT persisted (terminals start fresh)

### 3.4 Application Management

**US-019: Command Palette**
As a user, I can open a command palette to search and execute actions, so that I
can access all features without memorizing keyboard shortcuts.
Acceptance Criteria:
- Cmd/Ctrl+Shift+P opens the command palette
- The palette shows a searchable list of all available actions
- Each action shows its name and keyboard shortcut
- Typing filters the list in real-time
- Enter executes the selected action
- Escape closes the palette
- Recently used actions appear at the top

**US-020: Settings**
As a user, I can open a settings panel to configure the application, so that I
can customize VibeGrid to my preferences.
Acceptance Criteria:
- Cmd/Ctrl+Comma opens the settings panel
- Settings include: font family, font size, theme, scrollback lines, default
  shell, keyboard shortcuts
- Settings are saved automatically when changed
- Settings persist across application restarts

**US-021: Theme Selection**
As a user, I can choose from multiple color themes, so that I can customize the
appearance of VibeGrid.
Acceptance Criteria:
- At least 5 built-in themes are available
- Themes affect the terminal colors, pane borders, toolbar, and status bar
- Theme switching is instant (no restart required)
- The selected theme persists across application restarts

**US-022: Keyboard Shortcut Customization**
As a user, I can customize keyboard shortcuts, so that I can use shortcuts that
match my muscle memory.
Acceptance Criteria:
- All keyboard shortcuts are listed in the settings panel
- The user can reassign any shortcut
- Conflicting shortcuts are detected and warned
- Custom shortcuts persist across application restarts
- A "Reset to Defaults" button restores the default shortcuts

---

## 4. Feature Priority Matrix

| Feature | Priority | Phase | Effort |
|---------|----------|-------|--------|
| Single terminal pane | P0 (Must) | Phase 1 | Low |
| Horizontal split | P0 (Must) | Phase 2 | Medium |
| Vertical split | P0 (Must) | Phase 2 | Medium |
| Close pane | P0 (Must) | Phase 2 | Low |
| Resize panes | P0 (Must) | Phase 2 | Medium |
| Focus navigation | P0 (Must) | Phase 2 | Low |
| Maximize/restore | P1 (Should) | Phase 3 | Low |
| Copy/paste | P0 (Must) | Phase 3 | Low |
| Scrollback | P0 (Must) | Phase 3 | Low |
| Font size adjustment | P1 (Should) | Phase 3 | Low |
| Search in terminal | P1 (Should) | Phase 4 | Medium |
| Clear terminal | P1 (Should) | Phase 3 | Low |
| Command palette | P1 (Should) | Phase 4 | Medium |
| Settings panel | P1 (Should) | Phase 4 | Medium |
| Theme system | P1 (Should) | Phase 4 | Medium |
| Workspaces | P2 (Could) | Phase 5 | High |
| Workspace persistence | P2 (Could) | Phase 5 | Medium |
| Keyboard customization | P2 (Could) | Phase 6 | Medium |
| Custom themes | P3 (Won't) | Phase 7 | Medium |
| Plugin system | P3 (Won't) | Phase 8 | High |
| AI agent API | P3 (Won't) | Phase 8 | High |

---

## 5. User Journeys

### 5.1 Journey: First Launch
1. User downloads VibeGrid from GitHub Releases
2. User installs the application (drag to Applications on Mac, run installer on Windows)
3. User opens VibeGrid
4. The application window appears with a single terminal pane
5. The terminal is focused and shows the shell prompt
6. A subtle tooltip appears: "Press Cmd/Ctrl+D to split, Cmd/Ctrl+Shift+P for commands"
7. The user types a command and sees the output
8. The user presses Cmd/Ctrl+D and sees the pane split into two
9. The user types in both panes and sees both respond independently
10. The user is satisfied and begins using VibeGrid as their daily terminal

### 5.2 Journey: Multi-Agent Workflow
1. User opens VibeGrid
2. User presses Cmd/Ctrl+D three times to create 4 panes
3. In Pane 1, user starts an AI coding agent (e.g., "aider")
4. In Pane 2, user starts another AI agent (e.g., "claude-code")
5. In Pane 3, user starts a development server (e.g., "npm run dev")
6. In Pane 4, user starts a test runner (e.g., "npm test -- --watch")
7. User resizes panes to give more space to the AI agents
8. User monitors all four panes simultaneously
9. User sees an error in Pane 4, switches focus to Pane 1, and directs the AI
   agent to fix it
10. User sees the fix applied in Pane 2 and the tests passing in Pane 4
11. User is productive and never switched windows

### 5.3 Journey: Workspace Switching
1. User creates a workspace called "Frontend Project"
2. User splits into 3 panes: dev server, AI agent, test runner
3. User presses Cmd/Ctrl+Shift+N to create a new workspace called "Backend Project"
4. User splits into 2 panes: API server, AI agent
5. User presses Cmd/Ctrl+Shift+Left to switch back to "Frontend Project"
6. All 3 panes are restored with their processes still running
7. User presses Cmd/Ctrl+Shift+Right to switch to "Backend Project"
8. Both panes are restored
9. User is managing two projects without opening two terminal windows

---

## 6. Competitive Analysis

### 6.1 Direct Competitors

**BridgeSpace (BridgeMind)**
- Strengths: Integrated AI orchestration, Kanban, memory, polished UX
- Weaknesses: $20/month subscription, proprietary, closed source
- VibeGrid Advantage: Free, open source, no subscription

**Warp Terminal**
- Strengths: Modern UX, AI integration, polished
- Weaknesses: Proprietary, cloud-dependent, limited free tier
- VibeGrid Advantage: Free, open source, local-first, no cloud dependency

**iTerm2 (macOS only)**
- Strengths: Feature-rich, mature, free
- Weaknesses: macOS only, no GPU rendering, no multi-pane grid like BridgeSpace
- VibeGrid Advantage: Cross-platform, GPU-accelerated, BridgeSpace-style grid

**Windows Terminal**
- Strengths: GPU-accelerated, free, Microsoft-maintained
- Weaknesses: Windows only, no multi-pane grid (tabs only)
- VibeGrid Advantage: Cross-platform, multi-pane grid

### 6.2 Indirect Competitors

**tmux / screen / Zellij**
- Strengths: Terminal multiplexing, scriptable, free
- Weaknesses: No GPU rendering, steep learning curve, text-based UI
- VibeGrid Advantage: GPU rendering, modern GUI, easier to use

**VS Code Integrated Terminal**
- Strengths: Integrated with editor, free, cross-platform
- Weaknesses: Limited to VS Code, not a standalone terminal workspace
- VibeGrid Advantage: Standalone, focused on terminal grid, lighter weight

**Alacritty / Kitty**
- Strengths: GPU-accelerated, fast, free, open source
- Weaknesses: Single terminal only, no built-in multi-pane grid
- VibeGrid Advantage: Built-in multi-pane grid, workspace management

---

## 7. Success Metrics

### 7.1 Product Metrics
- Application cold start time: under 1 second
- Keystroke-to-display latency: under 10ms
- Frame rate with 16 panes streaming: above 45 FPS
- Memory usage with 16 panes: under 400 MB
- Binary size: under 20 MB per platform
- Crash rate: less than 0.1% of sessions

### 7.2 Adoption Metrics
- GitHub stars: 1,000 within 6 months of release
- Downloads: 10,000 within 6 months of release
- Contributors: 10 within 6 months of release
- Community: 500 Discord members within 6 months of release

### 7.3 Quality Metrics
- Test coverage: above 80% for Rust backend, above 70% for React frontend
- Open bugs: fewer than 20 at any time
- Critical bugs: zero at release time
- User-reported issues resolved within 7 days (median)

---

## 8. Release Strategy

### 8.1 Version Numbering
VibeGrid uses semantic versioning: MAJOR.MINOR.PATCH

- MAJOR: Breaking changes (rare)
- MINOR: New features, backwards compatible
- PATCH: Bug fixes, backwards compatible

### 8.2 Release Cadence
- Major releases: Every 3 months
- Minor releases: Every 6 weeks
- Patch releases: As needed (within 1 week of critical bug)

### 8.3 Release Channels
- **Stable:** Fully tested, recommended for all users
- **Beta:** New features, may have bugs, for early adopters
- **Nightly:** Latest development build, may be unstable, for contributors

### 8.4 Distribution Channels
- GitHub Releases: Primary download location
- Homebrew (macOS): "brew install vibegrid"
- Winget (Windows): "winget install vibegrid"
- AUR (Linux Arch): "yay -S vibegrid"
- Flathub (Linux): "flatpak install vibegrid"
- Snap Store (Linux): "snap install vibegrid"

---

## 9. Open Source Strategy

### 9.1 License
VibeGrid is licensed under the MIT License. This is the most permissive
open-source license, allowing anyone to use, modify, and distribute VibeGrid
for any purpose, including commercial use, with no obligation to share
modifications.

### 9.2 Contribution Guidelines
- Contributions are accepted via GitHub Pull Requests
- All contributions must pass CI checks (tests, linting, type checking)
- New features require tests
- Bug fixes require regression tests
- Code style is enforced by automated formatters (rustfmt, prettier)
- Commit messages follow the Conventional Commits specification

### 9.3 Governance
VibeGrid is maintained by a small team of core contributors. Decisions about
features, architecture, and releases are made by the core team after community
discussion in GitHub Issues and Discord.

### 9.4 Community
- GitHub Discussions: For questions, ideas, and general discussion
- GitHub Issues: For bug reports and feature requests
- Discord: For real-time community chat
- Twitter/X: For announcements and updates

---

## 10. Branding

### 10.1 Name: VibeGrid
- "Vibe" references the "vibe coding" philosophy popularized by BridgeMind
- "Grid" references the multi-pane terminal grid layout
- Together, "VibeGrid" communicates: "The grid for vibe coding"

### 10.2 Logo Concept
- A 2x2 grid of rounded rectangles
- Each rectangle represents a terminal pane
- One rectangle is highlighted (the focused pane)
- Color scheme: Dark background with a bright green accent
- The logo should be recognizable at small sizes (16x16, 32x32)

### 10.3 Color Palette
- Primary: #00ff88 (bright green, "vibe" energy)
- Background: #0a0a0f (very dark, terminal aesthetic)
- Surface: #1a1a2e (dark surface for panels)
- Text: #e0e0e0 (light gray for readability)
- Accent: #00ff88 (same as primary, for focus indicators)
- Error: #ff4444 (red for errors)
- Warning: #ffaa00 (amber for warnings)

### 10.4 Typography
- Application UI: System font (San Francisco on macOS, Segoe UI on Windows)
- Terminal: Bundled monospace font (JetBrains Mono)
- Headings: Semi-bold, 16-24px
- Body: Regular, 14px
- Terminal: Regular, 14px (default, configurable)

---

## 11. Out of Scope (Explicitly Excluded)

The following features are explicitly out of scope for VibeGrid. They are part
of BridgeSpace's broader ecosystem but are not part of the terminal grid:

- Kanban board (BridgeBoard)
- AI agent orchestration (BridgeSwarm)
- Shared agent memory (BridgeMemory)
- Built-in code editor
- Built-in web browser
- Drag-and-drop skills
- Voice coding (BridgeVoice)
- Autonomous agent (BridgeAgent)
- MCP server integration
- Screenshot tool (BridgeShot)
- Cloud synchronization
- User accounts and authentication
- Payment processing
- Telemetry and analytics

These features may be considered in future versions if the community requests
them, but they are not part of the initial release.

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| Pane | A single terminal instance within the grid |
| Split | A division of a pane into two child panes |
| Grid | The collection of all panes in a window |
| Workspace | A named collection of panes with a specific layout |
| PTY | Pseudo-Terminal, a virtual terminal device |
| ConPTY | Windows Console Pseudo-Terminal |
| IPC | Inter-Process Communication |
| Batching | Combining multiple messages into a single message |
| Scrollback | Lines that have scrolled off the top of the visible terminal |
| ANSI Escape Codes | Control sequences for terminal formatting |
| WebGL | Web Graphics Library, used for GPU-accelerated rendering |
| Tauri | Desktop application framework using Rust + WebView |
| Vibe Coding | Development paradigm where AI agents write code and humans direct |