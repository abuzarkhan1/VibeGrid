import React from 'react';
import { Cpu, Layout, Layers, Terminal, Loader2, Type } from 'lucide-react';
import { usePaneStore } from '@/store/usePaneStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { PaneNode, TerminalNode } from '@/types/layout';

// Helper to find focused terminal node details
const findTerminalNode = (node: PaneNode | null, targetId: string | null): TerminalNode | null => {
  if (!targetId || !node) return null;
  if (node.type === 'terminal') {
    return node.id === targetId ? node : null;
  }
  return findTerminalNode(node.children[0], targetId) || findTerminalNode(node.children[1], targetId);
};

export const StatusBar: React.FC = () => {
  const { paneCount, maxPanes, focusedPaneId, root } = usePaneStore();
  const { workspaces, activeWorkspaceId, isLoading } = useWorkspaceStore();
  const { activeWebglPanes } = useUIStore();
  const fontSize = useSettingsStore((s) => s.fontSize);
  // Customization audit: the whole bar can be hidden and badges toggled.
  const hideStatusBar = useSettingsStore((s) => s.hideStatusBar);
  const badges = useSettingsStore((s) => s.statusBarBadges);

  if (hideStatusBar) return null;

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);

  const focusedNode = findTerminalNode(root, focusedPaneId);
  const isWebglActive = focusedPaneId ? activeWebglPanes.includes(focusedPaneId) : true;

  return (
    <footer className="h-6 w-full bg-background backdrop-blur-md border-t border-border/[0.08] px-3 flex items-center justify-between font-mono text-xs text-muted select-none z-20">
      {/* Left info: Workspace Name & Focused Pane ID with pulse indicator */}
      <div className="flex items-center gap-4">
        {badges.workspace && (
          <div className="flex items-center gap-2 text-zinc-200">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <Layout className="w-3.5 h-3.5 text-muted" />
            <span className="font-semibold text-xs text-foreground/90">{activeWs?.name || 'Default Workspace'}</span>
          </div>
        )}

        {focusedPaneId && badges.workspace && (
          <div className="flex items-center gap-1.5 text-muted">
            <Terminal className="w-3 h-3 text-muted/70" />
            <span className="text-xs text-muted">
              {focusedNode?.title || focusedPaneId}
              {focusedNode?.cwd ? ` (${focusedNode.cwd})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Right status badges: GPU WebGL with pulse & Pane count badge */}
      <div className="flex items-center gap-3.5">
        {isLoading && (
          <div className="flex items-center gap-1.5 text-foreground/80">
            <Loader2 className="w-3 h-3 text-foreground/70 animate-spin" />
            <span className="text-xs">Restoring workspaces…</span>
          </div>
        )}
        {badges.font && (
          <div className="flex items-center gap-1.5 text-muted" title="Terminal font size (Cmd/Ctrl +/- to adjust)">
            <Type className="w-3 h-3 text-muted/70" />
            <span className="text-xs">{fontSize}px</span>
          </div>
        )}
        {badges.gpu && (
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${isWebglActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${isWebglActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <Cpu className={`w-3.5 h-3.5 ${isWebglActive ? 'text-foreground/80' : 'text-amber-400'}`} />
            <span className="text-xs">{isWebglActive ? 'GPU (WebGL 60FPS)' : 'CPU (Canvas Fallback)'}</span>
          </div>
        )}

        {badges.panes && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface/90 border border-border/[0.08] text-xs text-foreground/80">
            <Layers className="w-3 h-3 text-muted" />
            <span>
              {paneCount}/{maxPanes} Panes
            </span>
          </div>
        )}
      </div>
    </footer>
  );
};
