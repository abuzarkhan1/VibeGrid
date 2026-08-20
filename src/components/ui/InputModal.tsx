import React, { useState, useEffect, useRef } from 'react';
import { X, FolderOpen, Edit3 } from 'lucide-react';
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
      className="fixed inset-0 z-50 bg-[#090a0c]/80 flex items-center justify-center p-4 animate-fade-in font-sans select-none"
    >
      <form
        ref={panelRef}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#111111] border border-[#4a4b50] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#4a4b50] bg-[#111111]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#090a0c] border border-[#4a4b50] flex items-center justify-center text-[#5683da] shrink-0">
              {onBrowse ? <FolderOpen className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-full hover:bg-[#303236] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {description && (
            <p className="text-xs text-[#a9a9aa] leading-relaxed font-sans">{description}</p>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              maxLength={maxLength}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white placeholder-[#a9a9aa]/50 focus:outline-none focus:border-[#5683da] focus:ring-1 focus:ring-[#5683da] transition-colors font-sans"
            />
            {onBrowse && (
              <button
                type="button"
                onClick={handleBrowse}
                title="Browse folder"
                aria-label="Browse folder"
                className="h-10 px-3.5 rounded-full bg-[#303236] hover:bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] text-xs text-[#a9a9aa] hover:text-white transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#a9a9aa] font-mono">
            <span>Press Enter to save</span>
            <span>
              {value.length}/{maxLength}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#4a4b50] bg-[#111111]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 flex items-center px-4 rounded-full bg-[#303236] hover:bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] text-[#a9a9aa] hover:text-white text-[13px] font-medium transition-all active:scale-95 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="h-9 flex items-center px-5 rounded-full bg-[#5683da] hover:bg-[#5683da]/90 text-white text-[13px] font-medium shadow-sm transition-all active:scale-95 disabled:scale-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};
