import React, { useCallback, useEffect, useRef } from 'react';
import { Allotment, AllotmentHandle } from 'allotment';
import 'allotment/dist/style.css';

import { PaneNode, SplitNode } from '@/types/layout';
import { TerminalContainer } from '../terminal/TerminalContainer';
import { usePaneStore, equalPresetRatio } from '@/store/usePaneStore';
import { useSettingsStore } from '@/store/useSettingsStore';

interface GridRendererProps {
  node: PaneNode;

  depth?: number;
}

export const GridRenderer: React.FC<GridRendererProps> = React.memo(({ node, depth = 0 }) => {
  const maximizedPaneId = usePaneStore((s) => s.maximizedPaneId);

  if (maximizedPaneId) {
    return (
      <div className="h-full w-full p-1 bg-[#090a0c]">
        <TerminalContainer id={maximizedPaneId} title="Maximized Pane" />
      </div>
    );
  }

  if (node.type === 'terminal') {
    return (
      <div className="h-full w-full p-1 min-h-0 min-w-0 overflow-hidden bg-[#090a0c]">
        <TerminalContainer id={node.id} title={node.title} />
      </div>
    );
  }

  return <SplitView node={node} depth={depth} />;
});

const SplitView: React.FC<{ node: SplitNode; depth: number }> = React.memo(({ node, depth }) => {
  const setRatio = usePaneStore((s) => s.setRatio);

  const minPaneSize = useSettingsStore((s) => s.minPaneSize);

  const effectiveMin = Math.max(24, Math.round(minPaneSize / (depth + 1)));
  const snapEpsilon = useSettingsStore((s) => s.snapEpsilon);
  const dividerSnap = useSettingsStore((s) => s.dividerSnap);
  const doubleClickEqualize = useSettingsStore((s) => s.doubleClickEqualize);
  const isVertical = node.direction === 'vertical';

  const handleRatioChange = (sizes: number[]) => {
    if (sizes.length === 2) {
      const total = sizes[0] + sizes[1];
      if (total > 0) {
        const newRatio = sizes[0] / total;
        setRatio(node.id, newRatio);
      }
    }
  };

  const allotmentRef = useRef<AllotmentHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const leftChildId = node.children[0].id;
  const rightChildId = node.children[1].id;
  useEffect(() => {
    allotmentRef.current?.reset();
  }, [leftChildId, rightChildId]);

  useEffect(() => {
    allotmentRef.current?.reset();
    const el = containerRef.current;
    if (!el) return;

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

  const equalize = useCallback(() => {

    equalizeRequestedRef.current = true;
    setRatio(node.id, targetRatio);
  }, [node.id, targetRatio, setRatio]);

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
      className="relative h-full w-full bg-[#090a0c] overflow-hidden min-h-0 min-w-0"
      onDoubleClick={handleDoubleClick}
    >
      <div ref={containerRef} className="h-full w-full min-h-0 min-w-0">
        <Allotment
          ref={allotmentRef}
          vertical={isVertical}
          onChange={handleRatioChange}
          onDragStart={() => {

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
