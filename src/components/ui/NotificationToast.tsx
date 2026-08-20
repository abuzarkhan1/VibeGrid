import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import { useUIStore, ToastMessage } from '@/store/useUIStore';

const EXIT_MS = 220;

export const NotificationToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();
  const [exiting, setExiting] = useState<ToastMessage[]>([]);
  const prevToastsRef = useRef<ToastMessage[]>([]);
  const exitTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const locallyExitedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(toasts.map((t) => t.id));
    const departed = prevToastsRef.current.filter(
      (t) => !currentIds.has(t.id) && !locallyExitedRef.current.has(t.id)
    );
    if (departed.length > 0) {
      setExiting((cur) => [...cur, ...departed]);
      departed.forEach((t) => {
        exitTimersRef.current[t.id] = setTimeout(() => {
          setExiting((cur) => cur.filter((x) => x.id !== t.id));
          locallyExitedRef.current.delete(t.id);
          delete exitTimersRef.current[t.id];
        }, EXIT_MS);
      });
    }
    prevToastsRef.current = toasts;
  }, [toasts]);

  useEffect(() => {
    return () => {
      Object.values(exitTimersRef.current).forEach((timer) => clearTimeout(timer));
      exitTimersRef.current = {};
    };
  }, []);

  const handleDismiss = (id: string) => {
    locallyExitedRef.current.add(id);
    removeToast(id);
  };

  if (toasts.length === 0 && exiting.length === 0) return null;

  return (
    <div className="fixed top-16 right-6 z-[95] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none font-sans">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => handleDismiss(toast.id)} />
      ))}
      {exiting.map((toast) => (
        <ToastItem key={toast.id} toast={toast} exiting onClose={() => {}} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastMessage;
  onClose: () => void;
  exiting?: boolean;
}> = ({ toast, onClose, exiting }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!exiting) return;
    const raf = requestAnimationFrame(() => {
      setFading(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [exiting]);
  const getIcon = () => {
    switch (toast.type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-white/80 shrink-0" />;
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#181924] border border-white/10 text-white/90 text-xs font-medium shadow-2xl transition-all duration-200 backdrop-blur-md ${
        fading ? 'opacity-0 scale-95' : 'opacity-100 scale-100 animate-fade-in'
      }`}
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white/90 leading-tight truncate">{toast.title}</span>
          {toast.description && (
            <span className="text-[11px] text-white/60 font-mono font-normal truncate hidden sm:inline">
              · {toast.description}
            </span>
          )}
        </div>
        {toast.description && (
          <p className="text-[10px] text-white/60 font-mono font-normal mt-0.5 leading-tight sm:hidden">
            {toast.description}
          </p>
        )}
        {toast.progress !== undefined && (
          <div className="mt-2 h-1 w-full rounded-full bg-black/40 overflow-hidden border border-white/10">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, toast.progress))}%` }}
            />
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors shrink-0 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
