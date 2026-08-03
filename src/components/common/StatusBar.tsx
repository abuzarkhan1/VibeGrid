import React from 'react';
import { Cpu, Layout, Layers, Terminal } from 'lucide-react';
import { usePaneStore } from '@/store/usePaneStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useUIStore } from '@/store/useUIStore';

export const StatusBar: React.FC = () => {
  const { paneCount, maxPanes, focusedPaneId, root } = usePaneStore();
  const { workspaces, activeWorkspaceId } = useWorkspaceStore();
  const { activeWebglPanes } = useUIStore();

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);

  // Helper to find focused terminal node details
  const findTerminalNode = (node: any, targetId: string | null): any => {
    if (!targetId || !node) return null;
    if (node.id === targetId) return node;
    if (node.type === 'split') {
      return findTerminalNode(node.children[0], targetId) || findTerminalNode(node.children[1], targetId);
    }
    return null;
  };

  const focusedNode = findTerminalNode(root, focusedPaneId);
  const isWebglActive = focusedPaneId ? activeWebglPanes.includes(focusedPaneId) : true;

  return (
    <footer className="h-6 w-full bg-black/80 backdrop-blur-md border-t border-white/[0.06] px-3 flex items-center justify-between text-[11px] text-white/50 select-none z-20">
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
        <div className="flex items-center gap-1.5 text-white/45">
          <Cpu className={`w-3 h-3 ${isWebglActive ? 'text-forest-bright' : 'text-amber-400'}`} />
          <span>{isWebglActive ? 'GPU (WebGL 60FPS)' : 'CPU (Canvas Fallback)'}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.04] border border-forest/40 text-[10px] font-mono text-forest-light">
          <Layers className="w-3 h-3 text-forest-bright" />
          <span>
            {paneCount}/{maxPanes} Panes
          </span>
        </div>
      </div>
    </footer>
  );
};
