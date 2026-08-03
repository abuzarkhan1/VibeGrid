export type SplitDirection = 'horizontal' | 'vertical';

export interface TerminalNode {
  type: 'terminal';
  id: string;
  paneId?: string; // PTY UUID returned from Rust backend
  title?: string;
  cwd?: string;
  shell?: string;
}

export interface SplitNode {
  type: 'split';
  id: string;
  direction: SplitDirection;
  ratio: number; // Split ratio between 0.1 and 0.9 (default 0.5)
  children: [PaneNode, PaneNode];
}

export type PaneNode = TerminalNode | SplitNode;
