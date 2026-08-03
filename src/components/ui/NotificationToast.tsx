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
    <div className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg bg-surfaceCard border border-forest/25 backdrop-blur-md shadow-[0_0_30px_rgba(44,122,64,0.15)] text-white/80 animate-fade-in">
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-white/90 leading-tight">{toast.title}</h4>
        {toast.description && <p className="text-xs text-white/45 mt-1 leading-normal">{toast.description}</p>}
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
