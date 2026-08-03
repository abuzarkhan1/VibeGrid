import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface InputModalProps {
  title: string;
  placeholder?: string;
  initialValue?: string;
  maxLength?: number;
  onSave: (value: string) => void;
  onClose: () => void;
}

export const InputModal: React.FC<InputModalProps> = ({
  title,
  placeholder = '',
  initialValue = '',
  maxLength = 50,
  onSave,
  onClose,
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-surfaceCard border border-forest/25 rounded-xl shadow-[0_0_50px_rgba(44,122,64,0.18)] overflow-hidden flex flex-col backdrop-blur-md"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.03]">
          <h3 className="text-xs font-medium text-white/90 uppercase tracking-wider">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <input
            ref={inputRef}
            type="text"
            maxLength={maxLength}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-forest-bright focus:shadow-[0_0_12px_rgba(44,122,64,0.25)]"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/50 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-4 py-1.5 rounded-lg bg-forest hover:bg-forest-bright disabled:opacity-50 text-xs font-medium text-white transition-colors shadow-[0_0_12px_rgba(44,122,64,0.35)]"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
