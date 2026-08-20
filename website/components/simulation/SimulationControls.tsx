'use client';

import React from 'react';
import { Play, Pause, Zap, Sparkles, RotateCcw, LayoutGrid, Maximize2, FileCode } from 'lucide-react';
import { AgentPaneId } from './simulation-types';

interface SimulationControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: 1 | 2 | 4;
  onChangeSpeed: (s: 1 | 2 | 4) => void;
  onTriggerSymphony: () => void;
  symphonyActive: boolean;
  symphonyProgress: number;
  viewMode: 'grid' | 'focused' | 'diff';
  onChangeViewMode: (m: 'grid' | 'focused' | 'diff') => void;
  onReset: () => void;
  activePaneId: AgentPaneId;
  totalTokensGenerated: number;
}

export function SimulationControls({
  isPlaying,
  onTogglePlay,
  speed,
  onChangeSpeed,
  onTriggerSymphony,
  symphonyActive,
  symphonyProgress,
  viewMode,
  onChangeViewMode,
  onReset,
  activePaneId,
  totalTokensGenerated,
}: SimulationControlsProps) {
  return (
    <div className="space-y-3">
      {/* Main Controls Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-[10px] bg-[#111111] border border-[#4a4b50] shadow-sm select-none">
        
        {/* Left Side: Auto-Stream Play/Pause + Speed Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Auto-Stream Toggle Button */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[6px] font-mono text-xs font-semibold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-[#090a0c] text-emerald-400 border border-emerald-500/50 hover:bg-emerald-950/20'
                : 'bg-[#303236] text-amber-300 border border-amber-500/60 hover:bg-[#3d3f44]'
            }`}
            title={isPlaying ? 'Pause live simulation' : 'Resume live simulation'}
          >
            {isPlaying ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Pause size={13} className="text-emerald-400" />
                <span>Auto-Stream (Playing)</span>
              </>
            ) : (
              <>
                <Play size={13} className="text-amber-400" />
                <span>Stream Paused</span>
              </>
            )}
          </button>

          {/* Speed Selector: 1x / 2x / 4x */}
          <div className="flex items-center rounded-[6px] bg-[#090a0c] border border-[#4a4b50] p-0.5 font-mono text-xs">
            <span className="px-2 py-0.5 text-[11px] text-[#6b6c6d] font-medium hidden sm:inline">
              Speed:
            </span>
            {([1, 2, 4] as const).map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-2.5 py-1 rounded-[4px] font-bold text-xs transition-colors cursor-pointer ${
                  speed === s
                    ? 'bg-[#5683da] text-white shadow-xs'
                    : 'text-[#a9a9aa] hover:text-white hover:bg-[#1a1b1e]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Reset Loop Button */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-[#090a0c] text-[#a9a9aa] hover:text-white border border-[#4a4b50] text-xs font-mono transition-colors cursor-pointer"
            title="Reset simulation loop"
          >
            <RotateCcw size={12} />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>

        {/* Center/Right: Multi-Agent Symphony Master Trigger */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="hidden lg:flex items-center rounded-[6px] bg-[#090a0c] border border-[#4a4b50] p-0.5 font-mono text-xs">
            <button
              onClick={() => onChangeViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#303236] text-white'
                  : 'text-[#a9a9aa] hover:text-white'
              }`}
              title="2x2 Multi-pane Grid view"
            >
              <LayoutGrid size={12} />
              <span>Grid (4 Panes)</span>
            </button>
            <button
              onClick={() => onChangeViewMode('focused')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'focused'
                  ? 'bg-[#303236] text-white'
                  : 'text-[#a9a9aa] hover:text-white'
              }`}
              title="Focused single pane inspector"
            >
              <Maximize2 size={12} />
              <span>Focused</span>
            </button>
            <button
              onClick={() => onChangeViewMode('diff')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'diff'
                  ? 'bg-[#303236] text-white'
                  : 'text-[#a9a9aa] hover:text-white'
              }`}
              title="Inspect AST Diff & Patch"
            >
              <FileCode size={12} />
              <span>Diff</span>
            </button>
          </div>

          {/* Trigger Multi-Agent Symphony Flagship Button */}
          <button
            onClick={onTriggerSymphony}
            disabled={symphonyActive}
            className={`relative group overflow-hidden flex items-center gap-2 px-4 py-1.5 rounded-[6px] font-mono text-xs font-bold transition-all cursor-pointer shadow-md select-none ${
              symphonyActive
                ? 'bg-[#5683da]/40 text-white border border-[#5683da] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#5683da] via-[#7b61ff] to-[#ff8964] text-white hover:brightness-110 active:scale-[0.98]'
            }`}
          >
            <Sparkles size={14} className={symphonyActive ? 'animate-spin' : 'group-hover:scale-110 transition-transform'} />
            <span>Trigger Multi-Agent Symphony</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-black/30 text-[10px] font-mono text-white/80">
              ⌘S
            </span>
          </button>
        </div>
      </div>

      {/* Symphony Active Animated Progress Bar HUD */}
      {symphonyActive && (
        <div className="rounded-[8px] bg-[#090a0c] border border-[#5683da] p-3 text-xs font-mono animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="h-2 w-2 rounded-full bg-[#5683da] animate-ping" />
              <span className="text-[#5683da]">SYMPHONY COORDINATION ACTIVE:</span>
              <span className="text-[#e5e5e7]">Dispatched simultaneous task across 4 panes</span>
            </div>
            <span className="font-bold text-[#5683da]">{symphonyProgress}%</span>
          </div>

          <div className="w-full bg-[#111111] h-1.5 rounded-full overflow-hidden border border-[#4a4b50]/60">
            <div
              className="h-full bg-gradient-to-r from-[#5683da] via-[#27c93f] to-[#ff8964] transition-all duration-150"
              style={{ width: `${symphonyProgress}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-[#a9a9aa]">
            <span>1. AST Patch Synthesized</span>
            <span>→</span>
            <span>2. Cargo Tests Passing</span>
            <span>→</span>
            <span>3. Next.js HMR 60 FPS</span>
            <span>→</span>
            <span>4. Ollama Air-Gap 0 Egress</span>
          </div>
        </div>
      )}
    </div>
  );
}
