'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, X, Search, Command, Keyboard } from 'lucide-react';
import { DemoTheme } from './demoThemes';

interface ShortcutItem {
  id: string;
  label: string;
  keys: string;
  category: string;
}

const SHORTCUT_GROUPS: { title: string; items: ShortcutItem[] }[] = [
  {
    title: 'Pane Operations',
    items: [
      { id: 'split-h', label: 'Split Pane Horizontally', keys: '⌘D', category: 'Pane Operations' },
      { id: 'split-v', label: 'Split Pane Vertically', keys: '⌘⇧E', category: 'Pane Operations' },
      { id: 'close-pane', label: 'Close Focused Pane', keys: '⌘W', category: 'Pane Operations' },
      { id: 'max-pane', label: 'Toggle Maximize / Restore', keys: '⌘⇧Enter', category: 'Pane Operations' },
      { id: 'split-folder', label: 'Split in New Folder Directory', keys: '⌘⇧O', category: 'Pane Operations' },
    ],
  },
  {
    title: 'Navigation & Focus',
    items: [
      { id: 'cmd-palette', label: 'Open Command Palette (Fuzzy)', keys: '⌘K', category: 'Navigation & Focus' },
      { id: 'open-settings', label: 'Open Settings & Keybindings', keys: '⌘,', category: 'Navigation & Focus' },
      { id: 'open-shortcuts', label: 'Open Shortcuts Cheatsheet', keys: '⌘/', category: 'Navigation & Focus' },
      { id: 'focus-left', label: 'Focus Left Pane', keys: '⌥←', category: 'Navigation & Focus' },
      { id: 'focus-right', label: 'Focus Right Pane', keys: '⌥→', category: 'Navigation & Focus' },
      { id: 'focus-up', label: 'Focus Upper Pane', keys: '⌥↑', category: 'Navigation & Focus' },
      { id: 'focus-down', label: 'Focus Lower Pane', keys: '⌥↓', category: 'Navigation & Focus' },
      { id: 'cycle-next', label: 'Cycle Next Terminal Pane', keys: '⌘]', category: 'Navigation & Focus' },
    ],
  },
  {
    title: 'AI Fleet & Layout Studio',
    items: [
      { id: 'agent-launcher', label: 'Open AI Agent Launcher (14 Agents)', keys: '⌘A', category: 'AI Fleet & Layout Studio' },
      { id: 'layout-studio', label: 'Open Layout Studio Gallery', keys: '⌘L', category: 'AI Fleet & Layout Studio' },
      { id: 'theme-studio', label: 'Open Theme Studio & Colors', keys: '⌘T', category: 'AI Fleet & Layout Studio' },
      { id: 'diff-viewer', label: 'Toggle Content-Aware Diff Viewer', keys: '⌘D', category: 'AI Fleet & Layout Studio' },
      { id: 'preset-switch', label: 'Direct Layout Preset Switch', keys: '1 - 9', category: 'AI Fleet & Layout Studio' },
    ],
  },
  {
    title: 'Terminal & Font',
    items: [
      { id: 'font-inc', label: 'Increase Terminal Font Size', keys: '⌘+', category: 'Terminal & Font' },
      { id: 'font-dec', label: 'Decrease Terminal Font Size', keys: '⌘-', category: 'Terminal & Font' },
      { id: 'font-reset', label: 'Reset Font Size to Default', keys: '⌘0', category: 'Terminal & Font' },
      { id: 'clear-term', label: 'Clear Terminal Buffer', keys: '⌘K ⌘C', category: 'Terminal & Font' },
      { id: 'search-term', label: 'Search in Terminal Buffer', keys: '⌘F', category: 'Terminal & Font' },
    ],
  },
  {
    title: 'Workspace & Global',
    items: [
      { id: 'new-ws', label: 'Create New Workspace', keys: '⌘⇧N', category: 'Workspace & Global' },
      { id: 'next-ws', label: 'Switch to Next Workspace', keys: '⌘⌥→', category: 'Workspace & Global' },
      { id: 'prev-ws', label: 'Switch to Previous Workspace', keys: '⌘⌥←', category: 'Workspace & Global' },
      { id: 'voice-dictate', label: 'Voice-to-Terminal Dictation', keys: '⌘⇧V', category: 'Workspace & Global' },
      { id: 'global-summon', label: 'Global Window Summon / Hide', keys: '⌃⌥Space', category: 'Workspace & Global' },
    ],
  },
];

interface DesktopShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: DemoTheme;
}

export function DesktopShortcutsModal({
  isOpen,
  onClose,
}: DesktopShortcutsModalProps) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredGroups = SHORTCUT_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.keys.toLowerCase().includes(search.toLowerCase()) ||
        group.title.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-shortcuts-title"
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in select-none font-sans"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-[#4a4b50] bg-[#090a0c]/95 shadow-[0_20px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-left"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#4a4b50] bg-[#111111]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[#a78bfa]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="desktop-shortcuts-title"
                className="font-sans font-bold text-sm sm:text-base text-white tracking-tight"
              >
                Keyboard Shortcuts Reference
              </h2>
              <p className="text-[11px] text-[#a9a9aa] font-sans">
                Native macOS accelerators & fast workflow navigation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close shortcuts cheatsheet"
            className="p-1.5 rounded-lg hover:bg-[#111111] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-2.5 border-b border-[#4a4b50] bg-[#090a0c] flex items-center gap-2.5 shrink-0">
          <Search className="w-4 h-4 text-[#a78bfa]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter shortcuts (e.g. split, layout, font)..."
            className="w-full bg-transparent text-xs font-mono text-white placeholder-[#6b6c6d] focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-[#6b6c6d] hover:text-white text-xs font-mono"
            >
              Clear
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
          {filteredGroups.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[#6b6c6d]">
              No shortcuts found matching &quot;{search}&quot;
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div
                key={group.title}
                className="p-4 rounded-xl bg-[#111111] border border-[#4a4b50] space-y-2.5"
              >
                <h3 className="text-[10px] font-mono font-bold text-[#a78bfa] uppercase tracking-wider">
                  {group.title}
                </h3>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#090a0c] transition-colors"
                    >
                      <span className="font-sans font-medium text-white/90 text-xs">
                        {item.label}
                      </span>
                      <kbd className="px-2.5 py-0.5 rounded-md bg-[#090a0c] border border-[#4a4b50] font-mono text-white text-[11px] font-bold shadow-sm">
                        {item.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#4a4b50] bg-[#111111]/90 flex items-center justify-between text-[11px] font-mono text-[#a9a9aa] shrink-0">
          <span>Reassign any shortcut in Settings → Keybindings</span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-white">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
