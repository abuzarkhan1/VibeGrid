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

  // Keep the menu inside the viewport
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
      className="fixed z-[60] min-w-[200px] py-1.5 rounded-2xl bg-[#1A1B26] border border-white/10 shadow-2xl  font-sans text-xs animate-fade-in select-none"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, idx) =>
        item.divider ? (
          <div key={`div-${idx}`} className="my-1 h-px bg-white/[0.08]" />
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
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors ${
              item.disabled
                ? 'text-white/40 cursor-not-allowed opacity-50'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="w-4 flex justify-center text-white/70">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        )
      )}
      <div className="my-1 h-px bg-white/[0.08]" />
      <div className="px-3 py-1 text-[10px] font-mono text-white/40">Right-click actions · drag &amp; drop paths</div>
    </div>
  );
};
