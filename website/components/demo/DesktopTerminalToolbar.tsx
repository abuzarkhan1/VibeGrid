'use client';

import React, { useState, useEffect } from 'react';
import {
  Columns,
  Rows,
  Maximize2,
  Minimize2,
  X,
  Terminal as TerminalIcon,
  Pencil,
} from 'lucide-react';
import { DemoTheme } from './demoThemes';

interface DesktopTerminalToolbarProps {
  paneIndex: number;
  title: string;
  cwd: string;
  agentBadge?: string;
  agentAccent?: string;
  isFocused: boolean;
  isMaximized: boolean;
  hasActivity?: boolean;
  currentTheme: DemoTheme;
  onFocus: () => void;
  onRenameTitle: (newTitle: string) => void;
  onSplitHorizontal: () => void;
  onSplitVertical: () => void;
  onToggleMaximize: () => void;
  onClosePane: () => void;
}

export function DesktopTerminalToolbar({
  paneIndex,
  title,
  cwd,
  agentBadge,
  agentAccent = '#5683da',
  isFocused,
  isMaximized,
  hasActivity = false,
  currentTheme,
  onFocus,
  onRenameTitle,
  onSplitHorizontal,
  onSplitVertical,
  onToggleMaximize,
  onClosePane,
}: DesktopTerminalToolbarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  const handleSave = () => {
    if (tempTitle.trim() && tempTitle !== title) {
      onRenameTitle(tempTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      onClick={onFocus}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onToggleMaximize();
      }}
      className={`h-8 w-full px-2.5 flex items-center justify-between select-none cursor-pointer border-b font-sans transition-colors shrink-0 text-xs ${
        isFocused
          ? 'text-white bg-white/[0.08] border-white/20'
          : 'text-white/70 bg-[#090a0c]/80 border-[#4a4b50]/50 hover:bg-white/[0.03]'
      }`}
      style={{
        borderColor: isFocused ? `${currentTheme.borderActive}80` : `${currentTheme.border}60`,
      }}
    >
      {/* Left: Pane Index + Terminal Icon + Title + CWD + Agent Badge */}
      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
        {/* White / High Contrast Badge */}
        <span
          className={`flex h-4 min-w-4 shrink-0 items-center justify-center rounded-[4px] px-1 text-[10px] font-bold font-mono shadow-sm transition-colors ${
            isFocused ? 'text-black bg-white' : 'text-white/80 bg-white/10'
          }`}
          title={`Pane ${paneIndex + 1}`}
        >
          {paneIndex + 1}
        </span>

        <TerminalIcon className="w-3.5 h-3.5 text-white/70 shrink-0" />

        {/* Editable Title Area */}
        {isEditing ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setTempTitle(title);
                setIsEditing(false);
              }
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            className="font-sans font-semibold text-white text-xs bg-black/80 border border-[#5683da] rounded px-1.5 py-0.2 outline-none w-32"
          />
        ) : (
          <div
            className="flex items-center gap-1 group cursor-text truncate"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Click to rename pane"
          >
            <span className="font-semibold text-white/95 text-xs truncate tracking-tight">
              {title}
            </span>
            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-80 transition-opacity text-white/50 shrink-0" />
          </div>
        )}

        {/* CWD pill */}
        {cwd && (
          <span
            className="font-mono text-[10px] text-white/50 px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/10 truncate max-w-[110px] hidden sm:inline"
            title={cwd}
          >
            {cwd}
          </span>
        )}

        {/* Agent badge */}
        {agentBadge && (
          <span
            className="font-mono text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider hidden md:inline truncate"
            style={{
              backgroundColor: `${agentAccent}20`,
              color: agentAccent,
              border: `1px solid ${agentAccent}40`,
            }}
          >
            {agentBadge}
          </span>
        )}

        {/* Activity pulse */}
        {hasActivity && !isFocused && (
          <span
            className="relative flex h-2 w-2 shrink-0 ml-0.5"
            title="Active streaming logs in this pane"
            aria-label="Active streaming output"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
        )}
      </div>

      {/* Right: Split / Maximize / Close Buttons */}
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Split Horizontal */}
        <button
          type="button"
          onClick={onSplitHorizontal}
          title="Split Right (⌘D)"
          aria-label="Split right"
          className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
        >
          <Columns className="w-3.5 h-3.5" />
        </button>

        {/* Split Vertical */}
        <button
          type="button"
          onClick={onSplitVertical}
          title="Split Down (⌘⇧D)"
          aria-label="Split down"
          className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
        >
          <Rows className="w-3.5 h-3.5" />
        </button>

        {/* Maximize / Restore */}
        <button
          type="button"
          onClick={onToggleMaximize}
          title={isMaximized ? 'Restore Layout (⌘⇧↵)' : 'Maximize Pane (⌘⇧↵)'}
          aria-label={isMaximized ? 'Restore layout' : 'Maximize pane'}
          className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
        >
          {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Close Pane */}
        <button
          type="button"
          onClick={onClosePane}
          title="Close Pane (⌘W)"
          aria-label="Close pane"
          className="p-1 rounded bg-white/[0.04] hover:bg-rose-500/20 text-white/70 hover:text-rose-300 border border-white/10 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
