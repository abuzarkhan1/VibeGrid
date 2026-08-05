import { create } from 'zustand';
import { usePaneStore, getTerminalNodes, planPresetKeep, isEqualPresetTree } from './usePaneStore';
import { useWorkspaceStore } from './useWorkspaceStore';

export interface ToastMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description?: string;
  durationMs?: number;
  /** 0-100 progress to render a thin progress bar in the toast (e.g. model download). */
  progress?: number;
}

interface UIState {
  isCommandPaletteOpen: boolean;
  isSettingsOpen: boolean;
  isCheatsheetOpen: boolean;
  toasts: ToastMessage[];
  activeWebglPanes: string[];
  maxWebglSlots: number;

  // Guarded destructive flow: closing a pane (kills its processes) confirms
  // first. Workspace switching/creation is NON-destructive (workspace
  // isolation) — hidden workspaces' terminals keep running — so it needs no
  // confirmation.
  pendingClosePaneId: string | null;
  /**
   * Quit-with-running-processes guard (UX audit P0 #1): the window close was
   * intercepted because terminals are still running and the user hasn't opted
   * into minimize-to-tray — wait for the user to confirm the quit.
   */
  pendingQuit: boolean;
  /**
   * A layout change that CLOSES running terminals, awaiting confirmation.
   * Expanding a preset grid (1→2→4…) is NON-destructive (existing terminals
   * keep running, only missing panes are added) so it never confirms. Only a
   * SHRINK (4→2→1) or reset closes panes — and only when one of the removed
   * panes has a running process. closingCount is how many terminals will be
   * terminated (the focused pane always survives). Null = no pending request.
   */
  pendingLayoutAction:
    | { type: 'preset'; count: 1 | 2 | 4 | 6 | 8 | 16; closingCount: number }
    | { type: 'reset'; closingCount: number }
    | null;
  // Audit find 4: the 'new-workspace' keybinding needs a reachable create modal
  // (Header/Sidebar/Settings/Palette own theirs locally).
  isCreateWsModalOpen: boolean;

  // Actions
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleSettings: () => void;
  setCheatsheetOpen: (open: boolean) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  updateToast: (id: string, patch: Partial<Omit<ToastMessage, 'id'>>) => void;
  removeToast: (id: string) => void;
  acquireWebglSlot: (paneId: string) => boolean;
  releaseWebglSlot: (paneId: string) => void;
  requestClosePane: (paneId: string) => void;
  cancelPendingClose: () => void;
  requestQuit: () => void;
  cancelQuit: () => void;
  /** Guarded preset/reset: applies immediately when nothing is running, else
   * asks for confirmation first (a grid rebuild terminates all panes). */
  requestSetLayoutPreset: (count: 1 | 2 | 4 | 6 | 8 | 16) => void;
  requestResetLayout: () => void;
  confirmPendingLayoutAction: () => void;
  cancelPendingLayoutAction: () => void;
  requestSwitchWorkspace: (wsId: string) => void;
  requestCreateWorkspace: (name: string) => void;
  openCreateWsModal: () => void;
  closeCreateWsModal: () => void;
  /** Unified "max panes reached" toast (audit: 3 hand-rolled copies drifted). */
  notifyMaxPanes: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isCommandPaletteOpen: false,
  isSettingsOpen: false,
  isCheatsheetOpen: false,
  toasts: [],
  activeWebglPanes: [],
  maxWebglSlots: 12, // Max active WebGL GPU contexts allowed before canvas fallback
  pendingClosePaneId: null,
  pendingQuit: false,
  pendingLayoutAction: null,
  isCreateWsModalOpen: false,

  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setCommandPaletteOpen: (open: boolean) => set({ isCommandPaletteOpen: open }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setCheatsheetOpen: (open: boolean) => set({ isCheatsheetOpen: open }),

  requestClosePane: (paneId: string) => set({ pendingClosePaneId: paneId }),
  cancelPendingClose: () => set({ pendingClosePaneId: null }),
  requestQuit: () => set({ pendingQuit: true }),
  cancelQuit: () => set({ pendingQuit: false }),

  // Grid preset/reset guard. EXPANSION (count > current) is non-destructive —
  // existing terminals keep their live paneIds and only the missing panes are
  // added — so it always applies immediately. Only a SHRINK or reset closes
  // panes; those confirm only when one of the REMOVED panes has a running
  // process (the focused pane always survives the change).
  requestSetLayoutPreset: (count) => {
    const ps = usePaneStore.getState();
    // No-op short-circuit: clicking the already-active EQUAL grid button (e.g.
    // "4" while already on an equal 4-pane preset) changes nothing — don't
    // rebuild. A preset grid the user dragged (unequal ratios) re-equalizes
    // non-destructively instead (UX audit P3 #11).
    if (ps.layoutMode === 'preset' && ps.presetCount === count && isEqualPresetTree(ps.root, count)) return;

    // Expansion: add terminals alongside the existing ones — never confirms.
    if (count > ps.paneCount) {
      usePaneStore.getState().setLayoutPreset(count);
      return;
    }

    // Shrink: closes the removed panes. Confirm only if any of them is running.
    const { removed } = planPresetKeep(getTerminalNodes(ps.root), ps.focusedPaneId, count);
    const closingCount = removed.filter((t) => t.paneId).length;
    if (closingCount === 0) {
      usePaneStore.getState().setLayoutPreset(count);
      return;
    }
    set({ pendingLayoutAction: { type: 'preset', count, closingCount } });
  },

  requestResetLayout: () => {
    const ps = usePaneStore.getState();
    // Reset keeps the focused pane (falling back to the first terminal, exactly
    // like the store) and closes the others. Confirm only when there is at
    // least one other RUNNING pane to close.
    const terminals = getTerminalNodes(ps.root);
    const survivorId =
      terminals.find((t) => t.id === ps.focusedPaneId)?.id ?? terminals[0]?.id ?? null;
    const closingCount = terminals.filter((t) => t.id !== survivorId && t.paneId).length;
    if (closingCount === 0) {
      usePaneStore.getState().resetLayout();
      return;
    }
    set({ pendingLayoutAction: { type: 'reset', closingCount } });
  },

  confirmPendingLayoutAction: () => {
    const pending = get().pendingLayoutAction;
    if (!pending) return;
    if (pending.type === 'preset') {
      usePaneStore.getState().setLayoutPreset(pending.count);
    } else {
      usePaneStore.getState().resetLayout();
    }
    set({ pendingLayoutAction: null });
  },
  cancelPendingLayoutAction: () => set({ pendingLayoutAction: null }),

  // Workspace isolation: switching workspaces NEVER terminates terminals — the
  // leaving workspace's live layout (with paneIds) is captured in memory and
  // its PTYs keep running in the background until the user switches back
  // (re-attach) or explicitly closes/deletes. So switch immediately, no
  // confirmation.
  requestSwitchWorkspace: (wsId: string) => {
    useWorkspaceStore.getState().switchWorkspace(wsId);
  },

  // Workspace isolation: creating a workspace also switches to it without
  // terminating anything. The current workspace's terminals keep running in
  // the background.
  requestCreateWorkspace: (name: string) => {
    useWorkspaceStore.getState().createWorkspace(name);
  },
  openCreateWsModal: () => set({ isCreateWsModalOpen: true }),
  closeCreateWsModal: () => set({ isCreateWsModalOpen: false }),

  notifyMaxPanes: () => {
    const { maxPanes } = usePaneStore.getState();
    get().addToast({
      type: 'warning',
      title: 'Maximum Pane Limit Reached',
      description: `VibeGrid enforces a limit of ${maxPanes} active panes for peak GPU performance.`,
    });
  },

  addToast: (toast) => {
    // UX audit P3 #15: cap the stack so repeated toasts (e.g. copy-on-select)
    // can never overflow the screen, and dedupe identical toasts by title +
    // description so a repeating event replaces itself instead of stacking.
    const MAX_TOASTS = 4;
    const now = get();
    const dup = now.toasts.find(
      (t) => t.title === toast.title && (t.description ?? '') === (toast.description ?? '')
    );
    // REVIEWER FIX: a dedupe REPLACEMENT keeps the ORIGINAL toast's id so the
    // already-scheduled auto-dismiss timer still applies (a new id would orphan
    // the timer and the replacement would never disappear). If the original was
    // persistent (durationMs 0) and the duplicate carries a positive duration,
    // schedule the dismissal now — the duplicate "upgrades" to auto-dismiss.
    const id = dup ? dup.id : `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { ...toast, id };

    set((state) => {
      if (dup) {
        return { toasts: state.toasts.map((t) => (t.id === dup.id ? newToast : t)) };
      }
      const base = state.toasts.length >= MAX_TOASTS ? state.toasts.slice(state.toasts.length - MAX_TOASTS + 1) : state.toasts;
      return { toasts: [...base, newToast] };
    });

    const duration = toast.durationMs ?? 3000;
    const needsTimer = !dup || (dup && (toast.durationMs ?? -1) > 0 && (dup.durationMs ?? 0) === 0);
    if (duration > 0 && needsTimer) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
    return id;
  },

  updateToast: (id, patch) =>
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  removeToast: (id: string) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  acquireWebglSlot: (paneId: string) => {
    const { activeWebglPanes, maxWebglSlots } = get();
    if (activeWebglPanes.includes(paneId)) return true;
    if (activeWebglPanes.length < maxWebglSlots) {
      set({ activeWebglPanes: [...activeWebglPanes, paneId] });
      return true;
    }
    return false; // WebGL limit reached, fall back to Canvas
  },

  releaseWebglSlot: (paneId: string) => {
    set((state) => ({
      activeWebglPanes: state.activeWebglPanes.filter((id) => id !== paneId),
    }));
  },
}));
