# VibeGrid — Implementation Plan
## Complete Development Roadmap

---

## 1. Overview

This document defines the complete implementation plan for VibeGrid. The plan is
organized into 8 phases, each building upon the previous one. The total estimated
timeline is 12 weeks for a single full-time developer, or 20 weeks for a
part-time developer.

Each phase includes:
- Phase objective
- Detailed tasks
- Deliverables
- Testing strategy
- Risks and mitigations
- Estimated effort

The plan follows an incremental approach: at the end of each phase, the
application is in a working state that can be tested and demonstrated. This
ensures that progress is visible and feedback can be incorporated early.

---

## 2. Phase 0: Environment Setup and Project Scaffolding
**Duration:** 1 week
**Objective:** Set up the development environment, initialize the project, and
establish the build pipeline.

### 2.1 Tasks

**Task 0.1: Install Development Tools**
- Install Rust via rustup (latest stable)
- Install Node.js LTS version
- Install npm (bundled with Node.js)
- Install Git
- Install a code editor (VS Code recommended)
- Install platform-specific build tools:
  - macOS: Xcode Command Line Tools
  - Windows: Microsoft Visual Studio C++ Build Tools
  - Linux: build-essential, libwebkit2gtk-4.1-dev, libgtk-3-dev

**Task 0.2: Initialize Tauri Project**
- Use the Tauri CLI to create a new project with React and TypeScript template
- Verify that the project builds and runs in development mode
- Verify that the project builds for production
- Verify that the application window opens and displays the React frontend

**Task 0.3: Configure Project Structure**
- Create the frontend directory structure (components, hooks, store, lib, types)
- Create the Rust backend directory structure (pty, ipc, config modules)
- Add placeholder files for all modules
- Configure path aliases in TypeScript and Vite for clean imports

**Task 0.4: Set Up Code Quality Tools**
- Configure ESLint for TypeScript linting
- Configure Prettier for TypeScript formatting
- Configure rustfmt for Rust formatting
- Configure clippy for Rust linting
- Add pre-commit hooks to run formatters and linters automatically

**Task 0.5: Set Up CI/CD Pipeline**
- Create GitHub Actions workflow for pull requests:
  - Run TypeScript type checking
  - Run ESLint
  - Run Rust clippy
  - Run Rust tests
  - Build for all platforms
- Create GitHub Actions workflow for releases:
  - Build for all platforms
  - Create GitHub Release with binaries
  - Generate checksums

**Task 0.6: Initialize Git Repository**
- Create a GitHub repository (public)
- Add a README with project description, badges, and screenshots placeholder
- Add a LICENSE file (MIT License)
- Add a .gitignore for Rust, Node.js, and IDE files
- Add a CONTRIBUTING guide
- Add a CHANGELOG file
- Make the initial commit

### 2.2 Deliverables
- A working Tauri + React + TypeScript project that builds and runs
- Complete directory structure with placeholder files
- CI/CD pipeline running on GitHub Actions
- Git repository with initial commit

### 2.3 Testing
- Verify that "npm run tauri dev" opens the application window
- Verify that "npm run tauri build" produces a production binary
- Verify that CI/CD pipeline passes on the initial commit

### 2.4 Risks
- **Risk:** Tauri v2 has different APIs than Tauri v1; some documentation may
  be outdated.
  **Mitigation:** Use the official Tauri v2 documentation and examples. Join the
  Tauri Discord for support.

---

## 3. Phase 1: Single Terminal Pane
**Duration:** 1 week
**Objective:** Get a single terminal pane working — spawn a shell, display
output, and accept input.

### 3.1 Tasks

**Task 1.1: Rust PTY Spawner**
- Implement the PTY Manager module in Rust
- Implement the spawn_pane function:
  - Create a PTY pair using portable-pty
  - Determine the default shell based on the operating system
  - Set environment variables (TERM, COLORTERM, LANG, VIBEGRID)
  - Spawn the shell process on the PTY slave
  - Store the PTY master handle in the pane registry
  - Return the pane ID (UUID)
- Implement the kill_pane function:
  - Terminate the shell process
  - Close the PTY master handle
  - Remove the pane from the registry
- Implement the write_to_pane function:
  - Write input bytes to the PTY master
- Implement the resize_pane function:
  - Resize the PTY to new dimensions

**Task 1.2: Rust PTY Reader**
- Implement an asynchronous read loop for the PTY master
- The read loop continuously reads bytes from the PTY master
- When bytes are available, forward them to the IPC batcher
- Handle read errors (e.g., shell process exited) gracefully
- Stop the read loop when the pane is closed

**Task 1.3: Tauri IPC Commands**
- Register the following Tauri commands:
  - spawn_pty: Takes cols and rows, returns pane ID
  - write_to_pty: Takes pane ID and data string
  - resize_pty: Takes pane ID, cols, and rows
  - kill_pty: Takes pane ID
- Each command calls the corresponding PTY Manager function
- Handle errors and return appropriate error messages

**Task 1.4: Frontend Terminal Component**
- Create the TerminalPane React component
- Initialize xterm.js inside the component
- Load the Fit addon for auto-resizing
- Load the WebGL addon for GPU rendering (with Canvas fallback)
- Load the Web Links addon for clickable URLs
- Connect xterm.js onData to the write_to_pty Tauri command
- Connect xterm.js onResize to the resize_pty Tauri command
- Listen for the terminal-batch Tauri event and write output to xterm.js
- Call spawn_pty on component mount
- Call kill_pty on component unmount

**Task 1.5: IPC Batcher (Initial Version)**
- Implement a basic IPC batcher in Rust:
  - Collect PTY output in a buffer
  - Every 16ms, flush the buffer as a Tauri event
  - The event payload is a map of pane ID to output string
- For Phase 1, there is only one pane, so batching is trivial
- The batcher will be enhanced in Phase 2 for multiple panes

**Task 1.6: Basic Layout**
- Render a single TerminalPane filling the entire window
- Apply basic styling: dark background, no borders, no toolbar
- Ensure the terminal resizes when the window is resized

### 3.2 Deliverables
- A working single-terminal application
- The user can type commands and see output
- The shell is the user's default shell
- GPU-accelerated rendering is active

### 3.3 Testing
- **Unit Tests (Rust):**
  - Test PTY spawn and kill
  - Test write to PTY
  - Test resize PTY
- **Integration Tests:**
  - Launch the app, type "echo hello", verify "hello" appears
  - Launch the app, type "ls", verify directory listing appears
  - Resize the window, verify terminal reflows correctly
- **Performance Tests:**
  - Measure startup time (target: under 1 second)
  - Measure keystroke latency (target: under 10ms)

### 3.4 Risks
- **Risk:** portable-pty may have issues on certain Windows versions.
  **Mitigation:** Test on Windows 10 and Windows 11. If ConPTY issues arise,
  test with different shells (cmd, PowerShell, pwsh).

---

## 4. Phase 2: Multi-Pane Grid
**Duration:** 2 weeks
**Objective:** Implement the split/resize/close layout engine supporting 1 to 16
panes.

### 4.1 Tasks

**Task 2.1: Layout Tree Data Structure**
- Define the PaneNode type (terminal node or split node)
- Implement the Pane Store using Zustand:
  - root: The root node of the layout tree
  - focusedPaneId: The currently focused pane
  - paneCount: The current number of panes
  - maxPanes: 16
- Implement tree manipulation functions:
  - findNode: Find a node by ID in the tree
  - splitNode: Replace a terminal node with a split node containing two children
  - closeNode: Remove a terminal node and promote its sibling
  - updateRatio: Update a split node's ratio
  - traverse: Visit all nodes in the tree

**Task 2.2: Split Operations**
- Implement horizontal split (Cmd/Ctrl+D):
  - Check if pane count is below 16
  - Find the focused terminal node
  - Create a split node with direction "horizontal"
  - The original terminal becomes the first child
  - A new terminal is created as the second child
  - The split ratio is 0.5
  - The pane count is incremented
  - Focus moves to the new terminal
- Implement vertical split (Cmd/Ctrl+Shift+D):
  - Same as horizontal but direction is "vertical"
- Implement the maximum pane limit check:
  - If pane count is 16, show a notification and do not split

**Task 2.3: Close Operations**
- Implement close pane (Cmd/Ctrl+W):
  - Find the focused terminal node
  - Kill the shell process via Tauri command
  - Remove the terminal node from the tree
  - If the parent is a split node, promote the sibling
  - If the closed pane was the root, create a new terminal
  - Decrement the pane count
  - Move focus to the nearest remaining pane

**Task 2.4: Grid Rendering**
- Create the GridRenderer component:
  - Takes the root PaneNode as input
  - Recursively renders the layout tree
  - Terminal nodes render TerminalPane components
  - Split nodes render Allotment components with the appropriate direction
  - Split ratios are applied to Allotment
- Integrate the allotment library:
  - Install allotment
  - Configure Allotment for horizontal and vertical splits
  - Handle the onChange event for resize operations

**Task 2.5: Resize Operations**
- Handle Allotment's onChange event:
  - When a divider is dragged, update the split ratio in the Pane Store
  - Clamp the ratio between 0.1 and 0.9
  - The layout re-renders with the new ratio
  - Terminal panes detect the size change via ResizeObserver
  - The Fit addon recalculates columns and rows
  - The resize_pty Tauri command is called with new dimensions

**Task 2.6: Focus Management**
- Implement focus tracking:
  - Clicking a pane focuses it
  - The focused pane shows a visual indicator (border color change)
  - Keyboard input goes only to the focused pane
- Implement keyboard navigation:
  - Cmd/Ctrl+Arrow keys move focus to adjacent panes
  - Cmd/Ctrl+Tab cycles focus
  - The layout tree is traversed to find the adjacent pane in the specified
    direction

**Task 2.7: Pane Toolbar**
- Create the TerminalToolbar component:
  - Shows pane title, split buttons, close button, maximize button
  - Appears on hover or focus
  - Buttons trigger the corresponding actions
- Style the toolbar to be semi-transparent and unobtrusive

### 4.2 Deliverables
- A working multi-pane terminal grid
- The user can split, close, resize, and navigate between panes
- The pane count is dynamic from 1 to 16
- GPU-accelerated rendering works with multiple panes

### 4.3 Testing
- **Unit Tests (TypeScript):**
  - Test layout tree manipulation (split, close, find, traverse)
  - Test ratio clamping
  - Test pane count enforcement
- **Integration Tests:**
  - Split into 2 panes, type in both, verify independent operation
  - Split into 4 panes, resize dividers, verify content reflows
  - Split into 16 panes, verify all render correctly
  - Attempt to split beyond 16, verify notification appears
  - Close panes down to 1, verify layout is correct
  - Navigate between panes with keyboard, verify focus changes
- **Performance Tests:**
  - Measure frame rate with 4, 8, 16 panes streaming output
  - Measure memory usage with 4, 8, 16 panes
  - Measure split operation latency

### 4.4 Risks
- **Risk:** WebGL context limit may be reached with 16 panes.
  **Mitigation:** Test with 16 panes on multiple browsers/WebViews. If the limit
  is reached, implement context pooling or Canvas fallback for excess panes.

- **Risk:** Allotment may not handle deeply nested splits well.
  **Mitigation:** Test with complex layouts (e.g., 16 panes with various split
  directions). If performance issues arise, consider implementing a custom layout
  engine.

---

## 5. Phase 3: Terminal Features
**Duration:** 2 weeks
**Objective:** Implement essential terminal features: copy/paste, scrollback,
search, font size, maximize/restore.

### 5.1 Tasks

**Task 3.1: Copy and Paste**
- Implement text selection in xterm.js:
  - Mouse drag selects text
  - Double-click selects a word
  - Triple-click selects a line
- Implement copy:
  - Cmd/Ctrl+C copies selected text to the system clipboard via Tauri clipboard
    plugin
  - If no text is selected, Cmd/Ctrl+C sends SIGINT (standard behavior)
- Implement paste:
  - Cmd/Ctrl+V pastes clipboard content into the terminal
  - Multi-line paste works correctly

**Task 3.2: Scrollback Buffer**
- Configure xterm.js scrollback to 5000 lines (default)
- Implement mouse wheel scrolling
- Implement Shift+Page Up/Down scrolling
- Implement Cmd/Ctrl+K to clear scrollback

**Task 3.3: Search**
- Load the xterm.js Search addon
- Create a SearchBar component:
  - Text input for the query
  - Next/Previous buttons
  - Close button
  - Match count indicator
- Open search with Cmd/Ctrl+F
- Highlight matches in the terminal
- Navigate matches with Enter/Shift+Enter
- Close with Escape

**Task 3.4: Font Size Adjustment**
- Implement Cmd/Ctrl+Plus to increase font size
- Implement Cmd/Ctrl+Minus to decrease font size
- Implement Cmd/Ctrl+0 to reset font size
- Apply font size to all terminal panes
- Reflow terminal content on font size change
- Persist font size in settings

**Task 3.5: Maximize and Restore**
- Implement double-click to maximize a pane
- Implement Cmd/Ctrl+Shift+Enter to toggle maximize/restore
- When maximized:
  - The pane fills the entire window
  - All other panes are hidden
  - A "Restore" button appears in the toolbar
- When restored:
  - The previous layout is restored
  - All panes are visible again

**Task 3.6: Clear Terminal**
- Implement Cmd/Ctrl+K to clear the terminal
- Clear the visible area and scrollback buffer
- The shell process is not affected

**Task 3.7: Clickable URLs**
- The Web Links addon is already loaded in Phase 1
- Verify that URLs are detected and clickable
- Test with various URL formats (http, https, with ports, with paths)

### 5.1 Deliverables
- All essential terminal features working
- Copy/paste, scrollback, search, font size, maximize/restore are functional
- The terminal experience is comparable to a mature terminal emulator

### 5.2 Testing
- **Integration Tests:**
  - Copy text, paste into another application, verify content matches
  - Paste multi-line text, verify it appears correctly
  - Scroll through 5000 lines of output, verify smooth scrolling
  - Search for a specific string, verify matches are highlighted
  - Increase font size, verify text is larger and reflows
  - Maximize a pane, verify it fills the window
  - Restore, verify the layout is back
  - Clear terminal, verify scrollback is empty

---

## 6. Phase 4: IPC Batching and Performance Optimization
**Duration:** 1 week
**Objective:** Implement the production-grade IPC batcher and optimize
performance for 16 concurrent panes.

### 6.1 Tasks

**Task 4.1: Production IPC Batcher**
- Enhance the IPC batcher from Phase 1:
  - Support multiple panes (HashMap of pane ID to buffer)
  - Implement backpressure: if buffer exceeds 10 MB, pause PTY reads
  - Implement buffer size monitoring
  - Log warnings when backpressure is triggered
- Optimize serialization:
  - Use a compact serialization format for the batch payload
  - Avoid unnecessary string allocations

**Task 4.2: PTY Reader Optimization**
- Ensure each PTY reader runs on a separate async task
- Use non-blocking I/O for PTY reads
- Handle large output bursts (e.g., "cat /dev/urandom") gracefully:
  - Read in chunks
  - Yield to other tasks between chunks
  - Trigger backpressure if the buffer fills

**Task 4.3: Frontend Rendering Optimization**
- Ensure xterm.js WebGL addon is active for all panes
- Implement WebGL context monitoring:
  - Track the number of active WebGL contexts
  - If approaching the browser limit, fall back to Canvas for new panes
- Optimize React re-renders:
  - Memoize TerminalPane components
  - Ensure layout tree changes only re-render affected panes
  - Use React.memo and useMemo where appropriate

**Task 4.4: Performance Testing and Tuning**
- Run performance tests with 1, 4, 8, 16 panes:
  - Measure frame rate during continuous output
  - Measure memory usage
  - Measure CPU usage
  - Measure keystroke latency
- Identify and fix bottlenecks
- Tune the batching interval (16ms default) if needed
- Tune the scrollback buffer size if memory is an issue

### 6.2 Deliverables
- Production-grade IPC batcher with backpressure
- Optimized rendering for 16 concurrent panes
- Performance test results meeting all NFR targets

### 6.3 Testing
- **Performance Tests:**
  - 16 panes running "yes" command simultaneously: measure FPS
  - 16 panes running "find /" simultaneously: measure memory
  - Keystroke latency with 16 panes active
  - Memory leak test: run for 8 hours, monitor memory growth
- **Stress Tests:**
  - Rapidly create and close panes (100 iterations)
  - Rapidly resize panes (100 iterations)
  - Paste 1 MB of text into a terminal

---

## 7. Phase 5: Command Palette and Settings
**Duration:** 1.5 weeks
**Objective:** Implement the command palette, settings panel, and theme system.

### 7.1 Tasks

**Task 5.1: Command Palette**
- Create the CommandPalette component:
  - Overlay with search input and action list
  - Fuzzy search filtering
  - Keyboard navigation (arrow keys, Enter, Escape)
  - Recently used actions at the top
  - Action categories (Pane, Terminal, Workspace, Application)
- Register all application actions in the command registry:
  - Split horizontal, split vertical, close pane, maximize
  - Copy, paste, search, clear, font size up/down/reset
  - New workspace, switch workspace
  - Open settings, about
  - Quit application
- Open with Cmd/Ctrl+Shift+P

**Task 5.2: Settings Panel**
- Create the SettingsModal component:
  - Sections: Font, Theme, Terminal, Keyboard
  - Font section: font family selector, font size slider
  - Theme section: theme picker with previews
  - Terminal section: scrollback lines, default shell, cursor style
  - Keyboard section: shortcut list with reassignment
- Settings are saved automatically on change
- Settings are persisted to disk via Rust backend
- Settings are loaded on application startup

**Task 5.3: Theme System**
- Define theme data structure:
  - Terminal colors (foreground, background, cursor, selection, 16 ANSI colors)
  - UI colors (app background, pane border, toolbar, status bar)
- Implement 5+ built-in themes:
  - VibeDark (default)
  - VibeLight
  - Midnight Blue
  - Solarized Dark
  - Solarized Light
  - Dracula
  - Nord
- Implement theme switching:
  - Apply theme by setting CSS custom properties
  - Update xterm.js theme for all panes
  - Persist selected theme in settings

**Task 5.4: Status Bar**
- Create the StatusBar component:
  - Shows workspace name
  - Shows pane count (e.g., "4/16 panes")
  - Shows focused pane's shell and working directory
- Position at the bottom of the window
- Style to be unobtrusive

### 7.2 Deliverables
- Working command palette with all actions
- Settings panel with font, theme, terminal, and keyboard sections
- 5+ built-in themes
- Status bar

### 7.3 Testing
- **Integration Tests:**
  - Open command palette, search for "split", execute, verify split occurs
  - Change font size in settings, verify all panes update
  - Switch theme, verify all colors update
  - Change scrollback lines, verify new terminals use the setting
  - Verify settings persist after restart

---

## 8. Phase 6: Workspaces
**Duration:** 1.5 weeks
**Objective:** Implement workspace creation, switching, persistence, and
management.

### 8.1 Tasks

**Task 6.1: Workspace Data Model**
- Define the Workspace type:
  - ID (UUID)
  - Name (string)
  - Layout tree (PaneNode)
  - Created timestamp
  - Last accessed timestamp
- Define the WorkspaceStore using Zustand:
  - workspaces: List of workspace metadata
  - activeWorkspaceId: The current workspace
  - Actions: create, delete, switch, rename

**Task 6.2: Workspace Persistence**
- Implement workspace file I/O in Rust:
  - Save workspace layout to a JSON file
  - Load workspace layout from a JSON file
  - List all workspace files
  - Delete a workspace file
- Workspace files are stored in the user's application data directory
- Files are written atomically (write to temp, then rename)

**Task 6.3: Workspace Creation**
- Implement Cmd/Ctrl+Shift+N to create a new workspace
- Prompt the user for a workspace name
- Create a new workspace with a single terminal pane
- Switch to the new workspace

**Task 6.4: Workspace Switching**
- Implement Cmd/Ctrl+Shift+Left/Right to switch workspaces
- When switching away:
  - Save the current layout to the workspace store
  - Shell processes continue running in the background
- When switching to:
  - Load the layout from the workspace store
  - Restore all terminal panes
  - Reattach to running shell processes
- The workspace switcher shows all workspaces

**Task 6.5: Workspace Management**
- Implement workspace rename
- Implement workspace delete (with confirmation)
- Implement workspace duplicate
- Show workspace list in the status bar or a dropdown

### 8.2 Deliverables
- Working workspace system
- Workspaces persist across application restarts
- Shell processes continue running when switching workspaces

### 8.3 Testing
- **Integration Tests:**
  - Create a workspace, split into 4 panes, switch away, switch back, verify
    layout is restored
  - Create 3 workspaces, cycle through them, verify each restores correctly
  - Restart the application, verify workspaces are loaded
  - Delete a workspace, verify it is removed from disk

---

## 9. Phase 7: Keyboard Customization and Polish
**Duration:** 1 week
**Objective:** Implement keyboard shortcut customization, refine the UI, and
fix bugs.

### 9.1 Tasks

**Task 7.1: Keyboard Shortcut Customization**
- Implement the KeybindingEditor component in settings
- Allow the user to reassign any shortcut
- Detect and warn about conflicts
- Persist custom shortcuts
- Provide a "Reset to Defaults" button

**Task 7.2: UI Polish**
- Refine the visual design:
  - Consistent spacing and padding
  - Smooth animations for split, close, maximize
  - Hover effects on buttons and dividers
  - Focus indicators with appropriate contrast
- Refine the dark theme colors
- Ensure the application looks good on macOS, Windows, and Linux
- Add application icons for all platforms
- Add a splash screen (optional)

**Task 7.3: Bug Fixing**
- Address all open bugs from previous phases
- Test on all target platforms (macOS Intel, macOS Apple Silicon, Windows 10,
  Windows 11, Ubuntu 22.04)
- Fix platform-specific issues

**Task 7.4: Documentation**
- Write the user guide:
  - Installation instructions for each platform
  - Feature overview with screenshots
  - Keyboard shortcut reference
  - Settings reference
  - FAQ
- Write the developer guide:
  - How to build from source
  - Architecture overview
  - How to contribute
- Update the README with final screenshots and feature list

### 9.2 Deliverables
- Customizable keyboard shortcuts
- Polished UI
- All bugs fixed
- Complete documentation

---

## 10. Phase 8: Testing, Packaging, and Release
**Duration:** 1 week
**Objective:** Final testing, packaging, and public release.

### 10.1 Tasks

**Task 8.1: Comprehensive Testing**
- Run all unit tests
- Run all integration tests
- Run all performance tests
- Manual testing on all platforms:
  - macOS Intel
  - macOS Apple Silicon
  - Windows 10
  - Windows 11
  - Ubuntu 22.04
- Test with different shells:
  - macOS: zsh, bash, fish
  - Windows: PowerShell 7, Windows PowerShell, cmd
  - Linux: bash, zsh, fish
- Test with different screen resolutions and scaling factors
- Test with different keyboard layouts
- Test edge cases:
  - Rapidly create and close 100 panes
  - Paste 10 MB of text
  - Run a command that produces 1 GB of output
  - Disconnect external monitor while app is running
  - Put the computer to sleep and wake it

**Task 8.2: Packaging**
- Build production binaries for all platforms:
  - macOS: .dmg for Intel and Apple Silicon
  - Windows: .msi and .exe
  - Linux: .AppImage, .deb, .rpm
- Generate checksums for each binary
- Test the installers:
  - Install on a clean machine
  - Verify the application launches
  - Verify the application uninstalls cleanly

**Task 8.3: Release**
- Create a GitHub Release:
  - Tag the release (v0.1.0)
  - Write release notes with feature list, screenshots, and download links
  - Attach all binaries and checksums
- Announce the release:
  - Post on GitHub Discussions
  - Post on relevant subreddits (r/rust, r/programming, r/terminal)
  - Post on Hacker News (Show HN)
  - Post on Twitter/X
  - Post on Discord communities

**Task 8.4: Post-Release**
- Monitor GitHub Issues for bug reports
- Respond to user feedback
- Prepare hotfix releases if critical bugs are found
- Plan the next release (v0.2.0)

### 10.2 Deliverables
- Fully tested application
- Production binaries for all platforms
- GitHub Release v0.1.0
- Public announcement

---

## 11. Timeline Summary

| Phase | Description | Duration | Cumulative |
|-------|-------------|----------|------------|
| Phase 0 | Environment Setup | 1 week | 1 week |
| Phase 1 | Single Terminal | 1 week | 2 weeks |
| Phase 2 | Multi-Pane Grid | 2 weeks | 4 weeks |
| Phase 3 | Terminal Features | 2 weeks | 6 weeks |
| Phase 4 | IPC & Performance | 1 week | 7 weeks |
| Phase 5 | Command Palette & Settings | 1.5 weeks | 8.5 weeks |
| Phase 6 | Workspaces | 1.5 weeks | 10 weeks |
| Phase 7 | Polish & Docs | 1 week | 11 weeks |
| Phase 8 | Testing & Release | 1 week | 12 weeks |

**Total: 12 weeks (3 months) for a full-time developer**
**Total: 20-24 weeks (5-6 months) for a part-time developer**

---

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| WebGL context limit with 16 panes | Medium | High | Implement context pooling or Canvas fallback |
| PTY issues on Windows | Medium | High | Test on multiple Windows versions; use ConPTY |
| IPC bottleneck with 16 streaming panes | Low | High | IPC batching with backpressure |
| Font rendering inconsistency | Medium | Low | Bundle a monospace font; test on all platforms |
| Scope creep | High | Medium | Strict adherence to PRD; out-of-scope list |
| Burnout (solo developer) | Medium | High | Set realistic milestones; take breaks |
| Tauri v2 breaking changes | Low | Medium | Pin Tauri version; test upgrades carefully |
| Allotment layout bugs | Low | Medium | Test complex layouts; consider custom layout engine |

---

## 13. Definition of Done

A feature is considered "done" when:
- It meets all acceptance criteria in the requirements document
- Unit tests are written and passing
- Integration tests are written and passing
- The code passes linting and formatting checks
- The code is reviewed (if there are multiple contributors)
- Documentation is updated
- The feature works on macOS, Windows, and Linux
- No known bugs are associated with the feature

The application is considered "release-ready" when:
- All P0 requirements are implemented and tested
- All P1 requirements are implemented and tested
- P2 requirements are implemented to the extent time permits
- All performance targets are met
- No critical or high-severity bugs are open
- Documentation is complete
- Binaries are built and tested on all platforms
- The GitHub Release is prepared with notes and downloads

---

## 14. Future Roadmap (Post v0.1.0)

The following features are NOT part of the initial release but may be considered
for future versions based on community feedback:

**v0.2.0 (Terminal Enhancements):**
- Custom theme editor (create and export themes)
- Terminal profiles (different settings per pane)
- Pane naming and color-coding
- Split pane presets (2x2, 3x3, 4x4 layouts)

**v0.3.0 (AI Integration):**
- API key management (Gemini, OpenAI, Anthropic, Ollama)
- Prompt injection into terminal panes
- AI agent templates (pre-configured prompts for common tasks)
- Local model integration via Ollama

**v0.4.0 (Advanced Features):**
- Session recording and replay
- Terminal output export (save to file)
- Plugin system for extending functionality
- Remote terminal support (SSH)

**v1.0.0 (Stable Release):**
- All features stable and well-tested
- Comprehensive documentation
- Active community of contributors
- Regular release cadence established