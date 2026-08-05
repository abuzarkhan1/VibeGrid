import React, { useState } from 'react';
import { Columns, Rows, Command, RotateCcw, Plus, Settings, ChevronDown, Trash2, Info, Edit2, PanelLeft, Grid } from 'lucide-react';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { InputModal } from '@/components/ui/InputModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface HeaderProps {
  onOpenAbout?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAbout, isSidebarOpen = true, onToggleSidebar }) => {
  const { splitPane, focusedPaneId, paneCount, maxPanes } = usePaneStore();
  const { toggleCommandPalette, toggleSettings, addToast, requestSwitchWorkspace, requestCreateWorkspace, requestSetLayoutPreset, requestResetLayout } = useUIStore();
  const { workspaces, activeWorkspaceId, renameWorkspace, deleteWorkspace } = useWorkspaceStore();

  const [isWsDropdownOpen, setIsWsDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renameWsId, setRenameWsId] = useState<string | null>(null);
  const [deleteWsId, setDeleteWsId] = useState<string | null>(null);

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
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

  const handleSplitH = () => {
    if (focusedPaneId) {
      const ok = splitPane(focusedPaneId, 'horizontal');
      if (!ok && paneCount >= maxPanes) {
        addToast({
          type: 'warning',
          title: 'Maximum Pane Limit Reached',
          description: `VibeGrid enforces a limit of ${maxPanes} active panes for peak GPU performance.`,
        });
      }
    }
  };

  const handleSplitV = () => {
    if (focusedPaneId) {
      const ok = splitPane(focusedPaneId, 'vertical');
      if (!ok && paneCount >= maxPanes) {
        addToast({
          type: 'warning',
          title: 'Maximum Pane Limit Reached',
          description: `VibeGrid enforces a limit of ${maxPanes} active panes for peak GPU performance.`,
        });
      }
    }
  };

  const presets: (1 | 2 | 4 | 6 | 8 | 16)[] = [1, 2, 4, 6, 8, 16];

  return (
    <header className="h-9 w-full bg-surface/95 backdrop-blur-md border-b border-white/[0.06] px-3 flex items-center justify-between select-none z-20">
      {/* Left: Sidebar Toggle, Brand logo & Workspace selector */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={`${isSidebarOpen ? 'Collapse' : 'Expand'} Sidebar (Cmd/Ctrl+B)`}
            className={`p-1 rounded border transition-colors ${
              isSidebarOpen ? 'bg-forest/20 border-forest/40 text-forest-light' : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/50'
            }`}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={onOpenAbout} title="About VibeGrid">
          <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-forest text-white shadow-[0_0_8px_rgba(44,122,64,0.35)]">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.9"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.2"/>
            </svg>
          </div>
          <span className="text-xs font-medium text-white/90 tracking-tight">VibeGrid</span>
        </div>

        {/* Workspace Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsWsDropdownOpen(!isWsDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-white/65 transition-colors"
          >
            <span className="font-medium max-w-[120px] truncate">{activeWs?.name || 'Default Workspace'}</span>
            <ChevronDown className="w-3 h-3 text-white/50" />
          </button>

          {isWsDropdownOpen && (
            <div
              onMouseLeave={() => setIsWsDropdownOpen(false)}
              className="absolute top-8 left-0 z-50 w-56 bg-surfaceCard border border-white/10 rounded-lg shadow-xl py-1 text-xs animate-fade-in backdrop-blur-md"
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold text-white/40 uppercase">Workspaces</div>
              {workspaces.map((ws) => {
                const running = ws.id === activeWorkspaceId
                  ? getTerminalNodes(usePaneStore.getState().root).filter((t) => t.paneId).length
                  : getTerminalNodes(ws.layout).filter((t) => t.paneId).length;
                return (
                <div
                  key={ws.id}
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => {
                    requestSwitchWorkspace(ws.id);
                    setIsWsDropdownOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      requestSwitchWorkspace(ws.id);
                      setIsWsDropdownOpen(false);
                    }
                  }}
                  onDoubleClick={() => {
                    // Gap 12: double-click a workspace in the dropdown to rename it inline.
                    setRenameWsId(ws.id);
                    setIsWsDropdownOpen(false);
                  }}
                  title={ws.id === activeWorkspaceId ? `${ws.name} (double-click to rename)` : `Switch to ${ws.name} (double-click to rename)`}
                  className={`px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors focus:outline-none focus-visible:bg-white/10 ${
                    ws.id === activeWorkspaceId ? 'bg-forest/10 text-forest-light font-semibold' : 'text-white/65 hover:bg-white/5'
                  }`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    {ws.name}
                    {/* UX audit P1 #5: running indicator in the dropdown too. */}
                    {running > 0 && (
                      <span title={`${running} running terminal${running > 1 ? 's' : ''}`} className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-bright opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-forest-bright" />
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameWsId(ws.id);
                        setIsWsDropdownOpen(false);
                      }}
                      title="Rename Workspace"
                      className="p-0.5 rounded hover:bg-white/10 text-white/45 hover:text-white/80"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>

                    {workspaces.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteWsId(ws.id);
                          setIsWsDropdownOpen(false);
                        }}
                        title="Delete Workspace"
                        className="p-0.5 rounded hover:bg-rose-950/60 text-white/45 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
              <div className="border-t border-white/[0.06] mt-1 pt-1">
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setIsWsDropdownOpen(false);
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-forest-light hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Preset Grid Buttons (1, 2, 4, 6, 8, 16) */}
      <div className="flex items-center gap-1.5 bg-white/[0.03] p-0.5 rounded-lg border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-1 px-1.5 text-[10px] font-bold text-white/45 uppercase tracking-wider">
          <Grid className="w-3 h-3 text-forest-bright" />
          <span className="hidden md:inline">Grid:</span>
        </div>

        {presets.map((p) => {
          const isActive = paneCount === p;
          return (
            <button
              key={p}
              // Guarded: rebuilding the grid kills all running panes, so when
              // processes are running a confirmation is shown first.
              onClick={() => requestSetLayoutPreset(p)}
              title={`Set Equal Grid to ${p} Pane${p > 1 ? 's' : ''}`}
              className={`px-2 py-0.5 text-xs font-mono font-bold rounded transition-all ${
                isActive ? 'bg-forest text-white' : 'text-white/45 hover:text-white/90 hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Quick Split, Settings, Command Palette */}
      <div className="flex items-center gap-1.5">
        <div className="hidden sm:flex items-center gap-1 border-r border-white/[0.06] pr-2">
          <button
            onClick={handleSplitH}
            title="Split Horizontally (Cmd/Ctrl+D)"
            aria-label="Split horizontally"
            className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/65 transition-colors"
          >
            <Columns className="w-3.5 h-3.5 text-forest-bright" />
          </button>

          <button
            onClick={handleSplitV}
            title="Split Vertically (Cmd/Ctrl+Shift+D)"
            aria-label="Split vertically"
            className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/65 transition-colors"
          >
            <Rows className="w-3.5 h-3.5 text-forest-bright" />
          </button>

          <button
            // Guarded: reset kills all running panes — confirm when processes
            // are running (requestResetLayout handles that).
            onClick={requestResetLayout}
            title="Reset to 1 Pane"
            aria-label="Reset layout to one pane"
            className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/45 hover:text-amber-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {onOpenAbout && (
          <button
            onClick={onOpenAbout}
            title="About VibeGrid"
            aria-label="About VibeGrid"
            className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/45 hover:text-white/80 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={toggleSettings}
          title="Settings (Cmd/Ctrl+,)"
          aria-label="Open settings"
          className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/45 hover:text-white/80 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>          <button
            onClick={toggleCommandPalette}
            aria-label="Open command palette"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-forest hover:bg-forest-bright border border-forest/40 text-xs font-medium text-white transition-all hover:shadow-[0_0_14px_rgba(84,169,103,0.35)]"
          >
          <Command className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Palette</span>
        </button>
      </div>

      {/* Custom React Modals */}
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
    </header>
  );
};
