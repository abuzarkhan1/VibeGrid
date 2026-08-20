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
            className={`group relative flex flex-col p-2.5 rounded-xl border text-left transition-all duration-150 select-none cursor-pointer ${
              isSelected
                ? 'bg-[#303236] !border-[#5683da] ring-1 ring-[#5683da] shadow-none scale-[1.01]'
                : 'bg-[#303236] hover:bg-[#303236]/80 hover:border-[#5683da] border border-[#4a4b50]'
            }`}
          >
            {/* Visual Blueprint Wireframe */}
            <BlueprintWireframe type={opt.wireframeType} isSelected={isSelected} />

            {/* Title & Tag Row */}
            <div className="mt-2.5 flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-sans font-semibold text-xs text-white group-hover:text-[#5683da] transition-colors truncate">
                  {opt.title}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#111111] border border-[#4a4b50] text-[10px] font-mono text-[#a9a9aa] shrink-0">
                {opt.gridTag}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
