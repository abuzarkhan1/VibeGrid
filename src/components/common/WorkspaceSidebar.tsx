import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Folder,
  ChevronRight,
  ChevronLeft,
  Settings,
  Trash2,
  Edit2,
  Copy,
  Type,
  Palette,
  Terminal as TerminalIcon,
  Layout,
  Sliders,
  Keyboard as KeyboardIcon,
  UserRound,
  X,
  Bot,
  GitCommit,
  LayoutGrid,
  Check,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAgentStore } from '@/store/useAgentStore';
import { useLayoutStudioStore } from '@/store/useLayoutStudioStore';
import { InputModal } from '@/components/ui/InputModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { pickFolder } from '@/lib/tauri';

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface ContextMenuPos {
  x: number;
  y: number;
  wsId: string;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ isOpen, onToggle }) => {
  const {
    workspaces,
    activeWorkspaceId,
    isLoading,
    renameWorkspace,
    duplicateWorkspace,
    deleteWorkspace,
    switchWorkspace,
    createWorkspace,
  } = useWorkspaceStore();

  const {
    activeViewMode,
    setActiveViewMode,
    activeThreadTitle,
    setActiveThreadTitle,
    toggleSettings,
    addToast,
    isSettingsOpen,
    activeSettingsTab,
    setActiveSettingsTab,
    isDiffViewerOpen,
    setDiffViewerOpen,
  } = useUIStore();

  const sidebarWidth = useSettingsStore((s) => s.sidebarWidth);

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ default: true });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsFolderCwd, setNewWsFolderCwd] = useState<string | undefined>(undefined);
  const [newWsFolderName, setNewWsFolderName] = useState<string>('');
  const [editingWsId, setEditingWsId] = useState<string | null>(null);
  const [editingWsName, setEditingWsName] = useState<string>('');
  const isEscapeRef = useRef(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [deleteWsId, setDeleteWsId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuPos | null>(null);

  useEffect(() => {
    if (editingWsId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingWsId]);

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

  const deleteTarget = workspaces.find((w) => w.id === deleteWsId);

  const handleSaveRename = (wsId: string) => {
    const trimmed = editingWsName.trim();
    if (!trimmed) {
      setEditingWsId(null);
      return;
    }
    const maxLen = useSettingsStore.getState().workspaceNameMaxLength || 32;
    renameWorkspace(wsId, trimmed.slice(0, maxLen));
    setEditingWsId(null);
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }));
  };

  const handleWorkspaceClick = (id: string) => {
    switchWorkspace(id);
    setExpandedFolders((prev) => ({ ...prev, [id]: true }));
  };

  const handleNewWorkspace = async () => {
    const chosenFolder = await pickFolder('Choose Project Directory');
    if (chosenFolder) {
      const parts = chosenFolder.replace(/\\/g, '/').split('/').filter(Boolean);
      const folderName = parts[parts.length - 1] || 'New Workspace';
      setNewWsFolderName(folderName);
      setNewWsFolderCwd(chosenFolder);
      setShowCreateModal(true);
    } else {
      setNewWsFolderName(`Workspace ${workspaces.length + 1}`);
      setNewWsFolderCwd(undefined);
      setShowCreateModal(true);
    }
  };

  const handleCreateWorkspace = (name: string) => {
    const maxLen = useSettingsStore.getState().workspaceNameMaxLength;
    const finalName = (name.trim() || newWsFolderName || 'New Workspace').slice(0, maxLen);
    createWorkspace(finalName, {
      activate: true,
      defaultCwd: newWsFolderCwd,
    });
    setShowCreateModal(false);
    setNewWsFolderCwd(undefined);
    addToast({
      type: 'success',
      title: 'Workspace Created',
      description: `"${finalName}" is now active${newWsFolderCwd ? ` (${newWsFolderCwd})` : ''}.`,
    });

    setActiveViewMode('hub');
  };

  const handleOpenThread = (wsId: string, title: string) => {
    switchWorkspace(wsId);
    setActiveThreadTitle(title);
    setActiveViewMode('grid');
  };

  const handleOpenGeneralSettings = () => {
    if (!isSettingsOpen) {
      setActiveSettingsTab('font');
      toggleSettings();
    } else {
      toggleSettings();
    }
  };

  const settingsTabs = [
    { id: 'font', label: 'Font & Appearance', icon: Type },
    { id: 'theme', label: 'Themes', icon: Palette },
    { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
    { id: 'workspaces', label: 'Workspaces', icon: Layout },
    { id: 'limits', label: 'Limits', icon: Sliders },
    { id: 'appearance', label: 'UI Chrome', icon: Palette },
    { id: 'keyboard', label: 'Keybindings', icon: KeyboardIcon },
    { id: 'profiles', label: 'Profiles', icon: UserRound },
  ] as const;

  if (isSettingsOpen) {
    return (
      <aside
        style={{ width: sidebarWidth || 260 }}
        className="bg-[#111111] border-r border-[#4a4b50] flex flex-col h-full select-none z-20 animate-fade-in shrink-0 font-sans overflow-hidden text-white"
      >
        <div className="p-3 pb-1">
          <button
            type="button"
            onClick={toggleSettings}
            className="w-full h-9 flex items-center justify-center gap-2 px-4 rounded-xl bg-[#303236] hover:bg-[#303236]/80 border border-[#4a4b50] text-white text-[13px] font-medium transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <X className="w-4 h-4 text-[#a9a9aa]" />
            <span>Close Settings</span>
          </button>
        </div>

        <div className="mt-3 px-4 py-1.5 text-[11px] font-medium text-[#a9a9aa]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Settings Menu</span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 custom-scrollbar">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSettingsTab === tab.id;
            return (
              <div
                key={tab.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveSettingsTab(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveSettingsTab(tab.id);
                  }
                }}
                className={`group relative flex items-center justify-between h-9 px-3.5 rounded-lg text-[13px] transition-all cursor-pointer ${
                  isActive
                    ? 'text-white bg-[#303236] border border-[#5683da]/60 font-medium shadow-[0_0_12px_rgba(86,131,218,0.12)]'
                    : 'text-[#a9a9aa] hover:text-white bg-transparent hover:bg-[#303236] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#5683da]' : 'text-[#a9a9aa] group-hover:text-white'}`} />
                  <span className="truncate">{tab.label}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#5683da] shadow-[0_0_6px_#5683da]" />}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-[#4a4b50] bg-transparent">
          <button
            type="button"
            onClick={toggleSettings}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#a9a9aa] hover:text-white hover:bg-[#303236] transition-colors text-left cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#a9a9aa]" />
            <span>Back to Workspace</span>
          </button>
        </div>
      </aside>
    );
  }

  if (!isOpen) {
    return (
      <div className="w-14 bg-[#111111] border-r border-[#4a4b50] flex flex-col items-center py-3 gap-2.5 select-none z-20 font-sans shrink-0">
        {/* App Logo */}
        <div
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle();
            }
          }}
          title="Expand Sidebar"
          className="w-8 h-8 rounded-lg bg-[#090a0c] border border-[#4a4b50] flex items-center justify-center overflow-hidden p-0.5 hover:border-[#5683da] transition-colors cursor-pointer shadow-sm"
        >
          <img src="/logo.png" alt="VibeGrid" className="w-full h-full object-cover rounded-md" />
        </div>

        {/* Expand Toggle Button */}
        <button
          type="button"
          onClick={onToggle}
          title="Expand Sidebar"
          aria-label="Expand sidebar"
          className="p-2 rounded-lg text-[#a9a9aa] hover:text-white hover:bg-[#303236] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Quick + New Workspace */}
        <button
          type="button"
          onClick={handleNewWorkspace}
          title="New Workspace"
          aria-label="New workspace"
          className="p-2 rounded-lg bg-[#5683da] text-white hover:bg-[#5683da]/90 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-[#4a4b50] my-1" />

        {/* Primary View Icons */}
        <button
          type="button"
          onClick={() => setActiveViewMode('hub')}
          title="Workspace Hub"
          aria-label="Workspace Hub"
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            activeViewMode === 'hub'
              ? 'bg-[#303236] text-[#5683da] border border-[#5683da] shadow-[0_0_10px_rgba(86,131,218,0.2)]'
              : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236] border border-transparent'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => useAgentStore.getState().openLauncher()}
          title="Agent Hub"
          aria-label="Agent Hub"
          className="p-2 rounded-lg text-[#a9a9aa] hover:text-white hover:bg-[#303236] transition-colors cursor-pointer border border-transparent"
        >
          <Bot className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => useLayoutStudioStore.getState().openStudio()}
          title="Layout Studio"
          aria-label="Layout Studio"
          className="p-2 rounded-lg text-[#a9a9aa] hover:text-white hover:bg-[#303236] transition-colors cursor-pointer border border-transparent"
        >
          <Layout className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setDiffViewerOpen(!isDiffViewerOpen)}
          title="Git Diff Viewer"
          aria-label="Git Diff Viewer"
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            isDiffViewerOpen
              ? 'bg-[#303236] text-[#5683da] border border-[#5683da] shadow-[0_0_10px_rgba(86,131,218,0.2)]'
              : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236] border border-transparent'
          }`}
        >
          <GitCommit className="w-4 h-4" />
        </button>

        {/* Bottom Pinned Actions */}
        <div className="mt-auto w-full p-2.5 border-t border-[#4a4b50] bg-[#111111] flex items-center justify-center shrink-0">
          <button
            type="button"
            onClick={handleOpenGeneralSettings}
            title="Settings"
            aria-label="Settings"
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isSettingsOpen ? 'bg-[#303236] text-[#5683da]' : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236]'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <aside
        style={{ width: sidebarWidth || 260 }}
        className="bg-[#111111] border-r border-[#4a4b50] flex flex-col h-full select-none z-20 animate-fade-in shrink-0 font-sans overflow-hidden text-white"
      >
        {/* Top Header / Action Area */}
        <div className="p-3 pb-2 space-y-3">
          {/* Top Brand Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#090a0c] border border-[#4a4b50] flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
                <img src="/logo.png" alt="VibeGrid Logo" className="w-full h-full object-cover rounded-md" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-xs tracking-tight text-white">
                  Vibe<span className="text-[#5683da]">Grid</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#303236] border border-[#4a4b50] text-[#5683da]">
                  v2.4
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggle}
              title="Collapse Sidebar"
              aria-label="Collapse sidebar"
              className="p-1 rounded-md text-[#a9a9aa] hover:text-white hover:bg-[#303236] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* + New Workspace Primary Pill Button */}
          <button
            type="button"
            onClick={handleNewWorkspace}
            className="w-full h-9 flex items-center justify-center gap-2 px-4 rounded-xl bg-[#5683da] hover:bg-[#5683da]/90 text-white text-[13px] font-medium transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Workspace</span>
          </button>
        </div>

        {/* Primary Views Section */}
        <div className="px-3 py-1 space-y-1">
          <div className="px-1 py-1 text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">
            Views
          </div>

          {/* Workspace Hub */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveViewMode('hub')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveViewMode('hub');
              }
            }}
            className={`group flex items-center justify-between h-8 px-3 rounded-lg text-xs transition-all cursor-pointer ${
              activeViewMode === 'hub'
                ? 'bg-[#303236] text-white font-medium border border-[#5683da]/40 shadow-[0_0_12px_rgba(86,131,218,0.12)]'
                : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <LayoutGrid className={`w-3.5 h-3.5 transition-colors ${activeViewMode === 'hub' ? 'text-[#5683da]' : 'text-[#a9a9aa] group-hover:text-white'}`} />
              <span className="truncate">Workspace Hub</span>
            </div>
            {activeViewMode === 'hub' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#5683da] shadow-[0_0_6px_#5683da]" />
            )}
          </div>

          {/* Agent Hub */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => useAgentStore.getState().openLauncher()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                useAgentStore.getState().openLauncher();
              }
            }}
            className="group flex items-center justify-between h-8 px-3 rounded-lg text-xs text-[#a9a9aa] hover:text-white hover:bg-[#303236] transition-all cursor-pointer border border-transparent"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Bot className="w-3.5 h-3.5 text-[#a9a9aa] group-hover:text-white transition-colors" />
              <span className="truncate">Agent Hub</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#303236] text-[#ff8964] border border-[#4a4b50]">
              14
            </span>
          </div>

          {/* Layout Studio */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => useLayoutStudioStore.getState().openStudio()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                useLayoutStudioStore.getState().openStudio();
              }
            }}
            className="group flex items-center justify-between h-8 px-3 rounded-lg text-xs text-[#a9a9aa] hover:text-white hover:bg-[#303236] transition-all cursor-pointer border border-transparent"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Layout className="w-3.5 h-3.5 text-[#a9a9aa] group-hover:text-white transition-colors" />
              <span className="truncate">Layout Studio</span>
            </div>
          </div>

          {/* Git Diff Viewer */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setDiffViewerOpen(!isDiffViewerOpen)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setDiffViewerOpen(!isDiffViewerOpen);
              }
            }}
            className={`group flex items-center justify-between h-8 px-3 rounded-lg text-xs transition-all cursor-pointer ${
              isDiffViewerOpen
                ? 'bg-[#303236] text-white font-medium border border-[#5683da]/40'
                : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <GitCommit className={`w-3.5 h-3.5 transition-colors ${isDiffViewerOpen ? 'text-[#5683da]' : 'text-[#a9a9aa] group-hover:text-white'}`} />
              <span className="truncate">Git Diff Viewer</span>
            </div>
            {isDiffViewerOpen && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#5683da] shadow-[0_0_6px_#5683da]" />
            )}
          </div>
        </div>

        {/* Projects Section Divider / Header */}
        <div className="mt-2 px-4 py-1.5 flex items-center justify-between text-[11px] font-medium text-[#a9a9aa]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Projects</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              title="Add New Project"
              aria-label="Add project"
              className="p-1 rounded-md hover:bg-[#303236] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Projects & Workspace Trees */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 custom-scrollbar">
          {isLoading ? (
            <div className="space-y-2 p-1 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-lg bg-[#303236] border border-[#4a4b50] flex items-center px-3.5 gap-2.5">
                  <div className="w-4 h-4 rounded-md bg-[#4a4b50] shrink-0" />
                  <div className="h-3 rounded bg-[#4a4b50] flex-1 max-w-[120px]" />
                </div>
              ))}
            </div>
          ) : (
            workspaces.map((ws) => {
              const isFolderOpen = expandedFolders[ws.id] !== false;
              const isWsActive = ws.id === activeWorkspaceId;
              const isEditing = editingWsId === ws.id;

              return (
                <div key={ws.id} className="space-y-0.5">
                  {/* Project Folder Row */}
                  {isEditing ? (
                    <div
                      className="flex items-center gap-1.5 h-9 px-2 rounded-lg bg-[#303236] border border-[#5683da] text-xs shadow-[0_0_10px_rgba(86,131,218,0.15)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Folder className="w-3.5 h-3.5 shrink-0 text-[#5683da] ml-0.5" />
                      <input
                        ref={editInputRef}
                        type="text"
                        maxLength={32}
                        value={editingWsName}
                        onChange={(e) => setEditingWsName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveRename(ws.id);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            isEscapeRef.current = true;
                            setEditingWsId(null);
                          }
                        }}
                        onBlur={() => {
                          if (isEscapeRef.current) {
                            isEscapeRef.current = false;
                            return;
                          }
                          handleSaveRename(ws.id);
                        }}
                        className="flex-1 bg-transparent text-white text-xs px-1 py-0.5 outline-none border-none min-w-0 font-medium placeholder-[#a9a9aa]"
                        placeholder="Workspace name"
                        autoFocus
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveRename(ws.id);
                        }}
                        title="Save Workspace Name"
                        aria-label="Save Workspace Name"
                        className="p-1 rounded hover:bg-[#5683da]/20 text-[#5683da] hover:text-white transition-colors shrink-0 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleWorkspaceClick(ws.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleWorkspaceClick(ws.id);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({ x: e.clientX, y: e.clientY, wsId: ws.id });
                      }}
                      title={ws.name}
                      className={`group relative flex items-center justify-between h-9 px-2.5 rounded-lg text-xs transition-all cursor-pointer ${
                        isWsActive
                          ? 'text-white bg-[#303236] border border-[#4a4b50] font-medium shadow-sm'
                          : 'text-[#a9a9aa] hover:text-white bg-transparent hover:bg-[#303236] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFolder(ws.id);
                          }}
                          className="p-0.5 rounded hover:bg-[#4a4b50] text-[#a9a9aa] hover:text-white transition-colors shrink-0"
                          title={isFolderOpen ? 'Collapse project' : 'Expand project'}
                          aria-label={isFolderOpen ? 'Collapse project' : 'Expand project'}
                        >
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isFolderOpen ? 'rotate-90 text-white' : 'text-[#a9a9aa]'}`} />
                        </button>
                        <Folder className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isWsActive
                            ? 'text-[#5683da]'
                            : 'text-[#a9a9aa] group-hover:text-white'
                        }`} />
                        <span className="truncate flex-1 font-medium">{ws.name}</span>
                      </div>

                      <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            isEscapeRef.current = false;
                            setEditingWsId(ws.id);
                            setEditingWsName(ws.name);
                          }}
                          title="Rename Project"
                          aria-label="Rename Project"
                          className="p-1 rounded hover:bg-[#4a4b50] text-[#a9a9aa] hover:text-white transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateWorkspace(ws.id);
                            addToast({ type: 'success', title: 'Project Duplicated', description: `Created copy of "${ws.name}".` });
                          }}
                          title="Duplicate Project"
                          aria-label="Duplicate Project"
                          className="p-1 rounded hover:bg-[#4a4b50] text-[#a9a9aa] hover:text-white transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteWsId(ws.id);
                          }}
                          title={workspaces.length === 1 ? 'Reset Project to Default' : 'Delete Project'}
                          aria-label={workspaces.length === 1 ? 'Reset Project to Default' : 'Delete Project'}
                          className="p-1 rounded hover:bg-[#ff8964]/20 text-[#a9a9aa] hover:text-[#ff8964] transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sub-Threads under Project */}
                  {isFolderOpen && (
                    <div className="ml-4 pl-3 border-l border-[#4a4b50]/50 space-y-0.5 my-1">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenThread(ws.id, activeThreadTitle || 'VibeGrid')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenThread(ws.id, activeThreadTitle || 'VibeGrid');
                          }
                        }}
                        title={activeThreadTitle || 'VibeGrid'}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                          isWsActive && activeViewMode === 'grid'
                            ? 'bg-[#303236] text-white font-medium border border-[#5683da]/40'
                            : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236]'
                        }`}
                      >
                        <span className="truncate pr-2">{activeThreadTitle || 'VibeGrid'}</span>
                        {isWsActive && activeViewMode === 'grid' && (
                          <span className="text-[10px] text-[#5683da] shrink-0 font-mono px-1.5 py-0.5 rounded bg-[#5683da]/10 border border-[#5683da]/20">
                            active
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Pinned Footer: Settings */}
        <div className="p-2.5 border-t border-[#4a4b50] bg-[#111111] shrink-0">
          <button
            type="button"
            onClick={handleOpenGeneralSettings}
            title="Settings"
            aria-label="Settings"
            className="w-full bg-[#111111] hover:bg-[#303236] text-[#a9a9aa] hover:text-white border border-[#4a4b50] rounded-xl px-3 py-2 flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* New Workspace Modal */}
      {showCreateModal && (
        <InputModal
          title="Create New Project Workspace"
          description={newWsFolderCwd ? `Project root: ${newWsFolderCwd}` : 'Enter workspace name or click Browse to select a project directory.'}
          placeholder="Workspace name (e.g. VibeGrid, MyApp)"
          initialValue={newWsFolderName || `Workspace ${workspaces.length + 1}`}
          onBrowse={(path) => {
            const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
            const folderName = parts[parts.length - 1] || 'New Workspace';
            setNewWsFolderName(folderName);
            setNewWsFolderCwd(path);
          }}
          onSave={(name) => handleCreateWorkspace(name)}
          onClose={() => {
            setShowCreateModal(false);
            setNewWsFolderCwd(undefined);
          }}
        />
      )}

      {/* Right-Click Context Menu */}
      {contextMenu && (() => {
        const target = workspaces.find((w) => w.id === contextMenu.wsId);
        if (!target) return null;
        return (
          <div
            style={{
              left: Math.min(contextMenu.x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 180),
              top: Math.min(contextMenu.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - 200),
            }}
            className="fixed z-50 min-w-[170px] bg-[#111111] border border-[#4a4b50] rounded-xl shadow-2xl p-1 font-sans text-xs select-none animate-fade-in text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 py-1 text-[10px] font-mono text-[#a9a9aa] uppercase tracking-wider truncate border-b border-[#4a4b50] mb-1">
              {target.name}
            </div>
            <button
              onClick={() => {
                switchWorkspace(target.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white hover:bg-[#303236] transition-colors text-left cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5 text-[#5683da]" />
              <span>Switch to Project</span>
            </button>
            <button
              onClick={() => {
                isEscapeRef.current = false;
                setEditingWsId(target.id);
                setEditingWsName(target.name);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white hover:bg-[#303236] transition-colors text-left cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#a9a9aa]" />
              <span>Rename</span>
            </button>
            <button
              onClick={() => {
                duplicateWorkspace(target.id);
                setContextMenu(null);
                addToast({ type: 'success', title: 'Project Duplicated', description: `Created copy of "${target.name}".` });
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white hover:bg-[#303236] transition-colors text-left cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#a9a9aa]" />
              <span>Duplicate</span>
            </button>
            <div className="h-px bg-[#4a4b50] my-1" />
            <button
              onClick={() => {
                setDeleteWsId(target.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#ff8964] hover:text-[#ff8964] hover:bg-[#303236] transition-colors text-left cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{workspaces.length === 1 ? 'Reset to Default' : 'Delete Project'}</span>
            </button>
          </div>
        );
      })()}

      {deleteTarget && (
        <ConfirmModal
          title={workspaces.length === 1 ? `Reset "${deleteTarget.name}"?` : `Delete "${deleteTarget.name}"?`}
          message={
            workspaces.length === 1
              ? 'This is your only workspace. Deleting it will terminate running processes and reset to a fresh default workspace. Continue?'
              : `This project configuration will be permanently removed. Any active terminal processes in this workspace will be terminated. Continue?`
          }
          confirmLabel={workspaces.length === 1 ? 'Reset Project' : 'Delete Project'}
          isDanger={true}
          onConfirm={() => {
            deleteWorkspace(deleteTarget.id);
            setDeleteWsId(null);
            addToast({
              type: 'info',
              title: workspaces.length === 1 ? 'Project Reset' : 'Project Deleted',
              description: `"${deleteTarget.name}" was ${workspaces.length === 1 ? 'reset' : 'deleted'}.`,
            });
          }}
          onClose={() => setDeleteWsId(null)}
        />
      )}
    </>
  );
};

