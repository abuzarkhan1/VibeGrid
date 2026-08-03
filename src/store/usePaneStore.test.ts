import { describe, it, expect, beforeEach } from 'vitest';
import { usePaneStore } from './usePaneStore';

describe('VibeGrid Layout Store', () => {
  beforeEach(() => {
    usePaneStore.getState().resetLayout();
  });

  it('initializes with 1 terminal root pane', () => {
    const state = usePaneStore.getState();
    expect(state.paneCount).toBe(1);
    expect(state.root.type).toBe('terminal');
    expect(state.focusedPaneId).toBe(state.root.id);
  });

  it('splits horizontally into 2 panes', () => {
    const rootId = usePaneStore.getState().root.id;
    const ok = usePaneStore.getState().splitPane(rootId, 'horizontal');
    expect(ok).toBe(true);

    const state = usePaneStore.getState();
    expect(state.paneCount).toBe(2);
    expect(state.root.type).toBe('split');
  });

  it('enforces maximum 16 panes limit', () => {
    let currentId = usePaneStore.getState().focusedPaneId!;
    for (let i = 1; i < 16; i++) {
      usePaneStore.getState().splitPane(currentId, 'horizontal');
      currentId = usePaneStore.getState().focusedPaneId!;
    }
    expect(usePaneStore.getState().paneCount).toBe(16);

    const overflow = usePaneStore.getState().splitPane(currentId, 'vertical');
    expect(overflow).toBe(false);
    expect(usePaneStore.getState().paneCount).toBe(16);
  });

  it('closes a pane and reduces pane count', () => {
    const rootId = usePaneStore.getState().root.id;
    usePaneStore.getState().splitPane(rootId, 'horizontal');
    const focused = usePaneStore.getState().focusedPaneId!;

    usePaneStore.getState().closePane(focused);
    expect(usePaneStore.getState().paneCount).toBe(1);
  });
});
