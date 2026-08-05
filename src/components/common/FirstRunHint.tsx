import React, { useEffect, useState } from 'react';
import { Command, Columns, X } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

const FIRST_RUN_KEY = 'vibegrid_first_run_v1';

export const FirstRunHint: React.FC = () => {
  const [visible, setVisible] = useState(false);
  // Customization audit: the auto-dismiss duration is a user setting
  // (0 = stays until dismissed).
  const hintDurationMs = useSettingsStore((s) => s.hintDurationMs);

  useEffect(() => {
    if (hintDurationMs === 0) return; // sticky — never auto-dismiss
    try {
      if (localStorage.getItem(FIRST_RUN_KEY)) return;
      localStorage.setItem(FIRST_RUN_KEY, '1');
      setVisible(true);
      const t = setTimeout(() => setVisible(false), hintDurationMs);
      return () => clearTimeout(t);
    } catch (e) {
      // ignore storage errors
    }
  }, [hintDurationMs]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed top-11 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-3 rounded-xl bg-surfaceCard border border-forest/30 shadow-2xl shadow-black/60 backdrop-blur-md animate-fade-in-up"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest/15 border border-forest/30">
        <Command className="w-4 h-4 text-forest-bright" />
      </div>
      <div className="text-xs">
        <p className="font-semibold text-white/90">Welcome to VibeGrid</p>
        <p className="text-white/50 mt-0.5">
          Press <kbd className="px-1 py-0.5 font-mono bg-white/5 border border-white/10 rounded text-[10px] text-forest-light">Cmd/Ctrl</kbd>
          <kbd className="px-1 py-0.5 font-mono bg-white/5 border border-white/10 rounded text-[10px] text-forest-light ml-1">D</kbd> to split,{' '}
          <span className="inline-flex items-center gap-0.5 align-middle">
            <Columns className="w-3 h-3 text-forest-light inline" />
          </span>{' '}
          <kbd className="px-1 py-0.5 font-mono bg-white/5 border border-white/10 rounded text-[10px] text-forest-light ml-1">Cmd/Ctrl+Shift+P</kbd> for commands
        </p>
      </div>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss welcome hint"
        className="p-1 rounded hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
