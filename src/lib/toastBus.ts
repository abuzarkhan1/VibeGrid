export type ToastEvent = {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description?: string;
  durationMs?: number;
  progress?: number;
};

type ToastListener = (toast: ToastEvent) => void;
const listeners = new Set<ToastListener>();

export function subscribeToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitToast(toast: ToastEvent): void {
  listeners.forEach((fn) => {
    try {
      fn(toast);
    } catch {}
  });
}
