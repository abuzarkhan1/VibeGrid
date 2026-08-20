import React, { useEffect, useState } from 'react';
import { Command, X } from 'lucide-react';
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
      // Ignore storage errors in sandbox environments
    }
  }, [hintDurationMs, isOnboardingOpen]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed top-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 rounded-full bg-[#111111] border border-[#4a4b50] shadow-2xl font-sans select-none max-w-2xl"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#303236] border border-[#4a4b50] shadow-sm shrink-0">
        <Command className="w-3 h-3 text-[#5683da]" />
      </div>
      <div className="flex items-center gap-2 text-xs text-[#a9a9aa] min-w-0">
        <span className="font-semibold text-white whitespace-nowrap">Quick Start:</span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <kbd className="px-2 py-0.5 rounded-full bg-[#303236] border border-[#4a4b50] font-mono text-[10px] text-[#5683da]">Cmd/Ctrl+D</kbd>
          <span className="text-[11px]">split</span>
        </span>
        <span className="text-[#4a4b50]">·</span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <kbd className="px-2 py-0.5 rounded-full bg-[#303236] border border-[#4a4b50] font-mono text-[10px] text-[#5683da]">Cmd/Ctrl+Shift+P</kbd>
          <span className="text-[11px]">commands</span>
        </span>
        <span className="text-[#4a4b50]">·</span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <kbd className="px-2 py-0.5 rounded-full bg-[#303236] border border-[#4a4b50] font-mono text-[10px] text-[#5683da]">Cmd/Ctrl+,</kbd>
          <span className="text-[11px]">settings</span>
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss welcome hint"
        className="p-1 rounded-full hover:bg-[#303236] text-[#a9a9aa] hover:text-white transition-all duration-150 cursor-pointer shrink-0 active:scale-95 focus:outline-none focus-visible:border-[#5683da]"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
