import React, { useState } from 'react';
import { Layout, Plus, Search, Trash2, Edit2, ChevronLeft, ChevronRight, Layers, Terminal } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { usePaneStore } from '@/store/usePaneStore';
import { InputModal } from '@/components/ui/InputModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ isOpen, onToggle }) => {
  const { workspaces, activeWorkspaceId, createWorkspace, renameWorkspace, deleteWorkspace, switchWorkspace } = useWorkspaceStore();
  const { paneCount } = usePaneStore();

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
      <div className="w-10 bg-black/70 backdrop-blur-md border-r border-white/[0.06] flex flex-col items-center py-3 gap-4 select-none z-20">
        <button
          onClick={onToggle}
          title="Expand Workspaces Sidebar (Cmd/Ctrl+B)"
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
      <aside className="w-64 bg-black/40 backdrop-blur-md border-r border-white/[0.06] flex flex-col h-full select-none z-20 animate-fade-in shrink-0">
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
              className="p-1 rounded hover:bg-white/5 text-forest-bright hover:text-forest-light transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onToggle}
              title="Collapse Sidebar"
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
          {filteredWorkspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            return (
              <div
                key={ws.id}
                onClick={() => switchWorkspace(ws.id)}
                className={`group p-2.5 rounded-lg border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-forest/[0.12] border-forest/50 text-white/90 shadow-[0_0_14px_rgba(44,122,64,0.25)]'
                    : 'bg-white/[0.02] border-white/[0.06] text-white/70 hover:border-forest/40 hover:bg-forest/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <Terminal className={`w-3.5 h-3.5 ${isActive ? 'text-forest-bright' : 'text-white/40'}`} />
                    <span className="text-xs font-semibold truncate">{ws.name}</span>
                    {isActive && (
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-bright opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-forest-bright" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameWsId(ws.id);
                      }}
                      title="Rename Workspace"
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
