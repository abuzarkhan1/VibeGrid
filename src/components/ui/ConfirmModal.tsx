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
      className="fixed inset-0 z-50 bg-[#090a0c]/80 flex items-center justify-center p-4 animate-fade-in font-sans select-none text-white"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#111111] border border-[#4a4b50] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#4a4b50] bg-[#111111]">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 ${
              isDanger ? 'bg-[#e06c75]/10 border-[#e06c75]/30 text-[#e06c75]' : 'bg-[#090a0c] border-[#4a4b50] text-[#ff8964]'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">{title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close confirmation dialog"
            className="p-1 rounded-full hover:bg-[#303236] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-[13px] text-[#a9a9aa] leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#4a4b50] bg-[#111111]">
          <button
            onClick={onClose}
            className="h-9 flex items-center px-4 rounded-full bg-[#303236] hover:bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] text-[#a9a9aa] hover:text-white text-[13px] font-medium transition-all active:scale-95 cursor-pointer"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`h-9 flex items-center px-5 rounded-full text-[13px] font-medium shadow-sm transition-all active:scale-95 cursor-pointer ${
              isDanger
                ? 'bg-[#e06c75] hover:bg-[#e06c75]/90 text-white'
                : 'bg-[#5683da] hover:bg-[#5683da]/90 text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
