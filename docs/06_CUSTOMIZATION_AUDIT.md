# VibeGrid — Enterprise Customization Audit

> **Goal:** make VibeGrid *fully customizable* — no hard restrictions, no "I wish it had X" gaps.
> Every item below is mapped to its source file so it can be implemented directly.
> Priority: **P0** = removes a hard restriction / unblocks the most users · **P1** = high-value feature-level customization · **P2** = polish / advanced.

---

## Implementation status (verified against the codebase)

| Status | Items |
|--------|-------|
| ✅ Implemented | L1–L19 · C1–C2, C4–C12, C14–C21, C24–C28 · (pass 1) **L2**, **L12**, **L16**, **L17**, **C4**, **C5**, **C7**, **C8**, **C9**, **C10**, **C24**, **C28** · (pass 2) **L7** (free IPC interval input + quick chips), **C11** (shell args/env through `spawn_pty`/`spawn_pane`), **C12** (per-workspace overrides, `WorkspaceData.overrides`), **C21** (user palette commands) · (pass 3) **C3** (themeMode dark/light/system — `matchMedia` + Tauri `onThemeChanged` listeners, `vibeLight` theme, light chrome via `html.vibegrid-light`), **C13** (per-pane appearance — theme/font/opacity overrides from the context menu, pane → workspace → global precedence), **C20** (copy-selection-as-HTML via xterm buffer cells + inline styles; paste-confirm done earlier), **C22** (user macros — action catalog in `src/lib/macros.ts`, optional keybindings, palette runner, Macros editor tab), **C23** (drag-to-reorder **and** emoji badge/picker + archive/restore with active-workspace auto-switch, persisted on the workspace file), **C26** (master toggle + OS `prefers-reduced-motion` via CSS), **S1** (settings profiles save/load/delete), **S2** (schemaVersion 2 + in-place migration from `vibegrid_settings_v1`, legacy key dropped), **S5** (tauri-plugin-updater already wired), **S6** (env vars covered by C11's shellEnv), **S8** (MCP/HTTP endpoint card in Settings via new `get_http_port` command) |
| ⚠️ Partial | — |
| 🔜 Roadmap | **S3** (per-workspace settings files — superseded by C12 overrides; optional full workspace-scoped settings blob), **S4** (i18n / strings table), **S7** (named terminal profiles — the override model is the foundation) |

Validated: `tsc --noEmit`, `vitest run` (147), `eslint src`, `cargo check`, `cargo test --lib` (32) all green. Also fixed a latent flake in the PTY lifecycle test (a shell that prints and exits in the same instant races the 16 ms batch flush, which wipes history on EOF — the test now keeps the shell alive while polling).

---

## 1. Hard limits & caps (P0 — "no restriction")

| # | Cap | Where | Today | Should be |
|---|-----|-------|-------|-----------|
| L1 | **Max panes** | `src/store/usePaneStore.ts:325` (`maxPanes: 16`) | Hard 16-pane ceiling, enforced in Header/Toolbar/Palette/App toasts ("for peak GPU performance") | Settings slider (e.g. 4–64). WebGL context count (L2) is the real constraint — derive the default from it, but let users override |
| L2 | **WebGL context slots** | `src/store/useUIStore.ts` (`maxWebglSlots: 12`) | When exceeded, panes silently fall back to CPU canvas | Expose as a setting; show per-pane badge; let users pick "prefer GPU, cap N" |
| L3 | **Font size range** | `src/store/useSettingsStore.ts:332,347,356` | Clamped 8–32px | Configurable min/max + step; allow 4–96px with a "force" warning at extremes |
| L4 | **Line height range** | `src/store/useSettingsStore.ts:394` | Clamped 1.0–2.0 | Widen to 0.8–3.0 (some users want tight 0.9) |
| L5 | **Terminal opacity floor** | `src/store/useSettingsStore.ts:399` | Min 0.6 — can't go truly translucent | Allow 0.1–1.0 (blur + low opacity is a popular look) |
| L6 | **Scrollback range** | `src/store/useSettingsStore.ts:371` | 100–100,000 | Allow 1,000–1,000,000; add "unlimited" opt-in with a memory warning |
| L7 | **IPC batch interval** | `src/store/useSettingsStore.ts:384` | 4–2000ms, fixed presets [8,16,33,66] | Free numeric input, presets kept as quick picks |
| L8 | **Voice silence timeout** | `src/store/useSettingsStore.ts:420` | 600–5000ms | Widen to 200–15,000ms |
| L9 | **Minimum pane size** | `src/components/layout/GridRenderer.tsx:17` (`MIN_PANE_SIZE = 120`) | Hard 120px — panes can't collapse further | Setting (e.g. 40–400px); also expose drag snap |
| L10 | **Divider snap epsilon** | `src/components/layout/GridRenderer.tsx:24` (`SNAP_EPSILON = 0.04`) | Fixed snap-to-equal behavior | Setting: snap on/off + threshold; "double-click divider" toggle |
| L11 | **Split ratio bounds** | `src/store/usePaneStore.ts:416` | Clamped 0.1–0.9 | Widen to 0.02–0.98 (respect min-size instead of ratio clamps) |
| L12 | **Preset grids fixed set** | `src/components/common/Header.tsx` (`[1,2,4,6,8,16]`) | Only 1/2/4/6/8/16 | Add 3, 5, 9, 12, 16 as presets + arbitrary "N panes" input |
| L13 | **Name truncation** | `WorkspaceSidebar/Header/Settings/App` (`slice(0, 50)`, `slice(0, 40)`) | 50-char workspace names, 40-char pane titles | Raise or remove; full names in tooltips |
| L14 | **Toast cap & duration** | `src/store/useUIStore.ts:188` (`MAX_TOASTS = 4`), default 3000ms | Fixed | Settings: max stack, default duration |
| L15 | **Command palette recents** | `src/components/ui/CommandPalette.tsx:28` (`MAX_RECENTS = 8`) | Fixed | Setting |
| L16 | **"At least 1 workspace" guard** | `src/store/useWorkspaceStore.ts` (`deleteWorkspace`) | Cannot delete the last workspace | Allow it: deleting the last workspace resets to a fresh default (with confirm) |
| L17 | **Window min size** | `src-tauri/tauri.conf.json` (`minWidth: 800, minHeight: 600`) | Fixed | Settings or relax to 480×320 |
| L18 | **Splash / first-run hint timing** | `SplashScreen.tsx:3` (700ms/350ms), `FirstRunHint.tsx:5` (9000ms) | Fixed | "Skip splash" toggle, hint duration setting |
| L19 | **Confirmation strictness** | `useUIStore` close/quit/layout guards | Always confirms when processes run | "Always ask / ask once / never ask" per action (close, quit, grid-shrink, workspace delete) |

---

## 2. Missing settings users expect (P1 — high value)

| # | Feature | Why it matters | Where |
|---|---------|----------------|-------|
| C1 | **Custom themes + theme editor** | Only 8 baked-in themes (`THEMES` in `useSettingsStore.ts`); no create/edit/duplicate/import | New "Theme" tab: color pickers for the 22 palette slots, duplicate-as-base, import/export single theme JSON |
| C2 | **Independent UI accent color** | `applyThemeVariables` forces UI chrome (accent/surface) from the terminal theme's cursor/black — you can't style the window without restyling the terminal | Separate "UI accent" + "UI background" settings decoupled from terminal palette |
| C3 | **Light / follow-system theme** | App is dark-only (`theme: "Dark"` in tauri.conf, all themes are dark) | Add light theme(s); "follow OS" via `theme` listener |
| C4 | **Arbitrary font input** | Only 5 hardcoded fonts in the dropdown | Free-text font family + per-family quick picks; persist CSS stack |
| C5 | **Cursor tuning** | block/underline/bar + blink exist; no width, opacity, blink rate | xterm exposes `cursorWidth`/`cursorBlink` intervals — surface them |
| C6 | **Terminal padding / cell size** | xterm supports `padding`, `letterSpacing`, `lineHeight`(done) | Add padding slider + optional "disable font smoothing" |
| C7 | **Default working directory** | New panes always open at the session cwd | Per-workspace + global "new pane cwd"; cwd picker button in Settings |
| C8 | **Startup behavior** | Always restores last workspace | Options: "last workspace / default / specific workspace", "start maximized", "show splash", "start hidden to tray" |
| C9 | **Launch at login** | Common desktop-app expectation | `tauri-plugin-autostart`, toggle in Settings |
| C10 | **Tray behavior options** | `minimizeToTray` exists, but close vs minimize behavior and tray tooltip aren't configurable | "Close → quit / close → tray / minimize → tray", start hidden, custom tray label |
| C11 | **Shell args & init commands** | `defaultShell` + per-pane override exist, but no args/env/init | `shell` + `shellArgs` + `env` on global & per-pane/workspace level |
| C12 | **Per-workspace settings** | Theme/font/shell/opacity are global only | Workspace-scoped overrides (theme, font, shell, cwd, opacity) |
| C13 | **Per-pane appearance** | Only title/cwd/shell via context menu | Right-click → set pane font size / opacity / theme override |
| C14 | **UI density / layout** | Sidebar fixed w-64, status bar fixed h-6, header fixed h-9, pane padding p-0.5 | Compact/comfortable density; hide status bar / header toggles; sidebar width slider; move sidebar left/right |
| C15 | **Right-click paste behavior** | Right-click always opens the context menu | Setting: "right-click pastes" (tmux-style) vs menu; also "paste with confirmation when multi-line" |
| C16 | **Clickable links / URL handling** | Not implemented | Toggle + modifier-key requirement (click / Cmd+click), default browser |
| C17 | **Bell & sounds** | No bell handling | Enable/disable terminal bell, custom sound, visual flash fallback |
| C18 | **Scroll behavior** | xterm `scrollOnOutput` not exposed | Toggle "scroll to bottom on output", "limit scroll speed" |
| C19 | **Word-selection separators** | xterm double-click word boundaries are default | Customize word separator chars |
| C20 | **Copy/paste extras** | `copyOnSelect` exists; no copy-as-HTML, no paste confirmation, no clipboard history | Copy mode options; "confirm paste with newlines" |
| C21 | **Command palette user commands** | Fixed command set (`MAX_RECENTS`) | User-defined commands/macros (run shell line, open path, series of actions) |
| C22 | **Custom keybinding "chords" / macros** | Bindings are 1:1 to fixed commands | Sequences + user macros; expose `updateKeybinding` for custom ids |
| C23 | **Workspace polish** | Move is buttons-only, no icons/colors | Drag-to-reorder, per-workspace emoji/color badge, archive/trash instead of hard delete |
| C24 | **Autosave control** | 500ms debounce hardcoded in `App.tsx`; no manual save | Toggle autosave, interval setting, "Save now" button + keybinding |
| C25 | **Status bar customization** | Fixed badges (GPU/font/panes) | Toggle each badge, add custom status text per workspace |
| C26 | **Animations & reduced motion** | No `prefers-reduced-motion` handling | Global animation toggle + respect OS reduced-motion |
| C27 | **Zoom** | Only font size changes | UI zoom (80–150%) — scale header/sidebar/status |
| C28 | **Voice language/model** | Whisper model fixed, silence timeout configurable | Language select, model size select, transcription preview settings |

---

## 3. Structural / advanced (P2)

| # | Item | Notes |
|---|------|-------|
| S1 | **Multi-profile settings** | Import/export exists (`vibegrid_settings_v1`); add named profiles + one-click switch |
| S2 | **Settings schema versioning** | `useSettingsStore` merges blindly; add version + migration like `WorkspaceData.migrate` |
| S3 | **Per-workspace settings files** | Workspace-scoped overrides persist inside workspace JSON (`WorkspaceData`) |
| S4 | **i18n / locale** | No strings table; a `strings.ts` catalog would unlock translations |
| S5 | **Update channel (stable/beta)** | `tauri-plugin-updater` wired to one GitHub release; allow channel selection |
| S6 | **Env-var manager** | A UI-managed env file injected into spawned PTYs (`PtyManager::spawn` env) |
| S7 | **Terminal profiles** (kitty/alacritty-style) | Profile = theme + font + shell + opacity + padding, switchable per pane |
| S8 | **MCP/HTTP server controls** | `http_server.rs` token/port are internal; optional UI toggle + port setting |

---

## 4. Already customizable today (do not duplicate)

- Font family/size/ligatures/line-height, opacity, scrollback, cursor style+blink, IPC batch interval (Settings → Font & Appearance / Terminal)
- 8 terminal themes (Settings → Themes)
- All keybindings incl. system-wide summon + voice toggle (`useKeybindingsStore`)
- Global + per-pane shell override, per-pane title/cwd (context menu)
- Copy-on-select, minimize-to-tray, voice-to-terminal + mic + silence timeout
- Workspaces: create/rename/duplicate/delete/move/switch, presets, resizable splits with min-size + snap + double-click equalize
- Settings export/import/reset

---

## Suggested implementation order

1. **P0 caps → settings** (L1, L3–L6, L9–L10, L16, L19): these are pure plumbing into `AppSettings` + a new "Advanced"/"Limits" settings tab. Lowest risk, highest "no restriction" impact.
2. **Custom themes (C1) + UI accent decoupling (C2)**: biggest visible win; the theme store already centralizes palettes.
3. **Per-workspace overrides (C12) + startup/tray (C8–C10)**: make workspaces feel like first-class profiles.
4. **Behavioral toggles (C15–C20, C24–C26)**: small, self-contained settings each.
5. **Structural (S1–S8)**: roadmap items, not one-shot changes.
