export type SplitDirection = 'horizontal' | 'vertical';

/** Per-pane appearance overrides (customization audit C13). Each field is
 *  optional; an absent field falls back to the workspace override (C12), then
 *  the global setting. Persisted with the layout in the workspace file. */
export interface PaneAppearance {
  themeName?: string;
  fontSize?: number;
  fontFamily?: string;
  terminalOpacity?: number;
}

export interface TerminalNode {
  type: 'terminal';
  id: string;
  paneId?: string; // PTY UUID returned from Rust backend
  title?: string;
  cwd?: string;
  shell?: string;
  /** Per-pane appearance overrides (customization audit C13). */
  appearance?: PaneAppearance;
}

export interface SplitNode {
  type: 'split';
  id: string;
  direction: SplitDirection;
  ratio: number; // Split ratio between 0.1 and 0.9 (default 0.5)
  children: [PaneNode, PaneNode];
}

export type PaneNode = TerminalNode | SplitNode;
