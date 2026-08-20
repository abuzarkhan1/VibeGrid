import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStudioStore, PRESET_GALLERY } from './useLayoutStudioStore';
import { PaneNode } from '@/types/layout';

function countTerminals(node: PaneNode): number {
  if (node.type === 'terminal') return 1;
  return countTerminals(node.children[0]) + countTerminals(node.children[1]);
}

describe('useLayoutStudioStore', () => {
  beforeEach(() => {
    useLayoutStudioStore.setState({
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
    });
  });

  it('contains all 16 visual presets in PRESET_GALLERY', () => {
    expect(PRESET_GALLERY.length).toBe(16);

    const expectedPresetIds = [
      'solo',
      '2-horizontal',
      '2-vertical',
      '3-t-top',
      '3-t-bottom',
      '3-columns',
      '3-rows',
      '4-quad',
      '4-master-detail',
      '4-columns',
      '6-matrix',
      '6-command',
      '8-fleet',
      '8-satellite',
      '9-hivemind',
      '16-godmode',
    ];

    expectedPresetIds.forEach((id) => {
      const found = PRESET_GALLERY.find((p) => p.id === id);
      expect(found).toBeDefined();
      expect(found?.paneCount).toBeGreaterThan(0);
      const tree = found?.generator();
      expect(tree).toBeDefined();
      if (tree && found) {
        expect(countTerminals(tree)).toBe(found.paneCount);
      }
    });
  });

  it('manages open/close studio lifecycle', () => {
    const store = useLayoutStudioStore.getState();
    expect(store.isOpen).toBe(false);

    store.openStudio('6-command');
    expect(useLayoutStudioStore.getState().isOpen).toBe(true);
    expect(useLayoutStudioStore.getState().selectedPresetId).toBe('6-command');

    store.closeStudio();
    expect(useLayoutStudioStore.getState().isOpen).toBe(false);
  });

  it('switches tabs and selects preset', () => {
    const store = useLayoutStudioStore.getState();
    store.setActiveTab('custom');
    expect(useLayoutStudioStore.getState().activeTab).toBe('custom');

    store.selectPreset('9-hivemind');
    expect(useLayoutStudioStore.getState().selectedPresetId).toBe('9-hivemind');
    expect(useLayoutStudioStore.getState().activeTab).toBe('presets');
  });

  it('sets custom grid configuration', () => {
    const store = useLayoutStudioStore.getState();
    store.setCustomGrid(3, 4);
    expect(useLayoutStudioStore.getState().customRows).toBe(3);
    expect(useLayoutStudioStore.getState().customCols).toBe(4);
    expect(useLayoutStudioStore.getState().activeTab).toBe('custom');

    const layout = useLayoutStudioStore.getState().buildActiveLayout();
    expect(countTerminals(layout)).toBe(12);
  });

  it('handles split ratio presets and custom values', () => {
    const store = useLayoutStudioStore.getState();
    store.setRatioMode('golden');
    expect(useLayoutStudioStore.getState().ratioMode).toBe('golden');
    expect(useLayoutStudioStore.getState().customRatioValue).toBeCloseTo(0.618, 3);

    store.setRatioMode('hero-sidebar');
    expect(useLayoutStudioStore.getState().ratioMode).toBe('hero-sidebar');
    expect(useLayoutStudioStore.getState().customRatioValue).toBeCloseTo(0.7, 3);

    store.setRatioMode('custom', 0.42);
    expect(useLayoutStudioStore.getState().ratioMode).toBe('custom');
    expect(useLayoutStudioStore.getState().customRatioValue).toBeCloseTo(0.42, 2);
  });

  it('handles gutter, corner radius, and terminal padding setters', () => {
    const store = useLayoutStudioStore.getState();
    store.setGutterWidth(8);
    expect(useLayoutStudioStore.getState().gutterWidth).toBe(8);

    store.setCornerRadius(16);
    expect(useLayoutStudioStore.getState().cornerRadius).toBe(16);

    store.setTerminalPadding(8);
    expect(useLayoutStudioStore.getState().terminalPadding).toBe(8);
  });

  it('buildActiveLayout generates tree for selected preset', () => {
    const store = useLayoutStudioStore.getState();
    store.selectPreset('16-godmode');
    const layout = store.buildActiveLayout();
    expect(countTerminals(layout)).toBe(16);
  });

  it('respects customRatioValue for custom 1x2 and 2x1 matrices in buildActiveLayout', () => {
    const store = useLayoutStudioStore.getState();
    store.setCustomGrid(1, 2);
    store.setRatioMode('hero-sidebar', 0.7);
    const hLayout = store.buildActiveLayout();
    expect(hLayout.type).toBe('split');
    if (hLayout.type === 'split') {
      expect(hLayout.direction).toBe('horizontal');
      expect(hLayout.ratio).toBe(0.7);
    }
    expect(countTerminals(hLayout)).toBe(2);

    store.setCustomGrid(2, 1);
    store.setRatioMode('golden', 0.618);
    const vLayout = store.buildActiveLayout();
    expect(vLayout.type).toBe('split');
    if (vLayout.type === 'split') {
      expect(vLayout.direction).toBe('vertical');
      expect(vLayout.ratio).toBeCloseTo(0.618, 3);
    }
    expect(countTerminals(vLayout)).toBe(2);
  });
});
