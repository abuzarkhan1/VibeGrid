import React from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';

import { PaneNode } from '@/types/layout';
import { TerminalContainer } from '../terminal/TerminalContainer';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';

interface GridRendererProps {
  node: PaneNode;
}

export const GridRenderer: React.FC<GridRendererProps> = ({ node }) => {
  const { setRatio, maximizedPaneId, layoutMode, presetCount } = usePaneStore();

  // If a pane is maximized, render only that pane
  if (maximizedPaneId) {
    return (
      <div className="h-full w-full p-1 bg-black/40">
        <TerminalContainer id={maximizedPaneId} title="Maximized Pane" />
      </div>
    );
  }

  // If preset mode is active and count > 1, render equal CSS Grid layout
  if (layoutMode === 'preset' && presetCount > 1) {
    const terminals = getTerminalNodes(node);

    let gridClass = 'grid-cols-2 grid-rows-1';
    if (presetCount === 4) gridClass = 'grid-cols-2 grid-rows-2';
    if (presetCount === 6) gridClass = 'grid-cols-3 grid-rows-2';
    if (presetCount === 8) gridClass = 'grid-cols-4 grid-rows-2';
    if (presetCount === 16) gridClass = 'grid-cols-4 grid-rows-4';

    return (
      <div className={`w-full h-full grid ${gridClass} gap-1.5 p-1 bg-black/40 overflow-hidden`}>
        {terminals.map((termNode) => (
          <div key={termNode.id} className="w-full h-full min-h-0 min-w-0 overflow-hidden relative">
            <TerminalContainer id={termNode.id} title={termNode.title} />
          </div>
        ))}
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

  // If node is a split node (Custom binary tree split mode)
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

  return (
    <div className="relative h-full w-full bg-black/40 overflow-hidden min-h-0 min-w-0">
      <Allotment
        vertical={isVertical}
        onChange={handleRatioChange}
        separator={true}
        className="vibegrid-allotment"
      >
        <Allotment.Pane preferredSize={`${node.ratio * 100}%`}>
          <GridRenderer node={node.children[0]} />
        </Allotment.Pane>
        <Allotment.Pane>
          <GridRenderer node={node.children[1]} />
        </Allotment.Pane>
      </Allotment>
    </div>
  );
};
