'use client';

import React, { useState } from 'react';
import {
  Terminal,
  Pause,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Layers,
  ShieldCheck,
  Activity,
  FileCode,
  HardDrive,
  Zap,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  FolderTree,
  SlidersHorizontal,
  ArrowUpRight,
} from 'lucide-react';

interface ThoughtStep {
  id: string;
  title: string;
  meta: string;
  detail: string;
  status: 'done' | 'active' | 'pending';
  timestamp: string;
}

interface DiffLine {
  type: 'add' | 'del' | 'context' | 'header';
  oldNum?: number | string;
  newNum?: number | string;
  content: string;
}

interface AgentProfile {
  id: string;
  name: string;
  provider: string;
  accent: string;
  model: string;
  tokenSpeed: string;
  tokenSpeedValue: number; // percentage for gauge
  tokenSpeedPeak: string;
  ttft: string;
  contextUsage: string;
  contextUsageValue: number; // percentage for gauge
  contextRemaining: string;
  contextCeiling: string;
  memoryUsage: string;
  memoryUsageValue: number; // percentage for gauge
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
  thoughtSteps: ThoughtStep[];
  codeDiff: {
    file: string;
    additions: number;
    deletions: number;
    lines: DiffLine[];
  };
}

const AGENTS: AgentProfile[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    provider: 'Anthropic CLI',
    accent: '#d97706',
    model: 'claude-3-7-sonnet',
    tokenSpeed: '88.4 tok/s',
    tokenSpeedValue: 74,
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
        meta: '1,420 crates · 3.2ms',
        detail: 'Generated Syn AST representation across 1,420 Rust modules. Identified auth boundary in middleware crate.',
        status: 'done',
        timestamp: '14:02:18.104',
      },
      {
        id: 'c-2',
        title: 'Detected unhandled Option in auth_middleware.rs:L84',
        meta: 'Severity: High · CWE-252',
        detail: 'Direct indexing into Authorization header could panic on malformed Bearer headers without claims verification.',
        status: 'done',
        timestamp: '14:02:18.340',
      },
      {
        id: 'c-3',
        title: 'Synthesizing zero-copy patch with KEY_STORE claims check',
        meta: 'ast_grep_replace · Atomic',
        detail: 'Replaced manual string slicing with validated extract_bearer_token() helper and cached claims verification.',
        status: 'done',
        timestamp: '14:02:18.782',
      },
      {
        id: 'c-4',
        title: 'Static verification: cargo check --quiet',
        meta: '0 warnings · 0 errors',
        detail: 'Invoked local Rust toolchain in sandboxed PTY. Verified binary symbol consistency and lifetime bounds.',
        status: 'done',
        timestamp: '14:02:19.012',
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
    accent: '#10b981',
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
        status: 'done',
        timestamp: '14:02:17.510',
      },
      {
        id: 'x-2',
        title: 'Synthesizing property-based fuzz test vectors',
        meta: 'proptest · 10,000 runs',
        detail: 'Generated random stream truncation scenarios testing buffer exhaustion and boundary condition drains.',
        status: 'done',
        timestamp: '14:02:18.004',
      },
      {
        id: 'x-3',
        title: 'Executing cargo test --package pty_engine',
        meta: '28 passed · 0 failed · 0.42s',
        detail: 'All fuzzing assertions passed with 100% code coverage across ringbuffer wrap-around logic.',
        status: 'done',
        timestamp: '14:02:18.424',
      },
    ],
    codeDiff: {
      file: 'tests/pty_fuzz.rs',
      additions: 24,
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
    accent: '#5683da',
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
    toolArgs: '--agent "ui-preview-specialist" --role "IDE Synthesis"',
    sandboxLevel: 'Verified Workspace Root',
    permissionStatus: 'Auto-Permitted',
    thoughtSteps: [
      {
        id: 'a-1',
        title: 'Parsing multi-agent runtime topology and design tokens',
        meta: 'design.md · Token Contracts',
        detail: 'Audited color tokens: Charcoal #111111, Void #090a0c, Slate Edge #4a4b50 with solid accent palette.',
        status: 'done',
        timestamp: '14:02:17.120',
      },
      {
        id: 'a-2',
        title: 'Spawning concurrent subagent fibers for IDE simulation',
        meta: '5 worker nodes · IPC Channel :8080',
        detail: 'Dispatched dedicated worker threads for Claude Code, Codex, Antigravity, Aider, and Ollama.',
        status: 'done',
        timestamp: '14:02:17.650',
      },
      {
        id: 'a-3',
        title: 'Validating zero-bleed architectural visual contracts',
        meta: '0 gradients · Solid materials',
        detail: 'Eliminated radial blurs and background flares. Hardened layout borders to crisp high-contrast dark materials.',
        status: 'done',
        timestamp: '14:02:18.210',
      },
    ],
    codeDiff: {
      file: 'website/app/page.tsx',
      additions: 14,
      deletions: 2,
      lines: [
        { type: 'header', content: '@@ -18,8 +18,14 @@ export default function Home() {' },
        { type: 'del', oldNum: 18, newNum: '', content: '-      <LegacyAgentList />' },
        { type: 'del', oldNum: 19, newNum: '', content: '-      <BasicTerminalView />' },
        { type: 'add', oldNum: '', newNum: 18, content: '+      {/* Section 2: Light Linen Productivity Band */}' },
        { type: 'add', oldNum: '', newNum: 19, content: '+      <ProductivityLightGrid />' },
        { type: 'add', oldNum: '', newNum: 20, content: '+' },
        { type: 'add', oldNum: '', newNum: 21, content: '+      {/* Section 3: Collaborative Agent Orchestration Band */}' },
        { type: 'add', oldNum: '', newNum: 22, content: '+      <MultiAgentSwarmMatrix />' },
        { type: 'add', oldNum: '', newNum: 23, content: '+' },
        { type: 'add', oldNum: '', newNum: 24, content: '+      {/* Section 4: Dark Suite / MetaBrain Powerhouse */}' },
        { type: 'add', oldNum: '', newNum: 25, content: '+      <MetaBrainCapabilitiesSection />' },
      ],
    },
  },
  {
    id: 'aider',
    name: 'Aider',
    provider: 'Paul Gauthier Pair CLI',
    accent: '#8b5cf6',
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
        status: 'done',
        timestamp: '14:02:17.330',
      },
      {
        id: 'ai-2',
        title: 'Staging atomic patch hunk for PTY backpressure',
        meta: 'git add -p · 4 hunks staged',
        detail: 'Staged channel timeout and metric instrumentation without collateral workspace changes.',
        status: 'done',
        timestamp: '14:02:17.910',
      },
      {
        id: 'ai-3',
        title: 'Created signed Git commit: feat(pty): hardware backpressure sync',
        meta: 'commit c8f190a · GPG Verified',
        detail: 'Wrote commit object directly to local .git repository with verified signature.',
        status: 'done',
        timestamp: '14:02:18.330',
      },
    ],
    codeDiff: {
      file: 'src-tauri/src/pty.rs',
      additions: 8,
      deletions: 2,
      lines: [
        { type: 'header', content: '@@ -140,4 +140,8 @@ impl PtySession {' },
        { type: 'del', oldNum: 140, newNum: '', content: '-    self.writer.write_all(payload)?;' },
        { type: 'del', oldNum: 141, newNum: '', content: '-    self.writer.flush()?;' },
        { type: 'add', oldNum: '', newNum: 140, content: '+    self.backpressure_channel.send_with_timeout(' },
        { type: 'add', oldNum: '', newNum: 141, content: '+        payload,' },
        { type: 'add', oldNum: '', newNum: 142, content: '+        std::time::Duration::from_millis(50)' },
        { type: 'add', oldNum: '', newNum: 143, content: '+    )?;' },
        { type: 'add', oldNum: '', newNum: 144, content: '+    self.metrics.record_bytes_transferred(payload.len());' },
      ],
    },
  },
  {
    id: 'ollama',
    name: 'Ollama (Local LLM)',
    provider: '100% Offline Metal GPU',
    accent: '#ec4899',
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
        status: 'done',
        timestamp: '14:02:16.890',
      },
      {
        id: 'o-2',
        title: 'Offline static analysis & doc audit (0 cloud bytes)',
        meta: 'Air-gapped · RAM-only',
        detail: 'Validated memory-safety invariants across Tauri FFI boundaries with full privacy guarantee.',
        status: 'done',
        timestamp: '14:02:17.440',
      },
      {
        id: 'o-3',
        title: 'Generated verified offline security architecture spec',
        meta: 'docs/architecture.md · Markdown',
        detail: 'Authored offline guarantee specifications confirming all AST tokens reside exclusively in local memory.',
        status: 'done',
        timestamp: '14:02:18.110',
      },
    ],
    codeDiff: {
      file: 'docs/architecture.md',
      additions: 16,
      deletions: 0,
      lines: [
        { type: 'header', content: '@@ -1,3 +1,12 @@' },
        { type: 'add', oldNum: '', newNum: 1, content: '+## Offline Security Guarantee' },
        { type: 'add', oldNum: '', newNum: 2, content: '+No code, telemetry, or shell commands leave local RAM.' },
        { type: 'add', oldNum: '', newNum: 3, content: '+All neural weights execute directly on Apple Metal / CUDA.' },
        { type: 'add', oldNum: '', newNum: 4, content: '+Zero cloud telemetry egress verified via air-gapped firewall rules.' },
        { type: 'add', oldNum: '', newNum: 5, content: '+' },
        { type: 'add', oldNum: '', newNum: 6, content: '+```' },
        { type: 'add', oldNum: '', newNum: 7, content: '+Egress Policy: DROP ALL (lo0 only)' },
        { type: 'add', oldNum: '', newNum: 8, content: '+Telemetry: /dev/null' },
        { type: 'add', oldNum: '', newNum: 9, content: '+```' },
      ],
    },
  },
];

export function MultiAgentSwarmMatrix() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('claude');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
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
    'ai-3': true,
    'o-1': true,
    'o-2': true,
    'o-3': true,
  });
  const [copiedDiff, setCopiedDiff] = useState<boolean>(false);
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'running' | 'done'>('idle');

  const selectedAgent = AGENTS.find((a) => a.id === selectedAgentId) || AGENTS[0];

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const toggleAllSteps = () => {
    const currentAgentStepIds = selectedAgent.thoughtSteps.map((s) => s.id);
    const anyClosed = currentAgentStepIds.some((id) => !expandedSteps[id]);
    const nextState = { ...expandedSteps };
    currentAgentStepIds.forEach((id) => {
      nextState[id] = anyClosed;
    });
    setExpandedSteps(nextState);
  };

  const handleCopyDiff = () => {
    const raw = selectedAgent.codeDiff.lines.map((l) => l.content).join('\n');
    navigator.clipboard?.writeText(raw);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  const handleDispatchTask = () => {
    setDispatchStatus('running');
    setTimeout(() => {
      setDispatchStatus('done');
      setTimeout(() => setDispatchStatus('idle'), 3500);
    }, 900);
  };

  return (
    <section
      id="agent-swarm"
      className="relative bg-[#ffffff] text-[#090a0c] py-24 sm:py-32 border-t border-[#e5e5e7] overflow-hidden select-text"
    >
      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Crisp Architectural Typography */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#050506] tracking-tight leading-[1.08]">
            Orchestrate Together.{' '}
            <span className="font-serif italic font-normal text-[#303236]">Any Agent, Anywhere.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#6b6c6d] font-normal leading-relaxed">
            Run Claude Code, OpenAI Codex, Antigravity, Aider, and local Ollama models side-by-side.
            No proprietary lock-in. Total orchestrational freedom.
          </p>
        </div>

        {/* Flagship IDE Card Frame (Architectural Dark Materials: #111111 Charcoal, #090a0c Void, #4a4b50 Slate Edge) */}
        <div className="rounded-[12px] bg-[#111111] text-white border border-[#4a4b50]/60 shadow-[0_12px_48px_rgba(0,0,0,0.24)] overflow-hidden">
          
          {/* Top IDE Window Titlebar & Swarm Mesh Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#090a0c] border-b border-[#4a4b50]/50 text-xs font-mono text-[#a9a9aa]">
            {/* Window Controls + Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ef4444] border border-[#dc2626]/40 inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#eab308] border border-[#ca8a04]/40 inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#22c55e] border border-[#16a34a]/40 inline-block" />
              </div>
              <span className="text-[#6b6c6d] hidden sm:inline">|</span>
              <span className="text-[#d1d1d1] font-semibold tracking-wide flex items-center gap-2">
                <Terminal size={13} className="text-[#5683da]" />
                VIBEGRID MULTI-AGENT RUNTIME v2.4.0
              </span>
            </div>

            {/* Global Cluster Status */}
            <div className="flex items-center gap-4 text-[11px]">
              <span className="hidden md:flex items-center gap-1.5 text-[#a9a9aa]">
                <Cpu size={12} className="text-[#10b981]" />
                <span>5 / 5 NODES SYNCED</span>
              </span>
              <span className="hidden lg:flex items-center gap-1.5 text-[#a9a9aa]">
                <HardDrive size={12} className="text-[#5683da]" />
                <span>ZERO-EGRESS MESH</span>
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#111111] border border-[#4a4b50]/50 text-[#10b981]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                <span className="font-bold">LIVE PTY</span>
              </div>
            </div>
          </div>

          {/* Top Tab Bar: 5 Agent Tabs + Streaming Controls + Live Agent Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#111111] border-b border-[#4a4b50]/40">
            {/* 5 Agent Selector Tabs with Solid Accent Pips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {AGENTS.map((agent) => {
                const isSelected = selectedAgent.id === agent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-[8px] text-xs font-mono font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#303236] text-white border border-[#4a4b50]'
                        : 'bg-[#090a0c] text-[#a9a9aa] hover:text-white hover:bg-[#1a1b1e] border border-transparent'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: agent.accent }}
                    />
                    <span className="font-semibold">{agent.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected
                          ? 'bg-[#111111] text-[#d1d1d1] border border-[#4a4b50]/40'
                          : 'text-[#6b6c6d]'
                      }`}
                    >
                      {agent.model.split('-')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Header Controls: Pause/Play + Live Status */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-mono border transition-colors cursor-pointer ${
                  isStreaming
                    ? 'bg-[#090a0c] text-[#d1d1d1] border-[#4a4b50]/60 hover:bg-[#1a1b1e]'
                    : 'bg-[#303236] text-amber-300 border-amber-500/50'
                }`}
                title="Toggle real-time terminal stream"
              >
                {isStreaming ? (
                  <>
                    <Pause size={12} className="text-amber-400" />
                    <span>STREAMING</span>
                  </>
                ) : (
                  <>
                    <Play size={12} className="text-emerald-400" />
                    <span>PAUSED</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* IDE Split View: Left Panel (Workstream & Diff) + Right Panel (Telemetry & Controls) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#4a4b50]/40">
            
            {/* ========================================================= */}
            {/* LEFT PANEL: Hyper-Realistic Agent Workstream (7 Columns)  */}
            {/* ========================================================= */}
            <div className="lg:col-span-7 p-4 sm:p-6 font-mono text-xs bg-[#090a0c] flex flex-col justify-between space-y-6">
              
              <div className="space-y-5">
                {/* Terminal Sub-header & Breadcrumbs */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#4a4b50]/30 text-[#6b6c6d] text-[11px]">
                  <div className="flex items-center gap-2 text-[#d1d1d1]">
                    <FolderTree size={13} className="text-[#5683da]" />
                    <span className="text-white font-bold">{selectedAgent.breadcrumb}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#a9a9aa]">
                    <span>PID: <strong className="text-white">{selectedAgent.pid}</strong></span>
                    <span>TTY: <strong className="text-white">{selectedAgent.tty}</strong></span>
                    <span className="text-[#10b981]">0.4ms lat</span>
                  </div>
                </div>

                {/* Live Thought Tree with Collapsible Reasoning Steps */}
                <div>
                  <div className="flex items-center justify-between mb-3 text-[11px]">
                    <div className="flex items-center gap-2">
                      <Activity size={13} style={{ color: selectedAgent.accent }} />
                      <span className="uppercase tracking-wider font-bold text-[#d1d1d1]">
                        Live Reasoning Graph &amp; Execution Trace
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#111111] border border-[#4a4b50]/40 text-[10px] text-[#a9a9aa]">
                        {selectedAgent.thoughtSteps.length} Steps
                      </span>
                    </div>
                    <button
                      onClick={toggleAllSteps}
                      className="text-[11px] text-[#a9a9aa] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Expand / Collapse</span>
                    </button>
                  </div>

                  {/* Structured Thought Node List with Tree Lines */}
                  <div className="space-y-2 border-l border-[#4a4b50]/40 pl-3 ml-2">
                    {selectedAgent.thoughtSteps.map((step, idx) => {
                      const isExpanded = expandedSteps[step.id] ?? true;
                      const isLast = idx === selectedAgent.thoughtSteps.length - 1;

                      return (
                        <div
                          key={step.id}
                          className="rounded-[6px] bg-[#111111] border border-[#4a4b50]/40 overflow-hidden transition-all"
                        >
                          {/* Step Header / Trigger */}
                          <button
                            onClick={() => toggleStep(step.id)}
                            className="w-full text-left p-2.5 flex items-center justify-between gap-2 hover:bg-[#1a1b1e] cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown size={13} className="text-[#a9a9aa]" />
                              ) : (
                                <ChevronRight size={13} className="text-[#a9a9aa]" />
                              )}
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: selectedAgent.accent }}
                              />
                              <span
                                className={`text-[11px] font-medium ${
                                  isLast ? 'text-white font-bold' : 'text-[#d1d1d1]'
                                }`}
                              >
                                {step.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#6b6c6d] font-mono hidden sm:inline">
                                {step.meta}
                              </span>
                              <CheckCircle2 size={12} className="text-[#10b981]" />
                            </div>
                          </button>

                          {/* Expanded Step Body */}
                          {isExpanded && (
                            <div className="px-3 pb-2.5 pt-1 text-[11px] text-[#a9a9aa] border-t border-[#4a4b50]/20 bg-[#090a0c]/60">
                              <p className="leading-relaxed">{step.detail}</p>
                              <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#6b6c6d]">
                                <span>Timestamp: {step.timestamp}</span>
                                <span className="font-mono text-[#5683da]">STATUS: VERIFIED</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Syntax-Highlighted Unified Diff Viewer with Line Numbers */}
                <div className="rounded-[8px] bg-[#111111] border border-[#4a4b50]/60 overflow-hidden">
                  {/* Diff Header Bar */}
                  <div className="flex items-center justify-between px-3 py-2 bg-[#1a1b1e] border-b border-[#4a4b50]/40 text-[11px]">
                    <div className="flex items-center gap-2">
                      <FileCode size={13} className="text-[#5683da]" />
                      <span className="text-white font-bold">{selectedAgent.codeDiff.file}</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#090a0c] border border-[#4a4b50]/40 text-[10px] text-[#10b981] font-mono">
                        STAGED
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-[#10b981] font-bold">+{selectedAgent.codeDiff.additions}</span>
                        <span className="text-[#ef4444] font-bold">-{selectedAgent.codeDiff.deletions}</span>
                      </div>
                      <button
                        onClick={handleCopyDiff}
                        className="flex items-center gap-1 text-[10px] text-[#a9a9aa] hover:text-white bg-[#090a0c] px-2 py-0.5 rounded border border-[#4a4b50]/40 transition-colors cursor-pointer"
                        title="Copy diff snippet"
                      >
                        {copiedDiff ? <Check size={11} className="text-[#10b981]" /> : <Copy size={11} />}
                        <span>{copiedDiff ? 'COPIED' : 'COPY'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Diff Line-by-Line Unified Output */}
                  <div className="overflow-x-auto max-h-[260px] p-2 bg-[#090a0c] font-mono text-[11px] leading-snug">
                    <table className="w-full border-collapse">
                      <tbody>
                        {selectedAgent.codeDiff.lines.map((line, lIdx) => {
                          let rowClass = 'text-[#d1d1d1]';
                          let sign = ' ';
                          let signColor = 'text-[#6b6c6d]';

                          if (line.type === 'header') {
                            return (
                              <tr key={lIdx} className="bg-[#1a1b1e] text-[#a9a9aa] font-bold select-none">
                                <td colSpan={3} className="px-2 py-1 text-[10px] text-[#5683da]">
                                  {line.content}
                                </td>
                              </tr>
                            );
                          }

                          if (line.type === 'add') {
                            rowClass = 'bg-[#0d2818] text-[#86efac] border-l-2 border-[#10b981]';
                            sign = '+';
                            signColor = 'text-[#10b981] font-bold';
                          } else if (line.type === 'del') {
                            rowClass = 'bg-[#2a0f14] text-[#fca5a5] border-l-2 border-[#ef4444]';
                            sign = '-';
                            signColor = 'text-[#ef4444] font-bold';
                          }

                          return (
                            <tr key={lIdx} className={`${rowClass} hover:brightness-110 transition-all`}>
                              {/* Old Line Number */}
                              <td className="w-8 px-1.5 py-0.5 text-right text-[10px] text-[#6b6c6d] select-none font-mono">
                                {line.oldNum || ''}
                              </td>
                              {/* New Line Number */}
                              <td className="w-8 px-1.5 py-0.5 text-right text-[10px] text-[#6b6c6d] select-none font-mono">
                                {line.newNum || ''}
                              </td>
                              {/* Diff Sign + Content */}
                              <td className="px-2 py-0.5 whitespace-pre font-mono">
                                <span className={`inline-block w-3 ${signColor}`}>{sign}</span>
                                <span>{line.content.replace(/^[+-]/, '')}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Bottom Workstream Status: Active Tool Badge & Sandbox Permitted Indicator */}
              <div className="pt-3 border-t border-[#4a4b50]/30 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-[#6b6c6d]">Active Tool:</span>
                  <span className="px-2 py-0.5 rounded bg-[#111111] border border-[#4a4b50]/60 text-[#d97706] font-bold font-mono">
                    {selectedAgent.activeTool}()
                  </span>
                  <span className="text-[10px] text-[#a9a9aa] hidden sm:inline font-mono">
                    {selectedAgent.toolArgs}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#111111] border border-[#4a4b50]/50 text-[#10b981] font-mono text-[10px]">
                  <ShieldCheck size={12} className="text-[#10b981]" />
                  <span>{selectedAgent.sandboxLevel}</span>
                  <span className="text-[#6b6c6d]">·</span>
                  <span className="text-white">{selectedAgent.permissionStatus}</span>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT PANEL: Telemetry Gauges & Swarm Controller (5 Cols)  */}
            {/* ========================================================= */}
            <div className="lg:col-span-5 p-4 sm:p-6 bg-[#111111] flex flex-col justify-between space-y-6">
              
              <div className="space-y-5">
                {/* Panel Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#4a4b50]/30">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-[#5683da]" />
                    <span className="text-xs font-mono uppercase tracking-widest text-[#d1d1d1] font-bold">
                      Telemetry &amp; Controller
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50]/50 text-white">
                    {selectedAgent.provider}
                  </span>
                </div>

                {/* Telemetry Module 1: Inference Speed (Solid Progress Bar) */}
                <div className="p-3.5 rounded-[8px] bg-[#090a0c] border border-[#4a4b50]/40 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#a9a9aa] flex items-center gap-1.5">
                      <Zap size={12} className="text-[#10b981]" />
                      Inference Speed
                    </span>
                    <span className="text-[#10b981] font-bold text-sm">
                      {selectedAgent.tokenSpeed}
                    </span>
                  </div>
                  {/* Solid High-Precision Gauge */}
                  <div className="h-2 w-full bg-[#111111] rounded-full overflow-hidden border border-[#4a4b50]/30">
                    <div
                      className="h-full bg-[#10b981] transition-all duration-300 rounded-full"
                      style={{ width: `${selectedAgent.tokenSpeedValue}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#6b6c6d]">
                    <span>Peak: {selectedAgent.tokenSpeedPeak}</span>
                    <span>TTFT: {selectedAgent.ttft}</span>
                  </div>
                </div>

                {/* Telemetry Module 2: Context Window Load (Solid Progress Bar) */}
                <div className="p-3.5 rounded-[8px] bg-[#090a0c] border border-[#4a4b50]/40 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#a9a9aa] flex items-center gap-1.5">
                      <Layers size={12} className="text-[#5683da]" />
                      Context Load Gauge
                    </span>
                    <span className="text-[#5683da] font-bold text-sm">
                      {selectedAgent.contextUsage}
                    </span>
                  </div>
                  {/* Solid High-Precision Gauge */}
                  <div className="h-2 w-full bg-[#111111] rounded-full overflow-hidden border border-[#4a4b50]/30">
                    <div
                      className="h-full bg-[#5683da] transition-all duration-300 rounded-full"
                      style={{ width: `${selectedAgent.contextUsageValue}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#6b6c6d]">
                    <span>Rem: {selectedAgent.contextRemaining}</span>
                    <span>Max: {selectedAgent.contextCeiling}</span>
                  </div>
                </div>

                {/* Telemetry Module 3: Memory Allocation (RAM / VRAM) */}
                <div className="p-3.5 rounded-[8px] bg-[#090a0c] border border-[#4a4b50]/40 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#a9a9aa] flex items-center gap-1.5">
                      <HardDrive size={12} className="text-[#d97706]" />
                      Memory Allocation
                    </span>
                    <span className="text-[#d97706] font-bold text-sm">
                      {selectedAgent.memoryUsage}
                    </span>
                  </div>
                  {/* Segmented Solid Progress Bar */}
                  <div className="h-2 w-full bg-[#111111] rounded-full overflow-hidden border border-[#4a4b50]/30">
                    <div
                      className="h-full bg-[#d97706] transition-all duration-300 rounded-full"
                      style={{ width: `${selectedAgent.memoryUsageValue}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#6b6c6d]">
                    <span>Type: {selectedAgent.memoryType}</span>
                    <span>{selectedAgent.memoryResident}</span>
                  </div>
                </div>

                {/* Telemetry Module 4: Architecture & Protocol Specifications */}
                <div className="p-3.5 rounded-[8px] bg-[#090a0c] border border-[#4a4b50]/40 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#a9a9aa]">Architecture Mode</span>
                    <span className="text-white font-bold">{selectedAgent.architectureMode}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-[#6b6c6d]">
                    <span>IPC Pipe Protocol</span>
                    <span className="text-[#d1d1d1]">{selectedAgent.ipcProtocol}</span>
                  </div>
                </div>

                {/* Swarm Cluster Mesh Mini-Status Grid */}
                <div className="p-3 rounded-[8px] bg-[#090a0c] border border-[#4a4b50]/30">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#6b6c6d] mb-2 flex items-center justify-between">
                    <span>Swarm Cluster Status</span>
                    <span className="text-[#10b981]">All Systems Nominal</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[10px]">
                    {AGENTS.map((ag) => (
                      <div
                        key={ag.id}
                        className={`p-1 rounded border transition-colors ${
                          selectedAgent.id === ag.id
                            ? 'bg-[#303236] border-[#4a4b50] text-white'
                            : 'bg-[#111111] border-[#4a4b50]/20 text-[#a9a9aa]'
                        }`}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full mx-auto mb-1"
                          style={{ backgroundColor: ag.accent }}
                        />
                        <div className="truncate text-[9px]">{ag.name.split(' ')[0]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Swarm Controller Dispatch Action & Quick Tools */}
              <div className="space-y-3 pt-4 border-t border-[#4a4b50]/30">
                {/* Main Interactive Task Dispatch Button */}
                <button
                  onClick={handleDispatchTask}
                  disabled={dispatchStatus === 'running'}
                  className="w-full py-3 px-4 rounded-full bg-[#5683da] hover:bg-[#4672c7] active:bg-[#3a60a8] text-white font-sans text-xs font-bold tracking-tight transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-75"
                >
                  {dispatchStatus === 'running' ? (
                    <>
                      <RotateCcw size={14} className="animate-spin" />
                      <span>Dispatching Task to PTY #{selectedAgent.pid}...</span>
                    </>
                  ) : dispatchStatus === 'done' ? (
                    <>
                      <CheckCircle2 size={14} className="text-[#10b981]" />
                      <span>Task Synchronized with {selectedAgent.name}!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Dispatch Swarm Task to {selectedAgent.name}</span>
                    </>
                  )}
                </button>

                {/* Secondary Quick Action Bar */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <button
                    onClick={() => alert(`Running ${selectedAgent.activeTool}() sandbox check...`)}
                    className="py-2 px-2.5 rounded-[8px] bg-[#090a0c] hover:bg-[#1a1b1e] border border-[#4a4b50]/40 text-[#d1d1d1] hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Terminal size={11} className="text-[#5683da]" />
                    <span>Run Tool</span>
                  </button>
                  <button
                    onClick={() => alert(`Active PTY session /dev/${selectedAgent.tty} attached to local buffer.`)}
                    className="py-2 px-2.5 rounded-[8px] bg-[#090a0c] hover:bg-[#1a1b1e] border border-[#4a4b50]/40 text-[#d1d1d1] hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <ArrowUpRight size={11} className="text-[#10b981]" />
                    <span>Attach PTY</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

