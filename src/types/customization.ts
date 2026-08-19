export type IconSourceType = 'emoji' | 'lucide' | 'svg' | 'brand';

export interface WorkspaceIconConfig {
  type: IconSourceType;
  value: string;
  customSvg?: string;
  brandId?: string;
}


export interface RetroShaderConfig {
  enabled: boolean;
  curvature: number;         // 0.0 to 0.3
  scanlineIntensity: number; // 0.0 to 1.0
  scanlineCount: number;     // 300 to 800
  bloomIntensity: number;    // 0.0 to 1.0
  chromaticOffset: number;   // 0.0 to 0.015
  vignetteDarkness: number;  // 0.0 to 1.0
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
