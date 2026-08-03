'use client';

import React, { useState } from 'react';
import { Terminal, Grid, Cpu } from 'lucide-react';

export const TerminalShowcase: React.FC = () => {
  const [activePaneCount, setActivePaneCount] = useState<1 | 2 | 4 | 6 | 8 | 16>(4);
  const [activePaneIndex, setActivePaneIndex] = useState(0);

  const gridClass =
    activePaneCount === 1
      ? 'grid-cols-1 grid-rows-1'
      : activePaneCount === 2
      ? 'grid-cols-2 grid-rows-1'
      : activePaneCount === 4
      ? 'grid-cols-2 grid-rows-2'
      : activePaneCount === 6
      ? 'grid-cols-3 grid-rows-2'
      : activePaneCount === 8
      ? 'grid-cols-4 grid-rows-2'
      : 'grid-cols-4 grid-rows-4';

  const sampleLogs = [
    {
      cmd: 'cargo build --release',
      output: [
        '  Compiling vibegrid v0.1.0 (/Users/abuzar/Desktop/VibeGrid/src-tauri)',
        '   Finished release [optimized + lto] target(s) in 3.42s',
        '✔ Binary compiled: target/release/vibegrid (14.2 MB)',
      ],
    },
    {
      cmd: 'npm run dev',
      output: [
        '  VITE v5.4.21 ready in 92 ms',
        '  ➜ Local: http://localhost:1420/',
        '✔ WebGL 60 FPS Canvas fallback active',
      ],
    },
    {
      cmd: 'htop --tree',
      output: [
        '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
        ' 1420 abuzar    20   0  420.2M  84.5M  32.1M S   1.2   0.5   0:14.22 vibegrid',
        ' 1421 abuzar    20   0  120.1M  24.2M  12.4M S   0.0   0.1   0:01.05 zsh',
      ],
    },
    {
      cmd: 'git status',
      output: [
        'On branch main',
        'Your branch is up to date with \'origin/main\'.',
        'nothing to commit, working tree clean',
      ],
    },
    {
      cmd: 'pnpm test',
      output: [
        ' RUN v1.6.1 /Users/abuzar/Desktop/VibeGrid',
        ' ✓ src/store/usePaneStore.test.ts (4 tests) 1ms',
        '✔ Test Files 1 passed (1) | Tests 4 passed (4)',
      ],
    },
    {
      cmd: 'docker compose up -d',
      output: [
        '[+] Running 3/3',
        ' ✔ Container vibegrid-db    Started',
        ' ✔ Container vibegrid-redis Started',
      ],
    },
  ];

  return (
    <section id="demo" className="relative py-20 bg-black">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl mb-4">
            Interactive Multi-Pane Grid Simulator
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto font-light">
            Test VibeGrid layout presets directly in your browser. Choose pane count (1 to 16) and click panes to switch focus.
          </p>

          {/* Preset Selector Buttons */}
          <div className="mt-8 inline-flex items-center gap-2 p-1.5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider px-3 flex items-center gap-1.5">
              <Grid className="h-4 w-4" />
              <span>Presets:</span>
            </span>
            {([1, 2, 4, 6, 8, 16] as const).map((count) => (
              <button
                key={count}
                onClick={() => {
                  setActivePaneCount(count);
                  setActivePaneIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activePaneCount === count
                    ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {count} {count === 1 ? 'Pane' : 'Panes'}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Chrome Window Mockup */}
        <div className="rounded-2xl border border-white/10 bg-[#0c0c0f] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Traffic Lights Window Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0a0a0d]">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <div className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-white/50">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span>vibegrid — {activePaneCount} Active Equal Panes</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <Cpu className="h-3 w-3" />
              <span>GPU WebGL 60FPS</span>
            </div>
          </div>

          {/* Grid Container */}
          <div className={`grid ${gridClass} gap-1.5 p-2 bg-[#050609] h-[520px] overflow-hidden`}>
            {Array.from({ length: activePaneCount }).map((_, idx) => {
              const logData = sampleLogs[idx % sampleLogs.length];
              const isSelected = activePaneIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActivePaneIndex(idx)}
                  className={`rounded-lg p-3 font-mono text-xs cursor-pointer transition-all duration-150 flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? 'bg-[#0e101a] border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                      : 'bg-[#090a0f] border border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Pane Header */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2 text-[11px] text-white/40">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold text-white/80">Terminal {idx + 1}</span>
                    </div>
                    <span>zsh</span>
                  </div>

                  {/* Terminal Output */}
                  <div className="flex-1 space-y-1 text-white/80 overflow-hidden text-[11px] leading-relaxed">
                    <div className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span>$</span>
                      <span>{logData.cmd}</span>
                    </div>
                    {logData.output.map((line, lIdx) => (
                      <div key={lIdx} className="text-white/60 truncate">
                        {line}
                      </div>
                    ))}
                  </div>

                  {/* Cursor Line */}
                  <div className="pt-2 flex items-center gap-1 text-[11px] text-emerald-400">
                    <span>$</span>
                    <span className="inline-block h-3.5 w-1.5 bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
