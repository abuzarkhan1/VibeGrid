import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  id?: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  action?: () => void;
  divider?: boolean;
}

interface TerminalContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const TerminalContextMenu: React.FC<TerminalContextMenuProps> = ({ x, y, items, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth) el.style.left = `${Math.max(8, window.innerWidth - rect.width - 8)}px`;
    if (rect.bottom > window.innerHeight) el.style.top = `${Math.max(8, window.innerHeight - rect.height - 8)}px`;
  }, [x, y]);

  // Dismiss on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Terminal actions"
      className="fixed z-[60] min-w-[210px] py-1.5 rounded-[12px] bg-[#111111] border border-[#4a4b50] shadow-2xl font-sans text-xs animate-fade-in select-none"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, idx) =>
        item.divider ? (
          <div key={`div-${idx}`} className="my-1 h-px bg-[#4a4b50]" />
        ) : (
          <button
            key={item.id || idx}
            role="menuitem"
            disabled={item.disabled}
            onClick={(e) => {
              e.stopPropagation();
              item.action?.();
              onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors cursor-pointer disabled:cursor-not-allowed ${
              item.disabled
                ? 'text-[#6b6c6d] opacity-50'
                : 'text-[#d1d2d3] hover:bg-[#303236] hover:text-white'
            }`}
          >
            <span className="w-4 h-4 flex items-center justify-center text-[#5683da] shrink-0">{item.icon}</span>
            <span className="font-medium text-xs">{item.label}</span>
          </button>
        )
      )}
    </div>
  );
};
