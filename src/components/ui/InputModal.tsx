import React, { useState, useEffect, useRef } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { isTauri } from '@/lib/tauri';

interface InputModalProps {
  title: string;
  placeholder?: string;
  initialValue?: string;
  maxLength?: number;
  /** Optional native folder-picker button (audit: folder picker was a text field only). */
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

  // Native folder picker (Tauri dialog plugin). Falls back to the text field in
  // web preview mode.
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
    >
      <form
        ref={panelRef}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-surface/95 border border-border/[0.08] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col backdrop-blur-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <h3 className="text-xs font-bold font-space text-foreground/90 uppercase tracking-wider">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg hover:bg-border/10 text-foreground/50 hover:text-foreground/80 transition-colors"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-background/40 border border-border/[0.08] text-xs font-space font-medium text-foreground/90 placeholder-muted/30 focus:outline-none focus:border-border/30"
            />
            {onBrowse && (
              <button
                type="button"
                onClick={handleBrowse}
                title="Browse folders…"
                aria-label="Browse folders"
                className="shrink-0 px-3.5 py-2.5 rounded-xl bg-border/[0.04] border border-border/10 text-foreground/60 hover:text-foreground hover:border-border/30 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl border border-border/10 text-xs font-mono uppercase tracking-wider text-muted hover:text-foreground hover:bg-border/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-5 py-2 rounded-2xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 text-xs font-extrabold font-space transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
