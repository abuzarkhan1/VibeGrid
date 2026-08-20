import React from 'react';
import { GridRenderer } from './GridRenderer';
import { RetroCrtOverlay } from '../terminal/RetroCrtOverlay';
import { usePaneStore } from '@/store/usePaneStore';

export const LayoutView: React.FC = () => {
  const root = usePaneStore((s) => s.root);
  const gridVersion = usePaneStore((s) => s.gridVersion);

  return (
    <div className="flex-1 h-full overflow-hidden relative bg-[#090a0c]">
      <GridRenderer key={gridVersion} node={root} />
      <RetroCrtOverlay />
    </div>
  );
};
