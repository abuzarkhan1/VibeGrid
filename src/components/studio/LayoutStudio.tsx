import React, { useEffect } from 'react';
import { GridTemplatePicker, PRESET_OPTIONS } from './GridTemplatePicker';
import { InteractiveGridCanvas } from './InteractiveGridCanvas';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { LayoutGrid, Sparkles } from 'lucide-react';

export const LayoutStudio: React.FC = () => {
  const draftLayout = useOnboardingStore((s) => s.draftLayout);
  const setPresetSelected = useOnboardingStore((s) => s.setPresetSelected);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {

      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= PRESET_OPTIONS.length) {
        const targetPreset = PRESET_OPTIONS[num - 1];
        if (targetPreset) {
          e.preventDefault();
          setPresetSelected(targetPreset.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPresetSelected]);

  return (
    <div className="flex flex-col gap-5 w-full max-w-4xl mx-auto py-1">
      {}
      <div>
        <div className="flex items-center gap-2 text-violet-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
          <LayoutGrid className="w-4 h-4" />
          <span className="px-2 py-0.5 rounded-md bg-violet-400/10 border border-violet-400/20 text-[11px] text-violet-400 font-mono">LAYOUT</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white/90 tracking-tight font-sans">
          Select Grid Layout
        </h2>
        <p className="text-xs text-white/70 mt-1 font-sans">
          Choose a terminal geometry for your development workflow. Press <kbd className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs !px-1.5 !py-0.5 text-[10px] font-mono text-white/90">1</kbd>–<kbd className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs !px-1.5 !py-0.5 text-[10px] font-mono text-white/90">8</kbd> to quick switch.
        </p>
      </div>

      {}
      <GridTemplatePicker />

      {}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>PREVIEW</span>
          </span>
          <span className="text-[11px] text-white/40 font-mono">
            Auto-adapts to active pane count
          </span>
        </div>

        <InteractiveGridCanvas node={draftLayout} />
      </div>
    </div>
  );
};
