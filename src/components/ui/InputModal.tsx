import React, { useState, useEffect, useRef } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { isTauri } from '@/lib/tauri';

interface InputModalProps {
  title: string;
  description?: string;
  placeholder?: string;
  initialValue?: string;
  maxLength?: number;
  onBrowse?: (path: string) => void;
  onSave: (value: string) => void;
  onClose: () => void;
}

export const InputModal: React.FC<InputModalProps> = ({
  title,
  description,
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans"
    >
      <form
        ref={panelRef}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#181924] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider font-mono">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {description && (
            <p className="text-xs text-white/50 leading-relaxed font-sans">{description}</p>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              maxLength={maxLength}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors font-sans"
            />
            {onBrowse && (
              <button
                type="button"
                onClick={handleBrowse}
                title="Browse folder"
                aria-label="Browse folder"
                className="h-10 px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-white/70 hover:text-white transition-colors shrink-0 cursor-pointer"
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

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.06] bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex items-center px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-white/90 text-[13px] font-normal transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="h-10 flex items-center px-4 rounded-2xl bg-white text-black hover:bg-white/90 text-[13px] font-semibold shadow-sm transition-all disabled:opacity-40 cursor-pointer"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};
