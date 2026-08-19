import { create } from 'zustand';
import { usePaneStore, getTerminalNodes, planPresetKeep, isEqualPresetTree } from './usePaneStore';
import { PresetCount } from '@/types/layout';
import { useWorkspaceStore } from './useWorkspaceStore';
import { useSettingsStore } from './useSettingsStore';

export interface ToastMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description?: string;
  durationMs?: number;

  progress?: number;
}

interface UIState {
  isCommandPaletteOpen: boolean;
  isSettingsOpen: boolean;
  isAboutOpen: boolean;
  activeSettingsTab: 'font' | 'theme' | 'terminal' | 'workspaces' | 'limits' | 'appearance' | 'keyboard' | 'profiles';
  isCheatsheetOpen: boolean;
  isDiffViewerOpen: boolean;
  isChatOpen: boolean;
  toasts: ToastMessage[];
  activeWebglPanes: string[];
  maxWebglSlots: number;

  pendingClosePaneId: string | null;

  pendingQuit: boolean;

  pendingLayoutAction:
    | { type: 'preset'; count: PresetCount; closingCount: number }
    | { type: 'reset'; closingCount: number }
    | null;

  isCreateWsModalOpen: boolean;

  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleSettings: () => void;
  setAboutOpen: (open: boolean) => void;
  toggleAbout: () => void;
  setActiveSettingsTab: (tab: 'font' | 'theme' | 'terminal' | 'workspaces' | 'limits' | 'appearance' | 'keyboard' | 'profiles') => void;
  setCheatsheetOpen: (open: boolean) => void;
  toggleDiffViewer: () => void;
  setDiffViewerOpen: (open: boolean) => void;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  updateToast: (id: string, patch: Partial<Omit<ToastMessage, 'id'>>) => void;
  removeToast: (id: string) => void;
  acquireWebglSlot: (paneId: string) => boolean;
  releaseWebglSlot: (paneId: string) => void;
  requestClosePane: (paneId: string) => void;
  cancelPendingClose: () => void;
  requestQuit: () => void;
  cancelQuit: () => void;

  requestSetLayoutPreset: (count: PresetCount) => void;
  requestResetLayout: () => void;
  confirmPendingLayoutAction: () => void;
  cancelPendingLayoutAction: () => void;
  requestSwitchWorkspace: (wsId: string) => void;
  requestCreateWorkspace: (name: string, opts?: { activate?: boolean; defaultCwd?: string }) => void;
  openCreateWsModal: () => void;
  closeCreateWsModal: () => void;

  notifyMaxPanes: () => void;

  activeViewMode: 'hub' | 'grid';
  activeThreadTitle: string;
  setActiveViewMode: (mode: 'hub' | 'grid') => void;
  setActiveThreadTitle: (title: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isCommandPaletteOpen: false,
  isSettingsOpen: false,
  isAboutOpen: false,
  activeSettingsTab: 'font',
  isCheatsheetOpen: false,
  isDiffViewerOpen: false,
  isChatOpen: false,
  toasts: [],
  activeWebglPanes: [],
  maxWebglSlots: 12,
  pendingClosePaneId: null,
  pendingQuit: false,
  pendingLayoutAction: null,
  isCreateWsModalOpen: false,

  activeViewMode: 'hub',
  activeThreadTitle: 'VibeGrid',

  setActiveViewMode: (mode: 'hub' | 'grid') => set({ activeViewMode: mode }),

  setActiveThreadTitle: (title: string) => set({ activeThreadTitle: title }),

  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setCommandPaletteOpen: (open: boolean) => set({ isCommandPaletteOpen: open }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setAboutOpen: (open: boolean) => set({ isAboutOpen: open }),
  toggleAbout: () => set((state) => ({ isAboutOpen: !state.isAboutOpen })),
  setActiveSettingsTab: (tab) => set({ activeSettingsTab: tab }),
  setCheatsheetOpen: (open: boolean) => set({ isCheatsheetOpen: open }),
  toggleDiffViewer: () => set((state) => ({ isDiffViewerOpen: !state.isDiffViewerOpen })),
  setDiffViewerOpen: (open: boolean) => set({ isDiffViewerOpen: open }),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  setChatOpen: (open: boolean) => set({ isChatOpen: open }),

  requestClosePane: (paneId: string) => {

    if (useSettingsStore.getState().confirmations.paneClose !== 'always') {
      usePaneStore.getState().closePane(paneId);
      return;
    }
    set({ pendingClosePaneId: paneId });
  },
  cancelPendingClose: () => set({ pendingClosePaneId: null }),
  requestQuit: () => set({ pendingQuit: true }),
  cancelQuit: () => set({ pendingQuit: false }),

  requestSetLayoutPreset: (count) => {
    const ps = usePaneStore.getState();

    if (ps.layoutMode === 'preset' && ps.presetCount === count && isEqualPresetTree(ps.root, count)) return;

    if (count > ps.paneCount) {
      usePaneStore.getState().setLayoutPreset(count);
      return;
    }

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

  requestSwitchWorkspace: (wsId: string) => {
    useWorkspaceStore.getState().switchWorkspace(wsId);
  },

  requestCreateWorkspace: (name: string, opts?: { activate?: boolean; defaultCwd?: string }) => {
    useWorkspaceStore.getState().createWorkspace(name, opts);
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
    // Customization audit L14: the cap and default duration are settings now.
    const MAX_TOASTS = useSettingsStore.getState().toastMaxCount;
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

    const duration = toast.durationMs ?? useSettingsStore.getState().toastDefaultDurationMs;
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
    const { activeWebglPanes } = get();
    // Customization audit L2: the WebGL context cap is a user setting now — read
    // it live so a change applies immediately (maxWebglSlots state is kept as a
    // fallback for tests/back-compat).
    const maxWebglSlots = useSettingsStore.getState().maxWebglSlots || get().maxWebglSlots;
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
