import { create } from 'zustand';

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

  // Guarded destructive flows (confirmation before close / workspace switch)
  pendingClosePaneId: string | null;
  pendingSwitchWsId: string | null;

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
  requestSwitchWorkspace: (wsId: string) => void;
  cancelPendingSwitch: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isCommandPaletteOpen: false,
  isSettingsOpen: false,
  isCheatsheetOpen: false,
  toasts: [],
  activeWebglPanes: [],
  maxWebglSlots: 12, // Max active WebGL GPU contexts allowed before canvas fallback
  pendingClosePaneId: null,
  pendingSwitchWsId: null,

  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setCommandPaletteOpen: (open: boolean) => set({ isCommandPaletteOpen: open }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setCheatsheetOpen: (open: boolean) => set({ isCheatsheetOpen: open }),

  requestClosePane: (paneId: string) => set({ pendingClosePaneId: paneId }),
  cancelPendingClose: () => set({ pendingClosePaneId: null }),

  requestSwitchWorkspace: (wsId: string) => set({ pendingSwitchWsId: wsId }),
  cancelPendingSwitch: () => set({ pendingSwitchWsId: null }),

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { ...toast, id };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    const duration = toast.durationMs ?? 3000;
    if (duration > 0) {
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
