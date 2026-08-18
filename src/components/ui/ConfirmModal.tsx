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
      className="fixed inset-0 z-50 bg-black/70  flex items-center justify-center p-4 animate-fade-in font-sans"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#1A1B26] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider">{title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close confirmation dialog"
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs text-white/70 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10 bg-white/[0.02]">
          <button
            onClick={onClose}
            className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs px-3.5 py-1.5 text-xs font-medium text-white/70 hover:text-white"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all ${
              isDanger
                ? 'bg-red-400 bg-[#f85149] hover:bg-[#da3633] text-white'
                : 'bg-violet-500 hover:bg-violet-500/90 text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
