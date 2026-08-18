import { PaneNode, TerminalNode, SplitNode, PresetCount } from '@/types/layout';

let counter = 0;
function uid(prefix: string): string {
  counter++;
  return `${prefix}-${Date.now()}-${counter}-${Math.floor(Math.random() * 1000)}`;
}

export function createTerminalNode(id?: string, title?: string): TerminalNode {
  return {
    type: 'terminal',
    id: id || uid('node-term'),
    title: title || 'Terminal',
  };
}

export function getTerminalNodesFromTree(node: PaneNode): TerminalNode[] {
  if (node.type === 'terminal') return [node];
  return [
    ...getTerminalNodesFromTree(node.children[0]),
    ...getTerminalNodesFromTree(node.children[1]),
  ];
}

export function cloneTree(node: PaneNode): PaneNode {
  if (node.type === 'terminal') {
    return { ...node };
  }
  return {
    ...node,
    children: [cloneTree(node.children[0]), cloneTree(node.children[1])],
  };
}

export function updateTerminalInTree(
  node: PaneNode,
  targetId: string,
  patch: Partial<TerminalNode>
): PaneNode {
  if (node.type === 'terminal') {
    if (node.id === targetId) {
      return { ...node, ...patch };
    }
    return node;
  }
  return {
    ...node,
    children: [
      updateTerminalInTree(node.children[0], targetId, patch),
      updateTerminalInTree(node.children[1], targetId, patch),
    ],
  };
}

export function buildPresetTree(count: PresetCount): PaneNode {
  const terms: TerminalNode[] = Array.from({ length: count }, (_, i) =>
    createTerminalNode(undefined, `Terminal ${i + 1}`)
  );

  if (count === 1) return terms[0];
  if (count === 2) {
    return {
      type: 'split',
      id: uid('split'),
      direction: 'horizontal',
      ratio: 0.5,
      children: [terms[0], terms[1]],
    };
  }
  if (count === 3) {
    // 3 Equal Columns (1x3)
    return {
      type: 'split',
      id: uid('split'),
      direction: 'horizontal',
      ratio: 1 / 3,
      children: [
        terms[0],
        {
          type: 'split',
          id: uid('split'),
          direction: 'horizontal',
          ratio: 0.5,
          children: [terms[1], terms[2]],
        },
      ],
    };
  }
  if (count === 4) {
    const top: SplitNode = {
      type: 'split',
      id: uid('split'),
      direction: 'horizontal',
      ratio: 0.5,
      children: [terms[0], terms[1]],
    };
    const bottom: SplitNode = {
      type: 'split',
      id: uid('split'),
      direction: 'horizontal',
      ratio: 0.5,
      children: [terms[2], terms[3]],
    };
    return {
      type: 'split',
      id: uid('split'),
      direction: 'vertical',
      ratio: 0.5,
      children: [top, bottom],
    };
  }
  if (count === 5) {
    // 3 Top, 2 Bottom [3, 2]
    const topRow: SplitNode = {
      type: 'split',
      id: uid('split'),
      direction: 'horizontal',
      ratio: 1 / 3,
      children: [
        terms[0],
        {
          type: 'split',
          id: uid('split'),
          direction: 'horizontal',
          ratio: 0.5,
          children: [terms[1], terms[2]],
        },
      ],
    };
    const bottomRow: SplitNode = {
      type: 'split',
      id: uid('split'),
      direction: 'horizontal',
      ratio: 0.5,
      children: [terms[3], terms[4]],
    };
    return {
      type: 'split',
      id: uid('split'),
      direction: 'vertical',
      ratio: 0.5,
      children: [topRow, bottomRow],
    };
  }
  if (count === 6) {
    const makeRow = (t1: TerminalNode, t2: TerminalNode, t3: TerminalNode): SplitNode => ({
      type: 'split',
      id: uid('split'),
      direction: 'horizontal',
      ratio: 1 / 3,
      children: [
        t1,
        {
          type: 'split',
          id: uid('split'),
          direction: 'horizontal',
          ratio: 0.5,
          children: [t2, t3],
        },
      ],
    });
    return {
      type: 'split',
      id: uid('split'),
      direction: 'vertical',
      ratio: 0.5,
      children: [makeRow(terms[0], terms[1], terms[2]), makeRow(terms[3], terms[4], terms[5])],
    };
  }
  if (count === 8) {
    // 4 Columns x 2 Rows
    const make4Row = (t1: TerminalNode, t2: TerminalNode, t3: TerminalNode, t4: TerminalNode): SplitNode => ({
      type: 'split',
      id: uid('split'),
      direction: 'horizontal',
      ratio: 0.5,
      children: [
        {
          type: 'split',
          id: uid('split'),
          direction: 'horizontal',
          ratio: 0.5,
          children: [t1, t2],
        },
        {
          type: 'split',
          id: uid('split'),
          direction: 'horizontal',
          ratio: 0.5,
          children: [t3, t4],
        },
      ],
    });
    return {
      type: 'split',
      id: uid('split'),
      direction: 'vertical',
      ratio: 0.5,
      children: [
        make4Row(terms[0], terms[1], terms[2], terms[3]),
        make4Row(terms[4], terms[5], terms[6], terms[7]),
      ],
    };
  }
  if (count === 9) {
    // 3x3 Equal Grid
    const make3Row = (t1: TerminalNode, t2: TerminalNode, t3: TerminalNode): SplitNode => ({
      type: 'split',
      id: uid('split'),
      direction: 'horizontal',
      ratio: 1 / 3,
      children: [
        t1,
        {
          type: 'split',
          id: uid('split'),
          direction: 'horizontal',
          ratio: 0.5,
          children: [t2, t3],
        },
      ],
    });
    const r1 = make3Row(terms[0], terms[1], terms[2]);
    const r2 = make3Row(terms[3], terms[4], terms[5]);
    const r3 = make3Row(terms[6], terms[7], terms[8]);
    return {
      type: 'split',
      id: uid('split'),
      direction: 'vertical',
      ratio: 1 / 3,
      children: [
        r1,
        {
          type: 'split',
          id: uid('split'),
          direction: 'vertical',
          ratio: 0.5,
          children: [r2, r3],
        },
      ],
    };
  }
  if (count === 12) {
    // 4 Columns x 3 Rows
    const make4Row = (t1: TerminalNode, t2: TerminalNode, t3: TerminalNode, t4: TerminalNode): SplitNode => ({
      type: 'split',
      id: uid('split'),
      direction: 'horizontal',
      ratio: 0.5,
      children: [
        {
          type: 'split',
          id: uid('split'),
          direction: 'horizontal',
          ratio: 0.5,
          children: [t1, t2],
        },
        {
          type: 'split',
          id: uid('split'),
          direction: 'horizontal',
          ratio: 0.5,
          children: [t3, t4],
        },
      ],
    });
    const r1 = make4Row(terms[0], terms[1], terms[2], terms[3]);
    const r2 = make4Row(terms[4], terms[5], terms[6], terms[7]);
    const r3 = make4Row(terms[8], terms[9], terms[10], terms[11]);
    return {
      type: 'split',
      id: uid('split'),
      direction: 'vertical',
      ratio: 1 / 3,
      children: [
        r1,
        {
          type: 'split',
          id: uid('split'),
          direction: 'vertical',
          ratio: 0.5,
          children: [r2, r3],
        },
      ],
    };
  }
  if (count === 16) {
    // 4 Columns x 4 Rows
    const make4Row = (t1: TerminalNode, t2: TerminalNode, t3: TerminalNode, t4: TerminalNode): SplitNode => ({
      type: 'split',
      id: uid('split'),
      direction: 'horizontal',
      ratio: 0.5,
      children: [
        {
          type: 'split',
          id: uid('split'),
          direction: 'horizontal',
          ratio: 0.5,
          children: [t1, t2],
        },
        {
          type: 'split',
          id: uid('split'),
          direction: 'horizontal',
          ratio: 0.5,
          children: [t3, t4],
        },
      ],
    });
    const r1 = make4Row(terms[0], terms[1], terms[2], terms[3]);
    const r2 = make4Row(terms[4], terms[5], terms[6], terms[7]);
    const r3 = make4Row(terms[8], terms[9], terms[10], terms[11]);
    const r4 = make4Row(terms[12], terms[13], terms[14], terms[15]);
    const topHalf: SplitNode = {
      type: 'split',
      id: uid('split'),
      direction: 'vertical',
      ratio: 0.5,
      children: [r1, r2],
    };
    const bottomHalf: SplitNode = {
      type: 'split',
      id: uid('split'),
      direction: 'vertical',
      ratio: 0.5,
      children: [r3, r4],
    };
    return {
      type: 'split',
      id: uid('split'),
      direction: 'vertical',
      ratio: 0.5,
      children: [topHalf, bottomHalf],
    };
  }

  // Fallback generic split
  return {
    type: 'split',
    id: uid('split'),
    direction: 'horizontal',
    ratio: 0.5,
    children: [terms[0], terms[1] || createTerminalNode(undefined, 'Terminal 2')],
  };
}

export function buildAiPairTree(): PaneNode {
  const main = createTerminalNode(undefined, 'Code / Watcher');
  const agent1 = createTerminalNode(undefined, 'Claude Code');
  const agent2 = createTerminalNode(undefined, 'Aider / Tests');
  return {
    type: 'split',
    id: uid('split'),
    direction: 'horizontal',
    ratio: 0.58,
    children: [
      main,
      {
        type: 'split',
        id: uid('split'),
        direction: 'vertical',
        ratio: 0.5,
        children: [agent1, agent2],
      },
    ],
  };
}
