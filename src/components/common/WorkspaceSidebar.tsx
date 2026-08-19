import React, { useState } from 'react';
import {
  Plus,
  Folder,
  ChevronRight,
  Settings,
  Trash2,
  Edit2,
  Type,
  Palette,
  Terminal as TerminalIcon,
  Layout,
  Sliders,
  Keyboard as KeyboardIcon,
  UserRound,
  X,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { InputModal } from '@/components/ui/InputModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { pickFolder } from '@/lib/tauri';

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ isOpen, onToggle }) => {
  const {
    workspaces,
    activeWorkspaceId,
    isLoading,
    renameWorkspace,
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
  } = useUIStore();

  const sidebarWidth = useSettingsStore((s) => s.sidebarWidth);

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ default: true });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsFolderCwd, setNewWsFolderCwd] = useState<string | undefined>(undefined);
  const [newWsFolderName, setNewWsFolderName] = useState<string>('');
  const [renameWsId, setRenameWsId] = useState<string | null>(null);
  const [deleteWsId, setDeleteWsId] = useState<string | null>(null);

  const renameTarget = workspaces.find((w) => w.id === renameWsId);
  const deleteTarget = workspaces.find((w) => w.id === deleteWsId);

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

  if (!isOpen) {
    return (
      <div className="w-12 bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-4 gap-4 select-none z-20 font-sans shrink-0">
        <button
          onClick={onToggle}
          title="Expand Sidebar"
          aria-label="Expand sidebar"
          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={handleNewWorkspace}
          title="New Workspace"
          aria-label="New workspace"
          className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="mt-auto">
          <button
            onClick={toggleSettings}
            title="Settings (Cmd+,)"
            aria-label="Open settings"
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (isSettingsOpen) {
    return (
      <aside
        style={{ width: sidebarWidth || 260 }}
        className="bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col h-full select-none z-20 animate-fade-in shrink-0 font-sans overflow-hidden text-white/90"
      >
        <div className="p-3 pb-1">
          <button
            type="button"
            onClick={toggleSettings}
            className="w-full h-10 flex items-center justify-center gap-2 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 text-white/90 hover:text-white text-[13px] font-normal transition-all cursor-pointer"
          >
            <X className="w-4 h-4 text-white/70" />
            <span>Close Settings</span>
          </button>
        </div>

        <div className="mt-3 px-4 py-1.5 text-[11px] font-medium text-white/40">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Settings Menu</span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5 custom-scrollbar">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSettingsTab === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`group relative flex items-center justify-between h-10 px-3.5 rounded-2xl text-[13px] transition-all cursor-pointer ${
                  isActive
                    ? 'text-white bg-white/[0.06] border border-white/10 font-normal'
                    : 'text-white/50 hover:text-white bg-transparent hover:bg-white/[0.03] border border-transparent hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white'}`} />
                  <span className="truncate">{tab.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-2 border-t border-white/5 bg-transparent">
          <button
            type="button"
            onClick={toggleSettings}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
          >
            <Settings className="w-4 h-4 text-white/40" />
            <span>Back to App</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside
        style={{ width: sidebarWidth || 260 }}
        className="bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col h-full select-none z-20 animate-fade-in shrink-0 font-sans overflow-hidden text-white/90"
      >
        {/* Top Header / Action Area */}
        <div className="p-3 pb-1">
          {/* + New Workspace Button */}
          <button
            type="button"
            onClick={handleNewWorkspace}
            className="w-full h-10 flex items-center justify-center gap-2 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 text-white/90 hover:text-white text-[13px] font-normal transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white/70" />
            <span>New Workspace</span>
          </button>
        </div>

        {/* Projects Section Divider / Header */}
        <div className="mt-3 px-4 py-1.5 flex items-center justify-between text-[11px] font-medium text-white/40">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Projects</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              title="Add New Project"
              aria-label="Add project"
              className="p-1 rounded-lg hover:bg-white/[0.04] text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Projects & Workspace Trees */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5 custom-scrollbar">
          {isLoading ? (
            <div className="space-y-2 p-1 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center px-3.5 gap-2.5">
                  <div className="w-4 h-4 rounded-md bg-white/10 shrink-0" />
                  <div className="h-3 rounded bg-white/10 flex-1 max-w-[120px]" />
                </div>
              ))}
            </div>
          ) : (
            workspaces.map((ws) => {
              const isFolderOpen = expandedFolders[ws.id] !== false;
              const isWsActive = ws.id === activeWorkspaceId;

              return (
                <div key={ws.id} className="space-y-1">
                {/* Project Folder Row (Exact same pill UI/UX as New Workspace) */}
                <div
                  onClick={() => handleWorkspaceClick(ws.id)}
                  className={`group relative flex items-center justify-between h-10 px-3.5 rounded-2xl text-[13px] transition-all cursor-pointer ${
                    isWsActive
                      ? 'text-white bg-white/[0.06] border border-white/10 font-normal'
                      : 'text-white/50 hover:text-white bg-transparent hover:bg-white/[0.03] border border-transparent hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFolder(ws.id);
                      }}
                      className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                      title={isFolderOpen ? 'Collapse thread' : 'Expand thread'}
                      aria-label={isFolderOpen ? 'Collapse thread' : 'Expand thread'}
                    >
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isFolderOpen ? 'rotate-90 text-white/80' : 'text-white/40'}`} />
                    </button>
                    <Folder className={`w-4 h-4 shrink-0 transition-colors ${
                      isWsActive
                        ? 'text-white'
                        : 'text-white/50 group-hover:text-white'
                    }`} />
                    <span className="truncate">{ws.name}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameWsId(ws.id);
                      }}
                      title="Rename Project"
                      className="p-1 rounded-md hover:bg-white/[0.08] text-white/40 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {workspaces.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteWsId(ws.id);
                        }}
                        title="Delete Project"
                        className="p-1 rounded-md hover:bg-white/[0.08] text-white/40 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Threads under Project */}
                {isFolderOpen && (
                  <div className="pl-4 space-y-0.5">
                    <div
                      onClick={() => handleOpenThread(ws.id, activeThreadTitle || 'VibeGrid')}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        isWsActive && activeViewMode === 'grid'
                          ? 'bg-white/[0.06] text-white font-normal border border-white/10'
                          : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03]'
                      }`}
                    >
                      <span className="truncate pr-2">{activeThreadTitle || 'VibeGrid'}</span>
                      <span className="text-[10px] text-white/20 shrink-0 font-mono">now</span>
                    </div>
                  </div>
                )}
              </div>
            );
          }))}
        </div>

        {/* Bottom Pinned Footer: Settings */}
        <div className="p-2 border-t border-white/5 bg-transparent">
          <button
            type="button"
            onClick={toggleSettings}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
          >
            <Settings className="w-4 h-4 text-white/40" />
            <span>Settings</span>
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

      {renameTarget && (
        <InputModal
          title={`Rename "${renameTarget.name}"`}
          initialValue={renameTarget.name}
          onSave={(newName) => {
            renameWorkspace(renameTarget.id, newName.slice(0, useSettingsStore.getState().workspaceNameMaxLength));
            setRenameWsId(null);
          }}
          onClose={() => setRenameWsId(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title={`Delete "${deleteTarget.name}"?`}
          message="This project configuration will be permanently removed. Continue?"
          confirmLabel="Delete Project"
          isDanger={true}
          onConfirm={() => {
            deleteWorkspace(deleteTarget.id);
            setDeleteWsId(null);
          }}
          onClose={() => setDeleteWsId(null)}
        />
      )}
    </>
  );
};
