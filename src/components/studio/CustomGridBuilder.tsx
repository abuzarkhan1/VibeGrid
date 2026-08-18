import React, { useState } from 'react';
import { useLayoutStudioStore } from '@/store/useLayoutStudioStore';
import { RatioPreset, GutterPreset, RadiusPreset } from '@/types/layoutStudio';
import { Grid } from 'lucide-react';

const MAX_MATRIX_DIM = 8;

export const CustomGridBuilder: React.FC = () => {
  const {
    customRows,
    customCols,
    ratioMode,
    customRatioValue,
    gutterWidth,
    cornerRadius,
    terminalPadding,
    setCustomGrid,
    setRatioMode,
    setGutterWidth,
    setCornerRadius,
    setTerminalPadding,
  } = useLayoutStudioStore();

  const [hoverDim, setHoverDim] = useState<{ r: number; c: number } | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const activeR = hoverDim ? hoverDim.r : customRows;
  const activeC = hoverDim ? hoverDim.c : customCols;

  const handleCellHover = (r: number, c: number) => {
    setHoverDim({ r, c });
    if (isMouseDown) {
      setCustomGrid(r, c);
    }
  };

  const handleCellClick = (r: number, c: number) => {
    setCustomGrid(r, c);
    setHoverDim(null);
  };

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white/[0.02] border border-white/10 p-6 rounded-xl select-none backdrop-blur-md"
      onMouseUp={() => setIsMouseDown(false)}
    >
      {/* Left: Drag-to-Select Matrix Canvas (5 cols) */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-black/40 border border-white/10 rounded-xl backdrop-blur-md">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-white/60" />
            <span className="font-sans font-semibold text-xs text-white/80 uppercase tracking-wider">
              Visual Grid Matrix
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono font-medium text-white/80">
            {activeR} × {activeC} ({activeR * activeC} {activeR * activeC === 1 ? 'Pane' : 'Panes'})
          </span>
        </div>

        {/* 8x8 Interactive Selection Cells with Drag & Hover */}
        <div
          className="grid grid-cols-8 gap-1.5 p-3 bg-black/60 border border-white/10 rounded-xl select-none"
          onMouseLeave={() => {
            setHoverDim(null);
            setIsMouseDown(false);
          }}
          onMouseDown={() => setIsMouseDown(true)}
        >
          {Array.from({ length: MAX_MATRIX_DIM }).map((_, rIdx) =>
            Array.from({ length: MAX_MATRIX_DIM }).map((_, cIdx) => {
              const r = rIdx + 1;
              const c = cIdx + 1;
              const isCellActive = r <= activeR && c <= activeC;

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  aria-label={`Select ${r} rows by ${c} columns`}
                  onMouseEnter={() => handleCellHover(r, c)}
                  onClick={() => handleCellClick(r, c)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all duration-150 flex items-center justify-center ${
                    isCellActive
                      ? 'bg-white/20 text-white border border-white/50 scale-95 shadow-none'
                      : 'bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-white/20'
                  }`}
                >
                  <span
                    className={`text-[8px] font-mono ${
                      isCellActive ? 'text-white font-bold' : 'text-white/30'
                    }`}
                  >
                    {r}×{c}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <p className="mt-3 text-[11px] font-mono text-white/40 text-center">
          Hover / Drag across matrix to size • Click to confirm grid
        </p>
      </div>

      {/* Right: Fine-Tuning Knobs (7 cols) */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-5 p-4 bg-black/40 border border-white/10 rounded-xl font-sans backdrop-blur-md">
        {/* 1. Split Ratio Profile */}
        <div>
          <div className="flex items-center justify-between text-xs font-sans font-semibold text-white/60 uppercase tracking-wider mb-2 font-mono">
            <span>Split Ratio Architecture</span>
            <span className="text-white/80 font-mono lowercase">
              {ratioMode} ({(customRatioValue * 100).toFixed(1)}% / {((1 - customRatioValue) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'equal', label: 'Equal (50/50)', val: 0.5 },
              { id: 'golden', label: 'Golden (61.8/38.2)', val: 0.618 },
              { id: 'hero-sidebar', label: 'Hero (70/30)', val: 0.7 },
              { id: 'tri-split', label: 'Tri (25/50/25)', val: 0.25 },
            ].map((rm) => (
              <button
                key={rm.id}
                onClick={() => setRatioMode(rm.id as RatioPreset, rm.val)}
                className={`px-3 py-1.5 rounded-md text-xs font-sans font-medium border transition-colors ${
                  ratioMode === rm.id
                    ? 'bg-white/10 text-white border-white/30'
                    : 'bg-white/[0.02] text-white/40 hover:bg-white/[0.04] hover:text-white border-white/10 hover:border-white/20'
                }`}
              >
                {rm.label}
              </button>
            ))}
          </div>

          {/* Granular Slider */}
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.01"
              value={customRatioValue}
              onChange={(e) => setRatioMode('custom', parseFloat(e.target.value))}
              className="flex-1 accent-white h-1.5 bg-black/40 border border-white/10 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* 2. Gutter / Sash Width Selector */}
        <div>
          <span className="text-xs font-sans font-semibold text-white/60 uppercase tracking-wider block mb-2 font-mono">
            Gutter / Sash Width
          </span>
          <div className="grid grid-cols-4 gap-2">
            {[
              { w: 0, label: '0px (Borderless)' },
              { w: 2, label: '2px (Hairline)' },
              { w: 4, label: '4px (Standard)' },
              { w: 8, label: '8px (Spacious)' },
            ].map((g) => (
              <button
                key={g.w}
                onClick={() => setGutterWidth(g.w as GutterPreset)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
                  gutterWidth === g.w
                    ? 'bg-white/10 text-white border-white/30'
                    : 'bg-white/[0.02] text-white/40 hover:bg-white/[0.04] hover:text-white border-white/10 hover:border-white/20'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Corner Radius & Terminal Inner Padding */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-sans font-semibold text-white/60 uppercase tracking-wider block mb-2 font-mono">
              Corner Radius
            </span>
            <div className="flex items-center gap-1.5">
              {[0, 4, 8, 12, 16].map((r) => (
                <button
                  key={r}
                  onClick={() => setCornerRadius(r as RadiusPreset)}
                  className={`flex-1 py-1 text-xs font-mono rounded-md border transition-colors ${
                    cornerRadius === r
                      ? 'bg-white/10 text-white border-white/30'
                      : 'bg-white/[0.02] text-white/40 hover:bg-white/[0.04] hover:text-white border-white/10 hover:border-white/20'
                  }`}
                >
                  {r}px
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-sans font-semibold text-white/60 uppercase tracking-wider block mb-2 font-mono">
              Inner Padding
            </span>
            <div className="flex items-center gap-1.5">
              {[0, 4, 8, 12, 16].map((p) => (
                <button
                  key={p}
                  onClick={() => setTerminalPadding(p)}
                  className={`flex-1 py-1 text-xs font-mono rounded-md border transition-colors ${
                    terminalPadding === p
                      ? 'bg-white/10 text-white border-white/30'
                      : 'bg-white/[0.02] text-white/40 hover:bg-white/[0.04] hover:text-white border-white/10 hover:border-white/20'
                  }`}
                >
                  {p}px
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};