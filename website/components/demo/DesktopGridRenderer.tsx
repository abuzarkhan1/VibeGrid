'use client';

import React, { useRef, useEffect } from 'react';
import {
  Terminal,
  Minimize2,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  Send,
  Eraser,
  RotateCcw,
} from 'lucide-react';
import { DesktopTerminalToolbar } from './DesktopTerminalToolbar';
import { DemoLayoutPreset } from './demoLayouts';
import { DemoTheme } from './demoThemes';

export interface DiffHunkLine {
  type: 'add' | 'del' | 'context' | 'header';
  oldNo?: number;
  newNo?: number;
  text: string;
}

export interface TerminalLog {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'diff';
  text?: string;
  bullet?: string;
  bulletColor?: string;
  tag?: string;
  tagColor?: string;
  diffLines?: DiffHunkLine[];
  timestamp?: string;
}

export interface DemoPaneState {
  id: string;
  index: number;
  title: string;
  cwd: string;
  agentName?: string;
  agentBadge?: string;
  agentAccent?: string;
  currentInput: string;
  history: string[];
  historyIndex: number;
  logs: TerminalLog[];
  isStreaming?: boolean;
  hasActivity?: boolean;
  isClosed?: boolean;
}

interface DesktopGridRendererProps {
  layoutPreset: DemoLayoutPreset['id'];
  maximizedPaneId: string | null;
  focusedPaneId: string;
  panes: DemoPaneState[];
  currentTheme: DemoTheme;
  cornerRadius?: number;
  gutterWidth?: number;
  onFocusPane: (id: string) => void;
  onExecuteCommand: (paneId: string, cmd: string) => void;
  onInputChange: (paneId: string, value: string) => void;
  onKeyDownInput: (e: React.KeyboardEvent<HTMLInputElement>, paneId: string) => void;
  onRenamePane: (paneId: string, newTitle: string) => void;
  onSplitHorizontal: (paneId: string) => void;
  onSplitVertical: (paneId: string) => void;
  onToggleMaximize: (paneId: string) => void;
  onClosePane: (paneId: string) => void;
  onClearPane: (paneId: string) => void;
}

export function DesktopGridRenderer({
  layoutPreset,
  maximizedPaneId,
  focusedPaneId,
  panes,
  currentTheme,
  cornerRadius = 10,
  gutterWidth = 2,
  onFocusPane,
  onExecuteCommand,
  onInputChange,
  onKeyDownInput,
  onRenamePane,
  onSplitHorizontal,
  onSplitVertical,
  onToggleMaximize,
  onClosePane,
  onClearPane,
}: DesktopGridRendererProps) {
  const logContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll each terminal pane container internally to bottom without affecting window scroll
  useEffect(() => {
    panes.forEach((pane) => {
      const container = logContainerRefs.current[pane.id];
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  }, [panes]);

  // Filter visible panes based on layout preset
  const visiblePanes = (() => {
    if (maximizedPaneId) {
      const maxPane = panes.find((p) => p.id === maximizedPaneId);
      return maxPane ? [maxPane] : panes.slice(0, 1);
    }
    switch (layoutPreset) {
      case '1x2':
        return panes.filter((p) => !p.isClosed).slice(0, 2);
      case 'hero-1-3':
        return panes.filter((p) => !p.isClosed).slice(0, 4);
      case '3x3':
        return panes.filter((p) => !p.isClosed).slice(0, 6);
      case '2x2':
      default:
        return panes.filter((p) => !p.isClosed).slice(0, 4);
    }
  })();

  // Render a single terminal pane tile
  const renderTerminalPane = (pane: DemoPaneState, customHeightClass?: string) => {
    const isFocused = focusedPaneId === pane.id;
    const isMaximized = maximizedPaneId === pane.id;

    return (
      <div
        key={pane.id}
        onClick={() => onFocusPane(pane.id)}
        className={`flex flex-col bg-[#050507] border transition-all overflow-hidden relative select-text font-mono text-xs ${customHeightClass || 'h-full min-h-0'} ${
          isFocused
            ? 'ring-1 ring-[#5683da] shadow-[0_0_20px_rgba(86,131,218,0.2)]'
            : 'hover:border-[#4a4b50]'
        }`}
        style={{
          borderRadius: `${cornerRadius}px`,
          backgroundColor: currentTheme.bgCard || '#111111',
          borderColor: isFocused ? currentTheme.borderActive : `${currentTheme.border}70`,
        }}
      >
        {/* Terminal Header Toolbar */}
        <DesktopTerminalToolbar
          paneIndex={pane.index}
          title={pane.title}
          cwd={pane.cwd}
          agentBadge={pane.agentBadge}
          agentAccent={pane.agentAccent}
          isFocused={isFocused}
          isMaximized={isMaximized}
          hasActivity={pane.hasActivity}
          currentTheme={currentTheme}
          onFocus={() => onFocusPane(pane.id)}
          onRenameTitle={(title) => onRenamePane(pane.id, title)}
          onSplitHorizontal={() => onSplitHorizontal(pane.id)}
          onSplitVertical={() => onSplitVertical(pane.id)}
          onToggleMaximize={() => onToggleMaximize(pane.id)}
          onClosePane={() => onClosePane(pane.id)}
        />

        {/* Terminal Log Stream Body */}
        <div
          ref={(el) => {
            logContainerRefs.current[pane.id] = el;
          }}
          className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 space-y-1.5 custom-scrollbar text-[11px] leading-relaxed select-text bg-[#090a0c]"
        >
          {pane.logs.map((log) => {
            if (log.type === 'input') {
              return (
                <div key={log.id} className="flex items-center gap-2 text-white font-semibold pt-1">
                  <span className="text-[#5683da]">$</span>
                  <span>{log.text}</span>
                  {log.timestamp && (
                    <span className="text-[9px] text-[#6b6c6d] ml-auto font-normal">
                      {log.timestamp}
                    </span>
                  )}
                </div>
              );
            }

            if (log.type === 'diff' && log.diffLines) {
              return (
                <div
                  key={log.id}
                  className="rounded border border-[#4a4b50]/60 bg-[#111111] overflow-hidden my-1"
                >
                  <table className="w-full border-collapse font-mono text-[10px]">
                    <tbody>
                      {log.diffLines.map((line, lIdx) => {
                        let bg = 'text-[#d1d1d1]';
                        let prefix = ' ';
                        if (line.type === 'header') {
                          return (
                            <tr key={lIdx} className="bg-[#090a0c] text-[#5683da] font-bold">
                              <td colSpan={2} className="px-2 py-0.5">
                                {line.text}
                              </td>
                            </tr>
                          );
                        }
                        if (line.type === 'add') {
                          bg = 'bg-[#27c93f]/10 text-emerald-300';
                          prefix = '+';
                        } else if (line.type === 'del') {
                          bg = 'bg-[#ff5f56]/10 text-rose-300 line-through opacity-75';
                          prefix = '-';
                        }
                        return (
                          <tr key={lIdx} className={bg}>
                            <td className="w-4 text-center select-none opacity-50 px-1">
                              {prefix}
                            </td>
                            <td className="px-2 py-0.2 whitespace-pre">
                              {line.text.replace(/^[+-]\s*/, '')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            }

            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                {log.bullet && (
                  <span className={`shrink-0 font-bold ${log.bulletColor || 'text-[#5683da]'}`}>
                    {log.bullet}
                  </span>
                )}
                {log.tag && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 border ${
                      log.tagColor || 'bg-white/10 text-white/80 border-white/20'
                    }`}
                  >
                    {log.tag}
                  </span>
                )}
                <span
                  className={`flex-1 break-words ${
                    log.type === 'success'
                      ? 'text-emerald-300'
                      : log.type === 'error'
                      ? 'text-rose-300 font-semibold'
                      : log.type === 'info'
                      ? 'text-[#d1d1d1]'
                      : 'text-[#a9a9aa]'
                  }`}
                >
                  {log.text}
                </span>
                {log.timestamp && (
                  <span className="text-[9px] text-[#6b6c6d] shrink-0 font-mono hidden sm:inline">
                    {log.timestamp}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Terminal Input Bar */}
        <div className="p-2.5 bg-[#0e0e10] border-t border-[#4a4b50]/40 flex items-center gap-2 shrink-0">
          <span className="text-[#5683da] font-bold select-none">$</span>
          <input
            type="text"
            value={pane.currentInput}
            onChange={(e) => onInputChange(pane.id, e.target.value)}
            onKeyDown={(e) => onKeyDownInput(e, pane.id)}
            placeholder="Type command ('help', 'cargo test', 'claude', 'clear')..."
            className="flex-1 bg-transparent text-white font-mono text-xs placeholder:text-[#6b6c6d] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => onExecuteCommand(pane.id, pane.currentInput)}
            className="p-1 rounded bg-[#5683da]/20 hover:bg-[#5683da]/30 text-[#5683da] hover:text-white border border-[#5683da]/40 transition-colors cursor-pointer"
            title="Execute Command (Enter)"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>

        {/* Footer info bar */}
        <div className="px-2.5 py-1 bg-[#090a0c] border-t border-[#4a4b50]/30 flex items-center justify-between text-[10px] text-[#6b6c6d] select-none">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-white/80">PTY #{pane.index + 1} ONLINE</span>
            </span>
            <span>•</span>
            <span className="text-white/60 hidden sm:inline">60.0 FPS</span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className="text-white">▌</span>
          </div>
        </div>
      </div>
    );
  };

  // If a pane is maximized
  if (maximizedPaneId && visiblePanes.length > 0) {
    return (
      <div className="h-full w-full flex flex-col gap-2 p-3 sm:p-4 bg-[#090a0c] min-h-0 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#5683da]/15 border border-[#5683da]/40 text-xs text-white shrink-0">
          <span className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#5683da] animate-pulse" />
            <span>Focused Maximized View: <strong>{visiblePanes[0].title}</strong></span>
          </span>
          <button
            type="button"
            onClick={() => onToggleMaximize(visiblePanes[0].id)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#5683da] text-white font-bold text-[11px] hover:bg-[#456ec2] transition-colors cursor-pointer"
          >
            <Minimize2 className="w-3 h-3" />
            <span>Restore Layout (⌘⇧↵)</span>
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {renderTerminalPane(visiblePanes[0], 'h-full min-h-0')}
        </div>
      </div>
    );
  }

  // Hero 1+3 Command Layout
  if (layoutPreset === 'hero-1-3' && visiblePanes.length >= 2) {
    const heroPane = visiblePanes[0];
    const sidePanes = visiblePanes.slice(1, 4);

    return (
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 sm:p-4 bg-[#090a0c] h-full min-h-0 overflow-y-auto lg:overflow-hidden"
        style={{ gap: `${gutterWidth * 4}px` }}
      >
        {/* Large Hero Master Pane (7 Cols) */}
        <div className="lg:col-span-7 h-full min-h-0 overflow-hidden">
          {renderTerminalPane(heroPane, 'h-full min-h-0')}
        </div>

        {/* 3 Stacked Side Panes (5 Cols) */}
        <div
          className="lg:col-span-5 flex flex-col gap-2.5 h-full min-h-0 overflow-hidden"
          style={{ gap: `${gutterWidth * 3}px` }}
        >
          {sidePanes.map((sp) => (
            <div key={sp.id} className="flex-1 min-h-0 overflow-hidden">
              {renderTerminalPane(sp, 'h-full min-h-0')}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 1x2 Dual Split Layout
  if (layoutPreset === '1x2') {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4 bg-[#090a0c] h-full min-h-0 overflow-y-auto md:overflow-hidden"
        style={{ gap: `${gutterWidth * 4}px` }}
      >
        {visiblePanes.slice(0, 2).map((pane) => (
          <div key={pane.id} className="h-full min-h-0 overflow-hidden">
            {renderTerminalPane(pane, 'h-full min-h-0')}
          </div>
        ))}
      </div>
    );
  }

  // 3x3 Swarm Matrix Layout (6 Panes)
  if (layoutPreset === '3x3') {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 sm:p-4 bg-[#090a0c] h-full min-h-0 overflow-y-auto lg:overflow-hidden"
        style={{ gap: `${gutterWidth * 3}px` }}
      >
        {visiblePanes.slice(0, 6).map((pane) => (
          <div key={pane.id} className="h-full min-h-0 overflow-hidden">
            {renderTerminalPane(pane, 'h-full min-h-0')}
          </div>
        ))}
      </div>
    );
  }

  // 2x2 Quad Matrix Default Layout (4 Panes)
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4 bg-[#090a0c] h-full min-h-0 overflow-y-auto md:overflow-hidden"
      style={{ gap: `${gutterWidth * 4}px` }}
    >
      {visiblePanes.slice(0, 4).map((pane) => (
        <div key={pane.id} className="h-full min-h-0 overflow-hidden">
          {renderTerminalPane(pane, 'h-full min-h-0')}
        </div>
      ))}
    </div>
  );
}
