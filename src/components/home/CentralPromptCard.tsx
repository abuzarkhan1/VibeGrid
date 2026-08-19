import React from 'react';
import { Circle } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { PresetCount } from '@/types/layout';

const LAYOUT_PRESETS: {
  id: PresetCount;
  label: string;
  tag: string;
  grid: number[][];
}[] = [
  { id: 1,  label: 'Solo',   tag: '1×1', grid: [[1]] },
  { id: 2,  label: 'Dual',   tag: '1×2', grid: [[1, 2]] },
  { id: 4,  label: 'Quad',   tag: '2×2', grid: [[1, 2], [3, 4]] },
  { id: 6,  label: 'Hex',    tag: '3×2', grid: [[1, 2, 3], [4, 5, 6]] },
  { id: 9,  label: 'Hive',   tag: '3×3', grid: [[1,2,3],[4,5,6],[7,8,9]] },
  { id: 16, label: 'Matrix', tag: '4×4', grid: [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]] },
];

const LayoutBlueprint: React.FC<{ grid: number[][] }> = ({ grid }) => {
  const rows = grid.length;
  const cols = grid[0].length;
  const gap = 3;
  const svgW = 56;
  const svgH = 36;
  const cellW = (svgW - gap * (cols - 1)) / cols;
  const cellH = (svgH - gap * (rows - 1)) / rows;
  
  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="shrink-0 transition-transform duration-300 group-hover:scale-105">
      {grid.map((row, r) =>
        row.map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * (cellW + gap) + 0.5}
            y={r * (cellH + gap) + 0.5}
            width={Math.max(1, cellW - 1)}
            height={Math.max(1, cellH - 1)}
            rx={1.5}
            fill="currentColor"
            className="text-white/15 group-hover:text-white/90 transition-colors duration-300"
          />
        ))
      )}
    </svg>
  );
};

export const CentralPromptCard: React.FC = () => {
  const { setActiveViewMode, requestSetLayoutPreset } = useUIStore();
  const { workspaces, activeWorkspaceId } = useWorkspaceStore();

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const handleLaunchPreset = (count: PresetCount) => {
    requestSetLayoutPreset(count);
    setActiveViewMode('grid');
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-6 select-none font-sans animate-fade-in">
      
      {/* Main Pure Black Transparent Glass Container (max-w-4xl) */}
      <div className="relative w-full max-w-4xl p-10 sm:p-12 rounded-3xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.9)] overflow-hidden">
        
        {/* Ambient Top Glow for Glass Pop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-white/[0.03] blur-[100px] pointer-events-none"></div>
        
        <div className="relative space-y-10">
          
          {/* Workspace Identity Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 backdrop-blur-md shadow-inner">
                <span className="text-xl">{activeWs?.emoji || '⚡'}</span>
              </div>
              <div>
                <div className="text-base font-semibold text-white/90 tracking-wide">{activeWs?.name || 'VibeGrid'}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Circle className="w-2 h-2 fill-white/70 text-white/70 animate-pulse" />
                  <div className="text-xs text-white/40 font-mono">Ready to launch workspace</div>
                </div>
              </div>
            </div>
            <div className="text-xs font-mono text-white/30 uppercase tracking-widest hidden sm:block">
              Workspace Hub
            </div>
          </div>

          {/* Layout Preset Grid */}
          <div>
            <div className="flex items-center justify-between mb-5 px-1">
              <div className="text-xs font-mono text-white/40 uppercase tracking-widest">
                Select Layout Matrix
              </div>
              <div className="text-xs font-mono text-white/25 uppercase">
                {LAYOUT_PRESETS.length} Presets Available
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {LAYOUT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLaunchPreset(preset.id)}
                  className="group relative flex flex-col items-start gap-4 p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.15] transition-all duration-300 cursor-pointer text-left overflow-hidden"
                >
                  <LayoutBlueprint grid={preset.grid} />
                  <div className="w-full flex items-center justify-between mt-1">
                    <span className="text-sm text-white/80 font-medium group-hover:text-white transition-colors">
                      {preset.label}
                    </span>
                    <span className="text-xs font-mono text-white/30 group-hover:text-white/70 transition-colors">
                      {preset.tag}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};