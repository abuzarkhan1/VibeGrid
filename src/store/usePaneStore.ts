import { create } from 'zustand';
import { PaneNode, SplitDirection, TerminalNode, SplitNode } from '@/types/layout';
import { killPty } from '@/lib/tauri';

// Workspace isolation: PTYs are killed ONLY by explicit destructive actions
// (closePane / shrinking a layout preset / resetLayout / deleteWorkspace).
// Switching workspaces never kills, and EXPANDING a preset grid never kills —
// existing terminals (with their live paneIds) are kept and only the missing
// panes are added alongside them.
function killPanesInLayout(layout: PaneNode) {
  for (const t of getTerminalNodes(layout)) {
    if (t.paneId) killPty(t.paneId).catch(() => {});
  }
}

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
  /** Per-pane shell override (audit: `shell` field was dead — now wired). */
  setPaneShell: (nodeId: string, shell: string) => void;
  /** Swap the content of two terminal panes (audit: pane swap was MISSING). */
  swapPanes: (idA: string, idB: string) => void;
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

// Helper: Generate preset layout tree (1, 2, 4, 6, 8, 16) from an explicit
// list of terminal nodes — lets expansion keep existing terminals (with live
// paneIds) instead of always creating fresh ones.
function buildPresetTreeFromNodes(terms: TerminalNode[]): { root: PaneNode; firstPaneId: string } {
  const count = terms.length;
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

/**
 * Decide which terminals survive a preset-grid shrink (and reset-to-1): the
 * focused pane is always kept, then the next (count-1) in tree order. Used by
 * BOTH the store (to kill the removed ones) and the guard (to know whether any
 * removed pane has a running process — the only case that needs confirming).
 */
/**
 * Is the tree an EQUAL preset grid of `count` cells (every split at ratio
 * ~0.5)? Used to decide whether clicking the already-active grid button should
 * no-op (nothing to change) or re-equalize a grid the user dragged (UX audit
 * P3 #11: preset grids are resizable now, so the active button re-equalizes).
 *
 * REVIEWER FIX: the old terminal-leaf case returned `count === 1`, which is
 * false for every leaf in a multi-pane grid — so the no-op never fired and the
 * active button always rebuilt. Now the leaf returns true and the terminal
 * count is checked once at the root.
 *
 * VERIFY FIX: a 3-terminal ROW (as in the 6-pane preset) splits at ratio 1/3,
 * not 0.5 — the previous check only accepted 0.5, so a pristine 6-pane grid
 * was never "equal" and clicking the active "6" button rebuilt it on every
 * click. Each split now compares against the ratio its subtree shape would
 * produce: 1/3 for a 3-terminal node, 0.5 otherwise (1/2/4/8/16 presets are
 * all 0.5 splits).
 */
export function isEqualPresetTree(node: PaneNode, count: number): boolean {
  if (countTerminals(node) !== count) return false;
  return isEqualPresetShape(node);
}

/**
 * Pure shape check (no count): every split must sit at the ratio its subtree
 * shape would produce in the pristine preset — 1/3 for a 3-terminal row,
 * 0.5 otherwise. The count comparison lives ONLY in isEqualPresetTree (at the
 * root); re-checking it here would fail every child split below the root
 * (e.g. a 3-terminal row inside a 6-pane grid), making multi-pane grids
 * never "equal" — the exact bug this fixes.
 */
function isEqualPresetShape(node: PaneNode): boolean {
  if (node.type === 'terminal') return true;
  if (node.type === 'split') {
    const targetRatio = countTerminals(node) === 3 ? 1 / 3 : 0.5;
    if (Math.abs(node.ratio - targetRatio) > 0.01) return false;
    return isEqualPresetShape(node.children[0]) && isEqualPresetShape(node.children[1]);
  }
  return false;
}

/**
 * The ratio a split node would have in its pristine equal preset grid: 1/3 for
 * a 3-terminal row (6-pane preset), 0.5 everywhere else. Mirrors
 * isEqualPresetTree so GridRenderer can tell "equal" splits apart from
 * user-dragged ones.
 */
export function equalPresetRatio(node: PaneNode): number {
  return countTerminals(node) === 3 ? 1 / 3 : 0.5;
}

export function planPresetKeep(
  terminals: TerminalNode[],
  focusedPaneId: string | null,
  count: number
): { kept: TerminalNode[]; removed: TerminalNode[] } {
  const focused = terminals.find((t) => t.id === focusedPaneId) ?? terminals[0];
  const kept: TerminalNode[] = focused ? [focused] : [];
  for (const t of terminals) {
    if (kept.length >= count) break;
    if (t.id !== focused?.id) kept.push(t);
  }
  const keptIds = new Set(kept.map((t) => t.id));
  const removed = terminals.filter((t) => !keptIds.has(t.id));
  return { kept, removed };
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

    // Explicit close = kill this pane's process (the ONLY path that kills on
    // close — switching workspaces must never terminate a pane's PTY).
    const closingNode = getTerminalNodes(root).find((t) => t.id === targetId);
    if (closingNode?.paneId) killPty(closingNode.paneId).catch(() => {});

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
    // UX audit P3 #11: dragging a divider in a PRESET grid now resizes it but
    // keeps its preset identity (Header button stays highlighted, view state
    // restored on switch-back). Only a real split/close demotes to 'custom'.
    const keepPreset = get().layoutMode === 'preset';
    set({ root: newRoot, layoutMode: keepPreset ? 'preset' : 'custom' });
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

  setPaneShell: (nodeId: string, shell: string) => {
    const newRoot = replaceNode(get().root, nodeId, (node) => {
      if (node.type === 'terminal') {
        return { ...node, shell: shell || undefined };
      }
      return node;
    });
    set({ root: newRoot });
  },

  // Swap the contents (title/cwd/shell/paneId) of two terminal nodes so the
  // panes physically swap places. Identities (layout ids) stay put, so React
  // keeps each xterm mounted and the PTYs move with their shells.
  swapPanes: (idA: string, idB: string) => {
    if (idA === idB) return;
    const terminals = getTerminalNodes(get().root);
    const a = terminals.find((t) => t.id === idA);
    const b = terminals.find((t) => t.id === idB);
    if (!a || !b) return;

    const swap = (tree: PaneNode): PaneNode => {
      if (tree.type === 'terminal') {
        if (tree.id === idA) return { ...tree, title: b.title, cwd: b.cwd, shell: b.shell, paneId: b.paneId };
        if (tree.id === idB) return { ...tree, title: a.title, cwd: a.cwd, shell: a.shell, paneId: a.paneId };
        return tree;
      }
      return {
        ...tree,
        children: [swap(tree.children[0]), swap(tree.children[1])],
      };
    };
    set({ root: swap(get().root) });
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

  // Set Preset Equal Grid Layout (1, 2, 4, 6, 8, 16).
  //   count > current → NON-DESTRUCTIVE EXPANSION: every existing terminal
  //     keeps its live paneId; only the missing panes are added fresh.
  //   count < current → SHRINK: the focused pane stays; the extras are closed
  //     (explicit destructive action — the UI guard confirms when any of them
  //     has a running process).
  //   count == current → nothing to change (guard short-circuits too).
  setLayoutPreset: (count) => {
    const { root, paneCount, focusedPaneId, layoutMode, presetCount } = get();
    const terminals = getTerminalNodes(root);

    if (paneCount === count) {
      // Already an EQUAL preset grid of this size → nothing to change. But a
      // CUSTOM layout with the same pane count, or a preset grid the user
      // dragged (unequal ratios), gets re-gridded to an equal preset —
      // NON-destructively: the same terminal nodes (with live paneIds) are
      // re-laid out, nothing is killed.
      if (layoutMode === 'preset' && presetCount === count && isEqualPresetTree(root, count)) return;
      const { root: newRoot, firstPaneId } = buildPresetTreeFromNodes(terminals);
      set({
        root: newRoot,
        focusedPaneId: focusedPaneId ?? firstPaneId,
        maximizedPaneId: null,
        paneCount: count,
        layoutMode: 'preset',
        presetCount: count,
      });
      return;
    }

    if (count > paneCount) {
      // Expansion: keep every existing terminal node (paneIds intact!) and
      // create only (count - paneCount) new ones.
      const existing = terminals;
      const added: TerminalNode[] = [];
      for (let i = existing.length + 1; i <= count; i++) added.push(createTerm(i));
      const { root: newRoot, firstPaneId } = buildPresetTreeFromNodes([...existing, ...added]);
      set({
        root: newRoot,
        focusedPaneId: focusedPaneId ?? firstPaneId,
        maximizedPaneId: null,
        paneCount: count,
        layoutMode: 'preset',
        presetCount: count,
      });
      return;
    }

    // Shrink: keep the focused pane + first (count-1) others, close the rest.
    const { kept, removed } = planPresetKeep(terminals, focusedPaneId, count);
    for (const t of removed) {
      if (t.paneId) killPty(t.paneId).catch(() => {});
    }
    const { root: newRoot, firstPaneId } = buildPresetTreeFromNodes(kept);
    set({
      root: newRoot,
      focusedPaneId: kept[0]?.id ?? firstPaneId,
      maximizedPaneId: null,
      paneCount: count,
      layoutMode: 'preset',
      presetCount: count,
    });
  },

  // Reset to a single pane: keep the FOCUSED terminal (and its process) and
  // close every other pane. No longer nukes the whole grid — the pane you are
  // working in survives.
  resetLayout: () => {
    const { root, focusedPaneId } = get();
    const terminals = getTerminalNodes(root);
    const focused = terminals.find((t) => t.id === focusedPaneId) ?? terminals[0];
    for (const t of terminals) {
      if (t.id !== focused?.id && t.paneId) killPty(t.paneId).catch(() => {});
    }
    set({
      root: focused ?? { type: 'terminal', id: `term-${Date.now()}`, title: 'Terminal 1' },
      focusedPaneId: focused?.id ?? `term-${Date.now()}`,
      maximizedPaneId: null,
      paneCount: 1,
      layoutMode: 'preset',
      presetCount: 1,
    });
  },
}));

export { killPanesInLayout };
