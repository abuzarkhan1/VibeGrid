import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import { useUIStore, ToastMessage } from '@/store/useUIStore';

export const NotificationToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none font-sans">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
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
    <div className="pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#181924] border border-white/10 text-white/90 text-xs font-medium shadow-2xl animate-fade-in backdrop-blur-md">
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
