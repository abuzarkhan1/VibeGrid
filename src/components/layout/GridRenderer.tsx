import React, { useEffect, useRef } from 'react';
import { Allotment, AllotmentHandle } from 'allotment';
import 'allotment/dist/style.css';

import { PaneNode, SplitNode } from '@/types/layout';
import { TerminalContainer } from '../terminal/TerminalContainer';
import { usePaneStore, equalPresetRatio } from '@/store/usePaneStore';

interface GridRendererProps {
  node: PaneNode;
}

export const GridRenderer: React.FC<GridRendererProps> = ({ node }) => {
  const { maximizedPaneId } = usePaneStore();

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
};

// A single split: renders through Allotment (resizable) and snaps back to the
// pristine equal ratio when the store re-equalizes a preset the user dragged.
// `node` is already narrowed to a split by the parent's early returns, but
// the explicit SplitNode prop keeps the hooks' property access type-safe.
const SplitView: React.FC<{ node: SplitNode }> = ({ node }) => {
  const { setRatio } = usePaneStore();
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
  // otherwise keep the dragged widths. Watch the store ratio for a transition
  // INTO the pristine preset value and call reset(), which snaps the panes
  // back to their preferredSize (the equal split).
  const allotmentRef = useRef<AllotmentHandle>(null);
  const targetRatio = equalPresetRatio(node);
  const prevRatioRef = useRef(node.ratio);
  useEffect(() => {
    const wasEqual = Math.abs(prevRatioRef.current - targetRatio) <= 0.01;
    const isEqual = Math.abs(node.ratio - targetRatio) <= 0.01;
    if (!wasEqual && isEqual) {
      allotmentRef.current?.reset();
    }
    prevRatioRef.current = node.ratio;
  }, [node.ratio, targetRatio]);

  return (
    <div className="relative h-full w-full bg-bgDark overflow-hidden min-h-0 min-w-0">
      <Allotment
        ref={allotmentRef}
        vertical={isVertical}
        onChange={handleRatioChange}
        separator={true}
        className="vibegrid-allotment"
      >
        <Allotment.Pane preferredSize={`${node.ratio * 100}%`}>
          <GridRenderer node={node.children[0]} />
        </Allotment.Pane>
        <Allotment.Pane preferredSize={`${(1 - node.ratio) * 100}%`}>
          <GridRenderer node={node.children[1]} />
        </Allotment.Pane>
      </Allotment>
    </div>
  );
};
