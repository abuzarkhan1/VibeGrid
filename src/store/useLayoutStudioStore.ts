import { create } from 'zustand';
import { RatioPreset, GutterPreset, RadiusPreset, LayoutPresetDefinition } from '@/types/layoutStudio';
import {
  generateSolo,
  generate2Pane,
  generate3PaneTSplitTop,
  generate3PaneTSplitBottom,
  generate3Columns,
  generate3Rows,
  generate4PaneQuad,
  generate4PaneMasterDetail,
  generate4Columns,
  generate6PaneMatrix,
  generate6Command,
  generate8Fleet,
  generate8Satellite,
  generate9Hivemind,
  generate16GodMode,
  generateCustomMatrix,
} from '@/lib/layoutGenerators';
import { PaneNode } from '@/types/layout';

export const PRESET_GALLERY: LayoutPresetDefinition[] = [
  {
    id: 'solo',
    name: '1-Pane Solo',
    category: 'solo',
    shortcutKey: '1',
    description: 'Single full-bleed distraction-free terminal',
    paneCount: 1,
    tags: ['Solo', 'Focus', 'Minimal'],
    recommendedRatio: 'equal',
    generator: () => generateSolo(),
  },
  {
    id: '2-horizontal',
    name: '2-Pane Horizontal (2H)',
    category: 'duo',
    shortcutKey: '2',
    description: 'Classic side-by-side split for coding & tests',
    paneCount: 2,
    tags: ['2H', 'Editor', 'Runner'],
    recommendedRatio: 'equal',
    generator: (r) => generate2Pane('horizontal', r || 0.5),
  },
  {
    id: '2-vertical',
    name: '2-Pane Vertical (2V)',
    category: 'duo',
    shortcutKey: 'Alt+2',
    description: 'Top/bottom horizontal split for long log streams',
    paneCount: 2,
    tags: ['2V', 'Logs', 'Server'],
    recommendedRatio: 'equal',
    generator: (r) => generate2Pane('vertical', r || 0.5),
  },
  {
    id: '3-t-top',
    name: '3-Pane T-Split Top',
    category: 'trio',
    shortcutKey: '3',
    description: 'Wide master pane above two worker sidecars',
    paneCount: 3,
    tags: ['Supervisor', 'Multi-Agent', 'T-Top'],
    recommendedRatio: 'golden',
    generator: (r) => generate3PaneTSplitTop(r || 0.55),
  },
  {
    id: '3-t-bottom',
    name: '3-Pane T-Split Bottom',
    category: 'trio',
    shortcutKey: 'Alt+3',
    description: 'Dual work panes on top + full-width telemetry below',
    paneCount: 3,
    tags: ['DevOps', 'Telemetry', 'T-Bottom'],
    recommendedRatio: 'golden',
    generator: (r) => generate3PaneTSplitBottom(r || 0.45),
  },
  {
    id: '3-columns',
    name: '3-Columns',
    category: 'trio',
    shortcutKey: 'Ctrl+3',
    description: 'Three parallel vertical columns for tri-stream auditing',
    paneCount: 3,
    tags: ['Columns', 'Tiling', 'Review'],
    recommendedRatio: 'equal',
    generator: () => generate3Columns(),
  },
  {
    id: '3-rows',
    name: '3-Rows',
    category: 'trio',
    shortcutKey: 'Alt+R',
    description: 'Three stacked horizontal rows for synchronized log tails',
    paneCount: 3,
    tags: ['Rows', 'Stack', 'Streams'],
    recommendedRatio: 'equal',
    generator: () => generate3Rows(),
  },
  {
    id: '4-quad',
    name: '4-Quad 2×2',
    category: 'quad',
    shortcutKey: '4',
    description: 'Balanced four-quadrant workstation matrix',
    paneCount: 4,
    tags: ['Quad', '2x2', 'Swarm'],
    recommendedRatio: 'equal',
    generator: () => generate4PaneQuad(),
  },
  {
    id: '4-master-detail',
    name: '4-Master Detail 1+3',
    category: 'quad',
    shortcutKey: 'Alt+4',
    description: 'Primary orchestrator flanked by a 3-agent vertical stack',
    paneCount: 4,
    tags: ['IDE Style', 'Hierarchy', '1+3'],
    recommendedRatio: 'hero-sidebar',
    generator: (r) => generate4PaneMasterDetail(r || 0.65),
  },
  {
    id: '4-columns',
    name: '4-Columns',
    category: 'quad',
    shortcutKey: 'Ctrl+4',
    description: 'Four vertical strip columns for parallel service streams',
    paneCount: 4,
    tags: ['Columns', '4-Pillars', 'Services'],
    recommendedRatio: 'equal',
    generator: () => generate4Columns(),
  },
  {
    id: '6-matrix',
    name: '6-Matrix 2×3',
    category: 'hexa',
    shortcutKey: '6',
    description: '6 equal panes arranged in 2 rows of 3 columns',
    paneCount: 6,
    tags: ['Matrix', '2x3', 'Cluster'],
    recommendedRatio: 'equal',
    generator: () => generate6PaneMatrix(),
  },
  {
    id: '6-command',
    name: '6-Command 1+5',
    category: 'hexa',
    shortcutKey: 'Alt+6',
    description: '1 Large Lead Orchestrator + 5 Satellite Agent cockpits',
    paneCount: 6,
    tags: ['Command', '1+5', 'Cockpit'],
    recommendedRatio: 'hero-sidebar',
    generator: (r) => generate6Command(r || 0.55),
  },
  {
    id: '8-fleet',
    name: '8-Fleet 2×4',
    category: 'octa',
    shortcutKey: '8',
    description: '8-terminal high-density fleet matrix for microservices',
    paneCount: 8,
    tags: ['Fleet', '2x4', 'Microservices'],
    recommendedRatio: 'equal',
    generator: () => generate8Fleet(),
  },
  {
    id: '8-satellite',
    name: '8-Satellite 2+6',
    category: 'octa',
    shortcutKey: 'Alt+8',
    description: '2 Lead Master panes + 6 Satellite worker sub-agents',
    paneCount: 8,
    tags: ['Satellite', '2+6', 'Swarm'],
    recommendedRatio: 'equal',
    generator: (r) => generate8Satellite(r || 0.5),
  },
  {
    id: '9-hivemind',
    name: '9-Hivemind 3×3',
    category: 'matrix',
    shortcutKey: '9',
    description: '9-pane symmetric command grid for massive agent pods',
    paneCount: 9,
    tags: ['Hivemind', '3x3', 'Grid'],
    recommendedRatio: 'equal',
    generator: () => generate9Hivemind(),
  },
  {
    id: '16-godmode',
    name: '16-GodMode 4×4',
    category: 'matrix',
    shortcutKey: '0',
    description: '16 GPU-accelerated terminals for maximum agent concurrency',
    paneCount: 16,
    tags: ['GodMode', '4x4', 'Wall of Code'],
    recommendedRatio: 'equal',
    generator: () => generate16GodMode(),
  },
];

interface LayoutStudioStore {
  isOpen: boolean;
  activeTab: 'presets' | 'custom';
  selectedPresetId: string;
  customRows: number;
  customCols: number;
  ratioMode: RatioPreset;
  customRatioValue: number;
  gutterWidth: GutterPreset;
  cornerRadius: RadiusPreset;
  terminalPadding: number;
  autoLaunchAgents: boolean;

  // Actions
  openStudio: (presetId?: string) => void;
  closeStudio: () => void;
  setActiveTab: (tab: 'presets' | 'custom') => void;
  selectPreset: (id: string) => void;
  setCustomGrid: (rows: number, cols: number) => void;
  setRatioMode: (mode: RatioPreset, customVal?: number) => void;
  setGutterWidth: (w: GutterPreset) => void;
  setCornerRadius: (r: RadiusPreset) => void;
  setTerminalPadding: (p: number) => void;
  toggleAutoLaunchAgents: () => void;
  buildActiveLayout: () => PaneNode;
}

export const useLayoutStudioStore = create<LayoutStudioStore>((set, get) => ({
  isOpen: false,
  activeTab: 'presets',
  selectedPresetId: '4-quad',
  customRows: 2,
  customCols: 2,
  ratioMode: 'equal',
  customRatioValue: 0.5,
  gutterWidth: 4,
  cornerRadius: 8,
  terminalPadding: 4,
  autoLaunchAgents: true,

  openStudio: (presetId) =>
    set({ isOpen: true, ...(presetId ? { selectedPresetId: presetId } : {}) }),
  closeStudio: () => set({ isOpen: false }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setCustomGrid: (customRows, customCols) =>
    set({ customRows, customCols, activeTab: 'custom' }),
  selectPreset: (selectedPresetId) => {
    const preset = PRESET_GALLERY.find((p) => p.id === selectedPresetId);
    const ratioMode: RatioPreset = preset?.recommendedRatio || 'equal';
    const customRatioValue =
      ratioMode === 'golden' ? 0.618 : ratioMode === 'hero-sidebar' ? 0.7 : 0.5;
    set({
      selectedPresetId,
      activeTab: 'presets',
      ratioMode,
      customRatioValue,
    });
  },
  setRatioMode: (ratioMode, customVal) =>
    set(() => ({
      ratioMode,
      customRatioValue:
        customVal !== undefined
          ? customVal
          : ratioMode === 'golden'
          ? 0.618
          : ratioMode === 'hero-sidebar'
          ? 0.7
          : 0.5,
    })),
  setGutterWidth: (gutterWidth) => set({ gutterWidth }),
  setCornerRadius: (cornerRadius) => set({ cornerRadius }),
  setTerminalPadding: (terminalPadding) => set({ terminalPadding }),
  toggleAutoLaunchAgents: () =>
    set((s) => ({ autoLaunchAgents: !s.autoLaunchAgents })),

  buildActiveLayout: () => {
    const {
      activeTab,
      selectedPresetId,
      customRows,
      customCols,
      customRatioValue,
    } = get();
    if (activeTab === 'custom') {
      return generateCustomMatrix(customRows, customCols);
    }
    const preset =
      PRESET_GALLERY.find((p) => p.id === selectedPresetId) || PRESET_GALLERY[0];
    return preset.generator(customRatioValue);
  },
}));
