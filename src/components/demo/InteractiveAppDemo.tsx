import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Terminal as TerminalIcon,
  Columns,
  Rows,
  Maximize2,
  Minimize2,
  X,
  Plus,
  Bot,
  Palette,
  GitCommit,
  Search,
  Mic,
  Layers,
  Check,
  ChevronDown,
  Sparkles,
  Loader2,
} from 'lucide-react';

/* ==========================================================================
   Types & Theme Definitions
   ========================================================================== */

export type ThemePresetKey = 'vibedark' | 'catppuccin' | 'nord' | 'tokyo';

export interface ThemeConfig {
  id: ThemePresetKey;
  name: string;
  label: string;
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  accent: string;
  ink: string;
  inkMuted: string;
  paneBg: string;
  headerBg: string;
  activeBorder: string;
  badgeBg: string;
  badgeFg: string;
}

export const DEMO_THEMES: Record<ThemePresetKey, ThemeConfig> = {
  vibedark: {
    id: 'vibedark',
    name: 'VibeDark',
    label: 'VibeDark (High Contrast)',
    bg: '#090a0c',
    surface: '#111111',
    surfaceHover: '#1a1a1a',
    border: '#4a4b50',
    accent: '#ffffff',
    ink: '#f3f4f6',
    inkMuted: '#8b93a1',
    paneBg: '#050507',
    headerBg: '#121316',
    activeBorder: '#ffffff',
    badgeBg: '#ffffff',
    badgeFg: '#000000',
  },
  catppuccin: {
    id: 'catppuccin',
    name: 'Catppuccin',
    label: 'Catppuccin Mocha',
    bg: '#1e1e2e',
    surface: '#181825',
    surfaceHover: '#242438',
    border: '#45475a',
    accent: '#cba6f7',
    ink: '#cdd6f4',
    inkMuted: '#a6adc8',
    paneBg: '#11111b',
    headerBg: '#1e1e2e',
    activeBorder: '#cba6f7',
    badgeBg: '#cba6f7',
    badgeFg: '#11111b',
  },
  nord: {
    id: 'nord',
    name: 'Nord',
    label: 'Nordic Frost',
    bg: '#2e3440',
    surface: '#3b4252',
    surfaceHover: '#434c5e',
    border: '#4c566a',
    accent: '#88c0d0',
    ink: '#eceff4',
    inkMuted: '#d8dee9',
    paneBg: '#242933',
    headerBg: '#2e3440',
    activeBorder: '#88c0d0',
    badgeBg: '#88c0d0',
    badgeFg: '#2e3440',
  },
  tokyo: {
    id: 'tokyo',
    name: 'Tokyo Night',
    label: 'Tokyo Night',
    bg: '#1a1b26',
    surface: '#24283b',
    surfaceHover: '#2f354f',
    border: '#414868',
    accent: '#7aa2f7',
    ink: '#c0caf5',
    inkMuted: '#7982a9',
    paneBg: '#16161e',
    headerBg: '#1f2335',
    activeBorder: '#7aa2f7',
    badgeBg: '#7aa2f7',
    badgeFg: '#16161e',
  },
};

export type LayoutPresetKey =
  | '4-quad'
  | 'hero-1-3'
  | '3-t-top'
  | '3-columns'
  | '2-horizontal'
  | '2-vertical'
  | '1-solo'
  | '6-matrix';

export interface LayoutPresetOption {
  id: LayoutPresetKey;
  label: string;
  tag: string;
  paneCount: number;
  description: string;
}

export const DEMO_LAYOUTS: LayoutPresetOption[] = [
  {
    id: '4-quad',
    label: 'Layouts: 2x2 Quad',
    tag: '2×2 Quad',
    paneCount: 4,
    description: 'Symmetric four-quadrant workstation for multi-agent fleets',
  },
  {
    id: 'hero-1-3',
    label: 'Layouts: Hero 1+3',
    tag: 'Hero 1+3',
    paneCount: 4,
    description: 'Lead orchestrator pane flanked by a 3-agent satellite stack',
  },
  {
    id: '3-t-top',
    label: 'Layouts: 3-Pane T-Top',
    tag: '3-Pane T-Top',
    paneCount: 3,
    description: 'Master supervisor terminal on top with dual worker columns below',
  },
  {
    id: '3-columns',
    label: 'Layouts: 3-Columns',
    tag: '3-Columns',
    paneCount: 3,
    description: 'Three parallel vertical streams for tri-stream auditing and diffs',
  },
  {
    id: '2-horizontal',
    label: 'Layouts: 2-Pane Side-by-Side',
    tag: '2-Pane (2H)',
    paneCount: 2,
    description: 'Classic side-by-side split for coding & test running',
  },
  {
    id: '2-vertical',
    label: 'Layouts: 2-Pane Stacked',
    tag: '2-Pane (2V)',
    paneCount: 2,
    description: 'Top/bottom horizontal split for long log streams and build tails',
  },
  {
    id: '1-solo',
    label: 'Layouts: 1-Pane Solo Focus',
    tag: '1-Pane Solo',
    paneCount: 1,
    description: 'Full-bleed distraction-free GPU terminal for deep focus',
  },
  {
    id: '6-matrix',
    label: 'Layouts: 6-Matrix 2x3',
    tag: '6-Matrix 2×3',
    paneCount: 6,
    description: 'High-density 6-pane cluster for autonomous swarm orchestration',
  },
];

export interface AgentTemplate {
  id: string;
  name: string;
  role: string;
  model: string;
  latency: string;
  accentColor: string;
  badge: string;
  description: string;
  defaultCommand: string;
  initialLogs: string[];
}

export const DEMO_AGENTS: AgentTemplate[] = [
  {
    id: 'codex-eng',
    name: 'Codex Fullstack Engineer',
    role: 'Autonomous Coder & Refactoring',
    model: 'gpt-4o-copilot',
    latency: '12ms',
    accentColor: '#38bdf8',
    badge: 'ENGINEER',
    description: 'Generates TypeScript AST migrations, solves compiler lints, writes unit tests.',
    defaultCommand: 'codex-agent run --task="optimize-gpu-render-loop"',
    initialLogs: [
      '⚡ [Codex] Initializing memory sandbox: ~/projects/vibegrid-core',
      '📦 [Codex] Scanning 144 files across workspace…',
      '🔍 [Codex] Analyzing AST in src/terminal/renderPipeline.ts',
      '✨ [Codex] Applying SIMD 128-bit memory alignment patch…',
      '✔ [Codex] 0 errors, 42 tests passing (1.8s)',
    ],
  },
  {
    id: 'claude-arch',
    name: 'Claude 3.7 System Architect',
    role: 'Orchestrator & Architecture Reviewer',
    model: 'claude-3-7-sonnet',
    latency: '18ms',
    accentColor: '#fb923c',
    badge: 'ARCHITECT',
    description: 'Supervises multi-agent communication, plans distributed systems and state boundaries.',
    defaultCommand: 'claude-agent supervise --fleet=swarm-alpha',
    initialLogs: [
      '🧠 [Claude Architect] Topology: 4 active worker nodes synchronized via IPC',
      '📡 [Claude Architect] Verifying zero-copy Tokio ring buffer latency…',
      '🛡 [Claude Architect] Memory safety audit: OK (0 buffer overflows)',
      '🚀 [Claude Architect] Deploying sub-agent task: Rust Kernel Tokio Bridge',
    ],
  },
  {
    id: 'gemini-opt',
    name: 'Gemini 2.0 GPU Optimizer',
    role: 'WASM & WebGL Performance Tuner',
    model: 'gemini-2.0-flash',
    latency: '8ms',
    accentColor: '#a855f7',
    badge: 'OPTIMIZER',
    description: 'Tunes WebGL2 shader pipelines, batching intervals, and font atlas caching.',
    defaultCommand: 'gemini-opt --profile=webgl2-atlas --target=60fps',
    initialLogs: [
      '🚀 [Gemini Optimizer] Hooked into WebGL 2.0 canvas context',
      '📊 [Gemini Optimizer] VSync frame rate locked at 60.0 FPS (16.6ms frame budget)',
      '⚡ [Gemini Optimizer] Font glyph cache hit rate: 99.4%',
      '🟢 [Gemini Optimizer] Zero dropped frames across 12,000 PTY stream bursts',
    ],
  },
  {
    id: 'rust-kernel',
    name: 'Tokio PTY Kernel Specialist',
    role: 'Low-Level Tokio Daemon',
    model: 'rust-native-v1',
    latency: '1.4ms',
    accentColor: '#f43f5e',
    badge: 'KERNEL',
    description: 'Manages POSIX pseudo-terminals, byte-stream batching, and sub-process signal traps.',
    defaultCommand: 'cargo watch -x "test --package vibegrid-pty"',
    initialLogs: [
      '🦀 [Rust Kernel] Spawning PTY slave via openpty(3)',
      '⚡ [Rust Kernel] Tokio AsyncFd registered with kqueue / epoll',
      '📥 [Rust Kernel] IPC throughput: 480 MB/s (zero-copy stdio pipe)',
      '⏱ [Rust Kernel] Round-trip latency: 1.4ms',
    ],
  },
  {
    id: 'security-audit',
    name: 'Zero-Day Security Sentinel',
    role: 'Vulnerability & Secret Scanner',
    model: 'sentinel-deep-audit',
    latency: '14ms',
    accentColor: '#10b981',
    badge: 'SECURITY',
    description: 'Scans live terminal streams for leaked API keys, tokens, and buffer bounds.',
    defaultCommand: 'sentinel-audit --realtime --sandbox-strict',
    initialLogs: [
      '🛡 [Security Sentinel] Real-time stream sanitization active',
      '🔒 [Security Sentinel] Process namespace: isolated cgroups / seccomp',
      '✔ [Security Sentinel] Scanned 1.4M output bytes: No API secrets detected',
    ],
  },
];

export interface WorkspaceTab {
  id: string;
  name: string;
  badge: string;
  layout: LayoutPresetKey;
  cwd: string;
  runningCount: number;
}

export interface PaneItem {
  id: string;
  title: string;
  cwd: string;
  agent?: AgentTemplate;
  logs: string[];
  command: string;
  isStreaming: boolean;
}

/* ==========================================================================
   Component: InteractiveAppDemo
   ========================================================================== */

export const InteractiveAppDemo: React.FC<{
  className?: string;
  initialTheme?: ThemePresetKey;
  initialLayout?: LayoutPresetKey;
}> = ({ className = '', initialTheme = 'vibedark', initialLayout = '4-quad' }) => {
  // Theme state
  const [currentThemeKey, setCurrentThemeKey] = useState<ThemePresetKey>(initialTheme);
  const theme = DEMO_THEMES[currentThemeKey];

  // Workspace Tabs
  const [workspaces, setWorkspaces] = useState<WorkspaceTab[]>([
    {
      id: 'ws-multi-agent',
      name: 'Workspace: Multi-Agent Prod',
      badge: 'PROD',
      layout: '4-quad',
      cwd: '~/projects/vibegrid-core',
      runningCount: 4,
    },
    {
      id: 'ws-frontend',
      name: 'Frontend Dev',
      badge: 'DEV',
      layout: '2-horizontal',
      cwd: '~/projects/vibegrid-web',
      runningCount: 2,
    },
    {
      id: 'ws-rust',
      name: 'Rust Kernel',
      badge: 'PTY',
      layout: '3-t-top',
      cwd: '~/projects/vibegrid-tokio-pty',
      runningCount: 3,
    },
  ]);
  const [activeWsId, setActiveWsId] = useState<string>('ws-multi-agent');

  // Layout State
  const [activeLayoutKey, setActiveLayoutKey] = useState<LayoutPresetKey>(initialLayout);
  const [focusedPaneId, setFocusedPaneId] = useState<string>('pane-1');
  const [maximizedPaneId, setMaximizedPaneId] = useState<string | null>(null);

  // Dropdowns & Modals
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isAgentLauncherOpen, setIsAgentLauncherOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNewWsModalOpen, setIsNewWsModalOpen] = useState(false);
  const [newWsNameInput, setNewWsNameInput] = useState('');

  // Voice Indicator State
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'transcribing' | 'inserted'>('idle');
  const [, setVoiceTranscript] = useState<string>('');

  // Telemetry real-time jitter simulation
  const [fps, setFps] = useState<number>(60.0);
  const [latency, setLatency] = useState<number>(1.4);
  const [memory, setMemory] = useState<number>(142.4);

  // Command input state for focused terminal
  const [commandInput, setCommandInput] = useState<string>('');
  const commandPaletteInputRef = useRef<HTMLInputElement>(null);
  const newWsInputRef = useRef<HTMLInputElement>(null);

  // Panes Map
  const [panes, setPanes] = useState<Record<string, PaneItem>>({
    'pane-1': {
      id: 'pane-1',
      title: 'agent-orchestrator',
      cwd: '~/projects/vibegrid-core',
      agent: DEMO_AGENTS[1], // Claude Architect
      logs: [
        '🚀 [VibeGrid GPU WebGL2 Engine] Initialized 60 FPS Canvas Host',
        '⚡ Spawning multi-agent task runner with Tokio PTY bridge…',
        '✔ Subscribed to IPC bus on channel: vibegrid::events::stream',
        '✨ Agent Fleet ready: 4 agents online and listening.',
      ],
      command: 'claude-agent supervise --fleet=swarm-alpha',
      isStreaming: true,
    },
    'pane-2': {
      id: 'pane-2',
      title: 'codex-worker-01',
      cwd: '~/projects/vibegrid-core/src/render',
      agent: DEMO_AGENTS[0], // Codex Fullstack
      logs: [
        '⚡ [Codex Engineer] Reading AST for src/terminal/WebGLRenderer.ts',
        '📦 Compiling WebGL 2.0 vertex shaders with SIMD acceleration…',
        '✔ Linked program with 0 shader warnings.',
        '🚀 Streaming glyph batches: 120,000 chars/sec @ 1.4ms latency',
      ],
      command: 'codex-agent run --task="optimize-gpu-render-loop"',
      isStreaming: true,
    },
    'pane-3': {
      id: 'pane-3',
      title: 'tokio-pty-bridge',
      cwd: '~/projects/vibegrid-tokio-pty',
      agent: DEMO_AGENTS[3], // Rust Kernel
      logs: [
        '🦀 [Rust Kernel] cargo check --workspace',
        '    Checking vibegrid-pty-tokio v0.1.0',
        '    Checking vibegrid-shader-pipeline v0.1.0',
        '    Finished dev [unoptimized + debuginfo] target(s) in 0.42s',
        '🟢 PTY daemon alive on /dev/ttys004',
      ],
      command: 'cargo watch -x "test --package vibegrid-pty"',
      isStreaming: false,
    },
    'pane-4': {
      id: 'pane-4',
      title: 'gemini-telemetry-tuner',
      cwd: '~/projects/vibegrid-core',
      agent: DEMO_AGENTS[2], // Gemini Optimizer
      logs: [
        '🚀 [Gemini Optimizer] Measuring GPU VSync intervals…',
        '⚡ Frame latency: min=0.9ms avg=1.4ms max=2.1ms (p99 < 3ms)',
        '📊 Zero memory leaks detected across 48,000 render ticks',
        '✔ WebGL 2.0 hardware acceleration active on Apple Metal / Vulkan',
      ],
      command: 'gemini-opt --profile=webgl2-atlas --target=60fps',
      isStreaming: true,
    },
    'pane-5': {
      id: 'pane-5',
      title: 'security-sentinel-daemon',
      cwd: '~/projects/vibegrid-core',
      agent: DEMO_AGENTS[4], // Security Sentinel
      logs: [
        '🛡 [Security Sentinel] Real-time stream sanitization active',
        '🔒 Process namespace: isolated cgroups / seccomp',
        '✔ 0 leaked secrets found in buffer streams',
      ],
      command: 'sentinel-audit --realtime',
      isStreaming: false,
    },
    'pane-6': {
      id: 'pane-6',
      title: 'test-runner-e2e',
      cwd: '~/projects/vibegrid-core',
      agent: undefined,
      logs: [
        '🧪 Running vitest test suite across 19 suites…',
        ' ✓ src/lib/layoutGenerators.test.ts (9 tests) 14ms',
        ' ✓ src/lib/commandUtils.test.ts (18 tests) 8ms',
        ' ✓ src/store/useVoiceStore.test.ts (6 tests) 4ms',
        '✔ Test Files 19 passed (19) · Tests 209 passed (209)',
      ],
      command: 'npm test -- --watch',
      isStreaming: false,
    },
  });

  // Telemetry fluctuation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Number((59.8 + Math.random() * 0.4).toFixed(1)));
      setLatency(Number((1.2 + Math.random() * 0.4).toFixed(1)));
      setMemory(Number((141.8 + Math.random() * 1.2).toFixed(1)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsLayoutDropdownOpen(false);
        setIsThemeDropdownOpen(false);
        setIsAgentLauncherOpen(false);
        setIsNewWsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when palette opens
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => commandPaletteInputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Focus new ws input
  useEffect(() => {
    if (isNewWsModalOpen) {
      setTimeout(() => newWsInputRef.current?.focus(), 50);
    }
  }, [isNewWsModalOpen]);

  // Voice Interaction Simulator
  const handleToggleVoice = () => {
    if (voiceState === 'idle') {
      setVoiceState('listening');
      setVoiceTranscript('');
      // After 2.5 seconds, advance to transcribing
      setTimeout(() => {
        setVoiceState('transcribing');
        const simulatedPhrases = [
          'cargo test --workspace --all-targets',
          'codex optimize gpu render buffer',
          'git diff --stat HEAD~1',
          'claude re-balance agent cluster',
        ];
        const chosen = simulatedPhrases[Math.floor(Math.random() * simulatedPhrases.length)];
        setVoiceTranscript(chosen);

        // After 1.2s transcribing, insert into focused pane
        setTimeout(() => {
          setVoiceState('inserted');
          if (focusedPaneId && panes[focusedPaneId]) {
            setPanes((prev) => ({
              ...prev,
              [focusedPaneId]: {
                ...prev[focusedPaneId],
                logs: [
                  ...prev[focusedPaneId].logs,
                  `🎤 [Voice Input Dictated]: "${chosen}"`,
                  `⚡ Executing voice command in ${prev[focusedPaneId].title}…`,
                ],
              },
            }));
          }
          // After 2.5s return to idle
          setTimeout(() => {
            setVoiceState('idle');
          }, 2500);
        }, 1200);
      }, 2500);
    } else {
      setVoiceState('idle');
    }
  };

  // Switch Workspace
  const handleSwitchWorkspace = (wsId: string) => {
    setActiveWsId(wsId);
    const ws = workspaces.find((w) => w.id === wsId);
    if (ws) {
      setActiveLayoutKey(ws.layout);
    }
  };

  // Add new workspace
  const handleCreateWorkspace = () => {
    if (!newWsNameInput.trim()) return;
    const newWs: WorkspaceTab = {
      id: `ws-${Date.now()}`,
      name: newWsNameInput.trim(),
      badge: 'CUSTOM',
      layout: '4-quad',
      cwd: `~/projects/${newWsNameInput.trim().toLowerCase().replace(/\s+/g, '-')}`,
      runningCount: 4,
    };
    setWorkspaces((prev) => [...prev, newWs]);
    setActiveWsId(newWs.id);
    setActiveLayoutKey('4-quad');
    setNewWsNameInput('');
    setIsNewWsModalOpen(false);
  };

  // Launch Agent into focused pane
  const handleAttachAgent = (agent: AgentTemplate) => {
    if (!focusedPaneId) return;
    setPanes((prev) => ({
      ...prev,
      [focusedPaneId]: {
        ...prev[focusedPaneId],
        agent,
        title: `${agent.id}-${focusedPaneId.slice(-1)}`,
        command: agent.defaultCommand,
        logs: [
          ...prev[focusedPaneId].logs,
          `🤖 [Agent Initialized] Attached ${agent.name} (${agent.model})`,
          ...agent.initialLogs,
        ],
      },
    }));
    setIsAgentLauncherOpen(false);
  };

  // Execute typed command in terminal
  const handleExecuteCommand = (paneId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const trimmed = commandInput.trim();
    setPanes((prev) => {
      const p = prev[paneId];
      if (!p) return prev;
      let reply = `✔ Process exited with code 0 (pid ${Math.floor(1000 + Math.random() * 9000)})`;

      if (trimmed === 'help') {
        reply = 'Available commands: help, agents, clear, build, test, deploy, status, matrix, diff';
      } else if (trimmed === 'clear') {
        return {
          ...prev,
          [paneId]: {
            ...p,
            logs: [`VibeGrid GPU Terminal [Session cleared · ${theme.name}]`],
          },
        };
      } else if (trimmed === 'agents') {
        reply = 'Active Swarm: [Codex Engineer: RUNNING], [Claude Architect: SUPERVISING], [Gemini Optimizer: TUNING], [Rust Kernel: ACTIVE]';
      } else if (trimmed === 'diff') {
        setIsDiffOpen(true);
        reply = 'Opened Content-Aware Git Diff Viewer.';
      } else if (trimmed.startsWith('git')) {
        reply = 'On branch main. Your branch is up to date with origin/main. 2 modified files staged.';
      }

      return {
        ...prev,
        [paneId]: {
          ...p,
          logs: [...p.logs, `$ ${trimmed}`, reply],
        },
      };
    });
    setCommandInput('');
  };

  // Split Pane Simulation
  const handleSplitPane = (paneId: string, direction: 'horizontal' | 'vertical') => {
    const newId = `pane-${Date.now().toString().slice(-4)}`;
    setPanes((prev) => ({
      ...prev,
      [newId]: {
        id: newId,
        title: `term-worker-${Object.keys(prev).length + 1}`,
        cwd: prev[paneId]?.cwd || '~/projects/vibegrid-core',
        agent: undefined,
        logs: [
          `⚡ VibeGrid PTY spawned via ${direction} split`,
          '🟢 Session initialized on Tokio stdio pipeline',
        ],
        command: 'zsh -l',
        isStreaming: false,
      },
    }));
    setFocusedPaneId(newId);
  };

  // Visible panes based on layout
  const visiblePaneIds = useMemo(() => {
    if (maximizedPaneId && panes[maximizedPaneId]) {
      return [maximizedPaneId];
    }
    switch (activeLayoutKey) {
      case '1-solo':
        return ['pane-1'];
      case '2-horizontal':
      case '2-vertical':
        return ['pane-1', 'pane-2'];
      case '3-t-top':
      case '3-columns':
        return ['pane-1', 'pane-2', 'pane-3'];
      case '4-quad':
      case 'hero-1-3':
        return ['pane-1', 'pane-2', 'pane-3', 'pane-4'];
      case '6-matrix':
        return ['pane-1', 'pane-2', 'pane-3', 'pane-4', 'pane-5', 'pane-6'];
      default:
        return ['pane-1', 'pane-2', 'pane-3', 'pane-4'];
    }
  }, [activeLayoutKey, maximizedPaneId, panes]);

  // Active layout name helper
  const activeLayoutInfo = DEMO_LAYOUTS.find((l) => l.id === activeLayoutKey) || DEMO_LAYOUTS[0];

  return (
    <div
      className={`relative w-full max-w-7xl mx-auto rounded-2xl overflow-hidden font-sans select-none transition-colors duration-150 ${className}`}
      style={{
        backgroundColor: theme.bg,
        border: `1px solid ${theme.border}`,
        color: theme.ink,
        boxShadow: '0 25px 65px -12px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* ====================================================================
          1. macOS WINDOW FRAME (Traffic Lights + App Title + Badges)
          ==================================================================== */}
      <header
        className="h-11 px-4 flex items-center justify-between border-b shrink-0 z-30 relative"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }}
      >
        {/* Left: macOS Traffic Lights */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setMaximizedPaneId(null)}
              title="Close window"
              aria-label="Close"
              className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center group cursor-pointer"
            >
              <X className="w-2 h-2 text-black/70 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            {/* Minimize Button */}
            <button
              type="button"
              onClick={() => setIsDiffOpen((p) => !p)}
              title="Toggle Diff Drawer"
              aria-label="Minimize"
              className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center group cursor-pointer"
            >
              <div className="w-1.5 h-0.5 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            {/* Maximize Button */}
            <button
              type="button"
              onClick={() => {
                if (maximizedPaneId) {
                  setMaximizedPaneId(null);
                } else {
                  setMaximizedPaneId(focusedPaneId || 'pane-1');
                }
              }}
              title="Toggle Maximize Focused Pane"
              aria-label="Maximize"
              className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center group cursor-pointer"
            >
              <div className="w-1.5 h-1.5 border-t border-l border-black/70 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: theme.ink,
                border: `1px solid ${theme.border}`,
              }}
            >
              VIBEGRID v0.1.0
            </span>
          </div>
        </div>

        {/* Center: App Title */}
        <div className="flex items-center gap-2 truncate px-2">
          <TerminalIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
          <span className="font-semibold text-xs tracking-wide truncate">
            VibeGrid Desktop — GPU-Accelerated Multi-Agent Terminal
          </span>
        </div>

        {/* Right: Engine Indicator & Quick Action */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${theme.border}`,
              color: theme.inkMuted,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-white/90">METAL / WEBGL2</span>
          </div>

          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            title="Open Command Palette (Cmd+K)"
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${theme.border}`,
              color: theme.ink,
            }}
          >
            <Search className="w-3 h-3 opacity-70" />
            <span className="hidden sm:inline">⌘K</span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          2. TOP WORKSPACE TABS BAR
          ==================================================================== */}
      <div
        className="h-10 px-3 flex items-center justify-between border-b shrink-0 overflow-x-auto custom-scrollbar"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }}
      >
        {/* Tabs List */}
        <div className="flex items-center gap-1 min-w-0">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeWsId;
            return (
              <button
                key={ws.id}
                type="button"
                onClick={() => handleSwitchWorkspace(ws.id)}
                className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs transition-all cursor-pointer border-t border-x ${
                  isActive
                    ? 'font-medium shadow-sm'
                    : 'opacity-70 hover:opacity-100 hover:bg-white/[0.03]'
                }`}
                style={{
                  backgroundColor: isActive ? theme.paneBg : 'transparent',
                  borderColor: isActive ? theme.border : 'transparent',
                  color: isActive ? theme.ink : theme.inkMuted,
                  borderBottom: isActive ? `1px solid ${theme.paneBg}` : 'none',
                  marginBottom: isActive ? '-1px' : '0px',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
                  }}
                />
                <span className="truncate max-w-[160px] sm:max-w-[220px] font-sans">
                  {ws.name}
                </span>

                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: theme.inkMuted,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  {ws.badge}
                </span>

                {workspaces.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setWorkspaces((prev) => prev.filter((w) => w.id !== ws.id));
                      if (activeWsId === ws.id) {
                        const fallback = workspaces.find((w) => w.id !== ws.id);
                        if (fallback) handleSwitchWorkspace(fallback.id);
                      }
                    }}
                    title="Close Workspace"
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 text-white/50 hover:text-white transition-opacity ml-1"
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}

          {/* + New Workspace Button */}
          <button
            type="button"
            onClick={() => setIsNewWsModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ml-1"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${theme.border}`,
              color: theme.inkMuted,
            }}
            title="Create New Project Workspace"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-sans text-[11px]">+ New Workspace</span>
          </button>
        </div>

        {/* Right Tab Status Pill */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-white/50 shrink-0 pl-2">
          <span>{workspaces.length} Workspaces Active</span>
          <span>·</span>
          <span>Tokio Isolation: Strict</span>
        </div>
      </div>

      {/* ====================================================================
          3. QUICK ACTION TOOLBAR
          ==================================================================== */}
      <div
        className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 border-b shrink-0 z-20 relative text-xs"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }}
      >
        {/* Left Toolbar Cluster */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* 1. Layout Studio Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsLayoutDropdownOpen((prev) => !prev);
                setIsThemeDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: isLayoutDropdownOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                borderColor: isLayoutDropdownOpen ? theme.accent : theme.border,
                color: theme.ink,
              }}
            >
              <Layers className="w-3.5 h-3.5 text-white/80" />
              <span>{activeLayoutInfo.label}</span>
              <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
            </button>

            {/* Layout Dropdown Menu */}
            {isLayoutDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1.5 w-72 rounded-xl border shadow-2xl p-1.5 z-50 animate-fade-in"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
              >
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-white/40 border-b mb-1" style={{ borderColor: theme.border }}>
                  Select Grid Architecture
                </div>
                <div className="space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                  {DEMO_LAYOUTS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveLayoutKey(item.id);
                        setMaximizedPaneId(null);
                        setIsLayoutDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        item.id === activeLayoutKey ? 'bg-white/10 text-white font-medium' : 'hover:bg-white/5 text-white/80'
                      }`}
                    >
                      <div className="p-1 rounded bg-white/5 mt-0.5">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>{item.tag}</span>
                          <span className="text-[10px] font-mono text-white/40">{item.paneCount} Panes</span>
                        </div>
                        <div className="text-[10px] text-white/50 truncate font-mono mt-0.5">{item.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Agent Launcher Trigger */}
          <button
            type="button"
            onClick={() => setIsAgentLauncherOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer hover:bg-white/10"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: theme.border,
              color: theme.ink,
            }}
          >
            <Bot className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>+ Launch Agent</span>
          </button>

          {/* 3. Theme Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsThemeDropdownOpen((prev) => !prev);
                setIsLayoutDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: isThemeDropdownOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                borderColor: isThemeDropdownOpen ? theme.accent : theme.border,
                color: theme.ink,
              }}
            >
              <Palette className="w-3.5 h-3.5 opacity-80" />
              <span>Theme: {theme.name}</span>
              <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
            </button>

            {/* Theme Dropdown */}
            {isThemeDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1.5 w-56 rounded-xl border shadow-2xl p-1.5 z-50 animate-fade-in"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
              >
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-white/40 border-b mb-1" style={{ borderColor: theme.border }}>
                  Visual Colorway
                </div>
                <div className="space-y-0.5">
                  {(Object.keys(DEMO_THEMES) as ThemePresetKey[]).map((key) => {
                    const t = DEMO_THEMES[key];
                    const isSelected = key === currentThemeKey;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setCurrentThemeKey(key);
                          setIsThemeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                          isSelected ? 'bg-white/10 text-white font-medium' : 'hover:bg-white/5 text-white/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: t.bg }}
                          />
                          <span>{t.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Diff Viewer Toggle */}
          <button
            type="button"
            onClick={() => setIsDiffOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
              isDiffOpen ? 'bg-white/15 text-white' : 'hover:bg-white/10'
            }`}
            style={{
              backgroundColor: isDiffOpen ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: isDiffOpen ? theme.accent : theme.border,
              color: theme.ink,
            }}
          >
            <GitCommit className="w-3.5 h-3.5 text-[#fb923c]" />
            <span>Git Diff (2 modified)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white/80">
              +14/-4
            </span>
          </button>
        </div>

        {/* Right Toolbar Cluster */}
        <div className="flex items-center gap-2">
          {/* 5. Fuzzy Command Palette Trigger */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer hover:bg-white/10"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: theme.border,
              color: theme.ink,
            }}
          >
            <Search className="w-3.5 h-3.5 opacity-70" />
            <span className="font-mono text-[11px]">⌘K Search</span>
          </button>

          {/* 6. Live Voice Indicator Trigger */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
              voiceState !== 'idle' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'hover:bg-white/10'
            }`}
            style={{
              backgroundColor: voiceState !== 'idle' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: voiceState !== 'idle' ? '#f43f5e' : theme.border,
              color: voiceState !== 'idle' ? '#fda4af' : theme.ink,
            }}
          >
            {voiceState === 'idle' && (
              <>
                <Mic className="w-3.5 h-3.5 text-white/70" />
                <span className="font-mono text-[11px]">Voice: Idle</span>
              </>
            )}

            {voiceState === 'listening' && (
              <>
                <div className="relative flex items-center justify-center">
                  <span className="absolute inline-flex h-4 w-4 rounded-full bg-rose-500/40 animate-ping" />
                  <Mic className="w-3.5 h-3.5 text-rose-400 relative" />
                </div>
                <span className="font-mono text-[11px] text-rose-200">Voice: Listening…</span>
                {/* Audio Wave Bars */}
                <div className="flex items-end gap-0.5 h-3.5">
                  <div className="w-1 bg-rose-400 rounded-full animate-pulse h-3" />
                  <div className="w-1 bg-rose-400 rounded-full animate-pulse h-2" />
                  <div className="w-1 bg-rose-400 rounded-full animate-pulse h-3.5" />
                  <div className="w-1 bg-rose-400 rounded-full animate-pulse h-2" />
                </div>
              </>
            )}

            {voiceState === 'transcribing' && (
              <>
                <Loader2 className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                <span className="font-mono text-[11px] text-amber-200">Transcribing AI…</span>
              </>
            )}

            {voiceState === 'inserted' && (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-[11px] text-emerald-300">Voice: Injected!</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ====================================================================
          4. MAIN WORKSPACE / TERMINAL GRID CANVAS + SLIDE PANELS
          ==================================================================== */}
      <div className="relative flex w-full h-[540px] sm:h-[580px] overflow-hidden" style={{ backgroundColor: theme.paneBg }}>
        {/* Center Grid Area */}
        <main className="flex-1 h-full overflow-hidden p-2 relative flex flex-col">
          {/* Dynamic Grid Layout Renderer */}
          <div
            className={`w-full h-full grid gap-2 transition-all ${
              maximizedPaneId
                ? 'grid-cols-1 grid-rows-1'
                : activeLayoutKey === '1-solo'
                ? 'grid-cols-1 grid-rows-1'
                : activeLayoutKey === '2-horizontal'
                ? 'grid-cols-1 sm:grid-cols-2 grid-rows-1'
                : activeLayoutKey === '2-vertical'
                ? 'grid-cols-1 grid-rows-2'
                : activeLayoutKey === '3-t-top'
                ? 'grid-cols-1 sm:grid-cols-2 grid-rows-2'
                : activeLayoutKey === '3-columns'
                ? 'grid-cols-1 sm:grid-cols-3 grid-rows-1'
                : activeLayoutKey === '4-quad'
                ? 'grid-cols-1 sm:grid-cols-2 grid-rows-2'
                : activeLayoutKey === 'hero-1-3'
                ? 'grid-cols-1 sm:grid-cols-3 grid-rows-3'
                : activeLayoutKey === '6-matrix'
                ? 'grid-cols-1 sm:grid-cols-3 grid-rows-2'
                : 'grid-cols-2 grid-rows-2'
            }`}
          >
            {visiblePaneIds.map((paneId, index) => {
              const pane = panes[paneId] || {
                id: paneId,
                title: `terminal-${index + 1}`,
                cwd: '~/projects/vibegrid-core',
                logs: ['🟢 Terminal idle on /dev/ttys00' + (index + 1)],
                command: 'zsh',
                isStreaming: false,
              };

              const isFocused = focusedPaneId === paneId;
              const isMaximized = maximizedPaneId === paneId;

              // Grid Span Classes for Hero 1+3 or 3-Pane T-Top
              let spanClass = '';
              if (!maximizedPaneId) {
                if (activeLayoutKey === 'hero-1-3') {
                  if (index === 0) spanClass = 'sm:col-span-2 sm:row-span-3';
                  else spanClass = 'sm:col-span-1 sm:row-span-1';
                } else if (activeLayoutKey === '3-t-top') {
                  if (index === 0) spanClass = 'sm:col-span-2 sm:row-span-1';
                  else spanClass = 'sm:col-span-1 sm:row-span-1';
                }
              }

              return (
                <div
                  key={paneId}
                  onClick={() => setFocusedPaneId(paneId)}
                  className={`flex flex-col rounded-xl overflow-hidden border transition-all ${spanClass} ${
                    isFocused ? 'shadow-lg' : 'opacity-95'
                  }`}
                  style={{
                    backgroundColor: theme.paneBg,
                    borderColor: isFocused ? theme.activeBorder : theme.border,
                    boxShadow: isFocused ? `0 0 0 1px ${theme.activeBorder}` : 'none',
                  }}
                >
                  {/* Pane Header (TerminalToolbar Style) */}
                  <div
                    className="h-8 px-3 flex items-center justify-between shrink-0 select-none border-b transition-colors cursor-pointer"
                    style={{
                      backgroundColor: isFocused ? theme.headerBg : 'rgba(0, 0, 0, 0.4)',
                      borderColor: theme.border,
                      color: isFocused ? theme.ink : theme.inkMuted,
                    }}
                    onDoubleClick={() => setMaximizedPaneId(isMaximized ? null : paneId)}
                  >
                    {/* Left Pane Info */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="flex h-4 min-w-4 items-center justify-center rounded px-1 text-[10px] font-mono font-bold"
                        style={{
                          backgroundColor: isFocused ? theme.badgeBg : 'rgba(255, 255, 255, 0.1)',
                          color: isFocused ? theme.badgeFg : theme.ink,
                        }}
                      >
                        {index + 1}
                      </span>

                      <TerminalIcon className="w-3.5 h-3.5 opacity-70 shrink-0" />

                      <span className="font-semibold text-xs truncate max-w-[120px] sm:max-w-[160px] tracking-tight">
                        {pane.title}
                      </span>

                      {pane.agent && (
                        <span
                          className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${pane.agent.accentColor}20`,
                            color: pane.agent.accentColor,
                            border: `1px solid ${pane.agent.accentColor}40`,
                          }}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          {pane.agent.badge}
                        </span>
                      )}

                      <span
                        className="hidden lg:inline-block text-[10px] font-mono opacity-50 truncate max-w-[110px] px-1 py-0.5 rounded bg-white/5 border"
                        style={{ borderColor: theme.border }}
                      >
                        {pane.cwd}
                      </span>
                    </div>

                    {/* Right Pane Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSplitPane(paneId, 'horizontal');
                        }}
                        title="Split Right"
                        className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                      >
                        <Columns className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSplitPane(paneId, 'vertical');
                        }}
                        title="Split Down"
                        className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                      >
                        <Rows className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMaximizedPaneId(isMaximized ? null : paneId);
                        }}
                        title={isMaximized ? 'Restore Layout' : 'Maximize Pane'}
                        className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                      >
                        {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Terminal Body Content */}
                  <div className="flex-1 p-3 font-mono text-[11px] leading-relaxed overflow-y-auto custom-scrollbar flex flex-col justify-between">
                    {/* Log Stream */}
                    <div className="space-y-1">
                      {pane.logs.map((log, lIdx) => {
                        let colorClass = 'text-white/80';
                        if (log.includes('✔') || log.includes('passed') || log.includes('alive')) colorClass = 'text-emerald-400 font-medium';
                        else if (log.includes('⚡') || log.includes('🚀')) colorClass = 'text-sky-300 font-medium';
                        else if (log.includes('🧠') || log.includes('🤖')) colorClass = 'text-purple-300 font-medium';
                        else if (log.includes('🛡') || log.includes('🔒')) colorClass = 'text-teal-300 font-medium';
                        else if (log.startsWith('$')) colorClass = 'text-white font-semibold';

                        return (
                          <div key={lIdx} className={`break-all ${colorClass}`}>
                            {log}
                          </div>
                        );
                      })}
                    </div>

                    {/* Command Prompt Line */}
                    <form
                      onSubmit={(e) => handleExecuteCommand(paneId, e)}
                      className="mt-3 pt-2 border-t flex items-center gap-2"
                      style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
                    >
                      <span className="text-emerald-400 font-bold shrink-0">❯</span>
                      <input
                        type="text"
                        value={isFocused ? commandInput : ''}
                        onChange={(e) => {
                          if (isFocused) setCommandInput(e.target.value);
                        }}
                        onFocus={() => setFocusedPaneId(paneId)}
                        placeholder={isFocused ? 'Type a command (e.g. agents, test, help, clear)…' : 'Click to focus pane…'}
                        className="w-full bg-transparent text-[11px] font-mono text-white/90 placeholder:text-white/30 focus:outline-none"
                      />
                      <span className="w-1.5 h-3 bg-white/70 animate-pulse shrink-0" />
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* ====================================================================
            SIDE DRAWER: Content-Aware Diff Viewer
            ==================================================================== */}
        {isDiffOpen && (
          <aside
            className="w-[360px] sm:w-[440px] h-full border-l shrink-0 flex flex-col z-30 animate-fade-in"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            {/* Diff Header */}
            <div
              className="h-10 px-3.5 border-b flex items-center justify-between shrink-0"
              style={{ borderColor: theme.border }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <GitCommit className="w-4 h-4 text-[#fb923c]" />
                <span className="font-mono text-xs font-semibold truncate">src/session/supervisor.ts</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/80">
                  +14 / -4
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDiffOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Diff Table Lines */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px]">
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: theme.border }}>
                <table className="w-full border-collapse">
                  <tbody className="divide-y divide-white/[0.04]">
                    <tr className="bg-white/[0.02] text-white/40">
                      <td className="w-8 px-2 py-0.5 text-right select-none text-[10px]">12</td>
                      <td className="px-2 py-0.5 whitespace-pre text-white/70">import &#123; TokioBridge &#125; from './tokio';</td>
                    </tr>
                    <tr className="bg-rose-500/10 text-rose-300">
                      <td className="w-8 px-2 py-0.5 text-right select-none text-[10px] text-rose-400/60">- 13</td>
                      <td className="px-2 py-0.5 whitespace-pre font-medium">- const MAX_PARALLEL_WORKERS = 1;</td>
                    </tr>
                    <tr className="bg-emerald-500/10 text-emerald-300">
                      <td className="w-8 px-2 py-0.5 text-right select-none text-[10px] text-emerald-400/60">+ 13</td>
                      <td className="px-2 py-0.5 whitespace-pre font-medium">+ const MAX_PARALLEL_WORKERS = 16; // GodMode Swarm</td>
                    </tr>
                    <tr className="bg-emerald-500/10 text-emerald-300">
                      <td className="w-8 px-2 py-0.5 text-right select-none text-[10px] text-emerald-400/60">+ 14</td>
                      <td className="px-2 py-0.5 whitespace-pre font-medium">+ export function spawnAgentSwarm() &#123;</td>
                    </tr>
                    <tr className="bg-emerald-500/10 text-emerald-300">
                      <td className="w-8 px-2 py-0.5 text-right select-none text-[10px] text-emerald-400/60">+ 15</td>
                      <td className="px-2 py-0.5 whitespace-pre font-medium">+   return new TokioBridge(&#123; gpu: true &#125;);</td>
                    </tr>
                    <tr className="bg-emerald-500/10 text-emerald-300">
                      <td className="w-8 px-2 py-0.5 text-right select-none text-[10px] text-emerald-400/60">+ 16</td>
                      <td className="px-2 py-0.5 whitespace-pre font-medium">+ &#125;</td>
                    </tr>
                    <tr className="bg-white/[0.02] text-white/40">
                      <td className="w-8 px-2 py-0.5 text-right select-none text-[10px]">17</td>
                      <td className="px-2 py-0.5 whitespace-pre text-white/70">export default spawnAgentSwarm;</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Diff Footer Action */}
            <div
              className="p-3 border-t flex items-center justify-between shrink-0 text-xs font-mono"
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            >
              <span className="text-white/40">Branch: main*</span>
              <button
                type="button"
                onClick={() => setIsDiffOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all cursor-pointer"
              >
                Stage Changes
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ====================================================================
          5. BOTTOM STATUS BAR (Telemetry, FPS, PTY Latency, Memory)
          ==================================================================== */}
      <footer
        className="h-8 px-4 flex items-center justify-between border-t shrink-0 select-none text-[11px] font-mono z-20 relative"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.inkMuted,
        }}
      >
        {/* Left Telemetry Cluster */}
        <div className="flex items-center gap-2 truncate">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white/90">WebGL 2.0: {fps.toFixed(1)} FPS</span>
          </div>
          <span className="text-white/20">·</span>
          <span>PTY Latency: {latency.toFixed(1)}ms</span>
          <span className="text-white/20">·</span>
          <span>IPC: Tokio Stdio</span>
          <span className="text-white/20">·</span>
          <span className="hidden sm:inline">Active Memory: {memory.toFixed(1)} MB</span>
        </div>

        {/* Right System Info */}
        <div className="hidden md:flex items-center gap-2 text-white/40">
          <span className="text-white/70">git:(main*)</span>
          <span>·</span>
          <span>UTF-8 · LF</span>
          <span>·</span>
          <span className="text-white/60">4 Panes · 3 Agents Active</span>
        </div>
      </footer>

      {/* ====================================================================
          MODAL 1: FUZZY COMMAND PALETTE (⌘K)
          ==================================================================== */}
      {isCommandPaletteOpen && (
        <div
          onClick={() => setIsCommandPaletteOpen(false)}
          className="absolute inset-0 z-50 bg-black/85 flex items-start justify-center pt-16 px-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            {/* Search Input */}
            <div className="flex items-center px-4 py-3.5 border-b" style={{ borderColor: theme.border }}>
              <Search className="w-4 h-4 text-white/70 mr-3 shrink-0" />
              <input
                ref={commandPaletteInputRef}
                type="text"
                placeholder="Type a command or search actions…"
                className="w-full bg-transparent text-sm text-white/90 placeholder:text-white/30 focus:outline-none font-sans"
              />
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/60">ESC</kbd>
            </div>

            {/* Command Items List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
              <div
                onClick={() => {
                  setIsAgentLauncherOpen(true);
                  setIsCommandPaletteOpen(false);
                }}
                className="px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between cursor-pointer text-white"
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-[#38bdf8]" />
                  <span className="font-medium">Open AI Agent Fleet Launcher…</span>
                </div>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/60">Alt+A</kbd>
              </div>

              <div
                onClick={() => {
                  setIsDiffOpen(true);
                  setIsCommandPaletteOpen(false);
                }}
                className="px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between cursor-pointer text-white"
              >
                <div className="flex items-center gap-2.5">
                  <GitCommit className="w-4 h-4 text-[#fb923c]" />
                  <span className="font-medium">Toggle Content-Aware Diff Viewer</span>
                </div>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/60">Mod+Shift+D</kbd>
              </div>

              <div
                onClick={() => {
                  setActiveLayoutKey('4-quad');
                  setMaximizedPaneId(null);
                  setIsCommandPaletteOpen(false);
                }}
                className="px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between cursor-pointer text-white"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-white/80" />
                  <span className="font-medium">Apply 2x2 Quad Matrix Layout</span>
                </div>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/60">4</kbd>
              </div>

              <div
                onClick={() => {
                  setActiveLayoutKey('hero-1-3');
                  setMaximizedPaneId(null);
                  setIsCommandPaletteOpen(false);
                }}
                className="px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between cursor-pointer text-white"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-white/80" />
                  <span className="font-medium">Apply Hero 1+3 (Master-Detail) Layout</span>
                </div>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/60">Alt+4</kbd>
              </div>

              <div
                onClick={() => {
                  handleToggleVoice();
                  setIsCommandPaletteOpen(false);
                }}
                className="px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between cursor-pointer text-white"
              >
                <div className="flex items-center gap-2.5">
                  <Mic className="w-4 h-4 text-rose-400" />
                  <span className="font-medium">Start Live Voice-to-Terminal Dictation</span>
                </div>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/60">Mod+Shift+V</kbd>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t flex items-center justify-between text-[10px] font-mono text-white/40" style={{ borderColor: theme.border }}>
              <span>↑↓ Navigate · ↵ Select · Esc Close</span>
              <span>VibeGrid Fuzzy Search Engine</span>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: AGENT FLEET LAUNCHER
          ==================================================================== */}
      {isAgentLauncherOpen && (
        <div
          onClick={() => setIsAgentLauncherOpen(false)}
          className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#38bdf8]" />
                <h3 className="font-bold text-sm text-white">VibeGrid AI Agent Fleet Launcher</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAgentLauncherOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Agents Grid */}
            <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {DEMO_AGENTS.map((agent) => (
                <div
                  key={agent.id}
                  className="p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all hover:bg-white/[0.04]"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderColor: theme.border,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${agent.accentColor}20`,
                          color: agent.accentColor,
                          border: `1px solid ${agent.accentColor}40`,
                        }}
                      >
                        {agent.badge}
                      </span>
                      <span className="font-bold text-xs text-white">{agent.name}</span>
                      <span className="text-[10px] font-mono text-white/40">({agent.model} · {agent.latency})</span>
                    </div>
                    <p className="text-xs text-white/60 mt-1">{agent.description}</p>
                    <code className="text-[10px] font-mono text-white/40 block mt-1 truncate">
                      $ {agent.defaultCommand}
                    </code>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAttachAgent(agent)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 shadow-sm"
                    style={{
                      backgroundColor: theme.accent,
                      color: theme.id === 'vibedark' ? '#000000' : '#ffffff',
                    }}
                  >
                    Deploy to Pane
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: NEW WORKSPACE CREATOR
          ==================================================================== */}
      {isNewWsModalOpen && (
        <div
          onClick={() => setIsNewWsModalOpen(false)}
          className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border shadow-2xl p-5 space-y-4"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Create New Project Workspace</h3>
              <button
                type="button"
                onClick={() => setIsNewWsModalOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/60">
              Each workspace maintains its own isolated Tokio PTY tree, terminal memory sandbox, and autonomous agents.
            </p>

            <input
              ref={newWsInputRef}
              type="text"
              value={newWsNameInput}
              onChange={(e) => setNewWsNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateWorkspace();
              }}
              placeholder="Workspace Name (e.g. Swarm-Core, API-Gateway)"
              className="w-full h-10 px-3.5 rounded-xl bg-black/50 border text-xs text-white placeholder-white/30 focus:outline-none"
              style={{ borderColor: theme.border }}
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewWsModalOpen(false)}
                className="px-3 py-2 rounded-xl text-xs text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateWorkspace}
                disabled={!newWsNameInput.trim()}
                className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 disabled:opacity-40 transition-all cursor-pointer"
              >
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
