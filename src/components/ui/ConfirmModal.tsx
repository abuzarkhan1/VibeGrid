import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

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
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // UX audit P2 #7: Enter confirms, Escape cancels — standard dialog behavior.
  // The confirm button is also autofocused so keyboard users land on it.
  // preventDefault() stops the button's NATIVE click activation (Enter on a
  // focused <button> fires click), which would double-fire onConfirm.
  useEffect(() => {
    confirmRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onConfirm();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onConfirm, onClose]);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-surfaceCard border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col backdrop-blur-md"
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
              ref={confirmRef}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-bright/70 ${
                isDanger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-forest hover:bg-forest-bright'
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
