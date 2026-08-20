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
    <div
      role="status"
      aria-live="polite"
      className="fixed top-14 right-6 z-[95] flex flex-col gap-2 max-w-sm w-full pointer-events-none font-sans"
    >
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
        return <AlertTriangle className="w-4 h-4 text-[#ff8964] shrink-0 mt-0.5" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-[#ff8964] shrink-0 mt-0.5" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-[#27c93f] shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-[#5683da] shrink-0 mt-0.5" />;
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-[#111111] border border-[#4a4b50] text-white text-xs font-medium shadow-2xl transition-all duration-200 ${
        fading ? 'opacity-0 translate-x-3 scale-95' : 'opacity-100 translate-x-0 scale-100 animate-fade-in'
      }`}
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white leading-tight truncate">{toast.title}</div>
        {toast.description && (
          <p className="text-[11px] text-[#a9a9aa] font-mono font-normal mt-1 leading-snug break-words line-clamp-3">
            {toast.description}
          </p>
        )}
        {toast.progress !== undefined && (
          <div className="mt-2 h-1 w-full rounded-full bg-[#090a0c] overflow-hidden border border-[#4a4b50]">
            <div
              className="h-full rounded-full bg-[#5683da] transition-[width] duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, toast.progress))}%` }}
            />
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="p-1 rounded-full hover:bg-[#303236] text-[#a9a9aa] hover:text-white transition-all active:scale-95 shrink-0 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

