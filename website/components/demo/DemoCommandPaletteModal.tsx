'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bot,
  Layers,
  Palette,
  Terminal,
  Play,
  RotateCcw,
  Zap,
  Cpu,
  Shield,
  Sparkles,
  GitCommit,
  Check,
} from 'lucide-react';
import { DemoTheme, DEMO_THEMES } from './demoThemes';
import { DemoLayoutPreset } from './demoLayouts';
import { DEMO_AGENTS, DemoAgent } from './demoAgents';

export interface DemoCommandItem {
  id: string;
  label: string;
  category: 'Layout' | 'AI Agents' | 'Themes' | 'Actions' | 'Modals';
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface DemoCommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: DemoTheme;
  onSelectLayout: (layoutId: DemoLayoutPreset['id']) => void;
  onDeployAgent: (agent: DemoAgent) => void;
  onSelectTheme: (theme: DemoTheme) => void;
  onOpenAgentLauncher: () => void;
  onOpenLayoutStudio: () => void;
  onOpenThemeStudio: () => void;
  onOpenDiffViewer: () => void;
  onRunTest: () => void;
  onClearPanes: () => void;
  onResetPanes: () => void;
}

export function DemoCommandPaletteModal({
  isOpen,
  onClose,
  currentTheme,
  onSelectLayout,
  onDeployAgent,
  onSelectTheme,
  onOpenAgentLauncher,
  onOpenLayoutStudio,
  onOpenThemeStudio,
  onOpenDiffViewer,
  onRunTest,
  onClearPanes,
  onResetPanes,
}: DemoCommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const commands: DemoCommandItem[] = [
    // Modals
    {
      id: 'open-agent-launcher',
      label: 'Open AI Agent Fleet Launcher…',
      category: 'Modals',
      shortcut: '⌘A',
      icon: <Bot className="w-3.5 h-3.5 text-[#5683da]" />,
      action: () => {
        onClose();
        onOpenAgentLauncher();
      },
    },
    {
      id: 'open-layout-studio',
      label: 'Open Layout Studio Modal…',
      category: 'Modals',
      shortcut: '⌘L',
      icon: <Layers className="w-3.5 h-3.5 text-[#5683da]" />,
      action: () => {
        onClose();
        onOpenLayoutStudio();
      },
    },
    {
      id: 'open-theme-studio',
      label: 'Open Theme Studio & Color Customizer…',
      category: 'Modals',
      shortcut: '⌘T',
      icon: <Palette className="w-3.5 h-3.5 text-[#5683da]" />,
      action: () => {
        onClose();
        onOpenThemeStudio();
      },
    },
    {
      id: 'open-diff-viewer',
      label: 'Toggle Content-Aware Diff Viewer (src/middleware/auth.rs)',
      category: 'Modals',
      shortcut: '⌘D',
      icon: <GitCommit className="w-3.5 h-3.5 text-[#5683da]" />,
      action: () => {
        onClose();
        onOpenDiffViewer();
      },
    },

    // Layouts
    {
      id: 'layout-2x2',
      label: 'Switch Layout to 2x2 Quad Matrix (4 Panes)',
      category: 'Layout',
      shortcut: '1',
      icon: <Layers className="w-3.5 h-3.5 text-[#a9a9aa]" />,
      action: () => {
        onSelectLayout('2x2');
        onClose();
      },
    },
    {
      id: 'layout-hero-1-3',
      label: 'Switch Layout to Hero 1+3 Command (1 Hero + 3 Side Panes)',
      category: 'Layout',
      shortcut: '2',
      icon: <Layers className="w-3.5 h-3.5 text-[#a9a9aa]" />,
      action: () => {
        onSelectLayout('hero-1-3');
        onClose();
      },
    },
    {
      id: 'layout-1x2',
      label: 'Switch Layout to 1x2 Dual Split (2 Panes)',
      category: 'Layout',
      shortcut: '3',
      icon: <Layers className="w-3.5 h-3.5 text-[#a9a9aa]" />,
      action: () => {
        onSelectLayout('1x2');
        onClose();
      },
    },
    {
      id: 'layout-3x3',
      label: 'Switch Layout to 3x3 Swarm Matrix (6 Panes)',
      category: 'Layout',
      shortcut: '4',
      icon: <Layers className="w-3.5 h-3.5 text-[#a9a9aa]" />,
      action: () => {
        onSelectLayout('3x3');
        onClose();
      },
    },

    // AI Agents
    ...DEMO_AGENTS.map((agent) => ({
      id: `deploy-${agent.id}`,
      label: `Deploy ${agent.name} (${agent.provider})`,
      category: 'AI Agents' as const,
      icon: <Bot className="w-3.5 h-3.5 text-[#5683da]" />,
      action: () => {
        onDeployAgent(agent);
        onClose();
      },
    })),

    // Themes
    ...Object.values(DEMO_THEMES).map((thm) => ({
      id: `theme-${thm.id}`,
      label: `Switch Theme to ${thm.name} (${thm.subtitle})`,
      category: 'Themes' as const,
      icon: <Palette className="w-3.5 h-3.5 text-[#a9a9aa]" />,
      action: () => {
        onSelectTheme(thm);
        onClose();
      },
    })),

    // Developer Actions
    {
      id: 'run-cargo-test',
      label: 'Run Cargo Test Suite (Rust PTY)',
      category: 'Actions',
      shortcut: '⌘R',
      icon: <Play className="w-3.5 h-3.5 text-[#27c93f]" />,
      action: () => {
        onRunTest();
        onClose();
      },
    },
    {
      id: 'clear-all-panes',
      label: 'Clear All Terminal Panes',
      category: 'Actions',
      shortcut: '⌘K ⌘C',
      icon: <RotateCcw className="w-3.5 h-3.5 text-[#ffbd2e]" />,
      action: () => {
        onClearPanes();
        onClose();
      },
    },
    {
      id: 'reset-all-panes',
      label: 'Reset All Panes to Default Active Fleet',
      category: 'Actions',
      icon: <RotateCcw className="w-3.5 h-3.5 text-white" />,
      action: () => {
        onResetPanes();
        onClose();
      },
    },
  ];

  // Filter commands by fuzzy match on label and category
  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-palette-title"
      className="absolute inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-10 sm:pt-14 bg-black/80 backdrop-blur-md animate-fade-in select-none font-sans"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      {/* Palette Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-[12px] border border-[#4a4b50] bg-[#111111] shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[75vh] text-left"
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-[#4a4b50] bg-[#090a0c]">
          <Search className="w-4 h-4 text-[#5683da] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search actions (e.g. Hero, Claude, Theme)..."
            aria-label="Search actions"
            className="w-full bg-transparent text-xs sm:text-sm font-medium text-white placeholder-[#6b6c6d] focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-[#111111] border border-[#4a4b50] text-[10px] font-mono text-[#a9a9aa] shrink-0">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar text-xs">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-[#6b6c6d]">
              No matching actions found
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2 flex items-center justify-between cursor-pointer rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-[#090a0c] text-white border border-[#5683da]/40 shadow-sm'
                      : 'text-[#a9a9aa] hover:bg-[#090a0c]/60 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 mr-2">
                    <div
                      className={`p-1 rounded-md ${
                        isSelected ? 'bg-[#5683da]/20 text-[#5683da]' : 'bg-[#111111] text-[#6b6c6d]'
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="truncate">
                      <span className="text-white font-medium truncate block">
                        {cmd.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-[#6b6c6d] font-mono uppercase tracking-wider">
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-[#a9a9aa]">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#4a4b50] bg-[#090a0c] text-[10px] font-mono text-[#6b6c6d]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-[#111111] border border-[#4a4b50] text-white">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 rounded bg-[#111111] border border-[#4a4b50] text-white">↓</kbd>{' '}
              navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#111111] border border-[#4a4b50] text-white">↵</kbd>{' '}
              execute
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#111111] border border-[#4a4b50] text-white">esc</kbd>{' '}
              close
            </span>
          </div>
          <span className="text-[#5683da]">⌘K Active</span>
        </div>
      </div>
    </div>
  );
}
