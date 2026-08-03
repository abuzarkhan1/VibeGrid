import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmLabel = 'Confirm',
  isDanger = false,
  onConfirm,
  onClose,
}) => {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-surfaceCard border border-forest/25 rounded-xl shadow-[0_0_50px_rgba(44,122,64,0.18)] overflow-hidden flex flex-col backdrop-blur-md"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.03]">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-xs font-medium text-white/90 uppercase tracking-wider">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-white/70 leading-relaxed">{message}</p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/50 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors ${
                isDanger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-forest hover:bg-forest-bright shadow-[0_0_12px_rgba(44,122,64,0.35)]'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
