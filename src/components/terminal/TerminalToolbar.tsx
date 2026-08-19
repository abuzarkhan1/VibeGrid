import React, { useState, useEffect } from 'react';
import { Columns, Rows, Maximize2, Minimize2, X, Terminal as TerminalIcon, Pencil } from 'lucide-react';
import { usePaneStore } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { PaneNode, TerminalNode } from '@/types/layout';

interface TerminalToolbarProps {
  nodeId: string;
  title?: string;
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
  
  // Rename hook (Make sure your usePaneStore has setPaneTitle or renamePane)
  const setPaneTitle = usePaneStore((s) => (s as any).setPaneTitle || (s as any).renamePane);

  const paneIndex = usePaneStore((s) => s.getPaneIndex(nodeId));
  const badgeNumber = Math.max(paneIndex + 1, 1);

  const nodeCwd = usePaneStore(
    React.useCallback((s) => findTerminalNode(s.root, nodeId)?.cwd, [nodeId])
  );
  const displayCwd = nodeCwd || '~';

  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  const handleSaveName = () => {
    if (tempTitle.trim() && tempTitle !== title) {
      if (setPaneTitle) {
        setPaneTitle(nodeId, tempTitle.trim());
      } else {
        addToast({ type: 'warning', title: 'Rename Failed', description: 'Store does not support renaming yet.' });
      }
    }
    setIsEditing(false);
  };

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
      className={`h-8 w-full px-3 flex items-center justify-between select-none cursor-pointer backdrop-blur-xl border-b font-sans transition-colors ${
        isFocused
          ? 'text-white bg-white/[0.06] border-white/20'
          : 'text-white/60 bg-black/40 border-white/10 hover:bg-white/[0.02]'
      }`}
    >
      {/* Pane info */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Pure White Badge */}
        <span
          className={`flex h-4 min-w-4 shrink-0 items-center justify-center rounded-[5px] px-1 text-[10px] font-bold shadow-sm transition-colors ${
            isFocused ? 'text-black bg-white' : 'text-white/70 bg-white/10'
          }`}
          title={`Pane ${badgeNumber}`}
        >
          {badgeNumber}
        </span>

        {/* REMOVED: macOS traffic lights */}

        <TerminalIcon className="w-3.5 h-3.5 text-white/60 shrink-0" />
        
        {/* Editable Title Area */}
        {isEditing ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveName();
              if (e.key === 'Escape') {
                setTempTitle(title);
                setIsEditing(false);
              }
            }}
            autoFocus
            className="font-sans font-semibold text-white text-xs bg-black/60 border border-white/30 rounded px-1 outline-none w-32"
          />
        ) : (
          <div className="flex items-center gap-1.5 group cursor-text" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
            <span className="font-sans font-semibold text-white/90 text-xs truncate tracking-wide">
              {title}
            </span>
            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-white/40" />
          </div>
        )}

        {displayCwd && (
          <span className="font-mono text-[10px] text-white/40 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 truncate max-w-[130px]" title={displayCwd}>
            {displayCwd}
          </span>
        )}
        {hasActivity && !isFocused && (
          <span
            className="relative flex h-2 w-2 shrink-0 ml-0.5"
            title="New output in this pane"
            aria-label="New output in this pane"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white/80" />
          </span>
        )}
      </div>

      {/* Pane action buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleSplitHorizontal}
          title="Split Right (Cmd/Ctrl+D)"
          aria-label="Split right"
          className="px-1.5 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-white/60 transition-colors"
        >
          <Columns className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleSplitVertical}
          title="Split Down (Cmd/Ctrl+Shift+D)"
          aria-label="Split down"
          className="px-1.5 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-white/60 transition-colors"
        >
          <Rows className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleToggleMaximize}
          title={isMaximized ? 'Restore Layout (Cmd/Ctrl+Shift+Enter)' : 'Maximize Pane (Cmd/Ctrl+Shift+Enter)'}
          aria-label={isMaximized ? 'Restore layout' : 'Maximize pane'}
          className="px-1.5 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-white/60 transition-colors"
        >
          {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={handleClose}
          title="Close Pane (Cmd/Ctrl+W)"
          aria-label="Close pane"
          className="px-1.5 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/20 hover:text-white text-white/60 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};