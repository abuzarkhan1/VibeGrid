import React, { useEffect, useState } from 'react';
import { Command, Columns, X } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';

const FIRST_RUN_KEY = 'vibegrid_first_run_v1';

export const FirstRunHint: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const hintDurationMs = useSettingsStore((s) => s.hintDurationMs);
  const isOnboardingOpen = useOnboardingStore((s) => s.isOpen);

  useEffect(() => {
    if (hintDurationMs === 0 || isOnboardingOpen) return;
    try {
      if (localStorage.getItem(FIRST_RUN_KEY)) return;
      localStorage.setItem(FIRST_RUN_KEY, '1');
      setVisible(true);
      const t = setTimeout(() => setVisible(false), hintDurationMs);
      return () => clearTimeout(t);
    } catch (e) {
      // ignore storage errors
    }
  }, [hintDurationMs, isOnboardingOpen]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1A1B26] border border-white/15 shadow-2xl font-sans animate-fade-in-up select-none"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-400/30 shadow-sm">
        <Command className="w-4 h-4 text-violet-400" />
      </div>
      <div className="text-xs">
        <p className="font-bold text-white/90">Welcome to VibeGrid</p>
        <p className="text-white/70 mt-0.5 font-sans">
          Press <kbd className="px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] font-mono text-[10px] text-white/90">Cmd/Ctrl+D</kbd> to split,{' '}
          <span className="inline-flex items-center gap-0.5 align-middle">
            <Columns className="w-3 h-3 text-violet-400 inline" />
          </span>{' '}
          <kbd className="px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] font-mono text-[10px] text-white/90 ml-1">Cmd/Ctrl+Shift+P</kbd> for commands
        </p>
      </div>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss welcome hint"
        className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
