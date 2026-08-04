import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { CanvasAddon } from '@xterm/addon-canvas';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import '@xterm/xterm/css/xterm.css';

import { spawnPty, writeToPty, resizePty, killPty, listenTerminalBatch, isTauri } from '@/lib/tauri';
import { useSettingsStore, THEMES } from '@/store/useSettingsStore';
import { usePaneStore } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';
import { SearchBar } from '../ui/SearchBar';
import { TerminalContextMenu, ContextMenuItem } from './TerminalContextMenu';
import { Copy, ClipboardPaste, Search, Eraser, Columns, Rows, X } from 'lucide-react';
import { PaneNode, TerminalNode } from '@/types/layout';
import { escapeShellPath } from '@/lib/commandUtils';

interface TerminalPaneProps {
  id: string; // Layout node ID
  isFocused: boolean;
  onActivity?: () => void;
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

  const { fontSize, fontFamily, themeName, scrollback, cursorBlink, cursorStyle, fontLigatures, lineHeight, terminalOpacity } = useSettingsStore();
  const { root, setPanePtyId, setFocusedPane, splitPane } = usePaneStore();
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
                if (!isFocused) return;
                const paths = (event.payload as { paths: string[] }).paths || [];
                if (paths.length === 0 || !ptyPaneIdRef.current) return;
                const text = paths.map(escapeShellPath).join(' ');
                const bracketed = `\x1b[200~${text} \x1b[201~`;
                writeToPty(ptyPaneIdRef.current, bracketed);
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
  }, [isFocused]);

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

        // Bracketed Paste Mode (FR-017). Plain Cmd/Ctrl+V only — Cmd/Ctrl+Shift+V
        // is reserved for Voice-to-Terminal and must NOT paste into the shell.
        if (isMod && !ev.shiftKey && ev.code === 'KeyV') {
          navigator.clipboard.readText().then((text) => {
            if (text && ptyPaneIdRef.current) {
              const bracketed = `\x1b[200~${text}\x1b[201~`;
              writeToPty(ptyPaneIdRef.current, bracketed);
            }
          });
          return false;
        }
      }
      return true;
    });

    let unlistenBatch: (() => void) | null = null;
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
        if (!ptyId) {
          ptyId = await spawnPty(cols, rows, parentCwd);
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

        // On Data from xterm -> write to PTY
        term.onData((data) => {
          if (ptyPaneIdRef.current) {
            writeToPty(ptyPaneIdRef.current, data);
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

        // Listen for IPC batched output
        unlistenBatch = await listenTerminalBatch((event) => {
          const currentPtyId = ptyPaneIdRef.current;
          if (currentPtyId && event.payload[currentPtyId]) {
            term.write(event.payload[currentPtyId]);
            // Surface activity in unfocused panes so users can monitor agents at a glance
            if (!isFocused) {
              onActivity?.();
            }
          }
        });
        if (disposed) {
          // Unmounted while the listener was registering — drop it and the shell
          // right away so no duplicate listeners / orphan processes accumulate.
          if (unlistenBatch) {
            unlistenBatch();
            unlistenBatch = null;
          }
          if (ptyPaneIdRef.current) {
            killPty(ptyPaneIdRef.current).catch(() => {});
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
      if (unlistenBatch) unlistenBatch();

      releaseWebglSlot(id);

      const latestRoot = usePaneStore.getState().root;
      const nodeStillExists = findTerminalNode(latestRoot, id);
      if (!nodeStillExists && ptyPaneIdRef.current) {
        killPty(ptyPaneIdRef.current);
      }

      term.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
            writeToPty(ptyPaneIdRef.current, `\x1b[200~${text}\x1b[201~`);
          }
        });
      },
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
      id: 'close',
      label: 'Close Pane',
      icon: <X className="w-3.5 h-3.5 text-rose-400" />,
      action: () => requestClosePane(id),
    },
  ];

  return (
    <div
      className={`relative h-full w-full bg-[#0b0d12] p-1.5 overflow-hidden ${fontLigatures ? 'font-ligatures' : ''}`}
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

      {menu && <TerminalContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />}
    </div>
  );
};
