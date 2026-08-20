'use client';

import React from 'react';
import {
  Terminal,
  Grid,
  Bot,
  Palette,
  Search,
  Maximize2,
  Minimize2,
  Activity,
  Layers,
  GitCommit,
  Keyboard,
  Sparkles,
  Play,
  Pause,
} from 'lucide-react';
import { DemoTheme } from './demoThemes';

interface DesktopTitlebarProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  workspaceName: string;
  workspaceEmoji: string;
  viewMode: 'grid' | 'hub' | 'telemetry';
  onChangeViewMode: (mode: 'grid' | 'hub' | 'telemetry') => void;
  currentTheme: DemoTheme;
  onOpenAgentLauncher: () => void;
  onOpenLayoutStudio: () => void;
  onOpenThemeStudio: () => void;
  onOpenDiffViewer: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onToast: (title: string, desc: string, type?: 'success' | 'info' | 'agent') => void;
}

export function DesktopTitlebar({
  isFullscreen,
  onToggleFullscreen,
  workspaceName,
  workspaceEmoji,
  viewMode,
  onChangeViewMode,
  currentTheme,
  onOpenAgentLauncher,
  onOpenLayoutStudio,
  onOpenThemeStudio,
  onOpenDiffViewer,
  onOpenCommandPalette,
  onOpenShortcuts,
  isStreaming,
  onToggleStreaming,
  onToast,
}: DesktopTitlebarProps) {
  return (
    <header
      className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 bg-[#090a0c] border-b border-[#4a4b50]/60 text-xs font-mono select-none shrink-0 z-30"
      style={{
        backgroundColor: currentTheme.bgHeader || '#090a0c',
        borderColor: `${currentTheme.border}90`,
      }}
    >
      {/* Left: macOS Traffic Lights + Workspace Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 mr-1">
          {/* Close / Reset */}
          <button
            type="button"
            onClick={() => onToast('Desktop Window Active', 'VibeGrid desktop runtime window preserved.', 'info')}
            className="w-3 h-3 rounded-full bg-[#ef4444] border border-[#dc2626]/50 inline-block hover:brightness-125 transition-all cursor-pointer"
            title="Close Window (Preserved)"
            aria-label="Close"
          />
          {/* Minimize */}
          <button
            type="button"
            onClick={() => onToast('System Tray', 'VibeGrid minimized to background menu bar.', 'info')}
            className="w-3 h-3 rounded-full bg-[#eab308] border border-[#ca8a04]/50 inline-block hover:brightness-125 transition-all cursor-pointer"
            title="Minimize to Tray"
            aria-label="Minimize"
          />
          {/* Fullscreen / Maximize */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="w-3 h-3 rounded-full bg-[#22c55e] border border-[#16a34a]/50 inline-block hover:brightness-125 transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen Window'}
            aria-label="Toggle Fullscreen"
          />
        </div>

        <span className="text-[#4a4b50] hidden sm:inline">|</span>

        {/* Active Workspace Tag */}
        <div className="flex items-center gap-2">
          <span
            className="font-bold flex items-center gap-1.5 truncate max-w-[160px] sm:max-w-[220px]"
            style={{ color: currentTheme.accentPrimary }}
          >
            <Terminal size={13} className="shrink-0" />
            <span className="truncate">
              {workspaceEmoji} {workspaceName}
            </span>
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#111111] border border-[#4a4b50]/60 text-[#a9a9aa] hidden md:inline">
            git: main*
          </span>
        </div>
      </div>

      {/* Center: View Switcher Tabs (Grid / Hub / Telemetry) */}
      <div className="flex items-center bg-[#111111] p-0.5 rounded-[8px] border border-[#4a4b50]/50 text-xs">
        <button
          type="button"
          onClick={() => onChangeViewMode('grid')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] transition-all cursor-pointer font-medium ${
            viewMode === 'grid'
              ? 'bg-[#303236] text-white shadow-sm border border-[#4a4b50]'
              : 'text-[#a9a9aa] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Grid size={12} className="text-[#10b981]" />
          <span>Grid</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeViewMode('hub')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] transition-all cursor-pointer font-medium ${
            viewMode === 'hub'
              ? 'bg-[#303236] text-white shadow-sm border border-[#4a4b50]'
              : 'text-[#a9a9aa] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Sparkles size={12} className="text-[#5683da]" />
          <span>Hub</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeViewMode('telemetry')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] transition-all cursor-pointer font-medium ${
            viewMode === 'telemetry'
              ? 'bg-[#303236] text-white shadow-sm border border-[#4a4b50]'
              : 'text-[#a9a9aa] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Activity size={12} className="text-[#ff8964]" />
          <span>Telemetry</span>
        </button>
      </div>

      {/* Right: Modals & Tool Buttons */}
      <div className="flex items-center gap-1.5 text-xs">
        {/* Stream Toggle */}
        <button
          type="button"
          onClick={onToggleStreaming}
          className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-[6px] border transition-colors cursor-pointer text-[11px] ${
            isStreaming
              ? 'bg-[#111111] text-[#a9a9aa] hover:text-white border-[#4a4b50]/60'
              : 'bg-[#303236] text-amber-300 border-amber-500/50'
          }`}
          title={isStreaming ? 'Pause Background Stream' : 'Resume Background Stream'}
        >
          {isStreaming ? (
            <>
              <Pause size={11} className="text-amber-400" />
              <span>LIVE</span>
            </>
          ) : (
            <>
              <Play size={11} className="text-emerald-400" />
              <span>PAUSED</span>
            </>
          )}
        </button>

        {/* Agent Launcher */}
        <button
          type="button"
          onClick={onOpenAgentLauncher}
          className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#111111] hover:bg-[#1a1b1e] border border-[#4a4b50]/60 text-white transition-colors cursor-pointer text-[11px]"
          title="Open AI Agent Launcher (⌘A)"
        >
          <Bot size={11} className="text-[#5683da]" />
          <span>Agents</span>
        </button>

        {/* Layout Studio */}
        <button
          type="button"
          onClick={onOpenLayoutStudio}
          className="hidden md:flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#111111] hover:bg-[#1a1b1e] border border-[#4a4b50]/60 text-white transition-colors cursor-pointer text-[11px]"
          title="Open Layout Studio (⌘L)"
        >
          <Layers size={11} className="text-[#10b981]" />
          <span>Layouts</span>
        </button>

        {/* Themes */}
        <button
          type="button"
          onClick={onOpenThemeStudio}
          className="hidden md:flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#111111] hover:bg-[#1a1b1e] border border-[#4a4b50]/60 text-white transition-colors cursor-pointer text-[11px]"
          title="Open Theme Studio (⌘T)"
        >
          <Palette size={11} className="text-[#ff8964]" />
          <span>Themes</span>
        </button>

        {/* Diff Viewer */}
        <button
          type="button"
          onClick={onOpenDiffViewer}
          className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#111111] hover:bg-[#1a1b1e] border border-[#4a4b50]/60 text-white transition-colors cursor-pointer text-[11px]"
          title="Toggle Git Diff Viewer"
        >
          <GitCommit size={11} className="text-[#5683da]" />
          <span>Diff</span>
        </button>

        {/* Command Palette (⌘K) */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#111111] hover:bg-[#1a1b1e] border border-[#5683da]/60 text-[#5683da] font-bold transition-colors cursor-pointer text-[11px]"
          title="Open Command Palette (⌘K)"
        >
          <Search size={11} />
          <span>⌘K</span>
        </button>

        {/* Shortcuts */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="p-1 rounded-[6px] bg-[#111111] hover:bg-[#1a1b1e] border border-[#4a4b50]/60 text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
          title="Keyboard Shortcuts Reference (?)"
        >
          <Keyboard size={12} />
        </button>

        {/* Hardware Status Indicator */}
        <div className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#111111] border border-[#4a4b50]/40 text-[10px] text-[#a9a9aa]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          <span className="font-semibold text-white">METAL / WEBGL2</span>
        </div>

        {/* Maximize / Fullscreen Button */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="p-1 rounded-[6px] bg-[#111111] border border-[#4a4b50]/40 text-[#a9a9aa] hover:text-white cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
      </div>
    </header>
  );
}
