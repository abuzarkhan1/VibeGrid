# Codex Desktop — Design System Audit & Specification

**Status: Research-based reconstruction, not pixel-level inspection.**

Before anything else, an honest methodology note that governs every value in this document:

This audit was produced from OpenAI's official documentation and changelog, the Codex GitHub repository and issue tracker, third-party theming tools built against the real app (which expose its actual settings schema), and multiple hands-on reviews of the shipped product. It was **not** produced by inspecting the running application's DOM/CSS or by analyzing screenshots pixel-by-pixel — no screenshots or app binary were available in this session. That means:

- **Structural facts** (panel names, settings architecture, feature set, workflow) are sourced and cited, and are reliable.
- **Visual specifics** (exact hex values, px measurements, radii, shadow blur, spacing scale) are **not directly observed**. They are marked **`[Estimated]`** throughout and are informed inferences based on (a) what Codex's own theming system reveals about its token architecture, and (b) conventions common to this class of application (native Electron-based AI/dev tools, e.g. VS Code, Cursor, Warp, Claude Code).

**If you need implementation-accurate values**, the fastest path is to open Codex Desktop yourself, use Settings → Appearance → Export to pull the live `codex-theme-v1` string (this exports exact surface/accent/ink colors, fonts, contrast level, and window opacity as JSON), and hand me that string plus a few screenshots — I will produce a fully accurate revision of this document from real data.

Everything below is written as a genuine, usable specification, but treat every numeric value without a citation as a professional estimate, not a measurement.

---

## 0. What Codex Desktop Is

Codex Desktop is OpenAI's native agentic coding application for macOS and Windows, launched February 2026. It is not a chat window bolted onto an IDE — it's positioned as <cite index="4-1">a command center for AI coding and software development with multiple agents, parallel workflows, and long-running tasks</cite>, where <cite index="4-1">agents run in separate threads organized by projects, so you can seamlessly switch between tasks without losing context</cite>.

By April 2026 the app's scope expanded well beyond coding: <cite index="3-1">Codex gained the ability to access other apps on the user's computer, surface relevant information from within them, and take actions as directed — including, on Mac, working in the background while the user continues manually using their computer.</cite>

This context matters for the design audit: Codex Desktop is architecturally closer to **VS Code + a persistent agent supervisor** than to a chatbot. Its visual language has to support long, resumable, parallel work sessions — not a single linear conversation.

---

## 1. Audit Methodology

Given the constraint above, this audit proceeds in two layers:

1. **Confirmed structure** — drawn from the official OpenAI product page, the `openai/codex` GitHub repo and its issue tracker (which reveals real bug reports referencing actual UI regions — sidebar, top menu, content area, settings), and the app's own theme-export schema (`codex-theme-v1`), which is the single most reliable source in this audit because it's the literal token list the app ships with.
2. **Estimated visual system** — reconstructed density, color relationships, spacing, and typography, following the conventions of comparable native AI-coding tools, flagged `[Estimated]`.

Where the two layers conflict or a claim can't be grounded in either, it is omitted rather than invented, per the accuracy rules for this audit.

---

## 2. Confirmed Application Structure

From direct product documentation and firsthand accounts, Codex Desktop's shell decomposes into:

```
Codex Desktop — Application Shell
├── Left Sidebar
│   ├── Thread / conversation list ("All your conversations are filed on the left" — reviewer)
│   ├── Project grouping (threads organized by project)
│   └── Archive affordance (threads can be archived, not deleted)
├── Top Bar
│   ├── Terminal toggle
│   ├── IDE toggle (opens default external editor per file/session)
│   ├── Git action cluster (commit, push, worktree controls)
│   └── Environment / run controls (AI-assisted run configuration)
├── Main Workspace (per active thread)
│   ├── Chat / agent conversation panel
│   ├── File tree (per session)
│   ├── "Files edited" live list (per-session change tracker)
│   └── Diff viewer (side-pane; red/green inline diffs; renders markdown, UI mockups,
│       and schema diffs specially rather than as raw text/JSON)
├── Automations Panel
│   └── One-click test execution; automation creation spins up its own thread + worktree
├── Right Sidebar (optional / contextual)
│   └── Code review panel pattern seen in adjacent OpenAI-ecosystem tools (per-workspace
│       diff review, inline notes) — [Estimated presence in Codex specifically; confirmed
│       pattern in the broader agent-desktop-app category]
└── Settings
    └── Appearance panel: theme base (Light / Dark / System), independent accent /
        background / ink color controls, contrast level, UI font picker, code font
        picker, window opacity, semantic diff colors, custom .tmTheme import,
        built-in presets (Catppuccin, Monokai, Solarized Light/Dark)
```

Sourcing: sidebar/thread/project/terminal/IDE-toggle/git/diff-viewer/automations details are drawn from direct hands-on reviews of the shipped app; the Settings → Appearance architecture (theme base, independent accent/background/ink, contrast level, dual font pickers, window opacity, semantic diff colors, `.tmTheme` import, preset library) is drawn from the app's own documented theme-export format, which is the most trustworthy source available since it describes the literal settings schema rather than a reviewer's impression.

---

## 3. Design Language

**Personality:** Codex Desktop reads as a **developer tool wearing an agent-supervisor's hat**, not a consumer chat product. The presence of git worktrees, diff viewers, terminal/IDE toggles, and per-thread file trees signals it was built for engineers who need to *audit* AI output, not just converse with it.

**Density:** Medium-to-high. A reviewer described the thread list as feeling *"compact without being cramped"* — this is the core tension the whole shell is designed around: surface a lot of parallel, resumable state (many threads, many projects, many diffs) without becoming visually noisy. `[Estimated: the actual spacing values that achieve this]`

**Why the sidebar-of-threads model exists:** Because Codex agents run long, asynchronous, and in parallel, the primary navigation problem is *not* "where am I in a hierarchy" (typical app sidebar) but "which of my N running conversations do I return to" (more like a browser's tab strip or an inbox). This is why reviewers compare thread proliferation to browser tab sprawl rather than to file-tree navigation — the design borrows the *conversation-list* pattern from chat products but applies it to something closer to task/job management. This is a genuine hybrid, and it's the most distinctive structural decision in the product.

**Diff-first trust model:** The choice to give the diff viewer its own dedicated space (not a modal, not a tab you dig for) and to special-case rendering for markdown/UI/schema diffs — rather than always falling back to raw text — is a direct design response to a stated failure mode of AI coding tools: users defaulting to "blind trust" of agent output because reviewing raw diffs is tedious. Making review *cheap* is a trust-building design decision, not a cosmetic one.

**Desktop-native vs. web-dashboard:** Terminal and IDE are toggled inline rather than requiring a context switch to another application — a distinctly desktop-native affordance that a browser-based tool couldn't offer as cleanly. Git operations live in persistent chrome (top bar) rather than being buried in menus, again privileging frequent, fast actions over discoverability-through-exploration.

---

## 4. Color System `[Estimated — see note]`

**What is confirmed:** Codex Desktop ships **Light**, **Dark**, and **System** as base themes, with **accent**, **background**, and **ink** (text/foreground) exposed as independently adjustable color roles, plus a separate **contrast level** control and dedicated **semantic diff colors** (i.e., diff-add/diff-remove are their own tokens, not hardcoded to a generic red/green). This three-role model (accent / background / ink) plus a contrast slider is a notably minimal, well-factored token system — most apps expose far more surface-level color knobs. It implies the underlying design system itself is built on a small set of semantic roles that everything else derives from, which is good practice and worth emulating regardless of the exact values.

Because exact default hex values were not observable in this session, the palette below is a **best-practice dark-theme reconstruction** consistent with the confirmed three-role model, not a measurement. Treat every hex value as a **placeholder to replace** once real values are available.

| Token | Estimated Hex | Role |
|---|---|---|
| `color.background.primary` | `#1a1a1e` `[Est.]` | App shell / window background |
| `color.background.secondary` | `#202024` `[Est.]` | Sidebar background (slightly recessed) |
| `color.surface.default` | `#232327` `[Est.]` | Cards, panels, thread list items |
| `color.surface.hover` | `#2a2a2f` `[Est.]` | Hover state on list items, buttons |
| `color.surface.active` | `#303036` `[Est.]` | Pressed / active thread selection |
| `color.surface.selected` | accent @ 12–16% opacity over surface `[Est.]` | Selected thread / active tab |
| `color.border.default` | `#333338` `[Est.]` | Panel dividers, input borders |
| `color.border.subtle` | `#2a2a2e` `[Est.]` | Low-emphasis separators |
| `color.text.primary` | `#e8e8ea` `[Est.]` | Body / primary content |
| `color.text.secondary` | `#a3a3ab` `[Est.]` | Metadata, timestamps, labels |
| `color.text.muted` | `#6f6f78` `[Est.]` | Placeholder, disabled |
| `color.accent.primary` | user-configurable; violet/blue family common in reviewed presets `[Est.]` | Primary actions, active nav, focus |
| `color.status.success` (diff-add) | `#3fb950`-family `[Est.]` | Diff additions, success states |
| `color.status.error` (diff-remove) | `#f85149`-family `[Est.]` | Diff removals, errors |
| `color.status.warning` | `#d29922`-family `[Est.]` | Warnings, approval-needed states |

**Temperature:** Reviewer language ("near-black," community themes built around "true dark," "low-glare," "sterile pure-black themes") suggests the default dark theme is a **near-black neutral-to-cool gray**, not pure `#000000` — pure black is explicitly called out by third-party theme authors as something users want to move *away* from, implying the stock theme already avoids it. `[Estimated inference, moderately confident]`

---

## 5. Typography `[Estimated]`

**Confirmed:** the app exposes **two independent font pickers** — a UI font (menus, sidebar, chat text) and a **code font** (monospace, used specifically in diffs and code blocks). This split is a meaningful, confirmed design decision: prose and code are treated as genuinely different reading tasks with different typographic needs, not just styled with one font at different weights.

Estimated scale, following the split above:

| Token | Family | Size | Weight | Usage |
|---|---|---|---|---|
| `type.ui.body` | System UI font (SF Pro / Segoe UI depending on OS) `[Est.]` | 13–14px `[Est.]` | 400 | Chat text, list items |
| `type.ui.label` | same | 11–12px `[Est.]` | 500–600 | Thread titles, section headers |
| `type.ui.caption` | same | 11px `[Est.]` | 400 | Timestamps, metadata |
| `type.mono.code` | Monospace, user-selectable (likely defaults to a name like SF Mono / Cascadia Code) `[Est.]` | 13px `[Est.]` | 400 | Diff viewer, code blocks, terminal |
| `type.mono.diff-label` | same monospace | 12px `[Est.]` | 500 | +/- line markers |

Rationale for defaulting to the OS system font rather than a bundled custom typeface: this matches the "feels native" quality reviewers attribute to the app (contrasted favorably against competitors described as feeling more like web dashboards), and matches how most serious desktop dev tools (VS Code, Xcode) behave by default.

---

## 6. Spacing System `[Estimated]`

No spacing values were directly observable. Following the "compact without cramped" density target reported by reviewers, an 4px-base scale is the most plausible fit for this density class:

```
space.1 = 4px    space.4 = 16px
space.2 = 8px    space.5 = 20px
space.3 = 12px   space.6 = 24px
```

- Thread list item padding: `space.2` vertical, `space.3` horizontal `[Est.]`
- Sidebar internal padding: `space.3` `[Est.]`
- Panel/section gaps: `space.4`–`space.5` `[Est.]`
- Diff line padding: tight, `space.1`–`space.2` `[Est.]` (diff viewers prioritize line density)

---

## 7. Layout System

**Confirmed shape:** two-pane-plus-chrome — persistent left sidebar (threads/projects), primary workspace pane (chat + file tree + diff viewer, arranged so chat and file context sit side by side per a walkthrough of the visual workspace), top chrome bar, and a contextual/automations panel that appears rather than being permanently docked.

`[Estimated dimensions]`:
- Sidebar width: ~260–280px, likely user-resizable (standard for this app class)
- Top bar height: ~44–48px
- Minimum window width: likely enforces a floor around 800–900px given the two-pane content requirement

**Resizability:** Given the presence of a file tree + chat + diff viewer competing for the same workspace, split panes are almost certainly user-resizable (confirmed pattern in comparable tools; not directly confirmed for Codex specifically) — flagged as a **should-verify** item.

---

## 8. Desktop Application UX — Confirmed Behaviors

This section is more reliable than the visual sections because it's built from direct feature reports rather than inference:

- **Terminal and IDE are toggles, not separate windows** — inline access from the top bar, removing the context-switch cost of alt-tabbing to a real terminal for quick checks.
- **Git worktrees are a first-class, UI-exposed concept** — starting a new session offers an explicit "enable git worktree" option to isolate that session's checkout from others, which is a genuinely advanced desktop-native affordance rarely surfaced this directly in consumer software.
- **Per-session file change tracking** replaces manually running `git status` — files touched by the agent populate a live sidebar list as the agent works.
- **Diff review is content-aware**, not one-size-fits-all: markdown diffs render as rendered-document diffs; UI/mockup diffs render visually; schema/data-model diffs render as drawn-out schema changes rather than raw JSON/SQL. This is one of the more sophisticated UX decisions found in the research — the diff viewer adapts its rendering strategy to content type.
- **Threads can be archived**, addressing tab-proliferation, though one critical reviewer noted the app currently lacks any automated/soft-archiving assistance — an identified UX gap (see §10).
- **Theme customization is deep and exportable**: the `codex-theme-v1` format bundles surface/accent/ink colors, contrast, both font choices, window opacity, and diff colors into one importable/exportable string, which strongly implies the underlying implementation already uses a clean semantic token layer internally — good news for anyone re-implementing this design system, since it suggests the "real" token architecture is close to what's estimated in §4–6.

A confirmed **bug pattern** is also informative for implementers: a filed issue describes the Windows build's light theme becoming inconsistently mixed with dark-theme chrome after window resize/restore, with the app shell/sidebar/top menu staying dark while content areas flip to light, producing low-contrast or unreadable text. This is a useful anti-pattern to design around: **theme tokens must be recalculated consistently across shell and content on every resize/restore event**, not cached per-region.

---

## 9. Component Notes (Confirmed Existence, Estimated Styling)

| Component | Confirmed | Estimated styling |
|---|---|---|
| Thread list item | Exists; supports archive | Compact row, ~32–36px height `[Est.]`, subtle hover surface, accent-tinted selected state `[Est.]` |
| Diff viewer | Exists; side-pane; content-aware rendering; red/green inline | Monospace, tight line-height, colored left-edge gutter for +/- `[Est.]` |
| Top bar action cluster | Exists: terminal toggle, IDE toggle, git actions, run/environment controls | Icon-first buttons, likely icon+label on hover or in a compact toolbar `[Est.]` |
| Automations panel | Exists; one-click test run; auto-creates thread + worktree | Card-based list, primary "Create"/"Run" CTA button `[Est.]` |
| Settings → Appearance | Exists: theme base selector, accent/background/ink pickers, contrast slider, dual font pickers, opacity slider, `.tmTheme` import | Standard settings-panel form layout `[Est.]` |
| Right-side review panel | Pattern confirmed in adjacent tools in the same ecosystem; not independently confirmed for Codex Desktop specifically | Flagged for verification |

---

## 10. What Should Be Copied vs. Not

**Principles worth adopting:**
- The **three-role color model** (accent / background / ink) plus a single contrast slider, rather than dozens of independent color pickers — genuinely good token minimalism.
- **Content-aware diff rendering** (markdown as rendered document, UI as visual diff, schema as drawn structure) instead of one generic diff view — directly reduces the "blind trust" failure mode.
- **Inline terminal/IDE toggles** instead of forcing app-switching for quick checks.
- **Exportable theme-as-JSON** (`codex-theme-v1`) as a portable config string — enables team-shared theming via dotfiles, a genuinely useful pattern for any desktop dev tool.
- Treating the **sidebar as a task/thread inbox** rather than a static nav tree, matching the actual mental model of supervising multiple parallel agent runs.

**Patterns to be cautious about / not blindly copy:**
- **Tab/thread proliferation with no automated triage** — a named weakness by a reviewer: threads accumulate and archiving is manual-only, with no assistance surfacing stale or resolved threads.
- **Theme consistency bug under resize** — the Windows light/dark mixing issue is a cautionary tale about caching theme state per-region instead of deriving it from a single source of truth on every layout event.
- **"IDE toggle" reliability**: one review specifically flagged the deep-link-to-editor feature as broken roughly 80% of the time in early builds — a reminder that convenience affordances need to be robust, not just present, or they erode trust faster than not having the feature at all.

**UX weaknesses to design around, not repeat:**
- No confirmed lightweight way to bulk-manage/mute noisy threads.
- Settings depth (accent/background/ink/contrast/two fonts/opacity/diff colors) is powerful but risks overwhelming a first-time user if not defaulted extremely well — worth pairing with strong presets (which Codex does address via built-in Catppuccin/Monokai/Solarized presets).

---

## 11. Implementation Guidance

Given the confirmed token model (accent / background / ink / contrast, separate UI and code fonts, semantic diff colors, exportable JSON), a faithful re-implementation should:

1. **Build a small semantic token layer first** — `background.*`, `surface.*`, `text.*`, `accent.*`, `diff.add` / `diff.remove`, and a single `contrast` multiplier — rather than hardcoding component-level colors. This mirrors what Codex's own export format implies about its internals.
2. **Keep UI font and code font as two separate CSS variables** (`--font-ui`, `--font-mono`) from day one; don't conflate them later.
3. **Derive hover/active/selected states algorithmically** (e.g., `surface` + fixed opacity overlay of `accent` or `ink`) rather than hand-picking a color per state — this is the only way to keep light/dark/custom themes consistent without duplicating component CSS, and it directly avoids the resize/theme-desync bug class described in §8.
4. **Recompute all theme tokens from a single source on every window resize/restore/state-change event** — do not let shell chrome and content-area theming diverge, which is the exact confirmed bug in the Windows build.
5. **Make the diff renderer content-type-aware** at the architecture level (route markdown/UI/schema diffs to different renderers) rather than trying to force everything through one generic text-diff component.

---

## 12. Quality Evaluation `[Directional, not a precise score — insufficient visual data for confident numeric scoring]`

| Dimension | Assessment |
|---|---|
| Token architecture | Strong — three-role color model + contrast slider + exportable format is unusually disciplined |
| Desktop-native feel | Strong — inline terminal/IDE toggles, worktree support, native settling into OS conventions |
| Diff/review UX | Strong — content-aware rendering is a genuine differentiator |
| Navigation model (threads) | Good but incomplete — right pattern (inbox, not tree) undermined by lack of triage tooling at scale |
| Cross-platform consistency | Weakness confirmed — Windows theme-desync bug on resize |
| Reliability of convenience features | Mixed — IDE deep-link reported unreliable in early builds |
| Visual specifics (color/type/spacing exact values) | **Cannot be scored** — not independently observable in this session |

---

## 13. Next Step to Get This to 100%

Everything structural in this document is grounded and citable. Everything visual is a professional placeholder. To finish this properly:

1. Open Codex Desktop → Settings → Appearance → **Export**, copy the `codex-theme-v1` string, and paste it here. That single string contains the real accent/background/ink hex values, both real font names, real contrast level, and real diff colors.
2. Send 4–6 screenshots (main thread view, diff viewer open, settings/appearance panel, automations panel, and if possible one light-mode shot).

With those two things I can replace every `[Estimated]` tag in this document with a verified value and turn this into a true implementation-ready spec.