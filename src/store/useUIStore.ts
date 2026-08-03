import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description?: string;
  durationMs?: number;
}

interface UIState {
  isCommandPaletteOpen: boolean;
  isSettingsOpen: boolean;
  toasts: ToastMessage[];
  activeWebglPanes: string[];
  maxWebglSlots: number;

  // Actions
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleSettings: () => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  acquireWebglSlot: (paneId: string) => boolean;
  releaseWebglSlot: (paneId: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isCommandPaletteOpen: false,
  isSettingsOpen: false,
  toasts: [],
  activeWebglPanes: [],
  maxWebglSlots: 12, // Max active WebGL GPU contexts allowed before canvas fallback

  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setCommandPaletteOpen: (open: boolean) => set({ isCommandPaletteOpen: open }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

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
  },

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
