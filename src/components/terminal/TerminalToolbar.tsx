import React from 'react';
import { Columns, Rows, Maximize2, Minimize2, X, Terminal as TerminalIcon } from 'lucide-react';
import { usePaneStore } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { paneColorForIndex } from '@/lib/paneColors';
import { PaneNode, TerminalNode } from '@/types/layout';

interface TerminalToolbarProps {
  nodeId: string;
  title?: string;
  cwd?: string;
  isFocused: boolean;
  isMaximized: boolean;
  hasActivity?: boolean;
}

function findTerminalNode(node: PaneNode | null, targetId: string): TerminalNode | null {
  if (!node) return null;
  if (node.id === targetId && node.type === 'terminal') return node;
  if (node.type === 'split') {
    return findTerminalNode(node.children[0], targetId) || findTerminalNode(node.children[1], targetId);
  }
  return null;
}

export const TerminalToolbar: React.FC<TerminalToolbarProps> = ({
  nodeId,
  title = 'Terminal',
  cwd,
  isFocused,
  isMaximized,
  hasActivity = false,
}) => {
  const { splitPane, toggleMaximize, paneCount, maxPanes } = usePaneStore();
  const { addToast, requestClosePane } = useUIStore();

  // Per-pane identity: 0-based tree-order index → colored number badge.
  const paneIndex = usePaneStore((s) => s.getPaneIndex(nodeId));
  const badgeNumber = Math.max(paneIndex + 1, 1);
  const paneColor = paneColorForIndex(paneIndex);

  const nodeCwd = usePaneStore(
    React.useCallback((s) => findTerminalNode(s.root, nodeId)?.cwd, [nodeId])
  );
  const displayCwd = cwd || nodeCwd || '~';

  const handleSplitHorizontal = (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = splitPane(nodeId, 'horizontal');
    if (!success && paneCount >= maxPanes) {
      addToast({
        type: 'warning',
        title: 'Maximum Pane Limit Reached',
        description: `VibeGrid enforces a limit of ${maxPanes} active panes for peak GPU performance.`,
        durationMs: 3000,
      });
    }
  };

  const handleSplitVertical = (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = splitPane(nodeId, 'vertical');
    if (!success && paneCount >= maxPanes) {
      addToast({
        type: 'warning',
        title: 'Maximum Pane Limit Reached',
        description: `VibeGrid enforces a limit of ${maxPanes} active panes for peak GPU performance.`,
        durationMs: 3000,
      });
    }
  };

  const handleToggleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMaximize(nodeId);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Guard against killing a running terminal without confirmation (UX audit 7.1)
    requestClosePane(nodeId);
  };

  return (
    <div
      onDoubleClick={handleToggleMaximize}
      className={`h-7 w-full px-2.5 flex items-center justify-between select-none cursor-pointer bg-[#0f1115] border-b border-white/[0.06] ${
        isFocused ? 'text-white' : 'text-zinc-400'
      }`}
    >
      {/* Pane info */}
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Pane index badge: a distinct colored number per pane, so a 2/3/4
            pane grid is identifiable at a glance — even if borders fail. */}
        <span
          className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-[5px] px-1 text-[10px] font-bold text-black/85"
          style={{ backgroundColor: paneColor }}
          title={`Pane ${badgeNumber}`}
        >
          {badgeNumber}
        </span>
        {/* macOS traffic lights (site terminal mock) */}
        <span className="flex items-center gap-1.5 mr-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-forest/70" />
        </span>
        <TerminalIcon
          className={`w-3.5 h-3.5 ${isFocused ? '' : 'text-white/40'}`}
          style={{ color: isFocused ? paneColor : undefined }}
        />
        <span className="font-['Space_Grotesk'] font-bold text-white text-xs truncate tracking-wide">
          {title}
        </span>
        {displayCwd && (
          <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[140px]" title={displayCwd}>
            {displayCwd}
          </span>
        )}
        {hasActivity && !isFocused && (
          <span
            className="relative flex h-2 w-2 shrink-0"
            title="New output in this pane"
            aria-label="New output in this pane"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-bright opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-forest-bright" />
          </span>
        )}
      </div>

      {/* Pane action buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleSplitHorizontal}
          title="Split Right (Cmd/Ctrl+D)"
          aria-label="Split right"
          className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
        >
          <Columns className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleSplitVertical}
          title="Split Down (Cmd/Ctrl+Shift+D)"
          aria-label="Split down"
          className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
        >
          <Rows className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleToggleMaximize}
          title={isMaximized ? 'Restore Layout (Cmd/Ctrl+Shift+Enter)' : 'Maximize Pane (Cmd/Ctrl+Shift+Enter)'}
          aria-label={isMaximized ? 'Restore layout' : 'Maximize pane'}
          className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
        >
          {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={handleClose}
          title="Close Pane (Cmd/Ctrl+W)"
          aria-label="Close pane"
          className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
