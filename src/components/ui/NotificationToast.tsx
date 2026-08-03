import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import { useUIStore, ToastMessage } from '@/store/useUIStore';

export const NotificationToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-14 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
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
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-forest-bright shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-forest-light shrink-0" />;
    }
  };

  return (
    <div className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg bg-surfaceCard border border-white/10 backdrop-blur-md shadow-xl shadow-black/40 text-white/80 animate-fade-in">
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-white/90 leading-tight">{toast.title}</h4>
        {toast.description && <p className="text-xs text-white/45 mt-1 leading-normal">{toast.description}</p>}
        {toast.progress !== undefined && (
          <div className="mt-2 h-1 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-forest-bright transition-[width] duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, toast.progress))}%` }}
            />
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-white/5 text-white/45 hover:text-white/80 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
