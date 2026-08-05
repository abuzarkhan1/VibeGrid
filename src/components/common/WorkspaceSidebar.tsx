import React, { useState } from 'react';
import { Layout, Plus, Search, Trash2, Edit2, ChevronLeft, ChevronRight, Layers, Terminal, FolderSearch, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { InputModal } from '@/components/ui/InputModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// How many terminals in a workspace are LIVE right now. For the ACTIVE
// workspace this reads the pane store (the in-memory layout is the source of
// truth); for hidden workspaces it reads their in-memory layout (which keeps
// paneIds while they run in the background — workspace isolation). Sanitized
// on-disk layouts have no paneIds, so a never-run workspace shows 0.
function countRunningTerminals(wsId: string, layout: import('@/types/layout').PaneNode): number {
  if (wsId === useWorkspaceStore.getState().activeWorkspaceId) {
    return getTerminalNodes(usePaneStore.getState().root).filter((t) => t.paneId).length;
  }
  return getTerminalNodes(layout).filter((t) => t.paneId).length;
}

function countPanes(layout: import('@/types/layout').PaneNode): number {
  return getTerminalNodes(layout).length;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ isOpen, onToggle }) => {
  const { workspaces, activeWorkspaceId, renameWorkspace, deleteWorkspace, duplicateWorkspace, moveWorkspace } = useWorkspaceStore();
  const { requestSwitchWorkspace, requestCreateWorkspace } = useUIStore();
  // REVIEWER FIX: subscribe to the pane tree so the live running ● dots refresh
  // the moment a PTY spawns/exits — not only when the workspace list changes.
  usePaneStore((s) => s.root);

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renameWsId, setRenameWsId] = useState<string | null>(null);
  const [deleteWsId, setDeleteWsId] = useState<string | null>(null);

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renameTarget = workspaces.find((w) => w.id === renameWsId);
  const deleteTarget = workspaces.find((w) => w.id === deleteWsId);
  // Workspace isolation: deleting a workspace terminates its still-running
  // terminals — surface that in the confirmation instead of hiding it.
  const deleteRunningCount = deleteTarget
    ? (deleteTarget.id === activeWorkspaceId
        ? getTerminalNodes(usePaneStore.getState().root)
        : getTerminalNodes(deleteTarget.layout)
      ).filter((t) => t.paneId).length
    : 0;

  if (!isOpen) {
    return (
      <div className="w-10 bg-surface/85 backdrop-blur-md border-r border-white/[0.06] flex flex-col items-center py-3 gap-4 select-none z-20">
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
      <aside className="w-64 bg-surface/60 backdrop-blur-md border-r border-white/[0.06] flex flex-col h-full select-none z-20 animate-fade-in shrink-0">
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
          {filteredWorkspaces.map((ws, idx) => {
            const isActive = ws.id === activeWorkspaceId;
            const running = countRunningTerminals(ws.id, ws.layout);
            const total = countPanes(ws.layout);
            return (
              <div
                key={ws.id}
                role="button"
                tabIndex={0}
                onClick={() => requestSwitchWorkspace(ws.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    requestSwitchWorkspace(ws.id);
                  }
                }}
                aria-label={`Switch to workspace ${ws.name}${running > 0 ? `, ${running} running terminals` : ''}`}
                className={`group p-2.5 rounded-lg border cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-bright/70 ${
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
                    {/* UX audit P1 #5: live running-process indicator on EVERY
                        workspace (not just the active one) — a hidden workspace
                        with a build/server running is visible at a glance. */}
                    {running > 0 && !isActive && (
                      <span
                        title={`${running} running terminal${running > 1 ? 's' : ''}`}
                        aria-label={`${running} running terminals`}
                        className="relative flex h-2 w-2 shrink-0"
                      >
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
                      aria-label={`Rename workspace ${ws.name}`}
                      className="p-1 rounded hover:bg-white/10 text-white/45 hover:text-white/80"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateWorkspace(ws.id);
                      }}
                      title="Duplicate Workspace"
                      aria-label={`Duplicate workspace ${ws.name}`}
                      className="p-1 rounded hover:bg-white/10 text-white/45 hover:text-white/80"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveWorkspace(ws.id, -1);
                      }}
                      disabled={idx === 0}
                      title="Move Up"
                      aria-label={`Move workspace ${ws.name} up`}
                      className="p-1 rounded hover:bg-white/10 text-white/45 hover:text-white/80 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveWorkspace(ws.id, 1);
                      }}
                      disabled={idx === filteredWorkspaces.length - 1}
                      title="Move Down"
                      aria-label={`Move workspace ${ws.name} down`}
                      className="p-1 rounded hover:bg-white/10 text-white/45 hover:text-white/80 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown className="w-3 h-3" />
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
                  <div className="flex items-center gap-2">
                    {/* UX audit P3 #13: pane count on EVERY workspace. */}
                    <span className="flex items-center gap-1">
                      <Layers className={`w-2.5 h-2.5 ${isActive ? 'text-forest-light' : 'text-white/30'}`} />
                      <span className={isActive ? 'text-forest-light font-medium' : ''}>{total} Panes</span>
                    </span>
                    {running > 0 && (
                      <span className={`font-mono ${isActive ? 'text-forest-light' : 'text-forest-light/80'}`}>
                        ● {running}
                      </span>
                    )}
                  </div>
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
          onSave={(name) => requestCreateWorkspace(name.slice(0, 50))}
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
          message={
            deleteRunningCount > 0
              ? `Delete workspace "${deleteTarget.name}"? This will terminate ${deleteRunningCount} running terminal${deleteRunningCount > 1 ? 's' : ''} in it. This action cannot be undone.`
              : `Delete workspace "${deleteTarget.name}"? This action cannot be undone.`
          }
          confirmLabel="Delete Workspace"
          isDanger={true}
          onConfirm={() => deleteWorkspace(deleteWsId)}
          onClose={() => setDeleteWsId(null)}
        />
      )}
    </>
  );
};
