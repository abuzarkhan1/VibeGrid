import React, { useEffect } from 'react';
import {
  useLayoutStudioStore,
  PRESET_GALLERY,
} from '@/store/useLayoutStudioStore';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';
import { LayoutPreviewCard } from './LayoutPreviewCard';
import { CustomGridBuilder } from './CustomGridBuilder';
import {
  Grid,
  Sliders,
  ArrowRight,
  X,
  Layers,
} from 'lucide-react';

interface LayoutStudioModalProps {
  onProceedToAgents?: () => void;
}

export const LayoutStudioModal: React.FC<LayoutStudioModalProps> = ({
  onProceedToAgents,
}) => {
  const {
    isOpen,
    activeTab,
    selectedPresetId,
    gutterWidth,
    cornerRadius,
    terminalPadding,
    closeStudio,
    setActiveTab,
    selectPreset,
    buildActiveLayout,
  } = useLayoutStudioStore();

  const addToast = useUIStore((s) => s.addToast);

  const handleApplyLayout = React.useCallback(() => {
    const newRoot = buildActiveLayout();
    const terms = getTerminalNodes(newRoot);

    useSettingsStore.getState().updateSettings({
      terminalPadding,
    });

    document.documentElement.style.setProperty(
      '--sash-size',
      `${gutterWidth || 1}px`
    );
    document.documentElement.style.setProperty(
      '--pane-radius',
      `${cornerRadius}px`
    );

    // 3. Mount layout tree into PaneStore & bump gridVersion for clean Allotment mount
    usePaneStore.setState((state) => ({
      root: newRoot,
      paneCount: terms.length,
      focusedPaneId: terms[0]?.id || state.focusedPaneId,
      gridVersion: state.gridVersion + 1,
      layoutMode: 'custom',
    }));

    // 4. Persist workspace state
    useWorkspaceStore.getState().saveCurrentWorkspace();

    closeStudio();

    addToast({
      type: 'success',
      title: 'Layout Deployed',
      description: `Studio initialized workspace with ${cornerRadius}px corners & ${gutterWidth}px gutters.`,
    });

    // 5. Optionally proceed to AI agent launcher
    if (onProceedToAgents) {
      onProceedToAgents();
    }
  }, [buildActiveLayout, terminalPadding, gutterWidth, cornerRadius, closeStudio, addToast, onProceedToAgents]);

  // Keyboard shortcut listener (1-9 numeric, Escape, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeStudio();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handleApplyLayout();
        return;
      }

      // Check numeric or combo shortcut
      const combo = `${e.ctrlKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${e.key.toUpperCase()}`;
      const found = PRESET_GALLERY.find((p) => {
        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
          return p.shortcutKey === e.key || p.shortcutKey.toUpperCase() === e.key.toUpperCase();
        }
        return p.shortcutKey.toUpperCase() === combo;
      });

      if (found) {
        e.preventDefault();
        selectPreset(found.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeStudio, selectPreset, handleApplyLayout]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="layout-studio-title"
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in select-none font-sans"
    >
      {/* Main Transparent Black Glass Panel */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
        {/* Top Studio Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/40 border border-white/10 text-white/80 shadow-none">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="layout-studio-title"
                className="font-sans font-semibold text-base text-white/90 tracking-tight flex items-center gap-2"
              >
                Layout Selection Studio
                <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono font-medium text-white/60">
                  v2.0
                </span>
              </h2>
              <p className="text-xs text-white/40 font-sans">
                Choose a structured preset or craft an infinite custom matrix canvas
              </p>
            </div>
          </div>

          {/* Tab Switcher: Presets vs Custom Matrix */}
          <div className="bg-black/40 p-1 rounded-xl border border-white/10 flex items-center gap-1">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                activeTab === 'presets'
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Preset Gallery</span>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                activeTab === 'custom'
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom Matrix Studio</span>
            </button>
          </div>

          {/* Close affordance */}
          <button
            onClick={closeStudio}
            aria-label="Close layout studio"
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent custom-scrollbar">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {PRESET_GALLERY.map((preset) => (
                <LayoutPreviewCard
                  key={preset.id}
                  preset={preset}
                  isSelected={selectedPresetId === preset.id}
                  onSelect={() => selectPreset(preset.id)}
                />
              ))}
            </div>
          ) : (
            <CustomGridBuilder />
          )}
        </div>

        {/* Bottom Studio Action Bar */}
        <div className="px-6 py-3.5 border-t border-white/5 bg-transparent flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-white/40 font-mono">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-white/80">
                1-9
              </kbd>{' '}
              Preset Shortcuts
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-white/80">
                Enter
              </kbd>{' '}
              Apply & Deploy
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={closeStudio}
              className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyLayout}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-white hover:bg-white/90 text-black text-xs font-sans font-medium shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>Deploy Layout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
