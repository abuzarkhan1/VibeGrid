import { PaneNode } from './layout';

export type RatioPreset = 'equal' | 'golden' | 'hero-sidebar' | 'tri-split' | 'custom';
export type GutterPreset = 0 | 2 | 4 | 8;
export type RadiusPreset = 0 | 4 | 8 | 12 | 16;

export interface LayoutPresetDefinition {
  id: string;
  name: string;
  category: 'solo' | 'duo' | 'trio' | 'quad' | 'hexa' | 'octa' | 'matrix';
  shortcutKey: string;
  description: string;
  paneCount: number;
  tags: string[];
  recommendedRatio: RatioPreset;
  generator: (ratio?: number) => PaneNode;
}

