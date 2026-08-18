import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Terminal, ITerminalOptions } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { CanvasAddon } from '@xterm/addon-canvas';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import '@xterm/xterm/css/xterm.css';

import { spawnPty, writeToPty, resizePty, killPty, listenTerminalBatch, listenTerminalExit, paneSnapshot, isTauri, SpawnPtyOptions } from '@/lib/tauri';
import { useSettingsStore, THEMES, getAllThemes } from '@/store/useSettingsStore';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useUIStore } from '@/store/useUIStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';
import { SearchBar } from '../ui/SearchBar';
import { InputModal } from '../ui/InputModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { TerminalContextMenu, ContextMenuItem } from './TerminalContextMenu';
import { Copy, ClipboardPaste, Search, Eraser, Columns, Rows, X, Terminal as TerminalIcon, Repeat, FileCode2, Palette } from 'lucide-react';
import { PaneNode, TerminalNode } from '@/types/layout';
import { TerminalTheme } from '@/types/terminal';
import { escapeShellPath, bracketedPaste } from '@/lib/commandUtils';

interface TerminalPaneProps {
  id: string; // Layout node ID
  isFocused: boolean;
  onActivity?: () => void;
}

/** This xterm build's typings omit `padding` even though the runtime supports
 *  it (verified against node_modules/@xterm/xterm/lib/xterm.js). Expose it via
 *  a typed intersection so the rest of the options stay type-checked. */
type ExtendedTerminalOptions = ITerminalOptions & { padding?: number | string };

/**
 * Short terminal bell beep (customization audit C17). This xterm build ships
 * no bellStyle option, so the bell is handled through `onBell` + Web Audio.
 * The AudioContext is created lazily on the first bell (browsers require a
 * user gesture before autoplay, and terminals are user-focused by then).
 */
let bellAudioCtx: AudioContext | null = null;
function playBell() {
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    if (!bellAudioCtx) bellAudioCtx = new Ctor();
    if (bellAudioCtx.state === 'suspended') bellAudioCtx.resume();
    const osc = bellAudioCtx.createOscillator();
    const gain = bellAudioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    const now = bellAudioCtx.currentTime;
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(gain).connect(bellAudioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {
    // audio unavailable — silently ignore
  }
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

/** Parse the raw "shell args" setting (space-separated) into argv pieces (C11). */
function parseShellArgs(raw: string): string[] {
  return raw.trim() ? raw.trim().split(/\s+/) : [];
}

/** Parse the raw "shell env" setting (one KEY=VALUE per line) into an env map (C11).
 *  Lines without '=' or with an empty key are skipped — a malformed line must
 *  never break pane spawning. */
function parseShellEnv(raw: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      if (key) env[key] = line.slice(idx + 1);
    }
  }
  return env;
}

/**
 * Customization audit C20: copy the current selection as HTML (inline-styled
 * `<pre>`) so pasting into a rich editor keeps the terminal colors. Walks the
 * selected cells directly (xterm's selection API only exposes plain text) and
 * groups consecutive same-colored cells into spans. Falls back to a plain
 * text copy when the ClipboardItem API is unavailable.
 */
function copySelectionAsHtml(term: Terminal, theme: TerminalTheme): boolean {
  const sel = term.getSelectionPosition();
  if (!sel) return false;
  const plain = term.getSelection();
  const buffer = term.buffer.active;
  const ansi = [
    theme.black, theme.red, theme.green, theme.yellow,
    theme.blue, theme.magenta, theme.cyan, theme.white,
    theme.brightBlack, theme.brightRed, theme.brightGreen, theme.brightYellow,
    theme.brightBlue, theme.brightMagenta, theme.brightCyan, theme.brightWhite,
  ];
  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rows: string[] = [];
  for (let y = sel.start.y; y <= sel.end.y; y++) {
    const line = buffer.getLine(y);
    if (!line) {
      rows.push('');
      continue;
    }
    const startX = y === sel.start.y ? sel.start.x : 0;
    const endX = y === sel.end.y ? Math.min(sel.end.x, line.length) : line.length;
    let html = '';
    let currentColor = '';
    let run = '';
    const flushRun = () => {
      if (!run) return;
      html += currentColor ? `<span style="color:${currentColor}">${escapeHtml(run)}</span>` : escapeHtml(run);
      run = '';
    };
    for (let x = startX; x < endX; x++) {
      const cell = line.getCell(x);
      const ch = cell?.getChars() ?? ' ';
      let color = '';
      if (cell) {
        const mode = cell.getFgColorMode();
        const fg = cell.getFgColor();
        if (mode === 2) {
          // Direct RGB: 0xRRGGBB.
          color = `#${((fg >> 16) & 0xff).toString(16).padStart(2, '0')}${((fg >> 8) & 0xff).toString(16).padStart(2, '0')}${(fg & 0xff).toString(16).padStart(2, '0')}`;
        } else if (mode === 1 && fg >= 0 && fg < 16) {
          color = ansi[fg] ?? '';
        }
      }
      if (color !== currentColor) {
        flushRun();
        currentColor = color;
      }
      run += ch;
    }
    flushRun();
    rows.push(html || '&nbsp;');
  }
  const htmlDoc = `<pre style="font-family:monospace;font-size:12px;line-height:1.4;white-space:pre;background:${theme.background};color:${theme.foreground};padding:8px">${rows.join('<br/>')}</pre>`;
  try {
    const item = new ClipboardItem({
      'text/html': new Blob([htmlDoc], { type: 'text/html' }),
      'text/plain': new Blob([plain], { type: 'text/plain' }),
    });
    navigator.clipboard.write([item]);
    return true;
  } catch (e) {
    // ClipboardItem unsupported in this webview — plain-text copy still works.
    navigator.clipboard.writeText(plain);
    return false;
  }
}

interface MenuState {
  x: number;
  y: number;
}

/** Retrieve a terminal node by id from the layout tree. Module scope (not a
 * per-render closure) so the fine-grained store selector below stays stable
 * across renders and only this pane's node drives its re-renders. */
function findTerminalNode(node: PaneNode | null, targetId: string): TerminalNode | null {
  if (!node) return null;
  if (node.id === targetId && node.type === 'terminal') return node;
  if (node.type === 'split') {
    return findTerminalNode(node.children[0], targetId) || findTerminalNode(node.children[1], targetId);
  }
  return null;
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({ id, isFocused, onActivity }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const ptyPaneIdRef = useRef<string | null>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [menu, setMenu] = useState<MenuState | null>(null);
  // Customization audit C13: per-pane appearance popover (opened from the
  // context menu).
  const [showAppearanceMenu, setShowAppearanceMenu] = useState(false);
  const [appearancePos, setAppearancePos] = useState<MenuState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false); // visual feedback while dragging paths over the pane (gap 8)
  const [hasExited, setHasExited] = useState(false); // PTY process exited (audit fix)
  const [session, setSession] = useState(0); // bumped to relaunch a dead shell (UX audit P2 #9)
  const exitToastShownRef = useRef(false);
  const [pendingPasteText, setPendingPasteText] = useState<string | null>(null);

  const isFocusedRef = useRef(isFocused);
  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  const onActivityRef = useRef(onActivity);
  useEffect(() => {
    onActivityRef.current = onActivity;
  }, [onActivity]);

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
    terminalRef.current?.focus();
  }, []);

  // ── Perf: fine-grained store selectors ──────────────────────────────────
  // Each pane subscribes ONLY to (a) its own node in the layout tree and (b)
  // the actions it calls. The node selector returns the stable tree reference
  // for this pane: an unrelated store update (a divider drag elsewhere, another
  // pane's spawn/exit) keeps that reference intact, so this pane — and its
  // xterm instance — does not re-render. Before, every pane subscribed to the
  // whole store and re-rendered on EVERY layout change (O(n²) work per drag
  // frame with 16 panes).
  const currentNode = usePaneStore(useCallback((s) => findTerminalNode(s.root, id), [id]));
  // Customization audit C12: per-workspace overrides for the ACTIVE workspace.
  // The selector returns the stored reference, so unrelated workspace saves
  // (which spread the record) do not re-render every pane.
  const workspaceOverrides = useWorkspaceStore(
    (s) => s.workspaces.find((w) => w.id === s.activeWorkspaceId)?.overrides
  );
  const setPanePtyId = usePaneStore((s) => s.setPanePtyId);
  const setFocusedPane = usePaneStore((s) => s.setFocusedPane);
  const splitPane = usePaneStore((s) => s.splitPane);
  const setPaneShell = usePaneStore((s) => s.setPaneShell);
  const setPaneAppearance = usePaneStore((s) => s.setPaneAppearance);
  const clearPaneAppearance = usePaneStore((s) => s.clearPaneAppearance);
  const swapPanes = usePaneStore((s) => s.swapPanes);

  const {
    fontSize,
    fontFamily,
    themeName,
    scrollback,
    cursorBlink,
    cursorStyle,
    fontLigatures,
    lineHeight,
    terminalOpacity,
    copyOnSelect,
    defaultShell,
    // Customization audit C5/C6/C19: options this xterm build supports natively.
    cursorWidth,
    wordSeparators,
    terminalPadding,
  } = useSettingsStore(
    useShallow((s) => ({
      fontSize: s.fontSize,
      fontFamily: s.fontFamily,
      themeName: s.themeName,
      scrollback: s.scrollback,
      cursorBlink: s.cursorBlink,
      cursorStyle: s.cursorStyle,
      fontLigatures: s.fontLigatures,
      lineHeight: s.lineHeight,
      terminalOpacity: s.terminalOpacity,
      copyOnSelect: s.copyOnSelect,
      defaultShell: s.defaultShell,
      // Customization audit C5/C6/C19: terminal behavior settings consumed here.
      cursorWidth: s.cursorWidth,
      wordSeparators: s.wordSeparators,
      terminalPadding: s.terminalPadding,
    }))
  );
  const acquireWebglSlot = useUIStore((s) => s.acquireWebglSlot);
  const releaseWebglSlot = useUIStore((s) => s.releaseWebglSlot);
  const requestClosePane = useUIStore((s) => s.requestClosePane);

  const existingPtyId = currentNode?.paneId;
  const parentCwd = currentNode?.cwd;
  const parentShell = currentNode?.shell;

  // Customization audit C12/C13: effective settings = pane override ??
  // workspace override ?? global.
  const paneAppearance = currentNode?.appearance;
  const effThemeName = paneAppearance?.themeName ?? workspaceOverrides?.themeName ?? themeName;
  const effFontSize = paneAppearance?.fontSize ?? workspaceOverrides?.fontSize ?? fontSize;
  const effFontFamily = paneAppearance?.fontFamily ?? workspaceOverrides?.fontFamily ?? fontFamily;
  const effOpacity = paneAppearance?.terminalOpacity ?? workspaceOverrides?.terminalOpacity ?? terminalOpacity;

  // Paste the clipboard into the pane, honoring the multi-line confirmation
  // guard (customization audit C20). Reads the setting live so a change in
  // Settings applies to the next paste without remounting the pane.
  const pasteFromClipboard = () => {
    navigator.clipboard.readText().then((text) => {
      if (!text || !ptyPaneIdRef.current) return;
      if (useSettingsStore.getState().pasteConfirmNewlines && /\r?\n/.test(text)) {
        setPendingPasteText(text);
        return;
      }
      writeToPty(ptyPaneIdRef.current, bracketedPaste(text));
    });
  };
  // The custom key handler is registered once per session; route its paste
  // through a ref so it always calls the CURRENT helper.
  const pasteFromClipboardRef = useRef(pasteFromClipboard);
  useEffect(() => {
    pasteFromClipboardRef.current = pasteFromClipboard;
  });

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
  }, [isFocused, id, setFocusedPane]);

  // Keep the live PTY handle in sync with the store (audit fix for swapPanes):
  // a swap moves a pane's PTY to a different layout slot, so this pane's
  // ptyPaneIdRef must track the store's paneId — otherwise batch output would
  // keep flowing to the old slot and teardown could kill the neighbor's shell.
  useEffect(() => {
    if (currentNode?.paneId) {
      ptyPaneIdRef.current = currentNode.paneId;
    }
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

    const theme = THEMES[effThemeName] || THEMES.vibeDark;

    // Initialize xterm.js instance
    const term = new Terminal({
      fontSize: effFontSize,
      fontFamily: effFontFamily,
      theme,
      scrollback,
      cursorBlink,
      cursorStyle,
      cursorWidth,
      lineHeight,
      convertEol: true,
      allowProposedApi: true,
      // Customization audit C5/C6/C19: this xterm build supports these natively
      // (scrollOnOutput and bellStyle were dropped from this build — they are
      // implemented manually below via onBell / write-follow).
      wordSeparator: wordSeparators,
      padding: terminalPadding,
    } as ExtendedTerminalOptions);

    // Customization audit C17: terminal bell. This build has no bellStyle
    // option, so play a short beep through Web Audio when the setting is on.
    term.onBell(() => {
      if (useSettingsStore.getState().terminalBell) playBell();
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();

    // Clickable URLs via the shell plugin (with web fallback). Customization
    // audit C16: gated by the clickableLinks toggle and can require a modifier
    // key — read live so a Settings change applies without remounting.
    const webLinksAddon = new WebLinksAddon((event, uri) => {
      const { clickableLinks: linksEnabled, linkModifier: mod } = useSettingsStore.getState();
      if (!linksEnabled) return;
      const modOk =
        mod === 'click' ||
        (mod === 'meta' && event.metaKey) ||
        (mod === 'ctrl' && event.ctrlKey) ||
        (mod === 'alt' && event.altKey);
      if (!modOk) return;
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
        // Customization audit C20: multi-line pastes can confirm first.
        if (isMod && !ev.shiftKey && ev.code === 'KeyV') {
          pasteFromClipboardRef.current();
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
          // Customization audit C12: a workspace override wins over the global
          // default shell/cwd; a per-pane override wins over both.
          const effectiveShell = parentShell || workspaceOverrides?.defaultShell || defaultShell || undefined;
          // Customization audit C7: a pane's own cwd wins, then a workspace
          // override, then the global "new pane" default, then the session dir.
          const effectiveCwd =
            parentCwd || workspaceOverrides?.defaultCwd || useSettingsStore.getState().defaultCwd || undefined;
          // Customization audit C11: global shell args/env apply ONLY when the
          // pane is spawning with the global default shell (no per-pane or
          // workspace override) — the args were written for that shell.
          const isGlobalDefaultShell = !parentShell && !workspaceOverrides?.defaultShell;
          let spawnOpts: SpawnPtyOptions | undefined;
          if (isGlobalDefaultShell) {
            const s = useSettingsStore.getState();
            const shellArgs = parseShellArgs(s.shellArgs);
            const shellEnv = parseShellEnv(s.shellEnv);
            if (shellArgs.length > 0 || Object.keys(shellEnv).length > 0) {
              spawnOpts = { shellArgs, shellEnv };
            }
          }
          ptyId = await spawnPty(cols, rows, effectiveCwd, effectiveShell, spawnOpts);
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
          // Customization audit C18: this xterm build dropped scrollOnOutput, so
          // implement its semantics (auto-scroll on output when enabled) here.
          if (useSettingsStore.getState().scrollOnOutput) {
            term.scrollToBottom();
          }
          // Surface activity in unfocused panes so users can monitor agents at a glance
          if (!isFocusedRef.current) {
            onActivityRef.current?.();
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

    // Customization audit C12: apply effective (workspace-override-aware) values.
    const theme = THEMES[effThemeName] || THEMES.vibeDark;
    term.options.fontSize = effFontSize;
    term.options.fontFamily = effFontFamily;
    term.options.theme = theme;
    term.options.scrollback = scrollback;
    term.options.cursorBlink = cursorBlink;
    term.options.cursorStyle = cursorStyle;
    term.options.cursorWidth = cursorWidth;
    term.options.lineHeight = lineHeight;
    // Customization audit C5/C6/C19: behavior options update live too.
    term.options.wordSeparator = wordSeparators;
    (term.options as ExtendedTerminalOptions).padding = terminalPadding;

    if (fitAddonRef.current) {
      try {
        fitAddonRef.current.fit();
      } catch (e) {
        // ignore fit error
      }
    }
  }, [effThemeName, effFontSize, effFontFamily, scrollback, cursorBlink, cursorStyle, lineHeight, cursorWidth, wordSeparators, terminalPadding]);

  // Focus terminal when isFocused changes
  useEffect(() => {
    if (isFocused && terminalRef.current) {
      terminalRef.current.focus();
    }
  }, [isFocused]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Customization audit C15: right-click can paste directly (tmux-style)
    // instead of opening the context menu.
    if (useSettingsStore.getState().rightClickPaste) {
      pasteFromClipboard();
      return;
    }
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
      // Customization audit C20: colored HTML copy for rich editors.
      id: 'copy-as-html',
      label: 'Copy as HTML (with colors)',
      icon: <FileCode2 className="w-3.5 h-3.5" />,
      disabled: !terminalRef.current?.hasSelection(),
      action: () => {
        const term = terminalRef.current;
        if (!term || !term.hasSelection()) return;
        const theme = THEMES[effThemeName] || THEMES.vibeDark;
        copySelectionAsHtml(term, theme);
        useUIStore.getState().addToast({ type: 'success', title: 'Copied as HTML', description: 'Terminal colors preserved for rich-text paste.' });
      },
    },
    {
      id: 'paste',
      label: 'Paste',
      icon: <ClipboardPaste className="w-3.5 h-3.5" />,
      action: () => pasteFromClipboard(),
    },
    {
      id: 'set-shell',
      label: 'Set Shell for This Pane…',
      icon: <TerminalIcon className="w-3.5 h-3.5" />,
      action: () => setShowShellModal(true),
    },
    {
      // Customization audit C13: per-pane appearance overrides.
      id: 'appearance',
      label: 'Appearance for This Pane…',
      icon: <Palette className="w-3.5 h-3.5" />,
      action: () => {
        setAppearancePos(menu ? { x: menu.x, y: menu.y } : null);
        setShowAppearanceMenu(true);
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
      className={`relative h-full w-full bg-[#131420] p-1.5 overflow-hidden border transition-all ${
        isFocused
          ? 'border-violet-400/50 shadow-[0_0_20px_var(--accent-glow)]'
          : 'border-white/[0.08]'
      } ${fontLigatures ? 'font-ligatures' : ''}`}
      style={{ opacity: effOpacity }}
      onContextMenu={handleContextMenu}
    >
      {isSearchOpen && (
        <SearchBar searchAddon={searchAddonRef.current} onClose={handleCloseSearch} />
      )}
      <div ref={containerRef} className="h-full w-full overflow-hidden" />

      {/* Drag-over highlight: dashed accent border while files hover the pane */}
      {isDragOver && (
        <div className="pointer-events-none absolute inset-1 z-30 rounded-xl border-2 border-dashed border-violet-400 bg-violet-500/10 flex items-center justify-center  animate-fade-in">
          <span className="px-3 py-1.5 rounded-lg text-xs text-white bg-black/80 border border-white/[0.10] shadow-xl">
            Release to insert path(s)
          </span>
        </div>
      )}

      {/* Shell override notice */}
      {showShellModal && Boolean(ptyPaneIdRef.current) && (
        <div className="pointer-events-none absolute top-10 right-4 z-40 max-w-[220px] rounded-xl bg-[#1A1B26] border border-white/[0.06] p-2.5 text-[10px] text-white/70 shadow-lg">
          This pane is already running a shell — the new shell applies to the
          next session (Relaunch after the process exits, or reopen the pane).
        </div>
      )}

      {/* Process exited banner — relaunch or close */}
      {hasExited && (
        <div className="absolute inset-x-2 bottom-2 z-30 flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-[#1a1408]/90 px-3 py-1.5 text-[11px] text-amber-300 shadow-lg  animate-fade-in-up">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
          </span>
          <span className="truncate font-medium">Process exited</span>
          <button
            onClick={relaunch}
            title="Start a new shell in this pane"
            className="px-2.5 py-0.5 rounded-md bg-violet-400/10 hover:bg-violet-400/20 border border-violet-400/20 text-violet-400 text-xs"
          >
            Relaunch
          </button>
          <button
            onClick={() => requestClosePane(id)}
            title="Close this terminal"
            className="px-2.5 py-0.5 rounded-md bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 text-red-400 text-xs"
          >
            Close
          </button>
        </div>
      )}

      {/* Customization audit C20: multi-line paste confirmation */}
      {pendingPasteText && (
        <ConfirmModal
          title="Paste multi-line content?"
          message={`Your clipboard contains ${pendingPasteText.trim().split(/\r?\n/).length} line(s). Multi-line text pasted into a shell can execute commands unintentionally — review before confirming.`}
          confirmLabel="Paste Anyway"
          isDanger={true}
          onConfirm={() => {
            if (ptyPaneIdRef.current) {
              writeToPty(ptyPaneIdRef.current, bracketedPaste(pendingPasteText));
            }
            setPendingPasteText(null);
          }}
          onClose={() => setPendingPasteText(null)}
        />
      )}

      {menu && <TerminalContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />}

      {/* Customization audit C13: per-pane appearance popover. A transparent
          backdrop eats clicks so the popover closes on outside interaction. */}
      {showAppearanceMenu && appearancePos && (
        <>
          <div className="fixed inset-0 z-[59]" onClick={() => setShowAppearanceMenu(false)} />
          <div
            className="fixed z-[60] w-[230px] rounded-xl bg-surface/95 border border-border/[0.08] shadow-2xl  p-3 text-xs space-y-2.5 animate-fade-in font-mono"
            style={{ left: appearancePos.x, top: appearancePos.y }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Pane Appearance</span>
              <button
                onClick={() => setShowAppearanceMenu(false)}
                className="p-0.5 rounded hover:bg-white/10 text-white/45 hover:text-white/80"
                aria-label="Close pane appearance"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-white/50 mb-1">Theme (this pane)</label>
              <select
                value={paneAppearance?.themeName ?? ''}
                onChange={(e) => setPaneAppearance(id, { themeName: e.target.value || undefined })}
                className="w-full px-2 py-1.5 rounded-lg bg-background/40 border border-border/[0.08] text-xs text-foreground/90 focus:outline-none focus:border-border/30"
              >
                <option value="">— inherit workspace/global —</option>
                {Object.entries(getAllThemes(useSettingsStore.getState())).map(([key, t]) => (
                  <option key={key} value={key}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-white/50 mb-1">Font Size (px)</label>
              <input
                type="number"
                value={paneAppearance?.fontSize ?? ''}
                onChange={(e) => setPaneAppearance(id, { fontSize: e.target.value === '' ? undefined : Number(e.target.value) })}
                placeholder="inherit"
                className="w-full px-2 py-1.5 rounded-lg bg-background/40 border border-border/[0.08] text-xs text-foreground/90 focus:outline-none focus:border-border/30"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-white/50 mb-1">Opacity — {paneAppearance?.terminalOpacity !== undefined ? `${Math.round(paneAppearance.terminalOpacity * 100)}%` : 'inherit'}</label>
              <input
                type="range"
                min={0.3}
                max={1}
                step={0.05}
                value={paneAppearance?.terminalOpacity ?? 1}
                onChange={(e) => setPaneAppearance(id, { terminalOpacity: Number(e.target.value) })}
                className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
              />
            </div>

            {paneAppearance && Object.keys(paneAppearance).length > 0 && (
              <button
                onClick={() => {
                  clearPaneAppearance(id);
                  setShowAppearanceMenu(false);
                }}
                className="w-full px-2 py-1.5 rounded-lg border border-border/[0.08] text-[10px] text-foreground/55 hover:border-rose-500/40 hover:text-rose-300 transition-colors"
              >
                Clear overrides (inherit workspace/global)
              </button>
            )}
          </div>
        </>
      )}

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
