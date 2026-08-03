import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { CanvasAddon } from '@xterm/addon-canvas';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import '@xterm/xterm/css/xterm.css';

import { spawnPty, writeToPty, resizePty, killPty, listenTerminalBatch, isTauri } from '@/lib/tauri';
import { useSettingsStore, THEMES } from '@/store/useSettingsStore';
import { usePaneStore } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { SearchBar } from '../ui/SearchBar';

interface TerminalPaneProps {
  id: string; // Layout node ID
  isFocused: boolean;
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({ id, isFocused }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const ptyPaneIdRef = useRef<string | null>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { fontSize, fontFamily, themeName, scrollback, cursorBlink, cursorStyle } = useSettingsStore();
  const { root, setPanePtyId, setFocusedPane } = usePaneStore();
  const { acquireWebglSlot, releaseWebglSlot } = useUIStore();

  // Retrieve existing PTY ID & CWD if already spawned
  const findTerminalNode = (node: any, targetId: string): any => {
    if (!node) return null;
    if (node.id === targetId) return node;
    if (node.type === 'split') {
      return findTerminalNode(node.children[0], targetId) || findTerminalNode(node.children[1], targetId);
    }
    return null;
  };

  const currentNode = findTerminalNode(root, id);
  const existingPtyId = currentNode?.paneId;
  const parentCwd = currentNode?.cwd;

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
      convertEol: true,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();

    // Clickable URLs using Tauri shell open or fallback (FR-021)
    const webLinksAddon = new WebLinksAddon((_event, uri) => {
      if (isTauri()) {
        import('@tauri-apps/api/core').then(({ invoke }) => {
          invoke('plugin:shell|open', { path: uri }).catch(() => window.open(uri, '_blank'));
        });
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
        });
        term.loadAddon(webglAddon);
      } catch (e) {
        releaseWebglSlot(id);
        term.loadAddon(new CanvasAddon());
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
        // Cmd/Ctrl+F -> Open Search
        if (isMod && ev.code === 'KeyF') {
          setIsSearchOpen(true);
          return false;
        }

        // Cmd/Ctrl+K -> Clear Terminal (FR-019)
        if (isMod && ev.code === 'KeyK') {
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

        // Bracketed Paste Mode (FR-017)
        if (isMod && ev.code === 'KeyV') {
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

    // Spawn or Reuse PTY session
    const initPty = async () => {
      const cols = Math.max(20, term.cols || 80);
      const rows = Math.max(5, term.rows || 24);

      try {
        let ptyId = existingPtyId;
        if (!ptyId) {
          ptyId = await spawnPty(cols, rows, parentCwd);
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
          }
        });
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

    if (fitAddonRef.current) {
      try {
        fitAddonRef.current.fit();
      } catch (e) {
        // ignore fit error
      }
    }
  }, [fontSize, fontFamily, themeName, scrollback, cursorBlink, cursorStyle]);

  // Focus terminal when isFocused changes
  useEffect(() => {
    if (isFocused && terminalRef.current) {
      terminalRef.current.focus();
    }
  }, [isFocused]);

  return (
    <div className="relative h-full w-full bg-[#0a0b0d] p-1.5 overflow-hidden">
      {isSearchOpen && (
        <SearchBar searchAddon={searchAddonRef.current} onClose={() => setIsSearchOpen(false)} />
      )}
      <div ref={containerRef} className="h-full w-full overflow-hidden" />
    </div>
  );
};
