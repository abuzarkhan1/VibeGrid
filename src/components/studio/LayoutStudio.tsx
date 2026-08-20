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
    <div className="flex flex-col gap-5 w-full max-w-4xl mx-auto py-1 font-sans select-none">
      {/* Studio Header */}
      <div>
        <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
          <LayoutGrid className="w-4 h-4 text-[#5683da]" />
          <span className="px-2.5 py-0.5 rounded-full bg-[#303236] border border-[#4a4b50] text-[11px] text-[#5683da] font-mono font-medium">
            LAYOUT
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">
          Select Grid Layout
        </h2>
        <p className="text-xs text-[#a9a9aa] mt-1 font-sans">
          Press <kbd className="px-2 py-0.5 rounded-full bg-[#303236] border border-[#4a4b50] text-[10px] font-mono text-white">1</kbd>–<kbd className="px-2 py-0.5 rounded-full bg-[#303236] border border-[#4a4b50] text-[10px] font-mono text-white">8</kbd> to quick switch
        </p>
      </div>

      {/* Preset Picker */}
      <GridTemplatePicker />

      {/* Live Canvas Preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[#a9a9aa] uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#5683da]" />
            <span>PREVIEW</span>
          </span>
          <span className="text-[11px] text-[#a9a9aa] font-mono">
            Live Layout Preview
          </span>
        </div>

        <InteractiveGridCanvas node={draftLayout} />
      </div>
    </div>
  );
};

