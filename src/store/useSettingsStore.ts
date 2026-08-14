import { create } from 'zustand';
import { setBatchInterval, voiceSetSilenceTimeout, voiceSetInputDevice, voiceSetLanguage, voiceSetModelSize, autostartSetEnabled } from '@/lib/tauri';
import { TerminalTheme } from '@/types/terminal';

// Lazy accessor for the UI store — dynamic import resolves at CALL time, so
// there is no circular-import hazard at module load and it works in Vite and
// Vitest alike. If the store isn't ready, the toast is dropped (non-fatal).
const addToastLazy = (toast: { type: 'info' | 'warning' | 'error' | 'success'; title: string; description?: string }) => {
  import('./useUIStore')
    .then(({ useUIStore }) => useUIStore.getState().addToast(toast))
    .catch(() => {});
};

export const THEMES: Record<string, TerminalTheme> = {
  vibeDark: {
    name: 'VibeDark',
    background: '#08080a',
    foreground: '#f4f4f5',
    cursor: '#ffffff',
    cursorAccent: '#08080a',
    selectionBackground: 'rgba(255, 255, 255, 0.25)',
    black: '#0a0a0c',
    red: '#f43f5e',
    green: '#3c95f0',
    yellow: '#f59e0b',
    blue: '#3b82f6',
    magenta: '#a855f7',
    cyan: '#06b6d4',
    white: '#f4f4f5',
    brightBlack: '#475569',
    brightRed: '#fb7185',
    brightGreen: '#64bcff',
    brightYellow: '#fbbf24',
    brightBlue: '#60a5fa',
    brightMagenta: '#c084fc',
    brightCyan: '#22d3ee',
    brightWhite: '#f8fafc',
  },
  oneDarkPro: {
    name: 'One Dark Pro',
    background: '#282c34',
    foreground: '#abb2bf',
    cursor: '#61afef',
    cursorAccent: '#282c34',
    selectionBackground: 'rgba(97, 175, 239, 0.3)',
    black: '#282c34',
    red: '#e06c75',
    green: '#98c379',
    yellow: '#e5c07b',
    blue: '#61afef',
    magenta: '#c678dd',
    cyan: '#56b6c2',
    white: '#abb2bf',
    brightBlack: '#5c6370',
    brightRed: '#e06c75',
    brightGreen: '#98c379',
    brightYellow: '#e5c07b',
    brightBlue: '#61afef',
    brightMagenta: '#c678dd',
    brightCyan: '#56b6c2',
    brightWhite: '#ffffff',
  },
  nord: {
    name: 'Nord',
    background: '#2e3440',
    foreground: '#d8dee9',
    cursor: '#88c0d0',
    cursorAccent: '#2e3440',
    selectionBackground: 'rgba(136, 192, 208, 0.3)',
    black: '#3b4252',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0',
    brightBlack: '#4c566a',
    brightRed: '#bf616a',
    brightGreen: '#a3be8c',
    brightYellow: '#ebcb8b',
    brightBlue: '#81a1c1',
    brightMagenta: '#b48ead',
    brightCyan: '#8fbcbb',
    brightWhite: '#eceff4',
  },
  tokyoNight: {
    name: 'Tokyo Night',
    background: '#1a1b26',
    foreground: '#c0caf5',
    cursor: '#7aa2f7',
    cursorAccent: '#1a1b26',
    selectionBackground: 'rgba(122, 162, 247, 0.3)',
    black: '#15161e',
    red: '#f7768e',
    green: '#9ece6a',
    yellow: '#e0af68',
    blue: '#7aa2f7',
    magenta: '#bb9af7',
    cyan: '#7dcfff',
    white: '#a9b1d6',
    brightBlack: '#414868',
    brightRed: '#f7768e',
    brightGreen: '#9ece6a',
    brightYellow: '#e0af68',
    brightBlue: '#7aa2f7',
    brightMagenta: '#bb9af7',
    brightCyan: '#7dcfff',
    brightWhite: '#c0caf5',
  },
  catppuccin: {
    name: 'Catppuccin Mocha',
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    cursor: '#cba6f7',
    cursorAccent: '#1e1e2e',
    selectionBackground: 'rgba(203, 166, 247, 0.3)',
    black: '#45475a',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#f5c2e7',
    cyan: '#94e2d5',
    white: '#bac2de',
    brightBlack: '#585b70',
    brightRed: '#f38ba8',
    brightGreen: '#a6e3a1',
    brightYellow: '#f9e2af',
    brightBlue: '#89b4fa',
    brightMagenta: '#f5c2e7',
    brightCyan: '#94e2d5',
    brightWhite: '#a6adc8',
  },
  gruvboxDark: {
    name: 'Gruvbox Dark',
    background: '#282828',
    foreground: '#ebdbb2',
    cursor: '#fabd2f',
    cursorAccent: '#282828',
    selectionBackground: 'rgba(250, 189, 47, 0.3)',
    black: '#282828',
    red: '#cc241d',
    green: '#98971a',
    yellow: '#d79921',
    blue: '#458588',
    magenta: '#b16286',
    cyan: '#689d6a',
    white: '#a89984',
    brightBlack: '#928374',
    brightRed: '#fb4934',
    brightGreen: '#b8bb26',
    brightYellow: '#fabd2f',
    brightBlue: '#83a598',
    brightMagenta: '#d3869b',
    brightCyan: '#8ec07c',
    brightWhite: '#ebdbb2',
  },
  solarizedDark: {
    name: 'Solarized Dark',
    background: '#002b36',
    foreground: '#839496',
    cursor: '#268bd2',
    cursorAccent: '#002b36',
    selectionBackground: 'rgba(38, 139, 210, 0.3)',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#002b36',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3',
  },
  githubDark: {
    name: 'GitHub Dark',
    background: '#0d1117',
    foreground: '#c9d1d9',
    cursor: '#58a6ff',
    cursorAccent: '#0d1117',
    selectionBackground: 'rgba(88, 166, 255, 0.3)',
    black: '#484f58',
    red: '#ff7b72',
    green: '#3fb950',
    yellow: '#d29922',
    blue: '#58a6ff',
    magenta: '#bc8cff',
    cyan: '#39c5cf',
    white: '#b1bac4',
    brightBlack: '#6e7681',
    brightRed: '#ffa198',
    brightGreen: '#56d364',
    brightYellow: '#e3b341',
    brightBlue: '#79c0ff',
    brightMagenta: '#d2a8ff',
    brightCyan: '#56d4dd',
    brightWhite: '#f0f6fc',
  },
  // Customization audit C3: a proper light palette. Selecting it (directly or
  // via themeMode 'light'/'system') flips the whole chrome — the Tailwind
  // config maps every chrome color to these CSS variables, so the app shell
  // follows automatically.
  vibeLight: {
    name: 'VibeLight',
    background: '#f6f8fa',
    foreground: '#1f2328',
    cursor: '#0969da',
    cursorAccent: '#f6f8fa',
    selectionBackground: 'rgba(9, 105, 218, 0.25)',
    black: '#24292f',
    red: '#d1242f',
    green: '#1a7f37',
    yellow: '#9a6700',
    blue: '#0969da',
    magenta: '#8250df',
    cyan: '#1b7c83',
    white: '#424a53',
    brightBlack: '#6e7781',
    brightRed: '#cf222e',
    brightGreen: '#116329',
    brightYellow: '#4d2d00',
    brightBlue: '#0a3069',
    brightMagenta: '#6639ba',
    brightCyan: '#1b7c83',
    brightWhite: '#0a0d12',
  },
};

export type CursorStyle = 'block' | 'underline' | 'bar';

/** Customization audit C3: how the UI chrome picks its color scheme. 'dark'
 *  and 'light' are explicit; 'system' follows the OS via prefers-color-scheme
 *  (and the Tauri window theme when available). The TERMINAL palette stays an
 *  independent `themeName` choice either way. */
export type ThemeMode = 'dark' | 'light' | 'system';

/** One step of a macro (customization audit C22): either a named app action
 *  from the catalog in src/lib/macros.ts, or a pause. */
export interface MacroStep {
  type: 'action' | 'delay';
  actionId?: string;
  ms?: number;
}

/** A user-defined macro: a named sequence of actions + optional pauses, with
 *  an optional keybinding. Run from the palette or via its keybinding. */
export interface Macro {
  id: string;
  name: string;
  keybinding: string;
  steps: MacroStep[];
}

/** A user-defined palette command (customization audit C21): a label shown in
 *  the command palette plus the shell command it types into the focused pane. */
export interface UserCommand {
  id: string;
  label: string;
  command: string;
}

/** Confirmation strictness per destructive action: 'always' asks every time,
 *  'never' performs the action immediately without a dialog. */
export type ConfirmMode = 'always' | 'never';

export interface StatusBarBadges {
  workspace: boolean;
  font: boolean;
  gpu: boolean;
  panes: boolean;
}

const STORAGE_KEY = 'vibegrid_settings_v2';
const LEGACY_STORAGE_KEY = 'vibegrid_settings_v1';
const CURRENT_SCHEMA_VERSION = 2;
/** Named settings profiles (customization audit S1), stored separately from
 *  the live settings so saving/loading a profile never corrupts them. */
const PROFILES_KEY = 'vibegrid_settings_profiles_v1';

interface AppSettings {
  fontSize: number;
  fontFamily: string;
  themeName: string;
  /** Customization audit C3: 'dark' | 'light' | 'system' for the UI chrome. */
  themeMode: ThemeMode;
  /** Settings schema version (customization audit S2) — loadSettings runs
   *  migrateSettings() to upgrade older persisted blobs in place. */
  schemaVersion: number;
  scrollback: number;
  cursorBlink: boolean;
  cursorStyle: CursorStyle;
  ipcBatchIntervalMs: number;
  fontLigatures: boolean;
  lineHeight: number;
  terminalOpacity: number;
  /** Auto-copy selection to clipboard when selecting text in a pane (audit: was MISSING). */
  copyOnSelect: boolean;
  /** Close button hides to the tray instead of quitting (audit: was MISSING). */
  minimizeToTray: boolean;
  /** Global default shell for new panes ('' = system default). Per-pane
   * overrides win (UX audit: only per-pane existed before). */
  defaultShell: string;
  voiceToTerminal: boolean;
  /** Auto-stop silence timeout in ms (gap 10). */
  voiceSilenceTimeoutMs: number;
  /** Preferred microphone input device name ('' = system default) (gap 14). */
  voiceInputDevice: string;

  // ── Customization audit P0: limits & caps ─────────────────────────────
  /** Maximum number of panes allowed (was hardcoded 16). */
  maxPanes: number;
  /** Minimum pane size in px enforced by the splitter drag. */
  minPaneSize: number;
  /** Snap-to-equal on divider release (on/off). */
  dividerSnap: boolean;
  /** Snap threshold: fraction of the equal split that triggers a snap. */
  snapEpsilon: number;
  /** Double-click a divider to re-equalize that split. */
  doubleClickEqualize: boolean;
  fontSizeMin: number;
  fontSizeMax: number;
  lineHeightMin: number;
  lineHeightMax: number;
  /** Lowest allowed terminal opacity (0.1 → truly translucent). */
  terminalOpacityMin: number;
  scrollbackMin: number;
  scrollbackMax: number;
  voiceSilenceTimeoutMin: number;
  voiceSilenceTimeoutMax: number;
  toastMaxCount: number;
  toastDefaultDurationMs: number;
  paletteRecentsMax: number;
  /** Debounced autosave interval in ms (App.tsx hardcoded 500). */
  autosaveIntervalMs: number;
  /** Show the splash screen at startup. */
  showSplash: boolean;
  /** First-run hint auto-dismiss duration in ms (0 = sticky). */
  hintDurationMs: number;
  workspaceNameMaxLength: number;
  paneTitleMaxLength: number;
  /** Confirmation strictness per destructive action. */
  confirmations: {
    paneClose: ConfirmMode;
    quit: ConfirmMode;
    layoutShrink: ConfirmMode;
    workspaceDelete: ConfirmMode;
  };

  // ── Customization audit P1: appearance ────────────────────────────────
  /** UI chrome accent override (null = derived from terminal theme cursor). */
  uiAccentColor: string | null;
  /** Master switch for animations; respects prefers-reduced-motion too. */
  animationsEnabled: boolean;
  /** UI zoom percentage (80–150). */
  uiZoom: number;
  compactMode: boolean;
  hideStatusBar: boolean;
  hideHeader: boolean;
  /** Sidebar width in px. */
  sidebarWidth: number;
  statusBarBadges: StatusBarBadges;

  // ── Customization audit P1: terminal behavior ─────────────────────────
  /** Right-click pastes clipboard instead of opening the context menu. */
  rightClickPaste: boolean;
  /** Make URLs clickable; linkModifier is the required modifier key. */
  clickableLinks: boolean;
  linkModifier: 'click' | 'meta' | 'ctrl' | 'alt';
  /** Play a terminal bell sound (visual fallback when unavailable). */
  terminalBell: boolean;
  /** Scroll to bottom when the shell emits output. */
  scrollOnOutput: boolean;
  /** Characters treated as word boundaries for double-click selection. */
  wordSeparators: string;
  /** Confirm pastes that contain newlines (accidental multi-line paste guard). */
  pasteConfirmNewlines: boolean;
  /** Extra padding (px) around the terminal canvas inside each pane (C6). */
  terminalPadding: number;
  /** Width of the bar cursor in px (C5). */
  cursorWidth: number;
  /** Global working directory for NEW panes ('' = inherit the split parent / session dir) (C7). */
  defaultCwd: string;
  /** Space-separated startup arguments passed to the DEFAULT shell of every
   *  new pane (C11). Not applied to per-pane shell overrides — those are a
   *  different shell and the args were written for the default one. */
  shellArgs: string;
  /** Newline-separated `KEY=VALUE` environment variables for new panes (C11).
   *  Merged over the built-in TERM/COLORTERM/LANG/VIBEGRID set, which always win. */
  shellEnv: string;
  /** Max concurrent WebGL contexts before panes fall back to canvas (L2). */
  maxWebglSlots: number;
  /** Whisper language code for dictation ('auto' = auto-detect) (C28). */
  voiceLanguage: string;
  /** Whisper model size: tiny | base | small | medium (C28). */
  voiceModelSize: string;

  // ── Customization audit P1: custom themes (C1) ────────────────────────
  /** User-created themes keyed by a stable id. Persisted with settings;
   *  merged over THEMES so a custom theme name can be selected anywhere a
   *  built-in can. */
  customThemes: Record<string, TerminalTheme>;

  /** User-defined commands shown in the command palette (C21). Running one
   *  types the command into the focused pane and presses Enter. */
  userCommands: UserCommand[];

  /** User-defined macros (customization audit C22): named sequences of app
   *  actions + delays, runnable from the palette or a keybinding. */
  macros: Macro[];

  // ── Customization audit P1: startup & tray (Rust-wired) ───────────────
  launchAtLogin: boolean;
  startMaximized: boolean;
  /** Start hidden to the system tray. */
  startHidden: boolean;
  /** Closing the window hides to tray instead of quitting (separate from minimizeToTray). */
  closeToTray: boolean;
}

const defaultSettings: AppSettings = {
  fontSize: 14,
  fontFamily: 'JetBrains Mono, monospace',
  themeName: 'vibeDark',
  themeMode: 'dark',
  schemaVersion: 2,
  scrollback: 5000,
  cursorBlink: true,
  cursorStyle: 'block',
  ipcBatchIntervalMs: 16,
  fontLigatures: true,
  lineHeight: 1.2,
  terminalOpacity: 1,
  copyOnSelect: false,
  minimizeToTray: false,
  defaultShell: '',
  voiceToTerminal: false,
  voiceSilenceTimeoutMs: 1600,
  voiceInputDevice: '',

  maxPanes: 16,
  minPaneSize: 120,
  dividerSnap: true,
  snapEpsilon: 0.04,
  doubleClickEqualize: true,
  fontSizeMin: 8,
  fontSizeMax: 32,
  lineHeightMin: 0.8,
  lineHeightMax: 2.5,
  terminalOpacityMin: 0.1,
  scrollbackMin: 100,
  scrollbackMax: 1000000,
  voiceSilenceTimeoutMin: 200,
  voiceSilenceTimeoutMax: 15000,
  toastMaxCount: 4,
  toastDefaultDurationMs: 3000,
  paletteRecentsMax: 8,
  autosaveIntervalMs: 500,
  showSplash: true,
  hintDurationMs: 9000,
  workspaceNameMaxLength: 50,
  paneTitleMaxLength: 40,
  confirmations: {
    paneClose: 'always',
    quit: 'always',
    layoutShrink: 'always',
    workspaceDelete: 'always',
  },

  uiAccentColor: null,
  animationsEnabled: true,
  uiZoom: 100,
  compactMode: false,
  hideStatusBar: false,
  hideHeader: false,
  sidebarWidth: 256,
  statusBarBadges: { workspace: true, font: true, gpu: true, panes: true },

  rightClickPaste: false,
  clickableLinks: false,
  linkModifier: 'click',
  terminalBell: false,
  scrollOnOutput: false,
  wordSeparators: ' ',
  pasteConfirmNewlines: false,
  terminalPadding: 4,
  cursorWidth: 1,
  defaultCwd: '',
  shellArgs: '',
  shellEnv: '',
  maxWebglSlots: 12,
  voiceLanguage: 'auto',
  voiceModelSize: 'base',
  customThemes: {},
  userCommands: [],
  macros: [],

  launchAtLogin: false,
  startMaximized: false,
  startHidden: false,
  closeToTray: false,
};

/**
 * Resolve a persisted/imported theme key against the full theme universe
 * (built-ins + custom themes from the same settings blob). Unknown keys fall
 * back to the default so a hand-edited or stale settings file never leaves
 * `themeName` pointing at a palette that doesn't exist.
 */
function resolveThemeKey(key: string, customThemes: Record<string, TerminalTheme> = {}): string {
  return key in THEMES || key in customThemes ? key : defaultSettings.themeName;
}

/** Validate that a parsed object is a usable TerminalTheme palette. */
function isThemePalette(v: unknown): v is TerminalTheme {
  if (typeof v !== 'object' || v === null) return false;
  const t = v as Record<string, unknown>;
  return typeof t.background === 'string' && typeof t.foreground === 'string' && typeof t.cursor === 'string';
}

/**
 * Settings schema migration (customization audit S2). Upgrades an older
 * persisted blob in place before validation. v1 → v2 introduced
 * themeMode/schemaVersion; there is nothing to rewrite yet, but this is where
 * future migrations will live.
 */
function migrateSettings(parsed: Record<string, unknown>): Record<string, unknown> {
  const version = typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 1;
  let next = { ...parsed };
  if (version < 2) {
    next = { ...next, schemaVersion: CURRENT_SCHEMA_VERSION, themeMode: 'dark' };
  }
  return next;
}

function readProfiles(): Record<string, Record<string, unknown>> {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    // ignore corrupt profile storage
  }
  return {};
}

function writeProfiles(profiles: Record<string, Record<string, unknown>>) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    // ignore storage errors
  }
}

function loadSettings(): AppSettings {
  try {
    // Customization audit S2: read the current schema key; fall back to the
    // legacy v1 key (migrated in place) so upgrading users don't lose settings.
    let raw = localStorage.getItem(STORAGE_KEY);
    let migrated = false;
    if (!raw && localStorage.getItem(LEGACY_STORAGE_KEY)) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      migrated = true;
    }
    if (raw) {
      const parsed = migrateSettings(JSON.parse(raw));
      // Custom themes are validated palette-by-palette so a corrupt entry can't
      // poison the whole settings load.
      const customThemes: Record<string, TerminalTheme> = {};
      if (parsed.customThemes && typeof parsed.customThemes === 'object') {
        for (const [id, palette] of Object.entries(parsed.customThemes)) {
          if (isThemePalette(palette)) customThemes[id] = palette;
        }
      }
      const result: AppSettings = {
        ...defaultSettings,
        ...parsed,
        themeName: resolveThemeKey(String(parsed.themeName ?? ''), customThemes),
        customThemes,
        // Deep-merge nested objects so a partial/older settings file can never
        // leave confirmations / statusBarBadges partially undefined.
        confirmations: { ...defaultSettings.confirmations, ...(parsed.confirmations ?? {}) },
        statusBarBadges: { ...defaultSettings.statusBarBadges, ...(parsed.statusBarBadges ?? {}) },
      };
      // Upgrade the storage in place (stamp the new key, drop the legacy one)
      // so the next launch reads a single canonical blob.
      if (migrated || parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        persist(result);
      }
      if (migrated) {
        try {
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch (e) {
          // ignore
        }
      }
      return result;
    }
  } catch (e) {
    // ignore corrupt storage
  }
  return defaultSettings;
}

function persist(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // ignore storage errors
  }
}

/** Clamp a numeric field to its valid range (where one is defined). */
function clampNumeric(key: keyof AppSettings, value: unknown): unknown {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  if (n === undefined) return value;
  switch (key) {
    case 'maxPanes': return Math.max(1, Math.min(64, Math.round(n)));
    case 'minPaneSize': return Math.max(40, Math.min(400, Math.round(n)));
    case 'snapEpsilon': return Math.max(0, Math.min(0.2, n));
    case 'fontSizeMin': return Math.max(4, Math.min(96, Math.round(n)));
    case 'fontSizeMax': return Math.max(4, Math.min(96, Math.round(n)));
    case 'lineHeightMin': return Math.max(0.5, Math.min(4, Math.round(n * 100) / 100));
    case 'lineHeightMax': return Math.max(0.5, Math.min(4, Math.round(n * 100) / 100));
    case 'terminalOpacityMin': return Math.max(0.05, Math.min(1, Math.round(n * 100) / 100));
    case 'scrollbackMin': return Math.max(1, Math.min(10000000, Math.round(n)));
    case 'scrollbackMax': return Math.max(1, Math.min(10000000, Math.round(n)));
    case 'voiceSilenceTimeoutMin': return Math.max(100, Math.min(60000, Math.round(n)));
    case 'voiceSilenceTimeoutMax': return Math.max(100, Math.min(60000, Math.round(n)));
    case 'toastMaxCount': return Math.max(1, Math.min(20, Math.round(n)));
    case 'toastDefaultDurationMs': return Math.max(500, Math.min(30000, Math.round(n)));
    case 'paletteRecentsMax': return Math.max(1, Math.min(50, Math.round(n)));
    case 'autosaveIntervalMs': return Math.max(100, Math.min(10000, Math.round(n)));
    case 'hintDurationMs': return Math.max(0, Math.min(60000, Math.round(n)));
    case 'workspaceNameMaxLength': return Math.max(10, Math.min(200, Math.round(n)));
    case 'paneTitleMaxLength': return Math.max(10, Math.min(200, Math.round(n)));
    case 'uiZoom': return Math.max(80, Math.min(150, Math.round(n)));
    case 'sidebarWidth': return Math.max(160, Math.min(480, Math.round(n)));
    case 'cursorWidth': return Math.max(1, Math.min(8, Math.round(n)));
    case 'maxWebglSlots': return Math.max(1, Math.min(64, Math.round(n)));
    default: return value;
  }
}

/**
 * Push the chrome palette into the CSS variables every component derives its
 * colors from (the Tailwind config maps each chrome color to these vars).
 * Customization audit C3: the CHROME palette is chosen by themeMode — 'light'
 * (or 'system' resolving to light) uses vibeLight regardless of the terminal
 * theme, which stays an independent `themeName` choice. The accent still
 * follows the TERMINAL theme's cursor (or an explicit override, C2), so the
 * UI accent never fights the palette you actually type into.
 */
function applyThemeVariables(
  themeKey: string,
  accentOverride: string | null | undefined,
  customThemes: Record<string, TerminalTheme> | undefined,
  mode: ThemeMode,
  prefersDark: boolean
) {
  const termTheme = THEMES[themeKey] || customThemes?.[themeKey] || THEMES.vibeDark;
  const light = mode === 'light' || (mode === 'system' && !prefersDark);
  const chrome = light ? THEMES.vibeLight : termTheme;
  if (typeof document !== 'undefined') {
    const root = document.documentElement;

    // ── Background ──────────────────────────────────────────────────────────
    root.style.setProperty('--color-bg', chrome.background);
    const bgChannels = colorToRgbChannels(chrome.background);
    if (bgChannels) root.style.setProperty('--color-bg-rgb', bgChannels);

    // ── Surface (panel / card backgrounds) ──────────────────────────────────
    root.style.setProperty('--color-surface', chrome.black);
    const surfaceChannels = colorToRgbChannels(chrome.black);
    if (surfaceChannels) {
      root.style.setProperty('--color-surface-rgb', surfaceChannels);
      root.style.setProperty('--color-surface-card-rgb', surfaceChannels);
    }

    // ── Surface hover ────────────────────────────────────────────────────────
    root.style.setProperty('--color-surface-hover', chrome.brightBlack);
    const surfaceHoverChannels = colorToRgbChannels(chrome.brightBlack);
    if (surfaceHoverChannels) root.style.setProperty('--color-surface-hover-rgb', surfaceHoverChannels);

    // ── Border ───────────────────────────────────────────────────────────────
    // Store both a raw CSS value for legacy usage and an RGB triplet so the
    // Tailwind `border` token (rgb(var(--color-border-rgb) / <alpha>)) works.
    root.style.setProperty('--color-border', light ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.08)');
    // Border uses white-on-dark / black-on-light at low opacity — we derive
    // the pure channel triplet from the extreme (black or white) so
    // border/opacity modifiers produce the right colour.
    root.style.setProperty('--color-border-rgb', light ? '0 0 0' : '255 255 255');

    // ── Accent (cursor / highlight) ──────────────────────────────────────────
    const accent = accentOverride ?? termTheme.cursor;
    root.style.setProperty('--color-accent', accent);
    const accentChannels = colorToRgbChannels(accent);
    if (accentChannels) {
      root.style.setProperty('--color-accent-rgb', accentChannels);
      root.style.setProperty('--color-accent-rgba', accentChannels.replace(/ /g, ', '));
    }

    // ── Foreground ───────────────────────────────────────────────────────────
    root.style.setProperty('--color-fg', chrome.foreground);
    const fgChannels = colorToRgbChannels(chrome.foreground);
    if (fgChannels) root.style.setProperty('--color-fg-rgb', fgChannels);

    // ── Muted ────────────────────────────────────────────────────────────────
    const mutedHex = light ? '#57606a' : '#8b93a1';
    root.style.setProperty('--color-muted', mutedHex);
    const mutedChannels = colorToRgbChannels(mutedHex);
    if (mutedChannels) root.style.setProperty('--color-muted-rgb', mutedChannels);

    // ── Selection ────────────────────────────────────────────────────────────
    root.style.setProperty('--color-selection', termTheme.selectionBackground);

    // Light chrome remaps the white-alpha text/surface utilities via
    // html.vibegrid-light (index.css) and flips the native color-scheme so
    // scrollbars/inputs follow.
    root.classList.toggle('vibegrid-light', light);
    root.style.colorScheme = light ? 'light' : 'dark';
  }
}

/** Convert any CSS color (6-digit hex, rgb()/rgba(), oklch(), named colors…)
 *  into the space-separated RGB triplet form Tailwind's alpha-capable colors
 *  need (e.g. '60 149 240'). Falls back to a probe-element + getComputedStyle
 *  so custom-theme cursors in exotic formats still keep --color-accent-rgb in
 *  sync with --color-accent. Returns null when the color can't be resolved. */
function colorToRgbChannels(color: string | null | undefined): string | null {
  if (!color) return null;
  const hex = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (hex) {
    const n = parseInt(hex[1], 16);
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
  }
  // General path: let the browser resolve any valid CSS color to its RGB form.
  if (typeof document !== 'undefined') {
    try {
      const probe = document.createElement('div');
      probe.style.color = color;
      probe.style.display = 'none';
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).color; // e.g. "rgb(60, 149, 240)"
      document.body.removeChild(probe);
      const m = /rgba?\(\s*([\d.]+)\s*[,\s]+\s*([\d.]+)\s*[,\s]+\s*([\d.]+)/i.exec(resolved);
      if (m) {
        return `${Math.round(parseFloat(m[1]))} ${Math.round(parseFloat(m[2]))} ${Math.round(parseFloat(m[3]))}`;
      }
    } catch {
      // fall through to null
    }
  }
  return null;
}

/** Re-apply the chrome from the CURRENT settings state (single source of truth
 *  for every caller). */
const applyChrome = () => {
  const s = useSettingsStore.getState();
  applyThemeVariables(s.themeName, s.uiAccentColor, s.customThemes, s.themeMode, s.systemPrefersDark);
};

/**
 * Apply a parsed settings object (settings-file import or a named profile,
 * customization audit S1/S2): merge over defaults, sanitize nested fields,
 * persist, re-apply the chrome, and push every Rust-wired setting back to the
 * backend (the setters are the only channel Rust learns from). Shared by
 * `importSettings` and `loadSettingsProfile` so both paths behave identically.
 */
function applyImportedSettingsObject(parsed: unknown): boolean {
  try {
    if (typeof parsed !== 'object' || parsed === null) return false;
    const src = parsed as Record<string, unknown>;
    const next: AppSettings = {
      ...defaultSettings,
      ...Object.fromEntries(Object.entries(src).filter(([key]) => key in defaultSettings)),
    };
    // Deep-merge nested objects; coerce each confirm/badge field defensively.
    next.confirmations = { ...defaultSettings.confirmations, ...(src.confirmations ?? {}) };
    next.statusBarBadges = { ...defaultSettings.statusBarBadges, ...(src.statusBarBadges ?? {}) };
    next.copyOnSelect = typeof next.copyOnSelect === 'boolean' ? next.copyOnSelect : defaultSettings.copyOnSelect;
    // Audit fix: never import an invalid theme key — fall back to the default.
    next.themeName = resolveThemeKey(next.themeName, next.customThemes);
    next.themeMode = next.themeMode === 'light' || next.themeMode === 'system' ? next.themeMode : 'dark';
    // Customization audit C21: imported user commands must be well-formed
    // (label/command strings) or they could poison the palette. Missing or
    // invalid ids get a fresh one — duplicate ids would break the palette's
    // React keys (`user-cmd-${id}`) and recents pruning.
    next.userCommands = Array.isArray(next.userCommands)
      ? next.userCommands
          .filter((u) => u && typeof u.label === 'string' && typeof u.command === 'string')
          .map((u) => ({
            id:
              typeof u.id === 'string' && u.id
                ? u.id
                : `uc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            label: u.label,
            command: u.command,
          }))
      : [];
    // Customization audit C22: imported macros must carry a name + steps array
    // (unknown action ids are skipped at run time by the runner).
    next.macros = Array.isArray(next.macros)
      ? next.macros
          .filter((m) => m && typeof m.name === 'string' && Array.isArray(m.steps))
          .map((m, i) => ({
            id: typeof m.id === 'string' && m.id ? m.id : `macro-${Date.now()}-${i}`,
            name: m.name,
            keybinding: typeof m.keybinding === 'string' ? m.keybinding : '',
            steps: m.steps,
          }))
      : [];
    useSettingsStore.setState(next);
    persist(next);
    applyChrome();
    setBatchInterval(next.ipcBatchIntervalMs).catch(console.error);
    voiceSetSilenceTimeout(next.voiceSilenceTimeoutMs).catch(console.error);
    voiceSetInputDevice(next.voiceInputDevice).catch(console.error);
    voiceSetLanguage(next.voiceLanguage).catch(console.error);
    voiceSetModelSize(next.voiceModelSize).catch(console.error);
    autostartSetEnabled(next.launchAtLogin).catch(console.error);
    return true;
  } catch (e) {
    return false;
  }
}

/** Full selectable theme universe: built-ins + user custom themes. */
export function getAllThemes(state: { customThemes: Record<string, TerminalTheme> }): Record<string, TerminalTheme> {
  return { ...THEMES, ...state.customThemes };
}

interface SettingsState extends AppSettings {
  // Actions
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  setThemeName: (name: string) => void;
  setScrollback: (lines: number) => void;
  setCursorBlink: (blink: boolean) => void;
  setCursorStyle: (style: CursorStyle) => void;
  setIpcBatchIntervalMs: (ms: number) => void;
  setFontLigatures: (enabled: boolean) => void;
  setLineHeight: (height: number) => void;
  setTerminalOpacity: (opacity: number) => void;
  setCopyOnSelect: (enabled: boolean) => void;
  setMinimizeToTray: (enabled: boolean) => void;
  setDefaultShell: (shell: string) => void;
  setVoiceToTerminal: (enabled: boolean) => void;
  setVoiceSilenceTimeoutMs: (ms: number) => void;
  setVoiceInputDevice: (name: string) => void;
  /** Generic setter for every setting (customization audit): merges the patch,
   *  clamps numerics, persists, and re-applies side effects. */
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (json: string) => boolean;
  /** Create a custom theme from a base palette (defaults to the current theme). */
  saveThemeAs: (name: string, base?: TerminalTheme) => string;
  /** Duplicate a theme (built-in or custom) under a new name. */
  duplicateTheme: (id: string) => string;
  renameTheme: (id: string, name: string) => void;
  deleteTheme: (id: string) => void;
  updateThemeColors: (id: string, patch: Partial<TerminalTheme>) => void;
  /** Import a single theme JSON (raw palette object or { name, ...palette }). */
  importTheme: (json: string) => boolean;
  /** Export a single theme as JSON (the palette object with its name). */
  exportTheme: (id: string) => string | null;
  /** Runtime OS color-scheme preference (only consulted when themeMode === 'system'). */
  systemPrefersDark: boolean;
  setSystemPrefersDark: (prefersDark: boolean) => void;
  /** Customization audit S1: named settings profiles. */
  saveSettingsProfile: (name: string) => boolean;
  loadSettingsProfile: (name: string) => boolean;
  deleteSettingsProfile: (name: string) => void;
  listSettingsProfiles: () => string[];
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadSettings(),
  // Runtime OS preference — re-derived from matchMedia/tauri on every boot,
  // never treated as a user choice.
  systemPrefersDark: true,

  setFontSize: (size: number) => {
    const { fontSizeMin, fontSizeMax } = get();
    const fontSize = Math.max(fontSizeMin, Math.min(fontSizeMax, Math.round(size)));
    set({ fontSize });
    persist(get());
  },
  setFontFamily: (family: string) => {
    set({ fontFamily: family });
    persist(get());
  },
  increaseFontSize: () => {
    const { fontSizeMax } = get();
    if (get().fontSize >= fontSizeMax) {
      addToastLazy({ type: 'info', title: 'Maximum font size reached', description: `Terminal font is capped at ${fontSizeMax}px.` });
      return;
    }
    const fontSize = Math.min(fontSizeMax, get().fontSize + 1);
    set({ fontSize });
    persist(get());
  },
  decreaseFontSize: () => {
    const { fontSizeMin } = get();
    if (get().fontSize <= fontSizeMin) {
      addToastLazy({ type: 'info', title: 'Minimum font size reached', description: `Terminal font is capped at ${fontSizeMin}px.` });
      return;
    }
    const fontSize = Math.max(fontSizeMin, get().fontSize - 1);
    set({ fontSize });
    persist(get());
  },
  resetFontSize: () => {
    set({ fontSize: defaultSettings.fontSize });
    persist(get());
  },
  setThemeName: (name: string) => {
    const resolved = resolveThemeKey(name, get().customThemes);
    set({ themeName: resolved });
    persist(get());
    applyChrome();
  },
  setScrollback: (lines: number) => {
    const { scrollbackMin, scrollbackMax } = get();
    const scrollback = Math.max(scrollbackMin, Math.min(scrollbackMax, lines));
    set({ scrollback });
    persist(get());
  },
  setCursorBlink: (blink: boolean) => {
    set({ cursorBlink: blink });
    persist(get());
  },
  setCursorStyle: (style: CursorStyle) => {
    set({ cursorStyle: style });
    persist(get());
  },
  setIpcBatchIntervalMs: (ms: number) => {
    const ipcBatchIntervalMs = Math.min(2000, Math.max(4, Math.round(ms)));
    set({ ipcBatchIntervalMs });
    persist(get());
    setBatchInterval(ipcBatchIntervalMs).catch(console.error);
  },
  setFontLigatures: (fontLigatures: boolean) => {
    set({ fontLigatures });
    persist(get());
  },
  setLineHeight: (lineHeight: number) => {
    const { lineHeightMin, lineHeightMax } = get();
    const clamped = Math.max(lineHeightMin, Math.min(lineHeightMax, Math.round(lineHeight * 100) / 100));
    set({ lineHeight: clamped });
    persist(get());
  },
  setTerminalOpacity: (terminalOpacity: number) => {
    const { terminalOpacityMin } = get();
    const clamped = Math.max(terminalOpacityMin, Math.min(1, Math.round(terminalOpacity * 100) / 100));
    set({ terminalOpacity: clamped });
    persist(get());
  },
  setCopyOnSelect: (copyOnSelect: boolean) => {
    set({ copyOnSelect });
    persist(get());
  },
  setMinimizeToTray: (minimizeToTray: boolean) => {
    set({ minimizeToTray });
    persist(get());
  },
  setDefaultShell: (defaultShell: string) => {
    set({ defaultShell });
    persist(get());
  },
  setVoiceToTerminal: (voiceToTerminal: boolean) => {
    set({ voiceToTerminal });
    persist(get());
  },
  setVoiceSilenceTimeoutMs: (ms: number) => {
    const { voiceSilenceTimeoutMin, voiceSilenceTimeoutMax } = get();
    const voiceSilenceTimeoutMs = Math.max(voiceSilenceTimeoutMin, Math.min(voiceSilenceTimeoutMax, Math.round(ms)));
    set({ voiceSilenceTimeoutMs });
    persist(get());
    voiceSetSilenceTimeout(voiceSilenceTimeoutMs).catch(console.error);
  },
  setVoiceInputDevice: (name: string) => {
    set({ voiceInputDevice: name });
    persist(get());
    voiceSetInputDevice(name).catch(console.error);
  },

  updateSettings: (patch: Partial<AppSettings>) => {
    const current = get();
    const next: AppSettings = {
      ...current,
      ...Object.fromEntries(
        Object.entries(patch).map(([k, v]) => {
          const key = k as keyof AppSettings;
          if (key === 'confirmations' || key === 'statusBarBadges') return [key, v];
          return [key, clampNumeric(key, v)];
        })
      ),
      // Deep-merge nested objects instead of replacing wholesale.
      confirmations: { ...current.confirmations, ...(patch.confirmations ?? {}) },
      statusBarBadges: { ...current.statusBarBadges, ...(patch.statusBarBadges ?? {}) },
    };

    // Keep font-size/line-height/opacity/scrollback valid w.r.t. new bounds.
    next.fontSize = Math.max(next.fontSizeMin, Math.min(next.fontSizeMax, next.fontSize));
    next.lineHeight = Math.max(next.lineHeightMin, Math.min(next.lineHeightMax, next.lineHeight));
    next.terminalOpacity = Math.max(next.terminalOpacityMin, Math.min(1, next.terminalOpacity));
    next.scrollback = Math.max(next.scrollbackMin, Math.min(next.scrollbackMax, next.scrollback));
    next.voiceSilenceTimeoutMs = Math.max(next.voiceSilenceTimeoutMin, Math.min(next.voiceSilenceTimeoutMax, next.voiceSilenceTimeoutMs));

    set(next);
    persist(next);

    // Side effects: chrome variables (theme, accent, chrome mode, or a custom
    // palette changed — customization audit C3/C2)…
    if (
      patch.themeName !== undefined ||
      patch.uiAccentColor !== undefined ||
      patch.customThemes !== undefined ||
      patch.themeMode !== undefined
    ) {
      applyChrome();
    }
    // …and Rust-pushed settings.
    if (patch.ipcBatchIntervalMs !== undefined) {
      setBatchInterval(next.ipcBatchIntervalMs).catch(console.error);
    }
    if (patch.voiceSilenceTimeoutMs !== undefined) {
      voiceSetSilenceTimeout(next.voiceSilenceTimeoutMs).catch(console.error);
    }
    if (patch.voiceInputDevice !== undefined) {
      voiceSetInputDevice(next.voiceInputDevice).catch(console.error);
    }
    // Customization audit C28/C9: push voice language/model + launch-at-login
    // to the Rust side — the setters are the only channel Rust learns from.
    if (patch.voiceLanguage !== undefined) {
      voiceSetLanguage(next.voiceLanguage).catch(console.error);
    }
    if (patch.voiceModelSize !== undefined) {
      voiceSetModelSize(next.voiceModelSize).catch(console.error);
    }
    if (patch.launchAtLogin !== undefined) {
      autostartSetEnabled(next.launchAtLogin).catch(console.error);
    }
  },

  resetSettings: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
    set({ ...defaultSettings });
    applyChrome();
    setBatchInterval(defaultSettings.ipcBatchIntervalMs).catch(console.error);
    // Audit find 3: Reset must also push voice settings back to Rust — otherwise
    // the silence timeout / mic device silently stay at their previous values.
    voiceSetSilenceTimeout(defaultSettings.voiceSilenceTimeoutMs).catch(console.error);
    voiceSetInputDevice(defaultSettings.voiceInputDevice).catch(console.error);
    // Customization audit C28/C9: reset pushes voice language/model + autostart too.
    voiceSetLanguage(defaultSettings.voiceLanguage).catch(console.error);
    voiceSetModelSize(defaultSettings.voiceModelSize).catch(console.error);
    autostartSetEnabled(defaultSettings.launchAtLogin).catch(console.error);
  },

  exportSettings: () => {
    const { fontSize, fontFamily, themeName, themeMode, scrollback, cursorBlink, cursorStyle, ipcBatchIntervalMs, fontLigatures, lineHeight, terminalOpacity, copyOnSelect, minimizeToTray, defaultShell, voiceToTerminal, voiceSilenceTimeoutMs, voiceInputDevice, maxPanes, minPaneSize, dividerSnap, snapEpsilon, doubleClickEqualize, fontSizeMin, fontSizeMax, lineHeightMin, lineHeightMax, terminalOpacityMin, scrollbackMin, scrollbackMax, voiceSilenceTimeoutMin, voiceSilenceTimeoutMax, toastMaxCount, toastDefaultDurationMs, paletteRecentsMax, autosaveIntervalMs, showSplash, hintDurationMs, workspaceNameMaxLength, paneTitleMaxLength, confirmations, uiAccentColor, animationsEnabled, uiZoom, compactMode, hideStatusBar, hideHeader, sidebarWidth, statusBarBadges, rightClickPaste, clickableLinks, linkModifier, terminalBell, scrollOnOutput, wordSeparators, pasteConfirmNewlines, terminalPadding, cursorWidth, defaultCwd, shellArgs, shellEnv, maxWebglSlots, voiceLanguage, voiceModelSize, customThemes, userCommands, macros, launchAtLogin, startMaximized, startHidden, closeToTray } = get();
    return JSON.stringify({
      fontSize, fontFamily, themeName, themeMode, scrollback, cursorBlink, cursorStyle, ipcBatchIntervalMs, fontLigatures, lineHeight, terminalOpacity, copyOnSelect, minimizeToTray, defaultShell, voiceToTerminal, voiceSilenceTimeoutMs, voiceInputDevice,
      maxPanes, minPaneSize, dividerSnap, snapEpsilon, doubleClickEqualize, fontSizeMin, fontSizeMax, lineHeightMin, lineHeightMax, terminalOpacityMin, scrollbackMin, scrollbackMax, voiceSilenceTimeoutMin, voiceSilenceTimeoutMax, toastMaxCount, toastDefaultDurationMs, paletteRecentsMax, autosaveIntervalMs, showSplash, hintDurationMs, workspaceNameMaxLength, paneTitleMaxLength, confirmations, uiAccentColor, animationsEnabled, uiZoom, compactMode, hideStatusBar, hideHeader, sidebarWidth, statusBarBadges, rightClickPaste, clickableLinks, linkModifier, terminalBell, scrollOnOutput, wordSeparators, pasteConfirmNewlines, terminalPadding, cursorWidth, defaultCwd, shellArgs, shellEnv, maxWebglSlots, voiceLanguage, voiceModelSize, customThemes, userCommands, macros, launchAtLogin, startMaximized, startHidden, closeToTray,
    }, null, 2);
  },

  importSettings: (json: string) => {
    try {
      return applyImportedSettingsObject(JSON.parse(json));
    } catch (e) {
      return false;
    }
  },

  // Customization audit C3: record the OS color-scheme preference and re-apply
  // the chrome when in 'system' mode.
  setSystemPrefersDark: (prefersDark: boolean) => {
    if (get().systemPrefersDark === prefersDark) return;
    set({ systemPrefersDark: prefersDark });
    applyChrome();
  },

  // Customization audit S1: named settings profiles (stored separately from
  // the live settings blob).
  saveSettingsProfile: (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    try {
      const profiles = readProfiles();
      profiles[trimmed] = JSON.parse(get().exportSettings());
      writeProfiles(profiles);
      return true;
    } catch (e) {
      return false;
    }
  },
  loadSettingsProfile: (name: string): boolean => {
    const profile = readProfiles()[name];
    return profile ? applyImportedSettingsObject(profile) : false;
  },
  deleteSettingsProfile: (name: string) => {
    const profiles = readProfiles();
    if (profiles[name]) {
      delete profiles[name];
      writeProfiles(profiles);
    }
  },
  listSettingsProfiles: (): string[] => Object.keys(readProfiles()),

  saveThemeAs: (name: string, base?: TerminalTheme): string => {
    const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const source = base ?? THEMES[get().themeName] ?? THEMES.vibeDark;
    const palette: TerminalTheme = { ...source, name };
    set({ customThemes: { ...get().customThemes, [id]: palette } });
    persist(get());
    return id;
  },

  duplicateTheme: (id: string): string => {
    const source = THEMES[id] ?? get().customThemes[id];
    if (!source) return '';
    return get().saveThemeAs(`${source.name} Copy`, source);
  },

  renameTheme: (id: string, name: string) => {
    const current = get().customThemes[id];
    if (!current) return;
    set({ customThemes: { ...get().customThemes, [id]: { ...current, name } } });
    persist(get());
  },

  deleteTheme: (id: string) => {
    if (!get().customThemes[id]) return;
    const customThemes = { ...get().customThemes };
    delete customThemes[id];
    // If the deleted theme was active, fall back to the default palette.
    const themeName = get().themeName === id ? defaultSettings.themeName : get().themeName;
    set({ customThemes, themeName });
    persist(get());
    applyChrome();
  },

  updateThemeColors: (id: string, patch: Partial<TerminalTheme>) => {
    const current = get().customThemes[id];
    if (!current) return;
    set({ customThemes: { ...get().customThemes, [id]: { ...current, ...patch } } });
    persist(get());
    // Live-update the terminal + UI chrome when editing the ACTIVE theme.
    if (get().themeName === id) {
      applyChrome();
    }
  },

  importTheme: (json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      const palette: unknown = parsed && typeof parsed === 'object' && 'background' in parsed ? parsed : parsed?.theme;
      if (!isThemePalette(palette)) return false;
      const name = typeof parsed?.name === 'string' && parsed.name ? parsed.name : 'Imported Theme';
      get().saveThemeAs(name, palette);
      return true;
    } catch (e) {
      return false;
    }
  },

  exportTheme: (id: string): string | null => {
    const source = THEMES[id] ?? get().customThemes[id];
    if (!source) return null;
    return JSON.stringify(source, null, 2);
  },
}));

// Apply persisted theme variables immediately on module load (before first paint)
applyChrome();
