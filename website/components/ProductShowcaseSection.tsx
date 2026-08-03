'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

export const ProductShowcaseSection: React.FC = () => {
  const [copiedCli, setCopiedCli] = useState(false);
  const [activePreset, setActivePreset] = useState<1 | 2 | 4 | 6 | 8 | 16>(4);

  const handleCopyCli = () => {
    navigator.clipboard.writeText('npm install -g vibegrid');
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const gridClass =
    activePreset === 1
      ? 'grid-cols-1 grid-rows-1'
      : activePreset === 2
      ? 'grid-cols-2 grid-rows-1'
      : activePreset === 4
      ? 'grid-cols-2 grid-rows-2'
      : activePreset === 6
      ? 'grid-cols-3 grid-rows-2'
      : activePreset === 8
      ? 'grid-cols-4 grid-rows-2'
      : 'grid-cols-4 grid-rows-4';

  return (
    <section className="relative z-30 bg-black px-6 py-12">
      <div className="mx-auto max-w-6xl divide-y divide-white/[0.06]">
        {/* 1. Desktop Feature */}
        <motion.div
          id="desktop"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid scroll-mt-24 items-center gap-10 py-20 md:grid-cols-2 md:gap-16 md:py-28"
        >
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full border border-forest/40 bg-forest/15 px-2 py-0.5 text-[10px] font-normal uppercase tracking-wide text-forest-bright">
                Desktop App
              </span>
            </div>
            <h2 className="lp-hero-heading text-[34px] leading-[1.1] text-white md:text-[46px] lg:text-[52px]">
              Introducing <span className="text-forest-bright">VibeGrid Desktop</span>
            </h2>
            <p className="mt-4 max-w-md text-lg text-white/55 font-light">
              Run terminal windows in parallel on your machine — choose equal grid presets (1, 2, 4, 6, 8, 16 panes) with zero layout collapse.
            </p>

            <div className="mt-8">
              <div className="w-full max-w-sm">
                <a
                  href="#download"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-normal text-black transition-all hover:bg-white/90 shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_8px_30px_rgba(0,0,0,0.4)]"
                >
                  Download for macOS & Windows
                </a>
                <p className="mt-2.5 text-[13px] text-white/40">100% Free, Open Source MIT. No credit card required.</p>
              </div>
            </div>
          </div>

          {/* Interactive Multi-Pane Terminal Showcase */}
          <div>
            <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0f] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 bg-[#0a0a0d]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-1 text-[12px] text-white/45 font-mono">vibegrid — {activePreset} Equal Panes</span>
                </div>
                {/* Preset Selector */}
                <div className="flex items-center gap-1">
                  {([1, 2, 4, 6, 8, 16] as const).map((num) => (
                    <button
                      key={num}
                      onClick={() => setActivePreset(num)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        activePreset === num ? 'bg-forest-bright text-black font-bold' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`grid ${gridClass} gap-1.5 p-2 bg-[#050609] h-[340px] overflow-hidden`}>
                {Array.from({ length: activePreset }).map((_, idx) => (
                  <div key={idx} className="rounded-lg p-2.5 bg-[#090a0f] border border-white/10 font-mono text-[11px] flex flex-col justify-between overflow-hidden">
                    <div className="text-white/40 border-b border-white/5 pb-1 flex items-center justify-between">
                      <span>Terminal {idx + 1}</span>
                      <span className="text-forest-bright">zsh</span>
                    </div>
                    <div className="text-white/70 space-y-0.5">
                      <div className="text-forest-bright font-semibold">$ cargo test</div>
                      <div className="text-white/40">running 3 tests</div>
                      <div className="text-forest-bright">test ok. 3 passed</div>
                    </div>
                    <div className="text-forest-bright flex items-center gap-1">
                      <span>$</span>
                      <span className="inline-block h-3 w-1 bg-forest-bright animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. CLI Feature */}
        <motion.div
          id="cli"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid scroll-mt-24 items-center gap-10 py-20 md:grid-cols-2 md:gap-16 md:py-28"
        >
          <div className="md:order-2">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full border border-forest/40 bg-forest/15 px-2 py-0.5 text-[10px] font-normal uppercase tracking-wide text-forest-bright">
                Command Line
              </span>
            </div>
            <h2 className="lp-hero-heading text-[34px] leading-[1.1] text-white md:text-[46px] lg:text-[52px]">
              Introducing <span className="text-forest-bright">VibeGrid CLI</span>
            </h2>
            <p className="mt-4 max-w-md text-lg text-white/55 font-light">
              Launch PTY terminal grids and workspace sessions directly from your terminal.
            </p>

            <div className="mt-8">
              <div className="w-full max-w-sm">
                <button
                  onClick={handleCopyCli}
                  className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left font-mono text-sm transition-colors hover:border-white/20"
                >
                  <span className="select-none text-forest-bright">$</span>
                  <span className="flex-1 text-white/90">npm install -g vibegrid</span>
                  {copiedCli ? <Check className="h-4 w-4 text-forest-bright" /> : <Copy className="h-4 w-4 text-white/40 group-hover:text-white" />}
                </button>
                <ol className="mt-3 space-y-1.5 font-mono text-[13px] text-white/55">
                  <li><span className="select-none text-white/30">$</span>&nbsp; cd your-project</li>
                  <li><span className="select-none text-white/30">$</span>&nbsp; vibegrid --grid 4</li>
                </ol>
                <p className="mt-2 text-[13px] text-white/40">No API key required. Runs 100% locally.</p>
              </div>
            </div>
          </div>

          <div className="md:order-1">
            <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0f] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] h-[340px]">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 bg-[#0a0a0d]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </span>
                <span className="ml-1 text-[12px] text-white/45 font-mono">vibegrid — zsh</span>
              </div>
              <div className="min-h-0 flex-1 p-4 font-mono text-[13px] leading-relaxed">
                <div className="mb-2.5 flex items-center justify-between text-[11px] text-white/30">
                  <span className="font-normal text-forest-bright/80">◆ vibegrid CLI</span>
                  <span>Tauri PTY · ~/project</span>
                </div>
                <p className="text-white/85">
                  <span className="text-forest-bright">›</span> vibegrid --grid 4 --workspace "Backend Dev"
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-forest-bright align-middle" />
                </p>
                <div className="space-y-1.5 pt-3">
                  <p className="text-white/60"><span className="text-forest-bright">✔</span> Spawned 4 PTY channels via portable-pty</p>
                  <p className="text-white/60"><span className="text-forest-bright">✔</span> 16ms IPC batcher initialized with backpressure protection</p>
                  <p className="text-white/60"><span className="text-forest-bright">✔</span> WebGL 60 FPS GPU canvas online</p>
                  <p className="pt-2 text-white/70">Grid layout ready in 42ms · 4 active panes</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
