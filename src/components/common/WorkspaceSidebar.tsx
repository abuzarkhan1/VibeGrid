import React, { useState } from 'react';
import { Layout, Plus, Search, Trash2, Edit2, ChevronLeft, ChevronRight, Layers, FolderSearch, Copy, ArrowUp, ArrowDown, Archive, RotateCcw, Smile, X } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { InputModal } from '@/components/ui/InputModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

/** Emoji badge choices (customization audit C23). */
const EMOJI_CHOICES = ['🚀', '🧠', '🔥', '⚡', '🌐', '🛠️', '🐳', '📦', '🗄️', '🔬', '🎨', '🎮', '💻', '📊', '🤖', '🔐', '🧪', '🌱', '🚢', '☁️', '📡', '🧩', '🎯', '💎'];

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
  const { workspaces, activeWorkspaceId, renameWorkspace, deleteWorkspace, duplicateWorkspace, moveWorkspace, moveWorkspaceTo, setWorkspaceEmoji, toggleArchive } = useWorkspaceStore();
  const { requestSwitchWorkspace, requestCreateWorkspace } = useUIStore();
  // Customization audit: user-configurable sidebar width.
  const sidebarWidth = useSettingsStore((s) => s.sidebarWidth);
  // REVIEWER FIX: subscribe to the pane tree so the live running ● dots refresh
  // the moment a PTY spawns/exits — not only when the workspace list changes.
  usePaneStore((s) => s.root);

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renameWsId, setRenameWsId] = useState<string | null>(null);
  const [deleteWsId, setDeleteWsId] = useState<string | null>(null);
  // Customization audit C23: drag-to-reorder state (dragged id + drop slot).
  const [dragWsId, setDragWsId] = useState<string | null>(null);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);
  // Customization audit C23: emoji-badge picker for a workspace.
  const [emojiWsId, setEmojiWsId] = useState<string | null>(null);

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Customization audit C23: archived workspaces leave the active list (and
  // the switch targets) but keep their files + running terminals.
  const visibleWorkspaces = filteredWorkspaces.filter((w) => !w.archived);
  const archivedWorkspaces = filteredWorkspaces.filter((w) => w.archived);

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
      <div className="w-10 bg-surface/50 backdrop-blur-md border-r border-border/[0.08] flex flex-col items-center py-3 gap-4 select-none z-20">
        <button
          onClick={onToggle}
          title="Expand Workspaces Sidebar (Cmd/Ctrl+B)"
          aria-label="Expand workspaces sidebar"
          className="p-1.5 rounded-2xl bg-surface hover:bg-surface-hover border border-border/[0.08] text-foreground/80 hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="writing-mode-vertical font-['Space_Grotesk'] text-[10px] font-bold tracking-widest text-muted uppercase rotate-180">
          Workspaces ({workspaces.length})
        </div>
      </div>
    );
  }

  return (
    <>
      <aside style={{ width: sidebarWidth }} className="bg-surface/50 backdrop-blur-md border-r border-border/[0.08] flex flex-col h-full select-none z-20 animate-fade-in shrink-0">
        {/* Sidebar Header */}
        <div className="h-9 px-3 border-b border-border/[0.08] flex items-center justify-between bg-surface/30">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-foreground/80" />
            <span className="text-xs font-['Space_Grotesk'] font-bold text-foreground/90 uppercase tracking-wider">Workspaces</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCreateModal(true)}
              title="Create New Workspace"
              aria-label="Create new workspace"
              className="p-1.5 rounded-2xl hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onToggle}
              title="Collapse Sidebar"
              aria-label="Collapse sidebar"
              className="p-1.5 rounded-2xl hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-2 border-b border-border/[0.04]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted/70 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full pl-8 pr-3 py-1.5 rounded-2xl bg-surface/80 border border-border/[0.08] text-xs text-foreground/90 placeholder-muted focus:outline-none focus:border-foreground/30"
            />
          </div>
        </div>

        {/* Workspace List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredWorkspaces.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
              <FolderSearch className="w-6 h-6 text-muted/60 mb-2" />
              <p className="text-xs text-muted">No workspaces match your search.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowCreateModal(true);
                }}
                className="mt-3 px-3 py-1 rounded-2xl bg-surface border border-border/[0.08] text-xs font-['Space_Grotesk'] font-bold text-foreground/90 hover:bg-surface-hover transition-colors"
              >
                Create one
              </button>
            </div>
          )}
          {visibleWorkspaces.map((ws, idx) => {
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
                // Customization audit C23: drag to reorder (order persists).
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', ws.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDragWsId(ws.id);
                }}
                onDragEnd={() => {
                  setDragWsId(null);
                  setDropTargetIdx(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dropTargetIdx !== idx) setDropTargetIdx(idx);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData('text/plain') || dragWsId;
                  if (draggedId && draggedId !== ws.id) moveWorkspaceTo(draggedId, idx);
                  setDragWsId(null);
                  setDropTargetIdx(null);
                }}
                title="Drag to reorder"
                aria-label={`Switch to workspace ${ws.name}${running > 0 ? `, ${running} running terminals` : ''}`}
                className={`group p-2.5 rounded-2xl border cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 ${
                  isActive
                    ? 'bg-surface/80 border-border/20 text-foreground shadow-lg shadow-black/40'
                    : 'bg-surface/40 border-border/[0.06] text-muted hover:border-border/10 hover:bg-surface-hover'
                } ${dragWsId === ws.id ? 'opacity-40' : ''} ${
                  dropTargetIdx === idx && dragWsId && dragWsId !== ws.id
                    ? 'ring-2 ring-forest/60 ring-offset-0'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    {/* Customization audit C23: emoji badge (click to pick). */}
                    {ws.emoji ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEmojiWsId(ws.id);
                        }}
                        title="Change emoji badge"
                        aria-label={`Emoji badge for ${ws.name}`}
                        className="w-5 h-5 text-[13px] leading-none shrink-0 rounded-2xl hover:bg-zinc-800 flex items-center justify-center"
                      >
                        {ws.emoji}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEmojiWsId(ws.id);
                        }}
                        title="Add emoji badge"
                        aria-label={`Add emoji badge to ${ws.name}`}
                        className="w-5 h-5 shrink-0 rounded-2xl hover:bg-surface-hover flex items-center justify-center opacity-40 hover:opacity-100"
                      >
                        <Smile className="w-3.5 h-3.5 text-muted" />
                      </button>
                    )}
                    <span className="text-xs font-['Space_Grotesk'] font-bold truncate">{ws.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
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
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameWsId(ws.id);
                      }}
                      title="Rename Workspace"
                      aria-label={`Rename workspace ${ws.name}`}
                      className="p-1 rounded-2xl hover:bg-surface-hover text-muted hover:text-foreground/80"
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
                      className="p-1 rounded-2xl hover:bg-surface-hover text-muted hover:text-foreground/80"
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
                      className="p-1 rounded-2xl hover:bg-surface-hover text-muted hover:text-foreground/80 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveWorkspace(ws.id, 1);
                      }}
                      disabled={idx === visibleWorkspaces.length - 1}
                      title="Move Down"
                      aria-label={`Move workspace ${ws.name} down`}
                      className="p-1 rounded-2xl hover:bg-surface-hover text-muted hover:text-foreground/80 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>

                    {/* Customization audit C23: archive (soft-delete). */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleArchive(ws.id);
                      }}
                      title="Archive Workspace"
                      aria-label={`Archive workspace ${ws.name}`}
                      className="p-1 rounded-2xl hover:bg-surface-hover text-muted hover:text-foreground/80"
                    >
                      <Archive className="w-3 h-3" />
                    </button>

                    {/* Customization audit L16: the delete button is ALWAYS shown —
                        deleting the last workspace resets to a fresh default. */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteWsId(ws.id);
                      }}
                      title="Delete Workspace"
                      aria-label={`Delete workspace ${ws.name}`}
                      className="p-1 rounded-2xl hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted/80">
                  <span className="font-mono">ID: {ws.id.slice(0, 8)}</span>
                  <div className="flex items-center gap-2 font-['Space_Grotesk'] font-bold">
                    {/* UX audit P3 #13: pane count on EVERY workspace. */}
                    <span className="flex items-center gap-1">
                      <Layers className={`w-2.5 h-2.5 ${isActive ? 'text-foreground/80' : 'text-muted/70'}`} />
                      <span className={isActive ? 'text-foreground/90 font-bold' : ''}>{total} Panes</span>
                    </span>
                    {running > 0 && (
                      <span className="font-mono text-emerald-400 font-bold">
                        ● {running}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Customization audit C23: archived workspaces (soft-deleted) stay
              accessible here — unarchive to bring them back. */}
          {archivedWorkspaces.length > 0 && (
            <div className="pt-2 mt-2 border-t border-border/[0.06]">
              <div className="px-2 pb-1 flex items-center gap-1.5 text-[9px] font-['Space_Grotesk'] font-bold uppercase tracking-widest text-muted/80">
                <Archive className="w-3 h-3" /> Archived ({archivedWorkspaces.length})
              </div>
              {archivedWorkspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl border border-border/[0.04] bg-surface/30 text-muted mt-1"
                >
                  <span className="text-[13px] leading-none">{ws.emoji ?? '📦'}</span>
                  <span className="text-xs font-['Space_Grotesk'] font-bold truncate flex-1">{ws.name}</span>
                  <button
                    onClick={() => toggleArchive(ws.id)}
                    title="Unarchive Workspace"
                    aria-label={`Unarchive workspace ${ws.name}`}
                    className="p-1 rounded-2xl hover:bg-surface-hover text-muted hover:text-foreground/80 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setDeleteWsId(ws.id)}
                    title="Delete Workspace"
                    aria-label={`Delete workspace ${ws.name}`}
                    className="p-1 rounded-2xl hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2 border-t border-border/[0.04] bg-surface/30 font-['Space_Grotesk'] font-bold text-[10px] text-muted/80 text-center">
          {workspaces.length} Total Workspaces
        </div>
      </aside>

      {/* Custom Modals */}
      {showCreateModal && (
        <InputModal
          title="Create New Workspace"
          placeholder={`Workspace ${workspaces.length + 1}`}
          initialValue={`Workspace ${workspaces.length + 1}`}
          onSave={(name) => requestCreateWorkspace(name.slice(0, useSettingsStore.getState().workspaceNameMaxLength))}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {renameWsId && renameTarget && (
        <InputModal
          title="Rename Workspace"
          initialValue={renameTarget.name}
          onSave={(name) => {
            renameWorkspace(renameWsId, name.slice(0, useSettingsStore.getState().workspaceNameMaxLength));
            setRenameWsId(null);
          }}
          onClose={() => setRenameWsId(null)}
        />
      )}

      {deleteWsId && deleteTarget && (
        <ConfirmModal
          title="Delete Workspace"
          message={
            // Customization audit L16: deleting the LAST workspace resets to a
            // fresh default instead of refusing.
            workspaces.length === 1
              ? `Delete the last workspace "${deleteTarget.name}"? VibeGrid will reset to a fresh Default Workspace and terminate any running terminals.`
              : deleteRunningCount > 0
                ? `Delete workspace "${deleteTarget.name}"? This will terminate ${deleteRunningCount} running terminal${deleteRunningCount > 1 ? 's' : ''} in it. This action cannot be undone.`
                : `Delete workspace "${deleteTarget.name}"? This action cannot be undone.`
          }
          confirmLabel="Delete Workspace"
          isDanger={true}
          onConfirm={() => deleteWorkspace(deleteWsId)}
          onClose={() => setDeleteWsId(null)}
        />
      )}

      {/* Customization audit C23: emoji badge picker (backdrop + panel, never
          clipped by the sidebar's scroll container). */}
      {emojiWsId && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setEmojiWsId(null)} />
          <div className="fixed z-[61] left-3 bottom-12 w-[248px] rounded-lg bg-surfaceCard border border-white/10 shadow-2xl shadow-black/60 backdrop-blur-md p-3 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Emoji badge</span>
              <button
                onClick={() => setEmojiWsId(null)}
                className="p-0.5 rounded hover:bg-white/10 text-white/45 hover:text-white/80"
                aria-label="Close emoji picker"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setWorkspaceEmoji(emojiWsId, e);
                    setEmojiWsId(null);
                  }}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-sm hover:bg-forest/15 transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setWorkspaceEmoji(emojiWsId, '');
                setEmojiWsId(null);
              }}
              className="mt-2 w-full px-2 py-1 rounded-md border border-white/10 text-[10px] text-white/50 hover:text-white/80 transition-colors"
            >
              Remove badge
            </button>
          </div>
        </>
      )}
    </>
  );
};
