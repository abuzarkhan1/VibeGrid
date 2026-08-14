import React, { useState } from 'react';
import { Columns, Rows, Command, RotateCcw, Plus, Settings, ChevronDown, Trash2, Info, Edit2, PanelLeft, Grid } from 'lucide-react';
import { usePaneStore, getTerminalNodes, PresetCount } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useSettingsStore } from '@/store/useSettingsStore';
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
  // Customization audit: the whole header can be hidden. The early return must
  // sit BELOW every hook so the hook order stays stable across renders.
  const hideHeader = useSettingsStore((s) => s.hideHeader);

  const [isWsDropdownOpen, setIsWsDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renameWsId, setRenameWsId] = useState<string | null>(null);
  const [deleteWsId, setDeleteWsId] = useState<string | null>(null);

  if (hideHeader) return null;

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

  // Customization audit L12: 3/5/9/12 added to the equal-grid presets.
  const presets: PresetCount[] = [1, 2, 3, 4, 5, 6, 8, 9, 12, 16];

  return (
    <header className="h-9 w-full bg-background backdrop-blur-md border-b border-border/[0.08] px-3 flex items-center justify-between select-none z-20">
      {/* Left: Sidebar Toggle, Brand logo & Workspace selector */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={`${isSidebarOpen ? 'Collapse' : 'Expand'} Sidebar (Cmd/Ctrl+B)`}
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className={`p-1 rounded-lg border transition-colors ${
              isSidebarOpen ? 'bg-surface border-border/20 text-foreground' : 'bg-background hover:bg-surface border-border/[0.08] text-muted hover:text-foreground'
            }`}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity" onClick={onOpenAbout} title="About VibeGrid">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-background border border-border/[0.12] text-white shadow-[0_0_12px_rgba(var(--color-accent-rgba),0.08)]">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.95"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.55"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.55"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.25"/>
            </svg>
          </div>
          <div className="flex items-center tracking-tight text-sm">
            <span className="font-['Space_Grotesk'] font-black text-white">Vibe</span>
            <span className="font-serif italic font-bold text-zinc-100 ml-0.5">Grid</span>
          </div>
        </div>

        {/* Workspace Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsWsDropdownOpen(!isWsDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background hover:bg-surface border border-border/[0.08] text-xs font-['Space_Grotesk'] font-bold text-foreground/90 hover:text-foreground transition-colors shadow-sm"
          >
            <span className="max-w-[120px] truncate">{activeWs?.name || 'Default Workspace'}</span>
            <ChevronDown className="w-3 h-3 text-muted" />
          </button>

          {isWsDropdownOpen && (
            <div
              onMouseLeave={() => setIsWsDropdownOpen(false)}
              className="absolute top-8 left-0 z-50 w-56 bg-background border border-border/[0.08] rounded-xl shadow-2xl py-1 text-xs animate-fade-in backdrop-blur-md"
            >
              <div className="px-3 py-1.5 text-[10px] font-['Space_Grotesk'] font-bold text-muted/80 uppercase">Workspaces</div>
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
                    ws.id === activeWorkspaceId ? 'bg-surface/80 text-foreground font-semibold' : 'text-foreground/80 hover:bg-surface'
                  }`}
                >
                  <span className="truncate flex items-center gap-1.5 font-['Space_Grotesk']">
                    {ws.name}
                    {/* UX audit P1 #5: running indicator in the dropdown too. */}
                    {running > 0 && (
                      <span title={`${running} running terminal${running > 1 ? 's' : ''}`} className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
                      aria-label={`Rename workspace ${ws.name}`}
                      className="p-0.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>

                    {/* Customization audit L16: the delete button is ALWAYS shown —
                        deleting the last workspace resets to a fresh default. */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteWsId(ws.id);
                        setIsWsDropdownOpen(false);
                      }}
                      title="Delete Workspace"
                      aria-label={`Delete workspace ${ws.name}`}
                      className="p-0.5 rounded hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                );
              })}
              <div className="border-t border-border/[0.06] mt-1 pt-1">
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setIsWsDropdownOpen(false);
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-foreground/90 hover:bg-surface font-['Space_Grotesk'] font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Preset Grid Tabs (1, 2, 3, 4, 5, 6, 8, 9, 12, 16) */}
      <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border/[0.08] backdrop-blur-md">
        <div className="flex items-center gap-1 px-1.5 text-[10px] font-['Space_Grotesk'] font-bold text-muted uppercase tracking-wider">
          <Grid className="w-3 h-3 text-foreground/80" />
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
              className={`px-2 py-0.5 text-xs font-['Space_Grotesk'] font-bold rounded-md transition-all ${
                isActive ? 'bg-surface text-foreground shadow-sm border border-border/10' : 'text-muted hover:text-foreground hover:bg-white/[0.04]'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Quick Split, Settings, Command Palette */}
      <div className="flex items-center gap-1.5">
        <div className="hidden sm:flex items-center gap-1 border-r border-border/[0.08] pr-2">
          <button
            onClick={handleSplitH}
            title="Split Horizontally (Cmd/Ctrl+D)"
            aria-label="Split horizontally"
            className="p-1 rounded-lg bg-background hover:bg-surface border border-border/[0.08] text-foreground/80 hover:text-foreground transition-colors"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleSplitV}
            title="Split Vertically (Cmd/Ctrl+Shift+D)"
            aria-label="Split vertically"
            className="p-1 rounded-lg bg-background hover:bg-surface border border-border/[0.08] text-foreground/80 hover:text-foreground transition-colors"
          >
            <Rows className="w-3.5 h-3.5" />
          </button>

          <button
            // Guarded: reset kills all running panes — confirm when processes
            // are running (requestResetLayout handles that).
            onClick={requestResetLayout}
            title="Reset to 1 Pane"
            aria-label="Reset layout to one pane"
            className="p-1 rounded-lg bg-background hover:bg-surface border border-border/[0.08] text-muted hover:text-amber-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {onOpenAbout && (
          <button
            onClick={onOpenAbout}
            title="About VibeGrid"
            aria-label="About VibeGrid"
            className="p-1 rounded-lg bg-background hover:bg-surface border border-border/[0.08] text-muted hover:text-foreground/80 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={toggleSettings}
          title="Settings (Cmd/Ctrl+,)"
          aria-label="Open settings"
          className="p-1 rounded-lg bg-background hover:bg-surface border border-border/[0.08] text-muted hover:text-foreground/80 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={toggleCommandPalette}
          aria-label="Open command palette"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-hover border border-border/[0.08] text-xs font-['Space_Grotesk'] font-bold text-foreground/90 hover:text-foreground transition-all shadow-sm"
        >
          <Command className="w-3.5 h-3.5 text-foreground/70" />
          <span className="hidden sm:inline">Palette</span>
        </button>
      </div>

      {/* Custom React Modals */}
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
    </header>
  );
};
