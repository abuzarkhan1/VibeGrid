'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ArrowUpRight, Copy, Check } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const installCmd = 'curl -fsSL https://vibegrid.dev/install.sh | sh';

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const comparisonData = [
    { name: 'VibeGrid', price: '$0 / yr', width: '3%', isHighlighted: true },
    { name: 'BridgeSpace', price: '$120 / yr', width: '28%', isHighlighted: false },
    { name: 'Warp Pro', price: '$240 / yr', width: '52%', isHighlighted: false },
    { name: 'iTerm2 Grid', price: 'macOS only (No equal presets)', width: '68%', isHighlighted: false },
    { name: 'tmux / CLI', price: 'No WebGL GPU rendering', width: '84%', isHighlighted: false },
  ];

  return (
    <section className="relative isolate overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Background Gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#03060a_0%,#060c12_24%,#101f23_44%,#172a29_57%,#121a1a_71%,#070a0b_86%,#000000_100%)]" />

      {/* Starry Sky Animation Layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { left: '84%', top: '8%', dur: '5.9s', delay: '0.1s' },
          { left: '8%', top: '51%', dur: '5.5s', delay: '1.8s' },
          { left: '21%', top: '22%', dur: '3.5s', delay: '1.8s' },
          { left: '26%', top: '7%', dur: '4.6s', delay: '2.5s' },
          { left: '89%', top: '3%', dur: '5.9s', delay: '1.7s' },
          { left: '55%', top: '55%', dur: '5.1s', delay: '0.5s' },
          { left: '32%', top: '22%', dur: '4.4s', delay: '2.2s' },
          { left: '76%', top: '73%', dur: '4.5s', delay: '2.2s' },
        ].map((star, idx) => (
          <span
            key={idx}
            className="lp-star"
            style={{
              left: star.left,
              top: star.top,
              width: '2px',
              height: '2px',
              '--dur': star.dur,
              '--delay': star.delay,
            } as React.CSSProperties}
          />
        ))}

        {/* Shooting Stars */}
        <span className="lp-shooting-star" style={{ top: '8%', left: '6%', '--dx': '360px', '--dy': '190px', '--dur': '6s', '--delay': '0.5s' } as React.CSSProperties}>
          <span className="block h-px w-[110px]" style={{ transform: 'rotate(28deg)', transformOrigin: 'left center', background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 90%, rgba(255,255,255,1) 100%)', boxShadow: '0 0 6px rgba(255,255,255,0.5)' }} />
        </span>
        <span className="lp-shooting-star" style={{ top: '14%', left: '52%', '--dx': '420px', '--dy': '220px', '--dur': '7s', '--delay': '2.2s' } as React.CSSProperties}>
          <span className="block h-px w-[110px]" style={{ transform: 'rotate(28deg)', transformOrigin: 'left center', background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 90%, rgba(255,255,255,1) 100%)', boxShadow: '0 0 6px rgba(255,255,255,0.5)' }} />
        </span>
      </div>

      {/* Main Content Container */}
      <div className="relative z-30 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex w-full flex-col items-center"
        >
          {/* Release Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-forest/40 bg-forest/15 px-3.5 py-1 text-xs font-semibold text-forest-bright">
            <span>VibeGrid v0.1.0 • GPU-Accelerated Multi-Pane Workspace Grid</span>
          </div>

          {/* Hero Headline */}
          <h1 className="lp-hero-heading text-balance text-[36px] font-normal leading-[1.1] text-white sm:text-[54px] md:text-[62px]">
            The "Agnostic" <br />
            <span className="text-forest-bright lp-text-glow-green">Vibe Coder</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/60 md:text-[18px] font-light">
            The lightning-fast, free, local-first grid for orchestrating <strong className="text-white">YOUR choice of AI agents.</strong> Escape BridgeSpace's walled garden and experience true vibe coding.
          </p>

          {/* Category Tabs */}
          <div className="mt-8 mx-auto flex w-fit flex-wrap items-center justify-center gap-1 rounded-full p-1 border border-white/10 bg-white/[0.03]">
            <span className="rounded-full px-4 py-1.5 text-sm font-medium text-white bg-white/10">Desktop</span>
            <span className="rounded-full px-4 py-1.5 text-sm font-normal text-white/55">CLI</span>
            <span className="rounded-full px-4 py-1.5 text-sm font-normal text-white/55">Workspaces</span>
            <span className="rounded-full px-4 py-1.5 text-sm font-normal text-white/55">Presets (1..16)</span>
          </div>

          {/* Download CTAs */}
          <div className="mt-7 w-full max-w-md space-y-3">
            <a
              href="#download"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-forest px-6 text-sm font-bold text-white transition-all hover:bg-forest/90 shadow-[0_0_30px_rgba(84,169,103,0.5)] hover:scale-[1.01]"
            >
              <Download className="h-4 w-4" />
              <span>Download VibeGrid for macOS (Universal / M1-M4)</span>
            </a>

            <div className="flex items-center justify-between text-xs text-white/40 px-1">
              <a href="#download" className="hover:text-white transition-colors">Also available for Windows 10/11 & Linux</a>
              <a href="#features" className="hover:text-white transition-colors flex items-center gap-1">
                Explore Features <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>

            {/* Quick Install Command */}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 font-mono text-xs text-white/80">
              <span className="text-forest-bright">$</span>
              <span className="flex-1 truncate">{installCmd}</span>
              <button onClick={handleCopy} className="p-1 text-white/40 hover:text-white transition-colors">
                {copied ? <Check className="h-3.5 w-3.5 text-forest-bright" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Comparison Graph Card (Terminal Workspace Apps) */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="relative mt-16 mx-auto max-w-4xl px-4 sm:px-6"
      >
        <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0c0e]/95 px-5 py-8 sm:px-9 shadow-[0_50px_140px_-25px_rgba(0,0,0,0.9)]">
          <p className="text-white/60 mb-6 text-center text-sm sm:text-base font-light">
            Terminal Workspace Grid Comparison (VibeGrid vs Competitors)
          </p>

          <div className="relative space-y-4">
            {comparisonData.map((item, idx) => (
              <div key={idx} className="flex items-center">
                <div className="flex shrink-0 items-center gap-2 sm:gap-3 w-[120px] sm:w-[190px]">
                  <div className={`h-6 w-6 rounded-[5px] flex items-center justify-center text-[10px] font-mono font-bold ${
                    item.isHighlighted ? 'bg-forest text-white' : 'bg-white/10 text-white/50'
                  }`}>
                    &gt;_
                  </div>
                  <span className={`truncate text-xs sm:text-sm ${item.isHighlighted ? 'font-bold text-white' : 'text-white/70'}`}>
                    {item.name}
                  </span>
                </div>

                <div className="relative h-9 flex-1">
                  {item.isHighlighted ? (
                    <div className="absolute left-0 top-1/2 h-[24px] -translate-y-1/2 w-[4px] rounded-full bg-forest-bright shadow-[0_0_14px_4px_rgba(84,169,103,0.7)]" />
                  ) : (
                    <div
                      className="absolute left-0 top-1/2 h-[22px] -translate-y-1/2 rounded-r-[6px] bg-red-500/20 border-r-2 border-red-500"
                      style={{ width: item.width }}
                    />
                  )}
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-xs sm:text-sm font-mono ${
                      item.isHighlighted ? 'text-forest-bright font-bold left-3' : 'text-white/50 pl-3'
                    }`}
                    style={{ left: item.isHighlighted ? '8px' : item.width }}
                  >
                    {item.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};
