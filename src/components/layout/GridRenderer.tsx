import React, { useCallback, useEffect, useRef } from 'react';
import { Allotment, AllotmentHandle } from 'allotment';
import 'allotment/dist/style.css';

import { PaneNode, SplitNode } from '@/types/layout';
import { TerminalContainer } from '../terminal/TerminalContainer';
import { usePaneStore, equalPresetRatio } from '@/store/usePaneStore';
import { useSettingsStore } from '@/store/useSettingsStore';

interface GridRendererProps {
  node: PaneNode;
  /** Nesting depth (0 = top-level split). Used to scale the Allotment minSize
   *  down for nested grids so a 2×2/3×3/4×4 layout can never collapse when the
   *  fixed minPaneSize exceeds what a pane slot can hold. */
  depth?: number;
}

/**
 * Perf: memoized so that when an ancestor split's ratio changes (divider drag),
 * untouched subtrees — whose `node` reference is stable — skip re-rendering
 * entirely. Only the split being resized re-renders per drag frame.
 */
export const GridRenderer: React.FC<GridRendererProps> = React.memo(({ node, depth = 0 }) => {
  const maximizedPaneId = usePaneStore((s) => s.maximizedPaneId);

  // If a pane is maximized, render only that pane
  if (maximizedPaneId) {
    return (
      <div className="h-full w-full p-1 bg-black">
        <TerminalContainer id={maximizedPaneId} title="Maximized Pane" />
      </div>
    );
  }

  // If node is a terminal leaf.
  if (node.type === 'terminal') {
    return (
      <div className="h-full w-full p-1 min-h-0 min-w-0 overflow-hidden bg-black">
        <TerminalContainer id={node.id} title={node.title} />
      </div>
    );
  }

  // Split node → dedicated component so the hooks below are never called
  // after an early return (react-hooks/rules-of-hooks).
  return <SplitView node={node} depth={depth} />;
});

// A single split: renders through Allotment (resizable) and snaps back to the
// pristine equal ratio when the store re-equalizes a preset the user dragged.
// `node` is already narrowed to a split by the parent's early returns, but
// the explicit SplitNode prop keeps the hooks' property access type-safe.
const SplitView: React.FC<{ node: SplitNode; depth: number }> = React.memo(({ node, depth }) => {
  const setRatio = usePaneStore((s) => s.setRatio);
  // Customization audit L9/L10/L11: min pane size, snap threshold, and the
  // snap + double-click behaviors are user settings now (fine-grained
  // selectors — these primitives only re-render this split, not the grid).
  const minPaneSize = useSettingsStore((s) => s.minPaneSize);
  // CRITICAL: scale the Allotment minSize down with nesting depth. Allotment
  // collapses a split to zero when the container is smaller than the sum of
  // its panes' minSizes — a fixed 120px min turns a 2×2 grid (inner splits
  // need 2×120 = 240px per column) into a BLANK area in medium windows, and
  // 3×3/4×4 grids get even worse. Deeper grids divide the min so panes always
  // fit their slot (preserving the setting's effect for top-level splits).
  const effectiveMin = Math.max(24, Math.round(minPaneSize / (depth + 1)));
  const snapEpsilon = useSettingsStore((s) => s.snapEpsilon);
  const dividerSnap = useSettingsStore((s) => s.dividerSnap);
  const doubleClickEqualize = useSettingsStore((s) => s.doubleClickEqualize);
  const isVertical = node.direction === 'vertical'; // vertical split = top/bottom layout

  const handleRatioChange = (sizes: number[]) => {
    if (sizes.length === 2) {
      const total = sizes[0] + sizes[1];
      if (total > 0) {
        const newRatio = sizes[0] / total;
        setRatio(node.id, newRatio);
      }
    }
  };

  // UX audit P3 #11 (verify fix): the Allotment is uncontrolled (no drag
  // fight), so when the store re-equalizes a preset the user had dragged — by
  // clicking the active grid button — the Allotment's internal sizes would
  // otherwise keep the dragged widths. Watch the store ratio and call reset(),
  // which snaps the panes back to their preferredSize (the equal split).
  const allotmentRef = useRef<AllotmentHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Nested-allotment measurement fix: allotment v1 measures its container at
  // first render, and a nested split inside a not-yet-laid-out parent pane can
  // bake in a 0/transposed size and never re-measure on its own — the deeper
  // preset grids (9/12/16) render blank rows because of it.
  //
  // TWO triggers re-run reset() (which re-applies preferredSize percentages
  // against the CURRENT container size, re-measuring what the first render
  // got wrong):
  //  1. A ResizeObserver on this split's own container — fires when the parent
  //     pane settles or the window resizes (any nesting depth, rAF-debounced).
  //  2. A structural change of this split's children. Kept as defense-in-depth
  //     only: the PRIMARY guarantee is the App.tsx remount (gridVersion key) —
  //     a live Allotment instance can never actually see its children change,
  //     because any structural re-grid bumps gridVersion and remounts the whole
  //     tree first. And it can never fire during a divider drag: setRatio
  //     changes the ratio, not the child identities.
  const leftChildId = node.children[0].id;
  const rightChildId = node.children[1].id;
  useEffect(() => {
    allotmentRef.current?.reset();
  }, [leftChildId, rightChildId]);

  useEffect(() => {
    allotmentRef.current?.reset();
    const el = containerRef.current;
    if (!el) return;
    // rAF-debounced so a continuous window resize re-layouts each split at most
    // once per frame (no jank with 16 panes), while still catching every settle.
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => allotmentRef.current?.reset());
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const targetRatio = equalPresetRatio(node);
  const prevRatioRef = useRef(node.ratio);
  // REVIEWER FIX: an explicit equalize() (snap on drag-end, double-click)
  // requests a reset UNCONDITIONALLY once the store lands on the target ratio.
  // Relying on the transition check alone failed exactly in the near-equal
  // case: dragging to 0.49 leaves prevRatioRef within 0.01 of 0.5, so
  // `!wasEqual && isEqual` was false and reset() never fired — the panes kept
  // the dragged 0.49 while the store recorded 0.5. A stale flag (equalize at
  // an already-equal ratio) is harmless: the next ratio change consumes it
  // without doing anything wrong.
  const equalizeRequestedRef = useRef(false);
  useEffect(() => {
    const isEqual = Math.abs(node.ratio - targetRatio) <= 0.01;
    if (equalizeRequestedRef.current) {
      equalizeRequestedRef.current = false;
      if (isEqual) {
        allotmentRef.current?.reset();
      }
    } else {
      const wasEqual = Math.abs(prevRatioRef.current - targetRatio) <= 0.01;
      if (!wasEqual && isEqual) {
        allotmentRef.current?.reset();
      }
    }
    prevRatioRef.current = node.ratio;
  }, [node.ratio, targetRatio]);

  /** Re-balance this split back to its equal preset ratio. */
  const equalize = useCallback(() => {
    // setRatio alone is not enough: the effect below must be told to reset
    // (see the near-equal snap case above). Calling reset() HERE would run
    // BEFORE React commits the new ratio, so it would snap to the OLD sizes.
    equalizeRequestedRef.current = true;
    setRatio(node.id, targetRatio);
  }, [node.id, targetRatio, setRatio]);

  // Snap-to-equal: releasing the divider near the center settles it exactly.
  const handleDragEnd = useCallback(
    (sizes: number[]) => {
      if (sizes.length !== 2) return;
      const total = sizes[0] + sizes[1];
      if (total <= 0) return;
      const ratio = sizes[0] / total;
      if (dividerSnap && Math.abs(ratio - targetRatio) <= snapEpsilon) {
        equalize();
      }
    },
    [targetRatio, equalize, dividerSnap, snapEpsilon]
  );

  // Double-click on a divider re-equalizes that split (quick re-balance).
  // Allotment's sash element carries a CSS-module-hashed class containing
  // "sash" (and an ew/ns-resize cursor), so [class*="sash"] is a stable
  // match across allotment versions — pane chrome never contains it.
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const el = e.target as HTMLElement;
      if (doubleClickEqualize && el.closest('[class*="sash"]')) {
        equalize();
      }
    },
    [equalize, doubleClickEqualize]
  );

  return (
    // Pure Black background for the split container
    <div
      className="relative h-full w-full bg-black overflow-hidden min-h-0 min-w-0"
      onDoubleClick={handleDoubleClick}
    >
      <div ref={containerRef} className="h-full w-full min-h-0 min-w-0">
        <Allotment
          ref={allotmentRef}
          vertical={isVertical}
          onChange={handleRatioChange}
          onDragStart={() => {
            // A real drag starts: clear any stale equalize-request flag so it
            // can't fire a spurious reset() on the first drag frame (the flag is
            // left set when equalize() ran at an already-equal ratio).
            equalizeRequestedRef.current = false;
          }}
          onDragEnd={handleDragEnd}
          separator={true}
          className="vibegrid-allotment"
        >
          <Allotment.Pane minSize={effectiveMin} preferredSize={`${node.ratio * 100}%`}>
            <GridRenderer node={node.children[0]} depth={depth + 1} />
          </Allotment.Pane>
          <Allotment.Pane minSize={effectiveMin} preferredSize={`${(1 - node.ratio) * 100}%`}>
            <GridRenderer node={node.children[1]} depth={depth + 1} />
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
});