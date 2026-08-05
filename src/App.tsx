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

// Set when the user explicitly confirms the quit dialog: the subsequent
// win.close() re-enters onCloseRequested, which must not ask again.
let quitApproved = false;

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
    pendingLayoutAction,
    confirmPendingLayoutAction,
    cancelPendingLayoutAction,
    pendingQuit,
    cancelQuit,
    isCreateWsModalOpen,
    openCreateWsModal,
    closeCreateWsModal,
    requestCreateWorkspace,
  } = useUIStore();
  const { increaseFontSize, decreaseFontSize, resetFontSize } = useSettingsStore();
  const { workspaces, activeWorkspaceId, loadWorkspaces, saveCurrentWorkspace } = useWorkspaceStore();
  const { matchesKeybinding } = useKeybindingsStore();

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
  //
  // UX audit P0 #1: if terminals are still running (and the user hasn't opted
  // into minimize-to-tray), quitting is destructive — intercept and ask first.
  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | undefined;
    let isMounted = true;

    const finalizeClose = async () => {
      try {
        await saveCurrentWorkspace();
      } catch (e) {
        console.error('[App] Final save before close failed:', e);
      } finally {
        if (unlisten) unlisten();
        const win = (await import('@tauri-apps/api/window')).getCurrentWindow();
        if (useSettingsStore.getState().minimizeToTray) {
          await win.hide();
        } else {
          await win.close();
        }
      }
    };

    import('@tauri-apps/api/window')
      .then(({ getCurrentWindow }) =>
        getCurrentWindow().onCloseRequested(async (event) => {
          event.preventDefault();
          // REVIEWER FIX: a stale approval from a previously rejected close
          // must never let the NEXT close bypass the running-processes guard.
          if (quitApproved) {
            quitApproved = false;
            await finalizeClose();
            return;
          }
          const running = getTerminalNodes(usePaneStore.getState().root).filter((t) => t.paneId).length;
          if (running > 0 && !useSettingsStore.getState().minimizeToTray) {
            useUIStore.getState().requestQuit();
            return;
          }
          await finalizeClose();
        })
      )
      .then((fn) => {
        if (!isMounted) {
          fn();
        } else {
          unlisten = fn;
        }
      })
      .catch(() => {
        // window API unavailable — beforeunload fallback still applies
      });

    return () => {
      isMounted = false;
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

  // UX audit P3 #12: when a preset grid is demoted to a custom layout by a
  // split/close, say so — otherwise the Header highlight silently disappears.
  // (A preset grid the user merely RESIZES keeps its preset identity now.)
  useEffect(() => {
    return usePaneStore.subscribe((state, prev) => {
      if (state.layoutMode === 'custom' && prev.layoutMode === 'preset' && prev.presetCount > 1) {
        addToast({
          type: 'info',
          title: 'Custom layout',
          description: 'Splitting or closing a pane switched this workspace to a custom layout. Click a grid button to re-equalize.',
        });
      }
    });
  }, [addToast]);

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
            useUIStore.getState().notifyMaxPanes();
          }
        }
        return;
      }

      if (matchesKeybinding(e, 'split-horizontal')) {
        e.preventDefault();
        if (focusedPaneId) {
          const ok = usePaneStore.getState().splitPane(focusedPaneId, 'horizontal');
          if (!ok && paneCount >= maxPanes) {
            useUIStore.getState().notifyMaxPanes();
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

      // UX audit P2 #10: these were hardcoded; they now live in the keybinding
      // store so users can reassign them (and conflicts are detected).
      if (matchesKeybinding(e, 'toggle-sidebar')) {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        return;
      }

      // Switch Workspaces (non-destructive: workspace isolation keeps the other
      // workspace's terminals running in the background)
      if (matchesKeybinding(e, 'switch-workspace-prev')) {
        e.preventDefault();
        const currentIndex = workspaces.findIndex((w) => w.id === activeWorkspaceId);
        if (currentIndex !== -1 && workspaces.length > 1) {
          const nextIndex = (currentIndex - 1 + workspaces.length) % workspaces.length;
          useUIStore.getState().requestSwitchWorkspace(workspaces[nextIndex].id);
        }
        return;
      }
      if (matchesKeybinding(e, 'switch-workspace-next')) {
        e.preventDefault();
        const currentIndex = workspaces.findIndex((w) => w.id === activeWorkspaceId);
        if (currentIndex !== -1 && workspaces.length > 1) {
          const nextIndex = (currentIndex + 1) % workspaces.length;
          useUIStore.getState().requestSwitchWorkspace(workspaces[nextIndex].id);
        }
        return;
      }

      // Cycle Focus
      if (matchesKeybinding(e, 'cycle-focus-next')) {
        e.preventDefault();
        navigateFocus('next');
        return;
      }
      if (matchesKeybinding(e, 'cycle-focus-prev')) {
        e.preventDefault();
        navigateFocus('prev');
        return;
      }

      // Navigate Focus
      if (matchesKeybinding(e, 'focus-left')) {
        e.preventDefault();
        navigateFocus('left');
        return;
      }
      if (matchesKeybinding(e, 'focus-right')) {
        e.preventDefault();
        navigateFocus('right');
        return;
      }
      if (matchesKeybinding(e, 'focus-up')) {
        e.preventDefault();
        navigateFocus('up');
        return;
      }
      if (matchesKeybinding(e, 'focus-down')) {
        e.preventDefault();
        navigateFocus('down');
        return;
      }

      // Font size shortcuts
      if (matchesKeybinding(e, 'font-increase')) {
        e.preventDefault();
        increaseFontSize();
        return;
      }
      if (matchesKeybinding(e, 'font-decrease')) {
        e.preventDefault();
        decreaseFontSize();
        return;
      }
      if (matchesKeybinding(e, 'font-reset')) {
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
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    addToast,
  ]);

  // Quit guard (UX audit P0 #1): the window close was intercepted because
  // terminals are still running — ask the user before terminating them.
  const handleConfirmQuit = async () => {
    useUIStore.getState().cancelQuit();
    try {
      await saveCurrentWorkspace();
    } catch (e) {
      console.error('[App] Final save before quit failed:', e);
    }
    quitApproved = true;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  };

  const quittingRunningCount = getTerminalNodes(root).filter((t) => t.paneId).length;

  return (
    <div className="h-screen w-screen flex flex-col bg-bgDark text-foreground overflow-hidden select-none">
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

      {/* Guarded: quit with running processes (UX audit P0 #1) */}
      {pendingQuit && (
        <ConfirmModal
          title="Quit VibeGrid?"
          message={`${quittingRunningCount} terminal${quittingRunningCount === 1 ? '' : 's'} ${quittingRunningCount === 1 ? 'is' : 'are'} still running. Quitting will terminate their processes. Any active servers, agents, or long-running commands will be killed.`}
          confirmLabel="Quit & Terminate"
          isDanger={true}
          onConfirm={handleConfirmQuit}
          onClose={() => {
            // REVIEWER FIX: cancelling clears any stale approval flag.
            quitApproved = false;
            cancelQuit();
          }}
        />
      )}

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

      {/* Guarded: preset shrink / reset — these CLOSE the removed panes (the
          focused pane always survives; expanding a grid never confirms). Only
          shown when at least one removed pane has a running process. */}
      {pendingLayoutAction && (
        <ConfirmModal
          title={pendingLayoutAction.type === 'reset' ? 'Reset Layout' : `Shrink to ${pendingLayoutAction.count}-Pane Grid`}
          message={`This will close ${pendingLayoutAction.closingCount} terminal${pendingLayoutAction.closingCount === 1 ? '' : 's'} and terminate their running processes. The focused terminal stays open. Any active servers, agents, or long-running commands in the closed panes will be killed. Continue?`}
          confirmLabel="Close Terminals"
          isDanger={true}
          onConfirm={() => confirmPendingLayoutAction()}
          onClose={cancelPendingLayoutAction}
        />
      )}

      {/* Workspace creation modal (non-destructive: creating + switching to a
          new workspace keeps the current workspace's terminals running in the
          background — workspace isolation). */}
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
    </div>
  );
};
