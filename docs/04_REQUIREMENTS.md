# VibeGrid — Functional & Non-Functional Requirements
## Complete Requirements Specification

---

## 1. Introduction

This document defines all functional and non-functional requirements for VibeGrid.
Functional requirements describe what the system must do. Non-functional
requirements describe how well the system must do it.

Requirements are identified by unique IDs:
- FR-XXX: Functional Requirements
- NFR-XXX: Non-Functional Requirements

Priority levels:
- P0 (Must Have): The application cannot be released without this requirement
- P1 (Should Have): Important but the application can be released without it
- P2 (Could Have): Nice to have, will be included if time permits
- P3 (Won't Have): Explicitly excluded from the current release

---

## 2. Functional Requirements — Terminal Pane Management

### FR-001: Application Launch with Single Pane
**Priority:** P0
**Description:** When the user launches VibeGrid, the application shall open a
single window containing exactly one terminal pane. The terminal pane shall
occupy the entire window area. The terminal shall be focused and ready for input.
**Acceptance Criteria:**
- The application window opens within 1 second on modern hardware
- Exactly one terminal pane is visible
- The terminal pane fills the entire window
- The terminal is focused (cursor is visible and blinking)
- The shell prompt is displayed within 500ms of the window appearing
- The default shell is the user's system default (zsh on macOS, bash on Linux,
  PowerShell on Windows)

### FR-002: Horizontal Split
**Priority:** P0
**Description:** The user shall be able to split the focused terminal pane
horizontally, creating two panes side by side. The split shall be triggered by
the keyboard shortcut Cmd+D (macOS) or Ctrl+D (Windows/Linux).
**Acceptance Criteria:**
- Pressing the shortcut splits the focused pane into two panes arranged
  horizontally (left and right)
- The new pane occupies the right side
- The new pane spawns a new shell process
- The new pane has the same working directory as the original pane
- Focus moves to the new pane
- The split ratio is 50/50 by default
- The operation completes within 100ms
- The shortcut has no effect if the pane count is already at the maximum (16)

### FR-003: Vertical Split
**Priority:** P0
**Description:** The user shall be able to split the focused terminal pane
vertically, creating two panes stacked on top of each other. The split shall be
triggered by the keyboard shortcut Cmd+Shift+D (macOS) or Ctrl+Shift+D
(Windows/Linux).
**Acceptance Criteria:**
- Pressing the shortcut splits the focused pane into two panes arranged
  vertically (top and bottom)
- The new pane occupies the bottom
- The new pane spawns a new shell process
- The new pane has the same working directory as the original pane
- Focus moves to the new pane
- The split ratio is 50/50 by default
- The operation completes within 100ms
- The shortcut has no effect if the pane count is already at the maximum (16)

### FR-004: Close Pane
**Priority:** P0
**Description:** The user shall be able to close the focused terminal pane. The
close shall be triggered by the keyboard shortcut Cmd+W (macOS) or Ctrl+W
(Windows/Linux), or by clicking the close button in the pane toolbar.
**Acceptance Criteria:**
- The focused pane is closed
- The shell process in the pane is terminated gracefully (SIGTERM on Unix,
  TerminateProcess on Windows)
- If the shell process does not terminate within 5 seconds, it is force-killed
  (SIGKILL on Unix)
- The sibling pane expands to fill the space previously occupied by the closed
  pane and its divider
- Focus moves to the nearest remaining pane
- If the closed pane was the only pane, a new terminal pane is created
  automatically
- The operation completes within 50ms

### FR-005: Maximum Pane Limit
**Priority:** P0
**Description:** The application shall enforce a maximum of 16 terminal panes.
The user shall not be able to create more than 16 panes.
**Acceptance Criteria:**
- When the pane count is 16, split commands (Cmd/Ctrl+D, Cmd/Ctrl+Shift+D)
  are ignored
- A notification is displayed: "Maximum pane limit reached (16)"
- The notification auto-dismisses after 3 seconds
- The notification does not block interaction with the application

### FR-006: Dynamic Pane Count
**Priority:** P0
**Description:** The user shall be able to have any number of terminal panes
from 1 to 16. The application shall not require a specific number of panes.
**Acceptance Criteria:**
- The application supports 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  and 16 panes
- The layout adapts correctly to any number of panes
- There is no minimum pane count beyond 1
- The user can close panes down to a single pane
- The user can build up to 16 panes through successive splits

### FR-007: Resize Panes
**Priority:** P0
**Description:** The user shall be able to resize panes by dragging the dividers
between them. Resizing shall work for both horizontal and vertical splits.
**Acceptance Criteria:**
- The user can drag any divider between two panes
- Dragging a horizontal divider (between side-by-side panes) changes the width
  ratio
- Dragging a vertical divider (between stacked panes) changes the height ratio
- The minimum pane size is 10% of the available space in the split direction
- The maximum pane size is 90% of the available space in the split direction
- Resizing is smooth with no visual jitter
- The terminal content reflows to fit the new pane size
- The shell process is notified of the new terminal dimensions
- The resize operation does not cause the terminal to lose focus

### FR-008: Focus Pane
**Priority:** P0
**Description:** The user shall be able to focus a terminal pane by clicking on
it with the mouse. The focused pane shall be visually indicated.
**Acceptance Criteria:**
- Clicking on a pane focuses it
- The focused pane shows a visual indicator (e.g., a 2px border in the accent
  color)
- Unfocused panes do not show the indicator
- Only one pane can be focused at a time
- Keyboard input goes to the focused pane only

### FR-009: Keyboard Navigation Between Panes
**Priority:** P0
**Description:** The user shall be able to move focus between panes using
keyboard shortcuts, without using the mouse.
**Acceptance Criteria:**
- Cmd/Ctrl+Arrow Left moves focus to the pane to the left of the current pane
- Cmd/Ctrl+Arrow Right moves focus to the pane to the right of the current pane
- Cmd/Ctrl+Arrow Up moves focus to the pane above the current pane
- Cmd/Ctrl+Arrow Down moves focus to the pane below the current pane
- Cmd/Ctrl+Tab moves focus to the next pane in creation order
- Cmd/Ctrl+Shift+Tab moves focus to the previous pane in creation order
- If there is no pane in the specified direction, focus does not change
- The focus indicator updates immediately

### FR-010: Maximize and Restore Pane
**Priority:** P1
**Description:** The user shall be able to maximize a single pane to fill the
entire window, and restore the previous layout.
**Acceptance Criteria:**
- Double-clicking a pane maximizes it
- Pressing Cmd/Ctrl+Shift+Enter toggles maximize/restore
- When maximized, the pane fills the entire window
- All other panes are hidden
- The maximized pane shows a "Restore" button in the toolbar
- When restored, the previous layout is exactly restored
- All shell processes continue running during maximize/restore
- The operation completes within 50ms

### FR-011: Pane Toolbar
**Priority:** P1
**Description:** Each terminal pane shall have a toolbar that provides quick
access to common actions. The toolbar shall be visible when the pane is hovered
or focused.
**Acceptance Criteria:**
- The toolbar appears at the top of the pane
- The toolbar shows the pane title (auto-generated or user-defined)
- The toolbar shows buttons for: split horizontal, split vertical, close, maximize
- The toolbar is semi-transparent and does not obscure terminal content
- The toolbar appears within 200ms of hovering over the pane
- The toolbar disappears within 500ms of the mouse leaving the pane

### FR-012: Pane Title
**Priority:** P2
**Description:** Each terminal pane shall have a title that identifies it. The
title shall be auto-generated based on the shell process and working directory.
**Acceptance Criteria:**
- The default title is the shell name (e.g., "zsh", "bash", "PowerShell")
- If the shell changes directory, the title updates to show the current directory
- The user can set a custom title via the command palette
- Custom titles persist for the lifetime of the pane
- The title is displayed in the pane toolbar

---

## 3. Functional Requirements — Terminal Operations

### FR-013: Keyboard Input
**Priority:** P0
**Description:** The user shall be able to type commands into the focused
terminal pane. All standard keyboard input shall be supported.
**Acceptance Criteria:**
- All printable characters (letters, numbers, symbols, spaces) are displayed
  in the terminal
- Enter submits the current line
- Backspace deletes the character before the cursor
- Delete deletes the character at the cursor
- Tab triggers shell auto-completion
- Arrow keys navigate the command history and move the cursor
- Home and End move the cursor to the beginning and end of the line
- Ctrl+C sends SIGINT to the foreground process
- Ctrl+D sends EOF (or closes the shell if the line is empty)
- Ctrl+Z sends SIGTSTP to the foreground process
- Ctrl+L clears the screen
- All other standard terminal key combinations work correctly
- Keystroke-to-display latency is under 10ms

### FR-014: Terminal Output Display
**Priority:** P0
**Description:** The terminal shall display output from the shell process,
including text, colors, and formatting.
**Acceptance Criteria:**
- Regular text is displayed in the default foreground color
- ANSI 16-color codes are rendered correctly
- ANSI 256-color codes are rendered correctly
- True color (24-bit RGB) codes are rendered correctly
- Bold, italic, underline, and strikethrough attributes are rendered correctly
- Cursor movement sequences are handled correctly
- Screen clearing sequences are handled correctly
- Scrolling region sequences are handled correctly
- Unicode characters (including CJK, emoji) are rendered correctly
- Wide characters (CJK, emoji) occupy two cell widths

### FR-015: Scrollback Buffer
**Priority:** P0
**Description:** Each terminal pane shall maintain a scrollback buffer that
stores lines that have scrolled off the top of the visible area.
**Acceptance Criteria:**
- The default scrollback buffer size is 5000 lines
- The scrollback buffer size is configurable from 100 to 100000 lines
- The user can scroll through the scrollback buffer using the mouse wheel
- The user can scroll using Shift+Page Up and Shift+Page Down
- Scrolling is smooth and responsive
- The scrollback buffer is cleared when the user clears the terminal (Cmd/Ctrl+K)
- The scrollback buffer is cleared when the shell process exits and a new one starts

### FR-016: Copy Text
**Priority:** P0
**Description:** The user shall be able to select text in the terminal and copy
it to the system clipboard.
**Acceptance Criteria:**
- The user can select text by clicking and dragging with the mouse
- The user can select text by double-clicking (selects a word)
- The user can select text by triple-clicking (selects a line)
- Selected text is highlighted with a semi-transparent background
- Cmd/Ctrl+C copies the selected text to the system clipboard
- The copied text preserves line breaks
- If no text is selected, Cmd/Ctrl+C sends SIGINT to the shell (standard
  terminal behavior)

### FR-017: Paste Text
**Priority:** P0
**Description:** The user shall be able to paste text from the system clipboard
into the terminal.
**Acceptance Criteria:**
- Cmd/Ctrl+V pastes the clipboard contents into the terminal
- Multi-line text is pasted correctly
- Special characters are pasted correctly
- The pasted text is sent to the shell as input
- If the clipboard is empty, nothing happens

### FR-018: Search in Terminal
**Priority:** P1
**Description:** The user shall be able to search for text within the terminal's
visible area and scrollback buffer.
**Acceptance Criteria:**
- Cmd/Ctrl+F opens a search bar at the top of the focused pane
- The search bar contains a text input field, next/previous buttons, and a close
  button
- Matches are highlighted in the terminal
- The current match is highlighted with a different color than other matches
- Enter finds the next match
- Shift+Enter finds the previous match
- Escape closes the search bar
- The search is case-insensitive by default
- The search wraps around (after the last match, it continues from the first)

### FR-019: Clear Terminal
**Priority:** P1
**Description:** The user shall be able to clear the terminal's visible area and
scrollback buffer.
**Acceptance Criteria:**
- Cmd/Ctrl+K clears the visible area and the scrollback buffer
- The shell process is not affected (it continues running)
- The cursor moves to the top-left of the terminal
- The operation is immediate

### FR-020: Font Size Adjustment
**Priority:** P1
**Description:** The user shall be able to increase or decrease the terminal
font size.
**Acceptance Criteria:**
- Cmd/Ctrl+Plus (or Cmd/Ctrl+=) increases the font size by 1 pixel
- Cmd/Ctrl+Minus decreases the font size by 1 pixel
- Cmd/Ctrl+0 resets the font size to the default (14 pixels)
- The font size range is 8 pixels to 32 pixels
- The font size change applies to all terminal panes simultaneously
- The terminal content reflows to fit the new font size
- The shell process is notified of the new terminal dimensions
- The font size setting persists across application restarts

### FR-021: Clickable URLs
**Priority:** P2
**Description:** URLs in terminal output shall be clickable. Clicking a URL
shall open it in the default web browser.
**Acceptance Criteria:**
- URLs in terminal output are detected automatically
- When the user hovers over a URL, it is underlined
- When the user clicks a URL, it opens in the default web browser
- The URL detection supports http, https, ftp, and file protocols
- The URL detection does not interfere with normal terminal interaction

---

## 4. Functional Requirements — Workspace Management

### FR-022: Create Workspace
**Priority:** P2
**Description:** The user shall be able to create a new workspace with a custom
name.
**Acceptance Criteria:**
- Cmd/Ctrl+Shift+N creates a new workspace
- The user is prompted to enter a workspace name
- The new workspace starts with a single terminal pane
- The workspace appears in the workspace switcher
- The new workspace becomes the active workspace

### FR-023: Switch Workspace
**Priority:** P2
**Description:** The user shall be able to switch between workspaces.
**Acceptance Criteria:**
- Cmd/Ctrl+Shift+Left switches to the previous workspace
- Cmd/Ctrl+Shift+Right switches to the next workspace
- The workspace switcher shows all workspaces with their names
- Switching workspaces restores the layout and terminal sessions
- Shell processes continue running in the background when their workspace is
  not active
- Switching takes less than 200ms
- The workspace switcher wraps around (after the last workspace, it goes to the
  first)

### FR-024: Workspace Persistence
**Priority:** P2
**Description:** Workspace configurations shall be saved automatically and
restored on application restart.
**Acceptance Criteria:**
- Workspace layouts are saved when the application exits normally
- Workspace layouts are saved when the user switches workspaces
- Workspace layouts are loaded when the application starts
- The user returns to the last active workspace on startup
- Terminal content (scrollback) is NOT persisted
- Workspace files are stored in the user's application data directory
- Workspace files are in JSON format for readability and debuggability

### FR-025: Delete Workspace
**Priority:** P2
**Description:** The user shall be able to delete a workspace.
**Acceptance Criteria:**
- The user can delete a workspace from the workspace switcher
- A confirmation dialog is shown before deletion
- Deleting a workspace terminates all shell processes in that workspace
- The workspace file is deleted from disk
- If the deleted workspace was the active one, the next workspace becomes active
- If there are no remaining workspaces, a new default workspace is created

### FR-026: Rename Workspace
**Priority:** P2
**Description:** The user shall be able to rename a workspace.
**Acceptance Criteria:**
- The user can rename a workspace from the workspace switcher
- The new name is validated (non-empty, max 50 characters)
- The renamed workspace is updated in the workspace switcher
- The workspace file is renamed on disk

---

## 5. Functional Requirements — Application Management

### FR-027: Command Palette
**Priority:** P1
**Description:** The user shall be able to open a command palette to search and
execute application actions.
**Acceptance Criteria:**
- Cmd/Ctrl+Shift+P opens the command palette
- The palette appears as a centered overlay with a search input at the top
- All available actions are listed below the search input
- Each action shows its name and keyboard shortcut (if any)
- Typing in the search input filters the action list in real-time
- Arrow keys navigate the filtered list
- Enter executes the selected action
- Escape closes the palette
- Recently used actions appear at the top of the list
- The palette closes automatically after an action is executed

### FR-028: Settings Panel
**Priority:** P1
**Description:** The user shall be able to open a settings panel to configure
the application.
**Acceptance Criteria:**
- Cmd/Ctrl+Comma opens the settings panel
- The settings panel is a modal overlay
- Settings are organized into sections: Font, Theme, Terminal, Keyboard,
  Workspaces
- Settings are saved automatically when changed
- Settings persist across application restarts
- The settings panel can be closed with Escape or the close button

### FR-029: Theme Selection
**Priority:** P1
**Description:** The user shall be able to choose from multiple built-in color
themes.
**Acceptance Criteria:**
- At least 5 built-in themes are available
- Themes affect: terminal colors, pane borders, toolbar, status bar, command
  palette, settings panel
- Theme switching is instant (no restart required)
- The selected theme persists across application restarts
- Theme names are descriptive (e.g., "VibeDark", "Midnight Blue", "Solarized
  Dark")

### FR-030: Keyboard Shortcut Customization
**Priority:** P2
**Description:** The user shall be able to customize keyboard shortcuts.
**Acceptance Criteria:**
- All keyboard shortcuts are listed in the settings panel
- The user can click a shortcut and press a new key combination to reassign it
- Conflicting shortcuts are detected and a warning is shown
- Custom shortcuts persist across application restarts
- A "Reset to Defaults" button restores all default shortcuts
- The command palette reflects the updated shortcuts

### FR-031: Status Bar
**Priority:** P1
**Description:** The application shall display a status bar at the bottom of the
window showing relevant information.
**Acceptance Criteria:**
- The status bar shows the current workspace name
- The status bar shows the number of active panes (e.g., "4/16 panes")
- The status bar shows the focused pane's shell process name
- The status bar shows the focused pane's working directory
- The status bar is 24 pixels tall
- The status bar does not obscure terminal content

### FR-032: About Dialog
**Priority:** P2
**Description:** The application shall have an About dialog showing version
information.
**Acceptance Criteria:**
- The About dialog shows the application name, version, and logo
- The About dialog shows the license (MIT)
- The About dialog shows a link to the GitHub repository
- The About dialog shows a link to the documentation
- The About dialog can be opened from the application menu or command palette

---

## 6. Non-Functional Requirements — Performance

### NFR-001: Startup Time
**Priority:** P0
**Description:** The application shall start and display an interactive terminal
within 1 second on modern hardware.
**Measurement:** Time from clicking the application icon to the shell prompt
being visible and the terminal accepting input.
**Target:** Under 1 second on a 2020+ MacBook Pro or equivalent Windows PC.
**Maximum:** 2 seconds on older hardware.

### NFR-002: Keystroke Latency
**Priority:** P0
**Description:** The time from a keypress to the character appearing in the
terminal shall be imperceptible.
**Measurement:** Time from keydown event to character rendered on screen.
**Target:** Under 10 milliseconds.
**Maximum:** 20 milliseconds.

### NFR-003: Output Rendering Latency
**Priority:** P0
**Description:** The time from shell output being produced to it being rendered
on screen shall be within one frame.
**Measurement:** Time from PTY read to WebGL render.
**Target:** Under 16 milliseconds (one frame at 60 FPS).
**Maximum:** 33 milliseconds (two frames at 60 FPS).

### NFR-004: Frame Rate
**Priority:** P0
**Description:** The application shall maintain a high frame rate even with
multiple panes streaming output simultaneously.
**Measurement:** Frames per second during continuous output in all panes.
**Targets:**
- 1 pane streaming: 60 FPS
- 4 panes streaming: 60 FPS
- 8 panes streaming: 55 FPS
- 16 panes streaming: 45 FPS
**Minimum:** 30 FPS in all scenarios.

### NFR-005: Memory Usage
**Priority:** P0
**Description:** The application shall use a reasonable amount of memory.
**Measurement:** Total process memory (RSS) as reported by the operating system.
**Targets:**
- 1 pane idle: under 100 MB
- 4 panes idle: under 150 MB
- 8 panes idle: under 200 MB
- 16 panes idle: under 300 MB
- 16 panes streaming: under 400 MB
**Maximum:** 500 MB in any scenario.

### NFR-006: CPU Usage
**Priority:** P0
**Description:** The application shall use minimal CPU when idle.
**Measurement:** CPU utilization as reported by the operating system.
**Targets:**
- All panes idle: under 1% CPU
- 4 panes streaming: under 20% CPU
- 16 panes streaming: under 60% CPU

### NFR-007: Binary Size
**Priority:** P1
**Description:** The application binary shall be small.
**Measurement:** Size of the distributable binary/installer.
**Targets:**
- macOS .dmg: under 15 MB
- Windows .exe: under 20 MB
- Linux .AppImage: under 20 MB

### NFR-008: Split Operation Latency
**Priority:** P0
**Description:** The time from pressing the split shortcut to the new pane being
visible and interactive shall be minimal.
**Measurement:** Time from keydown to new terminal accepting input.
**Target:** Under 100 milliseconds.
**Maximum:** 200 milliseconds.

### NFR-009: Resize Operation Latency
**Priority:** P0
**Description:** Resizing panes by dragging dividers shall be smooth.
**Measurement:** Frame rate during divider drag.
**Target:** 60 FPS during drag.
**Minimum:** 30 FPS during drag.

### NFR-010: Workspace Switch Latency
**Priority:** P1
**Description:** Switching between workspaces shall be fast.
**Measurement:** Time from shortcut to workspace fully rendered.
**Target:** Under 200 milliseconds.
**Maximum:** 500 milliseconds.

---

## 7. Non-Functional Requirements — Reliability

### NFR-011: Crash Recovery
**Priority:** P0
**Description:** The application shall not crash under normal usage. If a crash
occurs, the application shall recover gracefully.
**Acceptance Criteria:**
- The application shall not crash when panes are created, closed, resized, or
  maximized
- The application shall not crash when the shell process exits unexpectedly
- The application shall not crash when the shell produces malformed ANSI sequences
- The application shall not crash when the system runs low on memory
- If a crash occurs, the application shall save workspace configurations before
  exiting
- On next launch, the application shall restore the last saved workspace

### NFR-012: Shell Process Cleanup
**Priority:** P0
**Description:** All shell processes shall be terminated when the application
exits.
**Acceptance Criteria:**
- When the user quits the application, all shell processes receive SIGTERM
  (Unix) or TerminateProcess (Windows)
- If a shell process does not terminate within 5 seconds, it receives SIGKILL
  (Unix) or is force-terminated (Windows)
- No orphan shell processes remain after the application exits
- If the application crashes, shell processes are cleaned up on next launch

### NFR-013: PTY Resource Cleanup
**Priority:** P0
**Description:** All PTY resources shall be released when panes are closed or
the application exits.
**Acceptance Criteria:**
- When a pane is closed, its PTY master and slave file descriptors are closed
- When the application exits, all PTY file descriptors are closed
- No file descriptor leaks occur over extended usage (8+ hours)
- No memory leaks occur over extended usage (8+ hours)

### NFR-014: Data Integrity
**Priority:** P1
**Description:** Workspace configurations and settings shall not be corrupted.
**Acceptance Criteria:**
- Workspace files are written atomically (write to temp file, then rename)
- Settings files are written atomically
- If a write fails (e.g., disk full), the previous version is preserved
- Corrupted files are detected and the user is notified
- Default values are used if a file cannot be read

---

## 8. Non-Functional Requirements — Usability

### NFR-015: Learnability
**Priority:** P1
**Description:** A new user shall be able to perform basic operations (split,
close, navigate) within 5 minutes of first use, without reading documentation.
**Acceptance Criteria:**
- Keyboard shortcuts follow platform conventions (Cmd on Mac, Ctrl on Windows)
- A tooltip on first launch shows the most important shortcuts
- The command palette provides discoverability for all actions
- Pane toolbars provide visual affordances for common actions

### NFR-016: Accessibility
**Priority:** P1
**Description:** The application shall be usable by people with disabilities.
**Acceptance Criteria:**
- All actions are accessible via keyboard (no mouse required)
- The focused pane is visually indicated with sufficient contrast
- Color themes meet WCAG 2.1 AA contrast requirements (4.5:1 for text)
- The application respects the system font size setting
- Screen reader compatibility is not required for terminal content (terminals
  are inherently visual) but UI controls should be accessible

### NFR-017: Consistency
**Priority:** P1
**Description:** The application shall follow platform conventions and maintain
internal consistency.
**Acceptance Criteria:**
- macOS: Cmd for shortcuts, traffic light window controls, native menu bar
- Windows: Ctrl for shortcuts, standard window controls, no native menu bar
  (hamburger menu or settings panel)
- Linux: Ctrl for shortcuts, standard window controls
- Keyboard shortcuts are consistent across all panes and workspaces
- UI elements (buttons, inputs, panels) have consistent styling

### NFR-018: Error Messages
**Priority:** P1
**Description:** Error messages shall be clear, actionable, and non-technical.
**Acceptance Criteria:**
- Error messages are displayed in a notification or dialog
- Error messages describe what went wrong in plain language
- Error messages suggest what the user can do to resolve the issue
- Error messages do not expose internal technical details (stack traces, etc.)
- Error messages auto-dismiss after 5 seconds (unless they require user action)

---

## 9. Non-Functional Requirements — Compatibility

### NFR-019: Operating System Support
**Priority:** P0
**Description:** The application shall run on the following operating systems:
- macOS 10.15 (Catalina) or newer, on both Intel and Apple Silicon
- Windows 10 version 1809 or newer, 64-bit
- Linux (Ubuntu 20.04+, Fedora 36+, Arch Linux), 64-bit

### NFR-020: Screen Resolution Support
**Priority:** P1
**Description:** The application shall work correctly on various screen
resolutions and scaling factors.
**Acceptance Criteria:**
- The application works on screens from 1280x720 to 5120x2880
- The application works with display scaling from 100% to 300%
- Terminal text is crisp on high-DPI (Retina) displays
- The layout adapts to window resizing
- The minimum window size is 800x600 pixels

### NFR-021: Shell Compatibility
**Priority:** P0
**Description:** The application shall work with common shell programs.
**Acceptance Criteria:**
- macOS: zsh, bash, fish, sh
- Linux: bash, zsh, fish, sh
- Windows: PowerShell 7, Windows PowerShell, cmd.exe
- Custom shells specified by the user in settings
- Shells that produce ANSI escape codes (colors, cursor movement)
- Shells that produce Unicode output (CJK, emoji)

### NFR-022: Keyboard Layout Support
**Priority:** P1
**Description:** The application shall work with various keyboard layouts.
**Acceptance Criteria:**
- QWERTY, AZERTY, QWERTZ, and Dvorak layouts are supported
- Non-Latin scripts (Japanese, Korean, Chinese, Arabic, Hebrew) are supported
  for terminal input and output
- Keyboard shortcuts use physical key positions, not character positions
  (e.g., Cmd+D works on all layouts)

---

## 10. Non-Functional Requirements — Security

### NFR-023: Process Isolation
**Priority:** P0
**Description:** Terminal pane processes shall be isolated from each other and
from the application.
**Acceptance Criteria:**
- Each pane runs as a separate OS process
- A crash in one shell process does not affect other panes
- A crash in one shell process does not crash the application
- The frontend (WebView) has no direct access to shell processes
- All process communication goes through the Rust backend

### NFR-024: No Network Access (Core)
**Priority:** P0
**Description:** The core terminal grid functionality shall not require network
access.
**Acceptance Criteria:**
- The application works fully offline
- No data is sent to external servers
- No telemetry or analytics are collected
- No update checks are performed automatically (updates are manual)

**Amendment (v0.1.0, audit):** Three explicitly user-initiated exceptions are
allowed — (1) the on-demand Voice-to-Terminal Whisper model download
(~142 MB, triggered only when the user first dictates, downloaded from
HuggingFace into the app data dir; core terminal use never downloads it),
(2) manual update checks from the About modal (never automatic), and (3) the
loopback-only MCP HTTP endpoint (binds to 127.0.0.1). None of these run during
normal terminal use and none are telemetry; the only data ever transmitted is
the app version embedded in the manual update-check URL and the Whisper model
file itself (a GET from HuggingFace). No user terminal content ever leaves the
machine.

### NFR-025: Secure Settings Storage
**Priority:** P1
**Description:** User settings shall be stored securely.
**Acceptance Criteria:**
- Settings files are stored in the user's application data directory
- Settings files have appropriate file permissions (readable only by the user)
- If API keys are stored in the future, they shall be stored in the OS keychain
  (macOS Keychain, Windows Credential Manager, Linux Secret Service)

### NFR-026: Content Security Policy
**Priority:** P0
**Description:** The WebView shall enforce a strict Content Security Policy.
**Acceptance Criteria:**
- Scripts can only be loaded from the application bundle (no external scripts)
- Styles can only be loaded from the application bundle (no external styles)
- No inline scripts are allowed (except those generated by the build tool)
- No connections to external origins are allowed from the WebView

---

## 11. Non-Functional Requirements — Maintainability

### NFR-027: Code Quality
**Priority:** P1
**Description:** The codebase shall maintain high quality standards.
**Acceptance Criteria:**
- Rust code passes clippy with no warnings
- TypeScript code passes ESLint with no errors
- All public functions have documentation comments
- Code formatting is enforced by rustfmt (Rust) and Prettier (TypeScript)
- Commit messages follow the Conventional Commits specification

### NFR-028: Test Coverage
**Priority:** P1
**Description:** The codebase shall have adequate test coverage.
**Acceptance Criteria:**
- Rust backend: at least 80% line coverage for PTY manager and IPC batcher
- React frontend: at least 70% line coverage for state stores and hooks
- Integration tests for all user stories marked P0
- Performance tests for all NFR targets
- Tests run automatically in CI/CD on every pull request

### NFR-029: Documentation
**Priority:** P1
**Description:** The project shall have comprehensive documentation.
**Acceptance Criteria:**
- README with installation instructions, screenshots, and feature list
- CONTRIBUTING guide for new contributors
- ARCHITECTURE document explaining the codebase structure
- API documentation for Rust backend modules (generated by rustdoc)
- User guide explaining all features and keyboard shortcuts
- CHANGELOG documenting all changes in each release

### NFR-030: Build Reproducibility
**Priority:** P1
**Description:** The application shall be buildable from source by any developer.
**Acceptance Criteria:**
- A developer can clone the repository, install dependencies, and build the
  application with no more than 3 commands
- The build process is documented in the README
- The build works on macOS, Windows, and Linux
- The build produces identical binaries given the same source code and toolchain
  version

---

## 12. Requirements Traceability Matrix

| Requirement | Related User Stories | Phase | Test Type |
|-------------|---------------------|-------|-----------|
| FR-001 | US-001 | Phase 1 | Integration |
| FR-002 | US-002 | Phase 2 | Integration |
| FR-003 | US-003 | Phase 2 | Integration |
| FR-004 | US-004 | Phase 2 | Integration |
| FR-005 | US-005 | Phase 2 | Unit |
| FR-006 | US-006 | Phase 2 | Integration |
| FR-007 | US-007 | Phase 2 | Integration |
| FR-008 | US-009 | Phase 2 | Integration |
| FR-009 | US-009 | Phase 2 | Integration |
| FR-010 | US-008 | Phase 3 | Integration |
| FR-013 | US-010 | Phase 3 | Integration |
| FR-014 | US-010 | Phase 3 | Integration |
| FR-015 | US-012 | Phase 3 | Integration |
| FR-016 | US-011 | Phase 3 | Integration |
| FR-017 | US-011 | Phase 3 | Integration |
| FR-018 | US-013 | Phase 4 | Integration |
| FR-019 | US-014 | Phase 3 | Unit |
| FR-020 | US-015 | Phase 3 | Integration |
| FR-027 | US-019 | Phase 4 | Integration |
| FR-028 | US-020 | Phase 4 | Integration |
| FR-029 | US-021 | Phase 4 | Integration |
| FR-030 | US-022 | Phase 6 | Integration |
| NFR-001 | US-001 | Phase 1 | Performance |
| NFR-002 | US-010 | Phase 3 | Performance |
| NFR-004 | All | Phase 2 | Performance |
| NFR-005 | All | Phase 2 | Performance |