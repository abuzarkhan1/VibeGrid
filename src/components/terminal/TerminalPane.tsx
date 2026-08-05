import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { CanvasAddon } from '@xterm/addon-canvas';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import '@xterm/xterm/css/xterm.css';

import { spawnPty, writeToPty, resizePty, killPty, listenTerminalBatch, listenTerminalExit, paneSnapshot, isTauri } from '@/lib/tauri';
import { useSettingsStore, THEMES } from '@/store/useSettingsStore';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';
import { SearchBar } from '../ui/SearchBar';
import { InputModal } from '../ui/InputModal';
import { TerminalContextMenu, ContextMenuItem } from './TerminalContextMenu';
import { Copy, ClipboardPaste, Search, Eraser, Columns, Rows, X, Terminal as TerminalIcon, Repeat } from 'lucide-react';
import { PaneNode, TerminalNode } from '@/types/layout';
import { escapeShellPath, bracketedPaste } from '@/lib/commandUtils';

interface TerminalPaneProps {
  id: string; // Layout node ID
  isFocused: boolean;
  onActivity?: () => void;
}

/**
 * Length of the overlap between `snapshot` (older, already-written output) and
 * `pending` (newer, buffered live output): the longest suffix of `snapshot`
 * that is also a prefix of `pending`. Used on workspace switch-back to replay
 * buffered output without duplicating the bytes the snapshot already contains.
 */
function overlapSuffix(snapshot: string, pending: string): number {
  const max = Math.min(snapshot.length, pending.length);
  for (let len = max; len > 0; len--) {
    if (snapshot.slice(-len) === pending.slice(0, len)) return len;
  }
  return 0;
}

interface MenuState {
  x: number;
  y: number;
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({ id, isFocused, onActivity }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const ptyPaneIdRef = useRef<string | null>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false); // visual feedback while dragging paths over the pane (gap 8)
  const [hasExited, setHasExited] = useState(false); // PTY process exited (audit fix)
  const [session, setSession] = useState(0); // bumped to relaunch a dead shell (UX audit P2 #9)
  const exitToastShownRef = useRef(false);

  const { fontSize, fontFamily, themeName, scrollback, cursorBlink, cursorStyle, fontLigatures, lineHeight, terminalOpacity, copyOnSelect, defaultShell } = useSettingsStore();
  const { root, setPanePtyId, setFocusedPane, splitPane, setPaneShell, swapPanes } = usePaneStore();
  const { acquireWebglSlot, releaseWebglSlot, requestClosePane } = useUIStore();

  // Retrieve existing PTY ID & CWD if already spawned
  const findTerminalNode = (node: PaneNode | null, targetId: string): TerminalNode | null => {
    if (!node) return null;
    if (node.id === targetId && node.type === 'terminal') return node;
    if (node.type === 'split') {
      return findTerminalNode(node.children[0], targetId) || findTerminalNode(node.children[1], targetId);
    }
    return null;
  };

  const currentNode = findTerminalNode(root, id);
  const existingPtyId = currentNode?.paneId;
  const parentCwd = currentNode?.cwd;
  const parentShell = currentNode?.shell;

  // Close the context menu on outside interaction
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('blur', close);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('blur', close);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  // Drag-and-drop of files/folders: insert shell-escaped paths into the focused pane,
  // with a dashed-border highlight while a drag is over the pane (gap 8).
  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | null = null;

    import('@tauri-apps/api/window')
      .then(({ getCurrentWindow }) => {
        getCurrentWindow()
          .onDragDropEvent((event) => {
            switch (event.payload.type) {
              case 'enter':
              case 'over':
                if (isFocused) setIsDragOver(true);
                return;
              case 'leave':
                setIsDragOver(false);
                return;
              case 'drop': {
                setIsDragOver(false);
                // UX audit P1 #12: dropping on a non-focused pane now FOCUSES
                // that pane first and inserts there — no more silent no-op.
                if (!isFocused) {
                  setFocusedPane(id);
                  terminalRef.current?.focus();
                }
                const paths = (event.payload as { paths: string[] }).paths || [];
                if (paths.length === 0 || !ptyPaneIdRef.current) return;
                const text = paths.map(escapeShellPath).join(' ');
                writeToPty(ptyPaneIdRef.current, bracketedPaste(`${text} `));
                return;
              }
            }
          })
          .then((fn) => {
            unlisten = fn;
          });
      })
      .catch(() => {
        // drag-drop API unavailable; ignore
      });

    return () => {
      setIsDragOver(false);
      if (unlisten) unlisten();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, id, setFocusedPane]);

  // Keep the live PTY handle in sync with the store (audit fix for swapPanes):
  // a swap moves a pane's PTY to a different layout slot, so this pane's
  // ptyPaneIdRef must track the store's paneId — otherwise batch output would
  // keep flowing to the old slot and teardown could kill the neighbor's shell.
  useEffect(() => {
    if (currentNode?.paneId) {
      ptyPaneIdRef.current = currentNode.paneId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNode?.paneId]);

  // Focus requests from the voice hook (gap 4): after inserting dictation the
  // focused terminal re-focuses so the user can keep typing immediately.
  useEffect(() => {
    const onFocusPane = (e: Event) => {
      const targetId = (e as CustomEvent<string>).detail;
      if (targetId === id) {
        setFocusedPane(id);
        terminalRef.current?.focus();
      }
    };
    window.addEventListener('vibegrid:focus-pane', onFocusPane as EventListener);
    return () => window.removeEventListener('vibegrid:focus-pane', onFocusPane as EventListener);
  }, [id, setFocusedPane]);

  // Relaunch a dead shell in this pane (UX audit P2 #9): clears the stale
  // paneId so the next session spawns fresh, then re-runs the init effect.
  const relaunch = () => {
    setHasExited(false);
    exitToastShownRef.current = false;
    if (ptyPaneIdRef.current) {
      const oldPtyId = ptyPaneIdRef.current;
      ptyPaneIdRef.current = null;
      killPty(oldPtyId).catch(() => {});
    }
    usePaneStore.getState().setPanePtyId(id, '');
    setSession((s) => s + 1);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const theme = THEMES[themeName] || THEMES.vibeDark;

    // Initialize xterm.js instance
    const term = new Terminal({
      fontSize,
      fontFamily,
      theme,
      scrollback,
      cursorBlink,
      cursorStyle,
      lineHeight,
      convertEol: true,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();

    // Clickable URLs via the shell plugin (with web fallback)
    const webLinksAddon = new WebLinksAddon((_event, uri) => {
      if (isTauri()) {
        shellOpen(uri).catch(() => window.open(uri, '_blank'));
      } else {
        window.open(uri, '_blank');
      }
    });

    term.loadAddon(fitAddon);
    term.loadAddon(searchAddon);
    term.loadAddon(webLinksAddon);

    term.open(containerRef.current);

    try {
      fitAddon.fit();
    } catch (e) {
      // Ignore fit error on initial hidden mount
    }

    // Auto-focus terminal cursor on initial mount (FR-001)
    if (isFocused) {
      term.focus();
    }

    // WebGL Context Pool Management (NFR-004)
    const canUseWebgl = acquireWebglSlot(id);
    if (canUseWebgl) {
      try {
        const webglAddon = new WebglAddon();
        webglAddon.onContextLoss(() => {
          console.warn('[VibeGrid] WebGL context lost for pane', id, '; falling back to Canvas');
          releaseWebglSlot(id);
          webglAddon.dispose();
          term.loadAddon(new CanvasAddon());
          // Gap 9: surface the silent fallback so users know why rendering changed.
          // Only on context loss (a runtime event), not on initial init failure —
          // the catch below stays quiet to avoid startup toast spam across panes.
          useUIStore.getState().addToast({
            type: 'warning',
            title: 'GPU rendering unavailable',
            description: 'This pane fell back to the Canvas renderer after a WebGL context loss.',
          });
        });
        term.loadAddon(webglAddon);
      } catch (e) {
        releaseWebglSlot(id);
        term.loadAddon(new CanvasAddon());
        console.warn('[VibeGrid] WebGL init failed for pane', id, '; using Canvas renderer');
      }
    } else {
      term.loadAddon(new CanvasAddon());
    }

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;

    // Focus terminal when clicked
    containerRef.current.addEventListener('click', () => {
      setFocusedPane(id);
      term.focus();
    });

    // Custom Key Handler for Copy (Cmd/Ctrl+C), Bracketed Paste (Cmd/Ctrl+V), Search (Cmd/Ctrl+F), Clear (Cmd/Ctrl+K)
    term.attachCustomKeyEventHandler((ev) => {
      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isMod = ev.metaKey || ev.ctrlKey;

      if (ev.type === 'keydown') {
        // Audit find 4: search/clear now honor the keybindings store (live read,
        // so a remap in Settings takes effect without remounting the pane).
        if (useKeybindingsStore.getState().matchesKeybinding(ev, 'search-terminal')) {
          setIsSearchOpen(true);
          return false;
        }

        if (useKeybindingsStore.getState().matchesKeybinding(ev, 'clear-terminal')) {
          term.clear();
          return false;
        }

        // OS-Specific Copy vs SIGINT (FR-016)
        if (isMac) {
          if (ev.metaKey && !ev.ctrlKey && ev.code === 'KeyC' && term.hasSelection()) {
            navigator.clipboard.writeText(term.getSelection());
            return false;
          }
        } else {
          if (ev.ctrlKey && ev.code === 'KeyC' && term.hasSelection()) {
            navigator.clipboard.writeText(term.getSelection());
            return false;
          }
        }

        // Copy-on-select (audit: MISSING feature) — handled via onSelectionChange below.

        // Bracketed Paste Mode (FR-017). Plain Cmd/Ctrl+V only — Cmd/Ctrl+Shift+V
        // is reserved for Voice-to-Terminal and must NOT paste into the shell.
        if (isMod && !ev.shiftKey && ev.code === 'KeyV') {
          navigator.clipboard.readText().then((text) => {
            if (text && ptyPaneIdRef.current) {
              writeToPty(ptyPaneIdRef.current, bracketedPaste(text));
            }
          });
          return false;
        }
      }
      return true;
    });

    let unlistenBatch: (() => void) | null = null;
    let unlistenExit: (() => void) | null = null;
    let copyTimer: ReturnType<typeof setTimeout> | undefined;
    // Audit find 2: guards against the async-spawn race — if the pane unmounts
    // while `spawnPty`/`listenTerminalBatch` are in flight, the shell used to
    // leak forever and the batch listener was never unregistered (duplicate
    // terminal output after rapid workspace switching).
    let disposed = false;

    // Spawn or Reuse PTY session
    const initPty = async () => {
      const cols = Math.max(20, term.cols || 80);
      const rows = Math.max(5, term.rows || 24);

      try {
        let ptyId = existingPtyId;
        const isReattach = Boolean(ptyId); // switching back to a live workspace
        if (!ptyId) {
          // UX audit P3 #28: per-pane shell override wins, else the global
          // default shell setting, else the system default.
          const effectiveShell = parentShell || defaultShell || undefined;
          ptyId = await spawnPty(cols, rows, parentCwd, effectiveShell);
          if (disposed) {
            // Unmounted mid-spawn — kill the orphan shell immediately instead of
            // leaking a process with no handle.
            killPty(ptyId).catch(() => {});
            return;
          }
          setPanePtyId(id, ptyId);
        }
        ptyPaneIdRef.current = ptyId;

        if (!isTauri()) {
          term.writeln('\x1b[1;32mVibeGrid Terminal (Web Preview Mode)\x1b[0m');
          term.writeln('Type commands to test layout & UI. Running in Tauri provides full native shell PTY.\r\n');
          term.write('$ ');

          term.onData((data) => {
            if (data === '\r') {
              term.write('\r\n$ ');
            } else if (data === '\x7f') {
              term.write('\b \b');
            } else {
              term.write(data);
            }
          });
          return;
        }

        // On Data from xterm -> write to PTY. If the process already exited,
        // writes fail — surface a one-time toast so the user knows why input
        // is no longer reaching the shell (audit: error surfacing).
        // Copy-on-select (audit: was MISSING). onSelectionChange fires on every
        // drag increment, so debounce: after the selection settles (~300 ms) we
        // copy once — no clipboard churn and no toast spam mid-drag.
        term.onSelectionChange(() => {
          if (!copyOnSelect) return;
          const sel = term.getSelection();
          if (!sel) return;
          if (copyTimer) clearTimeout(copyTimer);
          copyTimer = setTimeout(() => {
            // UX audit P1 #8: copy silently — no toast per selection (toasts
            // now also dedupe/cap, but select-copy is high-frequency noise).
            navigator.clipboard.writeText(sel).catch(() => {});
          }, 300);
        });

        term.onData((data) => {
          if (ptyPaneIdRef.current) {
            writeToPty(ptyPaneIdRef.current, data).catch((e) => {
              if (!exitToastShownRef.current && ptyPaneIdRef.current) {
                exitToastShownRef.current = true;
                setHasExited(true);
                useUIStore.getState().addToast({
                  type: 'warning',
                  title: 'Terminal exited',
                  description: 'The process in this pane has ended. Close it or start a new session.',
                });
                console.warn('[VibeGrid] Write to exited PTY failed:', e);
              }
            });
          }
        });

        // On Resize -> notify PTY
        term.onResize(({ cols, rows }) => {
          if (ptyPaneIdRef.current) {
            const safeCols = Math.max(20, cols);
            const safeRows = Math.max(5, rows);
            resizePty(ptyPaneIdRef.current, safeCols, safeRows);
          }
        });

        // Workspace isolation: switching back re-attaches to a still-running
        // PTY whose terminal was unmounted while hidden. Subscribe to the live
        // batch stream FIRST (buffering while the snapshot loads) so no output
        // is dropped in the gap between reading history and attaching the
        // listener; then write the snapshot and replay only the buffered part
        // it does NOT already cover (no duplicates at the seam). If the process
        // exited while hidden, the exit event was missed — surface the banner
        // right away.
        let restoring = true;
        let restoreBuffer: string[] = [];
        unlistenBatch = await listenTerminalBatch((event) => {
          const currentPtyId = ptyPaneIdRef.current;
          if (!currentPtyId || !event.payload[currentPtyId]) return;
          if (restoring) {
            restoreBuffer.push(event.payload[currentPtyId]);
            return;
          }
          term.write(event.payload[currentPtyId]);
          // Surface activity in unfocused panes so users can monitor agents at a glance
          if (!isFocused) {
            onActivity?.();
          }
        });
        if (disposed) return;

        let snapshotOutput = '';
        if (isReattach && isTauri()) {
          const { output, exited } = await paneSnapshot(ptyId);
          if (disposed) return;
          snapshotOutput = output;
          if (output) {
            term.write(output);
            term.scrollToBottom();
          }
          if (exited) {
            setHasExited(true);
          }
        }

        // Replay output that arrived while the snapshot was being fetched,
        // skipping the part the snapshot already covers (the batcher's history
        // and the live batches carry the same bytes, so any suffix overlap is
        // a duplicate — never drop, never double-write).
        if (restoreBuffer.length > 0) {
          const pending = restoreBuffer.join('');
          restoreBuffer = [];
          restoring = false;
          const skip = overlapSuffix(snapshotOutput, pending);
          const rest = pending.slice(skip);
          if (rest) {
            term.write(rest);
            if (!isFocused) onActivity?.();
          }
        } else {
          restoring = false;
        }

        // PTY exit detection (audit fix): when the Rust reader hits EOF it
        // emits terminal-exit — show a banner instead of a frozen terminal.
        listenTerminalExit(({ payload }) => {
          if (payload.paneId === ptyPaneIdRef.current && !disposed) {
            setHasExited(true);
          }
        }).then((fn) => {
          if (disposed) {
            fn();
          } else {
            unlistenExit = fn;
          }
        });
        if (disposed) {
          // Unmounted while the listener was registering. Drop the listeners
          // but NEVER kill the PTY: by now setPanePtyId already registered it
          // into the pane store, so the workspace store owns its lifecycle
          // (workspace isolation — this is usually a mid-switch unmount).
          if (unlistenBatch) {
            unlistenBatch();
            unlistenBatch = null;
          }
          return;
        }
      } catch (error) {
        console.error('[VibeGrid] Failed to spawn PTY:', error);
        term.writeln(`\x1b[1;31mError spawning shell PTY: ${error}\x1b[0m`);
      }
    };

    initPty();

    // ResizeObserver for fitting terminal dynamically
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (fitAddonRef.current && terminalRef.current) {
          try {
            fitAddonRef.current.fit();
          } catch (e) {
            // Ignore temporary fit errors during unmount/resize
          }
        }
      });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      disposed = true; // audit find 2: stop any in-flight initPty continuation
      resizeObserver.disconnect();
      if (copyTimer) clearTimeout(copyTimer);
      if (unlistenBatch) unlistenBatch();
      if (unlistenExit) unlistenExit();

      releaseWebglSlot(id);

      // Workspace isolation: NEVER kill the PTY on unmount. Unmounting here
      // means either (a) a workspace switch — the process must keep running in
      // the background for when the user switches back, or (b) an explicit
      // close/reset/delete, in which case the STORE already killed the PTY
      // (closePane / killPanesInLayout). Killing again would destroy a hidden
      // workspace's terminals.
      term.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, session]);

  // Update theme & font settings dynamically
  useEffect(() => {
    const term = terminalRef.current;
    if (!term) return;

    const theme = THEMES[themeName] || THEMES.vibeDark;
    term.options.fontSize = fontSize;
    term.options.fontFamily = fontFamily;
    term.options.theme = theme;
    term.options.scrollback = scrollback;
    term.options.cursorBlink = cursorBlink;
    term.options.cursorStyle = cursorStyle;
    term.options.lineHeight = lineHeight;

    if (fitAddonRef.current) {
      try {
        fitAddonRef.current.fit();
      } catch (e) {
        // ignore fit error
      }
    }
  }, [fontSize, fontFamily, themeName, scrollback, cursorBlink, cursorStyle, lineHeight]);

  // Focus terminal when isFocused changes
  useEffect(() => {
    if (isFocused && terminalRef.current) {
      terminalRef.current.focus();
    }
  }, [isFocused]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  const menuItems: ContextMenuItem[] = [
    {
      id: 'copy',
      label: 'Copy',
      icon: <Copy className="w-3.5 h-3.5" />,
      disabled: !terminalRef.current?.hasSelection(),
      action: () => {
        const sel = terminalRef.current?.getSelection();
        if (sel) navigator.clipboard.writeText(sel);
      },
    },
    {
      id: 'paste',
      label: 'Paste',
      icon: <ClipboardPaste className="w-3.5 h-3.5" />,
      action: () => {
        navigator.clipboard.readText().then((text) => {
          if (text && ptyPaneIdRef.current) {
            writeToPty(ptyPaneIdRef.current, bracketedPaste(text));
          }
        });
      },
    },
    {
      id: 'set-shell',
      label: 'Set Shell for This Pane…',
      icon: <TerminalIcon className="w-3.5 h-3.5" />,
      action: () => setShowShellModal(true),
    },
    {
      id: 'find',
      label: 'Find in Terminal',
      icon: <Search className="w-3.5 h-3.5" />,
      action: () => setIsSearchOpen(true),
    },
    {
      id: 'clear',
      label: 'Clear Scrollback',
      icon: <Eraser className="w-3.5 h-3.5" />,
      action: () => terminalRef.current?.clear(),
    },
    { divider: true },
    {
      id: 'split-h',
      label: 'Split Right',
      icon: <Columns className="w-3.5 h-3.5" />,
      action: () => splitPane(id, 'horizontal'),
    },
    {
      id: 'split-v',
      label: 'Split Down',
      icon: <Rows className="w-3.5 h-3.5" />,
      action: () => splitPane(id, 'vertical'),
    },
    { divider: true },
    {
      id: 'swap-next',
      label: 'Swap with Next Pane',
      icon: <Repeat className="w-3.5 h-3.5" />,
      action: () => {
        const terminals = getTerminalNodes(usePaneStore.getState().root);
        const idx = terminals.findIndex((t) => t.id === id);
        if (idx !== -1 && terminals[idx + 1]) swapPanes(id, terminals[idx + 1].id);
      },
    },
    {
      id: 'swap-prev',
      label: 'Swap with Previous Pane',
      icon: <Repeat className="w-3.5 h-3.5" />,
      action: () => {
        const terminals = getTerminalNodes(usePaneStore.getState().root);
        const idx = terminals.findIndex((t) => t.id === id);
        if (idx > 0 && terminals[idx - 1]) swapPanes(id, terminals[idx - 1].id);
      },
    },
    { divider: true },
    {
      id: 'close',
      label: 'Close Pane',
      icon: <X className="w-3.5 h-3.5 text-rose-400" />,
      action: () => requestClosePane(id),
    },
  ];

  // Per-pane shell override (audit: the field was dead — wire it to a prompt).
  const [showShellModal, setShowShellModal] = useState(false);

  return (
    <div
      className={`relative h-full w-full bg-pane-bg p-1.5 overflow-hidden ${fontLigatures ? 'font-ligatures' : ''}`}
      style={{ opacity: terminalOpacity }}
      onContextMenu={handleContextMenu}
    >
      {isSearchOpen && (
        <SearchBar searchAddon={searchAddonRef.current} onClose={() => setIsSearchOpen(false)} />
      )}
      <div ref={containerRef} className="h-full w-full overflow-hidden" />

      {/* Drag-over highlight (gap 8): dashed forest border while files hover the pane */}
      {isDragOver && (
        <div className="pointer-events-none absolute inset-1 z-30 rounded-lg border-2 border-dashed border-forest-bright bg-forest/10 flex items-center justify-center animate-fade-in">
          <span className="px-3 py-1.5 rounded-full bg-surfaceCard/95 border border-forest/40 text-[11px] text-forest-light shadow-lg backdrop-blur-md">
            Release to insert path(s)
          </span>
        </div>
      )}

      {/* UX audit P1 #11: explain that a shell override only applies to the
          NEXT spawn — a running shell won't restart just because you changed it. */}
      {showShellModal && Boolean(ptyPaneIdRef.current) && (
        <div className="pointer-events-none absolute top-10 right-4 z-40 max-w-[220px] rounded-lg border border-forest/30 bg-surfaceCard/95 px-3 py-2 text-[10px] text-white/60 shadow-lg backdrop-blur-md">
          This pane is already running a shell — the new shell applies to the
          next session (Relaunch after the process exits, or reopen the pane).
        </div>
      )}

      {/* Process exited banner (audit fix) — relaunch or close */}
      {hasExited && (
        <div className="absolute inset-x-2 bottom-2 z-30 flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-[#1a1408]/95 px-3 py-1.5 text-[11px] text-amber-300 shadow-lg backdrop-blur-md animate-fade-in-up">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
          </span>
          <span className="truncate">Process exited</span>
          <button
            onClick={relaunch}
            title="Start a new shell in this pane"
            className="shrink-0 px-2 py-0.5 rounded-md bg-forest/20 border border-forest/40 text-forest-light hover:bg-forest/30 transition-colors"
          >
            Relaunch
          </button>
          <button
            onClick={() => requestClosePane(id)}
            title="Close this terminal"
            className="shrink-0 px-2 py-0.5 rounded-md bg-rose-950/50 border border-rose-500/30 text-rose-300 hover:bg-rose-950/80 transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {menu && <TerminalContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />}

      {showShellModal && (
        <InputModal
          title="Set Shell for This Pane"
          placeholder="/bin/zsh"
          initialValue={currentNode?.shell || ''}
          onSave={(shell) => setPaneShell(id, shell.trim())}
          onClose={() => setShowShellModal(false)}
        />
      )}
    </div>
  );
};
