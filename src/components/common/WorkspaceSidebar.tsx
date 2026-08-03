import React, { useState } from 'react';
import { Layout, Plus, Search, Trash2, Edit2, ChevronLeft, ChevronRight, Layers, Terminal, FolderSearch } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { usePaneStore } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { InputModal } from '@/components/ui/InputModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ isOpen, onToggle }) => {
  const { workspaces, activeWorkspaceId, createWorkspace, renameWorkspace, deleteWorkspace } = useWorkspaceStore();
  const { paneCount } = usePaneStore();
  const { requestSwitchWorkspace } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renameWsId, setRenameWsId] = useState<string | null>(null);
  const [deleteWsId, setDeleteWsId] = useState<string | null>(null);

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renameTarget = workspaces.find((w) => w.id === renameWsId);
  const deleteTarget = workspaces.find((w) => w.id === deleteWsId);

  if (!isOpen) {
    return (
      <div className="w-10 bg-[#0a0c10]/85 backdrop-blur-md border-r border-white/[0.06] flex flex-col items-center py-3 gap-4 select-none z-20">
        <button
          onClick={onToggle}
          title="Expand Workspaces Sidebar (Cmd/Ctrl+B)"
          aria-label="Expand workspaces sidebar"
          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-forest-bright hover:text-forest-light transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="writing-mode-vertical text-[10px] font-bold tracking-widest text-white/40 uppercase rotate-180">
          Workspaces ({workspaces.length})
        </div>
      </div>
    );
  }

  return (
    <>
      <aside className="w-64 bg-[#0a0c10]/60 backdrop-blur-md border-r border-white/[0.06] flex flex-col h-full select-none z-20 animate-fade-in shrink-0">
        {/* Sidebar Header */}
        <div className="h-9 px-3 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-forest-bright" />
            <span className="text-xs font-medium text-white/90 uppercase tracking-wider">Workspaces</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCreateModal(true)}
              title="Create New Workspace"
              aria-label="Create new workspace"
              className="p-1 rounded hover:bg-white/5 text-forest-bright hover:text-forest-light transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onToggle}
              title="Collapse Sidebar"
              aria-label="Collapse sidebar"
              className="p-1 rounded hover:bg-white/5 text-white/45 hover:text-white/80 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-2 border-b border-white/[0.04]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/35 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full pl-8 pr-3 py-1 rounded bg-white/[0.04] border border-white/10 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-forest-bright"
            />
          </div>
        </div>

        {/* Workspace List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredWorkspaces.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
              <FolderSearch className="w-6 h-6 text-white/20 mb-2" />
              <p className="text-xs text-white/40">No workspaces match your search.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowCreateModal(true);
                }}
                className="mt-3 px-2.5 py-1 rounded-lg bg-forest/15 border border-forest/30 text-xs text-forest-light hover:bg-forest/25 transition-colors"
              >
                Create one
              </button>
            </div>
          )}
          {filteredWorkspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            return (
              <div
                key={ws.id}
                onClick={() => requestSwitchWorkspace(ws.id)}
                className={`group p-2.5 rounded-lg border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-forest/[0.08] border-forest/30 text-white/90'
                    : 'bg-white/[0.02] border-white/[0.06] text-white/70 hover:border-forest/40 hover:bg-forest/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <Terminal className={`w-3.5 h-3.5 ${isActive ? 'text-forest-bright' : 'text-white/40'}`} />
                    <span className="text-xs font-semibold truncate">{ws.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-forest-bright" />
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameWsId(ws.id);
                      }}
                      title="Rename Workspace"
                      aria-label={`Rename workspace ${ws.name}`}
                      className="p-1 rounded hover:bg-white/10 text-white/45 hover:text-white/80"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>

                    {workspaces.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteWsId(ws.id);
                        }}
                        title="Delete Workspace"
                        aria-label={`Delete workspace ${ws.name}`}
                        className="p-1 rounded hover:bg-rose-950/60 text-white/45 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/35">
                  <span className="font-mono">ID: {ws.id.slice(0, 8)}</span>
                  {isActive && (
                    <div className="flex items-center gap-1 text-forest-light font-medium">
                      <Layers className="w-2.5 h-2.5" />
                      <span>{paneCount} Panes</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-2 border-t border-white/[0.04] bg-white/[0.02] text-[10px] text-white/35 text-center">
          {workspaces.length} Total Workspaces
        </div>
      </aside>

      {/* Custom Modals */}
      {showCreateModal && (
        <InputModal
          title="Create New Workspace"
          placeholder={`Workspace ${workspaces.length + 1}`}
          initialValue={`Workspace ${workspaces.length + 1}`}
          onSave={(name) => createWorkspace(name.slice(0, 50))}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {renameWsId && renameTarget && (
        <InputModal
          title="Rename Workspace"
          initialValue={renameTarget.name}
          onSave={(name) => {
            renameWorkspace(renameWsId, name.slice(0, 50));
            setRenameWsId(null);
          }}
          onClose={() => setRenameWsId(null)}
        />
      )}

      {deleteWsId && deleteTarget && (
        <ConfirmModal
          title="Delete Workspace"
          message={`Are you sure you want to delete workspace "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete Workspace"
          isDanger={true}
          onConfirm={() => deleteWorkspace(deleteWsId)}
          onClose={() => setDeleteWsId(null)}
        />
      )}
    </>
  );
};
