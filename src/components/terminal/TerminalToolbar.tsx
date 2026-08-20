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

  const setPaneTitle = usePaneStore((s) => s.setPaneTitle);

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
      className={`h-[38px] w-full px-3 flex items-center justify-between select-none cursor-pointer border-b font-sans transition-colors bg-[#111111] border-b-[#4a4b50] ${
        isFocused
          ? 'text-white'
          : 'text-[#a9a9aa] hover:text-white'
      }`}
    >
      {/* Pane info */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Electric Iris Focused Badge / Obsidian Inactive Badge */}
        <span
          className={`flex h-4 min-w-4 shrink-0 items-center justify-center rounded px-1.5 text-[10px] font-mono font-bold transition-colors ${
            isFocused
              ? 'text-white bg-[#5683da]'
              : 'text-[#a9a9aa] bg-[#303236] border border-[#4a4b50]'
          }`}
          title={`Pane #${badgeNumber}`}
        >
          #{badgeNumber}
        </span>

        <TerminalIcon className={`w-3.5 h-3.5 shrink-0 ${isFocused ? 'text-[#5683da]' : 'text-[#a9a9aa]'}`} />

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
            className="font-sans font-medium text-white text-xs bg-[#303236] border border-[#5683da] rounded px-1.5 py-0.5 outline-none w-32"
          />
        ) : (
          <div className="flex items-center gap-1.5 group cursor-text" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} title="Click to rename pane">
            <span className="font-sans font-medium text-white text-xs truncate tracking-tight max-w-[120px] sm:max-w-[160px]">
              {title}
            </span>
            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#a9a9aa]" />
          </div>
        )}

        {displayCwd && (
          <span className="font-mono text-[10px] text-[#a9a9aa] px-2 py-0.5 rounded-[9999px] bg-[#303236] border border-[#4a4b50] hidden sm:inline-block truncate max-w-[90px] md:max-w-[140px]" title={displayCwd}>
            {displayCwd}
          </span>
        )}
        {hasActivity && !isFocused && (
          <span
            className="relative flex h-2 w-2 shrink-0 ml-0.5"
            title="New output in this pane"
            aria-label="New output in this pane"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff8964] opacity-75 duration-1000" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff8964] shadow-[0_0_6px_#ff8964]" />
          </span>
        )}
      </div>

      {/* Pane action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleSplitHorizontal}
          title="Split Right (Cmd/Ctrl+D)"
          aria-label="Split horizontally"
          className="p-1 rounded-full bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] hover:bg-[#303236] hover:text-white text-[#a9a9aa] transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Columns className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleSplitVertical}
          title="Split Down (Cmd/Ctrl+Shift+D)"
          aria-label="Split vertically"
          className="p-1 rounded-full bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] hover:bg-[#303236] hover:text-white text-[#a9a9aa] transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Rows className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleToggleMaximize}
          title={isMaximized ? 'Restore Layout (Cmd/Ctrl+Shift+Enter)' : 'Maximize Pane (Cmd/Ctrl+Shift+Enter)'}
          aria-label={isMaximized ? 'Restore layout' : 'Maximize pane'}
          className="p-1 rounded-full bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] hover:bg-[#303236] hover:text-white text-[#a9a9aa] transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
        >
          {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={handleClose}
          title="Close Pane (Cmd/Ctrl+W)"
          aria-label="Close pane"
          className="p-1 rounded-full bg-[#303236] border border-[#4a4b50] hover:bg-[#ff8964]/20 hover:text-[#ff8964] hover:border-[#ff8964]/40 text-[#a9a9aa] transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
