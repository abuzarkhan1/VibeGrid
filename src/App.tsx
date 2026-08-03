import React, { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { WorkspaceSidebar } from '@/components/common/WorkspaceSidebar';
import { GridRenderer } from '@/components/layout/GridRenderer';
import { StatusBar } from '@/components/common/StatusBar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { AboutModal } from '@/components/ui/AboutModal';
import { NotificationToastContainer } from '@/components/ui/NotificationToast';

import { usePaneStore } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';

export const App: React.FC = () => {
  const {
    root,
    focusedPaneId,
    splitPane,
    closePane,
    toggleMaximize,
    navigateFocus,
    paneCount,
    maxPanes,
  } = usePaneStore();

  const { toggleCommandPalette, toggleSettings, addToast } = useUIStore();
  const { increaseFontSize, decreaseFontSize, resetFontSize } = useSettingsStore();
  const { workspaces, activeWorkspaceId, switchWorkspace, loadWorkspaces, saveCurrentWorkspace } = useWorkspaceStore();
  const { matchesKeybinding } = useKeybindingsStore();

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load saved workspaces on app mount
  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // Save active workspace layout on window beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentWorkspace();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveCurrentWorkspace]);

  // Dynamic Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + B -> Toggle Workspace Sidebar
      if (isMod && e.code === 'KeyB') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        return;
      }

      // Check re-assignable keybindings dynamically
      if (matchesKeybinding(e, 'open-settings')) {
        e.preventDefault();
        toggleSettings();
        return;
      }

      if (matchesKeybinding(e, 'command-palette')) {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      if (matchesKeybinding(e, 'toggle-maximize')) {
        e.preventDefault();
        toggleMaximize();
        return;
      }

      if (matchesKeybinding(e, 'split-vertical')) {
        e.preventDefault();
        if (focusedPaneId) {
          const ok = splitPane(focusedPaneId, 'vertical');
          if (!ok && paneCount >= maxPanes) {
            addToast({
              type: 'warning',
              title: 'Maximum Pane Limit Reached',
              description: `VibeGrid enforces a limit of ${maxPanes} active panes for peak GPU performance.`,
            });
          }
        }
        return;
      }

      if (matchesKeybinding(e, 'split-horizontal')) {
        e.preventDefault();
        if (focusedPaneId) {
          const ok = splitPane(focusedPaneId, 'horizontal');
          if (!ok && paneCount >= maxPanes) {
            addToast({
              type: 'warning',
              title: 'Maximum Pane Limit Reached',
              description: `VibeGrid enforces a limit of ${maxPanes} active panes for peak GPU performance.`,
            });
          }
        }
        return;
      }

      if (matchesKeybinding(e, 'close-pane')) {
        e.preventDefault();
        if (focusedPaneId) {
          closePane(focusedPaneId);
        }
        return;
      }

      // Cmd/Ctrl + Shift + Left / Right -> Switch Workspaces
      if (isMod && e.shiftKey && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
        e.preventDefault();
        const currentIndex = workspaces.findIndex((w) => w.id === activeWorkspaceId);
        if (currentIndex !== -1 && workspaces.length > 1) {
          const delta = e.code === 'ArrowRight' ? 1 : -1;
          const nextIndex = (currentIndex + delta + workspaces.length) % workspaces.length;
          switchWorkspace(workspaces[nextIndex].id);
        }
        return;
      }

      // Cmd/Ctrl + Tab / Shift+Tab -> Cycle Focus
      if (isMod && e.code === 'Tab') {
        e.preventDefault();
        navigateFocus(e.shiftKey ? 'prev' : 'next');
        return;
      }

      // Cmd/Ctrl + Arrow keys -> Navigate Focus
      if (isMod && !e.shiftKey && e.code === 'ArrowLeft') {
        e.preventDefault();
        navigateFocus('left');
        return;
      }
      if (isMod && !e.shiftKey && e.code === 'ArrowRight') {
        e.preventDefault();
        navigateFocus('right');
        return;
      }
      if (isMod && !e.shiftKey && e.code === 'ArrowUp') {
        e.preventDefault();
        navigateFocus('up');
        return;
      }
      if (isMod && !e.shiftKey && e.code === 'ArrowDown') {
        e.preventDefault();
        navigateFocus('down');
        return;
      }

      // Font size shortcuts
      if (isMod && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        increaseFontSize();
        return;
      }
      if (isMod && e.key === '-') {
        e.preventDefault();
        decreaseFontSize();
        return;
      }
      if (isMod && e.key === '0') {
        e.preventDefault();
        resetFontSize();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    focusedPaneId,
    paneCount,
    maxPanes,
    workspaces,
    activeWorkspaceId,
    matchesKeybinding,
    splitPane,
    closePane,
    toggleMaximize,
    navigateFocus,
    toggleCommandPalette,
    toggleSettings,
    switchWorkspace,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    addToast,
  ]);

  return (
    <div className="h-screen w-screen flex flex-col bg-sky-gradient text-[#e2e8f0] overflow-hidden select-none">
      <Header
        onOpenAbout={() => setIsAboutOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />
      <main className="flex-1 w-full overflow-hidden relative flex">
        <WorkspaceSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((prev) => !prev)} />
        <div className="flex-1 h-full overflow-hidden relative">
          <GridRenderer node={root} />
        </div>
      </main>
      <StatusBar />
      <CommandPalette onOpenAbout={() => setIsAboutOpen(true)} />
      <SettingsModal />
      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}
      <NotificationToastContainer />
    </div>
  );
};
