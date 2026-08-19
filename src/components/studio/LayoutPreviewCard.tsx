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
      <div className="relative flex-1 h-full w-full bg-black/60 border border-white/10 rounded-lg overflow-hidden p-1.5 flex flex-col justify-between select-none">
        {}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />

        {}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
            <span className="text-[8px] font-mono text-white/70 truncate max-w-[60px]">{node.title || 'term'}</span>
          </div>
          <span className="text-[7px] font-mono text-white/40">zsh</span>
        </div>

        {}
        <div className="relative z-10 space-y-0.5 my-auto">
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-mono text-white/80">$</span>
            <div className="h-1 w-8 bg-white/60 rounded-full" />
            <div className="h-1 w-4 bg-white/30 rounded-full" />
          </div>
          <div className="h-0.5 w-12 bg-white/40 rounded-full ml-2" />
          <div className="h-0.5 w-10 bg-white/30 rounded-full ml-2" />
        </div>

        {}
        <div className="relative z-10 flex items-center gap-1">
          <span className="text-[7px] font-mono text-white/40">&gt;</span>
          <span className="w-1 h-2 bg-white/90 rounded-sm animate-pulse" />
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
      className={`group relative flex flex-col text-left p-3 rounded-xl transition-all duration-200 outline-none select-none ${
        isSelected
          ? 'bg-white/[0.06] border border-white/80 ring-1 ring-white/10 shadow-none'
          : 'bg-white/[0.02] border border-white/10 hover:border-white/30 hover:bg-white/[0.04]'
      }`}
    >
      {/* Top Header info */}
      <div className="flex items-center justify-between w-full mb-2.5">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono font-medium text-white/70">
            {preset.shortcutKey}
          </span>
          <h3 className="font-sans font-semibold text-xs text-white/90 group-hover:text-white transition-colors truncate">
            {preset.name}
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono font-medium text-white/70">
          {preset.paneCount} {preset.paneCount === 1 ? 'Pane' : 'Panes'}
        </span>
      </div>

      {/* Live Mini Layout Canvas Box (Aspect 16:10) */}
      <div className="w-full h-32 rounded-lg bg-black/60 border border-white/10 p-1.5 overflow-hidden flex items-center justify-center relative">
        <MiniTreePreview node={previewTree} />
        {isSelected && (
          <div className="absolute inset-0 bg-white/[0.05] rounded-lg pointer-events-none" />
        )}
      </div>

      {/* Description & Tags */}
      <p className="mt-2.5 text-xs text-white/40 font-sans line-clamp-1">
        {preset.description}
      </p>
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {preset.tags.map((t) => (
          <span
            key={t}
            className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] text-white/40 font-mono"
          >
            #{t}
          </span>
        ))}
      </div>
    </button>
  );
};
