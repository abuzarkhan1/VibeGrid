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
  const splitPane = usePaneStore((s) => s.splitPane);
  const toggleMaximize = usePaneStore((s) => s.toggleMaximize);
  const paneCount = usePaneStore((s) => s.paneCount);
  const maxPanes = usePaneStore((s) => s.maxPanes);
  const addToast = useUIStore((s) => s.addToast);
  const requestClosePane = useUIStore((s) => s.requestClosePane);

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
    requestClosePane(nodeId);
  };

  return (
    <div
      onDoubleClick={handleToggleMaximize}
      className={`h-8 w-full px-3 flex items-center justify-between select-none cursor-pointer bg-[#1A1B26] border-b border-white/[0.06] font-sans transition-colors ${
        isFocused ? 'text-white bg-white/[0.08]' : 'text-white/70 bg-white/[0.02] hover:bg-white/[0.04]'
      }`}
    >
      {/* Pane info */}
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-[5px] px-1 text-[10px] font-bold text-black/90 shadow-sm"
          style={{ backgroundColor: paneColor }}
          title={`Pane ${badgeNumber}`}
        >
          {badgeNumber}
        </span>
        {/* macOS traffic lights */}
        <span className="flex items-center gap-1.5 mr-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_6px_var(--diff-remove)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_#d29922]" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_var(--diff-add)]" />
        </span>
        <TerminalIcon
          className="w-3.5 h-3.5"
          style={{ color: isFocused ? paneColor : 'var(--ink-muted)' }}
        />
        <span className="font-sans font-semibold text-white/90 text-xs truncate tracking-wide">
          {title}
        </span>
        {displayCwd && (
          <span className="font-mono text-[10px] text-white/40 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] truncate max-w-[130px]" title={displayCwd}>
            {displayCwd}
          </span>
        )}
        {hasActivity && !isFocused && (
          <span
            className="relative flex h-2 w-2 shrink-0 ml-0.5"
            title="New output in this pane"
            aria-label="New output in this pane"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
        )}
      </div>

      {/* Pane action buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleSplitHorizontal}
          title="Split Right (Cmd/Ctrl+D)"
          aria-label="Split right"
          className="px-1.5 py-1 rounded bg-white/[0.06] border border-white/[0.08] hover:!text-white"
        >
          <Columns className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleSplitVertical}
          title="Split Down (Cmd/Ctrl+Shift+D)"
          aria-label="Split down"
          className="px-1.5 py-1 rounded bg-white/[0.06] border border-white/[0.08] hover:!text-white"
        >
          <Rows className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleToggleMaximize}
          title={isMaximized ? 'Restore Layout (Cmd/Ctrl+Shift+Enter)' : 'Maximize Pane (Cmd/Ctrl+Shift+Enter)'}
          aria-label={isMaximized ? 'Restore layout' : 'Maximize pane'}
          className="px-1.5 py-1 rounded bg-white/[0.06] border border-white/[0.08] hover:!text-white"
        >
          {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={handleClose}
          title="Close Pane (Cmd/Ctrl+W)"
          aria-label="Close pane"
          className="px-1.5 py-1 rounded bg-white/[0.06] border border-white/[0.08] hover:bg-red-400/20 hover:border-red-400/40 hover:text-red-400"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
