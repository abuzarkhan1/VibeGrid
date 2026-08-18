export type AgentCategory = 'coding-agent' | 'local-llm' | 'orchestrator' | 'shell';

export interface DiscoveredAgent {
  id: string;
  name: string;
  category: AgentCategory;
  description: string;
  iconName: string;
  isInstalled: boolean;
  binaryPath?: string;
  detectedVersion?: string;
  supportedModels: string[];
  defaultArgs: string[];
  installCommand?: string;
  docUrl: string;
  badgeColor?: string;
}

export interface PaneAgentConfig {
  agentId: string;
  binaryPath: string;
  name: string;
  model?: string;
  cliArgs: string[];
  initialPrompt?: string;
  autoStart: boolean;
}

export interface AgentDiscoveryResult {
  agentId: string;
  isInstalled: boolean;
  binaryPath?: string;
  detectedVersion?: string;
  binarySource?: string;
}

export interface HeterogeneousRolePod {
  id: string;
  name: string;
  description: string;
  paneCount: number;
  assignments: {
    paneIndex: number;
    title: string;
    agentId: string;
    model?: string;
    cliArgs?: string[];
    initialPrompt?: string;
  }[];
}
