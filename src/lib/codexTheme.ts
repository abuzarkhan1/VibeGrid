import { CodexThemeV1 } from '@/types/customization';

export const CODEX_PRESETS: Record<string, CodexThemeV1> = {
  codexDark: {
    version: 'codex-theme-v1',
    name: 'Codex Dark (Standard)',
    colors: {
      background: '#1a1a1e',
      surface: '#232327',
      accent: '#6366f1',
      ink: '#e8e8ea',
      diffAdd: '#3fb950',
      diffRemove: '#f85149',
    },
    typography: {
      uiFont: 'Inter, system-ui, -apple-system, sans-serif',
      codeFont: 'JetBrains Mono, monospace',
      fontSize: 13,
      lineHeight: 1.2,
    },
    appearance: {
      contrast: 1.0,
      windowOpacity: 0.95,
      themeMode: 'dark',
    },
  },
  catppuccinMocha: {
    version: 'codex-theme-v1',
    name: 'Catppuccin Mocha',
    colors: {
      background: '#1e1e2e',
      surface: '#252538',
      accent: '#cba6f7',
      ink: '#cdd6f4',
      diffAdd: '#a6e3a1',
      diffRemove: '#f38ba8',
    },
    typography: {
      uiFont: 'Inter, system-ui, sans-serif',
      codeFont: 'Fira Code, monospace',
      fontSize: 13,
      lineHeight: 1.2,
    },
    appearance: {
      contrast: 1.0,
      windowOpacity: 0.95,
      themeMode: 'dark',
    },
  },
  monokaiPro: {
    version: 'codex-theme-v1',
    name: 'Monokai Pro',
    colors: {
      background: '#2d2a2e',
      surface: '#363337',
      accent: '#ffd866',
      ink: '#fcfcfa',
      diffAdd: '#a9dc76',
      diffRemove: '#ff6188',
    },
    typography: {
      uiFont: 'Inter, system-ui, sans-serif',
      codeFont: 'JetBrains Mono, monospace',
      fontSize: 13,
      lineHeight: 1.2,
    },
    appearance: {
      contrast: 1.0,
      windowOpacity: 0.95,
      themeMode: 'dark',
    },
  },
  solarizedDark: {
    version: 'codex-theme-v1',
    name: 'Solarized Dark',
    colors: {
      background: '#002b36',
      surface: '#073642',
      accent: '#268bd2',
      ink: '#839496',
      diffAdd: '#859900',
      diffRemove: '#dc322f',
    },
    typography: {
      uiFont: 'Inter, system-ui, sans-serif',
      codeFont: 'Source Code Pro, monospace',
      fontSize: 13,
      lineHeight: 1.25,
    },
    appearance: {
      contrast: 1.05,
      windowOpacity: 0.95,
      themeMode: 'dark',
    },
  },
  solarizedLight: {
    version: 'codex-theme-v1',
    name: 'Solarized Light',
    colors: {
      background: '#fdf6e3',
      surface: '#eee8d5',
      accent: '#268bd2',
      ink: '#657b83',
      diffAdd: '#859900',
      diffRemove: '#dc322f',
    },
    typography: {
      uiFont: 'Inter, system-ui, sans-serif',
      codeFont: 'Source Code Pro, monospace',
      fontSize: 13,
      lineHeight: 1.25,
    },
    appearance: {
      contrast: 1.05,
      windowOpacity: 0.98,
      themeMode: 'light',
    },
  },
  tokyoNight: {
    version: 'codex-theme-v1',
    name: 'Tokyo Night',
    colors: {
      background: '#1a1b26',
      surface: '#24283b',
      accent: '#7aa2f7',
      ink: '#c0caf5',
      diffAdd: '#9ece6a',
      diffRemove: '#f7768e',
    },
    typography: {
      uiFont: 'Inter, system-ui, sans-serif',
      codeFont: 'JetBrains Mono, monospace',
      fontSize: 13,
      lineHeight: 1.2,
    },
    appearance: {
      contrast: 1.0,
      windowOpacity: 0.95,
      themeMode: 'dark',
    },
  },
  githubDark: {
    version: 'codex-theme-v1',
    name: 'GitHub Dark',
    colors: {
      background: '#0d1117',
      surface: '#161b22',
      accent: '#58a6ff',
      ink: '#c9d1d9',
      diffAdd: '#3fb950',
      diffRemove: '#ff7b72',
    },
    typography: {
      uiFont: 'Inter, system-ui, sans-serif',
      codeFont: 'SF Mono, monospace',
      fontSize: 13,
      lineHeight: 1.2,
    },
    appearance: {
      contrast: 1.0,
      windowOpacity: 0.95,
      themeMode: 'dark',
    },
  },
  oneDarkPro: {
    version: 'codex-theme-v1',
    name: 'One Dark Pro',
    colors: {
      background: '#282c34',
      surface: '#2c313a',
      accent: '#61afef',
      ink: '#abb2bf',
      diffAdd: '#98c379',
      diffRemove: '#e06c75',
    },
    typography: {
      uiFont: 'Inter, system-ui, sans-serif',
      codeFont: 'Fira Code, monospace',
      fontSize: 13,
      lineHeight: 1.2,
    },
    appearance: {
      contrast: 1.0,
      windowOpacity: 0.95,
      themeMode: 'dark',
    },
  },
};

/**
 * Validates and parses a JSON string into a structured CodexThemeV1 object.
 */
export function parseCodexThemeV1(
  rawJson: string
): { success: true; data: CodexThemeV1 } | { success: false; error: string } {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid JSON payload. Expected an object.' };
    }

    if (parsed.version !== 'codex-theme-v1') {
      return {
        success: false,
        error: `Unsupported theme version "${parsed.version}". Expected "codex-theme-v1".`,
      };
    }

    if (!parsed.colors || typeof parsed.colors !== 'object') {
      return { success: false, error: 'Missing "colors" object in theme definition.' };
    }

    const { background, surface, accent, ink } = parsed.colors;
    if (!background || !surface || !accent || !ink) {
      return {
        success: false,
        error: 'Colors must specify background, surface, accent, and ink.',
      };
    }

    const typography = parsed.typography || {};
    const appearance = parsed.appearance || {};

    const normalized: CodexThemeV1 = {
      version: 'codex-theme-v1',
      name: typeof parsed.name === 'string' ? parsed.name : 'Imported Codex Theme',
      colors: {
        background: String(background),
        surface: String(surface),
        accent: String(accent),
        ink: String(ink),
        diffAdd: parsed.colors.diffAdd ? String(parsed.colors.diffAdd) : '#3fb950',
        diffRemove: parsed.colors.diffRemove ? String(parsed.colors.diffRemove) : '#f85149',
      },
      typography: {
        uiFont: typography.uiFont || 'Inter, system-ui, sans-serif',
        codeFont: typography.codeFont || 'JetBrains Mono, monospace',
        fontSize: typeof typography.fontSize === 'number' ? typography.fontSize : 13,
        lineHeight: typeof typography.lineHeight === 'number' ? typography.lineHeight : 1.2,
      },
      appearance: {
        contrast: typeof appearance.contrast === 'number' ? Math.max(0.8, Math.min(1.5, appearance.contrast)) : 1.0,
        windowOpacity: typeof appearance.windowOpacity === 'number' ? Math.max(0.1, Math.min(1.0, appearance.windowOpacity)) : 0.95,
        themeMode: appearance.themeMode === 'light' || appearance.themeMode === 'system' ? appearance.themeMode : 'dark',
      },
    };

    return { success: true, data: normalized };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'JSON parse failure';
    return { success: false, error: `Invalid JSON syntax: ${msg}` };
  }
}
