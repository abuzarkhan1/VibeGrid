export type OnboardingStep = 'splash' | 'layout' | 'agents' | 'customizer' | 'launch';

export interface PaneAgentConfig {
  agentId: string; // 'claude-code' | 'aider' | 'openhands' | 'ollama' | 'codex' | 'shell'
  binaryPath: string;
  name: string;
  model?: string;
  cliArgs: string[];
  initialPrompt?: string;
  autoStart: boolean;
}

export interface DiscoveredAgent {
  id: string;
  name: string;
  category: 'coding-agent' | 'local-llm' | 'orchestrator' | 'shell';
  description: string;
  iconName: string;
  isInstalled: boolean;
  binaryPath?: string;
  detectedVersion?: string;
  supportedModels: string[];
  defaultArgs: string[];
  installCommand?: string;
  docUrl: string;
}

export interface AgentDiscoveryResult {
  agentId: string;
  isInstalled: boolean;
  binaryPath?: string;
  detectedVersion?: string;
  binarySource?: string;
}

export interface PaneSpawnSpec {
  nodeId: string;
  cols: number;
  rows: number;
  cwd?: string;
  shell?: string;
  shellArgs?: string[];
  env?: Record<string, string>;
  initialCommand?: string;
}

export interface BatchSpawnResult {
  nodeId: string;
  paneId: string;
  success: boolean;
  error?: string;
}
