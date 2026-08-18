import React, { useEffect } from 'react';
import { useCustomizationStore } from '@/store/useCustomizationStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';
import { IdentitySection } from './IdentitySection';
import { DirectoryEnvSection } from './DirectoryEnvSection';
import { ThemeStudioSection } from './ThemeStudioSection';
import { ModularStatusBarEditor } from './ModularStatusBarEditor';
import { Palette, Sparkles, Sliders, X, ArrowRight, Shield } from 'lucide-react';

export const WorkspaceCustomizerModal: React.FC = () => {
  const {
    isOpen,
    activeSection,
    workspaceName,
    workspaceIcon,
    defaultCwd,
    envVars,
    themeName,
    themeMode,
    fontFamily,
    uiFont,
    fontSize,
    fontLigatures,
    lineHeight,
    terminalOpacity,
    cursorStyle,
    cursorBlink,
    uiAccentColor,
    themeAccent,
    closeCustomizer,
    setActiveSection,
    syncFromCurrentState,
  } = useCustomizationStore();

  const addToast = useUIStore((s) => s.addToast);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const renameWorkspace = useWorkspaceStore((s) => s.renameWorkspace);
  const setWorkspaceEmoji = useWorkspaceStore((s) => s.setWorkspaceEmoji);
  const setWorkspaceOverrides = useWorkspaceStore((s) => s.setWorkspaceOverrides);
  const saveCurrentWorkspace = useWorkspaceStore((s) => s.saveCurrentWorkspace);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      syncFromCurrentState();
    }
  }, [isOpen, syncFromCurrentState]);

  // Keyboard shortcut listener (Escape to close, Cmd/Ctrl+S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeCustomizer();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveAndApply();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCustomizer]);

  if (!isOpen) return null;

  const handleSaveAndApply = () => {
    // 1. Update active workspace state
    if (activeWorkspaceId) {
      if (workspaceName.trim()) {
        renameWorkspace(activeWorkspaceId, workspaceName.trim());
      }
      if (workspaceIcon.value) {
        setWorkspaceEmoji(activeWorkspaceId, workspaceIcon.value);
      }
      setWorkspaceOverrides(activeWorkspaceId, {
        themeName,
        fontSize,
        fontFamily,
        defaultCwd: defaultCwd || undefined,
        terminalOpacity,
      });
      saveCurrentWorkspace();
    }

    // 2. Update global settings
    const envLines = Object.entries(envVars)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    updateSettings({
      themeName,
      themeMode,
      fontFamily,
      fontSize,
      fontLigatures,
      lineHeight,
      terminalOpacity,
      cursorStyle,
      cursorBlink,
      uiAccentColor: themeAccent || uiAccentColor,
      defaultCwd: defaultCwd || '',
      shellEnv: envLines,
    });

    if (uiFont) {
      document.documentElement.style.setProperty('--font-ui', uiFont);
    }

    closeCustomizer();

    addToast({
      type: 'success',
      title: 'Codex Customizations Applied',
      description: `Saved workspace identity, 3-role theme, and telemetry rules for "${workspaceName}".`,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customizer-modal-title"
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 bg-black/75  animate-fade-in select-none font-sans"
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#1A1B26] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white/90">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-400/30 text-violet-400 shadow-none">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="customizer-modal-title"
                className="font-sans font-bold text-base text-white/90 tracking-tight flex items-center gap-2"
              >
                Codex Customization Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] rounded-md !text-violet-400 !border-violet-400/30 !bg-accent/15 font-mono">
                  codex-v1
                </span>
              </h2>
              <p className="text-[11px] text-white/70 font-sans">
                Fine-tune workspace identity, theme tokens, environments, and status telemetry
              </p>
            </div>
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
            {[
              { id: 'identity', label: 'Identity', icon: Sparkles },
              { id: 'appearance', label: 'Theme Studio', icon: Palette },
              { id: 'terminal', label: 'CWD & Vault', icon: Shield },
              { id: 'statusbar', label: 'Status Bar', icon: Sliders },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveSection(
                      tab.id as 'identity' | 'appearance' | 'terminal' | 'statusbar'
                    )
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
                    isActive
                      ? 'px-3 py-1 rounded-md bg-white/[0.10] text-white font-medium text-xs'
                      : 'px-3 py-1 rounded-md text-white/60 hover:bg-white/[0.06] hover:text-white/90 text-xs transition-colors'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={closeCustomizer}
            aria-label="Close customizer"
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#1A1B26]/50">
          {activeSection === 'identity' && <IdentitySection />}
          {activeSection === 'appearance' && <ThemeStudioSection />}
          {activeSection === 'terminal' && <DirectoryEnvSection />}
          {activeSection === 'statusbar' && <ModularStatusBarEditor />}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[11px] font-mono text-white/40">
            Settings apply directly to current thread, workspace, and runtime
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={closeCustomizer}
              className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-xs text-white/70 hover:text-white/90 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-violet-500 hover:bg-violet-500/90 text-white text-xs font-sans font-bold shadow-none transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>Save & Apply</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
