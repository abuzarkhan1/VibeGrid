import React, { useCallback, useEffect, useRef } from 'react';
import { Allotment, AllotmentHandle } from 'allotment';
import 'allotment/dist/style.css';

import { PaneNode, SplitNode } from '@/types/layout';
import { TerminalContainer } from '../terminal/TerminalContainer';
import { usePaneStore, equalPresetRatio } from '@/store/usePaneStore';
import { useSettingsStore } from '@/store/useSettingsStore';

interface GridRendererProps {
  node: PaneNode;
}

/**
 * Perf: memoized so that when an ancestor split's ratio changes (divider drag),
 * untouched subtrees — whose `node` reference is stable — skip re-rendering
 * entirely. Only the split being resized re-renders per drag frame.
 */
export const GridRenderer: React.FC<GridRendererProps> = React.memo(({ node }) => {
  const maximizedPaneId = usePaneStore((s) => s.maximizedPaneId);

  // If a pane is maximized, render only that pane
  if (maximizedPaneId) {
    return (
      <div className="h-full w-full p-1 bg-bgDark">
        <TerminalContainer id={maximizedPaneId} title="Maximized Pane" />
      </div>
    );
  }

  // If node is a terminal leaf
  if (node.type === 'terminal') {
    return (
      <div className="h-full w-full p-0.5 min-h-0 min-w-0 overflow-hidden">
        <TerminalContainer id={node.id} title={node.title} />
      </div>
    );
  }

  // Split node → dedicated component so the hooks below are never called
  // after an early return (react-hooks/rules-of-hooks).
  return <SplitView node={node} />;
});

// A single split: renders through Allotment (resizable) and snaps back to the
// pristine equal ratio when the store re-equalizes a preset the user dragged.
// `node` is already narrowed to a split by the parent's early returns, but
// the explicit SplitNode prop keeps the hooks' property access type-safe.
const SplitView: React.FC<{ node: SplitNode }> = React.memo(({ node }) => {
  const setRatio = usePaneStore((s) => s.setRatio);
  // Customization audit L9/L10/L11: min pane size, snap threshold, and the
  // snap + double-click behaviors are user settings now (fine-grained
  // selectors — these primitives only re-render this split, not the grid).
  const minPaneSize = useSettingsStore((s) => s.minPaneSize);
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
    <div
      className="relative h-full w-full bg-bgDark overflow-hidden min-h-0 min-w-0"
      onDoubleClick={handleDoubleClick}
    >
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
        <Allotment.Pane minSize={minPaneSize} preferredSize={`${node.ratio * 100}%`}>
          <GridRenderer node={node.children[0]} />
        </Allotment.Pane>
        <Allotment.Pane minSize={minPaneSize} preferredSize={`${(1 - node.ratio) * 100}%`}>
          <GridRenderer node={node.children[1]} />
        </Allotment.Pane>
      </Allotment>
    </div>
  );
});
