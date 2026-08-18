import { create } from 'zustand';
import {
  WorkspaceIconConfig,
  WorkspaceWallpaperConfig,
  StatusBarWidgetConfig,
  RetroShaderConfig,
  RetroShaderPresetName,
} from '@/types/customization';
import { DEFAULT_RETRO_CONFIG, RETRO_SHADER_PRESETS } from '@/lib/retroShaderPipeline';
import { useSettingsStore, THEMES, ThemeMode } from './useSettingsStore';
import { useWorkspaceStore } from './useWorkspaceStore';

export const DEFAULT_STATUS_BAR_WIDGETS: StatusBarWidgetConfig[] = [
  { id: 'workspace_identity', enabled: true, zone: 'left', order: 0 },
  { id: 'git_branch', enabled: true, zone: 'left', order: 1 },
  { id: 'active_agents', enabled: true, zone: 'center', order: 0 },
  { id: 'token_cost_meter', enabled: true, zone: 'center', order: 1 },
  { id: 'webgl_slots', enabled: true, zone: 'right', order: 0 },
  { id: 'system_resources', enabled: true, zone: 'right', order: 1 },
  { id: 'active_ports', enabled: true, zone: 'right', order: 2 },
  { id: 'audio_vu_meter', enabled: true, zone: 'right', order: 3 },
];

export interface CustomizationStoreState {
  isOpen: boolean;
  activeSection: 'identity' | 'appearance' | 'terminal' | 'statusbar';

  // Workspace Identity & PTY Env
  workspaceName: string;
  workspaceIcon: WorkspaceIconConfig;
  workspaceWallpaper: WorkspaceWallpaperConfig;
  colorRingHex: string;
  defaultCwd: string;
  gitBranch: string;
  isGitDirty: boolean;
  envVars: Record<string, string>;

  // Retro WebGL CRT Shader
  retroShader: RetroShaderConfig;

  // Status Bar Modular Widgets
  statusBarWidgets: StatusBarWidgetConfig[];

  // Draft Terminal & Codex 3-Role Theme Studio
  themeName: string;
  themeMode: ThemeMode;
  fontFamily: string; // Code font
  uiFont: string;     // UI font
  fontSize: number;
  fontLigatures: boolean;
  lineHeight: number;
  terminalOpacity: number;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  uiAccentColor: string | null;

  // 3-Role independent colors & contrast
  themeBackground: string;
  themeSurface: string;
  themeAccent: string;
  themeInk: string;
  contrast: number; // 0.8x - 1.5x
  diffAddColor: string;
  diffRemoveColor: string;

  // Actions
  openCustomizer: (section?: 'identity' | 'appearance' | 'terminal' | 'statusbar') => void;
  closeCustomizer: () => void;
  setActiveSection: (section: 'identity' | 'appearance' | 'terminal' | 'statusbar') => void;

  setWorkspaceName: (name: string) => void;
  setWorkspaceIcon: (icon: WorkspaceIconConfig) => void;
  setColorRingHex: (hex: string) => void;
  setDefaultCwd: (cwd: string) => void;
  setGitBranch: (branch: string, isDirty?: boolean) => void;
  setEnvVars: (env: Record<string, string>) => void;

  setRetroShader: (config: Partial<RetroShaderConfig>) => void;
  applyShaderPreset: (preset: RetroShaderPresetName) => void;

  reorderWidgets: (widgets: StatusBarWidgetConfig[]) => void;
  toggleWidget: (id: string) => void;
  setWidgetZone: (id: string, zone: 'left' | 'center' | 'right') => void;

  setDraftTheme: (themeName: string) => void;
  setDraftThemeMode: (themeMode: ThemeMode) => void;
  setDraftFontFamily: (fontFamily: string) => void;
  setDraftUiFont: (uiFont: string) => void;
  setDraftFontSize: (fontSize: number) => void;
  setDraftFontLigatures: (fontLigatures: boolean) => void;
  setDraftLineHeight: (lineHeight: number) => void;
  setDraftOpacity: (terminalOpacity: number) => void;
  setDraftCursorStyle: (cursorStyle: 'block' | 'underline' | 'bar') => void;
  setDraftCursorBlink: (cursorBlink: boolean) => void;
  setDraftUiAccentColor: (color: string | null) => void;

  setDraftThemeBackground: (color: string) => void;
  setDraftThemeSurface: (color: string) => void;
  setDraftThemeAccent: (color: string) => void;
  setDraftThemeInk: (color: string) => void;
  setDraftContrast: (contrast: number) => void;
  setDraftDiffAddColor: (color: string) => void;
  setDraftDiffRemoveColor: (color: string) => void;

  exportCodexThemeJson: () => string;
  importCodexThemeJson: (rawJson: string) => boolean;
  applyCodexPreset: (presetKey: string) => void;

  syncFromCurrentState: () => void;
}

export const useCustomizationStore = create<CustomizationStoreState>((set, get) => ({
  isOpen: false,
  activeSection: 'identity',

  workspaceName: 'Default Workspace',
  workspaceIcon: { type: 'emoji', value: '⚡' },
  workspaceWallpaper: { type: 'none' },
  colorRingHex: '#3c95f0',
  defaultCwd: '',
  gitBranch: 'main',
  isGitDirty: false,
  envVars: {},

  retroShader: DEFAULT_RETRO_CONFIG,
  statusBarWidgets: DEFAULT_STATUS_BAR_WIDGETS,

  themeName: 'tokyoNight',
  themeMode: 'dark',
  fontFamily: 'JetBrains Mono, monospace',
  uiFont: 'Inter, system-ui, -apple-system, sans-serif',
  fontSize: 13,
  fontLigatures: true,
  lineHeight: 1.2,
  terminalOpacity: 0.95,
  cursorStyle: 'bar',
  cursorBlink: true,
  uiAccentColor: null,

  themeBackground: '#1a1a1e',
  themeSurface: '#232327',
  themeAccent: '#6366f1',
  themeInk: '#e8e8ea',
  contrast: 1.0,
  diffAddColor: '#3fb950',
  diffRemoveColor: '#f85149',

  openCustomizer: (section) => {
    set({
      isOpen: true,
      ...(section ? { activeSection: section } : {}),
    });
  },
  closeCustomizer: () => set({ isOpen: false }),
  setActiveSection: (activeSection) => set({ activeSection }),

  setWorkspaceName: (workspaceName) => set({ workspaceName }),
  setWorkspaceIcon: (workspaceIcon) => set({ workspaceIcon }),
  setColorRingHex: (colorRingHex) => set({ colorRingHex }),
  setDefaultCwd: (defaultCwd) => set({ defaultCwd }),
  setGitBranch: (gitBranch, isDirty = false) => set({ gitBranch, isGitDirty: isDirty }),
  setEnvVars: (envVars) => set({ envVars }),

  setRetroShader: (config) =>
    set((state) => ({ retroShader: { ...state.retroShader, ...config } })),

  applyShaderPreset: (preset) => {
    const p = RETRO_SHADER_PRESETS[preset] || DEFAULT_RETRO_CONFIG;
    set({ retroShader: { ...p } });
  },

  reorderWidgets: (statusBarWidgets) => set({ statusBarWidgets }),
  toggleWidget: (id) =>
    set((state) => ({
      statusBarWidgets: state.statusBarWidgets.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w
      ),
    })),
  setWidgetZone: (id, zone) =>
    set((state) => ({
      statusBarWidgets: state.statusBarWidgets.map((w) =>
        w.id === id ? { ...w, zone } : w
      ),
    })),

  setDraftTheme: (themeName: string) => {
    if (THEMES[themeName]) {
      const t = THEMES[themeName];
      set({
        themeName,
        themeBackground: t.background,
        themeSurface: t.black || '#232327',
        themeAccent: t.cursor || '#6366f1',
        themeInk: t.foreground || '#e8e8ea',
      });
    }
  },
  setDraftThemeMode: (themeMode: ThemeMode) => set({ themeMode }),
  setDraftFontFamily: (fontFamily: string) => set({ fontFamily }),
  setDraftUiFont: (uiFont: string) => set({ uiFont }),
  setDraftFontSize: (fontSize: number) =>
    set({ fontSize: Math.max(8, Math.min(32, fontSize)) }),
  setDraftFontLigatures: (fontLigatures: boolean) => set({ fontLigatures }),
  setDraftLineHeight: (lineHeight: number) =>
    set({ lineHeight: Math.max(0.8, Math.min(2.5, Math.round(lineHeight * 100) / 100)) }),
  setDraftOpacity: (terminalOpacity: number) =>
    set({ terminalOpacity: Math.max(0.1, Math.min(1.0, Math.round(terminalOpacity * 100) / 100)) }),
  setDraftCursorStyle: (cursorStyle: 'block' | 'underline' | 'bar') => set({ cursorStyle }),
  setDraftCursorBlink: (cursorBlink: boolean) => set({ cursorBlink }),
  setDraftUiAccentColor: (uiAccentColor: string | null) => set({ uiAccentColor }),

  setDraftThemeBackground: (themeBackground: string) => set({ themeBackground }),
  setDraftThemeSurface: (themeSurface: string) => set({ themeSurface }),
  setDraftThemeAccent: (themeAccent: string) => set({ themeAccent }),
  setDraftThemeInk: (themeInk: string) => set({ themeInk }),
  setDraftContrast: (contrast: number) =>
    set({ contrast: Math.max(0.8, Math.min(1.5, Math.round(contrast * 100) / 100)) }),
  setDraftDiffAddColor: (diffAddColor: string) => set({ diffAddColor }),
  setDraftDiffRemoveColor: (diffRemoveColor: string) => set({ diffRemoveColor }),

  exportCodexThemeJson: () => {
    const s = get();
    const themeObj = {
      version: 'codex-theme-v1' as const,
      name: s.workspaceName || 'Custom Codex Theme',
      colors: {
        background: s.themeBackground,
        surface: s.themeSurface,
        accent: s.themeAccent,
        ink: s.themeInk,
        diffAdd: s.diffAddColor,
        diffRemove: s.diffRemoveColor,
      },
      typography: {
        uiFont: s.uiFont,
        codeFont: s.fontFamily,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
      },
      appearance: {
        contrast: s.contrast,
        windowOpacity: s.terminalOpacity,
        themeMode: s.themeMode,
      },
    };
    return JSON.stringify(themeObj, null, 2);
  },

  importCodexThemeJson: (rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed || parsed.version !== 'codex-theme-v1' || !parsed.colors) {
        return false;
      }
      set({
        themeBackground: parsed.colors.background || '#1a1a1e',
        themeSurface: parsed.colors.surface || '#232327',
        themeAccent: parsed.colors.accent || '#6366f1',
        themeInk: parsed.colors.ink || '#e8e8ea',
        diffAddColor: parsed.colors.diffAdd || '#3fb950',
        diffRemoveColor: parsed.colors.diffRemove || '#f85149',
        ...(parsed.typography?.uiFont ? { uiFont: parsed.typography.uiFont } : {}),
        ...(parsed.typography?.codeFont ? { fontFamily: parsed.typography.codeFont } : {}),
        ...(typeof parsed.typography?.fontSize === 'number' ? { fontSize: parsed.typography.fontSize } : {}),
        ...(typeof parsed.typography?.lineHeight === 'number' ? { lineHeight: parsed.typography.lineHeight } : {}),
        ...(typeof parsed.appearance?.contrast === 'number' ? { contrast: parsed.appearance.contrast } : {}),
        ...(typeof parsed.appearance?.windowOpacity === 'number' ? { terminalOpacity: parsed.appearance.windowOpacity } : {}),
        ...(parsed.appearance?.themeMode ? { themeMode: parsed.appearance.themeMode } : {}),
      });
      return true;
    } catch {
      return false;
    }
  },

  applyCodexPreset: (presetKey: string) => {
    const p = CODEX_PRESETS_DATA[presetKey];
    if (!p) return;
    set({
      themeBackground: p.colors.background,
      themeSurface: p.colors.surface,
      themeAccent: p.colors.accent,
      themeInk: p.colors.ink,
      diffAddColor: p.colors.diffAdd || '#3fb950',
      diffRemoveColor: p.colors.diffRemove || '#f85149',
      uiFont: p.typography.uiFont,
      fontFamily: p.typography.codeFont,
      fontSize: p.typography.fontSize,
      lineHeight: p.typography.lineHeight || 1.2,
      contrast: p.appearance.contrast,
      terminalOpacity: p.appearance.windowOpacity,
      themeMode: p.appearance.themeMode || 'dark',
    });
  },

  syncFromCurrentState: () => {
    try {
      const s = useSettingsStore.getState();
      const wsStore = useWorkspaceStore.getState();
      const activeWs = wsStore.workspaces.find((w) => w.id === wsStore.activeWorkspaceId);

      const activeTheme = THEMES[s.themeName] || THEMES.tokyoNight;

      set({
        themeName: s.themeName,
        themeMode: s.themeMode,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontLigatures: s.fontLigatures,
        lineHeight: s.lineHeight,
        terminalOpacity: s.terminalOpacity,
        cursorStyle: s.cursorStyle,
        cursorBlink: s.cursorBlink,
        uiAccentColor: s.uiAccentColor,
        defaultCwd: s.defaultCwd || '',
        themeBackground: activeTheme?.background || '#1a1a1e',
        themeSurface: activeTheme?.black || '#232327',
        themeAccent: s.uiAccentColor || activeTheme?.cursor || '#6366f1',
        themeInk: activeTheme?.foreground || '#e8e8ea',
        ...(activeWs
          ? {
              workspaceName: activeWs.name,
              workspaceIcon: {
                type: 'emoji',
                value: activeWs.emoji || '⚡',
              },
              ...(activeWs.overrides?.themeName ? { themeName: activeWs.overrides.themeName } : {}),
              ...(activeWs.overrides?.fontSize ? { fontSize: activeWs.overrides.fontSize } : {}),
              ...(activeWs.overrides?.fontFamily ? { fontFamily: activeWs.overrides.fontFamily } : {}),
              ...(activeWs.overrides?.defaultCwd ? { defaultCwd: activeWs.overrides.defaultCwd } : {}),
              ...(activeWs.overrides?.terminalOpacity !== undefined
                ? { terminalOpacity: activeWs.overrides.terminalOpacity }
                : {}),
            }
          : {}),
      });
    } catch {
      // safe fallback
    }
  },
}));

const CODEX_PRESETS_DATA: Record<string, {
  colors: { background: string; surface: string; accent: string; ink: string; diffAdd?: string; diffRemove?: string };
  typography: { uiFont: string; codeFont: string; fontSize: number; lineHeight?: number };
  appearance: { contrast: number; windowOpacity: number; themeMode?: ThemeMode };
}> = {
  codexDark: {
    colors: { background: '#1a1a1e', surface: '#232327', accent: '#6366f1', ink: '#e8e8ea', diffAdd: '#3fb950', diffRemove: '#f85149' },
    typography: { uiFont: 'Inter, system-ui, sans-serif', codeFont: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.2 },
    appearance: { contrast: 1.0, windowOpacity: 0.95, themeMode: 'dark' },
  },
  catppuccinMocha: {
    colors: { background: '#1e1e2e', surface: '#252538', accent: '#cba6f7', ink: '#cdd6f4', diffAdd: '#a6e3a1', diffRemove: '#f38ba8' },
    typography: { uiFont: 'Inter, system-ui, sans-serif', codeFont: 'Fira Code, monospace', fontSize: 13, lineHeight: 1.2 },
    appearance: { contrast: 1.0, windowOpacity: 0.95, themeMode: 'dark' },
  },
  monokaiPro: {
    colors: { background: '#2d2a2e', surface: '#363337', accent: '#ffd866', ink: '#fcfcfa', diffAdd: '#a9dc76', diffRemove: '#ff6188' },
    typography: { uiFont: 'Inter, system-ui, sans-serif', codeFont: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.2 },
    appearance: { contrast: 1.0, windowOpacity: 0.95, themeMode: 'dark' },
  },
  solarizedDark: {
    colors: { background: '#002b36', surface: '#073642', accent: '#268bd2', ink: '#839496', diffAdd: '#859900', diffRemove: '#dc322f' },
    typography: { uiFont: 'Inter, system-ui, sans-serif', codeFont: 'Source Code Pro, monospace', fontSize: 13, lineHeight: 1.25 },
    appearance: { contrast: 1.05, windowOpacity: 0.95, themeMode: 'dark' },
  },
  solarizedLight: {
    colors: { background: '#fdf6e3', surface: '#eee8d5', accent: '#268bd2', ink: '#657b83', diffAdd: '#859900', diffRemove: '#dc322f' },
    typography: { uiFont: 'Inter, system-ui, sans-serif', codeFont: 'Source Code Pro, monospace', fontSize: 13, lineHeight: 1.25 },
    appearance: { contrast: 1.05, windowOpacity: 0.98, themeMode: 'light' },
  },
  tokyoNight: {
    colors: { background: '#1a1b26', surface: '#24283b', accent: '#7aa2f7', ink: '#c0caf5', diffAdd: '#9ece6a', diffRemove: '#f7768e' },
    typography: { uiFont: 'Inter, system-ui, sans-serif', codeFont: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.2 },
    appearance: { contrast: 1.0, windowOpacity: 0.95, themeMode: 'dark' },
  },
  githubDark: {
    colors: { background: '#0d1117', surface: '#161b22', accent: '#58a6ff', ink: '#c9d1d9', diffAdd: '#3fb950', diffRemove: '#ff7b72' },
    typography: { uiFont: 'Inter, system-ui, sans-serif', codeFont: 'SF Mono, monospace', fontSize: 13, lineHeight: 1.2 },
    appearance: { contrast: 1.0, windowOpacity: 0.95, themeMode: 'dark' },
  },
  oneDarkPro: {
    colors: { background: '#282c34', surface: '#2c313a', accent: '#61afef', ink: '#abb2bf', diffAdd: '#98c379', diffRemove: '#e06c75' },
    typography: { uiFont: 'Inter, system-ui, sans-serif', codeFont: 'Fira Code, monospace', fontSize: 13, lineHeight: 1.2 },
    appearance: { contrast: 1.0, windowOpacity: 0.95, themeMode: 'dark' },
  },
};
