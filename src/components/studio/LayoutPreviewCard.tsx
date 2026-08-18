import React from 'react';
import { LayoutPresetDefinition } from '@/types/layoutStudio';
import { PaneNode } from '@/types/layout';

interface LayoutPreviewCardProps {
  preset: LayoutPresetDefinition;
  isSelected: boolean;
  onSelect: () => void;
}

// Recursive mini-tree renderer with subtle scanlines and syntax bars
const MiniTreePreview: React.FC<{ node: PaneNode; depth?: number }> = ({ node, depth = 0 }) => {
  if (node.type === 'terminal') {
    return (
      <div className="relative flex-1 h-full w-full bg-[#1A1B26] border border-white/10 rounded-lg overflow-hidden p-1.5 flex flex-col justify-between select-none">
        {/* Subtle Scanline Shimmer */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />

        {/* Mini Header / Prompt */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[8px] font-mono text-white/70 truncate max-w-[60px]">{node.title || 'term'}</span>
          </div>
          <span className="text-[7px] font-mono text-white/40">zsh</span>
        </div>

        {/* Mini Faux Syntax Lines */}
        <div className="relative z-10 space-y-0.5 my-auto">
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-mono text-violet-400">$</span>
            <div className="h-1 w-8 bg-violet-500/80 rounded-full" />
            <div className="h-1 w-4 bg-ink-muted/60 rounded-full" />
          </div>
          <div className="h-0.5 w-12 bg-emerald-400/70 rounded-full ml-2" />
          <div className="h-0.5 w-10 bg-violet-500/60 rounded-full ml-2" />
        </div>

        {/* Mini Active Prompt Cursor */}
        <div className="relative z-10 flex items-center gap-1">
          <span className="text-[7px] font-mono text-white/40">&gt;</span>
          <span className="w-1 h-2 bg-ink-primary rounded-sm animate-pulse" />
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
          ? 'bg-[#1A1B26] !border-violet-400 ring-1 ring-accent-primary/60 shadow-none'
          : 'bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.06]'
      }`}
    >
      {/* Top Header info */}
      <div className="flex items-center justify-between w-full mb-2.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs !px-1.5 !py-0.5 text-[10px] font-mono font-medium text-white/70 border-white/10">
            {preset.shortcutKey}
          </span>
          <h3 className="font-sans font-semibold text-xs text-white/90 group-hover:text-white transition-colors truncate">
            {preset.name}
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs !px-2 !py-0.5 text-[10px] font-mono font-medium text-white/70 border-white/10">
          {preset.paneCount} {preset.paneCount === 1 ? 'Pane' : 'Panes'}
        </span>
      </div>

      {/* Live Mini Layout Canvas Box (Aspect 16:10) */}
      <div className="w-full h-32 rounded-lg bg-black/30 border border-white/10 p-1.5 overflow-hidden flex items-center justify-center relative">
        <MiniTreePreview node={previewTree} />
        {isSelected && (
          <div className="absolute inset-0 bg-violet-500/[0.08] rounded-lg pointer-events-none" />
        )}
      </div>

      {/* Description & Tags */}
      <p className="mt-2.5 text-xs text-white/70 font-sans line-clamp-1">
        {preset.description}
      </p>
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {preset.tags.map((t) => (
          <span
            key={t}
            className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs !px-1.5 !py-0.5 text-[9px] text-white/40 border-white/10 font-mono"
          >
            #{t}
          </span>
        ))}
      </div>
    </button>
  );
};
