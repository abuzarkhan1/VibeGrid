# VibeGrid AI Agent Orchestration & Developer Experience (DX) Specification
## Transforming VibeGrid into the Ultimate AI Agent Command Center

---

## 1. Executive Summary & Architectural Paradigm Shift

VibeGrid was engineered as a high-performance, GPU-accelerated, multi-pane terminal workspace capable of rendering up to 16 concurrent PTY sessions at 60 FPS with sub-10ms keystroke latency. While human developers use terminals interactively, **AI Coding Agents (Claude Code, OpenAI Codex/CLI, Aider, OpenHands, Devin-style loops, and local LLMs via Ollama/vLLM)** interact with terminals as automated execution environments—streaming hundreds of lines of code, invoking command-line tools, performing file edits, and querying state at machine velocity.

To make VibeGrid the definitive **AI Agent Command Center**, we specify an evolution from a *passive terminal multiplexer* to an *intelligent agent orchestration supervisor*. This document establishes the complete architectural and UX specification for:
1. **Live Agent Supervisor Grid**: Automatic parsing of agent thought processes, tool executions, and file edits with real-time visual telemetry badges.
2. **Real-time MCP Visualizer & Inspector**: Interactive telemetry console for JSON-RPC tool calls, buffer snapshots, and IPC latency metrics.
3. **Interactive Permission / Action Approval Modal**: Zero-trust heuristic interceptor protecting against destructive shell commands with diff previews and feedback loops.
4. **Multi-Pane Broadcast & Synchronization Mode**: Coordinated input mirroring with visual group sync badges.
5. **Terminal Ghost Text & Context-Aware Auto-suggestions**: Workspace-aware inline command autocomplete.
6. **Voice Dictation & Transcript Editor Drawer**: Noise-gated Whisper audio stream with an edit-before-send prompt interface.

---

## 2. Deep Analysis of AI Agent Workflows & VibeGrid Backend Architecture

```
                                  AI AGENT COMMAND CENTER DATA FLOW
                                  
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                           EXTERNAL AGENT WORKFLOWS                                     │
  │  Claude Code  │  Aider  │  OpenHands  │  OpenAI Codex  │  Local LLMs (Ollama/DeepSeek) │
  └───────┬───────────────────────────┬───────────────────────────────────┬────────────────┘
          │ (PTY Stdio Stream)        │ (MCP JSON-RPC / SSE)              │ (HTTP State API)
          ▼                           ▼                                   ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                            VIBEGRID TAURI / RUST BACKEND                               │
  │                                                                                        │
  │  ┌──────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────┐  │
  │  │   PTY Manager        │   │   MCP Server (stdio/HTTP) │   │  Axum HTTP Server     │  │
  │  │   (openpty/portable) │   │   - vibegrid_get_panes    │   │  - /panes (auth token)│  │
  │  │   - Master/Slave FDs │   │   - vibegrid_exec_cmd     │   │  - /events (SSE)      │  │
  │  │   - PTY Interceptor  │   │   - vibegrid_approval     │   │  - /supervisor/state  │  │
  │  └──────────┬───────────┘   └─────────────┬─────────────┘   └───────────┬───────────┘  │
  │             │                             │                             │              │
  │             └──────────────────────┬──────┴─────────────────────────────┘              │
  │                                    ▼                                                   │
  │                     ┌─────────────────────────────┐                                    │
  │                     │   IPC Batcher (16ms / 60FPS)│                                    │
  │                     │   - UTF-8 Boundary Guard    │                                    │
  │                     │   - Semantic Agent Parser   │                                    │
  │                     │   - 256KB Ring Buffer       │                                    │
  │                     └──────────────┬──────────────┘                                    │
  └────────────────────────────────────┼───────────────────────────────────────────────────┘
                                       │ Tauri Event Bridge (`terminal-batch`, `agent-telemetry`, `mcp-call`)
                                       ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                            VIBEGRID REACT / ZUSTAND FRONTEND                           │
  │                                                                                        │
  │  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
  │  │  Live Agent Supervisor Grid (HUD, Status Badges, Sparklines, Token Velocity)     │  │
  │  ├────────────────────────────┬─────────────────────────────┬───────────────────────┤  │
  │  │ xterm.js GPU Terminal Panes│ Real-time MCP Visualizer    │ Permission Approval   │  │
  │  │ - Ghost Text Engine        │ - Tool Call Inspector       │ - Diff Preview Modal  │  │
  │  │ - Broadcast Sync Badges    │ - Latency Histogram         │ - Feedback Rejector   │  │
  │  ├────────────────────────────┴─────────────────────────────┴───────────────────────┤  │
  │  │ Voice Dictation & Transcript Editor Drawer (Whisper DSP, Noise Gate, Prompt HUD) │  │
  │  └──────────────────────────────────────────────────────────────────────────────────┘  │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Agent Workflow Modalities
1. **Interactive CLI Loops (Claude Code, Aider, OpenHands CLI)**:
   - Run inside a standard PTY slave.
   - Emit rich ANSI escapes, markdown blocks, progress spinners, and status lines.
   - Require user confirmation prompts (e.g. `[y/n]`, `(A)ccept/(R)eject`) or execute in autonomous sub-loops.
2. **MCP Client/Server Agents (Devin-style autonomous workers, Cursor background agents)**:
   - Connect via MCP (`src-tauri/src/mcp_server.rs`) over stdio or local HTTP bridge (`http_server.rs:8792`).
   - Query pane state (`vibegrid_get_panes`), send keystrokes, and coordinate multi-step refactors across panes.
3. **Local LLMs (Ollama, llama.cpp, vLLM)**:
   - High token velocity with bursty stdout flushes.
   - Run alongside local build/test watchers, demanding low IPC jitter and high backpressure headroom.

### 2.2 Current Backend Audit (`src-tauri/src/mcp_server.rs` & `src-tauri/src/http_server.rs`)
- **Existing Strengths**:
  - `IpcBatcher` (`batcher.rs`) batches terminal stdout every 16ms (~60 FPS), avoids UTF-8 splitting, and enforces a 10MB/1MB watermark backpressure loop.
  - HTTP Server (`http_server.rs`) features bearer token authentication persisted to `~/.vibegrid/token` with `0600` permissions and fallback port binding (`8792..8797`).
  - Read-only sliding window (`MCP_OUTPUT_CAP_BYTES = 32KB`) returns the most recent output per pane.
- **Architectural Gaps & Required Expansions**:
  1. **Read-Only MCP Limitation**: MCP only implements `vibegrid_get_panes`. It lacks active control tools: `vibegrid_exec_command`, `vibegrid_send_keys`, `vibegrid_split_pane`, `vibegrid_wait_for_output`, and `vibegrid_request_approval`.
  2. **No Semantic Stream Parsing**: Terminal output is treated as raw ANSI bytes. The backend has no structured awareness of whether an agent is thinking, running a tool, editing a file, or blocked on user approval.
  3. **Zero Pre-Execution Guardrails**: If an agent issues `rm -rf /` or `git push --force` directly into the PTY stream, it executes immediately without approval.

---

## 3. Live Agent Supervisor Grid Specification

The **Agent Supervisor Grid** transforms standard terminal title bars into an interactive telemetry and state management HUD.

```
+---------------------------------------------------------------------------------------------------------+
| [1] ● Claude Code | auth-service | main* | 2.4k t/m | $0.042   [THINKING: Planning OAuth2 Callback...] ⚙ 🗖 🗙|
+---------------------------------------------------------------------------------------------------------+
| > Investigating src/auth/oauth.ts...                                                                    |
|                                                                                                         |
| ╭── Thought Process ──────────────────────────────────────────────────────────────────────────────────╮ |
| │ The refresh token rotation needs an atomic Redis transaction to prevent race conditions during     │ │
| │ rapid concurrent token refreshes.                                                                   │ │
| ╰─────────────────────────────────────────────────────────────────────────────────────────────────────╯ |
| $ git diff src/auth/oauth.ts                                                                            |
+---------------------------------------------------------------------------------------------------------+
```

### 3.1 Agent Lifecycle State Machine & Stream Parsing
The IPC Batcher and frontend state engine implement a lightweight streaming parser that identifies agent states using signature ANSI patterns and regex matchers:

```typescript
export type AgentState = 
  | 'idle'
  | 'thinking'       // Agent is generating reasoning or chain-of-thought
  | 'tool_executing'  // Running shell command, linter, tests
  | 'file_editing'    // Writing diffs, updating files
  | 'awaiting_input'  // Paused for human approval or prompt
  | 'streaming'       // Fast token generation
  | 'error'           // Process exited with non-zero or exception
  | 'completed';      // Task finished successfully
```

#### Signature Detection Table:
| Agent / Tool | Trigger Pattern (Regex / ANSI sequence) | Detected State |
| :--- | :--- | :--- |
| **Claude Code** | `╭── Thought|Thinking\.\.\.|Evaluating\.\.\.` | `thinking` |
| **Claude Code** | `Running tool: ([a-zA-Z0-9_-]+)` | `tool_executing` |
| **Aider** | `Applied edit to ([^\s]+)|Updating [^\s]+ with diff` | `file_editing` |
| **OpenHands** | `AGENT STATE: (WAITING_USER_INPUT|PAUSED)` | `awaiting_input` |
| **Generic CLI** | `\? (Allow|Confirm|Do you want to proceed\?) \[y/N\]` | `awaiting_input` |
| **All Agents** | `Process finished with exit code [1-9]|FATAL|Panic` | `error` |

### 3.2 Supervisor UI Controls & Micro-HUD
Each pane frame (`TerminalToolbar.tsx`) is augmented with:
1. **Pulsing Agent Status Pill**:
   - `THINKING`: Purple pulse with brain icon and animated shimmer.
   - `TOOL EXEC`: Cyan badge with terminal/gear icon and active command tooltip.
   - `DIFF/EDIT`: Emerald badge showing `+42 / -12 lines` across modified files.
   - `AWAITING INPUT`: High-visibility pulsing amber warning badge.
   - `ERROR`: Solid crimson badge with error snippet popover.
2. **Telemetry Sparklines & Velocity Meter**:
   - Live Token Velocity counter (`Tokens/sec` or `Chars/sec`).
   - Cumulative session cost calculator (for API-driven agents via MCP reporting).
3. **Agent Metadata Tagging**:
   - Model Identifier badge (e.g., `Claude 3.7 Sonnet`, `o3-mini`, `DeepSeek R1`).
   - Active Git branch and dirty working tree status badge.
4. **Global Supervisor Drawer (`Mod+Shift+A`)**:
   - Matrix overview showing all running agents across all workspaces.
   - "Pause All Agents", "Resume All", and "Cancel Pending Tasks" emergency kill-switches.

---

## 4. Real-time MCP Visualizer & Protocol Inspector

An interactive, dockable inspector pane that visualizes all Model Context Protocol traffic flowing through VibeGrid's backend.

```
+─────────────────────────────────────────────────────────────────────────────────────────────────────────+
│ MCP PROTOCOL INSPECTOR [🟢 Connected - Port 8792] [Traffic: 14.2 req/s] [Avg Latency: 2.1ms]         🗙│
+────────────────────────────────┬────────────────────────────────────────────────────────────────────────+
│ TIME     METHOD     TOOL       │ REQUEST / RESPONSE PAYLOAD INSPECTOR                                   │
+────────────────────────────────┼────────────────────────────────────────────────────────────────────────+
│ 22:04:01 call       get_panes  │ // JSON-RPC 2.0 Request (ID: 104)                                      │
│ 22:04:05 call       exec_cmd   │ {                                                                      │
│ 22:04:08 call       req_apprv  │   "method": "tools/call",                                              │
│ 22:04:12 notify     output_sync│   "params": {                                                          │
│                                │     "name": "vibegrid_exec_command",                                   │
│                                │     "arguments": {                                                     │
│                                │       "paneId": "term-173849201",                                      │
│                                │       "command": "cargo test --workspace"                              │
│                                │     }                                                                  │
│                                │   }                                                                    │
│                                │ }                                                                      │
│                                │ ────────────────────────────────────────────────────────────────────── │
│                                │ // Result: {"status": "dispatched", "latency_ms": 1.84}                │
+────────────────────────────────┴────────────────────────────────────────────────────────────────────────+
│ BUFFER METRICS: Pane 1: 32KB/256KB | Pane 2: 128KB/256KB | Backpressure: 0 | Dropped: 0               │
+─────────────────────────────────────────────────────────────────────────────────────────────────────────+
```

### 4.1 Extended MCP Server Capabilities (`mcp_server.rs`)
The MCP server protocol definition is expanded from read-only to full two-way orchestration:

```json
{
  "tools": [
    {
      "name": "vibegrid_get_panes",
      "description": "Get output buffers, active processes, and metadata for all terminal panes",
      "inputSchema": { "type": "object", "properties": {} }
    },
    {
      "name": "vibegrid_exec_command",
      "description": "Execute a shell command inside a specific terminal pane",
      "inputSchema": {
        "type": "object",
        "properties": {
          "paneId": { "type": "string" },
          "command": { "type": "string" },
          "requireApproval": { "type": "boolean", "default": true }
        },
        "required": ["paneId", "command"]
      }
    },
    {
      "name": "vibegrid_split_pane",
      "description": "Split an existing pane horizontally or vertically to spin up a subagent",
      "inputSchema": {
        "type": "object",
        "properties": {
          "targetPaneId": { "type": "string" },
          "direction": { "type": "string", "enum": ["horizontal", "vertical"] },
          "initialCommand": { "type": "string" }
        },
        "required": ["targetPaneId", "direction"]
      }
    },
    {
      "name": "vibegrid_request_approval",
      "description": "Request human developer permission for a high-impact action with diff preview",
      "inputSchema": {
        "type": "object",
        "properties": {
          "actionType": { "type": "string", "enum": ["shell_command", "file_delete", "force_push", "package_install"] },
          "command": { "type": "string" },
          "diff": { "type": "string" },
          "rationale": { "type": "string" }
        },
        "required": ["actionType", "command", "rationale"]
      }
    }
  ]
}
```

### 4.2 Visualizer Features & Telemetry
1. **Live JSON-RPC Stream Table**: Color-coded incoming requests, response durations, and error rates.
2. **Buffer Snapshot Viewer**: Live inspection of pane raw ANSI vs clean text sliding buffers (`tail` buffers).
3. **Latency & Throughput Histograms**: Real-time rendering of IPC batching intervals, HTTP round-trip times, and WebSocket message frequencies.
4. **Export & Replay**: Ability to export agent session traces (`.jsonl`) for evaluation and debugging.

---

## 5. Interactive Permission & Action Approval Modal

Autonomous agents frequently execute high-risk terminal commands that can result in data loss, broken branches, or environment pollution. The **Interactive Action Approval Guard** intercepts risky commands before execution.

```
+─────────────────────────────────────────────────────────────────────────────────────────────────────────+
│ ⚠️ HIGH-RISK ACTION APPROVAL REQUIRED                                                                 🗙│
+─────────────────────────────────────────────────────────────────────────────────────────────────────────+
│ Agent "Claude Code" in Pane 2 (auth-service) requested execution of a destructive command:              │
│                                                                                                         │
│ 🛑 COMMAND:                                                                                             │
│    rm -rf ./node_modules ./dist && npm install                                                          │
│                                                                                                         │
│ 📝 RATIONALE:                                                                                           │
│    "Cleaning stale native build artifacts to resolve module linking discrepancy."                       │
│                                                                                                         │
│ 🔍 IMPACT PREVIEW / DIFF:                                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Target Directory: /Users/abuzar/Desktop/VibeGrid/node_modules (842 MB, 24,190 files)                │ │
│ │ Target Directory: /Users/abuzar/Desktop/VibeGrid/dist (4.2 MB, 18 files)                            │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                         │
│ 💬 Provide Feedback on Rejection:                                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ e.g. "Do not delete node_modules, only run 'npm run clean' inside dist/"                            │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                         │
│ [❌ Reject with Feedback (Esc)] [🛡️ Dry Run] [⚡ Allow Once (Cmd+Enter)] [✅ Always Allow in CWD]        │
+─────────────────────────────────────────────────────────────────────────────────────────────────────────+
```

### 5.1 Command Risk Classification Engine
A dual-layer heuristic analyzer in Rust (`src-tauri/src/pty/guard.rs`) and TypeScript scans outgoing commands against security rules:

```rust
pub enum RiskLevel {
    Safe,       // ls, cargo check, git status, npm test
    Moderate,   // npm install, git checkout -b, touch, mkdir
    Dangerous,  // rm, git reset --hard, git push --force, dd, dropdb
    Critical,   // rm -rf /, chmod -R 777, curl | bash, mkfs
}
```

#### Risk Trigger Matrix:
- **Filesystem Destruction**: `rm -rf`, `find . -delete`, `unlink`, `shred`.
- **Git State Mutation**: `git push --force`, `git reset --hard`, `git clean -fdx`, `git branch -D`.
- **Package & Binary Alteration**: `npm i -g`, `pip install --break-system-packages`, `sudo apt-get`.
- **Remote Code Execution**: `curl ... | bash`, `wget ... | sh`, `eval(...)`.
- **Secret Exfiltration**: `cat .env`, `printenv AWS_SECRET_ACCESS_KEY`.

### 5.2 Granular User Decision Flow
1. **Allow Once (`Cmd+Enter`)**: Executes the command immediately for this single invocation.
2. **Always Allow for Session/Workspace (`Cmd+Shift+A`)**: Adds the command pattern (e.g. `npm install *`) to the current workspace whitelist.
3. **Sandbox / Dry-Run (`Cmd+D`)**: Wraps execution in a temporary sandboxed directory or appends `--dry-run` flag where applicable.
4. **Reject with Feedback (`Esc` or `Cmd+R`)**: Cancels the command and sends structured error feedback directly into the agent's PTY/MCP response channel (e.g., `Execution rejected by user: Please do not force push; create a new branch`).

---

## 6. Multi-Pane Broadcast & Synchronization Mode

For DevOps, cluster operations, and multi-agent coordination, **Multi-Pane Broadcast Mode** allows simultaneous input dispatch across multiple selected terminal panes.

```
+─────────────────────────────────── SYNC ACTIVE (3 Panes Selected) ──────────────────────────────────────+
| [1] 🔗 worker-node-01 (SYNC)      | [2] 🔗 worker-node-02 (SYNC)      | [3] 🔗 worker-node-03 (SYNC)    |
| $ docker pull myapp:v2.4          | $ docker pull myapp:v2.4          | $ docker pull myapp:v2.4        |
| Pulling fs layer... [====>    ]   | Pulling fs layer... [=====>   ]   | Pulling fs layer... [===>     ] |
+───────────────────────────────────┴───────────────────────────────────┴─────────────────────────────────+
```

### 6.1 Broadcast Architecture & State Flow
- **Activation**:
  - `Mod+Shift+G` toggles Broadcast Mode for the active workspace.
  - `Shift+Click` on any pane header toggles that pane's inclusion in the active Sync Group.
- **PTY Write Dispatcher**:
  When Broadcast Mode is active, keystrokes and bracketed pastes received by the focused pane are fanned out concurrently via Rust async threads to the PTY masters of all linked panes:
  ```rust
  #[tauri::command]
  pub async fn broadcast_write(
      state: State<'_, AppState>,
      pane_ids: Vec<String>,
      data: String,
  ) -> Result<(), String> {
      let manager = state.pty_manager.clone();
      spawn_blocking(move || {
          for id in pane_ids {
              let _ = manager.write_to_pane(&id, &data);
          }
      }).await.map_err(|e| e.to_string())
  }
  ```
- **Visual Cues & Guards**:
  - **Synchronized Amber/Cyan Border Glow**: All linked panes share an active synchronized pulsating border.
  - **Broadcast Ribbon Banner**: A high-contrast header bar indicating `BROADCAST ACTIVE: Panes [1, 2, 3]`.
  - **Destructive Command Warning**: If the user types high-risk commands while broadcasting, a warning banner prevents accidental multi-server destruction.

---

## 7. Terminal Ghost Text & Context-Aware Auto-suggestions

VibeGrid provides real-time, non-intrusive inline command autocompletion directly in the xterm canvas (Fish-shell / Warp-style).

```
$ git check█out -b feature/auth-provider  <-- [Tab] to accept, [Alt+→] word
```

### 7.1 Autocomplete Intelligence Engine
The suggestion engine synthesizes context from four sources:
1. **Active Workspace Shell History**: Most frequent and recent commands within the current workspace.
2. **Git Repository & Project Context**: Local branch names, modified filenames, npm scripts from `package.json`, and Cargo binaries from `Cargo.toml`.
3. **Agent Output Context**: Commands or file paths referenced in recent AI agent outputs (parsed from the 256KB buffer).
4. **CLI Flag Schemas**: Built-in completions for common tools (`git`, `docker`, `cargo`, `npm`, `pnpm`, `kubectl`).

### 7.2 xterm.js Ghost Text Integration
- **Rendering Mechanism**: Uses an xterm decoration / overlay layer rendering light gray text (`opacity: 0.45`) immediately following the active cursor position.
- **Keybinding Behaviors**:
  - `Tab` or `Right Arrow`: Accept full suggestion.
  - `Alt+Right Arrow` / `Option+Right Arrow`: Accept next word.
  - `Esc`: Dismiss suggestion.
  - `Ctrl+Space`: Open the **Quick Action Recipe Palette** showing ranked completions with descriptions.

---

## 8. Voice Dictation & Transcript Editor Drawer

Building upon VibeGrid's local Whisper integration (`src/speech.rs`, `useVoiceToTerminal.ts`), the **Voice Transcript Editor Drawer** upgrades dictation into a full multimodal prompt workstation.

```
+─────────────────────────────────────────────────────────────────────────────────────────────────────────+
│ 🎙️ VOICE PROMPT WORKSTATION [Whisper Base | Noise Gate: -42dB]                                        🗙│
+─────────────────────────────────────────────────────────────────────────────────────────────────────────+
│ 🟢 [Recording: 00:04]  ▂▃▅▇█▇▅▃▂  (Speaking detected)                                                   │
│                                                                                                         │
│ 📝 LIVE TRANSCRIPT PREVIEW:                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Please review the authentication middleware and write unit tests covering invalid JWT tokens        │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                         │
│ ⚡ AI PROMPT TEMPLATE WRAPPERS:                                                                          │
│ [ /fix ] [ /test ] [ /explain ] [ /refactor ] [ /document ] [ /optimize ]                              │
│                                                                                                         │
│ 🎯 TARGET PANE: [ [1] Claude Code (auth-service) ▾ ]                                                    │
│                                                                                                         │
│ [❌ Discard (Esc)] [✏️ Edit Text] [▶️ Inject into Terminal (Enter)] [🚀 Inject & Run (Cmd+Enter)]         │
+─────────────────────────────────────────────────────────────────────────────────────────────────────────+
```

### 8.1 Real-Time Audio DSP & Noise Gating
- **Adaptive Noise Gate**: Dynamic noise floor calibration ignores ambient keyboard typing and fan noise.
- **Silence Threshold Tuning**: Adjustable auto-stop silence timer (200ms - 15,000ms) with visual threshold marker on the waveform.
- **Live Streaming Preview**: Partial token decoding streamed directly to the UI during speech.

### 8.2 Edit-Before-Send Prompt Workstation
- **Editable Buffer**: Allows developers to fix transcription nuances, add code snippets, or reword sentences before submitting to the agent.
- **One-Click Prompt Encoders**: Buttons to wrap spoken transcripts with common prompt patterns (e.g. `/test: <transcript>`, `/fix: <transcript>`).
- **Target Pane Selector**: Route the transcribed prompt to any active terminal pane regardless of current focus.
- **Execution Modes**:
  - `Inject (Enter)`: Inserts text into terminal command line for manual review.
  - `Inject & Run (Cmd+Enter)`: Writes text and sends carriage return (`\r`) to execute immediately.

---

## 9. Full System Architecture & Data Schema Blueprint

### 9.1 Rust Data Structures (`src-tauri/src/types.rs`)

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AgentLifecycleState {
    Idle,
    Thinking { thought: Option<String> },
    ToolExecuting { tool_name: String, command: Option<String> },
    FileEditing { file_path: String, additions: usize, deletions: usize },
    AwaitingInput { prompt: String, requires_approval: bool },
    Streaming { tokens_per_second: f32 },
    Error { message: String, exit_code: Option<i32> },
    Completed { summary: Option<String> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaneAgentTelemetry {
    pub pane_id: String,
    pub agent_name: Option<String>,
    pub model_name: Option<String>,
    pub state: AgentLifecycleState,
    pub total_tokens: usize,
    pub estimated_cost_usd: f64,
    pub active_files: Vec<String>,
    pub last_updated_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionApprovalRequest {
    pub request_id: String,
    pub pane_id: String,
    pub action_type: String,
    pub command: String,
    pub diff_preview: Option<String>,
    pub rationale: String,
    pub risk_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpProtocolEvent {
    pub timestamp_ms: u64,
    pub direction: String, // "incoming" | "outgoing"
    pub method: String,
    pub payload_json: String,
    pub latency_ms: Option<f64>,
}
```

### 9.2 Frontend Store Architecture (`src/store/useAgentStore.ts`)

```typescript
import { create } from 'zustand';
import { AgentLifecycleState, PaneAgentTelemetry, ActionApprovalRequest, McpProtocolEvent } from '@/types/agent';

interface AgentState {
  // Telemetry per pane
  telemetry: Record<string, PaneAgentTelemetry>;
  
  // Pending Approval Modal
  activeApprovalRequest: ActionApprovalRequest | null;
  approvalHistory: ActionApprovalRequest[];
  
  // MCP Inspector
  mcpEvents: McpProtocolEvent[];
  isMcpVisualizerOpen: boolean;
  
  // Broadcast Mode
  isBroadcastActive: boolean;
  broadcastPaneIds: string[];
  
  // Voice Drawer
  isVoiceDrawerOpen: boolean;
  voiceDraftPrompt: string;
  
  // Actions
  updatePaneTelemetry: (paneId: string, patch: Partial<PaneAgentTelemetry>) => void;
  requestApproval: (request: ActionApprovalRequest) => void;
  resolveApproval: (requestId: string, resolution: 'allow' | 'allow_always' | 'reject', feedback?: string) => Promise<void>;
  toggleBroadcastPane: (paneId: string) => void;
  setBroadcastActive: (active: boolean) => void;
  toggleMcpVisualizer: () => void;
  addMcpEvent: (event: McpProtocolEvent) => void;
  setVoiceDraftPrompt: (prompt: string) => void;
}
```

---

## 10. File-by-File Implementation Plan

| File Path | Action | Description & Purpose |
| :--- | :--- | :--- |
| `src-tauri/src/mcp_server.rs` | **Expand** | Implement two-way MCP tools (`vibegrid_exec_command`, `vibegrid_split_pane`, `vibegrid_request_approval`). |
| `src-tauri/src/http_server.rs` | **Expand** | Add `/mcp/events` SSE endpoint and `/supervisor/telemetry` endpoints. |
| `src-tauri/src/pty/guard.rs` | **New** | Rust command risk classifier and PTY pre-execution approval interceptor. |
| `src-tauri/src/pty/manager.rs` | **Expand** | Add multi-pane `broadcast_write` support across PTY master descriptors. |
| `src/store/useAgentStore.ts` | **New** | Zustand store managing agent telemetry, approvals, MCP logs, and broadcast groups. |
| `src/components/agent/AgentSupervisorGrid.tsx` | **New** | Pane toolbar micro-HUDs, status badges, sparklines, and global supervisor matrix. |
| `src/components/agent/McpVisualizerDrawer.tsx` | **New** | Interactive MCP JSON-RPC inspector, latency graphs, and buffer explorer. |
| `src/components/agent/ActionApprovalModal.tsx` | **New** | High-risk action confirmation modal with unified diff viewer and reject-with-feedback. |
| `src/components/agent/VoiceWorkstationDrawer.tsx`| **New** | Voice prompt editor, noise-gate calibration, AI prompt template wrappers. |
| `src/components/terminal/GhostTextAddon.ts` | **New** | Custom xterm.js addon rendering inline context-aware autocompletions. |
| `src/components/terminal/TerminalPane.tsx` | **Modify** | Integrate GhostText addon, broadcast listener, and stream telemetry hooks. |
| `src/components/terminal/TerminalToolbar.tsx`| **Modify** | Embed Agent State Badges (`THINKING`, `TOOL`, `AWAITING`), Token Velocity meters. |

---

## 11. Conclusion & Competitive Supremacy

By combining **GPU-accelerated terminal multiplexing (Tauri 2 + xterm.js)** with a **First-Class AI Agent Orchestraction Layer (Supervisor Grid, Two-way MCP, Permission Guards, Input Broadcasting, Ghost Text, and Multimodal Voice)**, VibeGrid achieves complete functional supremacy over BridgeSpace, Warp, and tmux. It provides AI developers and autonomous agents with an uncompromised, 100% free, open-source command center engineered for the next decade of agentic software engineering.
