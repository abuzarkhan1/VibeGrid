'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Terminal,
  Columns,
  Rows,
  Maximize2,
  Minimize2,
  X,
  RotateCcw,
  Play,
  Pause,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  Cpu,
  Layers,
  HardDrive,
  CornerDownLeft,
  ChevronRight,
  Pencil,
  Activity,
  Search,
  Plus,
} from 'lucide-react';

export type LayoutMode = 'quad' | 'hero' | 'split' | 'swarm';

export interface DiffHunkLine {
  type: 'add' | 'del' | 'context' | 'header';
  oldNo?: number;
  newNo?: number;
  text: string;
}

export interface TerminalLog {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'diff' | 'table';
  text?: string;
  bullet?: string;
  bulletColor?: string;
  tag?: string;
  tagColor?: string;
  diffLines?: DiffHunkLine[];
  timestamp?: string;
}

export interface PaneConfig {
  id: string;
  index: number;
  title: string;
  cwd: string;
  accent: string;
  badge: string;
  status: 'ACTIVE' | 'STREAMING' | 'IDLE';
  currentInput: string;
  history: string[];
  historyIndex: number;
  logs: TerminalLog[];
  isClosed?: boolean;
}

const INITIAL_PANES: PaneConfig[] = [
  {
    id: 'pane_01',
    index: 1,
    title: 'pane_01: claude-code',
    cwd: '~/vibegrid/core',
    accent: '#5683da',
    badge: 'CLAUDE 3.7',
    status: 'STREAMING',
    currentInput: '',
    history: ['claude "fix auth bug"', 'git status', 'cargo check'],
    historyIndex: -1,
    logs: [
      {
        id: 'c-1',
        type: 'info',
        bullet: '●',
        bulletColor: 'text-[#5683da]',
        tag: 'AST_INDEX',
        tagColor: 'bg-[#5683da]/20 text-[#5683da] border-[#5683da]/40',
        text: 'Analyzing AST token graph across 1,420 modules (Syn AST v2.0)...',
        timestamp: '20:51:02',
      },
      {
        id: 'c-2',
        type: 'success',
        bullet: '✔',
        bulletColor: 'text-[#27c93f]',
        tag: 'PATCH_READY',
        tagColor: 'bg-[#27c93f]/20 text-[#27c93f] border-[#27c93f]/40',
        text: 'Identified unhandled Option in auth_middleware.rs:L84 (CWE-252).',
        timestamp: '20:51:03',
      },
      {
        id: 'c-3',
        type: 'diff',
        timestamp: '20:51:04',
        diffLines: [
          { type: 'header', text: '@@ -81,6 +81,9 @@ fn validate_session(req: &HttpRequest)' },
          { type: 'del', oldNo: 82, text: '-    let token = req.headers().get("Authorization")?;' },
          { type: 'add', newNo: 82, text: '+    let token = extract_bearer_token(req)?;' },
          { type: 'add', newNo: 83, text: '+    let claims = token.verify_claims(&KEY_STORE)?;' },
        ],
      },
      {
        id: 'c-4',
        type: 'info',
        bullet: '⚡',
        bulletColor: 'text-[#ffbd2e]',
        text: 'Zero-copy static verification: cargo check --quiet [0 errors]',
        timestamp: '20:51:05',
      },
    ],
  },
  {
    id: 'pane_02',
    index: 2,
    title: 'pane_02: cargo test',
    cwd: '~/vibegrid/rust-pty',
    accent: '#ff8964',
    badge: 'RUST PTY',
    status: 'STREAMING',
    currentInput: '',
    history: ['cargo test --release', 'cargo bench'],
    historyIndex: -1,
    logs: [
      {
        id: 'x-1',
        type: 'info',
        bullet: '➜',
        bulletColor: 'text-[#ff8964]',
        tag: 'CARGO',
        tagColor: 'bg-[#ff8964]/20 text-[#ff8964] border-[#ff8964]/40',
        text: 'Compiling vibegrid-pty v0.1.0 (/Users/abuzar/Desktop/VibeGrid)',
        timestamp: '20:51:00',
      },
      {
        id: 'x-2',
        type: 'success',
        bullet: '✔',
        bulletColor: 'text-[#27c93f]',
        text: 'test pty::ringbuffer::test_backpressure_drain ... ok (0.01s)',
        timestamp: '20:51:02',
      },
      {
        id: 'x-3',
        type: 'success',
        bullet: '✔',
        bulletColor: 'text-[#27c93f]',
        text: 'test pty::master::test_zero_copy_ipc_stream ... ok (0.02s)',
        timestamp: '20:51:03',
      },
      {
        id: 'x-4',
        type: 'success',
        bullet: '✔',
        bulletColor: 'text-[#27c93f]',
        text: 'test pty::batch::test_60fps_render_loop ... ok (0.00s)',
        timestamp: '20:51:04',
      },
      {
        id: 'x-5',
        type: 'info',
        bullet: '●',
        bulletColor: 'text-[#ff8964]',
        text: 'test result: ok. 14 passed; 0 failed; finished in 0.42s',
        timestamp: '20:51:05',
      },
    ],
  },
  {
    id: 'pane_03',
    index: 3,
    title: 'pane_03: dev-server',
    cwd: '~/vibegrid/web',
    accent: '#27c93f',
    badge: 'READY :1420',
    status: 'ACTIVE',
    currentInput: '',
    history: ['npm run dev', 'npm run build'],
    historyIndex: -1,
    logs: [
      {
        id: 'd-1',
        type: 'info',
        bullet: '➜',
        bulletColor: 'text-[#5683da]',
        text: 'VITE v6.4.3  ready in 142 ms',
        timestamp: '20:50:50',
      },
      {
        id: 'd-2',
        type: 'success',
        bullet: '➜',
        bulletColor: 'text-[#27c93f]',
        text: 'Local:   http://localhost:1420/',
        timestamp: '20:50:51',
      },
      {
        id: 'd-3',
        type: 'info',
        bullet: '➜',
        bulletColor: 'text-[#a9a9aa]',
        text: 'Network: use --host to expose to LAN',
        timestamp: '20:50:51',
      },
      {
        id: 'd-4',
        type: 'info',
        bullet: '⚡',
        bulletColor: 'text-[#ffbd2e]',
        text: '[HMR] WebGL 2.0 Canvas context bound (60.0 FPS locked)',
        timestamp: '20:51:01',
      },
    ],
  },
  {
    id: 'pane_04',
    index: 4,
    title: 'pane_04: ollama-qwen',
    cwd: '~/vibegrid/mcp',
    accent: '#ec4899',
    badge: 'OFFLINE MCP',
    status: 'STREAMING',
    currentInput: '',
    history: ['ollama run qwen2.5-coder:32b', 'status'],
    historyIndex: -1,
    logs: [
      {
        id: 'o-1',
        type: 'info',
        bullet: '●',
        bulletColor: 'text-[#ec4899]',
        tag: 'METAL_GPU',
        tagColor: 'bg-[#ec4899]/20 text-[#ec4899] border-[#ec4899]/40',
        text: 'Qwen 2.5 Coder 32B loaded (18.4 GB Apple Metal VRAM)',
        timestamp: '20:51:00',
      },
      {
        id: 'o-2',
        type: 'info',
        bullet: '⚡',
        bulletColor: 'text-[#ffbd2e]',
        text: 'Tool call: kanban_get_workspace_context() [0ms egress]',
        timestamp: '20:51:02',
      },
      {
        id: 'o-3',
        type: 'success',
        bullet: '✔',
        bulletColor: 'text-[#27c93f]',
        text: 'Local AST cache validated. Zero cloud bytes transmitted.',
        timestamp: '20:51:04',
      },
      {
        id: 'o-4',
        type: 'info',
        bullet: '→',
        bulletColor: 'text-[#ec4899]',
        text: 'Token velocity: 48.6 tok/s · TTFT: 142ms',
        timestamp: '20:51:06',
      },
    ],
  },
  {
    id: 'pane_05',
    index: 5,
    title: 'pane_05: aider-pair',
    cwd: '~/vibegrid/git',
    accent: '#a855f7',
    badge: 'AIDER PAIR',
    status: 'IDLE',
    currentInput: '',
    history: ['aider --model gpt-4o', 'git status'],
    historyIndex: -1,
    logs: [
      {
        id: 'ai-1',
        type: 'info',
        bullet: '●',
        bulletColor: 'text-[#a855f7]',
        text: 'Tree-Sitter repository index: 84 exported symbols parsed',
        timestamp: '20:50:55',
      },
      {
        id: 'ai-2',
        type: 'success',
        bullet: '✔',
        bulletColor: 'text-[#27c93f]',
        text: 'Staged atomic commit: feat(grid): solid high-contrast theme',
        timestamp: '20:51:01',
      },
      {
        id: 'ai-3',
        type: 'info',
        bullet: '⚡',
        bulletColor: 'text-[#ffbd2e]',
        text: 'GPG signature verified: commit c8f190a',
        timestamp: '20:51:03',
      },
    ],
  },
  {
    id: 'pane_06',
    index: 6,
    title: 'pane_06: vitest-watch',
    cwd: '~/vibegrid/ui',
    accent: '#eab308',
    badge: 'VITEST',
    status: 'STREAMING',
    currentInput: '',
    history: ['vitest run', 'npm test'],
    historyIndex: -1,
    logs: [
      {
        id: 'v-1',
        type: 'info',
        bullet: '➜',
        bulletColor: 'text-[#eab308]',
        text: 'DEV  v3.2.7 /Users/abuzar/Desktop/VibeGrid',
        timestamp: '20:50:58',
      },
      {
        id: 'v-2',
        type: 'success',
        bullet: '✔',
        bulletColor: 'text-[#27c93f]',
        text: 'GridRenderer.test.tsx (4 tests) 18ms',
        timestamp: '20:51:02',
      },
      {
        id: 'v-3',
        type: 'success',
        bullet: '✔',
        bulletColor: 'text-[#27c93f]',
        text: 'TerminalContainer.test.tsx (6 tests) 24ms',
        timestamp: '20:51:04',
      },
      {
        id: 'v-4',
        type: 'info',
        bullet: '●',
        bulletColor: 'text-[#eab308]',
        text: 'Test Files  2 passed (2) | Tests  10 passed (10)',
        timestamp: '20:51:05',
      },
    ],
  },
];

const AUTONOMOUS_STREAM_EVENTS: Record<string, Array<{ bullet: string; bulletColor: string; text: string; tag?: string; tagColor?: string }>> = {
  pane_01: [
    { bullet: '●', bulletColor: 'text-[#5683da]', text: 'Running Syn parser: 1,420 modules validated in 2.8ms', tag: 'SYN_PARSE', tagColor: 'bg-[#5683da]/20 text-[#5683da] border-[#5683da]/40' },
    { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'All lifetimes and trait bounds resolved with zero warnings', tag: 'CHECK_OK', tagColor: 'bg-[#27c93f]/20 text-[#27c93f] border-[#27c93f]/40' },
    { bullet: '⚡', bulletColor: 'text-[#ffbd2e]', text: 'Subagent fiber IPC sync complete (latency: 0.9ms)' },
    { bullet: '→', bulletColor: 'text-[#5683da]', text: 'Listening on stdin PTY descriptor #4...' },
  ],
  pane_02: [
    { bullet: '⚡', bulletColor: 'text-[#ffbd2e]', text: 'PTY Fuzzing vector: 10,000 runs, 0 buffer wraps dropped' },
    { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'test pty_session::backpressure ... ok (0.01s)' },
    { bullet: '●', bulletColor: 'text-[#ff8964]', text: 'Zero heap allocation verified across 16 worker channels' },
  ],
  pane_03: [
    { bullet: '⚡', bulletColor: 'text-[#27c93f]', text: '[HMR] GridRenderer layout hot-updated in 18ms' },
    { bullet: '✔', bulletColor: 'text-[#27c93f]', text: '[HMR] WebGL canvas render loop active (0 dropped frames)' },
  ],
  pane_04: [
    { bullet: '●', bulletColor: 'text-[#ec4899]', text: 'Generating AST completions at 52.4 tok/s...' },
    { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'Local Metal buffer cache hit: 98.4% efficiency' },
  ],
  pane_05: [
    { bullet: '●', bulletColor: 'text-[#a855f7]', text: 'Git worktree clean. Ready for interactive pair commands.' },
  ],
  pane_06: [
    { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'PASS src/components/terminal/TerminalPane.test.tsx' },
    { bullet: '➜', bulletColor: 'text-[#eab308]', text: 'Waiting for file changes... (press q to quit)' },
  ],
};

export function InteractiveGridDemo() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('quad');
  const [maximizedPaneId, setMaximizedPaneId] = useState<string | null>(null);
  const [focusedPaneId, setFocusedPaneId] = useState<string>('pane_01');
  const [panes, setPanes] = useState<PaneConfig[]>(INITIAL_PANES);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [editingTitlePaneId, setEditingTitlePaneId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState<string>('');

  const terminalBottomRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Auto-scroll on new logs without affecting page scroll
  const scrollToBottom = useCallback((paneId: string) => {
    const el = terminalBottomRefs.current[paneId];
    if (el && el.parentElement) {
      el.parentElement.scrollTop = el.parentElement.scrollHeight;
    }
  }, []);

  // Autonomous streaming simulation loop
  useEffect(() => {
    if (!isStreaming) return;

    const streamInterval = setInterval(() => {
      // Pick an active or streaming pane randomly
      const visiblePanes = getVisiblePanes(layoutMode, panes, maximizedPaneId);
      const streamingPanes = visiblePanes.filter((p) => p.status === 'STREAMING' && !p.isClosed);
      if (streamingPanes.length === 0) return;

      const randomPane = streamingPanes[Math.floor(Math.random() * streamingPanes.length)];
      const events = AUTONOMOUS_STREAM_EVENTS[randomPane.id];
      if (!events || events.length === 0) return;

      const randomEvent = events[Math.floor(Math.random() * events.length)];
      const newLog: TerminalLog = {
        id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'info',
        bullet: randomEvent.bullet,
        bulletColor: randomEvent.bulletColor,
        tag: randomEvent.tag,
        tagColor: randomEvent.tagColor,
        text: randomEvent.text,
        timestamp: new Date().toTimeString().split(' ')[0],
      };

      setPanes((prev) =>
        prev.map((p) => {
          if (p.id === randomPane.id) {
            const nextLogs = [...p.logs, newLog];
            if (nextLogs.length > 50) nextLogs.shift();
            return { ...p, logs: nextLogs };
          }
          return p;
        })
      );

      scrollToBottom(randomPane.id);
    }, 2800);

    return () => clearInterval(streamInterval);
  }, [isStreaming, layoutMode, panes, maximizedPaneId, scrollToBottom]);

  // Execute terminal command
  const executeCommand = (paneId: string, rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    const time = new Date().toTimeString().split(' ')[0];
    const userLog: TerminalLog = {
      id: `cmd-${Date.now()}`,
      type: 'input',
      text: trimmed,
      timestamp: time,
    };

    let responseLogs: TerminalLog[] = [];
    const lower = trimmed.toLowerCase();

    if (lower === 'clear' || lower === 'cls') {
      setPanes((prev) =>
        prev.map((p) => {
          if (p.id === paneId) {
            return {
              ...p,
              logs: [
                {
                  id: `cleared-${Date.now()}`,
                  type: 'info',
                  bullet: '●',
                  bulletColor: 'text-[#5683da]',
                  text: `Terminal scrollback cleared. Type "help" for command catalog.`,
                  timestamp: time,
                },
              ],
              currentInput: '',
              history: [...p.history, trimmed],
              historyIndex: -1,
            };
          }
          return p;
        })
      );
      return;
    } else if (lower === 'help') {
      responseLogs = [
        {
          id: `h-1-${Date.now()}`,
          type: 'info',
          bullet: '●',
          bulletColor: 'text-[#5683da]',
          text: 'VibeGrid Interactive Terminal Commands:',
        },
        {
          id: `h-2-${Date.now()}`,
          type: 'output',
          text: '  help                 Display this command catalog & shortcut manual\n' +
                '  claude "prompt"      Run Claude Code agent with AST indexing & reasoning\n' +
                '  cargo test           Execute Rust zero-copy PTY unit & fuzzing test suite\n' +
                '  npm run dev          Start local Vite / Next.js dev server on :1420\n' +
                '  git status           Show branch status and staged/unstaged hunks\n' +
                '  git diff             Display color-coded unified git diff with hunk headers\n' +
                '  ls / ls -la          List directory tree with permissions & sizes\n' +
                '  status               Print system telemetry (FPS, PTY latency, Metal VRAM)\n' +
                '  clear                Clear the terminal scrollback buffer\n' +
                '  split / maximize     Trigger layout actions directly from shell\n' +
                '  reset                Reset all panes to initial layout state',
        },
      ];
    } else if (lower.startsWith('claude')) {
      const prompt = trimmed.replace(/^claude\s*/i, '') || '"Synthesize zero-copy patch"';
      responseLogs = [
        {
          id: `c-exec-1-${Date.now()}`,
          type: 'info',
          bullet: '●',
          bulletColor: 'text-[#5683da]',
          tag: 'CLAUDE',
          tagColor: 'bg-[#5683da]/20 text-[#5683da] border-[#5683da]/40',
          text: `Spawning Claude 3.7 Sonnet subagent: ${prompt}`,
          timestamp: time,
        },
        {
          id: `c-exec-2-${Date.now()}`,
          type: 'info',
          bullet: '⚡',
          bulletColor: 'text-[#ffbd2e]',
          text: 'Scanned 1,420 modules · Generated Syn AST boundary representations',
        },
        {
          id: `c-exec-3-${Date.now()}`,
          type: 'diff',
          diffLines: [
            { type: 'header', text: '@@ -140,5 +140,8 @@ impl PtySession {' },
            { type: 'del', oldNo: 140, text: '-    self.writer.write_all(payload)?;' },
            { type: 'add', newNo: 140, text: '+    self.backpressure_channel.send_with_timeout(payload, 50ms)?;' },
            { type: 'add', newNo: 141, text: '+    self.metrics.record_bytes_transferred(payload.len());' },
          ],
        },
        {
          id: `c-exec-4-${Date.now()}`,
          type: 'success',
          bullet: '✔',
          bulletColor: 'text-[#27c93f]',
          text: 'Auto-commit verified: feat(pty): hardware backpressure sync [GPG signed]',
        },
      ];
    } else if (lower === 'cargo test' || lower.startsWith('cargo')) {
      responseLogs = [
        {
          id: `cg-1-${Date.now()}`,
          type: 'info',
          bullet: '➜',
          bulletColor: 'text-[#ff8964]',
          tag: 'CARGO',
          tagColor: 'bg-[#ff8964]/20 text-[#ff8964] border-[#ff8964]/40',
          text: 'Running cargo test --package vibegrid-pty --release',
          timestamp: time,
        },
        { id: `cg-2-${Date.now()}`, type: 'success', bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'test ringbuffer::test_drain_rate ... ok (0.01s)' },
        { id: `cg-3-${Date.now()}`, type: 'success', bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'test ipc::test_af_unix_stream ... ok (0.01s)' },
        { id: `cg-4-${Date.now()}`, type: 'success', bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'test pty_batch::test_60fps_latency ... ok (0.00s)' },
        { id: `cg-5-${Date.now()}`, type: 'output', text: 'test result: ok. 18 passed; 0 failed; finished in 0.38s' },
      ];
    } else if (lower === 'npm run dev' || lower.startsWith('npm')) {
      responseLogs = [
        {
          id: `npm-1-${Date.now()}`,
          type: 'info',
          bullet: '➜',
          bulletColor: 'text-[#27c93f]',
          text: '> vibegrid@0.1.0 dev\n> vite --host',
          timestamp: time,
        },
        { id: `npm-2-${Date.now()}`, type: 'success', bullet: '➜', bulletColor: 'text-[#27c93f]', text: 'VITE v6.4.3 ready in 138 ms' },
        { id: `npm-3-${Date.now()}`, type: 'output', text: '  ➜  Local:   http://localhost:1420/\n  ➜  Network: http://192.168.1.45:1420/' },
        { id: `npm-4-${Date.now()}`, type: 'info', bullet: '⚡', bulletColor: 'text-[#5683da]', text: '[HMR] WebGL canvas renderer connected' },
      ];
    } else if (lower === 'git status') {
      responseLogs = [
        {
          id: `git-1-${Date.now()}`,
          type: 'output',
          text: 'On branch main\n' +
                'Your branch is up to date with \'origin/main\'.\n\n' +
                'Changes to be committed:\n' +
                '  (use "git restore --staged <file>..." to unstage)\n' +
                '    modified:   src-tauri/src/pty.rs\n' +
                '    modified:   website/components/InteractiveGridDemo.tsx\n\n' +
                'Untracked files:\n' +
                '  (use "git add <file>..." to include in what will be committed)\n' +
                '    docs/09_INTERACTIVE_GRID_SPEC.md',
          timestamp: time,
        },
      ];
    } else if (lower === 'git diff') {
      responseLogs = [
        {
          id: `diff-1-${Date.now()}`,
          type: 'info',
          bullet: '●',
          bulletColor: 'text-[#5683da]',
          text: 'diff --git a/src/components/layout/GridRenderer.tsx b/src/components/layout/GridRenderer.tsx',
          timestamp: time,
        },
        {
          id: `diff-2-${Date.now()}`,
          type: 'diff',
          diffLines: [
            { type: 'header', text: '@@ -42,6 +42,9 @@ export function GridRenderer() {' },
            { type: 'del', oldNo: 42, text: '-  const theme = "blurry-gradient";' },
            { type: 'add', newNo: 42, text: '+  const theme = "solid-high-contrast";' },
            { type: 'add', newNo: 43, text: '+  const webglContext = acquireWebglSlot(id);' },
            { type: 'context', oldNo: 43, newNo: 44, text: '   return <TerminalContainer id={id} />;' },
          ],
        },
      ];
    } else if (lower === 'ls' || lower === 'ls -la' || lower === 'dir') {
      responseLogs = [
        {
          id: `ls-1-${Date.now()}`,
          type: 'output',
          text: 'drwxr-xr-x  14 abuzar  staff   448B Aug 20 20:45 src/\n' +
                'drwxr-xr-x   8 abuzar  staff   256B Aug 20 20:42 src-tauri/\n' +
                'drwxr-xr-x  12 abuzar  staff   384B Aug 20 20:45 website/\n' +
                'drwxr-xr-x   6 abuzar  staff   192B Aug 20 20:40 docs/\n' +
                '-rw-r--r--   1 abuzar  staff   1.6K Aug 20 20:40 package.json\n' +
                '-rw-r--r--   1 abuzar  staff   3.2K Aug 20 20:40 Cargo.toml\n' +
                '-rw-r--r--   1 abuzar  staff   1.1K Aug 20 20:40 README.md',
          timestamp: time,
        },
      ];
    } else if (lower === 'status' || lower === 'top' || lower === 'ps') {
      responseLogs = [
        {
          id: `stat-1-${Date.now()}`,
          type: 'info',
          bullet: '●',
          bulletColor: 'text-[#5683da]',
          tag: 'SYSTEM_STATUS',
          tagColor: 'bg-[#5683da]/20 text-[#5683da] border-[#5683da]/40',
          text: 'VibeGrid Core Telemetry & Runtime Invariants:',
          timestamp: time,
        },
        {
          id: `stat-2-${Date.now()}`,
          type: 'output',
          text: '  • GPU Canvas Engine: WebGL 2.0 (Locked 60.0 FPS · 0 dropped frames)\n' +
                '  • PTY Master Ringbuffer: 0.8ms - 1.2ms IPC latency [optimal]\n' +
                '  • Memory Consumption: 142 MB Heap / 18.4 GB Apple Metal VRAM\n' +
                '  • Active Panes: 4 synchronized terminals (PID 4892, 5120, 6204, 8840)\n' +
                '  • Egress Policy: 100% Air-Gapped Local (0 outbound network telemetry)',
        },
      ];
    } else if (lower === 'split' || lower === 'split-v' || lower === 'split-h') {
      handleSplitPane(paneId);
      responseLogs = [
        {
          id: `sp-1-${Date.now()}`,
          type: 'success',
          bullet: '✔',
          bulletColor: 'text-[#27c93f]',
          text: 'Split pane requested. Workspace re-equalized.',
          timestamp: time,
        },
      ];
    } else if (lower === 'maximize') {
      handleToggleMaximize(paneId);
      responseLogs = [
        {
          id: `max-1-${Date.now()}`,
          type: 'info',
          bullet: '●',
          bulletColor: 'text-[#5683da]',
          text: `Toggled maximize state for ${paneId}.`,
          timestamp: time,
        },
      ];
    } else if (lower === 'reset') {
      handleResetGrid();
      responseLogs = [
        {
          id: `rst-1-${Date.now()}`,
          type: 'success',
          bullet: '✔',
          bulletColor: 'text-[#27c93f]',
          text: 'Grid layout reset to 2x2 Quad preset.',
          timestamp: time,
        },
      ];
    } else {
      responseLogs = [
        {
          id: `err-${Date.now()}`,
          type: 'error',
          bullet: '✖',
          bulletColor: 'text-[#ef4444]',
          text: `zsh: command not found: ${trimmed}. Type "help" for a list of valid commands.`,
          timestamp: time,
        },
      ];
    }

    setPanes((prev) =>
      prev.map((p) => {
        if (p.id === paneId) {
          const nextLogs = [...p.logs, userLog, ...responseLogs];
          return {
            ...p,
            logs: nextLogs,
            currentInput: '',
            history: [...p.history, trimmed],
            historyIndex: -1,
            status: 'ACTIVE',
          };
        }
        return p;
      })
    );

    setTimeout(() => scrollToBottom(paneId), 50);
  };

  // Keyboard navigation & typing handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, paneId: string) => {
    const pane = panes.find((p) => p.id === paneId);
    if (!pane) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(paneId, pane.currentInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (pane.history.length === 0) return;
      const nextIdx = pane.historyIndex === -1 ? pane.history.length - 1 : Math.max(0, pane.historyIndex - 1);
      setPanes((prev) =>
        prev.map((p) => (p.id === paneId ? { ...p, historyIndex: nextIdx, currentInput: p.history[nextIdx] || '' } : p))
      );
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (pane.historyIndex === -1) return;
      const nextIdx = pane.historyIndex + 1;
      if (nextIdx >= pane.history.length) {
        setPanes((prev) => prev.map((p) => (p.id === paneId ? { ...p, historyIndex: -1, currentInput: '' } : p)));
      } else {
        setPanes((prev) =>
          prev.map((p) => (p.id === paneId ? { ...p, historyIndex: nextIdx, currentInput: p.history[nextIdx] || '' } : p))
        );
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple autocompletion
      const cmds = ['help', 'claude "fix bug"', 'cargo test', 'npm run dev', 'git status', 'git diff', 'ls', 'status', 'clear'];
      const cur = pane.currentInput.trim();
      const match = cmds.find((c) => c.startsWith(cur));
      if (match) {
        setPanes((prev) => prev.map((p) => (p.id === paneId ? { ...p, currentInput: match } : p)));
      }
    }
  };

  // Split pane action
  const handleSplitPane = (paneId: string) => {
    setPanes((prev) => {
      // Find the first closed pane or activate swarm
      const closed = prev.find((p) => p.isClosed);
      if (closed) {
        return prev.map((p) => (p.id === closed.id ? { ...p, isClosed: false, status: 'ACTIVE' } : p));
      }
      return prev;
    });

    if (layoutMode === 'split') {
      setLayoutMode('quad');
    } else if (layoutMode === 'quad') {
      setLayoutMode('swarm');
    }
  };

  // Maximize / minimize toggle
  const handleToggleMaximize = (paneId: string) => {
    if (maximizedPaneId === paneId) {
      setMaximizedPaneId(null);
    } else {
      setMaximizedPaneId(paneId);
    }
  };

  // Close pane
  const handleClosePane = (paneId: string) => {
    if (maximizedPaneId === paneId) {
      setMaximizedPaneId(null);
    }
    setPanes((prev) => prev.map((p) => (p.id === paneId ? { ...p, isClosed: true } : p)));
  };

  // Clear single pane buffer
  const handleClearPane = (paneId: string) => {
    setPanes((prev) =>
      prev.map((p) =>
        p.id === paneId
          ? {
              ...p,
              logs: [
                {
                  id: `cleared-${Date.now()}`,
                  type: 'info',
                  bullet: '●',
                  bulletColor: 'text-[#5683da]',
                  text: 'Terminal scrollback cleared.',
                  timestamp: new Date().toTimeString().split(' ')[0],
                },
              ],
            }
          : p
      )
    );
  };

  // Reset entire grid
  const handleResetGrid = () => {
    setLayoutMode('quad');
    setMaximizedPaneId(null);
    setFocusedPaneId('pane_01');
    setPanes(INITIAL_PANES);
  };

  // Save pane title
  const handleSaveTitle = (paneId: string) => {
    if (tempTitle.trim()) {
      setPanes((prev) => prev.map((p) => (p.id === paneId ? { ...p, title: tempTitle.trim() } : p)));
    }
    setEditingTitlePaneId(null);
  };

  // Quick run chip click
  const handleQuickRun = (cmd: string) => {
    const targetPaneId = maximizedPaneId || focusedPaneId || 'pane_01';
    executeCommand(targetPaneId, cmd);
    inputRefs.current[targetPaneId]?.focus();
  };

  // Determine which panes are visible based on layoutMode and maximizedPaneId
  const visiblePanes = getVisiblePanes(layoutMode, panes, maximizedPaneId);

  return (
    <div id="interactive-grid-demo" className="relative mx-auto max-w-[1180px] px-3 sm:px-6 select-none font-sans">
      {/* Outer Window Chrome (Solid Crisp Dark Frame: #111111 Charcoal, #4a4b50 1px Border) */}
      <div className="relative overflow-hidden rounded-[12px] border border-[#4a4b50] bg-[#111111] shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
        
        {/* ========================================================================= */}
        {/* TOP WINDOW TITLEBAR & CONTROL DECK                                        */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#4a4b50] bg-[#090a0c] px-4 py-3 select-none">
          {/* Left: macOS Traffic Lights & Project Identity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56] inline-block border border-black/40" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e] inline-block border border-black/40" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f] inline-block border border-black/40" />
            </div>
            <div className="ml-1.5 font-mono text-xs text-[#a9a9aa] font-medium flex items-center gap-1.5">
              <span className="text-[#5683da] font-bold">vibegrid</span>
              <span className="text-[#4a4b50]">/</span>
              <span className="text-white font-semibold">interactive-grid-demo</span>
              <span className="text-[#6b6c6d] hidden sm:inline">(live-pty)</span>
            </div>
          </div>

          {/* Middle: 4 Layout Mode Switches (2x2 Quad, Hero 1+3, 1x2 Split, 3x3 Swarm) */}
          <div className="flex items-center gap-1 rounded-[8px] bg-[#111111] p-1 border border-[#4a4b50]/60">
            <button
              onClick={() => {
                setLayoutMode('quad');
                setMaximizedPaneId(null);
              }}
              className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                layoutMode === 'quad' && !maximizedPaneId
                  ? 'bg-[#5683da] text-white font-bold shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236]'
              }`}
              title="2x2 Quad Grid (4 equal panes)"
            >
              <div className="grid grid-cols-2 gap-0.5 w-2.5 h-2.5">
                <div className="bg-current rounded-[0.5px]" />
                <div className="bg-current rounded-[0.5px]" />
                <div className="bg-current rounded-[0.5px]" />
                <div className="bg-current rounded-[0.5px]" />
              </div>
              <span>2x2 Quad</span>
            </button>

            <button
              onClick={() => {
                setLayoutMode('hero');
                setMaximizedPaneId(null);
              }}
              className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                layoutMode === 'hero' && !maximizedPaneId
                  ? 'bg-[#5683da] text-white font-bold shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236]'
              }`}
              title="Hero 1+3 (1 large left pane, 2-3 auxiliary right panes)"
            >
              <div className="flex gap-0.5 w-2.5 h-2.5">
                <div className="bg-current w-1.5 h-full rounded-[0.5px]" />
                <div className="flex flex-col gap-0.5 flex-1">
                  <div className="bg-current h-1 rounded-[0.5px]" />
                  <div className="bg-current h-1 rounded-[0.5px]" />
                </div>
              </div>
              <span>Hero 1+3</span>
            </button>

            <button
              onClick={() => {
                setLayoutMode('split');
                setMaximizedPaneId(null);
              }}
              className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                layoutMode === 'split' && !maximizedPaneId
                  ? 'bg-[#5683da] text-white font-bold shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236]'
              }`}
              title="1x2 Split (2 vertical panes)"
            >
              <div className="flex gap-0.5 w-2.5 h-2.5">
                <div className="bg-current w-1 h-full rounded-[0.5px]" />
                <div className="bg-current w-1 h-full rounded-[0.5px]" />
              </div>
              <span>1x2 Split</span>
            </button>

            <button
              onClick={() => {
                setLayoutMode('swarm');
                setMaximizedPaneId(null);
              }}
              className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                layoutMode === 'swarm' && !maximizedPaneId
                  ? 'bg-[#5683da] text-white font-bold shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236]'
              }`}
              title="3x3 Swarm (6 panes matrix)"
            >
              <div className="grid grid-cols-3 gap-0.5 w-3 h-2.5">
                <div className="bg-current rounded-[0.5px]" />
                <div className="bg-current rounded-[0.5px]" />
                <div className="bg-current rounded-[0.5px]" />
                <div className="bg-current rounded-[0.5px]" />
                <div className="bg-current rounded-[0.5px]" />
                <div className="bg-current rounded-[0.5px]" />
              </div>
              <span>3x3 Swarm</span>
            </button>
          </div>

          {/* Right: Simulation Controls & Telemetry Badges */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                isStreaming
                  ? 'bg-[#090a0c] text-[#5683da] border-[#5683da]/50 hover:bg-[#1a1b1e]'
                  : 'bg-[#303236] text-amber-300 border-amber-500/50'
              }`}
              title="Toggle autonomous background log stream simulation"
            >
              {isStreaming ? (
                <>
                  <Pause size={10} className="text-[#5683da]" />
                  <span>SIM STREAMING</span>
                </>
              ) : (
                <>
                  <Play size={10} className="text-amber-400" />
                  <span>PAUSED</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetGrid}
              className="p-1 text-[#a9a9aa] hover:text-white hover:bg-[#303236] rounded-[6px] transition-colors cursor-pointer"
              title="Reset Layout & Terminals"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* Quick Command Launcher Bar (Allows clicking to test interactive execution) */}
        <div className="flex items-center justify-between border-b border-[#4a4b50] bg-[#111111] px-4 py-2 text-xs font-mono overflow-x-auto gap-2">
          <div className="flex items-center gap-2 shrink-0 text-[#a9a9aa]">
            <Sparkles size={13} className="text-[#ff8964]" />
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#d1d1d1]">Quick Run:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => handleQuickRun('claude "fix bug"')}
              className="px-2.5 py-0.5 rounded-[5px] bg-[#090a0c] border border-[#4a4b50]/60 text-[#5683da] hover:text-white hover:border-[#5683da] text-[11px] font-mono transition-colors whitespace-nowrap cursor-pointer"
            >
              $ claude "fix bug"
            </button>
            <button
              onClick={() => handleQuickRun('cargo test')}
              className="px-2.5 py-0.5 rounded-[5px] bg-[#090a0c] border border-[#4a4b50]/60 text-[#ff8964] hover:text-white hover:border-[#ff8964] text-[11px] font-mono transition-colors whitespace-nowrap cursor-pointer"
            >
              $ cargo test
            </button>
            <button
              onClick={() => handleQuickRun('npm run dev')}
              className="px-2.5 py-0.5 rounded-[5px] bg-[#090a0c] border border-[#4a4b50]/60 text-[#27c93f] hover:text-white hover:border-[#27c93f] text-[11px] font-mono transition-colors whitespace-nowrap cursor-pointer"
            >
              $ npm run dev
            </button>
            <button
              onClick={() => handleQuickRun('git diff')}
              className="px-2.5 py-0.5 rounded-[5px] bg-[#090a0c] border border-[#4a4b50]/60 text-[#e5e5e7] hover:text-white hover:border-white text-[11px] font-mono transition-colors whitespace-nowrap cursor-pointer"
            >
              $ git diff
            </button>
            <button
              onClick={() => handleQuickRun('status')}
              className="px-2.5 py-0.5 rounded-[5px] bg-[#090a0c] border border-[#4a4b50]/60 text-[#a9a9aa] hover:text-white hover:border-white text-[11px] font-mono transition-colors whitespace-nowrap cursor-pointer"
            >
              $ status
            </button>
            <button
              onClick={() => handleQuickRun('help')}
              className="px-2.5 py-0.5 rounded-[5px] bg-[#090a0c] border border-[#4a4b50]/60 text-[#ffbd2e] hover:text-white hover:border-amber-400 text-[11px] font-mono transition-colors whitespace-nowrap cursor-pointer"
            >
              $ help
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MULTI-PANE GRID RENDERER CONTAINER                                       */}
        {/* ========================================================================= */}
        <div className="relative bg-[#090a0c] min-h-[580px] max-h-[660px] overflow-hidden">
          {maximizedPaneId ? (
            /* Single Maximized Pane Mode */
            <div className="h-[600px] w-full p-2">
              {panes.find((p) => p.id === maximizedPaneId) && (
                <TerminalPaneItem
                  pane={panes.find((p) => p.id === maximizedPaneId)!}
                  isFocused={focusedPaneId === maximizedPaneId}
                  isMaximized={true}
                  onFocus={() => setFocusedPaneId(maximizedPaneId)}
                  onToggleMaximize={() => setMaximizedPaneId(null)}
                  onClose={() => handleClosePane(maximizedPaneId)}
                  onClear={() => handleClearPane(maximizedPaneId)}
                  onSplit={() => handleSplitPane(maximizedPaneId)}
                  onInputChange={(val) =>
                    setPanes((prev) => prev.map((p) => (p.id === maximizedPaneId ? { ...p, currentInput: val } : p)))
                  }
                  onKeyDown={(e) => handleKeyDown(e, maximizedPaneId)}
                  terminalBottomRef={(el) => (terminalBottomRefs.current[maximizedPaneId] = el)}
                  inputRef={(el) => (inputRefs.current[maximizedPaneId] = el)}
                  isEditingTitle={editingTitlePaneId === maximizedPaneId}
                  tempTitle={tempTitle}
                  onStartEditTitle={() => {
                    setEditingTitlePaneId(maximizedPaneId);
                    setTempTitle(panes.find((p) => p.id === maximizedPaneId)?.title || '');
                  }}
                  onSaveTitle={() => handleSaveTitle(maximizedPaneId)}
                  onTempTitleChange={setTempTitle}
                />
              )}
            </div>
          ) : layoutMode === 'quad' ? (
            /* 2x2 Quad Grid (4 equal panes) */
            <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-2 h-[600px] gap-[1px] bg-[#4a4b50]/60 p-[1px]">
              {visiblePanes.slice(0, 4).map((pane) => (
                <div key={pane.id} className="h-full w-full min-h-0 min-w-0 bg-[#090a0c]">
                  <TerminalPaneItem
                    pane={pane}
                    isFocused={focusedPaneId === pane.id}
                    isMaximized={false}
                    onFocus={() => setFocusedPaneId(pane.id)}
                    onToggleMaximize={() => handleToggleMaximize(pane.id)}
                    onClose={() => handleClosePane(pane.id)}
                    onClear={() => handleClearPane(pane.id)}
                    onSplit={() => handleSplitPane(pane.id)}
                    onInputChange={(val) =>
                      setPanes((prev) => prev.map((p) => (p.id === pane.id ? { ...p, currentInput: val } : p)))
                    }
                    onKeyDown={(e) => handleKeyDown(e, pane.id)}
                    terminalBottomRef={(el) => (terminalBottomRefs.current[pane.id] = el)}
                    inputRef={(el) => (inputRefs.current[pane.id] = el)}
                    isEditingTitle={editingTitlePaneId === pane.id}
                    tempTitle={tempTitle}
                    onStartEditTitle={() => {
                      setEditingTitlePaneId(pane.id);
                      setTempTitle(pane.title);
                    }}
                    onSaveTitle={() => handleSaveTitle(pane.id)}
                    onTempTitleChange={setTempTitle}
                  />
                </div>
              ))}
            </div>
          ) : layoutMode === 'hero' ? (
            /* Hero 1+3 Grid: 1 Large Hero Pane on left (col-span-7), 2 stacked auxiliary panes on right (col-span-5) */
            <div className="grid grid-cols-1 md:grid-cols-12 h-[600px] gap-[1px] bg-[#4a4b50]/60 p-[1px]">
              {/* Left Hero Pane (Claude Code or focused) */}
              <div className="md:col-span-7 h-full w-full min-h-0 min-w-0 bg-[#090a0c]">
                {visiblePanes[0] && (
                  <TerminalPaneItem
                    pane={visiblePanes[0]}
                    isFocused={focusedPaneId === visiblePanes[0].id}
                    isMaximized={false}
                    onFocus={() => setFocusedPaneId(visiblePanes[0].id)}
                    onToggleMaximize={() => handleToggleMaximize(visiblePanes[0].id)}
                    onClose={() => handleClosePane(visiblePanes[0].id)}
                    onClear={() => handleClearPane(visiblePanes[0].id)}
                    onSplit={() => handleSplitPane(visiblePanes[0].id)}
                    onInputChange={(val) =>
                      setPanes((prev) => prev.map((p) => (p.id === visiblePanes[0].id ? { ...p, currentInput: val } : p)))
                    }
                    onKeyDown={(e) => handleKeyDown(e, visiblePanes[0].id)}
                    terminalBottomRef={(el) => (terminalBottomRefs.current[visiblePanes[0].id] = el)}
                    inputRef={(el) => (inputRefs.current[visiblePanes[0].id] = el)}
                    isEditingTitle={editingTitlePaneId === visiblePanes[0].id}
                    tempTitle={tempTitle}
                    onStartEditTitle={() => {
                      setEditingTitlePaneId(visiblePanes[0].id);
                      setTempTitle(visiblePanes[0].title);
                    }}
                    onSaveTitle={() => handleSaveTitle(visiblePanes[0].id)}
                    onTempTitleChange={setTempTitle}
                  />
                )}
              </div>

              {/* Right Stacked Auxiliary Panes */}
              <div className="md:col-span-5 grid grid-rows-2 h-full w-full min-h-0 min-w-0 gap-[1px] bg-[#4a4b50]/60">
                {visiblePanes.slice(1, 3).map((pane) => (
                  <div key={pane.id} className="h-full w-full min-h-0 min-w-0 bg-[#090a0c]">
                    <TerminalPaneItem
                      pane={pane}
                      isFocused={focusedPaneId === pane.id}
                      isMaximized={false}
                      onFocus={() => setFocusedPaneId(pane.id)}
                      onToggleMaximize={() => handleToggleMaximize(pane.id)}
                      onClose={() => handleClosePane(pane.id)}
                      onClear={() => handleClearPane(pane.id)}
                      onSplit={() => handleSplitPane(pane.id)}
                      onInputChange={(val) =>
                        setPanes((prev) => prev.map((p) => (p.id === pane.id ? { ...p, currentInput: val } : p)))
                      }
                      onKeyDown={(e) => handleKeyDown(e, pane.id)}
                      terminalBottomRef={(el) => (terminalBottomRefs.current[pane.id] = el)}
                      inputRef={(el) => (inputRefs.current[pane.id] = el)}
                      isEditingTitle={editingTitlePaneId === pane.id}
                      tempTitle={tempTitle}
                      onStartEditTitle={() => {
                        setEditingTitlePaneId(pane.id);
                        setTempTitle(pane.title);
                      }}
                      onSaveTitle={() => handleSaveTitle(pane.id)}
                      onTempTitleChange={setTempTitle}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : layoutMode === 'split' ? (
            /* 1x2 Split Grid: 2 Vertical Side-by-Side Panes */
            <div className="grid grid-cols-1 md:grid-cols-2 h-[600px] gap-[1px] bg-[#4a4b50]/60 p-[1px]">
              {visiblePanes.slice(0, 2).map((pane) => (
                <div key={pane.id} className="h-full w-full min-h-0 min-w-0 bg-[#090a0c]">
                  <TerminalPaneItem
                    pane={pane}
                    isFocused={focusedPaneId === pane.id}
                    isMaximized={false}
                    onFocus={() => setFocusedPaneId(pane.id)}
                    onToggleMaximize={() => handleToggleMaximize(pane.id)}
                    onClose={() => handleClosePane(pane.id)}
                    onClear={() => handleClearPane(pane.id)}
                    onSplit={() => handleSplitPane(pane.id)}
                    onInputChange={(val) =>
                      setPanes((prev) => prev.map((p) => (p.id === pane.id ? { ...p, currentInput: val } : p)))
                    }
                    onKeyDown={(e) => handleKeyDown(e, pane.id)}
                    terminalBottomRef={(el) => (terminalBottomRefs.current[pane.id] = el)}
                    inputRef={(el) => (inputRefs.current[pane.id] = el)}
                    isEditingTitle={editingTitlePaneId === pane.id}
                    tempTitle={tempTitle}
                    onStartEditTitle={() => {
                      setEditingTitlePaneId(pane.id);
                      setTempTitle(pane.title);
                    }}
                    onSaveTitle={() => handleSaveTitle(pane.id)}
                    onTempTitleChange={setTempTitle}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* 3x3 Swarm Grid: 6 Panes Matrix (3 cols x 2 rows) */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 grid-rows-2 h-[600px] gap-[1px] bg-[#4a4b50]/60 p-[1px]">
              {visiblePanes.slice(0, 6).map((pane) => (
                <div key={pane.id} className="h-full w-full min-h-0 min-w-0 bg-[#090a0c]">
                  <TerminalPaneItem
                    pane={pane}
                    isFocused={focusedPaneId === pane.id}
                    isMaximized={false}
                    onFocus={() => setFocusedPaneId(pane.id)}
                    onToggleMaximize={() => handleToggleMaximize(pane.id)}
                    onClose={() => handleClosePane(pane.id)}
                    onClear={() => handleClearPane(pane.id)}
                    onSplit={() => handleSplitPane(pane.id)}
                    onInputChange={(val) =>
                      setPanes((prev) => prev.map((p) => (p.id === pane.id ? { ...p, currentInput: val } : p)))
                    }
                    onKeyDown={(e) => handleKeyDown(e, pane.id)}
                    terminalBottomRef={(el) => (terminalBottomRefs.current[pane.id] = el)}
                    inputRef={(el) => (inputRefs.current[pane.id] = el)}
                    isEditingTitle={editingTitlePaneId === pane.id}
                    tempTitle={tempTitle}
                    onStartEditTitle={() => {
                      setEditingTitlePaneId(pane.id);
                      setTempTitle(pane.title);
                    }}
                    onSaveTitle={() => handleSaveTitle(pane.id)}
                    onTempTitleChange={setTempTitle}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM STATUS BAR FOOTER                                                  */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between border-t border-[#4a4b50] bg-[#0e0e10] px-4 py-2 text-[11px] font-mono text-[#a9a9aa] select-none">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#27c93f]" />
              WebGL 2.0: 60.0 FPS
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5683da]" />
              PTY Latency: 1.1ms
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff8964]" />
              Zero Egress: 100% Air-Gapped
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[#6b6c6d]">
            <span>Type real commands</span>
            <span>•</span>
            <span>Click any pane to focus</span>
            <span>•</span>
            <span>Tab autocomplete</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to get active visible panes
function getVisiblePanes(mode: LayoutMode, panes: PaneConfig[], maximizedId: string | null): PaneConfig[] {
  if (maximizedId) {
    return panes.filter((p) => p.id === maximizedId);
  }
  const openPanes = panes.filter((p) => !p.isClosed);
  if (openPanes.length === 0) return [panes[0]];

  switch (mode) {
    case 'split':
      return openPanes.slice(0, 2);
    case 'hero':
      return openPanes.slice(0, 3);
    case 'quad':
      return openPanes.slice(0, 4);
    case 'swarm':
      return openPanes.slice(0, 6);
    default:
      return openPanes;
  }
}

// ============================================================================
// SINGLE TERMINAL PANE ITEM COMPONENT
// ============================================================================

interface TerminalPaneItemProps {
  pane: PaneConfig;
  isFocused: boolean;
  isMaximized: boolean;
  onFocus: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
  onClear: () => void;
  onSplit: () => void;
  onInputChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  terminalBottomRef: (el: HTMLDivElement | null) => void;
  inputRef: (el: HTMLInputElement | null) => void;
  isEditingTitle: boolean;
  tempTitle: string;
  onStartEditTitle: () => void;
  onSaveTitle: () => void;
  onTempTitleChange: (val: string) => void;
}

function TerminalPaneItem({
  pane,
  isFocused,
  isMaximized,
  onFocus,
  onToggleMaximize,
  onClose,
  onClear,
  onSplit,
  onInputChange,
  onKeyDown,
  terminalBottomRef,
  inputRef,
  isEditingTitle,
  tempTitle,
  onStartEditTitle,
  onSaveTitle,
  onTempTitleChange,
}: TerminalPaneItemProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleClickBody = () => {
    onFocus();
    // Focus the interactive input line
    const el = document.getElementById(`input-${pane.id}`);
    if (el) (el as HTMLInputElement).focus();
  };

  return (
    <div
      onClick={onFocus}
      className={`h-full w-full flex flex-col overflow-hidden bg-[#000000] transition-all duration-150 relative ${
        isFocused
          ? 'ring-1 ring-inset ring-[#5683da] bg-[#000000]'
          : 'hover:bg-[#050507]'
      }`}
    >
      {/* --------------------------------------------------------------------- */}
      {/* REALISTIC PANE TITLE BAR (Faithful to Desktop TerminalToolbar.tsx)    */}
      {/* --------------------------------------------------------------------- */}
      <div
        onDoubleClick={onToggleMaximize}
        className={`h-7 sm:h-8 w-full px-2.5 sm:px-3 flex items-center justify-between select-none cursor-pointer border-b font-sans transition-colors shrink-0 ${
          isFocused
            ? 'text-white bg-[#111111] border-[#5683da]/40'
            : 'text-white/70 bg-[#090a0c] border-[#4a4b50]/60 hover:bg-[#111111]/70'
        }`}
      >
        {/* Left: Badge, Icon, Title, CWD, Status Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* Pure White / Solid Badge Number */}
          <span
            className={`flex h-4 min-w-4 shrink-0 items-center justify-center rounded-[4px] px-1 text-[10px] font-bold shadow-sm transition-colors ${
              isFocused ? 'text-black bg-white' : 'text-white/70 bg-white/10'
            }`}
            title={`Pane ${pane.index}`}
          >
            {pane.index}
          </span>

          <Terminal className="w-3.5 h-3.5 text-white/60 shrink-0" />

          {/* Editable Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => onTempTitleChange(e.target.value)}
              onBlur={onSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveTitle();
                if (e.key === 'Escape') onSaveTitle();
              }}
              autoFocus
              className="font-mono text-xs font-semibold text-white bg-black border border-white/40 rounded px-1 outline-none w-32"
            />
          ) : (
            <div
              className="flex items-center gap-1 group cursor-text truncate"
              onClick={(e) => {
                e.stopPropagation();
                onStartEditTitle();
              }}
              title="Click to rename pane"
            >
              <span className="font-mono text-xs font-semibold text-white truncate tracking-wide">
                {pane.title}
              </span>
              <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 shrink-0" />
            </div>
          )}

          {/* CWD pill */}
          <span
            className="hidden sm:inline-block font-mono text-[10px] text-[#a9a9aa] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 truncate max-w-[120px]"
            title={pane.cwd}
          >
            {pane.cwd}
          </span>

          {/* Status Pill (ACTIVE, STREAMING, IDLE) */}
          <span
            className={`hidden xs:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
              pane.status === 'STREAMING'
                ? 'bg-[#5683da]/20 text-[#5683da] border border-[#5683da]/40'
                : pane.status === 'ACTIVE'
                ? 'bg-[#27c93f]/20 text-[#27c93f] border border-[#27c93f]/40'
                : 'bg-white/5 text-[#a9a9aa] border border-white/10'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                pane.status === 'STREAMING'
                  ? 'bg-[#5683da] animate-pulse'
                  : pane.status === 'ACTIVE'
                  ? 'bg-[#27c93f]'
                  : 'bg-[#6b6c6d]'
              }`}
            />
            <span>{pane.status}</span>
          </span>
        </div>

        {/* Right Action Controls: Split, Maximize, Clear, Close */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSplit();
            }}
            title="Split Pane"
            className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/15 hover:text-white text-white/60 transition-colors cursor-pointer"
          >
            <Columns className="w-3 h-3" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMaximize();
            }}
            title={isMaximized ? 'Restore Grid' : 'Maximize Pane'}
            className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/15 hover:text-white text-white/60 transition-colors cursor-pointer"
          >
            {isMaximized ? <Minimize2 className="w-3 h-3 text-[#5683da]" /> : <Maximize2 className="w-3 h-3" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            title="Clear Scrollback"
            className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/15 hover:text-white text-white/60 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close Pane"
            className="p-1 rounded bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-400 text-white/60 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* INTERACTIVE TERMINAL BODY                                             */}
      {/* --------------------------------------------------------------------- */}
      <div
        onClick={handleClickBody}
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-auto p-3 font-mono text-[11px] sm:text-[12px] leading-relaxed text-[#e5e5e7] bg-[#000000] cursor-text select-text scrollbar-thin"
      >
        {/* Render History Logs */}
        <div className="space-y-1.5">
          {pane.logs.map((log) => (
            <TerminalLogEntry key={log.id} log={log} />
          ))}
        </div>

        {/* Live Interactive Typing Prompt Line */}
        <div className="mt-2 flex items-center gap-1.5 text-[#e5e5e7]">
          <span className="text-[#5683da] font-bold select-none shrink-0">$</span>
          <div className="relative flex-1 flex items-center">
            <input
              id={`input-${pane.id}`}
              ref={inputRef}
              type="text"
              value={pane.currentInput}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={isFocused ? 'type command e.g. claude "fix bug", cargo test, npm run dev, help...' : ''}
              className="w-full bg-transparent text-white font-mono text-[11px] sm:text-[12px] outline-none placeholder:text-[#4a4b50] border-none p-0 focus:ring-0"
              autoComplete="off"
              spellCheck="false"
            />
            {/* Blinking block terminal cursor */}
            <span className="animate-terminal-cursor text-white font-bold inline-block ml-0.5 select-none pointer-events-none">
              ▌
            </span>
          </div>
        </div>

        {/* Bottom scroll anchor */}
        <div ref={terminalBottomRef} className="h-1" />
      </div>
    </div>
  );
}

// Single log entry renderer with ANSI-like colors and diff support
function TerminalLogEntry({ log }: { log: TerminalLog }) {
  if (log.type === 'input') {
    return (
      <div className="text-white flex items-center gap-1.5 font-bold">
        <span className="text-[#5683da]">$</span>
        <span>{log.text}</span>
      </div>
    );
  }

  if (log.type === 'diff' && log.diffLines) {
    return (
      <div className="my-1.5 rounded-[4px] bg-[#090a0c] border border-[#4a4b50]/60 p-2 font-mono text-[10px] sm:text-[11px] overflow-x-auto">
        {log.diffLines.map((line, idx) => {
          let color = 'text-[#a9a9aa]';
          let bg = 'bg-transparent';
          if (line.type === 'header') {
            color = 'text-[#5683da] font-bold';
            bg = 'bg-[#5683da]/10';
          } else if (line.type === 'add') {
            color = 'text-[#86efac] font-semibold';
            bg = 'bg-[#0d2818]';
          } else if (line.type === 'del') {
            color = 'text-[#fca5a5] font-semibold';
            bg = 'bg-[#2a0f14]';
          }
          return (
            <div key={idx} className={`px-1.5 py-0.5 whitespace-pre rounded-[2px] ${color} ${bg}`}>
              {line.text}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 text-[#a9a9aa] leading-relaxed">
      {log.bullet && (
        <span className={`${log.bulletColor || 'text-[#5683da]'} font-bold shrink-0 mt-0.5`}>
          {log.bullet}
        </span>
      )}
      {log.tag && (
        <span className={`px-1 py-0.2 rounded text-[9px] font-mono uppercase font-bold shrink-0 border ${log.tagColor}`}>
          {log.tag}
        </span>
      )}
      <div className="flex-1 whitespace-pre-wrap break-words">
        {log.text}
      </div>
      {log.timestamp && (
        <span className="text-[9px] text-[#4a4b50] shrink-0 font-mono hidden sm:inline select-none">
          {log.timestamp}
        </span>
      )}
    </div>
  );
}
