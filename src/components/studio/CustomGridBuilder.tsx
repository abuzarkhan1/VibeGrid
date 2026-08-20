import React, { useState, useEffect } from 'react';
import { useLayoutStudioStore } from '@/store/useLayoutStudioStore';
import { RatioPreset, GutterPreset, RadiusPreset } from '@/types/layoutStudio';
import { Grid } from 'lucide-react';

const MAX_MATRIX_DIM = 8;

const RATIO_LABELS: Record<RatioPreset, string> = {
  equal: 'Equal',
  golden: 'Golden Ratio',
  'hero-sidebar': 'Hero Sidebar',
  'tri-split': 'Tri-Split',
  custom: 'Custom',
};

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

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsMouseDown(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

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
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#111111] border border-[#4a4b50] p-6 rounded-2xl select-none font-sans"
      onMouseUp={() => setIsMouseDown(false)}
    >
      {/* Left: Visual Grid Matrix Builder */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 bg-[#303236] border border-[#4a4b50] rounded-2xl">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-[#5683da]" />
            <span className="font-sans font-semibold text-xs text-white uppercase tracking-wider">
              Matrix
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-xs font-mono font-medium text-[#a9a9aa]">
              Rows <span className="text-[#5683da] font-semibold">{activeR}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-xs font-mono font-medium text-[#a9a9aa]">
              Cols <span className="text-[#5683da] font-semibold">{activeC}</span>
            </span>
          </div>
        </div>

        {/* Interactive hover matrix */}
        <div
          className="grid gap-1.5 p-3 bg-[#111111] border border-[#4a4b50] rounded-xl select-none"
          style={{ gridTemplateColumns: `repeat(${MAX_MATRIX_DIM}, minmax(0, 1fr))` }}
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
                  aria-label={`${r}x${c}`}
                  onMouseEnter={() => handleCellHover(r, c)}
                  onClick={() => handleCellClick(r, c)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all duration-150 flex items-center justify-center cursor-pointer ${
                    isCellActive
                      ? 'bg-[#5683da] text-white border border-[#5683da] ring-1 ring-[#5683da]'
                      : 'bg-[#303236] border border-[#4a4b50] hover:border-[#5683da]'
                  }`}
                >
                  <span
                    className={`text-[8px] font-mono ${
                      isCellActive ? 'text-white font-bold' : 'text-[#a9a9aa]'
                    }`}
                  >
                    {r}×{c}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Fine-Tuning Knobs (7 cols) */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-5 p-5 bg-[#303236] border border-[#4a4b50] rounded-2xl font-sans">
        {/* 1. Split */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-[#a9a9aa] uppercase tracking-wider mb-2 font-mono">
            <span>Split</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-[#5683da] font-medium">
              {RATIO_LABELS[ratioMode] || ratioMode} ({(customRatioValue * 100).toFixed(0)}/
              {((1 - customRatioValue) * 100).toFixed(0)})
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'equal', label: '50/50', val: 0.5 },
              { id: 'golden', label: '62/38', val: 0.618 },
              { id: 'hero-sidebar', label: '70/30', val: 0.7 },
              { id: 'tri-split', label: 'Tri', val: 0.25 },
            ].map((rm) => (
              <button
                key={rm.id}
                type="button"
                onClick={() => setRatioMode(rm.id as RatioPreset, rm.val)}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-colors cursor-pointer text-center ${
                  ratioMode === rm.id
                    ? 'bg-[#5683da] text-white border-[#5683da]'
                    : 'bg-[#090a0c] text-[#a9a9aa] hover:text-white border-[#4a4b50] hover:border-[#5683da]'
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
              className="flex-1 accent-[#5683da] h-1.5 bg-[#090a0c] border border-[#4a4b50] rounded-full cursor-pointer"
            />
          </div>
        </div>

        {/* 2. Gutter */}
        <div>
          <span className="text-xs font-semibold text-[#a9a9aa] uppercase tracking-wider block mb-2 font-mono">
            Gutter
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { w: 0, label: '0px' },
              { w: 2, label: '2px' },
              { w: 4, label: '4px' },
              { w: 8, label: '8px' },
            ].map((g) => (
              <button
                key={g.w}
                type="button"
                onClick={() => setGutterWidth(g.w as GutterPreset)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium border transition-colors cursor-pointer text-center ${
                  gutterWidth === g.w
                    ? 'bg-[#5683da] text-white border-[#5683da]'
                    : 'bg-[#090a0c] text-[#a9a9aa] hover:text-white border-[#4a4b50] hover:border-[#5683da]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Radius & Padding */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-semibold text-[#a9a9aa] uppercase tracking-wider block mb-2 font-mono">
              Radius
            </span>
            <div className="flex items-center gap-1.5">
              {[0, 4, 8, 12, 16].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCornerRadius(r as RadiusPreset)}
                  className={`flex-1 py-1 text-xs font-mono font-medium rounded-full border transition-colors cursor-pointer text-center ${
                    cornerRadius === r
                      ? 'bg-[#5683da] text-white border-[#5683da]'
                      : 'bg-[#090a0c] text-[#a9a9aa] hover:text-white border-[#4a4b50] hover:border-[#5683da]'
                  }`}
                >
                  {r}px
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-[#a9a9aa] uppercase tracking-wider block mb-2 font-mono">
              Padding
            </span>
            <div className="flex items-center gap-1.5">
              {[0, 4, 8, 12, 16].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTerminalPadding(p)}
                  className={`flex-1 py-1 text-xs font-mono font-medium rounded-full border transition-colors cursor-pointer text-center ${
                    terminalPadding === p
                      ? 'bg-[#5683da] text-white border-[#5683da]'
                      : 'bg-[#090a0c] text-[#a9a9aa] hover:text-white border-[#4a4b50] hover:border-[#5683da]'
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
