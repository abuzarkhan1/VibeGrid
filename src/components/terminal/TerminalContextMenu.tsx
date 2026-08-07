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
    if (rect.right > window.innerWidth) el.style.left = `${window.innerWidth - rect.width - 8}px`;
    if (rect.bottom > window.innerHeight) el.style.top = `${window.innerHeight - rect.height - 8}px`;
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
      className="fixed z-[60] min-w-[190px] py-1.5 rounded-xl bg-zinc-900/95 border border-white/[0.08] shadow-2xl backdrop-blur-xl font-mono text-xs animate-fade-in"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, idx) =>
        item.divider ? (
          <div key={`div-${idx}`} className="my-1 h-px bg-white/[0.06]" />
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
                ? 'text-white/25 cursor-not-allowed'
                : 'text-zinc-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="w-4 flex justify-center text-zinc-400">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      )}
      <div className="my-1 h-px bg-white/[0.06]" />
      <div className="px-3 py-1 text-[10px] text-zinc-500">Right-click actions · drag &amp; drop paths to insert</div>
    </div>
  );
};
