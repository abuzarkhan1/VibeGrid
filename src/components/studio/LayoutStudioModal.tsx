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
      `${gutterWidth ?? 1}px`
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
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 bg-black/80 select-none font-sans"
    >
      {/* Main Solid Charcoal Panel */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-[#111111] border border-[#4a4b50] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Top Studio Header */}
        <div className="px-6 py-4 border-b border-[#4a4b50] flex items-center justify-between bg-[#111111]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#303236] border border-[#4a4b50] text-[#5683da]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="layout-studio-title"
                className="font-sans font-bold text-base text-white tracking-tight flex items-center gap-2"
              >
                Layout Studio
              </h2>
            </div>
          </div>

          {/* Tab Switcher: Presets vs Custom Matrix */}
          <div className="bg-[#111111] p-1 rounded-full border border-[#4a4b50] flex items-center gap-1">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-medium transition-all active:scale-95 cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-[#5683da] text-white border border-[#5683da]'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236] border border-transparent'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Preset Gallery</span>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-medium transition-all active:scale-95 cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-[#5683da] text-white border border-[#5683da]'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236] border border-transparent'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom Matrix</span>
            </button>
          </div>

          {/* Close affordance */}
          <button
            onClick={closeStudio}
            aria-label="Close layout studio"
            className="p-1.5 rounded-full bg-[#303236] hover:bg-[#303236]/80 border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#111111] custom-scrollbar">
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
        <div className="px-6 py-3.5 border-t border-[#4a4b50] bg-[#111111] flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-[#a9a9aa] font-mono">
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 rounded-full bg-[#303236] border border-[#4a4b50] font-mono text-[11px] text-white">
                1–9
              </kbd>{' '}
              Presets
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 rounded-full bg-[#303236] border border-[#4a4b50] font-mono text-[11px] text-white">
                Enter
              </kbd>{' '}
              Deploy
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={closeStudio}
              className="px-4 py-2 rounded-full bg-[#303236] hover:bg-[#303236]/80 border border-[#4a4b50] text-xs font-sans text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyLayout}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#5683da] hover:bg-[#5683da]/90 text-white text-xs font-sans font-medium transition-all cursor-pointer shadow-sm"
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
