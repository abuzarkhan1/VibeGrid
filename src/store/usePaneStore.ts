import { create } from 'zustand';
import { PaneNode, SplitDirection, TerminalNode, SplitNode, PaneAppearance } from '@/types/layout';
import { killPty } from '@/lib/tauri';
import { useSettingsStore } from './useSettingsStore';

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

/** Preset equal-grid counts (customization audit L12: 3/5/9/12 were MISSING). */
export type PresetCount = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 9 | 12 | 16;

interface PaneState {
  root: PaneNode;
  focusedPaneId: string | null;
  maximizedPaneId: string | null;
  paneCount: number;
  maxPanes: number;
  layoutMode: 'preset' | 'custom';
  presetCount: PresetCount;
  /**
   * Monotonic generation counter bumped on every STRUCTURAL layout change
   * (preset re-grid, split, close, reset). App.tsx keys the root GridRenderer
   * on it, forcing a full remount of the Allotment tree. This is the only
   * reliable fix for allotment v1's in-place restructure bug: when the same
   * Allotment component instance receives a deeper/taller child tree (e.g.
   * preset 6→9 changes the nesting depth), it keeps stale internal sizes and
   * collapses panes to zero — reset()/ResizeObserver cannot recover it, but a
   * fresh mount always measures correctly. Terminals re-attach to their live
   * PTY paneIds on remount (workspace-switch path), so no shell is lost.
   */
  gridVersion: number;

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
  /** Per-pane appearance overrides (customization audit C13). */
  setPaneAppearance: (nodeId: string, patch: PaneAppearance) => void;
  /** Remove ALL per-pane appearance overrides for a pane (C13). */
  clearPaneAppearance: (nodeId: string) => void;
  /** Swap the content of two terminal panes (audit: pane swap was MISSING). */
  swapPanes: (idA: string, idB: string) => void;
  toggleMaximize: (id?: string) => void;
  navigateFocus: (direction: 'left' | 'right' | 'up' | 'down' | 'next' | 'prev') => void;
  /** 0-based tree-order index of a terminal node (per-pane identity cues). */
  getPaneIndex: (nodeId: string) => number;
  setLayoutPreset: (count: PresetCount) => void;
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

// Helper: Combine rows vertically into an EQUAL grid — every row gets exactly
// 1/N of the height. Generic for any row count (2, 3, 4, …): splits at
// floor(N/2)/N so odd row counts stay equal too (3 rows → 1/3 | 2/3 where the
// 2/3 side splits 1/2+1/2). The old code only handled 1/2/4 rows, so the 3-row
// presets (9, 12) came out as 2 rows + 1 row at 50/50 — unequal grid heights.
function combineRows(rows: PaneNode[]): PaneNode {
  if (rows.length === 1) return rows[0];
  const k = Math.floor(rows.length / 2);
  return {
    type: 'split',
    id: nextSplitId(),
    direction: 'vertical',
    ratio: k / rows.length,
    children: [combineRows(rows.slice(0, k)), combineRows(rows.slice(k))],
  };
}

/**
 * How each preset grid splits into rows of terminals (customization audit L12).
 * Rows never exceed 4 cells (createRow handles 1–4; a 4-cell row is 2×2 with
 * 0.5 ratios, a 3-cell row splits 1/3 — both recognized by isEqualPresetShape).
 * The preset is the sum of its rows.
 */
const PRESET_ROW_LAYOUTS: Record<PresetCount, number[]> = {
  1: [1],
  2: [2],
  3: [3],
  4: [2, 2],
  5: [3, 2],
  6: [3, 3],
  8: [4, 4],
  9: [3, 3, 3],
  12: [4, 4, 4],
  16: [4, 4, 4, 4],
};

// Helper: Generate a preset layout tree from an explicit list of terminal nodes
// — lets expansion keep existing terminals (with live paneIds) instead of
// always creating fresh ones. Row structure comes from PRESET_ROW_LAYOUTS.
function buildPresetTreeFromNodes(terms: TerminalNode[]): { root: PaneNode; firstPaneId: string } {
  const count = terms.length as PresetCount;
  const firstPaneId = terms[0].id;

  if (count === 1) return { root: terms[0], firstPaneId };
  if (count === 2) return { root: createRow(terms), firstPaneId };

  const rows: PaneNode[] = [];
  let offset = 0;
  for (const rowSize of PRESET_ROW_LAYOUTS[count] ?? [count]) {
    const rowTerms = terms.slice(offset, offset + rowSize);
    if (rowTerms.length > 0) rows.push(createRow(rowTerms));
    offset += rowSize;
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
    const targetRatio = equalPresetRatio(node);
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
/** Number of ROWS in a subtree: terminals and horizontal (in-row) splits are
 *  one row; a vertical split is the sum of its children's rows. */
function countRows(node: PaneNode): number {
  if (node.type === 'terminal') return 1;
  if (node.direction === 'vertical') return countRows(node.children[0]) + countRows(node.children[1]);
  return 1;
}

/** The ratio a split node has in its pristine EQUAL preset grid.
 *  - Vertical splits (row breaks) split by ROW share: equal row heights even
 *    when rows hold different terminal counts (e.g. preset 5 = [3,2] rows,
 *    root ratio 0.5; preset 9 = 3 rows, root ratio 1/3).
 *  - Horizontal splits (inside a row) split by TERMINAL share (3-term row →
 *    1/3, 2/4-term rows → 0.5).
 *  This mirrors combineRows/createRow exactly and must match for
 *  isEqualPresetTree to recognize pristine grids (re-click no-op). */
export function equalPresetRatio(node: SplitNode): number {
  if (node.direction === 'vertical') {
    return countRows(node.children[0]) / countRows(node);
  }
  return countTerminals(node.children[0]) / countTerminals(node);
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
  // Customization audit L1: the pane ceiling is user-configurable now.
  maxPanes: useSettingsStore.getState().maxPanes,
  layoutMode: 'preset',
  presetCount: 1,
  gridVersion: 0,

  splitPane: (targetId: string, direction: SplitDirection): boolean => {
    const { root, paneCount } = get();
    // Read the LIVE setting so a maxPanes change applies immediately without
    // waiting for a store sync (customization audit L1).
    const maxPanes = useSettingsStore.getState().maxPanes;

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
      gridVersion: get().gridVersion + 1,
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
        gridVersion: get().gridVersion + 1,
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
      gridVersion: get().gridVersion + 1,
    });
  },

  setRatio: (splitId: string, ratio: number) => {
    // Customization audit L11: widen the ratio bounds — the GridRenderer's
    // minSize already prevents degenerate panes, so allow 2%–98% splits.
    const clampedRatio = Math.max(0.02, Math.min(0.98, ratio));
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

  setPaneAppearance: (nodeId: string, patch: PaneAppearance) => {
    const newRoot = replaceNode(get().root, nodeId, (node) => {
      if (node.type === 'terminal') {
        // Merge over the existing overrides, dropping undefined/empty entries
        // so clearing a single field (e.g. fontSize) really un-overrides it.
        const merged: PaneAppearance = { ...node.appearance, ...patch };
        const clean: PaneAppearance = {};
        (Object.entries(merged) as Array<[keyof PaneAppearance, string | number | undefined]>).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') clean[k] = v as never;
        });
        return { ...node, appearance: Object.keys(clean).length > 0 ? clean : undefined };
      }
      return node;
    });
    set({ root: newRoot });
  },

  clearPaneAppearance: (nodeId: string) => {
    const newRoot = replaceNode(get().root, nodeId, (node) => {
      if (node.type === 'terminal' && node.appearance) {
        const rest = { ...node };
        delete (rest as { appearance?: unknown }).appearance;
        return rest as TerminalNode;
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

  // 0-based tree-order index of a terminal node (for per-pane identity cues
  // like colored badges and alternating tints). -1 when not found.
  getPaneIndex: (nodeId: string) => {
    return getTerminalNodes(get().root).findIndex((t) => t.id === nodeId);
  },

  // Set Preset Equal Grid Layout (1, 2, 3, 4, 5, 6, 8, 9, 12, 16).
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
        gridVersion: get().gridVersion + 1,
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
        gridVersion: get().gridVersion + 1,
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
      gridVersion: get().gridVersion + 1,
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
      gridVersion: get().gridVersion + 1,
    });
  },
}));

export { killPanesInLayout };
