'use client';

import React from 'react';
import { Circle, Folder, Terminal, Sparkles, LayoutGrid } from 'lucide-react';

export type DesktopLayoutPresetId =
  | 'solo'
  | 'dual'
  | 'quad'
  | 'hero'
  | 'hex'
  | 'hive'
  | 'matrix';

export interface LayoutPresetConfig {
  id: DesktopLayoutPresetId;
  count: number;
  label: string;
  tag: string;
  description: string;
  grid?: number[][];
  isHero?: boolean;
}

export const DESKTOP_LAYOUT_PRESETS: LayoutPresetConfig[] = [
  {
    id: 'solo',
    count: 1,
    label: 'Solo',
    tag: '1×1',
    description: 'Single focused terminal pane for concentrated tasks and deep focus.',
    grid: [[1]],
  },
  {
    id: 'dual',
    count: 2,
    label: 'Dual',
    tag: '1×2',
    description: 'Side-by-side pairing layout for parallel agent development and diffing.',
    grid: [[1, 2]],
  },
  {
    id: 'quad',
    count: 4,
    label: 'Quad',
    tag: '2×2',
    description: 'Balanced 4-pane quadrant matrix for full-stack multi-agent workflows.',
    grid: [
      [1, 2],
      [3, 4],
    ],
  },
  {
    id: 'hero',
    count: 4,
    label: 'Hero',
    tag: '1+3',
    description: 'Primary commanding widescreen pane with 3 stacked side-monitor terminals.',
    isHero: true,
  },
  {
    id: 'hex',
    count: 6,
    label: 'Hex',
    tag: '3×2',
    description: '6-pane high-density orchestrator for multi-process compilation and logging.',
    grid: [
      [1, 2, 3],
      [4, 5, 6],
    ],
  },
  {
    id: 'hive',
    count: 9,
    label: 'Hive',
    tag: '3×3',
    description: '9-pane swarm cluster for autonomous microservices and agent swarms.',
    grid: [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ],
  },
  {
    id: 'matrix',
    count: 16,
    label: 'Matrix',
    tag: '4×4',
    description: '16-pane mega canvas with 60 FPS WebGL hardware acceleration.',
    grid: [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ],
  },
];

interface LayoutBlueprintProps {
  preset: LayoutPresetConfig;
}

export const LayoutBlueprint: React.FC<LayoutBlueprintProps> = ({ preset }) => {
  const svgW = 64;
  const svgH = 40;
  const gap = 3;

  if (preset.isHero) {
    // Hero 1+3: Large left rect (width 61%) + 3 right stacked rects
    const leftW = Math.floor(svgW * 0.61);
    const rightX = leftW + gap;
    const rightW = svgW - rightX;
    const rightItemH = (svgH - gap * 2) / 3;

    return (
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="shrink-0 transition-transform duration-300 group-hover:scale-105"
      >
        {/* Left Hero Pane */}
        <rect
          x={0.5}
          y={0.5}
          width={leftW - 1}
          height={svgH - 1}
          rx={2}
          fill="currentColor"
          className="text-white/20 group-hover:text-white/95 transition-colors duration-300"
        />
        {/* 3 Right Stacked Monitor Panes */}
        {[0, 1, 2].map((idx) => (
          <rect
            key={idx}
            x={rightX + 0.5}
            y={idx * (rightItemH + gap) + 0.5}
            width={Math.max(1, rightW - 1)}
            height={Math.max(1, rightItemH - 1)}
            rx={1.5}
            fill="currentColor"
            className="text-white/15 group-hover:text-white/80 transition-colors duration-300"
          />
        ))}
      </svg>
    );
  }

  const grid = preset.grid || [[1]];
  const rows = grid.length;
  const cols = grid[0].length;
  const cellW = (svgW - gap * (cols - 1)) / cols;
  const cellH = (svgH - gap * (rows - 1)) / rows;

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      className="shrink-0 transition-transform duration-300 group-hover:scale-105"
    >
      {grid.map((row, r) =>
        row.map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * (cellW + gap) + 0.5}
            y={r * (cellH + gap) + 0.5}
            width={Math.max(1, cellW - 1)}
            height={Math.max(1, cellH - 1)}
            rx={1.5}
            fill="currentColor"
            className="text-white/15 group-hover:text-white/90 transition-colors duration-300"
          />
        ))
      )}
    </svg>
  );
};

export interface DesktopCentralPromptCardProps {
  workspaceName?: string;
  workspacePath?: string;
  onLaunchPreset?: (presetId: DesktopLayoutPresetId, count: number) => void;
  activePresetId?: DesktopLayoutPresetId;
  className?: string;
}

export const DesktopCentralPromptCard: React.FC<DesktopCentralPromptCardProps> = ({
  workspaceName = 'VibeGrid Workspace',
  workspacePath = '~/vibegrid/core',
  onLaunchPreset,
  activePresetId,
  className = '',
}) => {
  const handleLaunch = (preset: LayoutPresetConfig) => {
    if (onLaunchPreset) {
      onLaunchPreset(preset.id, preset.count);
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center w-full min-h-full px-4 sm:px-6 py-6 select-none font-sans text-white ${className}`}
    >
      {/* Main Pure Black Transparent Glass Container */}
      <div className="relative w-full max-w-4xl p-6 sm:p-10 md:p-12 rounded-3xl border border-white/[0.08] bg-black/75 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Ambient Top Glow for Glass Pop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-white/[0.03] blur-[100px] pointer-events-none" />

        <div className="relative space-y-8 sm:space-y-10">
          {/* Workspace Identity Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 backdrop-blur-md shadow-inner text-white/80">
                <Folder className="w-5 h-5 text-white/80" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#10b981] border-2 border-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-white/90 tracking-wide">
                    {workspaceName}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 hidden sm:inline">
                    {workspacePath}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Circle className="w-2 h-2 fill-[#10b981] text-[#10b981] animate-pulse" />
                  <div className="text-xs text-white/70 font-mono">
                    Ready to launch workspace · 0.4ms PTY
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs font-mono text-white/70 uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
                WORKSPACE HUB
              </div>
            </div>
          </div>

          {/* Layout Preset Matrix Grid */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2 text-xs font-mono text-white/70 uppercase tracking-widest">
                <LayoutGrid className="w-3.5 h-3.5 text-[#5683da]" />
                <span>Select Layout Matrix</span>
              </div>
              <div className="text-xs font-mono text-white/50">
                {DESKTOP_LAYOUT_PRESETS.length} Presets Available
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {DESKTOP_LAYOUT_PRESETS.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleLaunch(preset)}
                    className={`group relative flex flex-col items-start justify-between gap-3.5 p-4 sm:p-5 rounded-2xl transition-all duration-300 cursor-pointer text-left overflow-hidden border ${
                      isActive
                        ? 'bg-white/[0.08] border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)] ring-1 ring-white/30'
                        : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06] hover:border-white/[0.2] hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between">
                      <LayoutBlueprint preset={preset} />
                      <span className="text-xs font-mono text-white/50 group-hover:text-white/90 transition-colors px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                        {preset.tag}
                      </span>
                    </div>

                    <div className="w-full space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                          {preset.label}
                        </span>
                        <span className="text-[11px] font-mono text-white/40 group-hover:text-white/70 transition-colors">
                          {preset.count} {preset.count === 1 ? 'Pane' : 'Panes'}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed font-sans">
                        {preset.description}
                      </p>
                    </div>

                    <div className="w-full pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-white/40 group-hover:text-white/80 transition-colors">
                      <span>Click to launch</span>
                      <span className="text-[#5683da] font-bold group-hover:translate-x-0.5 transition-transform">
                        →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Launch Pro-Tip Footer */}
          <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-white/50 font-mono">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#5683da]" />
              <span>Tip: You can dynamically split, resize, and maximize any terminal pane anytime.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                ⌘⇧D Split
              </span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                ⌘⇧↵ Maximize
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
