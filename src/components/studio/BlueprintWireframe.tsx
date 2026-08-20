import React from 'react';

export type WireframeType =
  | 'solo'
  | 'dual-v'
  | 'dual-h'
  | 'golden'
  | 'triple'
  | 'quad'
  | 'hex'
  | 'octa'
  | 'mega'
  | 'grid';

export interface BlueprintWireframeProps {
  type: WireframeType;
  isSelected?: boolean;
  cols?: number;
  rows?: number;
  className?: string;
}

export const BlueprintWireframe: React.FC<BlueprintWireframeProps> = ({
  type,
  isSelected = false,
  cols = 2,
  rows = 2,
  className = '',
}) => {
  const paneBorder = isSelected
    ? 'border-[#5683da] bg-[#5683da]/20 shadow-none'
    : 'border-[#4a4b50] bg-[#090a0c] group-hover:border-[#5683da]';

  const masterPaneBorder = isSelected
    ? 'border-[#5683da] bg-[#5683da]/30 shadow-none'
    : 'border-[#4a4b50] bg-[#090a0c] group-hover:border-[#5683da]';

  return (
    <div
      className={`w-full h-16 rounded-xl bg-[#111111] p-1.5 border transition-all duration-150 flex items-center justify-center overflow-hidden select-none ${
        isSelected ? 'border-[#5683da]' : 'border-[#4a4b50]'
      } ${className}`}
    >
      {/* 1. Solo (1x1) */}
      {type === 'solo' && (
        <div className={`w-full h-full rounded-[4px] border transition-colors ${paneBorder}`} />
      )}

      {/* 2. Dual Vertical (1x2 side-by-side) */}
      {type === 'dual-v' && (
        <div className="grid grid-cols-2 gap-1 w-full h-full">
          <div className={`rounded-[4px] border transition-colors ${paneBorder}`} />
          <div className={`rounded-[4px] border transition-colors ${paneBorder}`} />
        </div>
      )}

      {/* 3. Dual Horizontal (2x1 stacked) */}
      {type === 'dual-h' && (
        <div className="grid grid-rows-2 gap-1 w-full h-full">
          <div className={`rounded-[4px] border transition-colors ${paneBorder}`} />
          <div className={`rounded-[4px] border transition-colors ${paneBorder}`} />
        </div>
      )}

      {/* 4. Golden Ratio (AI Pair: 1 Master Left + 2 Stacked Right) */}
      {type === 'golden' && (
        <div className="grid grid-cols-12 gap-1 w-full h-full">
          <div className={`col-span-7 rounded-[4px] border transition-colors ${masterPaneBorder}`} />
          <div className="col-span-5 grid grid-rows-2 gap-1 h-full">
            <div className={`rounded-[4px] border transition-colors ${paneBorder}`} />
            <div className={`rounded-[4px] border transition-colors ${paneBorder}`} />
          </div>
        </div>
      )}

      {/* 5. Triple Column (1x3) */}
      {type === 'triple' && (
        <div className="grid grid-cols-3 gap-1 w-full h-full">
          <div className={`rounded-[4px] border transition-colors ${paneBorder}`} />
          <div className={`rounded-[4px] border transition-colors ${paneBorder}`} />
          <div className={`rounded-[4px] border transition-colors ${paneBorder}`} />
        </div>
      )}

      {/* 6. Quad Grid (2x2) */}
      {type === 'quad' && (
        <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-full">
          <div className={`rounded-[4px] border transition-colors ${paneBorder}`} />
          <div className={`rounded-[4px] border transition-colors ${paneBorder}`} />
          <div className={`rounded-[4px] border transition-colors ${paneBorder}`} />
          <div className={`rounded-[4px] border transition-colors ${paneBorder}`} />
        </div>
      )}

      {/* 7. Hex Swarm (3x2) */}
      {type === 'hex' && (
        <div className="grid grid-cols-3 grid-rows-2 gap-1 w-full h-full">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`rounded-[3px] border transition-colors ${paneBorder}`} />
          ))}
        </div>
      )}

      {/* 8. Octa Matrix (4x2) */}
      {type === 'octa' && (
        <div className="grid grid-cols-4 grid-rows-2 gap-0.5 w-full h-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`rounded-[2px] border transition-colors ${paneBorder}`} />
          ))}
        </div>
      )}

      {/* 9. Mega Matrix (4x4) */}
      {type === 'mega' && (
        <div className="grid grid-cols-4 grid-rows-4 gap-0.5 w-full h-full">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className={`rounded-[1.5px] border transition-colors ${paneBorder}`} />
          ))}
        </div>
      )}

      {/* Generic N x M Matrix */}
      {type === 'grid' && (
        <div
          className="grid gap-1 w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: cols * rows }).map((_, i) => (
            <div key={i} className={`rounded-[2px] border transition-colors ${paneBorder}`} />
          ))}
        </div>
      )}
    </div>
  );
};
