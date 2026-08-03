import { create } from 'zustand';
import { TerminalTheme } from '@/types/terminal';

export const THEMES: Record<string, TerminalTheme> = {
  vibeDark: {
    name: 'VibeDark',
    background: '#0a0b0d',
    foreground: '#e2e8f0',
    cursor: '#54a967',
    cursorAccent: '#0a0b0d',
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
  vibeLight: {
    name: 'VibeLight',
    background: '#f8fafc',
    foreground: '#0f172a',
    cursor: '#4f46e5',
    cursorAccent: '#ffffff',
    selectionBackground: 'rgba(79, 70, 229, 0.2)',
    black: '#0f172a',
    red: '#e11d48',
    green: '#059669',
    yellow: '#d97706',
    blue: '#2563eb',
    magenta: '#9333ea',
    cyan: '#0891b2',
    white: '#cbd5e1',
    brightBlack: '#64748b',
    brightRed: '#f43f5e',
    brightGreen: '#10b981',
    brightYellow: '#f59e0b',
    brightBlue: '#3b82f6',
    brightMagenta: '#a855f7',
    brightCyan: '#06b6d4',
    brightWhite: '#f1f5f9',
  },
  midnightBlue: {
    name: 'Midnight Blue',
    background: '#0a1128',
    foreground: '#d4e0ff',
    cursor: '#3a86ff',
    selectionBackground: 'rgba(58, 134, 255, 0.35)',
    black: '#03081e',
    red: '#ff0054',
    green: '#38b000',
    yellow: '#ffb703',
    blue: '#3a86ff',
    magenta: '#8338ec',
    cyan: '#00b4d8',
    white: '#d4e0ff',
    brightBlack: '#1c2d5a',
    brightRed: '#ff5400',
    brightGreen: '#70e000',
    brightYellow: '#ffd000',
    brightBlue: '#4895ef',
    brightMagenta: '#9d4edd',
    brightCyan: '#48cae4',
    brightWhite: '#ffffff',
  },
  dracula: {
    name: 'Dracula',
    background: '#282a36',
    foreground: '#f8f8f2',
    cursor: '#50fa7b',
    selectionBackground: '#44475a',
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#6272a4',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff',
  },
  solarizedDark: {
    name: 'Solarized Dark',
    background: '#002b36',
    foreground: '#839496',
    cursor: '#93a1a1',
    selectionBackground: '#073642',
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
  solarizedLight: {
    name: 'Solarized Light',
    background: '#fdf6e3',
    foreground: '#657b83',
    cursor: '#586e75',
    selectionBackground: '#eee8d5',
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
  nord: {
    name: 'Nord',
    background: '#2e3440',
    foreground: '#d8dee9',
    cursor: '#88c0d0',
    selectionBackground: '#434c5e',
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
};

export type CursorStyle = 'block' | 'underline' | 'bar';

interface SettingsState {
  fontSize: number;
  fontFamily: string;
  themeName: string;
  scrollback: number;
  cursorBlink: boolean;
  cursorStyle: CursorStyle;

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
}

function applyThemeVariables(themeKey: string) {
  const theme = THEMES[themeKey] || THEMES.vibeDark;
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--color-bg', theme.background);
    root.style.setProperty('--color-surface', theme.black);
    root.style.setProperty('--color-accent', theme.cursor);
    root.style.setProperty('--color-fg', theme.foreground);
  }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  fontSize: 14,
  fontFamily: 'JetBrains Mono, monospace',
  themeName: 'vibeDark',
  scrollback: 5000,
  cursorBlink: true,
  cursorStyle: 'block',

  setFontSize: (size: number) => set({ fontSize: Math.max(8, Math.min(32, size)) }),
  setFontFamily: (family: string) => set({ fontFamily: family }),
  increaseFontSize: () => set((state) => ({ fontSize: Math.min(32, state.fontSize + 1) })),
  decreaseFontSize: () => set((state) => ({ fontSize: Math.max(8, state.fontSize - 1) })),
  resetFontSize: () => set({ fontSize: 14 }),
  setThemeName: (name: string) => {
    applyThemeVariables(name);
    set({ themeName: name });
  },
  setScrollback: (lines: number) => set({ scrollback: Math.max(100, Math.min(100000, lines)) }),
  setCursorBlink: (blink: boolean) => set({ cursorBlink: blink }),
  setCursorStyle: (style: CursorStyle) => set({ cursorStyle: style }),
}));
