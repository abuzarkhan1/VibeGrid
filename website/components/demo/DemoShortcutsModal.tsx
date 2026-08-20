'use client';

import React, { useEffect } from 'react';
import { X, BookOpen, Command, Keyboard } from 'lucide-react';
import { DemoTheme } from './demoThemes';

interface DemoShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: DemoTheme;
}

interface ShortcutGroup {
  title: string;
  items: { label: string; key: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Pane & Grid Operations',
    items: [
      { label: 'Split Pane Right (Horizontal)', key: '⌘D / Ctrl+D' },
      { label: 'Split Pane Down (Vertical)', key: '⌘⇧D / Ctrl+Shift+D' },
      { label: 'Maximize / Restore Focused Pane', key: '⌘⇧↵ / Ctrl+Shift+Enter' },
      { label: 'Close Active Terminal Pane', key: '⌘W / Ctrl+W' },
      { label: 'Equalize Pane Grid Splits', key: 'Double Click Sash' },
    ],
  },
  {
    title: 'Navigation & Modals',
    items: [
      { label: 'Open Command Palette', key: '⌘K / Ctrl+K' },
      { label: 'Open AI Agent Launcher', key: '⌘A / Click Agents' },
      { label: 'Open Layout Selection Studio', key: '⌘L / Click Layouts' },
      { label: 'Open Theme Studio & Color Customizer', key: '⌘T / Click Themes' },
      { label: 'Toggle Content-Aware Git Diff Viewer', key: '⌘D / Click Diff' },
      { label: 'Keyboard Shortcuts Reference', key: '? / ⌘/' },
    ],
  },
  {
    title: 'Terminal & CLI Execution',
    items: [
      { label: 'Run Claude Code Agent with AST Reasoning', key: '$ claude "prompt"' },
      { label: 'Run Rust Tokio PTY Fuzzing Suite', key: '$ cargo test' },
      { label: 'Start Vite / Next.js Dev Server', key: '$ npm run dev' },
      { label: 'Display System Telemetry & FPS', key: '$ status' },
      { label: 'Clear Terminal Scrollback Buffer', key: '$ clear' },
      { label: 'Command History Navigation', key: '↑ / ↓' },
      { label: 'Command Autocompletion', key: 'Tab' },
    ],
  },
  {
    title: 'Workspace Management',
    items: [
      { label: 'Create New Project Workspace', key: '+ New Workspace' },
      { label: 'Switch Active Workspace', key: 'Click Sidebar Pill' },
      { label: 'Rename / Duplicate / Delete Project', key: 'Hover or Right-Click' },
      { label: 'Toggle Fullscreen Window Frame', key: 'Green Traffic Light' },
    ],
  },
];

export function DemoShortcutsModal({ isOpen, onClose }: DemoShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-shortcuts-title"
      className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in select-none font-sans"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90%] rounded-[12px] border border-[#4a4b50] bg-[#090a0c] shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#4a4b50] bg-[#111111] px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#090a0c] border border-[#4a4b50] text-[#5683da]">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="demo-shortcuts-title" className="text-sm font-bold text-white tracking-tight">
                  Keyboard Shortcuts & Gesture Reference
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-[#5683da]">
                  VibeGrid Keymap
                </span>
              </div>
              <p className="text-[11px] text-[#a9a9aa]">
                Native desktop keybindings for high-speed terminal orchestration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="p-1.5 rounded-lg hover:bg-[#111111] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs custom-scrollbar">
          {SHORTCUT_GROUPS.map((group) => (
            <div
              key={group.title}
              className="p-3.5 rounded-xl bg-[#111111] border border-[#4a4b50]/60 space-y-2"
            >
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5683da]">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-[#090a0c] transition-colors"
                  >
                    <span className="text-[#d1d1d1] font-sans">{item.label}</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-white font-semibold">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#4a4b50] bg-[#111111] px-5 py-3 shrink-0 text-[11px] font-mono text-[#a9a9aa]">
          <span>
            Press <kbd className="px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-white">Esc</kbd> to close
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#5683da] hover:bg-[#456ec2] text-white font-sans text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
