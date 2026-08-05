import { create } from 'zustand';
import { setBatchInterval, voiceSetSilenceTimeout, voiceSetInputDevice } from '@/lib/tauri';
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
    background: '#0b0d12',
    foreground: '#e2e8f0',
    cursor: '#54a967',
    cursorAccent: '#0b0d12',
    selectionBackground: 'rgba(84, 169, 103, 0.3)',
    black: '#0d0f12',
    red: '#f43f5e',
    green: '#54a967',
    yellow: '#f59e0b',
    blue: '#3b82f6',
    magenta: '#a855f7',
    cyan: '#06b6d4',
    white: '#e2e8f0',
    brightBlack: '#475569',
    brightRed: '#fb7185',
    brightGreen: '#6ec782',
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
};

export type CursorStyle = 'block' | 'underline' | 'bar';

const STORAGE_KEY = 'vibegrid_settings_v1';

interface AppSettings {
  fontSize: number;
  fontFamily: string;
  themeName: string;
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
}

const defaultSettings: AppSettings = {
  fontSize: 14,
  fontFamily: 'JetBrains Mono, monospace',
  themeName: 'vibeDark',
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
};

/**
 * Coerce a persisted/imported theme key to a value that actually exists in
 * THEMES. Unknown keys (e.g. a theme removed in a newer build, or a hand-edited
 * settings file) fall back to the default instead of leaving `themeName`
 * pointing at a theme whose palette is undefined everywhere.
 */
function resolveThemeKey(key: string): string {
  return key in THEMES ? key : defaultSettings.themeName;
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed, themeName: resolveThemeKey(parsed.themeName) };
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

function applyThemeVariables(themeKey: string) {
  const theme = THEMES[themeKey] || THEMES.vibeDark;
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--color-bg', theme.background);
    root.style.setProperty('--color-surface', theme.black);
    // Rough heuristic for a surface-hover (we just use a slightly different terminal color)
    root.style.setProperty('--color-surface-hover', theme.brightBlack);
    root.style.setProperty('--color-accent', theme.cursor);
    root.style.setProperty('--color-fg', theme.foreground);
    root.style.setProperty('--color-selection', theme.selectionBackground);
  }
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
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (json: string) => boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadSettings(),

  setFontSize: (size: number) => {
    const fontSize = Math.max(8, Math.min(32, Math.round(size)));
    set({ fontSize });
    persist(get());
  },
  setFontFamily: (family: string) => {
    set({ fontFamily: family });
    persist(get());
  },
  increaseFontSize: () => {
    // UX audit P2 #21: surface when the font hits its limit instead of
    // silently doing nothing (deduped toast — the same toast replaces itself).
    if (get().fontSize >= 32) {
      addToastLazy({ type: 'info', title: 'Maximum font size reached', description: 'Terminal font is capped at 32px.' });
      return;
    }
    const fontSize = Math.min(32, get().fontSize + 1);
    set({ fontSize });
    persist(get());
  },
  decreaseFontSize: () => {
    if (get().fontSize <= 8) {
      addToastLazy({ type: 'info', title: 'Minimum font size reached', description: 'Terminal font is capped at 8px.' });
      return;
    }
    const fontSize = Math.max(8, get().fontSize - 1);
    set({ fontSize });
    persist(get());
  },
  resetFontSize: () => {
    set({ fontSize: defaultSettings.fontSize });
    persist(get());
  },
  setThemeName: (name: string) => {
    const resolved = resolveThemeKey(name);
    applyThemeVariables(resolved);
    set({ themeName: resolved });
    persist(get());
  },
  setScrollback: (lines: number) => {
    const scrollback = Math.max(100, Math.min(100000, lines));
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
    const clamped = Math.max(1, Math.min(2, Math.round(lineHeight * 100) / 100));
    set({ lineHeight: clamped });
    persist(get());
  },
  setTerminalOpacity: (terminalOpacity: number) => {
    const clamped = Math.max(0.6, Math.min(1, Math.round(terminalOpacity * 100) / 100));
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
    const voiceSilenceTimeoutMs = Math.max(600, Math.min(5000, Math.round(ms)));
    set({ voiceSilenceTimeoutMs });
    persist(get());
    voiceSetSilenceTimeout(voiceSilenceTimeoutMs).catch(console.error);
  },
  setVoiceInputDevice: (name: string) => {
    set({ voiceInputDevice: name });
    persist(get());
    voiceSetInputDevice(name).catch(console.error);
  },

  resetSettings: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
    applyThemeVariables(defaultSettings.themeName);
    set({ ...defaultSettings });
    setBatchInterval(defaultSettings.ipcBatchIntervalMs).catch(console.error);
    // Audit find 3: Reset must also push voice settings back to Rust — otherwise
    // the silence timeout / mic device silently stay at their previous values.
    voiceSetSilenceTimeout(defaultSettings.voiceSilenceTimeoutMs).catch(console.error);
    voiceSetInputDevice(defaultSettings.voiceInputDevice).catch(console.error);
  },

  exportSettings: () => {
    const { fontSize, fontFamily, themeName, scrollback, cursorBlink, cursorStyle, ipcBatchIntervalMs, fontLigatures, lineHeight, terminalOpacity, copyOnSelect, minimizeToTray, defaultShell, voiceToTerminal, voiceSilenceTimeoutMs, voiceInputDevice } = get();
    return JSON.stringify({ fontSize, fontFamily, themeName, scrollback, cursorBlink, cursorStyle, ipcBatchIntervalMs, fontLigatures, lineHeight, terminalOpacity, copyOnSelect, minimizeToTray, defaultShell, voiceToTerminal, voiceSilenceTimeoutMs, voiceInputDevice }, null, 2);
  },

  importSettings: (json: string) => {
    try {
      const parsed = JSON.parse(json);
      const next: AppSettings = {
        ...defaultSettings,
        ...Object.fromEntries(Object.entries(parsed).filter(([key]) => key in defaultSettings)),
      };
      next.copyOnSelect = typeof next.copyOnSelect === 'boolean' ? next.copyOnSelect : defaultSettings.copyOnSelect;
      // Audit fix: never import an invalid theme key — fall back to the default.
      next.themeName = resolveThemeKey(next.themeName);
      applyThemeVariables(next.themeName);
      set(next);
      persist(next);
      setBatchInterval(next.ipcBatchIntervalMs).catch(console.error);
      // Audit find 3: importing a settings file must re-apply the voice settings
      // on the Rust side too — the setters are the only channel Rust learns from.
      voiceSetSilenceTimeout(next.voiceSilenceTimeoutMs).catch(console.error);
      voiceSetInputDevice(next.voiceInputDevice).catch(console.error);
      return true;
    } catch (e) {
      return false;
    }
  },
}));

// Apply persisted theme variables immediately on module load (before first paint)
applyThemeVariables(useSettingsStore.getState().themeName);
