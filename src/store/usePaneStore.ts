import { create } from 'zustand';
import { PaneNode, SplitDirection, TerminalNode, SplitNode } from '@/types/layout';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TerminalWithRect {
  node: TerminalNode;
  rect: Rect;
}

interface PaneState {
  root: PaneNode;
  focusedPaneId: string | null;
  maximizedPaneId: string | null;
  paneCount: number;
  maxPanes: number;
  layoutMode: 'preset' | 'custom';
  presetCount: 1 | 2 | 4 | 6 | 8 | 16;

  // Actions
  splitPane: (targetId: string, direction: SplitDirection) => boolean;
  closePane: (targetId: string) => void;
  setRatio: (splitId: string, ratio: number) => void;
  setFocusedPane: (id: string) => void;
  setPanePtyId: (nodeId: string, ptyPaneId: string) => void;
  setPaneTitle: (nodeId: string, title: string) => void;
  setPaneCwd: (nodeId: string, cwd: string) => void;
  toggleMaximize: (id?: string) => void;
  navigateFocus: (direction: 'left' | 'right' | 'up' | 'down' | 'next' | 'prev') => void;
  setLayoutPreset: (count: 1 | 2 | 4 | 6 | 8 | 16) => void;
  resetLayout: () => void;
}

const initialTerminalId = `term-${Date.now()}`;

const initialRoot: TerminalNode = {
  type: 'terminal',
  id: initialTerminalId,
  title: 'Terminal 1',
};

// Helper: Count terminal nodes in tree
function countTerminals(node: PaneNode): number {
  if (node.type === 'terminal') return 1;
  return countTerminals(node.children[0]) + countTerminals(node.children[1]);
}

// Helper: Collect all terminal nodes
export function getTerminalNodes(node: PaneNode): TerminalNode[] {
  if (node.type === 'terminal') return [node];
  return [...getTerminalNodes(node.children[0]), ...getTerminalNodes(node.children[1])];
}

// Helper: Compute 2D bounding rects for terminal nodes in layout tree
function getTerminalRects(node: PaneNode, rect: Rect = { x: 0, y: 0, width: 100, height: 100 }): TerminalWithRect[] {
  if (node.type === 'terminal') {
    return [{ node, rect }];
  }

  const isVert = node.direction === 'vertical'; // vertical = stacked top/bottom
  const ratio = node.ratio;

  let leftRect: Rect;
  let rightRect: Rect;

  if (isVert) {
    leftRect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height * ratio };
    rightRect = { x: rect.x, y: rect.y + rect.height * ratio, width: rect.width, height: rect.height * (1 - ratio) };
  } else {
    leftRect = { x: rect.x, y: rect.y, width: rect.width * ratio, height: rect.height };
    rightRect = { x: rect.x + rect.width * ratio, y: rect.y, width: rect.width * (1 - ratio), height: rect.height };
  }

  return [
    ...getTerminalRects(node.children[0], leftRect),
    ...getTerminalRects(node.children[1], rightRect),
  ];
}

// Helper: Replace node in binary tree
function replaceNode(
  tree: PaneNode,
  targetId: string,
  replacer: (found: PaneNode) => PaneNode
): PaneNode {
  if (tree.id === targetId) {
    return replacer(tree);
  }
  if (tree.type === 'split') {
    return {
      ...tree,
      children: [
        replaceNode(tree.children[0], targetId, replacer),
        replaceNode(tree.children[1], targetId, replacer),
      ],
    };
  }
  return tree;
}

// Helper: Remove terminal node and promote sibling
function removeTerminalNode(tree: PaneNode, targetId: string): PaneNode | null {
  if (tree.type === 'terminal') {
    return tree.id === targetId ? null : tree;
  }

  const left = removeTerminalNode(tree.children[0], targetId);
  const right = removeTerminalNode(tree.children[1], targetId);

  if (left === null) return right;
  if (right === null) return left;

  return {
    ...tree,
    children: [left, right],
  };
}

let uniqueCounter = 1;

// Helper: Create terminal node
function createTerm(idx: number): TerminalNode {
  uniqueCounter++;
  return {
    type: 'terminal',
    id: `term-${Date.now()}-${uniqueCounter}-${Math.floor(Math.random() * 10000)}`,
    title: `Terminal ${idx}`,
  };
}

// Helper: Create unique split node ID
function nextSplitId(): string {
  uniqueCounter++;
  return `split-${Date.now()}-${uniqueCounter}-${Math.floor(Math.random() * 10000)}`;
}

// Helper: Combine terminal nodes horizontally into a row
function createRow(terms: TerminalNode[]): PaneNode {
  if (terms.length === 1) return terms[0];
  if (terms.length === 2) {
    return {
      type: 'split',
      id: nextSplitId(),
      direction: 'horizontal',
      ratio: 0.5,
      children: [terms[0], terms[1]],
    };
  }
  if (terms.length === 3) {
    return {
      type: 'split',
      id: nextSplitId(),
      direction: 'horizontal',
      ratio: 1 / 3,
      children: [
        terms[0],
        {
          type: 'split',
          id: nextSplitId(),
          direction: 'horizontal',
          ratio: 0.5,
          children: [terms[1], terms[2]],
        },
      ],
    };
  }
  // 4 terms in row
  const left = createRow(terms.slice(0, 2));
  const right = createRow(terms.slice(2, 4));
  return {
    type: 'split',
    id: nextSplitId(),
    direction: 'horizontal',
    ratio: 0.5,
    children: [left, right],
  };
}

// Helper: Combine rows vertically into equal grid
function combineRows(rows: PaneNode[]): PaneNode {
  if (rows.length === 1) return rows[0];
  if (rows.length === 2) {
    return {
      type: 'split',
      id: nextSplitId(),
      direction: 'vertical',
      ratio: 0.5,
      children: [rows[0], rows[1]],
    };
  }
  // 4 rows
  const top = combineRows(rows.slice(0, 2));
  const bottom = combineRows(rows.slice(2, 4));
  return {
    type: 'split',
    id: nextSplitId(),
    direction: 'vertical',
    ratio: 0.5,
    children: [top, bottom],
  };
}

// Helper: Generate preset layout tree (1, 2, 4, 6, 8, 16)
function buildPresetTree(count: 1 | 2 | 4 | 6 | 8 | 16): { root: PaneNode; firstPaneId: string } {
  const terms = Array.from({ length: count }, (_, i) => createTerm(i + 1));
  const firstPaneId = terms[0].id;

  if (count === 1) return { root: terms[0], firstPaneId };
  if (count === 2) return { root: createRow(terms), firstPaneId };

  let numRows = 2;
  if (count === 16) numRows = 4;
  const colsPerRow = count / numRows;

  const rows: PaneNode[] = [];
  for (let r = 0; r < numRows; r++) {
    const rowTerms = terms.slice(r * colsPerRow, (r + 1) * colsPerRow);
    rows.push(createRow(rowTerms));
  }

  return { root: combineRows(rows), firstPaneId };
}

export const usePaneStore = create<PaneState>((set, get) => ({
  root: initialRoot,
  focusedPaneId: initialTerminalId,
  maximizedPaneId: null,
  paneCount: 1,
  maxPanes: 16,
  layoutMode: 'preset',
  presetCount: 1,

  splitPane: (targetId: string, direction: SplitDirection): boolean => {
    const { root, paneCount, maxPanes } = get();

    if (paneCount >= maxPanes) {
      return false;
    }

    const terminals = getTerminalNodes(root);
    const parentNode = terminals.find((t) => t.id === targetId);

    const newTermId = `term-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newTermNode: TerminalNode = {
      type: 'terminal',
      id: newTermId,
      title: `Terminal ${paneCount + 1}`,
      cwd: parentNode?.cwd,
    };

    const newRoot = replaceNode(root, targetId, (existingNode) => {
      const splitNode: SplitNode = {
        type: 'split',
        id: nextSplitId(),
        direction,
        ratio: 0.5,
        children: [existingNode, newTermNode],
      };
      return splitNode;
    });

    const newCount = countTerminals(newRoot);

    set({
      root: newRoot,
      focusedPaneId: newTermId,
      paneCount: newCount,
      layoutMode: 'custom', // Switch to custom layout on split
    });

    return true;
  },

  closePane: (targetId: string) => {
    const { root, paneCount, focusedPaneId, maximizedPaneId } = get();

    if (paneCount <= 1) {
      const resetTermId = `term-${Date.now()}`;
      set({
        root: {
          type: 'terminal',
          id: resetTermId,
          title: 'Terminal 1',
        },
        focusedPaneId: resetTermId,
        maximizedPaneId: null,
        paneCount: 1,
        layoutMode: 'preset',
        presetCount: 1,
      });
      return;
    }

    const updatedRoot = removeTerminalNode(root, targetId);
    if (!updatedRoot) return;

    const remainingTerminals = getTerminalNodes(updatedRoot);
    const newCount = remainingTerminals.length;

    let newFocusedId = focusedPaneId;
    if (focusedPaneId === targetId) {
      newFocusedId = remainingTerminals[remainingTerminals.length - 1]?.id || null;
    }

    set({
      root: updatedRoot,
      focusedPaneId: newFocusedId,
      maximizedPaneId: maximizedPaneId === targetId ? null : maximizedPaneId,
      paneCount: newCount,
      layoutMode: 'custom',
    });
  },

  setRatio: (splitId: string, ratio: number) => {
    const clampedRatio = Math.max(0.1, Math.min(0.9, ratio));
    const newRoot = replaceNode(get().root, splitId, (node) => {
      if (node.type === 'split') {
        return { ...node, ratio: clampedRatio };
      }
      return node;
    });
    set({ root: newRoot, layoutMode: 'custom' });
  },

  setFocusedPane: (id: string) => {
    set({ focusedPaneId: id });
  },

  setPanePtyId: (nodeId: string, ptyPaneId: string) => {
    const newRoot = replaceNode(get().root, nodeId, (node) => {
      if (node.type === 'terminal') {
        return { ...node, paneId: ptyPaneId };
      }
      return node;
    });
    set({ root: newRoot });
  },

  setPaneTitle: (nodeId: string, title: string) => {
    const newRoot = replaceNode(get().root, nodeId, (node) => {
      if (node.type === 'terminal') {
        return { ...node, title };
      }
      return node;
    });
    set({ root: newRoot });
  },

  setPaneCwd: (nodeId: string, cwd: string) => {
    const newRoot = replaceNode(get().root, nodeId, (node) => {
      if (node.type === 'terminal') {
        return { ...node, cwd };
      }
      return node;
    });
    set({ root: newRoot });
  },

  toggleMaximize: (id?: string) => {
    const { focusedPaneId, maximizedPaneId } = get();
    const targetId = id || focusedPaneId;
    if (!targetId) return;

    if (maximizedPaneId === targetId) {
      set({ maximizedPaneId: null });
    } else {
      set({ maximizedPaneId: targetId });
    }
  },

  navigateFocus: (direction) => {
    const { root, focusedPaneId } = get();
    const terminalRects = getTerminalRects(root);

    if (terminalRects.length === 0) return;

    const curr = terminalRects.find((t) => t.node.id === focusedPaneId);
    if (!curr) {
      set({ focusedPaneId: terminalRects[0].node.id });
      return;
    }

    if (direction === 'next' || direction === 'prev') {
      const idx = terminalRects.findIndex((t) => t.node.id === focusedPaneId);
      const delta = direction === 'next' ? 1 : -1;
      const nextIdx = (idx + delta + terminalRects.length) % terminalRects.length;
      set({ focusedPaneId: terminalRects[nextIdx].node.id });
      return;
    }

    const currCenterX = curr.rect.x + curr.rect.width / 2;
    const currCenterY = curr.rect.y + curr.rect.height / 2;

    const candidates = terminalRects.filter((t) => {
      if (t.node.id === focusedPaneId) return false;
      const cx = t.rect.x + t.rect.width / 2;
      const cy = t.rect.y + t.rect.height / 2;

      if (direction === 'left') return cx < currCenterX - 0.1;
      if (direction === 'right') return cx > currCenterX + 0.1;
      if (direction === 'up') return cy < currCenterY - 0.1;
      if (direction === 'down') return cy > currCenterY + 0.1;
      return false;
    });

    if (candidates.length === 0) {
      return;
    }

    let closestNodeId = candidates[0].node.id;
    let minDistance = Infinity;

    for (const cand of candidates) {
      const cx = cand.rect.x + cand.rect.width / 2;
      const cy = cand.rect.y + cand.rect.height / 2;
      const dist = Math.hypot(cx - currCenterX, cy - currCenterY);
      if (dist < minDistance) {
        minDistance = dist;
        closestNodeId = cand.node.id;
      }
    }

    set({ focusedPaneId: closestNodeId });
  },

  // Set Preset Equal Grid Layout (1, 2, 4, 6, 8, 16)
  setLayoutPreset: (count) => {
    const { root, firstPaneId } = buildPresetTree(count);
    set({
      root,
      focusedPaneId: firstPaneId,
      maximizedPaneId: null,
      paneCount: count,
      layoutMode: 'preset',
      presetCount: count,
    });
  },

  resetLayout: () => {
    const newId = `term-${Date.now()}`;
    set({
      root: {
        type: 'terminal',
        id: newId,
        title: 'Terminal 1',
      },
      focusedPaneId: newId,
      maximizedPaneId: null,
      paneCount: 1,
      layoutMode: 'preset',
      presetCount: 1,
    });
  },
}));
