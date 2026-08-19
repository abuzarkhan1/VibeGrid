import React, { useEffect, useState } from 'react';
import { WorkspaceSidebar } from '@/components/common/WorkspaceSidebar';
import { GridRenderer } from '@/components/layout/GridRenderer';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { AboutModal } from '@/components/ui/AboutModal';
import { ShortcutsModal } from '@/components/ui/ShortcutsModal';
import { NotificationToastContainer } from '@/components/ui/NotificationToast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { InputModal } from '@/components/ui/InputModal';
import { CinematicSplashScreen } from '@/components/splash/CinematicSplashScreen';
import { FirstRunHint } from '@/components/common/FirstRunHint';
import { VoiceIndicator } from '@/components/ui/VoiceIndicator';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { LayoutStudioModal } from '@/components/studio/LayoutStudioModal';
import { AgentLauncherModal } from '@/components/agent/AgentLauncherModal';
import { WorkspaceCustomizerModal } from '@/components/customizer/WorkspaceCustomizerModal';
import { RetroCrtOverlay } from '@/components/terminal/RetroCrtOverlay';
import { ContentAwareDiffViewer } from '@/components/terminal/ContentAwareDiffViewer';
import { AgentConversationPanel } from '@/components/chat/AgentConversationPanel';
import { CentralPromptCard } from '@/components/home/CentralPromptCard';

import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useAgentStore } from '@/store/useAgentStore';
import { useCustomizationStore } from '@/store/useCustomizationStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useKeybindingsStore, matchesAccel } from '@/store/useKeybindingsStore';

import { useVoiceToTerminal } from '@/hooks/useVoiceToTerminal';
import { runMacro } from '@/lib/macros';
import { useShallow } from 'zustand/react/shallow';
import { listenStartupWarning, voiceSetSilenceTimeout, voiceSetInputDevice, setBatchInterval, setGlobalSummon, voiceSetLanguage, voiceSetModelSize, autostartSetEnabled, isTauri } from '@/lib/tauri';

const LayoutView: React.FC = () => {
  const root = usePaneStore((s) => s.root);

  const gridVersion = usePaneStore((s) => s.gridVersion);
  return (
    <div className="flex-1 h-full overflow-hidden relative">
      <GridRenderer key={gridVersion} node={root} />
      <RetroCrtOverlay />
    </div>
  );
};

let quitApproved = false;

export const App: React.FC = () => {
  useVoiceToTerminal();
  const focusedPaneId = usePaneStore((s) => s.focusedPaneId);
  const closePane = usePaneStore((s) => s.closePane);
  const toggleMaximize = usePaneStore((s) => s.toggleMaximize);
  const navigateFocus = usePaneStore((s) => s.navigateFocus);
  const paneCount = usePaneStore((s) => s.paneCount);
  const maxPanes = usePaneStore((s) => s.maxPanes);

  const ui = useUIStore(
    useShallow((s) => ({
      toggleCommandPalette: s.toggleCommandPalette,
      toggleSettings: s.toggleSettings,
      addToast: s.addToast,
      pendingClosePaneId: s.pendingClosePaneId,
      cancelPendingClose: s.cancelPendingClose,
      pendingLayoutAction: s.pendingLayoutAction,
      confirmPendingLayoutAction: s.confirmPendingLayoutAction,
      cancelPendingLayoutAction: s.cancelPendingLayoutAction,
      pendingQuit: s.pendingQuit,
      cancelQuit: s.cancelQuit,
      isCreateWsModalOpen: s.isCreateWsModalOpen,
      openCreateWsModal: s.openCreateWsModal,
      closeCreateWsModal: s.closeCreateWsModal,
      requestCreateWorkspace: s.requestCreateWorkspace,
      isDiffViewerOpen: s.isDiffViewerOpen,
      setDiffViewerOpen: s.setDiffViewerOpen,
      isChatOpen: s.isChatOpen,
      setChatOpen: s.setChatOpen,
    }))
  );
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
    isDiffViewerOpen,
    setDiffViewerOpen,
    isChatOpen,
    setChatOpen,
  } = ui;
  const { increaseFontSize, decreaseFontSize, resetFontSize } = useSettingsStore(
    useShallow((s) => ({
      increaseFontSize: s.increaseFontSize,
      decreaseFontSize: s.decreaseFontSize,
      resetFontSize: s.resetFontSize,
    }))
  );
  const { workspaces, activeWorkspaceId, loadWorkspaces, saveCurrentWorkspace } = useWorkspaceStore(
    useShallow((s) => ({
      workspaces: s.workspaces,
      activeWorkspaceId: s.activeWorkspaceId,
      loadWorkspaces: s.loadWorkspaces,
      saveCurrentWorkspace: s.saveCurrentWorkspace,
    }))
  );
  const matchesKeybinding = useKeybindingsStore((s) => s.matchesKeybinding);

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [splashDismissed, setSplashDismissed] = useState(false);

  const showSplash = useSettingsStore((s) => s.showSplash);

  const uiZoom = useSettingsStore((s) => s.uiZoom);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const compactMode = useSettingsStore((s) => s.compactMode);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('vibegrid-no-anim', !animationsEnabled);
    root.classList.toggle('vibegrid-compact', compactMode);
  }, [animationsEnabled, compactMode]);

  useEffect(() => {
    const apply = (prefersDark: boolean) => {
      useSettingsStore.getState().setSystemPrefersDark(prefersDark);
    };
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    apply(mq.matches);
    const onChange = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', onChange);

    let cancelled = false;
    let unlisten: (() => void) | undefined;
    if (isTauri()) {
      import('@tauri-apps/api/window')
        .then(({ getCurrentWindow }) => {
          if (cancelled) return;
          const win = getCurrentWindow();
          win
            .theme()
            .then((t) => {
              if (!cancelled && (t === 'dark' || t === 'light')) apply(t === 'dark');
            })
            .catch(() => {});
          win
            .onThemeChanged(({ payload }) => {
              if (!cancelled && (payload === 'dark' || payload === 'light')) apply(payload === 'dark');
            })
            .then((fn) => {
              if (cancelled) {
                fn();
              } else {
                unlisten = fn;
              }
            })
            .catch(() => {});
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
      mq.removeEventListener('change', onChange);
      unlisten?.();
    };
  }, []);

  const closingPaneHasPty = usePaneStore((s) =>
    pendingClosePaneId ? getTerminalNodes(s.root).some((t) => t.id === pendingClosePaneId && Boolean(t.paneId)) : false
  );

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

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

        const { minimizeToTray, closeToTray } = useSettingsStore.getState();
        if (minimizeToTray || closeToTray) {
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

          if (quitApproved) {
            quitApproved = false;
            await finalizeClose();
            return;
          }
          const running = getTerminalNodes(usePaneStore.getState().root).filter((t) => t.paneId).length;

          const { minimizeToTray, closeToTray, confirmations } = useSettingsStore.getState();
          if (running > 0 && !minimizeToTray && !closeToTray && confirmations.quit === 'always') {
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

      });

    return () => {
      isMounted = false;
      unlisten?.();
    };
  }, [saveCurrentWorkspace]);

  useEffect(() => {
    let timer: number | undefined;
    const unsub = usePaneStore.subscribe((state, prev) => {
      if (state.root === prev.root) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        saveCurrentWorkspace();
      }, useSettingsStore.getState().autosaveIntervalMs);
    });
    return () => {
      unsub();
      if (timer) window.clearTimeout(timer);
    };
  }, [saveCurrentWorkspace]);

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

  useEffect(() => {
    const { voiceSilenceTimeoutMs, voiceInputDevice, ipcBatchIntervalMs, voiceLanguage, voiceModelSize, launchAtLogin } = useSettingsStore.getState();
    voiceSetSilenceTimeout(voiceSilenceTimeoutMs).catch(() => {});
    voiceSetInputDevice(voiceInputDevice).catch(() => {});
    setBatchInterval(ipcBatchIntervalMs).catch(() => {});
    voiceSetLanguage(voiceLanguage).catch(() => {});
    voiceSetModelSize(voiceModelSize).catch(() => {});
    autostartSetEnabled(launchAtLogin).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    const { startMaximized, startHidden } = useSettingsStore.getState();
    (async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        if (startMaximized) await win.maximize();
        if (startHidden) await win.hide();
      } catch (e) {
        console.warn('[VibeGrid] Could not apply startup window behavior:', e);
      }
    })();
  }, []);

  useEffect(() => {
    const current = useKeybindingsStore.getState().keybindings['global-summon']?.currentKey;
    if (current) setGlobalSummon(current).catch(() => {});
    return useKeybindingsStore.subscribe((state, prev) => {
      const a = state.keybindings['global-summon']?.currentKey;
      const b = prev.keybindings['global-summon']?.currentKey;
      if (a && a !== b) setGlobalSummon(a).catch(() => {});
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {

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

          useUIStore.getState().requestClosePane(focusedPaneId);
        }
        return;
      }

      if (matchesKeybinding(e, 'new-workspace')) {
        e.preventDefault();
        openCreateWsModal();
        return;
      }

      if (matchesKeybinding(e, 'toggle-sidebar')) {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        return;
      }

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

      const { macros } = useSettingsStore.getState();
      for (const macro of macros) {
        if (macro.keybinding && matchesAccel(e, macro.keybinding)) {
          e.preventDefault();
          runMacro(macro);
          return;
        }
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

  const quittingRunningCount = usePaneStore((s) =>
    pendingQuit ? getTerminalNodes(s.root).filter((t) => t.paneId).length : 0
  );

  const activeViewMode = useUIStore((s) => s.activeViewMode);
  const isSettingsOpen = useUIStore((s) => s.isSettingsOpen);

  return (
    <div
      className="h-screen w-screen flex flex-col text-ink-primary overflow-hidden select-none font-sans bg-[#1A1B26]"
      style={{ zoom: uiZoom / 100 }}
    >

      <main className="flex-1 w-full overflow-hidden relative flex">
        <WorkspaceSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((prev) => !prev)} />

        {isSettingsOpen ? (
          <SettingsModal />
        ) : (
          <>
            {}
            {activeViewMode === 'hub' && (
              <div
                className="flex-1 h-full flex items-center justify-center animate-fade-in overflow-hidden"
                style={{
                  background: '#000000',
                  backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0) 60%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0) 40%)',
                }}
              >
                <CentralPromptCard />
              </div>
            )}

            {}
            {activeViewMode === 'grid' && (
              <div className="flex-1 h-full flex gap-0 animate-fade-in overflow-hidden">
                {}
                <div className="flex-1 h-full overflow-hidden relative flex">
                  <LayoutView />
                </div>

                {}
                {isDiffViewerOpen && (
                  <div className="w-[440px] max-w-[50vw] h-full shrink-0 animate-fade-in border-l border-white/[0.06] overflow-hidden z-20">
                    <ContentAwareDiffViewer onClose={() => setDiffViewerOpen(false)} />
                  </div>
                )}

                {}
                {isChatOpen && (
                  <div className="w-[400px] max-w-[45vw] h-full shrink-0 animate-fade-in border-l border-white/[0.06] overflow-hidden z-20">
                    <AgentConversationPanel onClose={() => setChatOpen(false)} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <VoiceIndicator />
      <CommandPalette />
      <ShortcutsModal />
      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}
      <NotificationToastContainer />
      {}
      {showSplash && !splashDismissed && !useOnboardingStore.getState().isOpen && (
        <CinematicSplashScreen onComplete={() => setSplashDismissed(true)} />
      )}
      <FirstRunHint />
      <OnboardingWizard />
      <LayoutStudioModal onProceedToAgents={() => useAgentStore.getState().openLauncher()} />
      <AgentLauncherModal onProceedToCustomizer={() => useCustomizationStore.getState().openCustomizer()} />
      <WorkspaceCustomizerModal />

      {}
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
            requestCreateWorkspace(name.slice(0, useSettingsStore.getState().workspaceNameMaxLength));
          }}
          onClose={closeCreateWsModal}
        />
      )}
    </div>
  );
};
