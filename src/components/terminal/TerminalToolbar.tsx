import React from 'react';
import { Columns, Rows, Maximize2, Minimize2, X, Terminal as TerminalIcon } from 'lucide-react';
import { usePaneStore } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';

interface TerminalToolbarProps {
  nodeId: string;
  title?: string;
  isFocused: boolean;
  isMaximized: boolean;
  hasActivity?: boolean;
}

export const TerminalToolbar: React.FC<TerminalToolbarProps> = ({
  nodeId,
  title = 'Terminal',
  isFocused,
  isMaximized,
  hasActivity = false,
}) => {
  const { splitPane, toggleMaximize, paneCount, maxPanes } = usePaneStore();
  const { addToast, requestClosePane } = useUIStore();

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
      className={`h-7 w-full px-2.5 flex items-center justify-between transition-colors border-b select-none cursor-pointer ${
        isFocused
          ? 'bg-surface border-forest/30 text-white/80'
          : 'bg-black/60 border-white/[0.06] text-white/45 opacity-70 hover:opacity-100'
      }`}
    >
      {/* Pane info */}
      <div className="flex items-center gap-1.5 min-w-0">
        {/* macOS traffic lights (site terminal mock) */}
        <span className="flex items-center gap-1.5 mr-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-forest/70" />
        </span>
        <TerminalIcon className={`w-3.5 h-3.5 ${isFocused ? 'text-forest-bright' : 'text-white/40'}`} />
        <span className="text-xs font-medium truncate tracking-wide">{title}</span>
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
          className="p-1 rounded hover:bg-white/10 text-white/45 hover:text-forest-light transition-colors"
        >
          <Columns className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleSplitVertical}
          title="Split Down (Cmd/Ctrl+Shift+D)"
          aria-label="Split down"
          className="p-1 rounded hover:bg-white/10 text-white/45 hover:text-forest-light transition-colors"
        >
          <Rows className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleToggleMaximize}
          title={isMaximized ? 'Restore Layout (Cmd/Ctrl+Shift+Enter)' : 'Maximize Pane (Cmd/Ctrl+Shift+Enter)'}
          aria-label={isMaximized ? 'Restore layout' : 'Maximize pane'}
          className="p-1 rounded hover:bg-white/10 text-white/45 hover:text-forest-light transition-colors"
        >
          {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={handleClose}
          title="Close Pane (Cmd/Ctrl+W)"
          aria-label="Close pane"
          className="p-1 rounded hover:bg-rose-950/60 text-white/45 hover:text-rose-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
