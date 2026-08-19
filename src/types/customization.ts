export type IconSourceType = 'emoji' | 'lucide' | 'svg' | 'brand';

export interface WorkspaceIconConfig {
  type: IconSourceType;
  value: string;
  customSvg?: string;
  brandId?: string;
}

export interface RetroShaderConfig {
  enabled: boolean;
  curvature: number;
  scanlineIntensity: number;
  scanlineCount: number;
  bloomIntensity: number;
  chromaticOffset: number;
  vignetteDarkness: number;
}

export type RetroShaderPresetName = 'default' | 'cyberpunk' | 'matrix' | 'arcade' | 'subtle' | 'off';

export interface WCAGContrastResult {
  ratio: number;
  formattedRatio: string;
  rating: 'AAA' | 'AA' | 'AA-large' | 'Fail';
  isAccessible: boolean;
  label: string;
}

export interface CodexThemeV1 {
  version: 'codex-theme-v1';
  name: string;
  colors: {
    background: string;
    surface: string;
    accent: string;
    ink: string;
    diffAdd?: string;
    diffRemove?: string;
  };
  typography: {
    uiFont: string;
    codeFont: string;
    fontSize: number;
    lineHeight?: number;
  };
  appearance: {
    contrast: number;
    windowOpacity: number;
    themeMode?: 'dark' | 'light' | 'system';
  };
}
