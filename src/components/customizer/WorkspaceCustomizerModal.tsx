import React, { useEffect, useCallback } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useCustomizationStore } from '@/store/useCustomizationStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';
import { IdentitySection } from './IdentitySection';
import { DirectoryEnvSection } from './DirectoryEnvSection';
import { ThemeStudioSection } from './ThemeStudioSection';
import { Palette, Sparkles, X, ArrowRight, Shield } from 'lucide-react';

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

  useEffect(() => {
    if (isOpen) {
      syncFromCurrentState();
    }
  }, [isOpen, syncFromCurrentState]);

  const handleSaveAndApply = useCallback(() => {

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
      title: 'Customizations Applied',
      description: `Saved workspace identity, theme, and environment rules for "${workspaceName}".`,
    });
  }, [
    activeWorkspaceId,
    workspaceName,
    renameWorkspace,
    workspaceIcon,
    setWorkspaceEmoji,
    setWorkspaceOverrides,
    themeName,
    fontSize,
    fontFamily,
    defaultCwd,
    terminalOpacity,
    saveCurrentWorkspace,
    envVars,
    updateSettings,
    themeMode,
    fontLigatures,
    lineHeight,
    cursorStyle,
    cursorBlink,
    themeAccent,
    uiAccentColor,
    uiFont,
    closeCustomizer,
    addToast,
  ]);

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
  }, [isOpen, closeCustomizer, handleSaveAndApply]);

  // Focus trap for modal accessibility
  const panelRef = useFocusTrap<HTMLDivElement>(isOpen);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customizer-modal-title"
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 bg-[#090a0c]/80 animate-fade-in select-none font-sans"
    >
      {/* Main Solid Charcoal Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-5xl max-h-[90vh] bg-[#111111] border border-[#4a4b50] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#4a4b50] flex items-center justify-between bg-[#111111]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[#5683da]">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="customizer-modal-title"
                className="font-sans font-bold text-base text-white tracking-tight flex items-center gap-2"
              >
                Customization Studio
              </h2>
            </div>
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[#090a0c] p-1 rounded-full border border-[#4a4b50]">
            {[
              { id: 'identity', label: 'Identity', icon: Sparkles },
              { id: 'appearance', label: 'Theme Studio', icon: Palette },
              { id: 'terminal', label: 'CWD & Vault', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveSection(
                      tab.id as 'identity' | 'appearance' | 'terminal'
                    )
                  }
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-medium transition-all ${
                    isActive
                      ? 'bg-[#5683da] text-white shadow-sm'
                      : 'text-[#a9a9aa] hover:bg-[#303236] hover:text-white'
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
            className="p-1.5 rounded-full hover:bg-[#303236] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-transparent custom-scrollbar">
          {activeSection === 'identity' && <IdentitySection />}
          {activeSection === 'appearance' && <ThemeStudioSection />}
          {activeSection === 'terminal' && <DirectoryEnvSection />}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-3.5 border-t border-[#4a4b50] bg-[#111111] flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#a9a9aa]">
            Saved to local workspace configuration
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={closeCustomizer}
              className="h-9 flex items-center px-4 rounded-full bg-[#303236] hover:bg-[#303236]/80 border border-[#4a4b50] text-[13px] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="h-9 flex items-center gap-2 px-5 rounded-full bg-[#5683da] hover:bg-[#5683da]/90 text-white text-[13px] font-sans font-medium shadow-sm transition-all cursor-pointer"
            >
              <span>Save</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
