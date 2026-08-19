export type SplitDirection = 'horizontal' | 'vertical';

export type PresetCount = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 9 | 12 | 16;

export interface PaneAppearance {
  themeName?: string;
  fontSize?: number;
  fontFamily?: string;
  terminalOpacity?: number;
}

export interface TerminalNode {
  type: 'terminal';
  id: string;
  paneId?: string;
  title?: string;
  cwd?: string;
  shell?: string;

  appearance?: PaneAppearance;
}

export interface SplitNode {
  type: 'split';
  id: string;
  direction: SplitDirection;
  ratio: number;
  children: [PaneNode, PaneNode];
}

export type PaneNode = TerminalNode | SplitNode;
