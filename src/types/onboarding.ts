export type OnboardingStep = 'splash' | 'layout' | 'agents' | 'customizer';

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
