import React, { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { WorkspaceSidebar } from '@/components/common/WorkspaceSidebar';
import { GridRenderer } from '@/components/layout/GridRenderer';
import { StatusBar } from '@/components/common/StatusBar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { AboutModal } from '@/components/ui/AboutModal';
import { ShortcutsModal } from '@/components/ui/ShortcutsModal';
import { NotificationToastContainer } from '@/components/ui/NotificationToast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { InputModal } from '@/components/ui/InputModal';
import { SplashScreen } from '@/components/common/SplashScreen';
import { FirstRunHint } from '@/components/common/FirstRunHint';
import { VoiceIndicator } from '@/components/ui/VoiceIndicator';

import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';
import { useVoiceToTerminal } from '@/hooks/useVoiceToTerminal';
import { listenStartupWarning, voiceSetSilenceTimeout, voiceSetInputDevice, setBatchInterval, isTauri } from '@/lib/tauri';

export const App: React.FC = () => {
  useVoiceToTerminal();
  const {
    root,
    focusedPaneId,
    closePane,
    toggleMaximize,
    navigateFocus,
    paneCount,
    maxPanes,
  } = usePaneStore();

  const {
    toggleCommandPalette,
    toggleSettings,
    addToast,
    pendingClosePaneId,
    cancelPendingClose,
    pendingSwitchWsId,
    cancelPendingSwitch,
    pendingCreateWsId,
    isCreateWsModalOpen,
    openCreateWsModal,
    closeCreateWsModal,
    requestCreateWorkspace,
  } = useUIStore();
  const { increaseFontSize, decreaseFontSize, resetFontSize } = useSettingsStore();
  const { workspaces, activeWorkspaceId, switchWorkspace, loadWorkspaces, saveCurrentWorkspace, deleteWorkspace } = useWorkspaceStore();
  const { matchesKeybinding } = useKeybindingsStore();

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Does the current workspace have spawned PTYs? (used for confirmation copy)
  const runningNodes = getTerminalNodes(root).filter((t) => t.paneId);
  const runningCount = runningNodes.length;
  // Gap 11: surface which panes/processes are running in the switch dialog.
  const runningTitles = runningNodes.map((t) => t.title || 'Untitled pane').slice(0, 6);
  // Does the specific pane being closed have a live PTY? (accurate copy for the close dialog)
  const closingPaneHasPty = pendingClosePaneId
    ? getTerminalNodes(root).some((t) => t.id === pendingClosePaneId && Boolean(t.paneId))
    : false;

  // Load saved workspaces on app mount
  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // Surface non-fatal startup warnings from the Rust side (e.g. global summon
  // shortcut failed to register because another instance/app holds it)
  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;
    listenStartupWarning((event) => {
      addToast({ type: 'warning', title: 'Startup Warning', description: event.payload, durationMs: 6000 });
    }).then((fn) => {
      if (cancelled) {
        fn();
      } else {
        unlisten = fn;
      }
    });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [addToast]);

  // Save active workspace layout on window unload — pagehide is more reliable
  // than beforeunload in webviews (fires on teardown, Cmd+Q, tray quit), and
  // beforeunload remains as a web-preview fallback. Both are fire-and-forget;
  // the debounced auto-save below is the real safety net.
  useEffect(() => {
    const handlePageHide = () => {
      saveCurrentWorkspace();
    };
    const handleBeforeUnload = () => {
      saveCurrentWorkspace();
    };
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveCurrentWorkspace]);

  // Reliable close-time flush (Tauri): onCloseRequested fires before the window
  // is destroyed, unlike beforeunload which can be cut short. We preventDefault,
  // await the save, then destroy the window ourselves so the write completes.
  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | undefined;
    import('@tauri-apps/api/window')
      .then(({ getCurrentWindow }) =>
        getCurrentWindow().onCloseRequested(async (event) => {
          event.preventDefault();
          try {
            await saveCurrentWorkspace();
          } catch (e) {
            console.error('[App] Final save before close failed:', e);
          } finally {
            // destroy() bypasses the close-requested event (no infinite loop)
            await getCurrentWindow().destroy();
          }
        })
      )
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {
        // window API unavailable — beforeunload fallback still applies
      });
    return () => {
      unlisten?.();
    };
  }, [saveCurrentWorkspace]);

  // Debounced auto-save: any layout change (split, close, resize, title, cwd)
  // is persisted ~500ms later, so nothing is lost if the app crashes or is
  // killed without a clean close.
  useEffect(() => {
    let timer: number | undefined;
    const unsub = usePaneStore.subscribe((state, prev) => {
      if (state.root === prev.root) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        saveCurrentWorkspace();
      }, 500);
    });
    return () => {
      unsub();
      if (timer) window.clearTimeout(timer);
    };
  }, [saveCurrentWorkspace]);

  // Re-apply persisted backend settings on boot (gap 10/14 + audit find 1):
  // localStorage restores the UI values, but the Rust side only learns about
  // them through their setters — push them all once on startup. Without the
  // batch interval the Rust batcher silently stays on its own 16 ms default
  // after every restart even when the UI shows a different persisted value.
  useEffect(() => {
    const { voiceSilenceTimeoutMs, voiceInputDevice, ipcBatchIntervalMs } = useSettingsStore.getState();
    voiceSetSilenceTimeout(voiceSilenceTimeoutMs).catch(() => {});
    voiceSetInputDevice(voiceInputDevice).catch(() => {});
    setBatchInterval(ipcBatchIntervalMs).catch(() => {});
  }, []);

  // Dynamic Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Re-assignable keybindings win over hardcoded shortcuts (audit find 5):
      // these checks run FIRST so a user-reassigned combo (e.g. settings bound
      // to Cmd+B) is never silently shadowed by a hardcoded shortcut below.
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
          const ok = usePaneStore.getState().splitPane(focusedPaneId, 'vertical');
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
          const ok = usePaneStore.getState().splitPane(focusedPaneId, 'horizontal');
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
          // Guard: always confirm before terminating a pane (audit 7.1)
          useUIStore.getState().requestClosePane(focusedPaneId);
        }
        return;
      }

      // Audit find 4: 'new-workspace' was advertised in Settings/Palette but had
      // NO handler anywhere — pressing Mod+Shift+N did nothing. Now it opens the
      // create-workspace modal.
      if (matchesKeybinding(e, 'new-workspace')) {
        e.preventDefault();
        openCreateWsModal();
        return;
      }

      // Cmd/Ctrl + B -> Toggle Workspace Sidebar (not reassignable)
      if (isMod && e.code === 'KeyB') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        return;
      }

      // Cmd/Ctrl + Shift + Left / Right -> Switch Workspaces (guarded: processes are terminated)
      if (isMod && e.shiftKey && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
        e.preventDefault();
        const currentIndex = workspaces.findIndex((w) => w.id === activeWorkspaceId);
        if (currentIndex !== -1 && workspaces.length > 1) {
          const delta = e.code === 'ArrowRight' ? 1 : -1;
          const nextIndex = (currentIndex + delta + workspaces.length) % workspaces.length;
          // Guard: warn when the current workspace has running terminals (audit 3.6)
          useUIStore.getState().requestSwitchWorkspace(workspaces[nextIndex].id);
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
    closePane,
    toggleMaximize,
    navigateFocus,
    toggleCommandPalette,
    toggleSettings,
    openCreateWsModal,
    switchWorkspace,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    addToast,
  ]);

  return (
    <div className="h-screen w-screen flex flex-col bg-bgDark text-[#e2e8f0] overflow-hidden select-none">
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
      <VoiceIndicator />
      <CommandPalette onOpenAbout={() => setIsAboutOpen(true)} />
      <SettingsModal />
      <ShortcutsModal />
      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}
      <NotificationToastContainer />
      <SplashScreen />
      <FirstRunHint />

      {/* Guarded: close pane (kills processes) */}
      {pendingClosePaneId && (
        <ConfirmModal
          title="Close Terminal"
          message={`This terminal${closingPaneHasPty ? ' and its running processes' : ''} will be terminated. Any active servers, agents, or long-running commands in this pane will be killed.`}
          confirmLabel="Close Terminal"
          isDanger={true}
          onConfirm={() => closePane(pendingClosePaneId)}
          onClose={cancelPendingClose}
        />
      )}

      {/* Guarded: switch workspace (terminates current workspace processes) */}
      {pendingSwitchWsId && (
        <ConfirmModal
          title="Switch Workspace"
          message={
            runningCount > 0
              ? `The current workspace has ${runningCount} running terminal${runningCount > 1 ? 's' : ''}: ${runningTitles.join(', ')}. Switching workspaces will terminate those processes. Continue?`
              : `Switch to this workspace?`
          }
          confirmLabel="Switch Workspace"
          onConfirm={() => {
            switchWorkspace(pendingSwitchWsId);
          }}
          onClose={cancelPendingSwitch}
        />
      )}

      {/* Guarded: create workspace also switches to it (audit fix — same
          process-termination risk as switching). When the current workspace has
          running terminals the new workspace is created deferred and this
          confirmation decides whether to finish the switch. ConfirmModal calls
          onConfirm then onClose, so onConfirm clears the pending id first and
          onClose only cleans up the un-activated workspace when it was never
          confirmed (read from the store, not the closure, to avoid staleness). */}
      {/* Audit find 4: global create-workspace modal — the 'new-workspace'
          keybinding opens this; Header/Sidebar/Settings/Palette keep their own. */}
      {isCreateWsModalOpen && (
        <InputModal
          title="Create New Workspace"
          placeholder={`Workspace ${workspaces.length + 1}`}
          initialValue={`Workspace ${workspaces.length + 1}`}
          onSave={(name) => {
            requestCreateWorkspace(name.slice(0, 50));
          }}
          onClose={closeCreateWsModal}
        />
      )}

      {pendingCreateWsId && (
        <ConfirmModal
          title="Create Workspace"
          message={`Creating a new workspace will terminate ${runningCount} running terminal${runningCount > 1 ? 's' : ''}: ${runningTitles.join(', ')}. Continue?`}
          confirmLabel="Create Workspace"
          onConfirm={() => {
            const id = useUIStore.getState().pendingCreateWsId;
            useUIStore.getState().cancelPendingCreate();
            if (id) switchWorkspace(id);
          }}
          onClose={() => {
            const id = useUIStore.getState().pendingCreateWsId;
            useUIStore.getState().cancelPendingCreate();
            // The workspace was created deferred but never activated — remove it
            // so a cancelled create doesn't leave an empty ghost workspace.
            if (id) deleteWorkspace(id);
          }}
        />
      )}
    </div>
  );
};
