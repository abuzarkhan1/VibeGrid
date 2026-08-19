import { PaneNode, SplitNode, TerminalNode, SplitDirection } from '@/types/layout';

let termCounter = 0;

export function makeTerm(title?: string): TerminalNode {
  termCounter++;
  return {
    type: 'terminal',
    id: `term-${Date.now()}-${termCounter}-${Math.floor(Math.random() * 10000)}`,
    title: title || `Terminal ${termCounter}`,
  };
}

export function makeSplit(direction: SplitDirection, ratio: number, left: PaneNode, right: PaneNode): SplitNode {
  return {
    type: 'split',
    id: `split-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    direction,
    ratio,
    children: [left, right],
  };
}

/** 1-Pane (Solo Focus) */
export function generateSolo(): PaneNode {
  return makeTerm('Main Terminal');
}

/** 2-Pane Split (Horizontal or Vertical) */
export function generate2Pane(direction: SplitDirection = 'horizontal', ratio = 0.5): PaneNode {
  return makeSplit(
    direction,
    ratio,
    makeTerm(direction === 'horizontal' ? 'Left Editor' : 'Top Server'),
    makeTerm(direction === 'horizontal' ? 'Right Runner' : 'Bottom Logs')
  );
}

/** 3-Pane T-Split Top (1 Master Top, 2 Bottom) */
export function generate3PaneTSplitTop(ratio = 0.55): PaneNode {
  const bottomRow = makeSplit('horizontal', 0.5, makeTerm('Worker A'), makeTerm('Worker B'));
  return makeSplit('vertical', ratio, makeTerm('Master Terminal'), bottomRow);
}

/** 3-Pane T-Split Bottom (2 Top, 1 Master Bottom) */
export function generate3PaneTSplitBottom(ratio = 0.45): PaneNode {
  const topRow = makeSplit('horizontal', 0.5, makeTerm('Editor / Dev'), makeTerm('AI Supervisor'));
  return makeSplit('vertical', ratio, topRow, makeTerm('Wide Output / Logs'));
}

/** 3-Pane Equal Columns */
export function generate3Columns(): PaneNode {
  const rightPair = makeSplit('horizontal', 0.5, makeTerm('Column 2'), makeTerm('Column 3'));
  return makeSplit('horizontal', 1 / 3, makeTerm('Column 1'), rightPair);
}

/** 3-Pane Equal Rows */
export function generate3Rows(): PaneNode {
  const bottomPair = makeSplit('vertical', 0.5, makeTerm('Row 2'), makeTerm('Row 3'));
  return makeSplit('vertical', 1 / 3, makeTerm('Row 1'), bottomPair);
}

/** 4-Pane 2x2 Quad Matrix */
export function generate4PaneQuad(): PaneNode {
  const topRow = makeSplit('horizontal', 0.5, makeTerm('Top Left'), makeTerm('Top Right'));
  const bottomRow = makeSplit('horizontal', 0.5, makeTerm('Bottom Left'), makeTerm('Bottom Right'));
  return makeSplit('vertical', 0.5, topRow, bottomRow);
}

/** 4-Pane Master-Detail (1 Large Left + 3 Stacked Right) */
export function generate4PaneMasterDetail(masterRatio = 0.65): PaneNode {
  const lowerStack = makeSplit('vertical', 0.5, makeTerm('Agent 2'), makeTerm('Agent 3'));
  const rightStack = makeSplit('vertical', 1 / 3, makeTerm('Agent 1'), lowerStack);
  return makeSplit('horizontal', masterRatio, makeTerm('Orchestrator Focus'), rightStack);
}

/** 4-Pane Equal Columns */
export function generate4Columns(): PaneNode {
  const leftPair = makeSplit('horizontal', 0.5, makeTerm('Column 1'), makeTerm('Column 2'));
  const rightPair = makeSplit('horizontal', 0.5, makeTerm('Column 3'), makeTerm('Column 4'));
  return makeSplit('horizontal', 0.5, leftPair, rightPair);
}

/** 6-Pane 2x3 Matrix */
export function generate6PaneMatrix(): PaneNode {
  return generateCustomMatrix(2, 3);
}

/** 6-Pane Command (1 Lead Master Left + 5 Satellite Panes Right) */
export function generate6Command(leadRatio = 0.55): PaneNode {
  const topPair = makeSplit('horizontal', 0.5, makeTerm('Agent Alpha'), makeTerm('Agent Beta'));
  const bottomTrioRight = makeSplit('horizontal', 0.5, makeTerm('Worker 2'), makeTerm('Worker 3'));
  const bottomTrio = makeSplit('horizontal', 1 / 3, makeTerm('Worker 1'), bottomTrioRight);
  const rightCockpit = makeSplit('vertical', 0.5, topPair, bottomTrio);
  return makeSplit('horizontal', leadRatio, makeTerm('Lead Orchestrator'), rightCockpit);
}

/** 8-Pane 2x4 Fleet Grid */
export function generate8Fleet(): PaneNode {
  return generateCustomMatrix(2, 4);
}

/** 8-Pane Satellite (2 Lead Masters Left + 6 Satellite Workers Right) */
export function generate8Satellite(leadRatio = 0.5): PaneNode {
  const leftMasters = makeSplit('vertical', 0.5, makeTerm('Lead Architect'), makeTerm('Supervisor Console'));
  const rightSatellites = generateCustomMatrix(2, 3);
  return makeSplit('horizontal', leadRatio, leftMasters, rightSatellites);
}

/** 9-Pane 3x3 Hivemind Grid */
export function generate9Hivemind(): PaneNode {
  return generateCustomMatrix(3, 3);
}

/** 16-Pane 4x4 GodMode Grid */
export function generate16GodMode(): PaneNode {
  return generateCustomMatrix(4, 4);
}

/** Generic N × M Matrix Generator */
export function generateCustomMatrix(rows: number, cols: number): PaneNode {
  if (rows <= 0 || cols <= 0) return makeTerm();
  if (rows === 1 && cols === 1) return makeTerm();

  function buildRow(c: number): PaneNode {
    if (c === 1) return makeTerm();
    const k = Math.floor(c / 2);
    return makeSplit('horizontal', k / c, buildRow(k), buildRow(c - k));
  }

  function buildGrid(r: number): PaneNode {
    if (r === 1) return buildRow(cols);
    const k = Math.floor(r / 2);
    return makeSplit('vertical', k / r, buildGrid(k), buildGrid(r - k));
  }

  return buildGrid(rows);
}
