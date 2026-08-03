import React from 'react';
import { LayoutGrid, Command, Cpu, Settings } from 'lucide-react';
import { usePaneStore } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export const StatusBar: React.FC = () => {
  const { paneCount, maxPanes, focusedPaneId } = usePaneStore();
  const { toggleCommandPalette, toggleSettings } = useUIStore();
  const { workspaces, activeWorkspaceId } = useWorkspaceStore();

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <footer className="h-6 w-full bg-black/80 backdrop-blur-md border-t border-white/[0.06] px-3 flex items-center justify-between text-[11px] text-white/50 select-none z-20">
      {/* Left side: Workspace & Pane Count */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-medium text-white/65">
          <LayoutGrid className="w-3 h-3 text-forest-bright" />
          <span>{activeWs?.name || 'Default Workspace'}</span>
        </div>

        <div className="flex items-center gap-1 text-white/45">
          <span className="text-white/40">Panes:</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
              paneCount >= maxPanes ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60' : 'bg-white/[0.04] text-forest-light'
            }`}
          >
            {paneCount} / {maxPanes}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-white/40">
          <Cpu className="w-3 h-3 text-forest-bright" />
          <span>GPU WebGL Accelerated</span>
        </div>
      </div>

      {/* Right side: Focused ID & Shortcuts */}
      <div className="flex items-center gap-3">
        {focusedPaneId && (
          <span className="hidden md:inline text-white/40 font-mono text-[10px]">
            Focused: <span className="text-white/60">{focusedPaneId.slice(0, 12)}</span>
          </span>
        )}

        <button
          onClick={toggleSettings}
          title="Settings (Cmd/Ctrl+,)"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5 text-white/45 hover:text-white/80 transition-colors"
        >
          <Settings className="w-3 h-3 text-white/45" />
          <span className="font-mono text-[10px]">Cmd+,</span>
        </button>

        <button
          onClick={toggleCommandPalette}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5 text-white/45 hover:text-white/80 transition-colors"
        >
          <Command className="w-3 h-3 text-forest-bright" />
          <span className="font-mono text-[10px]">Cmd+Shift+P</span>
        </button>
      </div>
    </footer>
  );
};
