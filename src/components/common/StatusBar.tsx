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

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);

  const focusedNode = findTerminalNode(root, focusedPaneId);
  const isWebglActive = focusedPaneId ? activeWebglPanes.includes(focusedPaneId) : true;

  return (
    <footer className="h-6 w-full bg-[#0a0c10]/90 backdrop-blur-md border-t border-white/[0.06] px-3 flex items-center justify-between text-[11px] text-white/50 select-none z-20">
      {/* Left info: Workspace Name & Focused Pane ID */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-white/65">
          <Layout className="w-3 h-3 text-forest-bright" />
          <span className="font-semibold">{activeWs?.name || 'Default Workspace'}</span>
        </div>

        {focusedPaneId && (
          <div className="flex items-center gap-1.5 text-white/45">
            <Terminal className="w-3 h-3 text-white/40" />
            <span className="font-mono text-[10px]">
              {focusedNode?.title || focusedPaneId}
              {focusedNode?.cwd ? ` (${focusedNode.cwd})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Right status badges: GPU WebGL & Pane count badge */}
      <div className="flex items-center gap-3">
        {isLoading && (
          <div className="flex items-center gap-1.5 text-white/45">
            <Loader2 className="w-3 h-3 text-forest-bright animate-spin" />
            <span>Restoring workspaces…</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-white/45" title="Terminal font size (Cmd/Ctrl +/- to adjust)">
          <Type className="w-3 h-3 text-white/40" />
          <span className="font-mono text-[10px]">{fontSize}px</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/45">
          <Cpu className={`w-3 h-3 ${isWebglActive ? 'text-forest-bright' : 'text-amber-400'}`} />
          <span>{isWebglActive ? 'GPU (WebGL 60FPS)' : 'CPU (Canvas Fallback)'}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-[10px] font-mono text-forest-light">
          <Layers className="w-3 h-3 text-forest-bright" />
          <span>
            {paneCount}/{maxPanes} Panes
          </span>
        </div>
      </div>
    </footer>
  );
};
