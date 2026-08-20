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
  BookOpen,
  Settings,
  Columns,
  Rows,
  Maximize2,
  X,
  Globe,
  FileText,
  Code,
  Server,
  Download,
  Upload,
} from 'lucide-react';
import { DemoTheme, DEMO_THEMES } from './demoThemes';
import { DEMO_AGENTS, DemoAgent } from './demoAgents';

export interface DesktopCommandItem {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface DesktopCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: DemoTheme;
  onSelectLayout?: (layoutId: string) => void;
  onDeployAgent?: (agent: DemoAgent) => void;
  onSelectTheme?: (theme: DemoTheme) => void;
  onOpenAgentLauncher?: () => void;
  onOpenLayoutStudio?: () => void;
  onOpenThemeStudio?: () => void;
  onOpenDiffViewer?: () => void;
  onOpenShortcuts?: () => void;
  onRunTest?: () => void;
  onClearPanes?: () => void;
  onResetPanes?: () => void;
  onSplitPane?: (direction: 'horizontal' | 'vertical') => void;
  onToggleMaximize?: () => void;
}

function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().replace(/\s+/g, '');
  const t = text.toLowerCase().replace(/\s+/g, '');
  let qIdx = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      qIdx++;
    }
  }
  return qIdx === q.length;
}

export function DesktopCommandPalette({
  isOpen,
  onClose,
  onSelectLayout,
  onDeployAgent,
  onSelectTheme,
  onOpenAgentLauncher,
  onOpenLayoutStudio,
  onOpenThemeStudio,
  onOpenDiffViewer,
  onOpenShortcuts,
  onRunTest,
  onClearPanes,
  onResetPanes,
  onSplitPane,
  onToggleMaximize,
}: DesktopCommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recents, setRecents] = useState<string[]>([
    'open-agent-launcher',
    'open-layout-studio',
    'open-diff-viewer',
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const runAndClose = (cmd: DesktopCommandItem) => {
    setRecents((prev) => [cmd.id, ...prev.filter((id) => id !== cmd.id)].slice(0, 5));
    cmd.action();
    onClose();
  };

  const commands: DesktopCommandItem[] = [
    // 1. Modals & Studios
    {
      id: 'open-layout-studio',
      label: 'Open Layout Selection Studio…',
      category: 'Modals & Studios',
      shortcut: '⌘L',
      icon: <Layers className="w-4 h-4 text-[#5683da]" />,
      action: () => onOpenLayoutStudio?.(),
    },
    {
      id: 'open-agent-launcher',
      label: 'Open AI Agent Fleet Launcher (14 Agents)…',
      category: 'Modals & Studios',
      shortcut: '⌘A',
      icon: <Bot className="w-4 h-4 text-[#5683da]" />,
      action: () => onOpenAgentLauncher?.(),
    },
    {
      id: 'open-theme-studio',
      label: 'Open Theme & Customization Studio…',
      category: 'Modals & Studios',
      shortcut: '⌘T',
      icon: <Palette className="w-4 h-4 text-[#10b981]" />,
      action: () => onOpenThemeStudio?.(),
    },
    {
      id: 'open-diff-viewer',
      label: 'Toggle Content-Aware Diff Viewer',
      category: 'Modals & Studios',
      shortcut: '⌘D',
      icon: <GitCommit className="w-4 h-4 text-[#ffbd2e]" />,
      action: () => onOpenDiffViewer?.(),
    },
    {
      id: 'open-shortcuts',
      label: 'Keyboard Shortcuts Reference Cheatsheet',
      category: 'Modals & Studios',
      shortcut: '⌘/',
      icon: <BookOpen className="w-4 h-4 text-[#a78bfa]" />,
      action: () => onOpenShortcuts?.(),
    },

    // 2. Pane & Layout Operations
    {
      id: 'split-horizontal',
      label: 'Split Pane Horizontally (Side by Side)',
      category: 'Pane Operations',
      shortcut: '⌘D',
      icon: <Columns className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => onSplitPane?.('horizontal'),
    },
    {
      id: 'split-vertical',
      label: 'Split Pane Vertically (Stacked)',
      category: 'Pane Operations',
      shortcut: '⌘⇧E',
      icon: <Rows className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => onSplitPane?.('vertical'),
    },
    {
      id: 'toggle-maximize',
      label: 'Toggle Maximize / Restore Focused Pane',
      category: 'Pane Operations',
      shortcut: '⌘⇧Enter',
      icon: <Maximize2 className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => onToggleMaximize?.(),
    },
    {
      id: 'layout-solo',
      label: 'Set Equal Grid Layout to 1 Pane (Solo)',
      category: 'Layout Presets',
      shortcut: '1',
      icon: <Layers className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => onSelectLayout?.('solo'),
    },
    {
      id: 'layout-2h',
      label: 'Set Equal Grid Layout to 2 Panes (2H Horizontal)',
      category: 'Layout Presets',
      shortcut: '2',
      icon: <Layers className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => onSelectLayout?.('1x2'),
    },
    {
      id: 'layout-3t',
      label: 'Set Equal Grid Layout to 3 Panes (T-Split Top)',
      category: 'Layout Presets',
      shortcut: '3',
      icon: <Layers className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => onSelectLayout?.('3-t-top'),
    },
    {
      id: 'layout-4quad',
      label: 'Set Equal Grid Layout to 4 Panes (2×2 Quad)',
      category: 'Layout Presets',
      shortcut: '4',
      icon: <Layers className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => onSelectLayout?.('2x2'),
    },
    {
      id: 'layout-4master',
      label: 'Set Equal Grid Layout to 4 Panes (Master Detail 1+3)',
      category: 'Layout Presets',
      shortcut: 'Alt+4',
      icon: <Layers className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => onSelectLayout?.('hero-1-3'),
    },
    {
      id: 'layout-6matrix',
      label: 'Set Equal Grid Layout to 6 Panes (2×3 Matrix)',
      category: 'Layout Presets',
      shortcut: '6',
      icon: <Layers className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => onSelectLayout?.('3x3'),
    },
    {
      id: 'layout-8fleet',
      label: 'Set Equal Grid Layout to 8 Panes (2×4 Fleet)',
      category: 'Layout Presets',
      shortcut: '8',
      icon: <Layers className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => onSelectLayout?.('8-fleet'),
    },
    {
      id: 'layout-9hivemind',
      label: 'Set Equal Grid Layout to 9 Panes (3×3 Hivemind)',
      category: 'Layout Presets',
      shortcut: '9',
      icon: <Layers className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => onSelectLayout?.('9-hivemind'),
    },
    {
      id: 'layout-16godmode',
      label: 'Set Equal Grid Layout to 16 Panes (4×4 GodMode)',
      category: 'Layout Presets',
      shortcut: '0',
      icon: <Layers className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => onSelectLayout?.('16-godmode'),
    },

    // 3. AI Agents (All 14)
    ...DEMO_AGENTS.map((agent) => ({
      id: `deploy-${agent.id}`,
      label: `Deploy AI Agent: ${agent.name} (${agent.provider})`,
      category: 'AI Agents',
      icon: (
        <div className="text-[#5683da]">
          {agent.iconType === 'sparkles' ? (
            <Sparkles className="w-4 h-4 text-emerald-400" />
          ) : agent.iconType === 'zap' ? (
            <Zap className="w-4 h-4 text-[#3b82f6]" />
          ) : agent.iconType === 'globe' ? (
            <Globe className="w-4 h-4 text-[#8b5cf6]" />
          ) : agent.iconType === 'file-text' ? (
            <FileText className="w-4 h-4 text-[#06b6d4]" />
          ) : agent.iconType === 'code' ? (
            <Code className="w-4 h-4 text-[#6366f1]" />
          ) : agent.iconType === 'cpu' ? (
            <Cpu className="w-4 h-4 text-[#f97316]" />
          ) : agent.iconType === 'server' ? (
            <Server className="w-4 h-4 text-[#14b8a6]" />
          ) : agent.iconType === 'layers' ? (
            <Layers className="w-4 h-4 text-[#f59e0b]" />
          ) : agent.iconType === 'terminal' ? (
            <Terminal className="w-4 h-4 text-[#ec4899]" />
          ) : (
            <Bot className="w-4 h-4 text-[#d97706]" />
          )}
        </div>
      ),
      action: () => onDeployAgent?.(agent),
    })),

    // 4. Themes
    ...Object.values(DEMO_THEMES).map((thm) => ({
      id: `theme-${thm.id}`,
      label: `Switch Theme to ${thm.name} (${thm.subtitle})`,
      category: 'Themes & Palettes',
      icon: <Palette className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => onSelectTheme?.(thm),
    })),

    // 5. Developer Actions
    {
      id: 'run-cargo-test',
      label: 'Run Cargo Test Suite (Rust PTY)',
      category: 'Developer Actions',
      shortcut: '⌘R',
      icon: <Play className="w-4 h-4 text-[#27c93f]" />,
      action: () => onRunTest?.(),
    },
    {
      id: 'clear-all-panes',
      label: 'Clear All Terminal Panes Buffer',
      category: 'Developer Actions',
      shortcut: '⌘K ⌘C',
      icon: <RotateCcw className="w-4 h-4 text-[#ffbd2e]" />,
      action: () => onClearPanes?.(),
    },
    {
      id: 'reset-all-panes',
      label: 'Reset All Panes to Default Active Fleet',
      category: 'Developer Actions',
      icon: <RotateCcw className="w-4 h-4 text-white" />,
      action: () => onResetPanes?.(),
    },
  ];

  // Fuzzy filter + rank
  const filtered = commands
    .filter((cmd) => {
      const q = query.toLowerCase().trim();
      if (!q) return true;
      return (
        fuzzyMatch(q, cmd.label) ||
        fuzzyMatch(q, cmd.category) ||
        (cmd.shortcut && fuzzyMatch(q, cmd.shortcut))
      );
    })
    .sort((a, b) => {
      if (!query.trim()) {
        const ra = recents.indexOf(a.id);
        const rb = recents.indexOf(b.id);
        if (ra !== -1 || rb !== -1) return (ra === -1 ? 999 : ra) - (rb === -1 ? 999 : rb);
      }
      return 0;
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
        runAndClose(filtered[selectedIndex]);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-palette-title"
      className="fixed inset-0 z-[90] flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-20 bg-black/85 backdrop-blur-xl animate-fade-in select-none font-sans"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      {/* Palette Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-[#4a4b50] bg-[#090a0c]/95 shadow-[0_25px_80px_rgba(0,0,0,0.98)] overflow-hidden flex flex-col max-h-[75vh] text-left"
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#4a4b50] bg-[#111111]/90">
          <Search className="w-4 h-4 text-[#5683da] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search actions (e.g. Claude, Layout, Diff)..."
            aria-label="Search actions"
            className="w-full bg-transparent text-xs sm:text-sm font-medium text-white placeholder-[#6b6c6d] focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-[#a9a9aa] shrink-0">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar text-xs">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs font-mono text-[#6b6c6d]">
              No matching actions found for &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => runAndClose(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2.5 flex items-center justify-between cursor-pointer rounded-xl transition-all ${
                    isSelected
                      ? 'bg-[#111111] text-white border border-[#5683da]/60 shadow-sm'
                      : 'text-[#a9a9aa] hover:bg-[#111111]/60 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 mr-2">
                    <div
                      className={`p-1.5 rounded-lg border ${
                        isSelected
                          ? 'bg-[#5683da]/20 border-[#5683da]/50 text-[#5683da]'
                          : 'bg-[#090a0c] border-[#4a4b50] text-[#a9a9aa]'
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="truncate">
                      <span className="text-white font-medium truncate block text-xs">
                        {cmd.label}
                      </span>
                      <span className="text-[10px] text-[#6b6c6d] font-mono uppercase tracking-wider block mt-0.5">
                        {cmd.category}
                      </span>
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <kbd className="px-2 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-[#a9a9aa] shrink-0">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#4a4b50] bg-[#111111]/90 text-[10px] font-mono text-[#6b6c6d]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-white">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-white">↓</kbd>{' '}
              navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-white">↵</kbd>{' '}
              execute
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-white">esc</kbd>{' '}
              close
            </span>
          </div>
          <span className="text-[#5683da] font-medium">⌘K Active</span>
        </div>
      </div>
    </div>
  );
}
