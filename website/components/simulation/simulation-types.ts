export type AgentPaneId = 'claude' | 'cargo' | 'nextjs' | 'ollama';

export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'accent' | 'cmd' | 'diff';

export interface SimulationLogLine {
  id: string;
  bullet: string;
  bulletColor: string;
  text: string;
  timestamp: string;
  highlight?: string;
  type?: LogLevel;
  diffType?: 'add' | 'del' | 'header';
}

export interface AgentPaneConfig {
  id: AgentPaneId;
  paneNumber: number;
  title: string;
  agentName: string;
  provider: string;
  cwd: string;
  cmd: string;
  accentColor: string;
  badge: string;
  badgeColor: string;
  initialStatus: string;
  telemetryMetric: string;
  telemetryValue: string;
}

export interface SimulationState {
  isPlaying: boolean;
  speed: 1 | 2 | 4;
  activePaneId: AgentPaneId;
  viewMode: 'grid' | 'focused' | 'diff';
  symphonyActive: boolean;
  symphonyProgress: number; // 0 to 100
  totalTicks: number;
  logs: Record<AgentPaneId, SimulationLogLine[]>;
  currentStatuses: Record<AgentPaneId, string>;
  isStreaming: Record<AgentPaneId, boolean>;
  fps: number;
  ptyLatency: number;
  egressBytes: number;
  totalTokensGenerated: number;
}

export interface CommandExecutionResult {
  targetPane: AgentPaneId;
  command: string;
  outputLines: Array<{
    bullet: string;
    bulletColor: string;
    text: string;
    highlight?: string;
    type?: LogLevel;
  }>;
  statusUpdate?: string;
}
