import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useUIStore } from './useUIStore';
import { usePaneStore, getTerminalNodes, isEqualPresetTree } from './usePaneStore';
import { useWorkspaceStore } from './useWorkspaceStore';

describe('useUIStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUIStore.setState({
      toasts: [],
      activeWebglPanes: [],
      pendingClosePaneId: null,
      pendingLayoutAction: null,
      isCreateWsModalOpen: false,
    });
    // Isolate store singletons per test: pane store clean (no paneIds →
    // nothing running, reset to a plain preset-1 grid so the layout-guard
    // no-op short-circuit starts from a known state), workspace store back to
    // the single default workspace.
    usePaneStore.setState({
      root: { type: 'terminal', id: 'term-init', title: 'Terminal 1' } as never,
      paneCount: 1,
      focusedPaneId: 'term-init',
      layoutMode: 'preset',
      presetCount: 1,
    });
    useWorkspaceStore.setState({
      workspaces: [
        { id: 'default-workspace', name: 'Default Workspace', layout: { type: 'terminal', id: 'term-init', title: 'Terminal 1' }, createdAt: Date.now(), updatedAt: Date.now(), version: 1 },
      ],
      activeWorkspaceId: 'default-workspace',
      isLoading: true, // fresh-start guard: saves skipped (no invoke needed)
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('guarded destructive flows (UX audit 7.1 / 3.6)', () => {
    it('requestClosePane sets pendingClosePaneId and cancel clears it', () => {
      useUIStore.getState().requestClosePane('term-1');
      expect(useUIStore.getState().pendingClosePaneId).toBe('term-1');

      useUIStore.getState().cancelPendingClose();
      expect(useUIStore.getState().pendingClosePaneId).toBeNull();
    });

    it('requestSwitchWorkspace switches immediately even with running processes (workspace isolation)', () => {
      // Workspace isolation: switching NEVER terminates terminals, so even with
      // a live PTY attached there is no confirmation — the switch just happens
      // and the other workspace's processes keep running in the background.
      useWorkspaceStore.setState({
        workspaces: [
          { id: 'default-workspace', name: 'Default Workspace', layout: { type: 'terminal', id: 'term-init', title: 'Terminal 1' }, createdAt: 1, updatedAt: 1, version: 1 },
          { id: 'ws-2', name: 'Second', layout: { type: 'terminal', id: 'term-2', title: 'Terminal 2' }, createdAt: 1, updatedAt: 1, version: 1 },
        ],
        activeWorkspaceId: 'default-workspace',
        isLoading: false,
      });
      usePaneStore.setState({ root: { type: 'terminal', id: 'term-1', title: 'T1', paneId: 'pty-1' } as never });
      useUIStore.getState().requestSwitchWorkspace('ws-2');

      expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('ws-2');
    });

    it('requestSwitchWorkspace switches immediately when nothing is running', () => {
      useWorkspaceStore.setState({
        workspaces: [
          { id: 'default-workspace', name: 'Default Workspace', layout: { type: 'terminal', id: 'term-init', title: 'Terminal 1' }, createdAt: 1, updatedAt: 1, version: 1 },
          { id: 'ws-2', name: 'Second', layout: { type: 'terminal', id: 'term-2', title: 'Terminal 2' }, createdAt: 1, updatedAt: 1, version: 1 },
        ],
        activeWorkspaceId: 'default-workspace',
        isLoading: false,
      });
      useUIStore.getState().requestSwitchWorkspace('ws-2');

      expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('ws-2');
    });

    it('requesting a new close replaces the pending one', () => {
      useUIStore.getState().requestClosePane('term-1');
      useUIStore.getState().requestClosePane('term-2');
      expect(useUIStore.getState().pendingClosePaneId).toBe('term-2');
    });

    it('requestCreateWorkspace creates immediately even with running processes (workspace isolation)', () => {
      // A live PTY is attached to the pane — creating a workspace still switches
      // immediately; the old workspace's processes keep running in the background.
      usePaneStore.setState({ root: { type: 'terminal', id: 'term-1', title: 'T1', paneId: 'pty-1' } as never });
      useUIStore.getState().requestCreateWorkspace('Fresh');

      expect(useWorkspaceStore.getState().workspaces.some((w) => w.name === 'Fresh')).toBe(true);
      expect(useWorkspaceStore.getState().activeWorkspaceId).not.toBe('default-workspace');
    });

    it('requestCreateWorkspace creates immediately when nothing is running', () => {
      useUIStore.getState().requestCreateWorkspace('Fresh');

      expect(useWorkspaceStore.getState().workspaces.some((w) => w.name === 'Fresh')).toBe(true);
      expect(useWorkspaceStore.getState().activeWorkspaceId).not.toBe('default-workspace');
    });

    it('requestSetLayoutPreset applies immediately when nothing is running', () => {
      useUIStore.getState().requestSetLayoutPreset(4);
      expect(useUIStore.getState().pendingLayoutAction).toBeNull();
      expect(usePaneStore.getState().paneCount).toBe(4);
    });

    it('requestSetLayoutPreset EXPANDS immediately even with a running terminal — never kills it', () => {
      // The exact reported bug: you're working in ONE terminal and click "2" —
      // the current one must NOT be deleted. Expansion (1→4) is non-destructive:
      // it applies instantly, keeps the running pane (same id, same paneId),
      // and only adds the missing terminals. No confirmation.
      usePaneStore.setState({ root: { type: 'terminal', id: 'term-1', title: 'T1', paneId: 'pty-1' } as never });
      useUIStore.getState().requestSetLayoutPreset(4);

      expect(useUIStore.getState().pendingLayoutAction).toBeNull();
      expect(usePaneStore.getState().paneCount).toBe(4);
      // The original running terminal survives with its live PTY.
      const terminals = getTerminalNodes(usePaneStore.getState().root);
      expect(terminals.some((t) => t.id === 'term-1' && t.paneId === 'pty-1')).toBe(true);
    });

    it('requestSetLayoutPreset SHRINK defers only when a REMOVED pane is running; confirm then closes', () => {
      // 4-pane grid where two panes have live processes; shrink to 2. The
      // focused pane survives; only the removed running panes need confirming.
      usePaneStore.setState({
        root: {
          type: 'split', id: 's1', direction: 'horizontal', ratio: 0.5,
          children: [
            {
              type: 'split', id: 's2', direction: 'vertical', ratio: 0.5,
              children: [
                { type: 'terminal', id: 'term-1', title: 'T1', paneId: 'pty-1' },
                { type: 'terminal', id: 'term-2', title: 'T2', paneId: 'pty-2' },
              ],
            },
            {
              type: 'split', id: 's3', direction: 'vertical', ratio: 0.5,
              children: [
                { type: 'terminal', id: 'term-3', title: 'T3', paneId: 'pty-3' },
                { type: 'terminal', id: 'term-4', title: 'T4' },
              ],
            },
          ],
        } as never,
        paneCount: 4,
        focusedPaneId: 'term-1',
        layoutMode: 'custom',
      });
      useUIStore.getState().requestSetLayoutPreset(2);
      // planPresetKeep: focused term-1 + next in order term-2 survive;
      // removed = [term-3, term-4] → only term-3 is running → closingCount 1.
      expect(useUIStore.getState().pendingLayoutAction).toEqual({ type: 'preset', count: 2, closingCount: 1 });
      expect(usePaneStore.getState().paneCount).toBe(4); // unchanged until confirmed

      useUIStore.getState().confirmPendingLayoutAction();
      expect(usePaneStore.getState().paneCount).toBe(2);
      expect(useUIStore.getState().pendingLayoutAction).toBeNull();
    });

    it('requestSetLayoutPreset SHRINK applies immediately when no removed pane is running', () => {
      // 4-pane grid, only the focused pane is running (others idle). Shrink to
      // 1 closes only idle terminals — no confirmation needed.
      usePaneStore.setState({
        root: {
          type: 'split', id: 's1', direction: 'horizontal', ratio: 0.5,
          children: [
            {
              type: 'split', id: 's2', direction: 'vertical', ratio: 0.5,
              children: [
                { type: 'terminal', id: 'term-1', title: 'T1', paneId: 'pty-1' },
                { type: 'terminal', id: 'term-2', title: 'T2' },
              ],
            },
            {
              type: 'split', id: 's3', direction: 'vertical', ratio: 0.5,
              children: [
                { type: 'terminal', id: 'term-3', title: 'T3' },
                { type: 'terminal', id: 'term-4', title: 'T4' },
              ],
            },
          ],
        } as never,
        paneCount: 4,
        focusedPaneId: 'term-1',
        layoutMode: 'custom',
      });
      useUIStore.getState().requestSetLayoutPreset(1);
      expect(useUIStore.getState().pendingLayoutAction).toBeNull();
      expect(usePaneStore.getState().paneCount).toBe(1);
    });

    // A proper EQUAL 4-pane preset tree (2×2, all ratios 0.5).
    const equal4Tree = () => ({
      type: 'split', id: 's1', direction: 'horizontal', ratio: 0.5,
      children: [
        {
          type: 'split', id: 's2', direction: 'vertical', ratio: 0.5,
          children: [
            { type: 'terminal', id: 'term-1', title: 'T1', paneId: 'pty-1' },
            { type: 'terminal', id: 'term-2', title: 'T2', paneId: 'pty-2' },
          ],
        },
        {
          type: 'split', id: 's3', direction: 'vertical', ratio: 0.5,
          children: [
            { type: 'terminal', id: 'term-3', title: 'T3', paneId: 'pty-3' },
            { type: 'terminal', id: 'term-4', title: 'T4', paneId: 'pty-4' },
          ],
        },
      ],
    } as never);

    it('requestSetLayoutPreset is a no-op when the requested EQUAL grid is already active (no kill, no confirm)', () => {
      // Already on an equal 4-pane preset WITH running processes: clicking "4"
      // again must change nothing — no confirm modal, no rebuild, no kill.
      usePaneStore.setState({
        root: equal4Tree(),
        paneCount: 4,
        layoutMode: 'preset',
        presetCount: 4,
      });
      useUIStore.getState().requestSetLayoutPreset(4);
      expect(useUIStore.getState().pendingLayoutAction).toBeNull();
      expect(usePaneStore.getState().paneCount).toBe(4); // untouched
    });

    // A pristine 6-pane preset grid (2 rows × 3 columns) — the 3-column rows
    // split at ratio 1/3, NOT 0.5, so equality must accept 1/3 too (verify fix).
    const equal6Tree = () => ({
      type: 'split', id: 's1', direction: 'vertical', ratio: 0.5,
      children: [
        {
          type: 'split', id: 's2', direction: 'horizontal', ratio: 1 / 3,
          children: [
            { type: 'terminal', id: 'term-1', title: 'T1', paneId: 'pty-1' },
            {
              type: 'split', id: 's3', direction: 'horizontal', ratio: 0.5,
              children: [
                { type: 'terminal', id: 'term-2', title: 'T2', paneId: 'pty-2' },
                { type: 'terminal', id: 'term-3', title: 'T3', paneId: 'pty-3' },
              ],
            },
          ],
        },
        {
          type: 'split', id: 's4', direction: 'horizontal', ratio: 1 / 3,
          children: [
            { type: 'terminal', id: 'term-4', title: 'T4', paneId: 'pty-4' },
            {
              type: 'split', id: 's5', direction: 'horizontal', ratio: 0.5,
              children: [
                { type: 'terminal', id: 'term-5', title: 'T5', paneId: 'pty-5' },
                { type: 'terminal', id: 'term-6', title: 'T6', paneId: 'pty-6' },
              ],
            },
          ],
        },
      ],
    } as never);

    it('isEqualPresetTree recognizes a pristine 6-pane grid (1/3 row ratios) and rejects a dragged one', () => {
      const pristine = equal6Tree() as { ratio: number };
      expect(isEqualPresetTree(pristine as never, 6)).toBe(true);
      expect(isEqualPresetTree(pristine as never, 4)).toBe(false); // wrong total count
      // Drag the vertical split away from 0.5 → no longer equal.
      const dragged = { ...pristine, ratio: 0.42 } as never;
      expect(isEqualPresetTree(dragged, 6)).toBe(false);
    });

    it('requestSetLayoutPreset is a no-op on an already-active EQUAL 6-pane preset (1/3 ratios)', () => {
      // Verify fix: the old check only accepted 0.5 ratios, so a pristine
      // 6-pane grid was never "equal" and clicking "6" rebuilt it every time.
      // Now it short-circuits — no rebuild, no confirm, panes untouched.
      usePaneStore.setState({
        root: equal6Tree(),
        paneCount: 6,
        layoutMode: 'preset',
        presetCount: 6,
        focusedPaneId: 'term-1',
      });
      useUIStore.getState().requestSetLayoutPreset(6);
      expect(useUIStore.getState().pendingLayoutAction).toBeNull();
      expect(usePaneStore.getState().paneCount).toBe(6);
      expect(isEqualPresetTree(usePaneStore.getState().root, 6)).toBe(true);
    });

    it('requestSetLayoutPreset RE-EQUALIZES a dragged preset grid (unequal ratios) without killing', () => {
      // UX audit P3 #11: preset grids are resizable now. Clicking the same
      // grid button on a grid the user dragged must re-equalize it
      // non-destructively — no confirm, running terminals keep their paneIds.
      const dragged = equal4Tree() as {
        children: { ratio: number }[];
      };
      dragged.children[0] = { ...dragged.children[0], ratio: 0.3 } as never;
      usePaneStore.setState({
        root: dragged as never,
        paneCount: 4,
        layoutMode: 'preset',
        presetCount: 4,
      });
      useUIStore.getState().requestSetLayoutPreset(4);
      expect(useUIStore.getState().pendingLayoutAction).toBeNull();
      expect(usePaneStore.getState().paneCount).toBe(4);
      // Re-equalized: every split ratio is 0.5 again, and the original running
      // terminals survive (their paneIds intact).
      const root = usePaneStore.getState().root as { children: { ratio: number }[] };
      expect(root.children[0].ratio).toBe(0.5);
      expect(getTerminalNodes(usePaneStore.getState().root).filter((t) => t.paneId)).toHaveLength(4);
    });

    it('requestResetLayout with a SINGLE running pane applies immediately — the focused pane survives', () => {
      // Reset keeps the focused terminal and closes the OTHERS. With one pane
      // there is nothing to close → applies instantly, no confirm.
      usePaneStore.setState({
        root: { type: 'terminal', id: 'term-1', title: 'T1', paneId: 'pty-1' } as never,
        focusedPaneId: 'term-1',
      });
      useUIStore.getState().requestResetLayout();
      expect(useUIStore.getState().pendingLayoutAction).toBeNull();
      // Pane untouched — still the single running terminal, same id/paneId
      expect(usePaneStore.getState().root).toMatchObject({ id: 'term-1', paneId: 'pty-1' });
    });

    it('requestResetLayout defers when other running panes exist; cancel clears without killing', () => {
      // 3 panes, two running besides the focused one. Reset closes the two
      // non-focused terminals → confirm first.
      usePaneStore.setState({
        root: {
          type: 'split', id: 's1', direction: 'horizontal', ratio: 0.5,
          children: [
            { type: 'terminal', id: 'term-1', title: 'T1', paneId: 'pty-1' },
            {
              type: 'split', id: 's2', direction: 'vertical', ratio: 0.5,
              children: [
                { type: 'terminal', id: 'term-2', title: 'T2', paneId: 'pty-2' },
                { type: 'terminal', id: 'term-3', title: 'T3', paneId: 'pty-3' },
              ],
            },
          ],
        } as never,
        paneCount: 3,
        focusedPaneId: 'term-1',
        layoutMode: 'custom',
      });
      useUIStore.getState().requestResetLayout();
      expect(useUIStore.getState().pendingLayoutAction).toEqual({ type: 'reset', closingCount: 2 });
      expect(usePaneStore.getState().paneCount).toBe(3);

      useUIStore.getState().cancelPendingLayoutAction();
      expect(useUIStore.getState().pendingLayoutAction).toBeNull();
      expect(usePaneStore.getState().paneCount).toBe(3); // untouched
    });

    it('requestResetLayout applies immediately when nothing is running', () => {
      useUIStore.getState().requestResetLayout();
      expect(useUIStore.getState().pendingLayoutAction).toBeNull();
      expect(usePaneStore.getState().paneCount).toBe(1);
    });

    it('notifyMaxPanes surfaces a single unified toast (audit: dedup)', () => {
      useUIStore.getState().notifyMaxPanes();
      const toasts = useUIStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].title).toBe('Maximum Pane Limit Reached');
    });
  });

  describe('quit guard (UX audit P0 #1)', () => {
    it('requestQuit sets the pending flag; cancelQuit clears it', () => {
      expect(useUIStore.getState().pendingQuit).toBe(false);
      useUIStore.getState().requestQuit();
      expect(useUIStore.getState().pendingQuit).toBe(true);
      useUIStore.getState().cancelQuit();
      expect(useUIStore.getState().pendingQuit).toBe(false);
    });
  });

  describe('toasts', () => {
    it('addToast creates a toast with an id', () => {
      useUIStore.getState().addToast({ type: 'info', title: 'Hello' });
      const toasts = useUIStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].title).toBe('Hello');
      expect(toasts[0].id).toBeDefined();
    });

    it('caps the toast stack (UX audit P3 #15: no unbounded overflow)', () => {
      for (let i = 0; i < 8; i++) {
        useUIStore.getState().addToast({ type: 'info', title: `Toast ${i}` });
      }
      expect(useUIStore.getState().toasts.length).toBeLessThanOrEqual(4);
    });

    it('dedupes identical toasts by title+description (UX audit P3 #15)', () => {
      useUIStore.getState().addToast({ type: 'warning', title: 'No speech detected', description: 'Try speaking louder.' });
      useUIStore.getState().addToast({ type: 'warning', title: 'No speech detected', description: 'Try speaking louder.' });
      expect(useUIStore.getState().toasts).toHaveLength(1);
      // A DIFFERENT toast still stacks.
      useUIStore.getState().addToast({ type: 'error', title: 'Dictation failed' });
      expect(useUIStore.getState().toasts).toHaveLength(2);
    });

    it('auto-removes toasts after durationMs', () => {
      useUIStore.getState().addToast({ type: 'warning', title: 'Hi', durationMs: 100 });
      expect(useUIStore.getState().toasts).toHaveLength(1);
      vi.advanceTimersByTime(150);
      expect(useUIStore.getState().toasts).toHaveLength(0);
    });

    it('removeToast removes by id', () => {
      useUIStore.getState().addToast({ type: 'info', title: 'A' });
      const id = useUIStore.getState().toasts[0].id;
      useUIStore.getState().removeToast(id);
      expect(useUIStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('WebGL slot management', () => {
    it('acquires slots up to the max', () => {
      expect(useUIStore.getState().acquireWebglSlot('p1')).toBe(true);
      expect(useUIStore.getState().acquireWebglSlot('p2')).toBe(true);
      expect(useUIStore.getState().activeWebglPanes).toEqual(['p1', 'p2']);
    });

    it('returns false past maxWebglSlots (canvas fallback)', () => {
      const max = useUIStore.getState().maxWebglSlots;
      for (let i = 0; i < max; i++) {
        expect(useUIStore.getState().acquireWebglSlot(`p${i}`)).toBe(true);
      }
      expect(useUIStore.getState().acquireWebglSlot('overflow')).toBe(false);
    });

    it('releasing a slot frees capacity', () => {
      useUIStore.getState().acquireWebglSlot('p1');
      useUIStore.getState().releaseWebglSlot('p1');
      expect(useUIStore.getState().activeWebglPanes).toEqual([]);
      expect(useUIStore.getState().acquireWebglSlot('p2')).toBe(true);
    });

    it('is idempotent for re-acquiring the same pane', () => {
      useUIStore.getState().acquireWebglSlot('p1');
      expect(useUIStore.getState().acquireWebglSlot('p1')).toBe(true);
      expect(useUIStore.getState().activeWebglPanes).toHaveLength(1);
    });
  });

  describe('overlay toggles', () => {
    it('toggles command palette and settings', () => {
      useUIStore.getState().setCommandPaletteOpen(true);
      expect(useUIStore.getState().isCommandPaletteOpen).toBe(true);
      useUIStore.getState().toggleCommandPalette();
      expect(useUIStore.getState().isCommandPaletteOpen).toBe(false);
    });

    it('openCreateWsModal / closeCreateWsModal drive the global create modal (audit find 4)', () => {
      expect(useUIStore.getState().isCreateWsModalOpen).toBe(false);
      useUIStore.getState().openCreateWsModal();
      expect(useUIStore.getState().isCreateWsModalOpen).toBe(true);
      useUIStore.getState().closeCreateWsModal();
      expect(useUIStore.getState().isCreateWsModalOpen).toBe(false);
    });
  });
});
