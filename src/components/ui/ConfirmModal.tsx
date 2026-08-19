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
        // If a button is focused (e.g. Cancel), let it handle its own click event
        // naturally — do NOT intercept Enter and fire onConfirm accidentally.
        const activeEl = document.activeElement as HTMLElement | null;
        if (
          activeEl &&
          (activeEl.tagName === 'BUTTON' ||
            activeEl.getAttribute('role') === 'button')
        ) {
          return;
        }
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#181924] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider font-mono">{title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close confirmation dialog"
            className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-[13px] text-white/70 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.06] bg-white/[0.02]">
          <button
            onClick={onClose}
            className="h-10 flex items-center px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-white/90 text-[13px] font-normal transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`h-10 flex items-center px-4 rounded-2xl text-[13px] font-semibold shadow-sm transition-all cursor-pointer ${
              isDanger
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-white text-black hover:bg-white/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
