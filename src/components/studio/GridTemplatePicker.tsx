import React from 'react';
import { PresetCount } from '@/types/layout';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { BlueprintWireframe, WireframeType } from './BlueprintWireframe';

export interface GridPresetOption {
  id: PresetCount | 'ai-pair';
  title: string;
  gridTag: string;
  panesCount: number;
  wireframeType: WireframeType;
  shortcutKey: string;
  badge?: string;
}

export const PRESET_OPTIONS: GridPresetOption[] = [
  {
    id: 'ai-pair',
    title: 'AI Pair',
    gridTag: '1+2',
    panesCount: 3,
    wireframeType: 'golden',
    shortcutKey: '1',
    badge: 'POPULAR',
  },
  {
    id: 1,
    title: 'Solo Focus',
    gridTag: '1x1',
    panesCount: 1,
    wireframeType: 'solo',
    shortcutKey: '2',
  },
  {
    id: 2,
    title: 'Dual Vertical',
    gridTag: '1x2',
    panesCount: 2,
    wireframeType: 'dual-v',
    shortcutKey: '3',
  },
  {
    id: 3,
    title: 'Triple Column',
    gridTag: '1x3',
    panesCount: 3,
    wireframeType: 'triple',
    shortcutKey: '4',
  },
  {
    id: 4,
    title: 'Quad Swarm',
    gridTag: '2x2',
    panesCount: 4,
    wireframeType: 'quad',
    shortcutKey: '5',
    badge: 'SWARM',
  },
  {
    id: 6,
    title: 'Hex Matrix',
    gridTag: '3x2',
    panesCount: 6,
    wireframeType: 'hex',
    shortcutKey: '6',
  },
  {
    id: 8,
    title: 'Octa Fleet',
    gridTag: '4x2',
    panesCount: 8,
    wireframeType: 'octa',
    shortcutKey: '7',
  },
  {
    id: 16,
    title: 'Mega Matrix',
    gridTag: '4x4',
    panesCount: 16,
    wireframeType: 'mega',
    shortcutKey: '8',
    badge: 'FLEET',
  },
];

export const GridTemplatePicker: React.FC = () => {
  const presetSelected = useOnboardingStore((s) => s.presetSelected);
  const setPresetSelected = useOnboardingStore((s) => s.setPresetSelected);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {PRESET_OPTIONS.map((opt) => {
        const isSelected = presetSelected === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setPresetSelected(opt.id)}
            className={`group relative flex flex-col p-2.5 rounded-xl border text-left transition-all duration-150 select-none ${
              isSelected
                ? 'bg-[#1A1B26] !border-violet-400 ring-1 ring-accent-primary/60 shadow-none scale-[1.01]'
                : 'bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14] border border-white/[0.06]'
            }`}
          >
            {/* Visual Blueprint Wireframe */}
            <BlueprintWireframe type={opt.wireframeType} isSelected={isSelected} />

            {/* Title & Tag Row */}
            <div className="mt-2.5 flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-sans font-semibold text-xs text-white/90 truncate">
                  {opt.title}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs !px-1.5 !py-0.5 text-[10px] font-mono text-white/70 border-white/10">
                  {opt.gridTag}
                </span>
              </div>

              {/* Instant Keyboard Shortcut Keycap Badge */}
              <kbd className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs !min-w-[18px] !h-[18px] !px-1 text-[10px] font-mono font-semibold text-white/70 group-hover:text-white/90 group-hover:border-white/30">
                {opt.shortcutKey}
              </kbd>
            </div>

            {/* Optional Badge */}
            {opt.badge && (
              <div className="absolute top-2 right-2">
                <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs !px-1.5 !py-0.5 text-[9px] font-mono uppercase tracking-wider font-semibold !text-violet-400 !border-violet-400/30 !bg-accent/20">
                  {opt.badge}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
