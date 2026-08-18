import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  PanelLeft,
  Triangle,
  Grid,
  FileDiff,
} from 'lucide-react';
import { usePaneStore, PresetCount } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useLayoutStudioStore } from '@/store/useLayoutStudioStore';

interface HeaderProps {
  onOpenAbout?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarOpen = true,
  onToggleSidebar,
}) => {
  const { paneCount } = usePaneStore();
  const {
    activeViewMode,
    historyPointer,
    historyStack,
    navigateBack,
    navigateForward,
    addToast,
    isDiffViewerOpen,
    toggleDiffViewer,
    requestSetLayoutPreset,
  } = useUIStore();

  const hideHeader = useSettingsStore((s) => s.hideHeader);
  const openStudio = useLayoutStudioStore((s) => s.openStudio);

  if (hideHeader) return null;

  const canGoBack = historyPointer > 0;
  const canGoForward = historyPointer < historyStack.length - 1;

  const handleInstallIde = () => {
    addToast({
      type: 'success',
      title: 'VS Code & Cursor IDE Extension',
      description: 'VibeGrid CLI and IDE extensions connected to workspace.',
    });
  };

  const presets: PresetCount[] = [1, 2, 3, 4, 6, 8];

  return (
    <header className="h-10 w-full bg-[#1A1B26] border-b border-white/[0.06] px-3 flex items-center justify-between select-none z-30 text-white/90 font-sans shrink-0">
      {/* Left: macOS Traffic Lights + Sidebar Toggle + Back/Forward Navigation */}
      <div className="flex items-center gap-3">
        {/* Mock macOS Traffic Lights */}
        <div className="flex items-center gap-1.5 mr-1 group">
          <span
            title="Close"
            className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 cursor-pointer shadow-sm"
          />
          <span
            title="Minimize"
            className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 cursor-pointer shadow-sm"
          />
          <span
            title="Zoom / Fullscreen"
            className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50 cursor-pointer shadow-sm"
          />
        </div>

        {/* Sidebar Toggle Button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={`${isSidebarOpen ? 'Collapse' : 'Expand'} Sidebar`}
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Back and Forward Arrow Buttons */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={navigateBack}
            disabled={!canGoBack}
            title="Navigate Back"
            aria-label="Navigate back"
            className={`p-1.5 rounded-md transition-colors ${
              canGoBack
                ? 'text-white/70 hover:text-white hover:bg-white/[0.06] cursor-pointer'
                : 'text-white/40/40 cursor-not-allowed'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={navigateForward}
            disabled={!canGoForward}
            title="Navigate Forward"
            aria-label="Navigate forward"
            className={`p-1.5 rounded-md transition-colors ${
              canGoForward
                ? 'text-white/70 hover:text-white hover:bg-white/[0.06] cursor-pointer'
                : 'text-white/40/40 cursor-not-allowed'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: When in Grid view, show active workspace & quick layout controls */}
      {activeViewMode === 'grid' && (
        <div className="flex items-center gap-2 animate-fade-in">
          {/* Layout Presets (1, 2, 3, 4, 6, 8) */}
          <div className="hidden md:flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.06]">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => requestSetLayoutPreset(p)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
                  paneCount === p
                    ? 'bg-violet-500 text-white font-bold'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => openStudio()}
            title="Open Layout Studio"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white text-xs border border-white/[0.06] transition-colors"
          >
            <Grid className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Layouts</span>
          </button>

          <button
            onClick={toggleDiffViewer}
            title="Toggle Git Diff Viewer"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-colors ${
              isDiffViewerOpen
                ? 'bg-violet-500/20 text-white border-violet-400/40'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border-white/[0.06]'
            }`}
          >
            <FileDiff className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Diff</span>
          </button>
        </div>
      )}

      {/* Right: Install IDE Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstallIde}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-medium text-white/90 transition-all cursor-pointer shadow-sm hover:border-white/[0.12]"
        >
          <Triangle className="w-3 h-3 text-blue-400 fill-blue-400/30" />
          <span>Install IDE</span>
        </button>
      </div>
    </header>
  );
};
