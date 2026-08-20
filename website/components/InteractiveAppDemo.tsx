'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderTree,
  FileCode,
  Check,
  Copy,
  Zap,
  Layers,
  HardDrive,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CheckCheck,
} from 'lucide-react';

// Import Authentic Desktop Components
import { DesktopAppSidebar, PrimaryView, WorkspaceFolder } from './demo/DesktopAppSidebar';
import { DesktopTitlebar } from './demo/DesktopTitlebar';
import { DesktopTerminalToolbar } from './demo/DesktopTerminalToolbar';
import { DesktopGridRenderer, DemoPaneState, TerminalLog, DiffHunkLine } from './demo/DesktopGridRenderer';
import { DesktopCentralPromptCard, DesktopLayoutPresetId } from './demo/DesktopCentralPromptCard';
import { DesktopModals, ActiveDesktopModal } from './demo/DesktopModals';

// Import Demo Metadata & Types
import { DEMO_THEMES, DemoTheme } from './demo/demoThemes';
import { DEMO_LAYOUT_PRESETS, DemoLayoutPreset } from './demo/demoLayouts';
import { DEMO_AGENTS, DemoAgent } from './demo/demoAgents';

// Export sub-components for direct consumer imports
export {
  DesktopAppSidebar,
  DesktopTitlebar,
  DesktopTerminalToolbar,
  DesktopGridRenderer,
  DesktopCentralPromptCard,
  DesktopModals,
};

// ============================================================================
// Types & Telemetry Profiles
// ============================================================================

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'info' | 'agent';
}

export interface AgentTelemetryData {
  id: string;
  name: string;
  provider: string;
  accent: string;
  model: string;
  tokenSpeed: string;
  tokenSpeedValue: number;
  tokenSpeedPeak: string;
  ttft: string;
  contextUsage: string;
  contextUsageValue: number;
  contextRemaining: string;
  contextCeiling: string;
  memoryUsage: string;
  memoryUsageValue: number;
  memoryType: string;
  memoryResident: string;
  architectureMode: string;
  ipcProtocol: string;
  pid: string;
  tty: string;
  breadcrumb: string;
  activeTool: string;
  toolArgs: string;
  sandboxLevel: string;
  permissionStatus: string;
  thoughtSteps: Array<{
    id: string;
    title: string;
    meta: string;
    detail: string;
    timestamp: string;
  }>;
  codeDiff: {
    file: string;
    additions: number;
    deletions: number;
    lines: Array<{
      type: 'add' | 'del' | 'context' | 'header';
      oldNum?: number | string;
      newNum?: number | string;
      content: string;
    }>;
  };
}

const AGENT_TELEMETRY: AgentTelemetryData[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    provider: 'Anthropic CLI',
    accent: '#5683da',
    model: 'claude-3-7-sonnet',
    tokenSpeed: '88.4 tok/s',
    tokenSpeedValue: 76,
    tokenSpeedPeak: '112.6 tok/s',
    ttft: '142ms',
    contextUsage: '42.8k / 200k (21.4%)',
    contextUsageValue: 21.4,
    contextRemaining: '157.2k tok',
    contextCeiling: '200,000 tok',
    memoryUsage: '1.2 GB / 64 GB',
    memoryUsageValue: 18,
    memoryType: 'Unified System RAM',
    memoryResident: '840 MB Heap',
    architectureMode: 'Local Stdio Pipe',
    ipcProtocol: 'PTY Master Stream',
    pid: '4892',
    tty: '/dev/ttys004',
    breadcrumb: '~/vibegrid/core › src › middleware › auth.rs',
    activeTool: 'ast_grep_replace',
    toolArgs: '--pattern "extract_bearer_token($REQ)" --lang rust',
    sandboxLevel: 'Sandbox L3 (Isolated PTY)',
    permissionStatus: 'Auto-Permitted',
    thoughtSteps: [
      {
        id: 'c-1',
        title: 'Workspace AST indexing complete',
        meta: '1,420 modules · 2.8ms',
        detail: 'Generated Syn AST representation across 1,420 Rust crates. Resolved auth boundaries in middleware layer.',
        timestamp: '21:02:18.104',
      },
      {
        id: 'c-2',
        title: 'Detected unhandled Option in auth.rs:L84',
        meta: 'Severity: High · CWE-252',
        detail: 'Direct indexing into Authorization header could panic on malformed Bearer headers without claims verification.',
        timestamp: '21:02:18.340',
      },
      {
        id: 'c-3',
        title: 'Synthesizing zero-copy patch with KEY_STORE verification',
        meta: 'ast_grep_replace · Atomic',
        detail: 'Replaced manual string slicing with validated extract_bearer_token() helper and cached claims verification.',
        timestamp: '21:02:18.782',
      },
      {
        id: 'c-4',
        title: 'Static verification: cargo check --quiet',
        meta: '0 warnings · 0 errors',
        detail: 'Invoked local Rust toolchain in sandboxed PTY. Verified binary symbol consistency and lifetime bounds.',
        timestamp: '21:02:19.012',
      },
    ],
    codeDiff: {
      file: 'src/middleware/auth.rs',
      additions: 12,
      deletions: 3,
      lines: [
        { type: 'header', content: '@@ -81,7 +81,16 @@ fn validate_session(req: &HttpRequest) -> Result<Claims, AuthError>' },
        { type: 'context', oldNum: 81, newNum: 81, content: ' pub fn validate_session(req: &HttpRequest) -> Result<Claims, AuthError> {' },
        { type: 'del', oldNum: 82, newNum: '', content: '-    let token = req.headers().get("Authorization")?;' },
        { type: 'del', oldNum: 83, newNum: '', content: '-    if token.starts_with("Bearer ") {' },
        { type: 'del', oldNum: 84, newNum: '', content: '-        let raw = &token[7..];' },
        { type: 'add', oldNum: '', newNum: 82, content: '+    let token = extract_bearer_token(req)?;' },
        { type: 'add', oldNum: '', newNum: 83, content: '+    let claims = token.verify_claims(&KEY_STORE)?;' },
        { type: 'add', oldNum: '', newNum: 84, content: '+    tracing::debug!(' },
        { type: 'add', oldNum: '', newNum: 85, content: '+        target: "auth::session",' },
        { type: 'add', oldNum: '', newNum: 86, content: '+        user_id = %claims.subject,' },
        { type: 'add', oldNum: '', newNum: 87, content: '+        "Session token validated successfully"' },
        { type: 'add', oldNum: '', newNum: 88, content: '+    );' },
        { type: 'add', oldNum: '', newNum: 89, content: '+    Ok(claims)' },
        { type: 'context', oldNum: 85, newNum: 90, content: ' }' },
      ],
    },
  },
  {
    id: 'codex',
    name: 'OpenAI Codex',
    provider: 'OpenAI CLI',
    accent: '#27c93f',
    model: 'o3-mini-high',
    tokenSpeed: '114.2 tok/s',
    tokenSpeedValue: 95,
    tokenSpeedPeak: '138.0 tok/s',
    ttft: '98ms',
    contextUsage: '65.1k / 128k (50.8%)',
    contextUsageValue: 50.8,
    contextRemaining: '62.9k tok',
    contextCeiling: '128,000 tok',
    memoryUsage: '1.8 GB / 64 GB',
    memoryUsageValue: 28,
    memoryType: 'Unified System RAM',
    memoryResident: '1.1 GB Heap',
    architectureMode: 'IPC Unix Socket',
    ipcProtocol: 'AF_UNIX Bi-directional',
    pid: '5120',
    tty: '/dev/ttys008',
    breadcrumb: '~/vibegrid/core › tests › pty_fuzz.rs',
    activeTool: 'cargo_test_runner',
    toolArgs: '--package pty_engine --test pty_fuzz --release',
    sandboxLevel: 'Sandbox L3 (Isolated PTY)',
    permissionStatus: 'Auto-Permitted',
    thoughtSteps: [
      {
        id: 'x-1',
        title: 'Analyzed PTY ringbuffer backpressure drain rates',
        meta: '64KB chunks · 16 threads',
        detail: 'Simulated multi-agent stream saturation over 16 concurrent worker channels with zero heap allocation.',
        timestamp: '21:02:17.510',
      },
      {
        id: 'x-2',
        title: 'Synthesizing property-based fuzz test vectors',
        meta: 'proptest · 10,000 runs',
        detail: 'Generated random stream truncation scenarios testing buffer exhaustion and boundary condition drains.',
        timestamp: '21:02:18.004',
      },
      {
        id: 'x-3',
        title: 'Executing cargo test --package pty_engine',
        meta: '28 passed · 0 failed · 0.42s',
        detail: 'All fuzzing assertions passed with 100% code coverage across ringbuffer wrap-around logic.',
        timestamp: '21:02:18.424',
      },
    ],
    codeDiff: {
      file: 'tests/pty_fuzz.rs',
      additions: 10,
      deletions: 0,
      lines: [
        { type: 'header', content: '@@ -42,6 +42,16 @@' },
        { type: 'add', oldNum: '', newNum: 42, content: '+#[test]' },
        { type: 'add', oldNum: '', newNum: 43, content: '+fn test_backpressure_drain_rate() {' },
        { type: 'add', oldNum: '', newNum: 44, content: '+    let mut buffer = RingBuffer::new(1024 * 64);' },
        { type: 'add', oldNum: '', newNum: 45, content: '+    let data = vec![0xAB; 4096];' },
        { type: 'add', oldNum: '', newNum: 46, content: '+    assert!(buffer.push_chunk_batch(&data).is_ok());' },
        { type: 'add', oldNum: '', newNum: 47, content: '+    let drained = buffer.drain_to_vec();' },
        { type: 'add', oldNum: '', newNum: 48, content: '+    assert_eq!(drained.len(), 4096);' },
        { type: 'add', oldNum: '', newNum: 49, content: '+    assert_eq!(drained[0], 0xAB);' },
        { type: 'add', oldNum: '', newNum: 50, content: '+}' },
      ],
    },
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    provider: 'DeepMind Core',
    accent: '#ff8964',
    model: 'gemini-2.5-pro',
    tokenSpeed: '94.0 tok/s',
    tokenSpeedValue: 79,
    tokenSpeedPeak: '124.8 tok/s',
    ttft: '110ms',
    contextUsage: '142.0k / 1.0M (14.2%)',
    contextUsageValue: 14.2,
    contextRemaining: '858.0k tok',
    contextCeiling: '1,000,000 tok',
    memoryUsage: '2.4 GB / 64 GB',
    memoryUsageValue: 37,
    memoryType: 'Unified System RAM',
    memoryResident: '1.6 GB Heap',
    architectureMode: 'Subagent Fiber Mesh',
    ipcProtocol: 'RPC / Shared Memory',
    pid: '6204',
    tty: '/dev/ttys012',
    breadcrumb: '~/vibegrid/core › website › app › page.tsx',
    activeTool: 'subagent_dispatcher',
    toolArgs: '--agent "desktop-simulator" --role "Architecture Harmony"',
    sandboxLevel: 'Verified Workspace Root',
    permissionStatus: 'Auto-Permitted',
    thoughtSteps: [
      {
        id: 'a-1',
        title: 'Parsing multi-agent runtime topology and design tokens',
        meta: 'design.md · Token Contracts',
        detail: 'Audited color tokens: Charcoal #111111, Void #090a0c, Slate Edge #4a4b50 with solid accent palette.',
        timestamp: '21:02:17.120',
      },
      {
        id: 'a-2',
        title: 'Spawning concurrent subagent fibers for IDE simulation',
        meta: '5 worker nodes · IPC Channel :8080',
        detail: 'Dispatched dedicated worker threads for Claude Code, Codex, Antigravity, Aider, and Ollama.',
        timestamp: '21:02:17.650',
      },
      {
        id: 'a-3',
        title: 'Validating zero-bleed architectural visual contracts',
        meta: '0 gradients · Solid materials',
        detail: 'Eliminated radial blurs and background flares. Hardened layout borders to crisp high-contrast dark materials.',
        timestamp: '21:02:18.210',
      },
    ],
    codeDiff: {
      file: 'website/app/page.tsx',
      additions: 8,
      deletions: 1,
      lines: [
        { type: 'header', content: '@@ -18,6 +18,13 @@ export default function Home() {' },
        { type: 'add', oldNum: '', newNum: 18, content: '+      {/* Section 2: Light Linen Productivity Band */}' },
        { type: 'add', oldNum: '', newNum: 19, content: '+      <ProductivityLightGrid />' },
        { type: 'add', oldNum: '', newNum: 20, content: '+' },
        { type: 'add', oldNum: '', newNum: 21, content: '+      {/* Section 3: Flagship Desktop App Demo Suite */}' },
        { type: 'add', oldNum: '', newNum: 22, content: '+      <InteractiveAppDemo />' },
        { type: 'add', oldNum: '', newNum: 23, content: '+' },
        { type: 'add', oldNum: '', newNum: 24, content: '+      {/* Section 4: MetaBrain Capabilities */}' },
        { type: 'context', oldNum: 25, newNum: 25, content: '       <MetaBrainCapabilitiesSection />' },
      ],
    },
  },
  {
    id: 'aider',
    name: 'Aider',
    provider: 'Paul Gauthier Pair CLI',
    accent: '#a78bfa',
    model: 'deepseek-coder-v2',
    tokenSpeed: '76.8 tok/s',
    tokenSpeedValue: 64,
    tokenSpeedPeak: '98.4 tok/s',
    ttft: '160ms',
    contextUsage: '31.4k / 64k (49.1%)',
    contextUsageValue: 49.1,
    contextRemaining: '32.6k tok',
    contextCeiling: '64,000 tok',
    memoryUsage: '1.1 GB / 64 GB',
    memoryUsageValue: 17,
    memoryType: 'Unified System RAM',
    memoryResident: '720 MB Heap',
    architectureMode: 'Git Tree-Sitter Stream',
    ipcProtocol: 'Direct PTY Stdout',
    pid: '7180',
    tty: '/dev/ttys015',
    breadcrumb: '~/vibegrid/core › src-tauri › src › pty.rs',
    activeTool: 'git_commit_staged',
    toolArgs: '-m "feat(pty): hardware backpressure sync" --gpg-sign',
    sandboxLevel: 'Git Safe Sandbox L2',
    permissionStatus: 'Auto-Permitted',
    thoughtSteps: [
      {
        id: 'ai-1',
        title: 'Constructed repository symbol map via Tree-Sitter',
        meta: 'src-tauri/**/*.rs · 84 symbols',
        detail: 'Extracted AST symbol index for Tauri IPC commands and background Rust threads.',
        timestamp: '21:02:17.330',
      },
      {
        id: 'ai-2',
        title: 'Staging atomic patch hunk for PTY backpressure',
        meta: 'git add -p · 4 hunks staged',
        detail: 'Staged channel timeout and metric instrumentation without collateral workspace changes.',
        timestamp: '21:02:17.910',
      },
    ],
    codeDiff: {
      file: 'src-tauri/src/pty.rs',
      additions: 6,
      deletions: 2,
      lines: [
        { type: 'header', content: '@@ -140,4 +140,8 @@ impl PtySession {' },
        { type: 'del', oldNum: 140, newNum: '', content: '-    self.writer.write_all(payload)?;' },
        { type: 'del', oldNum: 141, newNum: '', content: '-    self.writer.flush()?;' },
        { type: 'add', oldNum: '', newNum: 140, content: '+    self.backpressure_channel.send_with_timeout(' },
        { type: 'add', oldNum: '', newNum: 141, content: '+        payload,' },
        { type: 'add', oldNum: '', newNum: 142, content: '+        std::time::Duration::from_millis(50)' },
        { type: 'add', oldNum: '', newNum: 143, content: '+    )?;' },
      ],
    },
  },
  {
    id: 'ollama',
    name: 'Ollama Local',
    provider: '100% Offline Metal GPU',
    accent: '#2dd4bf',
    model: 'qwen2.5-coder:32b',
    tokenSpeed: '46.2 tok/s',
    tokenSpeedValue: 39,
    tokenSpeedPeak: '58.0 tok/s',
    ttft: '184ms',
    contextUsage: '16.0k / 32k (50.0%)',
    contextUsageValue: 50.0,
    contextRemaining: '16.0k tok',
    contextCeiling: '32,000 tok',
    memoryUsage: '18.4 GB / 36 GB',
    memoryUsageValue: 51,
    memoryType: 'Metal Unified VRAM',
    memoryResident: '18.4 GB Weights (Q4_K_M)',
    architectureMode: 'Direct Metal API (Offline)',
    ipcProtocol: 'Zero-Egress Local Host',
    pid: '8840',
    tty: '/dev/ttys021',
    breadcrumb: '~/vibegrid/core › docs › architecture.md',
    activeTool: 'local_gguf_quant',
    toolArgs: '--ctx-size 32768 --gpu-layers 48 --threads 8',
    sandboxLevel: '100% Offline Zero-Egress',
    permissionStatus: 'Air-Gapped Local',
    thoughtSteps: [
      {
        id: 'o-1',
        title: 'Initialized Apple Silicon Metal inference pipeline',
        meta: 'M3 Max · 48 GPU Layers',
        detail: 'Loaded 48 transformer layers directly onto unified GPU memory. Zero network sockets open.',
        timestamp: '21:02:16.890',
      },
      {
        id: 'o-2',
        title: 'Offline static analysis & doc audit (0 cloud bytes)',
        meta: 'Air-gapped · RAM-only',
        detail: 'Validated memory-safety invariants across Tauri FFI boundaries with full privacy guarantee.',
        timestamp: '21:02:17.440',
      },
    ],
    codeDiff: {
      file: 'docs/architecture.md',
      additions: 6,
      deletions: 0,
      lines: [
        { type: 'header', content: '@@ -1,3 +1,9 @@' },
        { type: 'add', oldNum: '', newNum: 1, content: '+## Offline Security Guarantee' },
        { type: 'add', oldNum: '', newNum: 2, content: '+No code, telemetry, or shell commands leave local RAM.' },
        { type: 'add', oldNum: '', newNum: 3, content: '+All neural weights execute directly on Apple Metal / CUDA.' },
      ],
    },
  },
];

const INITIAL_PANES: DemoPaneState[] = [
  {
    id: 'pane_01',
    index: 0,
    title: 'claude-code',
    cwd: '~/vibegrid/core',
    agentName: 'Claude Code',
    agentBadge: 'CLAUDE 3.7',
    agentAccent: '#5683da',
    currentInput: '',
    history: ['claude "fix auth bug"', 'git status', 'cargo check'],
    historyIndex: -1,
    isStreaming: true,
    hasActivity: false,
    logs: [
      {
        id: 'c-1',
        type: 'info',
        bullet: '●',
        bulletColor: 'text-[#5683da]',
        tag: 'AST_INDEX',
        tagColor: 'bg-[#5683da]/20 text-[#5683da] border-[#5683da]/40',
        text: 'Analyzing AST token graph across 1,420 modules (Syn AST v2.0)...',
        timestamp: '21:02:02',
      },
      {
        id: 'c-2',
        type: 'success',
        bullet: '✔',
        bulletColor: 'text-[#27c93f]',
        tag: 'PATCH_READY',
        tagColor: 'bg-[#27c93f]/20 text-[#27c93f] border-[#27c93f]/40',
        text: 'Identified unhandled Option in auth_middleware.rs:L84 (CWE-252).',
        timestamp: '21:02:03',
      },
      {
        id: 'c-3',
        type: 'diff',
        timestamp: '21:02:04',
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
        timestamp: '21:02:05',
      },
    ],
  },
  {
    id: 'pane_02',
    index: 1,
    title: 'cargo-test-pty',
    cwd: '~/vibegrid/rust-pty',
    agentName: 'OpenAI Codex',
    agentBadge: 'RUST PTY',
    agentAccent: '#ff8964',
    currentInput: '',
    history: ['cargo test --release', 'cargo bench'],
    historyIndex: -1,
    isStreaming: true,
    hasActivity: false,
    logs: [
      {
        id: 'x-1',
        type: 'info',
        bullet: '➜',
        bulletColor: 'text-[#ff8964]',
        tag: 'CARGO',
        tagColor: 'bg-[#ff8964]/20 text-[#ff8964] border-[#ff8964]/40',
        text: 'Compiling vibegrid-pty v0.1.0 (/Users/abuzar/Desktop/VibeGrid)',
        timestamp: '21:02:00',
      },
      {
        id: 'x-2',
        type: 'success',
        bullet: '✔',
        bulletColor: 'text-[#27c93f]',
        text: 'test pty::ringbuffer::test_backpressure_drain ... ok (0.01s)',
        timestamp: '21:02:02',
      },
      {
        id: 'x-3',
        type: 'success',
        bullet: '✔',
        bulletColor: 'text-[#27c93f]',
        text: 'test pty::master::test_zero_copy_ipc_stream ... ok (0.02s)',
        timestamp: '21:02:03',
      },
      {
        id: 'x-4',
        type: 'info',
        bullet: '●',
        bulletColor: 'text-[#ff8964]',
        text: 'test result: ok. 14 passed; 0 failed; finished in 0.42s',
        timestamp: '21:02:05',
      },
    ],
  },
  {
    id: 'pane_03',
    index: 2,
    title: 'dev-server',
    cwd: '~/vibegrid/web',
    agentName: 'Vite Server',
    agentBadge: 'READY :1420',
    agentAccent: '#27c93f',
    currentInput: '',
    history: ['npm run dev', 'npm run build'],
    historyIndex: -1,
    isStreaming: false,
    hasActivity: false,
    logs: [
      {
        id: 'd-1',
        type: 'info',
        bullet: '➜',
        bulletColor: 'text-[#5683da]',
        text: 'VITE v6.4.3 ready in 142 ms',
        timestamp: '21:01:50',
      },
      {
        id: 'd-2',
        type: 'success',
        bullet: '➜',
        bulletColor: 'text-[#27c93f]',
        text: 'Local: http://localhost:1420/',
        timestamp: '21:01:51',
      },
      {
        id: 'd-3',
        type: 'info',
        bullet: '⚡',
        bulletColor: 'text-[#ffbd2e]',
        text: '[HMR] WebGL 2.0 Canvas context bound (60.0 FPS locked)',
        timestamp: '21:02:01',
      },
    ],
  },
  {
    id: 'pane_04',
    index: 3,
    title: 'ollama-qwen',
    cwd: '~/vibegrid/mcp',
    agentName: 'Ollama Qwen',
    agentBadge: 'OFFLINE MCP',
    agentAccent: '#2dd4bf',
    currentInput: '',
    history: ['ollama run qwen2.5-coder:32b', 'status'],
    historyIndex: -1,
    isStreaming: true,
    hasActivity: false,
    logs: [
      {
        id: 'o-1',
        type: 'info',
        bullet: '●',
        bulletColor: 'text-teal-400',
        tag: 'METAL_GPU',
        tagColor: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
        text: 'Qwen 2.5 Coder 32B loaded (18.4 GB Apple Metal VRAM)',
        timestamp: '21:02:00',
      },
      {
        id: 'o-2',
        type: 'info',
        bullet: '⚡',
        bulletColor: 'text-[#ffbd2e]',
        text: 'Tool call: kanban_get_workspace_context() [0ms egress]',
        timestamp: '21:02:02',
      },
      {
        id: 'o-3',
        type: 'success',
        bullet: '✔',
        bulletColor: 'text-[#27c93f]',
        text: 'Local AST cache validated. Zero cloud bytes transmitted.',
        timestamp: '21:02:04',
      },
    ],
  },
];

const AUTONOMOUS_STREAM_POOL = [
  { paneId: 'pane_01', bullet: '●', bulletColor: 'text-[#5683da]', text: 'AST Syn parser: 1,420 modules validated in 2.8ms', tag: 'SYN_PARSE', tagColor: 'bg-[#5683da]/20 text-[#5683da] border-[#5683da]/40' },
  { paneId: 'pane_01', bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'All lifetimes and trait bounds resolved with zero warnings' },
  { paneId: 'pane_02', bullet: '⚡', bulletColor: 'text-[#ffbd2e]', text: 'PTY Fuzzing: 10,000 runs, 0 backpressure dropped' },
  { paneId: 'pane_02', bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'test pty_session::backpressure ... ok (0.01s)' },
  { paneId: 'pane_03', bullet: '⚡', bulletColor: 'text-[#27c93f]', text: '[HMR] GridRenderer layout hot-updated in 18ms' },
  { paneId: 'pane_04', bullet: '●', bulletColor: 'text-teal-400', text: 'Local Metal buffer cache hit: 98.4% efficiency' },
];

// ============================================================================
// Main InteractiveAppDemo Component
// ============================================================================

export function InteractiveAppDemo() {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<'grid' | 'hub' | 'telemetry'>('grid');
  const [activeModal, setActiveModal] = useState<ActiveDesktopModal>('none');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);

  // Theme & Layout
  const [activeThemeId, setActiveThemeId] = useState<DemoTheme['id']>('vibedark');
  const [activeLayoutId, setActiveLayoutId] = useState<DemoLayoutPreset['id']>('2x2');
  const [cornerRadius, setCornerRadius] = useState<number>(10);
  const [gutterWidth, setGutterWidth] = useState<number>(2);

  // Workspaces State
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('ws-default');
  const [workspaceName, setWorkspaceName] = useState<string>('multi-agent-prod');
  const [workspaceEmoji, setWorkspaceEmoji] = useState<string>('⚡');

  // Panes & Telemetry State
  const [panes, setPanes] = useState<DemoPaneState[]>(INITIAL_PANES);
  const [focusedPaneId, setFocusedPaneId] = useState<string>('pane_01');
  const [maximizedPaneId, setMaximizedPaneId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('claude');

  // Telemetry details state
  const [copiedDiff, setCopiedDiff] = useState<boolean>(false);
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    'c-1': true,
    'c-2': true,
    'c-3': true,
    'c-4': false,
    'x-1': true,
    'x-2': true,
    'x-3': true,
    'a-1': true,
    'a-2': true,
    'a-3': true,
    'ai-1': true,
    'ai-2': true,
    'o-1': true,
    'o-2': true,
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((title: string, description: string, type: 'success' | 'info' | 'agent' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const currentTheme = DEMO_THEMES[activeThemeId] || DEMO_THEMES.vibedark;
  const selectedTelemetry = AGENT_TELEMETRY.find((a) => a.id === selectedAgentId) || AGENT_TELEMETRY[0];

  // Autonomous Stream Loop
  useEffect(() => {
    if (!isStreaming || viewMode !== 'grid') return;

    const interval = setInterval(() => {
      const randEvent = AUTONOMOUS_STREAM_POOL[Math.floor(Math.random() * AUTONOMOUS_STREAM_POOL.length)];
      const targetPane = panes.find((p) => p.id === randEvent.paneId && !p.isClosed);
      if (!targetPane) return;

      const newLog: TerminalLog = {
        id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        type: 'info',
        bullet: randEvent.bullet,
        bulletColor: randEvent.bulletColor,
        tag: randEvent.tag,
        tagColor: randEvent.tagColor,
        text: randEvent.text,
        timestamp: new Date().toTimeString().split(' ')[0],
      };

      setPanes((prev) =>
        prev.map((p) => {
          if (p.id === targetPane.id) {
            const nextLogs = [...p.logs, newLog];
            if (nextLogs.length > 50) nextLogs.shift();
            return {
              ...p,
              logs: nextLogs,
              hasActivity: p.id !== focusedPaneId,
            };
          }
          return p;
        })
      );
    }, 2800);

    return () => clearInterval(interval);
  }, [isStreaming, viewMode, panes, focusedPaneId]);

  // Global Keyboard Shortcuts (⌘K for palette, ? for shortcuts, Esc to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveModal((prev) => (prev === 'palette' ? 'none' : 'palette'));
      } else if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setActiveModal('shortcuts');
      } else if (e.key === 'Escape') {
        setActiveModal('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Terminal Command Executor
  const handleExecuteCommand = (paneId: string, rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    const time = new Date().toTimeString().split(' ')[0];
    const userLog: TerminalLog = {
      id: `user-${Date.now()}`,
      type: 'input',
      text: trimmed,
      timestamp: time,
    };

    let responseLogs: TerminalLog[] = [];
    const lower = trimmed.toLowerCase();

    if (lower === 'clear' || lower === 'cls') {
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
                    text: 'Terminal scrollback cleared. Type "help" for command catalog.',
                    timestamp: time,
                  },
                ],
                currentInput: '',
                history: [...p.history, trimmed],
                historyIndex: -1,
              }
            : p
        )
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
        { id: `cg-4-${Date.now()}`, type: 'output', text: 'test result: ok. 18 passed; 0 failed; finished in 0.38s' },
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
        { id: `npm-2-${Date.now()}`, type: 'success', bullet: '➜', bulletColor: 'text-[#27c93f]', text: 'VITE v6.4.3 ready in 138 ms (http://localhost:1420/)' },
      ];
    } else if (lower === 'git status') {
      responseLogs = [
        {
          id: `git-1-${Date.now()}`,
          type: 'output',
          text: 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nChanges to be committed:\n    modified:   src/middleware/auth.rs\n    modified:   tests/pty_fuzz.rs',
          timestamp: time,
        },
      ];
    } else if (lower === 'git diff') {
      setActiveModal('diff');
      responseLogs = [
        {
          id: `diff-1-${Date.now()}`,
          type: 'info',
          bullet: '●',
          bulletColor: 'text-[#5683da]',
          text: 'Opened Content-Aware Git Diff Viewer for src/middleware/auth.rs',
          timestamp: time,
        },
      ];
    } else if (lower === 'ls' || lower === 'ls -la') {
      responseLogs = [
        {
          id: `ls-1-${Date.now()}`,
          type: 'output',
          text: 'drwxr-xr-x  14 abuzar  staff   448B Aug 20 21:00 src/\ndrwxr-xr-x   8 abuzar  staff   256B Aug 20 21:00 src-tauri/\ndrwxr-xr-x  12 abuzar  staff   384B Aug 20 21:00 website/\n-rw-r--r--   1 abuzar  staff   1.6K Aug 20 21:00 package.json',
          timestamp: time,
        },
      ];
    } else if (lower === 'status') {
      responseLogs = [
        {
          id: `stat-1-${Date.now()}`,
          type: 'info',
          bullet: '●',
          bulletColor: 'text-[#5683da]',
          tag: 'TELEMETRY',
          tagColor: 'bg-[#5683da]/20 text-[#5683da] border-[#5683da]/40',
          text: 'GPU: WebGL 2.0 (60.0 FPS) · PTY: 0.4ms latency · Memory: 0.0% cloud egress',
          timestamp: time,
        },
      ];
    } else if (lower === 'reset') {
      setPanes(INITIAL_PANES);
      setActiveLayoutId('2x2');
      setMaximizedPaneId(null);
      addToast('Reset Complete', 'All terminal panes restored to initial state.');
      return;
    } else {
      responseLogs = [
        {
          id: `out-${Date.now()}`,
          type: 'output',
          text: `[Process executed]: ${trimmed} (code 0)`,
          timestamp: time,
        },
      ];
    }

    setPanes((prev) =>
      prev.map((p) =>
        p.id === paneId
          ? {
              ...p,
              logs: [...p.logs, userLog, ...responseLogs].slice(-80),
              currentInput: '',
              history: [...p.history, trimmed],
              historyIndex: -1,
            }
          : p
      )
    );

    addToast('Command Executed', `$ ${trimmed}`);
  };

  // Keyboard navigation inside input (history & tab)
  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>, paneId: string) => {
    const pane = panes.find((p) => p.id === paneId);
    if (!pane) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteCommand(paneId, pane.currentInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (pane.history.length === 0) return;
      const nextIdx = pane.historyIndex === -1 ? pane.history.length - 1 : Math.max(0, pane.historyIndex - 1);
      setPanes((prev) =>
        prev.map((p) =>
          p.id === paneId
            ? { ...p, historyIndex: nextIdx, currentInput: p.history[nextIdx] || '' }
            : p
        )
      );
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (pane.historyIndex === -1) return;
      const nextIdx = pane.historyIndex + 1;
      if (nextIdx >= pane.history.length) {
        setPanes((prev) => prev.map((p) => (p.id === paneId ? { ...p, historyIndex: -1, currentInput: '' } : p)));
      } else {
        setPanes((prev) =>
          prev.map((p) =>
            p.id === paneId
              ? { ...p, historyIndex: nextIdx, currentInput: p.history[nextIdx] || '' }
              : p
          )
        );
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const cmds = ['help', 'claude "fix auth"', 'cargo test', 'npm run dev', 'git status', 'git diff', 'ls', 'status', 'clear'];
      const cur = pane.currentInput.trim();
      const match = cmds.find((c) => c.startsWith(cur));
      if (match) {
        setPanes((prev) => prev.map((p) => (p.id === paneId ? { ...p, currentInput: match } : p)));
      }
    }
  };

  // Deploy Agent to Pane
  const handleDeployAgent = (agent: DemoAgent, targetPaneId = 1, model?: string, prompt?: string) => {
    const targetIdx = Math.max(0, Math.min(panes.length - 1, targetPaneId - 1));
    const targetPane = panes[targetIdx];
    if (!targetPane) return;

    const time = new Date().toTimeString().split(' ')[0];
    const initialLogs: TerminalLog[] = [
      {
        id: `deploy-${Date.now()}`,
        type: 'info',
        bullet: '●',
        bulletColor: 'text-[#5683da]',
        tag: 'AGENT_INIT',
        tagColor: 'bg-[#5683da]/20 text-[#5683da] border-[#5683da]/40',
        text: `Provisioned ${agent.name} (${model || agent.defaultModel}) on PTY #${targetIdx + 1}`,
        timestamp: time,
      },
      ...agent.simulatedLogs.map((sl, i) => ({
        id: `sl-${Date.now()}-${i}`,
        type: 'info' as const,
        bullet: sl.bullet,
        bulletColor: sl.bulletColor,
        text: sl.text,
        timestamp: time,
      })),
    ];

    if (prompt) {
      initialLogs.push({
        id: `prompt-${Date.now()}`,
        type: 'input',
        text: prompt,
        timestamp: time,
      });
    }

    setPanes((prev) =>
      prev.map((p, idx) =>
        idx === targetIdx
          ? {
              ...p,
              title: `${agent.id}-worker-0${targetIdx + 1}`,
              agentName: agent.name,
              agentBadge: agent.badge,
              agentAccent: agent.id === 'codex' ? '#27c93f' : agent.id === 'antigravity' ? '#ff8964' : '#5683da',
              logs: [...p.logs, ...initialLogs],
              isClosed: false,
            }
          : p
      )
    );

    setFocusedPaneId(targetPane.id);
    setViewMode('grid');
    addToast('Agent Deployed', `Attached ${agent.name} to Pane #${targetIdx + 1}`, 'agent');
  };

  // Split Pane Actions
  const handleSplitHorizontal = (paneId: string) => {
    if (activeLayoutId === '1x2') {
      setActiveLayoutId('2x2');
    } else if (activeLayoutId === '2x2') {
      setActiveLayoutId('3x3');
    }
    addToast('Split Right', 'Partitioned terminal grid horizontally (⌘D).');
  };

  const handleSplitVertical = (paneId: string) => {
    if (activeLayoutId === '1x2') {
      setActiveLayoutId('hero-1-3');
    } else if (activeLayoutId === '2x2') {
      setActiveLayoutId('3x3');
    }
    addToast('Split Down', 'Partitioned terminal grid vertically (⌘⇧D).');
  };

  const handleToggleMaximize = (paneId: string) => {
    if (maximizedPaneId === paneId) {
      setMaximizedPaneId(null);
      addToast('Restored Layout', 'Returned to full multi-pane grid.');
    } else {
      setMaximizedPaneId(paneId);
      addToast('Pane Maximized', `Focused pane ${paneId} (⌘⇧↵).`);
    }
  };

  const handleClosePane = (paneId: string) => {
    if (maximizedPaneId === paneId) setMaximizedPaneId(null);
    setPanes((prev) => prev.map((p) => (p.id === paneId ? { ...p, isClosed: true } : p)));
    addToast('Pane Closed', `Closed terminal pane ${paneId} (⌘W).`);
  };

  const handleDispatchSwarmTask = () => {
    setDispatchStatus('running');
    addToast('Dispatching Swarm Task', `Broadcasting IPC task payload to ${selectedTelemetry.name}...`, 'info');
    setTimeout(() => {
      setDispatchStatus('done');
      addToast('Task Synchronized', `Successfully verified AST patch with ${selectedTelemetry.name}!`, 'agent');
      setTimeout(() => setDispatchStatus('idle'), 3200);
    }, 1100);
  };

  const handleCopyDiff = () => {
    const raw = selectedTelemetry.codeDiff.lines.map((l) => l.content).join('\n');
    navigator.clipboard?.writeText(raw);
    setCopiedDiff(true);
    addToast('Diff Copied', `Staged diff for ${selectedTelemetry.codeDiff.file} copied.`);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  return (
    <section
      id="desktop-app-demo"
      className="relative bg-[#ffffff] text-[#090a0c] py-16 sm:py-20 md:py-28 border-t border-[#e5e5e7] overflow-hidden select-text transition-colors duration-300"
    >
      <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================= */}
        {/* 1. SECTION INTRO HEADER                                   */}
        {/* ========================================================= */}
        <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-14">
          <h2 className="text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#050506] tracking-tight leading-[1.08]">
            Orchestrate Together.{' '}
            <span className="font-serif italic font-normal text-[#303236]">Any Agent, Anywhere.</span>
          </h2>

          <p className="mt-4 text-[14px] sm:text-base md:text-lg text-[#6b6c6d] font-normal leading-relaxed max-w-2xl mx-auto">
            Experience the real VibeGrid Desktop application in your browser.
            Manage project workspaces, launch heterogeneous AI agents, and customize multi-pane layouts.
          </p>
        </div>

        {/* ========================================================= */}
        {/* 2. AUTHENTIC DESKTOP WINDOW FRAME                         */}
        {/* ========================================================= */}
        <div
          className={`relative rounded-xl sm:rounded-2xl border border-[#4a4b50]/80 shadow-[0_25px_80px_rgba(0,0,0,0.9)] transition-all duration-300 overflow-hidden flex flex-col ${
            isFullscreen
              ? 'fixed inset-3 z-50 rounded-xl bg-[#090a0c]'
              : 'bg-[#090a0c] h-[540px] sm:h-[620px] md:h-[680px] lg:h-[740px]'
          }`}
          style={{
            backgroundColor: currentTheme.bgCanvas,
            borderColor: `${currentTheme.border}`,
          }}
        >
          {/* Authentic Titlebar */}
          <DesktopTitlebar
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            workspaceName={workspaceName}
            workspaceEmoji={workspaceEmoji}
            viewMode={viewMode}
            onChangeViewMode={(mode) => setViewMode(mode)}
            currentTheme={currentTheme}
            onOpenAgentLauncher={() => setActiveModal('launcher')}
            onOpenLayoutStudio={() => setActiveModal('studio')}
            onOpenThemeStudio={() => setActiveModal('theme')}
            onOpenDiffViewer={() => setActiveModal('diff')}
            onOpenCommandPalette={() => setActiveModal('palette')}
            onOpenShortcuts={() => setActiveModal('shortcuts')}
            isStreaming={isStreaming}
            onToggleStreaming={() => {
              setIsStreaming(!isStreaming);
              addToast(
                isStreaming ? 'Stream Paused' : 'Stream Resumed',
                isStreaming ? 'PTY live stream output paused.' : 'PTY live stream active at 60.0 FPS.',
                'info'
              );
            }}
            onToast={addToast}
          />

          {/* Main Desktop Body (Sidebar + Content Workspace Area) */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Authentic Left Workspace Sidebar */}
            <DesktopAppSidebar
              isOpen={isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
              activeView={viewMode === 'telemetry' ? 'diff' : viewMode}
              onSelectView={(view: PrimaryView) => {
                if (view === 'grid') setViewMode('grid');
                else if (view === 'hub') setViewMode('hub');
                else if (view === 'studio') setActiveModal('studio');
                else if (view === 'diff') setActiveModal('diff');
              }}
              activeWorkspaceId={activeWorkspaceId}
              onSelectWorkspace={(id) => {
                setActiveWorkspaceId(id);
                addToast('Workspace Switched', `Focused project "${id}".`);
              }}
              onSelectThread={(wsId, threadTitle) => {
                setActiveWorkspaceId(wsId);
                setViewMode('grid');
                addToast('Thread Opened', `Opened thread "${threadTitle}".`);
              }}
              onOpenThemeSelector={() => setActiveModal('theme')}
              onOpenShortcuts={() => setActiveModal('shortcuts')}
            />

            {/* Main Center Display Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#050507] min-h-0 min-w-0">
              
              {/* VIEW 1: TERMINAL GRID VIEW */}
              {viewMode === 'grid' && (
                <div className="flex-1 overflow-hidden flex flex-col min-h-0 min-w-0 h-full">
                  <DesktopGridRenderer
                    layoutPreset={activeLayoutId}
                    maximizedPaneId={maximizedPaneId}
                    focusedPaneId={focusedPaneId}
                    panes={panes}
                    currentTheme={currentTheme}
                    cornerRadius={cornerRadius}
                    gutterWidth={gutterWidth}
                    onFocusPane={(id) => {
                      setFocusedPaneId(id);
                      setPanes((prev) => prev.map((p) => (p.id === id ? { ...p, hasActivity: false } : p)));
                    }}
                    onExecuteCommand={handleExecuteCommand}
                    onInputChange={(paneId, val) =>
                      setPanes((prev) => prev.map((p) => (p.id === paneId ? { ...p, currentInput: val } : p)))
                    }
                    onKeyDownInput={handleKeyDownInput}
                    onRenamePane={(paneId, newTitle) => {
                      setPanes((prev) => prev.map((p) => (p.id === paneId ? { ...p, title: newTitle } : p)));
                      addToast('Pane Renamed', `Updated pane title to "${newTitle}".`);
                    }}
                    onSplitHorizontal={handleSplitHorizontal}
                    onSplitVertical={handleSplitVertical}
                    onToggleMaximize={handleToggleMaximize}
                    onClosePane={handleClosePane}
                    onClearPane={(paneId) => {
                      setPanes((prev) => prev.map((p) => (p.id === paneId ? { ...p, logs: [] } : p)));
                      addToast('Buffer Cleared', 'Scrollback buffer cleared.');
                    }}
                  />
                </div>
              )}

              {/* VIEW 2: CENTRAL PROMPT CARD (HUB / EMPTY STATE) */}
              {viewMode === 'hub' && (
                <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                  <DesktopCentralPromptCard
                    workspaceName={workspaceName}
                    workspacePath="~/vibegrid/core"
                    onLaunchPreset={(presetId: DesktopLayoutPresetId) => {
                      const layoutMap: Record<DesktopLayoutPresetId, DemoLayoutPreset['id']> = {
                        solo: '1x2',
                        dual: '1x2',
                        quad: '2x2',
                        hero: 'hero-1-3',
                        hex: '3x3',
                        hive: '3x3',
                        matrix: '3x3',
                      };
                      setActiveLayoutId(layoutMap[presetId] || '2x2');
                      setViewMode('grid');
                      addToast('Layout Launched', `Switched to ${presetId} layout blueprint.`);
                    }}
                  />
                </div>
              )}

              {/* VIEW 3: SWARM TELEMETRY & REASONING TRACE */}
              {viewMode === 'telemetry' && (
                <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#4a4b50]/40 font-mono text-xs">
                  {/* Left Column: Workstream & AST Reasoning Tree */}
                  <div className="lg:col-span-7 p-4 sm:p-6 bg-[#090a0c] space-y-5 text-left">
                    <div className="flex items-center justify-between pb-3 border-b border-[#4a4b50]/30 text-[#6b6c6d] text-[11px]">
                      <div className="flex items-center gap-2 text-white">
                        <FolderTree size={13} className="text-[#5683da]" />
                        <span className="font-bold">{selectedTelemetry.breadcrumb}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>PID: <strong className="text-white">{selectedTelemetry.pid}</strong></span>
                        <span>TTY: <strong className="text-white">{selectedTelemetry.tty}</strong></span>
                      </div>
                    </div>

                    {/* Agent Switcher Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {AGENT_TELEMETRY.map((ag) => (
                        <button
                          key={ag.id}
                          type="button"
                          onClick={() => setSelectedAgentId(ag.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                            selectedAgentId === ag.id
                              ? 'bg-[#303236] text-white border border-[#4a4b50]'
                              : 'bg-[#111111] text-[#a9a9aa] hover:text-white border border-transparent'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ag.accent }} />
                          <span>{ag.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Reasoning Steps Tree */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                        <span>Live Execution Trace &amp; Reasoning</span>
                        <span className="text-[10px] text-[#6b6c6d]">{selectedTelemetry.thoughtSteps.length} Steps</span>
                      </div>

                      <div className="space-y-2 border-l border-[#4a4b50]/40 pl-3 ml-1">
                        {selectedTelemetry.thoughtSteps.map((step) => {
                          const isExpanded = expandedSteps[step.id] ?? true;
                          return (
                            <div key={step.id} className="rounded-lg bg-[#111111] border border-[#4a4b50]/40 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setExpandedSteps((p) => ({ ...p, [step.id]: !p[step.id] }))}
                                className="w-full text-left p-2.5 flex items-center justify-between gap-2 hover:bg-[#1a1b1e] cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  {isExpanded ? <ChevronDown size={12} className="text-[#a9a9aa]" /> : <ChevronRight size={12} className="text-[#a9a9aa]" />}
                                  <span className="text-white font-medium text-[11px]">{step.title}</span>
                                </div>
                                <span className="text-[10px] text-[#6b6c6d]">{step.meta}</span>
                              </button>
                              {isExpanded && (
                                <div className="px-3 pb-2.5 pt-1 text-[11px] text-[#a9a9aa] border-t border-[#4a4b50]/20 bg-[#090a0c]/60">
                                  <p>{step.detail}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Unified Diff Box */}
                    <div className="rounded-lg bg-[#111111] border border-[#4a4b50]/60 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-[#1a1b1e] border-b border-[#4a4b50]/40 text-[11px]">
                        <div className="flex items-center gap-2">
                          <FileCode size={13} className="text-[#5683da]" />
                          <span className="text-white font-bold">{selectedTelemetry.codeDiff.file}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyDiff}
                          className="flex items-center gap-1 text-[10px] bg-[#090a0c] px-2 py-0.5 rounded border border-[#4a4b50]/40 hover:text-white text-[#a9a9aa]"
                        >
                          {copiedDiff ? <Check size={11} className="text-[#27c93f]" /> : <Copy size={11} />}
                          <span>{copiedDiff ? 'COPIED' : 'COPY'}</span>
                        </button>
                      </div>
                      <div className="overflow-x-auto p-2 bg-[#090a0c] font-mono text-[10px] leading-snug">
                        {selectedTelemetry.codeDiff.lines.map((l, idx) => (
                          <div
                            key={idx}
                            className={`px-1 py-0.5 whitespace-pre ${
                              l.type === 'add'
                                ? 'bg-[#27c93f]/10 text-emerald-300'
                                : l.type === 'del'
                                ? 'bg-[#ff5f56]/10 text-rose-300 line-through'
                                : l.type === 'header'
                                ? 'text-[#5683da] font-bold'
                                : 'text-[#a9a9aa]'
                            }`}
                          >
                            {l.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Gauges & Swarm Controller */}
                  <div className="lg:col-span-5 p-4 sm:p-6 bg-[#111111] space-y-5 text-left flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#4a4b50]/30">
                        <span className="text-xs font-bold uppercase tracking-wider text-white">Telemetry Gauges</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50]/50 text-white">
                          {selectedTelemetry.provider}
                        </span>
                      </div>

                      {/* Speed Gauge */}
                      <div className="p-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50]/40 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#a9a9aa] flex items-center gap-1.5">
                            <Zap size={12} className="text-[#27c93f]" />
                            Inference Velocity
                          </span>
                          <span className="text-[#27c93f] font-bold">{selectedTelemetry.tokenSpeed}</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#111111] rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-[#27c93f] rounded-full"
                            style={{ width: `${selectedTelemetry.tokenSpeedValue}%` }}
                          />
                        </div>
                      </div>

                      {/* Context Gauge */}
                      <div className="p-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50]/40 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#a9a9aa] flex items-center gap-1.5">
                            <Layers size={12} className="text-[#5683da]" />
                            Context Load
                          </span>
                          <span className="text-[#5683da] font-bold">{selectedTelemetry.contextUsage}</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#111111] rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-[#5683da] rounded-full"
                            style={{ width: `${selectedTelemetry.contextUsageValue}%` }}
                          />
                        </div>
                      </div>

                      {/* Memory Gauge */}
                      <div className="p-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50]/40 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#a9a9aa] flex items-center gap-1.5">
                            <HardDrive size={12} className="text-[#ff8964]" />
                            RAM / VRAM Egress
                          </span>
                          <span className="text-[#ff8964] font-bold">{selectedTelemetry.memoryUsage}</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#111111] rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-[#ff8964] rounded-full"
                            style={{ width: `${selectedTelemetry.memoryUsageValue}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dispatch Button */}
                    <div className="pt-4 border-t border-[#4a4b50]/30 space-y-2">
                      <button
                        type="button"
                        onClick={handleDispatchSwarmTask}
                        disabled={dispatchStatus === 'running'}
                        className="w-full py-2.5 rounded-full bg-[#5683da] hover:bg-[#4672c7] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-70"
                      >
                        {dispatchStatus === 'running' ? (
                          <>
                            <RotateCcw size={13} className="animate-spin" />
                            <span>Broadcasting IPC Task...</span>
                          </>
                        ) : dispatchStatus === 'done' ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-300" />
                            <span>Synchronized with {selectedTelemetry.name}!</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            <span>Dispatch Swarm Task to {selectedTelemetry.name}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('grid');
                          addToast('Grid Active', 'Switched to terminal grid view.');
                        }}
                        className="w-full py-2 rounded-lg bg-[#090a0c] hover:bg-[#1a1b1e] text-[#a9a9aa] hover:text-white border border-[#4a4b50]/40 text-xs transition-colors cursor-pointer"
                      >
                        Open in Terminal Grid →
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Desktop Status Bar Footer */}
          <footer
            className="flex items-center justify-between border-t border-[#4a4b50]/60 bg-[#090a0c] px-4 py-2 text-[11px] font-mono text-[#a9a9aa] select-none shrink-0"
            style={{
              backgroundColor: currentTheme.bgFooter || '#090a0c',
              borderColor: `${currentTheme.border}70`,
            }}
          >
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-[#27c93f]" />
                WebGL 2.0: 60.0 FPS
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5683da]" />
                PTY Latency: 0.4ms
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff8964]" />
                Air-Gapped: 0.0% Cloud Egress
              </span>
            </div>

            <div className="hidden md:flex items-center gap-3 text-[#6b6c6d]">
              <span>⌘K Command Palette</span>
              <span>•</span>
              <span>? Shortcuts</span>
              <span>•</span>
              <span>⌘D Split</span>
            </div>
          </footer>
        </div>

        {/* ========================================================= */}
        {/* 3. AUTHENTIC DESKTOP MODALS SUITE                         */}
        {/* ========================================================= */}
        <DesktopModals
          activeModal={activeModal}
          onClose={() => setActiveModal('none')}
          currentTheme={currentTheme}
          activeLayoutId={activeLayoutId}
          activePaneId={panes.findIndex((p) => p.id === focusedPaneId) + 1 || 1}
          paneCount={panes.length}
          onDeployAgent={handleDeployAgent}
          onSelectLayout={(layoutId, rad, gut) => {
            setActiveLayoutId(layoutId);
            if (rad !== undefined) setCornerRadius(rad);
            if (gut !== undefined) setGutterWidth(gut);
            setViewMode('grid');
            addToast('Layout Applied', `Switched layout to ${layoutId}.`);
          }}
          onSelectTheme={(theme) => {
            setActiveThemeId(theme.id);
            addToast('Theme Applied', `Switched palette to ${theme.name}.`);
          }}
          onOpenAgentLauncher={() => setActiveModal('launcher')}
          onOpenLayoutStudio={() => setActiveModal('studio')}
          onOpenThemeStudio={() => setActiveModal('theme')}
          onOpenDiffViewer={() => setActiveModal('diff')}
          onOpenShortcuts={() => setActiveModal('shortcuts')}
          onRunTest={() => {
            handleExecuteCommand(focusedPaneId, 'cargo test');
          }}
          onClearPanes={() => {
            setPanes((prev) => prev.map((p) => ({ ...p, logs: [] })));
            addToast('All Panes Cleared', 'Cleared scrollback for all active terminals.');
          }}
          onResetPanes={() => {
            setPanes(INITIAL_PANES);
            setActiveLayoutId('2x2');
            setMaximizedPaneId(null);
            addToast('Panes Reset', 'Restored initial terminal fleet.');
          }}
          onStageCommit={() => {
            addToast('Git Staged & Committed', 'Committed auth.rs refactor with GPG signature.', 'agent');
          }}
        />

        {/* ========================================================= */}
        {/* 4. TOAST NOTIFICATION STACK                               */}
        {/* ========================================================= */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="pointer-events-auto px-4 py-3 rounded-xl bg-[#111111] border border-[#5683da]/60 text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)] font-mono text-xs flex items-center gap-3 min-w-[280px]"
              >
                <div className="p-1 rounded-full bg-[#5683da]/20 text-[#5683da] shrink-0">
                  <CheckCheck size={14} />
                </div>
                <div>
                  <div className="font-bold text-white">{toast.title}</div>
                  <div className="text-[11px] text-[#a9a9aa]">{toast.description}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
