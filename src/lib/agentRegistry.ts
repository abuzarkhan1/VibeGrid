import { DiscoveredAgent, HeterogeneousRolePod } from '@/types/agent';

export const BUILTIN_AGENTS: DiscoveredAgent[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    category: 'coding-agent',
    description: 'Anthropic agentic CLI with deep codebase reasoning and autonomous edits',
    iconName: 'Bot',
    isInstalled: false,
    supportedModels: ['claude-3-7-sonnet', 'claude-3-5-sonnet', 'claude-3-5-haiku'],
    defaultArgs: ['--dangerously-skip-permissions'],
    installCommand: 'npm install -g @anthropic-ai/claude-code',
    docUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/claude-code',
    badgeColor: '#d97706',
  },
  {
    id: 'codex',
    name: 'OpenAI Codex',
    category: 'coding-agent',
    description: 'OpenAI coding agent with o3-mini and gpt-4o automated task loops',
    iconName: 'Sparkles',
    isInstalled: false,
    supportedModels: ['o3-mini', 'o1', 'gpt-4o', 'gpt-4o-mini'],
    defaultArgs: [],
    installCommand: 'npm install -g @openai/codex',
    docUrl: 'https://platform.openai.com/docs',
    badgeColor: '#10b981',
  },
  {
    id: 'antigravity',
    name: 'Antigravity / Integrity',
    category: 'orchestrator',
    description: 'Google DeepMind multi-agent coding framework & skill runner',
    iconName: 'Zap',
    isInstalled: false,
    supportedModels: ['gemini-2.5-pro', 'gemini-2.5-flash'],
    defaultArgs: [],
    installCommand: 'curl -fsSL https://antigravity.google.com/install.sh | sh',
    docUrl: 'https://deepmind.google/technologies/antigravity',
    badgeColor: '#3b82f6',
  },
  {
    id: 'grok',
    name: 'Grok CLI',
    category: 'coding-agent',
    description: 'xAI real-time web-connected coding agent with fast token generation',
    iconName: 'Globe',
    isInstalled: false,
    supportedModels: ['grok-2', 'grok-2-mini', 'grok-code'],
    defaultArgs: [],
    installCommand: 'npm install -g @xai/grok-cli',
    docUrl: 'https://x.ai/api',
    badgeColor: '#8b5cf6',
  },
  {
    id: 'kimi',
    name: 'Kimi CLI',
    category: 'coding-agent',
    description: 'Moonshot AI 2M token context repository analyzer for monolith codebases',
    iconName: 'FileText',
    isInstalled: false,
    supportedModels: ['kimi-k1.5', 'moonshot-v1-128k'],
    defaultArgs: [],
    installCommand: 'pip install kimi-cli',
    docUrl: 'https://www.moonshot.cn',
    badgeColor: '#06b6d4',
  },
  {
    id: 'qwen',
    name: 'Qwen Coder CLI',
    category: 'coding-agent',
    description: 'Alibaba Cloud Qwen 2.5 Coder supporting 92+ programming languages',
    iconName: 'Code',
    isInstalled: false,
    supportedModels: ['qwen2.5-coder-32b', 'qwen2.5-coder-7b'],
    defaultArgs: [],
    installCommand: 'pip install qwen-coder-cli',
    docUrl: 'https://github.com/QwenLM/Qwen2.5-Coder',
    badgeColor: '#6366f1',
  },
  {
    id: 'aider',
    name: 'Aider Pair Programmer',
    category: 'coding-agent',
    description: 'Git-aware terminal pair programmer with automatic commits and repo maps',
    iconName: 'Terminal',
    isInstalled: false,
    supportedModels: ['claude-3-7-sonnet', 'deepseek-r1', 'gpt-4o'],
    defaultArgs: ['--auto-commits'],
    installCommand: 'pip install aider-chat',
    docUrl: 'https://aider.chat',
    badgeColor: '#ec4899',
  },
  {
    id: 'openhands',
    name: 'OpenHands',
    category: 'orchestrator',
    description: 'Autonomous AI software developer agent in Docker container sandbox',
    iconName: 'Cpu',
    isInstalled: false,
    supportedModels: ['claude-3-7-sonnet', 'gpt-4o'],
    defaultArgs: [],
    installCommand: 'pip install openhands-ai',
    docUrl: 'https://github.com/All-Hands-AI/OpenHands',
    badgeColor: '#f97316',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local LLM)',
    category: 'local-llm',
    description: 'Air-gapped local model runner for DeepSeek-R1, Qwen, and Llama',
    iconName: 'Server',
    isInstalled: false,
    supportedModels: ['deepseek-r1:32b', 'deepseek-r1:8b', 'qwen2.5-coder:32b', 'qwen2.5-coder:7b', 'llama3.3:70b', 'codestral'],
    defaultArgs: ['run', 'deepseek-r1:32b'],
    installCommand: 'brew install ollama',
    docUrl: 'https://ollama.com',
    badgeColor: '#14b8a6',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek CLI',
    category: 'coding-agent',
    description: 'DeepSeek reasoning & code intelligence CLI with deep chain-of-thought analysis',
    iconName: 'Bot',
    isInstalled: false,
    supportedModels: ['deepseek-r1', 'deepseek-chat', 'deepseek-coder'],
    defaultArgs: [],
    installCommand: 'npm install -g @deepseek/cli',
    docUrl: 'https://deepseek.com',
    badgeColor: '#1e40af',
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    category: 'coding-agent',
    description: 'Google Gemini 2.5 Pro multimodal developer assistant with 1M+ context window',
    iconName: 'Zap',
    isInstalled: false,
    supportedModels: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro'],
    defaultArgs: [],
    installCommand: 'npm install -g @google/gemini-cli',
    docUrl: 'https://ai.google.dev',
    badgeColor: '#2563eb',
  },
  {
    id: 'goose',
    name: 'Goose',
    category: 'orchestrator',
    description: 'Extensible open-source AI agent by Block that automates engineering tasks through tool extensions',
    iconName: 'Layers',
    isInstalled: false,
    supportedModels: ['claude-3-7-sonnet', 'gpt-4o', 'databricks-dbrx'],
    defaultArgs: ['session'],
    installCommand: 'brew install block/goose/goose',
    docUrl: 'https://block.github.io/goose/',
    badgeColor: '#f59e0b',
  },
  {
    id: 'cline',
    name: 'Cline CLI',
    category: 'coding-agent',
    description: 'Autonomous coding agent CLI with tool calling and human-in-the-loop approvals',
    iconName: 'Bot',
    isInstalled: false,
    supportedModels: ['claude-3-7-sonnet', 'gpt-4o', 'deepseek-r1'],
    defaultArgs: [],
    installCommand: 'npm install -g cline-cli',
    docUrl: 'https://github.com/cline/cline',
    badgeColor: '#10b981',
  },
  {
    id: 'shell',
    name: 'Native Shell (Zsh/Bash)',
    category: 'shell',
    description: 'Standard OS shell terminal with environment variables and PTY control',
    iconName: 'Terminal',
    isInstalled: true,
    supportedModels: [],
    defaultArgs: [],
    docUrl: 'https://vibegrid.dev',
    badgeColor: '#71717a',
  },
];

export const COMMON_VAULT_KEYS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'DEEPSEEK_API_KEY',
  'GEMINI_API_KEY',
  'XAI_API_KEY',
  'MOONSHOT_API_KEY',
  'GITHUB_TOKEN',
  'OLLAMA_HOST',
];

export const DEFAULT_VAULT_FLAGS = [
  { flag: '--dangerously-skip-permissions', label: 'Skip Permissions (Autonomous)', agentIds: ['claude-code', 'cline'] },
  { flag: '--auto-commits', label: 'Auto Git Commits', agentIds: ['aider'] },
  { flag: '--yes', label: 'Auto-Confirm (-y)', agentIds: ['claude-code', 'aider', 'codex', 'openhands'] },
  { flag: '--verbose', label: 'Verbose Debug Output', agentIds: ['claude-code', 'aider', 'codex', 'grok', 'kimi', 'qwen', 'deepseek', 'gemini'] },
];

export function escapeShellArg(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

export function buildAgentCommand(config: import('@/types/agent').PaneAgentConfig): string {
  if (!config || config.agentId === 'shell') return '';
  const parts: string[] = [];
  const bin = config.binaryPath || (config.agentId === 'claude-code' ? 'claude' : config.agentId === 'antigravity' ? 'agy' : config.agentId);
  parts.push(bin);

  if (config.agentId === 'ollama') {
    parts.push('run');
    if (config.model) {
      parts.push(config.model);
    }
  } else if (config.model) {
    parts.push(`--model ${config.model}`);
  }

  if (config.cliArgs && config.cliArgs.length > 0) {
    const filteredArgs = config.agentId === 'ollama'
      ? config.cliArgs.filter((a) => a !== 'run' && a !== config.model)
      : config.cliArgs;
    if (filteredArgs.length > 0) {
      parts.push(...filteredArgs);
    }
  }

  if (config.initialPrompt && config.initialPrompt.trim()) {
    parts.push(escapeShellArg(config.initialPrompt.trim()));
  }

  return parts.join(' ').trim();
}

export const HETEROGENEOUS_ROLE_PODS: HeterogeneousRolePod[] = [
  {
    id: 'feature-team-4',
    name: 'Autonomous Feature Pod (4-Pane Quad)',
    description: '1 Architect + 1 Refactorer + 1 Local Explainer + 1 Dev Server',
    paneCount: 4,
    assignments: [
      { paneIndex: 0, title: 'Claude Code (Architect)', agentId: 'claude-code', model: 'claude-3-7-sonnet', initialPrompt: 'Analyze project structure and prepare implementation plan.' },
      { paneIndex: 1, title: 'Aider (Refactorer)', agentId: 'aider', model: 'claude-3-7-sonnet', cliArgs: ['--auto-commits'] },
      { paneIndex: 2, title: 'Ollama (DeepSeek R1)', agentId: 'ollama', model: 'deepseek-r1:32b' },
      { paneIndex: 3, title: 'Dev Server', agentId: 'shell' },
    ],
  },
  {
    id: 'pair-coder-3',
    name: 'AI Pair Programmer (3-Pane)',
    description: '1 Main Orchestrator + 1 Test Runner + 1 Log Watcher',
    paneCount: 3,
    assignments: [
      { paneIndex: 0, title: 'Claude Architect', agentId: 'claude-code', model: 'claude-3-7-sonnet', cliArgs: ['--dangerously-skip-permissions'] },
      { paneIndex: 1, title: 'Aider Pair', agentId: 'aider', model: 'claude-3-7-sonnet', cliArgs: ['--auto-commits'] },
      { paneIndex: 2, title: 'Test Watcher', agentId: 'shell' },
    ],
  },
  {
    id: 'privacy-local-4',
    name: 'Air-Gapped Privacy Swarm (4-Pane Local)',
    description: '4 Local Ollama instances running DeepSeek and Qwen Coder',
    paneCount: 4,
    assignments: [
      { paneIndex: 0, title: 'DeepSeek R1', agentId: 'ollama', model: 'deepseek-r1:32b' },
      { paneIndex: 1, title: 'Qwen Coder', agentId: 'ollama', model: 'qwen2.5-coder:32b' },
      { paneIndex: 2, title: 'Llama 3.3', agentId: 'ollama', model: 'llama3.3:70b' },
      { paneIndex: 3, title: 'Local Terminal', agentId: 'shell' },
    ],
  },
];
