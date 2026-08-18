import React, { useState, useEffect, useRef } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { isTauri } from '@/lib/tauri';

interface InputModalProps {
  title: string;
  placeholder?: string;
  initialValue?: string;
  maxLength?: number;
  onBrowse?: (path: string) => void;
  onSave: (value: string) => void;
  onClose: () => void;
}

export const InputModal: React.FC<InputModalProps> = ({
  title,
  placeholder = '',
  initialValue = '',
  maxLength = 50,
  onBrowse,
  onSave,
  onClose,
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useFocusTrap<HTMLFormElement>(true);

  const handleBrowse = async () => {
    if (!onBrowse || !isTauri()) return;
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({ directory: true, multiple: false, title: 'Choose Folder' });
      if (typeof selected === 'string' && selected) {
        setValue(selected);
        onBrowse(selected);
      }
    } catch (e) {
      console.warn('[VibeGrid] Native folder picker failed:', e);
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSave(value.trim());
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 bg-black/70  flex items-center justify-center p-4 animate-fade-in font-sans"
    >
      <form
        ref={panelRef}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#1A1B26] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.03]">
          <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              maxLength={maxLength}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white/90 placeholder:text-white/30 focus:outline-none focus:border-violet-400/60 focus:ring-1 focus:ring-accent-primary/30 transition-all font-sans"
            />
            {onBrowse && (
              <button
                type="button"
                onClick={handleBrowse}
                title="Browse folder"
                aria-label="Browse folder"
                className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs px-3 py-2 text-white/70 hover:text-white transition-colors shrink-0"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex justify-between items-center text-[10px] text-white/40 font-mono">
            <span>Press Enter to save</span>
            <span>
              {value.length}/{maxLength}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs px-3.5 py-1.5 text-xs font-medium text-white/70 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="px-4 py-1.5 rounded-full bg-violet-500 hover:bg-violet-500/90 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};
