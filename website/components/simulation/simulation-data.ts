import { AgentPaneConfig, AgentPaneId, SimulationLogLine, CommandExecutionResult } from './simulation-types';

export const PANE_CONFIGS: Record<AgentPaneId, AgentPaneConfig> = {
  claude: {
    id: 'claude',
    paneNumber: 1,
    title: 'agent-1: claude-code',
    agentName: 'Claude Code',
    provider: 'Anthropic CLI (v0.2.9)',
    cwd: '~/vibegrid/core',
    cmd: 'claude --auto-commit',
    accentColor: '#5683da',
    badge: 'CLAUDE ACTIVE',
    badgeColor: 'bg-[#111111] text-[#5683da] border-[#5683da]/50',
    initialStatus: 'Running Syn AST syntax pass...',
    telemetryMetric: 'TOKENS/SEC',
    telemetryValue: '88.4 tok/s',
  },
  cargo: {
    id: 'cargo',
    paneNumber: 2,
    title: 'agent-2: cargo-engine',
    agentName: 'Rust Cargo Engine',
    provider: 'Cargo Test Runner (v1.82-nightly)',
    cwd: '~/vibegrid/core',
    cmd: 'cargo test --workspace --benches',
    accentColor: '#27c93f',
    badge: 'CARGO PASSING',
    badgeColor: 'bg-[#111111] text-[#27c93f] border-[#27c93f]/50',
    initialStatus: 'Executing workspace unit & fuzz test suite...',
    telemetryMetric: 'BENCH LATENCY',
    telemetryValue: '0.42 μs / op',
  },
  nextjs: {
    id: 'nextjs',
    paneNumber: 3,
    title: 'sys: nextjs-dev-server',
    agentName: 'Next.js Dev Server',
    provider: 'Next.js 14.2 + Turbopack',
    cwd: '~/vibegrid/website',
    cmd: 'npm run dev',
    accentColor: '#ff8964',
    badge: 'HMR READY :3000',
    badgeColor: 'bg-[#111111] text-[#ff8964] border-[#ff8964]/50',
    initialStatus: 'Turbopack hot-reload pipeline listening...',
    telemetryMetric: 'FRAME RATE',
    telemetryValue: '60.0 FPS locked',
  },
  ollama: {
    id: 'ollama',
    paneNumber: 4,
    title: 'agent-4: ollama-local',
    agentName: 'Ollama Local',
    provider: 'Qwen 2.5 Coder 32B (Air-Gapped)',
    cwd: '~/vibegrid/mcp',
    cmd: 'ollama run qwen2.5-coder:32b',
    accentColor: '#ec4899',
    badge: 'OFFLINE 0 EGRESS',
    badgeColor: 'bg-[#111111] text-[#ec4899] border-[#ec4899]/50',
    initialStatus: 'Metal GPU weights loaded in unified memory (18.4 GB)...',
    telemetryMetric: 'NETWORK EGRESS',
    telemetryValue: '0.00 Bytes (100% Private)',
  },
};

export const INITIAL_LOGS: Record<AgentPaneId, SimulationLogLine[]> = {
  claude: [
    {
      id: 'cl-init-1',
      bullet: '●',
      bulletColor: 'text-[#5683da]',
      text: 'Spawning Rust PTY subprocess (PID 49102)...',
      timestamp: '20:51:01.120',
      type: 'info',
    },
    {
      id: 'cl-init-2',
      bullet: '⚡',
      bulletColor: 'text-[#ffbd2e]',
      text: 'Traversing AST syntax tree across 1,420 crate modules...',
      timestamp: '20:51:01.340',
      type: 'accent',
    },
    {
      id: 'cl-init-3',
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: 'Detected unhandled Option in src/middleware/auth.rs:L84',
      timestamp: '20:51:01.580',
      type: 'warn',
    },
    {
      id: 'cl-init-4',
      bullet: '→',
      bulletColor: 'text-[#5683da]',
      text: 'Proposing zero-copy patch with KEY_STORE claims verification...',
      timestamp: '20:51:01.810',
      type: 'info',
    },
  ],
  cargo: [
    {
      id: 'cg-init-1',
      bullet: '●',
      bulletColor: 'text-[#27c93f]',
      text: 'Compiling vibegrid-core v0.1.0 with SIMD AVX-512 optimizations',
      timestamp: '20:51:01.080',
      type: 'info',
    },
    {
      id: 'cg-init-2',
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: 'test middleware::auth::test_token_claims_verification ... ok [0.42ms]',
      timestamp: '20:51:01.290',
      type: 'success',
    },
    {
      id: 'cg-init-3',
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: 'test pty::ringbuffer::test_backpressure_drain_rate ... ok [0.18ms]',
      timestamp: '20:51:01.440',
      type: 'success',
    },
    {
      id: 'cg-init-4',
      bullet: '⚡',
      bulletColor: 'text-[#ffbd2e]',
      text: 'bench: pty_stream_throughput/64kb ... 2.84 GB/s (352.1 ns/iter)',
      timestamp: '20:51:01.710',
      type: 'accent',
    },
  ],
  nextjs: [
    {
      id: 'nx-init-1',
      bullet: '➜',
      bulletColor: 'text-[#ff8964]',
      text: '▲ Next.js 14.2.35 - Ready in 620ms on http://localhost:3000',
      timestamp: '20:51:00.900',
      type: 'info',
    },
    {
      id: 'nx-init-2',
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: 'Compiled / (client and server) in 142ms (684 modules)',
      timestamp: '20:51:01.110',
      type: 'success',
    },
    {
      id: 'nx-init-3',
      bullet: '⚡',
      bulletColor: 'text-[#ffbd2e]',
      text: '[HMR] Connected to WebGL 2.0 grid canvas pipeline',
      timestamp: '20:51:01.360',
      type: 'accent',
    },
    {
      id: 'nx-init-4',
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: '[Canvas] 0 dropped frames · 60.0 FPS locked (120Hz VSync ready)',
      timestamp: '20:51:01.620',
      type: 'success',
    },
  ],
  ollama: [
    {
      id: 'ol-init-1',
      bullet: '●',
      bulletColor: 'text-[#ec4899]',
      text: 'Qwen 2.5 Coder 32B loaded in VRAM (18.4 GB unified Apple Metal)',
      timestamp: '20:51:00.820',
      type: 'info',
    },
    {
      id: 'ol-init-2',
      bullet: '🔒',
      bulletColor: 'text-[#27c93f]',
      text: 'Air-Gapped: lo0 loopback only · 0 network egress tokens allowed',
      timestamp: '20:51:01.050',
      type: 'success',
    },
    {
      id: 'ol-init-3',
      bullet: '⚡',
      bulletColor: 'text-[#ffbd2e]',
      text: 'Inference TTFT: 92ms · Processing 4,096 context tokens @ 48.4 tok/s',
      timestamp: '20:51:01.310',
      type: 'accent',
    },
    {
      id: 'ol-init-4',
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: '0 bytes sent to cloud · 100% On-Device Privacy',
      timestamp: '20:51:01.590',
      type: 'success',
    },
  ],
};

// Continuous streaming step scripts for each pane in the live simulation loop
export const STREAMING_SCRIPT: Record<AgentPaneId, Array<{
  bullet: string;
  bulletColor: string;
  text: string;
  status: string;
  type?: 'info' | 'success' | 'warn' | 'error' | 'accent';
}>> = {
  claude: [
    {
      bullet: '●',
      bulletColor: 'text-[#5683da]',
      text: 'AST analysis: parsing symbols in src/middleware/auth.rs...',
      status: 'Parsing AST syntax tree...',
      type: 'info',
    },
    {
      bullet: '⚡',
      bulletColor: 'text-[#ffbd2e]',
      text: 'Detected unhandled Option in auth_middleware.rs:L84 [CWE-252]',
      status: 'Vulnerability identified: auth panic risk',
      type: 'warn',
    },
    {
      bullet: '→',
      bulletColor: 'text-[#5683da]',
      text: 'Synthesizing patch: replacing raw token slice with extract_bearer_token()',
      status: 'Generating zero-copy Rust patch...',
      type: 'accent',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: 'Added KEY_STORE.verify_claims() validation boundary',
      status: 'Patch applied to src/middleware/auth.rs',
      type: 'success',
    },
    {
      bullet: '●',
      bulletColor: 'text-[#5683da]',
      text: 'Executing static check: cargo check --quiet',
      status: 'Verifying lifetime bounds...',
      type: 'info',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: 'Static verification PASSED: 0 warnings, 0 errors',
      status: 'Verification verified [0 errors]',
      type: 'success',
    },
    {
      bullet: '⚡',
      bulletColor: 'text-[#ff8964]',
      text: 'Staging atomic git commit: fix(auth): enforce JWT claims verification',
      status: 'Commit object signed with GPG key',
      type: 'accent',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: 'Agent pipeline idle · Standing by for next command dispatch',
      status: 'Claude Code ready',
      type: 'success',
    },
  ],
  cargo: [
    {
      bullet: '●',
      bulletColor: 'text-[#27c93f]',
      text: 'Running cargo test --workspace (48 total unit tests)',
      status: 'Running unit test matrix...',
      type: 'info',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: 'test middleware::auth::test_token_claims_verification ... ok [0.42ms]',
      status: 'Claims verification test PASSED',
      type: 'success',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: 'test middleware::auth::test_malformed_token_rejection ... ok [0.19ms]',
      status: 'Security fuzzing test PASSED',
      type: 'success',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: 'test pty::ringbuffer::test_backpressure_drain_rate ... ok [0.18ms]',
      status: 'Ringbuffer drain test PASSED',
      type: 'success',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: 'test ipc::shared_mem::test_zero_copy_dispatch ... ok [0.08ms]',
      status: 'Shared memory latency: 0.08ms',
      type: 'success',
    },
    {
      bullet: '⚡',
      bulletColor: 'text-[#ffbd2e]',
      text: 'Criterion microbenchmark: pty_stream_throughput: 2.84 GB/s (352.1 ns/iter)',
      status: 'Microsecond benchmark completed',
      type: 'accent',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: 'test result: ok. 48 passed; 0 failed; finished in 0.38s',
      status: 'Cargo workspace test: 100% green',
      type: 'success',
    },
    {
      bullet: '●',
      bulletColor: 'text-[#27c93f]',
      text: 'PTY Master Stream active · 0 dropped bytes in IPC ringbuffer',
      status: 'Cargo engine ready',
      type: 'info',
    },
  ],
  nextjs: [
    {
      bullet: '➜',
      bulletColor: 'text-[#ff8964]',
      text: '[HMR] Detected change in components/FloatingProductFrame.tsx',
      status: 'Triggering Fast Refresh...',
      type: 'info',
    },
    {
      bullet: '○',
      bulletColor: 'text-[#ff8964]',
      text: 'Compiling / (client and server) with Turbopack native engine...',
      status: 'Turbopack compiling 684 modules...',
      type: 'info',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: 'Compiled / in 84ms (0 module graph cycles)',
      status: 'HMR update delivered in 84ms',
      type: 'success',
    },
    {
      bullet: '⚡',
      bulletColor: 'text-[#ffbd2e]',
      text: '[WebGL] Synchronized 4 terminal pane textures (1.2ms latency)',
      status: 'WebGL shader context synced',
      type: 'accent',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: '[FPS Lock] 60.0 FPS steady · 0 jank frames on ProMotion 120Hz',
      status: 'Rendering locked @ 60.0 FPS',
      type: 'success',
    },
    {
      bullet: '➜',
      bulletColor: 'text-[#ff8964]',
      text: '[Vite/Next] IPC socket heartbeat :3000 acknowledged',
      status: 'Next.js Dev Server online',
      type: 'info',
    },
  ],
  ollama: [
    {
      bullet: '●',
      bulletColor: 'text-[#ec4899]',
      text: 'Local MCP Tool call: audit_security_invariants(file="auth.rs")',
      status: 'Offline LLM security evaluation...',
      type: 'info',
    },
    {
      bullet: '🔒',
      bulletColor: 'text-[#27c93f]',
      text: 'Air-gap firewall verification: 0 network sockets active (lo0 only)',
      status: '0 egress bytes verified',
      type: 'success',
    },
    {
      bullet: '⚡',
      bulletColor: 'text-[#ffbd2e]',
      text: 'Inference streaming: 48.2 tok/s · TTFT: 88ms on Apple Metal GPU',
      status: 'Generating local tokens...',
      type: 'accent',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: 'Audit Result: "Zero memory-safety vulnerabilities or unsafe blocks found"',
      status: 'Security invariant confirmed',
      type: 'success',
    },
    {
      bullet: '●',
      bulletColor: 'text-[#ec4899]',
      text: 'Model weights quantized Q4_K_M resident in unified VRAM (18.4 GB)',
      status: 'Ollama local inference ready',
      type: 'info',
    },
  ],
};

// Symphony sequence: coordinated synchronized action across all 4 panes simultaneously
export const SYMPHONY_SEQUENCE: Record<AgentPaneId, Array<{
  bullet: string;
  bulletColor: string;
  text: string;
  status: string;
  type?: 'info' | 'success' | 'warn' | 'error' | 'accent';
}>> = {
  claude: [
    {
      bullet: '🔮',
      bulletColor: 'text-[#5683da]',
      text: '★ SYMPHONY: Dispatched global AST synthesis across workspace...',
      status: 'Symphony: AST synthesis active',
      type: 'accent',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: '★ SYMPHONY: Claims verification patch broadcast to cargo test runner',
      status: 'Symphony: Patch broadcast complete',
      type: 'success',
    },
  ],
  cargo: [
    {
      bullet: '🔮',
      bulletColor: 'text-[#27c93f]',
      text: '★ SYMPHONY: Received AST patch -> Triggered instantaneous workspace test',
      status: 'Symphony: Running 48 test suites',
      type: 'accent',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: '★ SYMPHONY: 48/48 tests passed in 0.31s (0 errors, 100% green checkmarks)',
      status: 'Symphony: Tests passed 100%',
      type: 'success',
    },
  ],
  nextjs: [
    {
      bullet: '🔮',
      bulletColor: 'text-[#ff8964]',
      text: '★ SYMPHONY: HMR Hot Reload triggered across 4 WebGL terminal textures',
      status: 'Symphony: WebGL re-render in 0.8ms',
      type: 'accent',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: '★ SYMPHONY: WebGL canvas synchronized with 0 dropped frames @ 60.0 FPS',
      status: 'Symphony: 60 FPS locked',
      type: 'success',
    },
  ],
  ollama: [
    {
      bullet: '🔮',
      bulletColor: 'text-[#ec4899]',
      text: '★ SYMPHONY: Offline local LLM validated zero network egress across cluster',
      status: 'Symphony: Air-gap verified',
      type: 'accent',
    },
    {
      bullet: '✔',
      bulletColor: 'text-[#27c93f]',
      text: '★ SYMPHONY: 0 cloud bytes egressed · 100% local privacy preserved',
      status: 'Symphony: 0 egress guaranteed',
      type: 'success',
    },
  ],
};

// Command executor library: responds dynamically to custom typed commands
export const COMMAND_RESPONSES: Record<string, CommandExecutionResult> = {
  'cargo test': {
    targetPane: 'cargo',
    command: 'cargo test --workspace',
    outputLines: [
      { bullet: '●', bulletColor: 'text-[#27c93f]', text: 'Running cargo test --workspace (48 tests)', type: 'info' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'test middleware::auth::test_token_claims ... ok [0.42ms]', type: 'success' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'test pty::ringbuffer::test_backpressure ... ok [0.18ms]', type: 'success' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'test result: ok. 48 passed; 0 failed in 0.38s', type: 'success' },
    ],
    statusUpdate: 'cargo test: 48 passed (0 failed)',
  },
  'git diff': {
    targetPane: 'claude',
    command: 'git diff src/middleware/auth.rs',
    outputLines: [
      { bullet: '●', bulletColor: 'text-[#5683da]', text: 'diff --git a/src/middleware/auth.rs b/src/middleware/auth.rs', type: 'info' },
      { bullet: '−', bulletColor: 'text-[#ef4444]', text: '-    let token = req.headers().get("Authorization")?;', type: 'diff' },
      { bullet: '+', bulletColor: 'text-[#27c93f]', text: '+    let token = extract_bearer_token(req)?;', type: 'diff' },
      { bullet: '+', bulletColor: 'text-[#27c93f]', text: '+    let claims = token.verify_claims(&KEY_STORE)?;', type: 'diff' },
    ],
    statusUpdate: 'git diff: +12 -3 lines in auth.rs',
  },
  'claude --fix': {
    targetPane: 'claude',
    command: 'claude --fix "auth.rs"',
    outputLines: [
      { bullet: '●', bulletColor: 'text-[#5683da]', text: 'Claude Code: analyzing syntax tree for auth.rs...', type: 'info' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'Synthesized zero-copy claims verification patch', type: 'success' },
      { bullet: '⚡', bulletColor: 'text-[#ffbd2e]', text: 'Static verification: cargo check -> 0 errors', type: 'accent' },
    ],
    statusUpdate: 'Claude Code: fix applied and verified',
  },
  'ollama run': {
    targetPane: 'ollama',
    command: 'ollama run qwen2.5-coder:32b',
    outputLines: [
      { bullet: '●', bulletColor: 'text-[#ec4899]', text: 'Qwen 2.5 Coder 32B loaded on Metal GPU (18.4 GB)', type: 'info' },
      { bullet: '🔒', bulletColor: 'text-[#27c93f]', text: 'Zero cloud telemetry · Air-gapped local execution', type: 'success' },
      { bullet: '⚡', bulletColor: 'text-[#ffbd2e]', text: 'Tokens: 48.4 tok/s · TTFT: 88ms · 0 egress bytes', type: 'accent' },
    ],
    statusUpdate: 'Ollama: Qwen 2.5 Coder ready (offline)',
  },
  'npm run dev': {
    targetPane: 'nextjs',
    command: 'npm run dev',
    outputLines: [
      { bullet: '➜', bulletColor: 'text-[#ff8964]', text: '▲ Next.js 14.2.35 ready on http://localhost:3000', type: 'info' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: '[HMR] WebGL canvas pipeline locked at 60.0 FPS', type: 'success' },
    ],
    statusUpdate: 'Next.js: dev server running on :3000',
  },
  'bench': {
    targetPane: 'cargo',
    command: 'cargo bench',
    outputLines: [
      { bullet: '⚡', bulletColor: 'text-[#ffbd2e]', text: 'pty_ringbuffer_push: 14.2 ns/iter (zero-copy)', type: 'accent' },
      { bullet: '⚡', bulletColor: 'text-[#ffbd2e]', text: 'pty_stream_throughput: 2.84 GB/s (352.1 ns/iter)', type: 'accent' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'Benchmark suite completed: optimal latency achieved', type: 'success' },
    ],
    statusUpdate: 'Criterion: 2.84 GB/s throughput',
  },
  'status': {
    targetPane: 'claude',
    command: 'vibegrid status',
    outputLines: [
      { bullet: '●', bulletColor: 'text-[#5683da]', text: 'Cluster Health: 4/4 Panes Online · WebGL 60.0 FPS', type: 'info' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'PTY IPC Latency: 1.1ms · 0 dropped frames', type: 'success' },
      { bullet: '🔒', bulletColor: 'text-[#ec4899]', text: 'Network Egress: 0.00 Bytes (100% Local)', type: 'success' },
    ],
    statusUpdate: 'VibeGrid Cluster: Healthy (4 Panes Synced)',
  },
  'help': {
    targetPane: 'claude',
    command: 'help',
    outputLines: [
      { bullet: '?', bulletColor: 'text-[#5683da]', text: 'Available commands:', type: 'info' },
      { bullet: '→', bulletColor: 'text-[#a9a9aa]', text: 'cargo test | git diff | claude --fix | ollama run | bench | status | symphony | clear', type: 'info' },
    ],
    statusUpdate: 'Help displayed',
  },
};

// Preset command pills for user convenience in the UI
export const PRESET_COMMAND_PILLS = [
  { label: 'cargo test --workspace', cmd: 'cargo test' },
  { label: 'git diff auth.rs', cmd: 'git diff' },
  { label: 'claude --fix', cmd: 'claude --fix' },
  { label: 'ollama run qwen2.5', cmd: 'ollama run' },
  { label: 'cargo bench', cmd: 'bench' },
  { label: 'vibegrid status', cmd: 'status' },
];
