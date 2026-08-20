'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Bot,
  Layout,
  GitCommit,
  Plus,
  Folder,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Settings,
  Trash2,
  Edit2,
  Copy,
  Type,
  Palette,
  Sliders,
  Keyboard as KeyboardIcon,
  UserRound,
  X,
  Check,
  Sparkles,
  Layers,
  Cpu,
  ShieldCheck,
  Github,
  ExternalLink,
  BookOpen,
  Activity,
  HardDrive,
  Split,
  FileCode,
  Zap,
} from 'lucide-react';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type PrimaryView = 'grid' | 'hub' | 'studio' | 'diff';

export interface WorkspaceFolder {
  id: string;
  name: string;
  path: string;
  badge?: string;
  isExpanded?: boolean;
  threads: Array<{
    id: string;
    title: string;
    timestamp: string;
    agentBadge?: string;
  }>;
}

export type DemoWorkspaceItem = WorkspaceFolder;

export interface DesktopAppSidebarProps {
  /** Sidebar expand/collapse state (controlled or defaults to true) */
  isOpen?: boolean;
  /** Callback fired when user toggles sidebar collapse/expand */
  onToggle?: () => void;
  /** Active primary view mode */
  activeView?: PrimaryView;
  /** Callback when user selects a primary view */
  onSelectView?: (view: PrimaryView) => void;
  /** Active workspace ID */
  activeWorkspaceId?: string;
  /** Callback when user switches active workspace */
  onSelectWorkspace?: (wsId: string) => void;
  /** Active thread title */
  activeThreadTitle?: string;
  /** Callback when user clicks a thread inside a workspace */
  onSelectThread?: (wsId: string, threadTitle: string) => void;
  /** Callbacks for sidebar footer quick actions */
  onOpenThemeSelector?: () => void;
  onOpenShortcuts?: () => void;
  onOpenSettings?: () => void;
  onOpenAbout?: () => void;
  onOpenNewWorkspaceModal?: () => void;
  /** Optional custom class name */
  className?: string;
}

interface ContextMenuPos {
  x: number;
  y: number;
  wsId: string;
}

// Initial realistic workspaces matching the VibeGrid core architecture
const INITIAL_WORKSPACES: WorkspaceFolder[] = [
  {
    id: 'ws-default',
    name: 'Default',
    path: '~/vibegrid/core',
    badge: 'CORE',
    isExpanded: true,
    threads: [
      { id: 't-1', title: 'VibeGrid Core Terminal', timestamp: 'now', agentBadge: 'RUST PTY' },
      { id: 't-2', title: 'PTY Master Stream Loop', timestamp: '2m', agentBadge: 'IPC' },
    ],
  },
  {
    id: 'ws-swarm',
    name: 'Production Swarm',
    path: '~/vibegrid/swarm',
    badge: 'MULTI-AGENT',
    isExpanded: true,
    threads: [
      { id: 't-3', title: 'Claude Code · Auth AST Refactor', timestamp: 'now', agentBadge: 'CLAUDE 3.7' },
      { id: 't-4', title: 'Codex · Ringbuffer Fuzzer', timestamp: '5m', agentBadge: 'O3-MINI' },
      { id: 't-5', title: 'Antigravity · Subagent Fiber', timestamp: '8m', agentBadge: 'DEEPMIND' },
    ],
  },
  {
    id: 'ws-frontend',
    name: 'Frontend App',
    path: '~/vibegrid/website',
    badge: 'NEXT.JS',
    isExpanded: false,
    threads: [
      { id: 't-6', title: 'website/app/page.tsx', timestamp: '12m', agentBadge: 'REACT 18' },
      { id: 't-7', title: 'Tailwind Solid Dark Theme', timestamp: '20m', agentBadge: 'CSS' },
    ],
  },
  {
    id: 'ws-kernel',
    name: 'Rust Kernel',
    path: '~/vibegrid/src-tauri',
    badge: 'METAL GPU',
    isExpanded: false,
    threads: [
      { id: 't-8', title: 'src-tauri/src/pty.rs', timestamp: '34m', agentBadge: 'TAURI 2' },
      { id: 't-9', title: 'Zero-Copy Shared Memory', timestamp: '1h', agentBadge: 'KERNEL' },
    ],
  },
];

const SETTINGS_TABS = [
  { id: 'font', label: 'Font & Appearance', icon: Type },
  { id: 'theme', label: 'Themes & Colors', icon: Palette },
  { id: 'terminal', label: 'Terminal & PTY Engine', icon: TerminalIcon },
  { id: 'workspaces', label: 'Workspace Isolation', icon: Layout },
  { id: 'limits', label: 'GPU & Buffer Limits', icon: Sliders },
  { id: 'keyboard', label: 'Keybindings & Shortcuts', icon: KeyboardIcon },
  { id: 'profiles', label: 'Agent Profiles & MCP', icon: UserRound },
] as const;

// ============================================================================
// Main Component
// ============================================================================

export function DesktopAppSidebar({
  isOpen: controlledIsOpen,
  onToggle,
  activeView: controlledActiveView,
  onSelectView,
  activeWorkspaceId: controlledActiveWorkspaceId,
  onSelectWorkspace,
  activeThreadTitle: controlledActiveThreadTitle,
  onSelectThread,
  onOpenThemeSelector,
  onOpenShortcuts,
  onOpenSettings,
  onOpenAbout,
  onOpenNewWorkspaceModal,
  className = '',
}: DesktopAppSidebarProps) {
  // Uncontrolled state fallbacks
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [internalActiveView, setInternalActiveView] = useState<PrimaryView>('grid');
  const activeView = controlledActiveView !== undefined ? controlledActiveView : internalActiveView;

  const [workspaces, setWorkspaces] = useState<WorkspaceFolder[]>(INITIAL_WORKSPACES);
  const [internalActiveWsId, setInternalActiveWsId] = useState<string>('ws-default');
  const activeWorkspaceId = controlledActiveWorkspaceId !== undefined ? controlledActiveWorkspaceId : internalActiveWsId;

  const [internalActiveThread, setInternalActiveThread] = useState<string>('VibeGrid Core Terminal');
  const activeThreadTitle = controlledActiveThreadTitle !== undefined ? controlledActiveThreadTitle : internalActiveThread;

  // Modals & Popups local states
  const [isLocalSettingsOpen, setIsLocalSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>('font');
  const [isLocalShortcutsOpen, setIsLocalShortcutsOpen] = useState(false);
  const [isLocalAboutOpen, setIsLocalAboutOpen] = useState(false);
  const [isNewWsModalOpen, setIsNewWsModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsPath, setNewWsPath] = useState('~/vibegrid/new-project');

  // Workspace Rename / Delete state
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuPos | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'success' } | null>(null);

  const showToast = (text: string, type: 'info' | 'success' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 2400);
  };

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = () => setContextMenu(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('contextmenu', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('contextmenu', handleClose);
    };
  }, [contextMenu]);

  const handleToggleSidebar = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const handleSelectPrimaryView = (view: PrimaryView) => {
    if (onSelectView) {
      onSelectView(view);
    } else {
      setInternalActiveView(view);
    }
  };

  const handleWorkspaceClick = (id: string) => {
    if (onSelectWorkspace) {
      onSelectWorkspace(id);
    } else {
      setInternalActiveWsId(id);
    }
    // Auto-expand on selection
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isExpanded: true } : w))
    );
  };

  const toggleFolderExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isExpanded: !w.isExpanded } : w))
    );
  };

  const handleThreadClick = (wsId: string, title: string) => {
    if (onSelectThread) {
      onSelectThread(wsId, title);
    } else {
      setInternalActiveWsId(wsId);
      setInternalActiveThread(title);
      setInternalActiveView('grid');
    }
  };

  const handleCreateNewWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = newWsName.trim() || `Workspace ${workspaces.length + 1}`;
    const newWs: WorkspaceFolder = {
      id: `ws-${Date.now()}`,
      name: finalName,
      path: newWsPath.trim() || `~/vibegrid/${finalName.toLowerCase().replace(/\s+/g, '-')}`,
      badge: 'CUSTOM',
      isExpanded: true,
      threads: [{ id: `t-${Date.now()}`, title: `${finalName} Terminal`, timestamp: 'now', agentBadge: 'LOCAL' }],
    };

    setWorkspaces((prev) => [...prev, newWs]);
    setInternalActiveWsId(newWs.id);
    setIsNewWsModalOpen(false);
    setNewWsName('');
    showToast(`Workspace "${finalName}" created & active.`, 'success');
  };

  const handleDuplicateWorkspace = (id: string) => {
    const target = workspaces.find((w) => w.id === id);
    if (!target) return;
    const copyWs: WorkspaceFolder = {
      ...target,
      id: `ws-copy-${Date.now()}`,
      name: `${target.name} (Copy)`,
      threads: target.threads.map((t) => ({ ...t, id: `t-${Date.now()}-${Math.random()}` })),
    };
    setWorkspaces((prev) => [...prev, copyWs]);
    showToast(`Project "${copyWs.name}" duplicated.`, 'success');
  };

  const handleDeleteWorkspace = (id: string) => {
    if (workspaces.length <= 1) {
      // Reset to default
      setWorkspaces(INITIAL_WORKSPACES);
      setInternalActiveWsId('ws-default');
      setDeleteConfirmId(null);
      showToast('Workspace reset to default environment.', 'info');
      return;
    }

    const nextWorkspaces = workspaces.filter((w) => w.id !== id);
    setWorkspaces(nextWorkspaces);
    if (activeWorkspaceId === id) {
      setInternalActiveWsId(nextWorkspaces[0]?.id || 'ws-default');
    }
    setDeleteConfirmId(null);
    showToast('Project removed.', 'info');
  };

  const handleRenameWorkspace = (id: string) => {
    if (!renameText.trim()) {
      setRenameTargetId(null);
      return;
    }
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, name: renameText.trim() } : w))
    );
    setRenameTargetId(null);
    showToast('Project renamed successfully.', 'success');
  };

  const activeWsObject = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  // ==========================================================================
  // Render: Collapsed Icon Bar (48px)
  // ==========================================================================
  if (!isOpen) {
    return (
      <aside
        className={`w-12 bg-[#111111] border-r border-[#4a4b50] flex flex-col items-center py-3 gap-3 select-none z-20 font-sans shrink-0 transition-all duration-200 text-white ${className}`}
        style={{ width: '48px' }}
      >
        {/* App Logo */}
        <div
          onClick={handleToggleSidebar}
          title="Expand VibeGrid Sidebar"
          className="h-8 w-8 rounded-lg bg-[#090a0c] border border-[#4a4b50] flex items-center justify-center overflow-hidden p-0.5 hover:border-[#5683da] transition-colors cursor-pointer shadow-sm"
        >
          <img src="/logo.png" alt="VibeGrid" className="w-full h-full object-cover rounded-md" />
        </div>

        {/* Expand Toggle Button */}
        <button
          type="button"
          onClick={handleToggleSidebar}
          title="Expand Sidebar"
          aria-label="Expand sidebar"
          className="p-2 rounded-xl text-[#a9a9aa] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* New Workspace Action */}
        <button
          type="button"
          onClick={() => {
            if (onOpenNewWorkspaceModal) onOpenNewWorkspaceModal();
            else setIsNewWsModalOpen(true);
          }}
          title="New Project Workspace"
          aria-label="New workspace"
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#5683da]" />
        </button>

        <div className="w-6 h-px bg-[#4a4b50]/60 my-1" />

        {/* Primary View Icons */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectPrimaryView('grid')}
            title="Terminal Grid Matrix"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              activeView === 'grid'
                ? 'bg-white/[0.08] border-[#5683da] text-white'
                : 'border-transparent text-[#a9a9aa] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <TerminalIcon className="w-4 h-4 text-[#5683da]" />
          </button>

          <button
            type="button"
            onClick={() => handleSelectPrimaryView('hub')}
            title="AI Agent Hub"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              activeView === 'hub'
                ? 'bg-white/[0.08] border-[#5683da] text-white'
                : 'border-transparent text-[#a9a9aa] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Bot className="w-4 h-4 text-[#ff8964]" />
          </button>

          <button
            type="button"
            onClick={() => handleSelectPrimaryView('studio')}
            title="Layout Studio"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              activeView === 'studio'
                ? 'bg-white/[0.08] border-[#5683da] text-white'
                : 'border-transparent text-[#a9a9aa] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Layout className="w-4 h-4 text-[#27c93f]" />
          </button>

          <button
            type="button"
            onClick={() => handleSelectPrimaryView('diff')}
            title="Git Diff Viewer"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              activeView === 'diff'
                ? 'bg-white/[0.08] border-[#5683da] text-white'
                : 'border-transparent text-[#a9a9aa] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <GitCommit className="w-4 h-4 text-[#eab308]" />
          </button>
        </div>

        {/* Bottom Stack of Footer Action Icons */}
        <div className="mt-auto flex flex-col items-center gap-2">
          {/* Theme */}
          <button
            type="button"
            onClick={() => {
              if (onOpenThemeSelector) onOpenThemeSelector();
            }}
            title="Color Palette / Theme"
            className="p-2 rounded-xl text-[#a9a9aa] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Shortcuts */}
          <button
            type="button"
            onClick={() => {
              if (onOpenShortcuts) onOpenShortcuts();
              else setIsLocalShortcutsOpen(true);
            }}
            title="Keyboard Shortcuts (Cmd+/)"
            className="p-2 rounded-xl text-[#a9a9aa] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <KeyboardIcon className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              else setIsLocalSettingsOpen(true);
            }}
            title="Preferences & Settings (Cmd+,)"
            className="p-2 rounded-xl text-[#a9a9aa] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* About */}
          <button
            type="button"
            onClick={() => {
              if (onOpenAbout) onOpenAbout();
              else setIsLocalAboutOpen(true);
            }}
            title="About VibeGrid"
            className="p-2 rounded-xl text-[#a9a9aa] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <UserRound className="w-4 h-4" />
          </button>

          {/* Hardware Engine Status Dot */}
          <div
            title="Metal / WebGL 2.0 · 60 FPS"
            className="w-2.5 h-2.5 rounded-full bg-[#27c93f] shadow-[0_0_8px_#27c93f] my-1"
          />
        </div>
      </aside>
    );
  }

  // ==========================================================================
  // Render: Settings Subview (When user clicks settings in sidebar)
  // ==========================================================================
  if (isLocalSettingsOpen) {
    return (
      <aside
        className={`w-[220px] sm:w-[240px] bg-[#111111] border-r border-[#4a4b50] flex flex-col h-full select-none z-20 shrink-0 font-sans overflow-hidden text-white ${className}`}
      >
        <div className="p-3 pb-1">
          <button
            type="button"
            onClick={() => setIsLocalSettingsOpen(false)}
            className="w-full h-10 flex items-center justify-center gap-2 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 text-white/90 hover:text-white text-[13px] font-normal transition-all cursor-pointer"
          >
            <X className="w-4 h-4 text-white/70" />
            <span>Close Settings</span>
          </button>
        </div>

        <div className="mt-3 px-4 py-1.5 text-[11px] font-medium text-[#a9a9aa]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#6b6c6d]">Settings Menu</span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5 custom-scrollbar">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSettingsTab === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => {
                  setActiveSettingsTab(tab.id);
                  if (tab.id === 'theme' && onOpenThemeSelector) {
                    onOpenThemeSelector();
                  } else if (tab.id === 'keyboard' && onOpenShortcuts) {
                    onOpenShortcuts();
                  }
                }}
                className={`group relative flex items-center justify-between h-10 px-3.5 rounded-2xl text-[13px] transition-all cursor-pointer ${
                  isActive
                    ? 'text-white bg-white/[0.06] border border-white/10 font-normal shadow-sm'
                    : 'text-[#a9a9aa] hover:text-white bg-transparent hover:bg-white/[0.03] border border-transparent hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#5683da]' : 'text-[#6b6c6d] group-hover:text-white'
                    }`}
                  />
                  <span className="truncate">{tab.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-2 border-t border-[#4a4b50]/60 bg-transparent">
          <button
            type="button"
            onClick={() => setIsLocalSettingsOpen(false)}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-[#a9a9aa] hover:text-white hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#6b6c6d]" />
            <span>Back to Workspace</span>
          </button>
        </div>
      </aside>
    );
  }

  // ==========================================================================
  // Render: Full Expanded Workspace Sidebar (220px / 240px)
  // ==========================================================================
  return (
    <>
      <aside
        className={`w-[220px] sm:w-[240px] bg-[#111111] border-r border-[#4a4b50] flex flex-col h-full select-none z-20 shrink-0 font-sans overflow-hidden text-white ${className}`}
      >
        {/* ================================================================= */}
        {/* 1. Header: VibeGrid Logo + Workspace Selector + Collapse Button  */}
        {/* ================================================================= */}
        <div className="p-3 border-b border-[#4a4b50]/60 space-y-2.5 bg-[#090a0c]">
          {/* Top Row: App Icon / Logo + Collapse Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* App Icon */}
              <div className="h-7 w-7 rounded-lg bg-[#111111] border border-[#4a4b50] flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
                <img src="/logo.png" alt="VibeGrid" className="w-full h-full object-cover rounded-md" />
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-white">
                  Vibe<span className="text-[#5683da]">Grid</span>
                </span>
                <span className="ml-1 text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#111111] border border-[#4a4b50] text-[#5683da]">
                  v2.4
                </span>
              </div>
            </div>

            {/* Collapse button */}
            <button
              type="button"
              onClick={handleToggleSidebar}
              title="Collapse sidebar to icon bar"
              aria-label="Collapse sidebar"
              className="p-1 rounded-lg text-[#a9a9aa] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Workspace Identity / Selector Pill */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#111111] border border-[#4a4b50]/80 text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="h-2 w-2 rounded-full bg-[#27c93f] shrink-0" />
              <span className="font-mono text-[11px] font-bold text-white truncate">
                {activeWsObject.name}
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#a9a9aa] px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50]/50 shrink-0">
              {activeWsObject.badge || 'PROD'}
            </span>
          </div>

          {/* + New Workspace Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenNewWorkspaceModal) onOpenNewWorkspaceModal();
              else setIsNewWsModalOpen(true);
            }}
            className="w-full h-9 flex items-center justify-center gap-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white/90 hover:text-white text-xs font-medium transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#5683da]" />
            <span>+ New Workspace</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* 2. Primary Navigation Views                                       */}
        {/* ================================================================= */}
        <div className="px-3 pt-3 pb-1 space-y-1 border-b border-[#4a4b50]/50">
          <div className="px-1 text-[10px] font-mono uppercase tracking-wider text-[#6b6c6d] mb-1.5">
            Primary Views
          </div>

          {/* Terminal Grid View */}
          <button
            type="button"
            onClick={() => handleSelectPrimaryView('grid')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeView === 'grid'
                ? 'bg-white/[0.06] text-white border border-[#5683da]/60 font-medium'
                : 'text-[#a9a9aa] hover:text-white hover:bg-white/[0.03] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <TerminalIcon className={`w-3.5 h-3.5 ${activeView === 'grid' ? 'text-[#5683da]' : 'text-[#6b6c6d]'}`} />
              <span className="truncate">Terminal Grid</span>
            </div>
            {activeView === 'grid' && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#5683da] shadow-[0_0_6px_#5683da]" />
            )}
          </button>

          {/* Agent Hub */}
          <button
            type="button"
            onClick={() => handleSelectPrimaryView('hub')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeView === 'hub'
                ? 'bg-white/[0.06] text-white border border-[#ff8964]/60 font-medium'
                : 'text-[#a9a9aa] hover:text-white hover:bg-white/[0.03] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Bot className={`w-3.5 h-3.5 ${activeView === 'hub' ? 'text-[#ff8964]' : 'text-[#6b6c6d]'}`} />
              <span className="truncate">Agent Hub</span>
            </div>
            {activeView === 'hub' && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff8964] shadow-[0_0_6px_#ff8964]" />
            )}
          </button>

          {/* Layout Studio */}
          <button
            type="button"
            onClick={() => handleSelectPrimaryView('studio')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeView === 'studio'
                ? 'bg-white/[0.06] text-white border border-[#27c93f]/60 font-medium'
                : 'text-[#a9a9aa] hover:text-white hover:bg-white/[0.03] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Layout className={`w-3.5 h-3.5 ${activeView === 'studio' ? 'text-[#27c93f]' : 'text-[#6b6c6d]'}`} />
              <span className="truncate">Layout Studio</span>
            </div>
            {activeView === 'studio' && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#27c93f] shadow-[0_0_6px_#27c93f]" />
            )}
          </button>

          {/* Git Diff Viewer */}
          <button
            type="button"
            onClick={() => handleSelectPrimaryView('diff')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeView === 'diff'
                ? 'bg-white/[0.06] text-white border border-[#eab308]/60 font-medium'
                : 'text-[#a9a9aa] hover:text-white hover:bg-white/[0.03] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <GitCommit className={`w-3.5 h-3.5 ${activeView === 'diff' ? 'text-[#eab308]' : 'text-[#6b6c6d]'}`} />
              <span className="truncate">Git Diff Viewer</span>
            </div>
            {activeView === 'diff' && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#eab308] shadow-[0_0_6px_#eab308]" />
            )}
          </button>
        </div>

        {/* ================================================================= */}
        {/* 3. Workspaces & Projects Tree                                     */}
        {/* ================================================================= */}
        <div className="mt-2 px-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#6b6c6d]">
          <span>Workspaces Tree</span>
          <button
            type="button"
            onClick={() => setIsNewWsModalOpen(true)}
            title="Create Project Folder"
            className="p-1 rounded-md hover:bg-white/10 text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5 custom-scrollbar">
          {workspaces.map((ws) => {
            const isWsActive = ws.id === activeWorkspaceId;
            const isExpanded = ws.isExpanded !== false;

            return (
              <div key={ws.id} className="space-y-1">
                {/* Project Folder Row */}
                <div
                  onClick={() => handleWorkspaceClick(ws.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY, wsId: ws.id });
                  }}
                  className={`group relative flex items-center justify-between h-9 px-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isWsActive
                      ? 'text-white bg-white/[0.06] border border-white/10 font-medium'
                      : 'text-[#a9a9aa] hover:text-white bg-transparent hover:bg-white/[0.03] border border-transparent hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {/* Expand/Collapse Chevron */}
                    <button
                      type="button"
                      onClick={(e) => toggleFolderExpand(e, ws.id)}
                      className="p-0.5 rounded hover:bg-white/10 text-[#6b6c6d] hover:text-white transition-colors"
                      title={isExpanded ? 'Collapse folder' : 'Expand folder'}
                    >
                      <ChevronRight
                        className={`w-3 h-3 transition-transform ${
                          isExpanded ? 'rotate-90 text-white/80' : 'text-[#6b6c6d]'
                        }`}
                      />
                    </button>

                    <Folder
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isWsActive ? 'text-[#5683da]' : 'text-[#6b6c6d] group-hover:text-white'
                      }`}
                    />
                    <span className="truncate font-sans text-xs">{ws.name}</span>
                  </div>

                  {/* Hover Quick Actions: Rename, Duplicate, Delete */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameTargetId(ws.id);
                        setRenameText(ws.name);
                      }}
                      title="Rename Project"
                      className="p-1 rounded hover:bg-white/10 text-[#a9a9aa] hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateWorkspace(ws.id);
                      }}
                      title="Duplicate Project"
                      className="p-1 rounded hover:bg-white/10 text-[#a9a9aa] hover:text-white transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(ws.id);
                      }}
                      title="Delete Project"
                      className="p-1 rounded hover:bg-rose-500/20 text-[#a9a9aa] hover:text-rose-300 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Sub-Threads under Project */}
                {isExpanded && (
                  <div className="pl-4 space-y-0.5 border-l border-[#4a4b50]/30 ml-3">
                    {ws.threads.map((thread) => {
                      const isThreadActive = isWsActive && activeThreadTitle === thread.title;
                      return (
                        <div
                          key={thread.id}
                          onClick={() => handleThreadClick(ws.id, thread.title)}
                          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                            isThreadActive
                              ? 'bg-white/[0.06] text-white border border-[#5683da]/40 font-medium'
                              : 'text-[#6b6c6d] hover:text-[#d1d1d1] hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate pr-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${isThreadActive ? 'bg-[#5683da]' : 'bg-[#4a4b50]'}`} />
                            <span className="truncate">{thread.title}</span>
                          </div>
                          <span className="text-[9px] text-[#6b6c6d] shrink-0">{thread.timestamp}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* 4. Sidebar Footer: Quick Action Buttons & Engine Status           */}
        {/* ================================================================= */}
        <div className="p-2 border-t border-[#4a4b50] bg-[#090a0c] space-y-2">
          {/* Quick Action Button Icons: Palette, Keyboard, Settings, UserRound */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#111111] border border-[#4a4b50]/60">
            <button
              type="button"
              onClick={() => {
                if (onOpenThemeSelector) onOpenThemeSelector();
              }}
              title="Theme Studio (Palette)"
              aria-label="Theme Studio"
              className="flex items-center justify-center p-2 rounded-lg text-[#a9a9aa] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenShortcuts) onOpenShortcuts();
                else setIsLocalShortcutsOpen(true);
              }}
              title="Keybindings & Shortcuts (Cmd+/)"
              aria-label="Keybindings"
              className="flex items-center justify-center p-2 rounded-lg text-[#a9a9aa] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <KeyboardIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenSettings) onOpenSettings();
                else setIsLocalSettingsOpen(true);
              }}
              title="Preferences & Settings (Cmd+,)"
              aria-label="Settings"
              className="flex items-center justify-center p-2 rounded-lg text-[#a9a9aa] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenAbout) onOpenAbout();
                else setIsLocalAboutOpen(true);
              }}
              title="About VibeGrid"
              aria-label="About"
              className="flex items-center justify-center p-2 rounded-lg text-[#a9a9aa] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <UserRound className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Engine Status Line */}
          <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#111111] border border-[#4a4b50]/50 text-[10px] font-mono text-[#a9a9aa]">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-[#27c93f] shadow-[0_0_6px_#27c93f] shrink-0" />
              <span className="truncate">Metal / WebGL 2.0</span>
            </div>
            <span className="text-[#27c93f] font-bold shrink-0">60 FPS</span>
          </div>
        </div>
      </aside>

      {/* ================================================================= */}
      {/* 5. Interactive Modals (New Workspace, Rename, Delete, Shortcuts, About) */}
      {/* ================================================================= */}

      {/* New Workspace Modal */}
      {isNewWsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in"
          onClick={() => setIsNewWsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#111111] border border-[#4a4b50] rounded-2xl shadow-2xl p-5 space-y-4 text-white"
          >
            <div className="flex items-center justify-between border-b border-[#4a4b50] pb-3">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-[#5683da]" />
                <h3 className="font-bold text-sm">Create New Project Workspace</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewWsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-[#a9a9aa] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewWorkspace} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-[#a9a9aa] uppercase block mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Production Swarm, Kernel Core"
                  autoFocus
                  className="w-full bg-[#090a0c] border border-[#4a4b50] focus:border-[#5683da] rounded-xl px-3 py-2 text-xs text-white placeholder-[#6b6c6d] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#a9a9aa] uppercase block mb-1">
                  Project Path (CWD)
                </label>
                <input
                  type="text"
                  value={newWsPath}
                  onChange={(e) => setNewWsPath(e.target.value)}
                  placeholder="~/vibegrid/project"
                  className="w-full bg-[#090a0c] border border-[#4a4b50] focus:border-[#5683da] rounded-xl px-3 py-2 text-xs text-white placeholder-[#6b6c6d] font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#4a4b50]">
                <button
                  type="button"
                  onClick={() => setIsNewWsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#4a4b50] bg-[#090a0c] text-xs text-[#a9a9aa] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#5683da] hover:bg-[#456ec2] text-xs font-semibold text-white shadow-sm transition-all"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameTargetId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in"
          onClick={() => setRenameTargetId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#111111] border border-[#4a4b50] rounded-2xl shadow-2xl p-5 space-y-4 text-white"
          >
            <div className="flex items-center justify-between border-b border-[#4a4b50] pb-3">
              <h3 className="font-bold text-sm">Rename Project Workspace</h3>
              <button
                type="button"
                onClick={() => setRenameTargetId(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-[#a9a9aa] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameWorkspace(renameTargetId)}
                autoFocus
                className="w-full bg-[#090a0c] border border-[#4a4b50] focus:border-[#5683da] rounded-xl px-3 py-2 text-xs text-white placeholder-[#6b6c6d] focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameTargetId(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#4a4b50] bg-[#090a0c] text-xs text-[#a9a9aa] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRenameWorkspace(renameTargetId)}
                  className="px-4 py-1.5 rounded-lg bg-[#5683da] hover:bg-[#456ec2] text-xs font-semibold text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Reset Confirmation Modal */}
      {deleteConfirmId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#111111] border border-[#4a4b50] rounded-2xl shadow-2xl p-5 space-y-4 text-white"
          >
            <div className="flex items-center gap-2 text-rose-400">
              <Trash2 className="w-4 h-4" />
              <h3 className="font-bold text-sm">
                {workspaces.length === 1 ? 'Reset Project Workspace?' : 'Delete Project Workspace?'}
              </h3>
            </div>

            <p className="text-xs text-[#a9a9aa] leading-relaxed">
              {workspaces.length === 1
                ? 'This is your only active workspace. Deleting it will terminate running processes and reset to the clean default VibeGrid workspace.'
                : 'This project configuration and active terminal processes in this workspace will be terminated.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#4a4b50]">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#4a4b50] bg-[#090a0c] text-xs text-[#a9a9aa] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteWorkspace(deleteConfirmId)}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-sm"
              >
                {workspaces.length === 1 ? 'Reset Project' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right-Click Context Menu */}
      {contextMenu && (() => {
        const target = workspaces.find((w) => w.id === contextMenu.wsId);
        if (!target) return null;
        return (
          <div
            style={{
              left: Math.min(contextMenu.x, 300),
              top: Math.min(contextMenu.y, 400),
            }}
            className="fixed z-50 min-w-[170px] bg-[#111111] border border-[#4a4b50] rounded-xl shadow-2xl p-1 font-sans text-xs select-none animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 py-1 text-[10px] font-mono text-[#a9a9aa] uppercase tracking-wider truncate border-b border-[#4a4b50]/60 mb-1">
              {target.name}
            </div>
            <button
              type="button"
              onClick={() => {
                handleWorkspaceClick(target.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5 text-[#5683da]" />
              <span>Switch to Project</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRenameTargetId(target.id);
                setRenameText(target.name);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#ff8964]" />
              <span>Rename</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleDuplicateWorkspace(target.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#27c93f]" />
              <span>Duplicate</span>
            </button>
            <div className="h-px bg-[#4a4b50]/60 my-1" />
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmId(target.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition-colors text-left cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{workspaces.length === 1 ? 'Reset to Default' : 'Delete Project'}</span>
            </button>
          </div>
        );
      })()}

      {/* Shortcuts Modal (When triggered from sidebar) */}
      {isLocalShortcutsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in"
          onClick={() => setIsLocalShortcutsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#111111] border border-[#4a4b50] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white max-h-[85vh]"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#4a4b50] bg-[#090a0c]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#5683da]" />
                <h3 className="font-bold text-xs uppercase font-mono tracking-wider">Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLocalShortcutsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-[#a9a9aa] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs custom-scrollbar">
              <div className="p-3 rounded-xl bg-[#090a0c] border border-[#4a4b50]/60 space-y-2">
                <div className="text-[10px] font-mono text-[#5683da] font-semibold uppercase">Grid Operations</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#d1d1d1]">Split Vertical</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#111111] border border-[#4a4b50] font-mono text-[10px]">Cmd+D</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#d1d1d1]">Split Horizontal</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#111111] border border-[#4a4b50] font-mono text-[10px]">Cmd+Shift+D</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#d1d1d1]">Toggle Maximize</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#111111] border border-[#4a4b50] font-mono text-[10px]">Cmd+Shift+Enter</kbd>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#090a0c] border border-[#4a4b50]/60 space-y-2">
                <div className="text-[10px] font-mono text-[#ff8964] font-semibold uppercase">Navigation & Tools</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#d1d1d1]">Command Palette</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#111111] border border-[#4a4b50] font-mono text-[10px]">Cmd+K</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#d1d1d1]">Toggle Sidebar</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#111111] border border-[#4a4b50] font-mono text-[10px]">Cmd+B</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#d1d1d1]">Next / Prev Pane</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#111111] border border-[#4a4b50] font-mono text-[10px]">Ctrl+Tab</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Modal (When triggered from sidebar) */}
      {isLocalAboutOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in"
          onClick={() => setIsLocalAboutOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#111111] border border-[#4a4b50] rounded-2xl shadow-2xl p-6 space-y-4 text-center text-white"
          >
            <div className="flex items-center justify-between border-b border-[#4a4b50] pb-3 text-left">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#a9a9aa]">About VibeGrid</span>
              <button
                type="button"
                onClick={() => setIsLocalAboutOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-[#a9a9aa] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mx-auto w-12 h-12 rounded-xl bg-[#090a0c] border border-[#4a4b50] flex items-center justify-center text-[#5683da] font-mono font-bold text-lg">
              VG
            </div>

            <div>
              <h3 className="font-bold text-lg">VibeGrid</h3>
              <p className="text-xs text-[#a9a9aa] font-mono">Version 2.4.0 (Desktop Demo)</p>
              <p className="text-xs text-[#d1d1d1] mt-2 leading-relaxed">
                The high-performance multi-pane terminal & AI agent matrix built for modern developer workflows.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-[#4a4b50]">
              <div className="p-2.5 rounded-xl bg-[#090a0c] border border-[#4a4b50]/60">
                <div className="text-[9px] font-mono text-[#6b6c6d] uppercase">Engine</div>
                <div className="text-xs font-medium text-white flex items-center gap-1 mt-0.5">
                  <Cpu className="w-3.5 h-3.5 text-[#5683da]" />
                  <span>Tauri 2 + Rust</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#090a0c] border border-[#4a4b50]/60">
                <div className="text-[9px] font-mono text-[#6b6c6d] uppercase">GPU Canvas</div>
                <div className="text-xs font-medium text-white flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#27c93f]" />
                  <span>Metal / WebGL</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsLocalAboutOpen(false)}
                className="w-full py-2 rounded-xl bg-[#5683da] hover:bg-[#456ec2] text-xs font-semibold text-white shadow-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 z-50 px-3.5 py-2 rounded-xl bg-[#111111] border border-[#5683da] text-white text-xs font-mono shadow-2xl animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </>
  );
}

export default DesktopAppSidebar;
