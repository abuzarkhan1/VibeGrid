import { describe, it, expect, beforeEach } from 'vitest';
import { usePaneStore, getTerminalNodes, planPresetKeep, equalPresetRatio, isEqualPresetTree } from './usePaneStore';
import { useSettingsStore } from './useSettingsStore';
import type { PaneNode } from '../types/layout';

describe('VibeGrid Layout Store', () => {
  beforeEach(() => {
    useSettingsStore.setState({ maxPanes: 16 });
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

  it('setPaneShell records a per-pane shell override (audit: was dead field)', () => {
    const rootId = usePaneStore.getState().root.id;
    usePaneStore.getState().setPaneShell(rootId, '/bin/fish');
    const root = usePaneStore.getState().root as { shell?: string };
    expect(root.shell).toBe('/bin/fish');

    usePaneStore.getState().setPaneShell(rootId, '');
    const cleared = usePaneStore.getState().root as { shell?: string };
    expect(cleared.shell).toBeUndefined();
  });

  it('swapPanes swaps contents while keeping layout identities (audit: was MISSING)', () => {
    const rootId = usePaneStore.getState().root.id;
    usePaneStore.getState().splitPane(rootId, 'horizontal');
    const first = usePaneStore.getState().root as { children: { id: string }[] };
    const idA = first.children[0].id;
    const idB = first.children[1].id;

    usePaneStore.getState().setPaneTitle(idA, 'Alpha');
    usePaneStore.getState().setPaneTitle(idB, 'Beta');
    usePaneStore.getState().setPanePtyId(idA, 'pty-a');
    usePaneStore.getState().setPanePtyId(idB, 'pty-b');

    usePaneStore.getState().swapPanes(idA, idB);

    const root = usePaneStore.getState().root as { children: { id: string; title?: string; paneId?: string }[] };
    expect(root.children[0].id).toBe(idA);
    expect(root.children[0].title).toBe('Beta');
    expect(root.children[0].paneId).toBe('pty-b');
    expect(root.children[1].title).toBe('Alpha');
    expect(root.children[1].paneId).toBe('pty-a');
  });

  it('swapPanes with the same id is a no-op', () => {
    const rootId = usePaneStore.getState().root.id;
    usePaneStore.getState().swapPanes(rootId, rootId);
    expect(usePaneStore.getState().paneCount).toBe(1);
  });

  it('setLayoutPreset EXPANSION keeps every existing terminal (with its paneId) and only adds new panes', () => {
    const rootId = usePaneStore.getState().root.id;
    usePaneStore.getState().setPanePtyId(rootId, 'pty-1');
    usePaneStore.getState().setLayoutPreset(4);

    expect(usePaneStore.getState().paneCount).toBe(4);
    const terminals = getTerminalNodes(usePaneStore.getState().root);
    expect(terminals).toHaveLength(4);

    const original = terminals.find((t) => t.id === rootId);
    expect(original).toBeDefined();
    expect(original?.paneId).toBe('pty-1');
  });

  it('setLayoutPreset SHRINK keeps the focused pane and closes the removed ones', () => {
    const rootId = usePaneStore.getState().root.id;
    usePaneStore.getState().setPanePtyId(rootId, 'pty-1');
    usePaneStore.getState().setLayoutPreset(4);
    const terminals = getTerminalNodes(usePaneStore.getState().root);
    const others = terminals.filter((t) => t.id !== rootId);
    others.forEach((t) => usePaneStore.getState().setPanePtyId(t.id, `pty-${t.id}`));
    usePaneStore.getState().setFocusedPane(rootId);

    usePaneStore.getState().setLayoutPreset(2);
    expect(usePaneStore.getState().paneCount).toBe(2);
    const remaining = getTerminalNodes(usePaneStore.getState().root);
    expect(remaining.some((t) => t.id === rootId && t.paneId === 'pty-1')).toBe(true);
    // All kept terminals retain their paneIds (only removed ones die).
    expect(remaining.every((t) => t.paneId)).toBe(true);
  });

  it('setLayoutPreset with the same preset count is a no-op', () => {
    usePaneStore.getState().setLayoutPreset(1);
    expect(usePaneStore.getState().paneCount).toBe(1);
  });

  it('setLayoutPreset re-grids a same-count CUSTOM layout to an equal preset without killing', () => {
    const rootId = usePaneStore.getState().root.id;
    usePaneStore.getState().setPanePtyId(rootId, 'pty-1');
    // Build a custom 2-pane layout with an unequal ratio.
    usePaneStore.getState().splitPane(rootId, 'horizontal');
    const splitPaneId = getTerminalNodes(usePaneStore.getState().root).find((t) => t.id !== rootId)!.id;
    usePaneStore.getState().setPanePtyId(splitPaneId, 'pty-2');
    usePaneStore.getState().setRatio(usePaneStore.getState().root.id, 0.3);
    expect(usePaneStore.getState().layoutMode).toBe('custom');

    // Clicking the "2" grid button while on a custom 2-pane layout must
    // re-lay it out as an equal preset — keeping both live paneIds.
    usePaneStore.getState().setLayoutPreset(2);
    const state = usePaneStore.getState();
    expect(state.paneCount).toBe(2);
    expect(state.layoutMode).toBe('preset');
    expect(state.presetCount).toBe(2);
    const terminals = getTerminalNodes(state.root);
    expect(terminals.filter((t) => t.id === rootId && t.paneId === 'pty-1')).toHaveLength(1);
    expect(terminals.every((t) => t.paneId)).toBe(true);
  });

  it('resetLayout keeps the focused terminal (and its process) and closes the rest', () => {
    const rootId = usePaneStore.getState().root.id;
    usePaneStore.getState().setPanePtyId(rootId, 'pty-1');
    usePaneStore.getState().setLayoutPreset(4);
    const terminals = getTerminalNodes(usePaneStore.getState().root);
    const others = terminals.filter((t) => t.id !== rootId);
    others.forEach((t) => usePaneStore.getState().setPanePtyId(t.id, `pty-${t.id}`));
    usePaneStore.getState().setFocusedPane(rootId);

    usePaneStore.getState().resetLayout();
    expect(usePaneStore.getState().paneCount).toBe(1);
    expect(usePaneStore.getState().root).toMatchObject({ id: rootId, paneId: 'pty-1' });
  });

  it('planPresetKeep always keeps the focused pane first, then others in order', () => {
    const terms = [
      { type: 'terminal', id: 'a', title: 'A' },
      { type: 'terminal', id: 'b', title: 'B' },
      { type: 'terminal', id: 'c', title: 'C' },
      { type: 'terminal', id: 'd', title: 'D' },
    ] as never[];
    const { kept, removed } = planPresetKeep(terms as never, 'c', 2);
    expect(kept.map((t) => t.id)).toEqual(['c', 'a']);
    expect(removed.map((t) => t.id)).toEqual(['b', 'd']);
  });

  // Customization audit L12: 3/5/9/12 preset grids.
  it('expands to the new 3/5/9/12 preset grids and re-apply is a no-op', () => {
    for (const count of [3, 5, 9, 12] as const) {
      usePaneStore.getState().setLayoutPreset(count);
      const state = usePaneStore.getState();
      expect(state.paneCount).toBe(count);
      expect(state.layoutMode).toBe('preset');
      expect(state.presetCount).toBe(count);
      expect(getTerminalNodes(state.root)).toHaveLength(count);
      // Re-applying the SAME preset is a no-op (isEqualPresetTree recognizes
      // the pristine grid, including the 1/3 splits inside 3-cell rows).
      usePaneStore.getState().setLayoutPreset(count);
      expect(usePaneStore.getState().paneCount).toBe(count);
    }
  });

  // Grid-calculation regression: every preset must be an EQUAL grid — each
  // split sits at the share its FIRST child holds (countTerminals(child0)/
  // total). The old combineRows only handled 1/2/4 rows, so the 3-row
  // presets (9, 12) split 2-rows-vs-1-row at 50/50 (unequal row heights) and
  // 4+ pane grids could visually 'merge'. A split's pristine ratio also
  // drives isEqualPresetTree/equalPresetRatio, so the whole grid must conform.
  it('every preset count builds an EQUAL grid (all splits at the pristine ratio)', () => {
    const assertEqual = (n: PaneNode): void => {
      if (n.type === 'split') {
        expect(Math.abs(n.ratio - equalPresetRatio(n))).toBeLessThan(0.001);
        assertEqual(n.children[0]);
        assertEqual(n.children[1]);
      }
    };
    for (const count of [2, 3, 4, 5, 6, 8, 9, 12, 16] as const) {
      usePaneStore.getState().setLayoutPreset(count);
      const root = usePaneStore.getState().root;
      assertEqual(root);
      // The store's own no-op guard must recognize the grid as equal…
      expect(isEqualPresetTree(root, count)).toBe(true);
      // …so re-applying the same preset is a reference-identical no-op.
      const before = usePaneStore.getState().root;
      usePaneStore.getState().setLayoutPreset(count);
      expect(usePaneStore.getState().root).toBe(before);
    }
  });

  it('shrinks from a 12-pane preset to 5 keeping the focused pane', () => {
    usePaneStore.getState().setLayoutPreset(12);
    const focusedId = usePaneStore.getState().focusedPaneId!;
    usePaneStore.getState().setLayoutPreset(5);
    const state = usePaneStore.getState();
    expect(state.paneCount).toBe(5);
    expect(state.layoutMode).toBe('preset');
    expect(getTerminalNodes(state.root).some((t) => t.id === focusedId)).toBe(true);
  });

  // Allotment v1 corrupts its internal sizes when the SAME component instance
  // receives a structurally different tree in place (preset 6→9 deepens the
  // nesting) — panes collapse to zero and reset() cannot recover them. The
  // store's gridVersion is the remount contract: App.tsx keys the root
  // GridRenderer on it, forcing a fresh Allotment mount per structural change
  // (terminals re-attach to their live paneIds, so no shell is lost).
  it('gridVersion bumps on EVERY structural change and stays put for a divider drag', () => {
    const v0 = usePaneStore.getState().gridVersion;

    // splitPane → structural
    usePaneStore.getState().splitPane(usePaneStore.getState().root.id, 'horizontal');
    expect(usePaneStore.getState().gridVersion).toBe(v0 + 1);

    // setRatio (divider drag) → NOT structural — must NOT bump (no remount
    // mid-drag; the memoized GridRenderer keeps the split instance alive).
    usePaneStore.getState().setRatio(usePaneStore.getState().root.id, 0.3);
    expect(usePaneStore.getState().gridVersion).toBe(v0 + 1);

    // closePane → structural
    usePaneStore.getState().closePane(usePaneStore.getState().focusedPaneId!);
    expect(usePaneStore.getState().gridVersion).toBe(v0 + 2);

    // setLayoutPreset expansion + shrink → structural
    usePaneStore.getState().setLayoutPreset(9);
    expect(usePaneStore.getState().gridVersion).toBe(v0 + 3);
    usePaneStore.getState().setLayoutPreset(4);
    expect(usePaneStore.getState().gridVersion).toBe(v0 + 4);

    // Re-applying the SAME equal preset is a no-op → no bump.
    const before = usePaneStore.getState().gridVersion;
    usePaneStore.getState().setLayoutPreset(4);
    expect(usePaneStore.getState().gridVersion).toBe(before);

    // resetLayout → structural
    usePaneStore.getState().resetLayout();
    expect(usePaneStore.getState().gridVersion).toBe(v0 + 5);
  });
});
