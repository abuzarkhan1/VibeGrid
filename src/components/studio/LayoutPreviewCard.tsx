import React from 'react';
import { LayoutPresetDefinition } from '@/types/layoutStudio';
import { PaneNode } from '@/types/layout';

interface LayoutPreviewCardProps {
  preset: LayoutPresetDefinition;
  isSelected: boolean;
  onSelect: () => void;
}

const MiniTreePreview: React.FC<{ node: PaneNode; depth?: number }> = ({ node, depth = 0 }) => {
  if (node.type === 'terminal') {
    return (
      <div className="relative flex-1 h-full w-full bg-[#111111] border border-[#4a4b50] rounded-lg overflow-hidden p-1.5 flex flex-col justify-between select-none">
        {/* Terminal Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a9a9aa]" />
            <span className="text-[8px] font-mono text-[#a9a9aa] truncate max-w-[60px]">{node.title || 'term'}</span>
          </div>
          <span className="text-[7px] font-mono text-[#a9a9aa]">zsh</span>
        </div>

        {/* Terminal Code Simulation */}
        <div className="relative z-10 space-y-0.5 my-auto">
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-mono text-[#5683da]">$</span>
            <div className="h-1 w-8 bg-[#a9a9aa] rounded-full" />
            <div className="h-1 w-4 bg-[#a9a9aa] opacity-50 rounded-full" />
          </div>
          <div className="h-0.5 w-12 bg-[#a9a9aa] opacity-40 rounded-full ml-2" />
          <div className="h-0.5 w-10 bg-[#a9a9aa] opacity-30 rounded-full ml-2" />
        </div>

        {/* Terminal Prompt Indicator */}
        <div className="relative z-10 flex items-center gap-1">
          <span className="text-[7px] font-mono text-[#a9a9aa]">&gt;</span>
          <span className="w-1 h-2 bg-[#5683da] rounded-sm" />
        </div>
      </div>
    );
  }

  const isVert = node.direction === 'vertical';
  return (
    <div
      className={`flex-1 h-full w-full flex ${isVert ? 'flex-col' : 'flex-row'} gap-1 p-0.5`}
    >
      <div style={{ flex: node.ratio }}>
        <MiniTreePreview node={node.children[0]} depth={depth + 1} />
      </div>
      <div style={{ flex: 1 - node.ratio }}>
        <MiniTreePreview node={node.children[1]} depth={depth + 1} />
      </div>
    </div>
  );
};

export const LayoutPreviewCard: React.FC<LayoutPreviewCardProps> = ({
  preset,
  isSelected,
  onSelect,
}) => {
  const previewTree = React.useMemo(() => preset.generator(), [preset]);

  return (
    <button
      onClick={onSelect}
      className={`group relative flex flex-col text-left p-3.5 rounded-2xl transition-all duration-150 outline-none select-none cursor-pointer ${
        isSelected
          ? 'bg-[#303236] border border-[#5683da] ring-1 ring-[#5683da]'
          : 'bg-[#303236] border border-[#4a4b50] hover:border-[#5683da]'
      }`}
    >
      {/* Top Header info */}
      <div className="flex items-center justify-between w-full mb-2.5">
        <h3 className="font-sans font-semibold text-xs text-white group-hover:text-[#5683da] transition-colors truncate">
          {preset.name}
        </h3>
        <span className="px-2.5 py-0.5 rounded-full bg-[#111111] border border-[#4a4b50] text-[10px] font-mono font-medium text-[#a9a9aa] shrink-0">
          {preset.paneCount} {preset.paneCount === 1 ? 'Pane' : 'Panes'}
        </span>
      </div>

      {/* Live Mini Layout Canvas Box */}
      <div className="w-full h-28 rounded-xl bg-[#111111] border border-[#4a4b50] p-1.5 overflow-hidden flex items-center justify-center relative">
        <MiniTreePreview node={previewTree} />
        {isSelected && (
          <div className="absolute inset-0 bg-[#5683da]/10 rounded-xl pointer-events-none" />
        )}
      </div>
    </button>
  );
};

