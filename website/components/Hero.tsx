'use client';

import React, { useState } from 'react';
import { Apple, Terminal, Check, Copy, Zap, Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const installCmd = 'curl -fsSL https://vibegrid.dev/install.sh | sh';

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative isolate overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Dark Sky Background Gradient */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#03060a_0%,#060c12_24%,#101f23_44%,#172a29_57%,#121a1a_71%,#070a0b_86%,#000000_100%)]"
        aria-hidden="true"
      />

      {/* Starry Sky Animation Overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="lp-star" style={{ left: '12%', top: '15%', width: '3px', height: '3px', '--dur': '4.5s', '--delay': '0.2s' } as React.CSSProperties} />
        <span className="lp-star" style={{ left: '85%', top: '22%', width: '2px', height: '2px', '--dur': '5.2s', '--delay': '1.1s' } as React.CSSProperties} />
        <span className="lp-star" style={{ left: '35%', top: '40%', width: '3px', height: '3px', '--dur': '3.8s', '--delay': '0.7s' } as React.CSSProperties} />
        <span className="lp-star" style={{ left: '72%', top: '65%', width: '2px', height: '2px', '--dur': '6.0s', '--delay': '2.3s' } as React.CSSProperties} />
        <span className="lp-star" style={{ left: '20%', top: '75%', width: '3px', height: '3px', '--dur': '4.1s', '--delay': '1.8s' } as React.CSSProperties} />
        <span className="lp-star" style={{ left: '92%', top: '45%', width: '2px', height: '2px', '--dur': '5.8s', '--delay': '0.4s' } as React.CSSProperties} />

        <span className="lp-shooting-star" style={{ top: '10%', left: '15%', '--dx': '380px', '--dy': '190px', '--dur': '6.5s', '--delay': '0.5s' } as React.CSSProperties}>
          <span className="block h-px w-[120px] bg-gradient-to-r from-transparent via-white/80 to-white shadow-[0_0_8px_white]" />
        </span>
        <span className="lp-shooting-star" style={{ top: '25%', left: '60%', '--dx': '420px', '--dy': '210px', '--dur': '7.5s', '--delay': '2.5s' } as React.CSSProperties}>
          <span className="block h-px w-[120px] bg-gradient-to-r from-transparent via-white/80 to-white shadow-[0_0_8px_white]" />
        </span>
      </div>

      {/* Radial Green Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-6 text-center lg:px-8">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md mb-8 animate-fade-in shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>VibeGrid v0.1.0 • Free & Open Source Multi-Pane Terminal</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1] mb-6">
          The "Agnostic" <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(16,185,129,0.4)]">
            Vibe Coder
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mx-auto max-w-3xl text-lg text-white/70 sm:text-xl leading-relaxed mb-10 font-light">
          The lightning-fast, free, local-first grid for orchestrating <strong className="text-white">YOUR choice of AI agents.</strong> Escape BridgeSpace's walled garden and experience true vibe coding.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          {/* macOS Download */}
          <a
            href="#downloads"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-7 py-4 text-sm font-bold text-white transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:scale-[1.02]"
          >
            <Apple className="h-5 w-5" />
            <div className="text-left">
              <div className="text-[10px] text-emerald-100 uppercase tracking-wider font-semibold">Download for</div>
              <div className="text-sm font-bold">macOS (Universal / Apple Silicon)</div>
            </div>
          </a>

          {/* Windows Download */}
          <a
            href="#downloads"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] hover:border-white/30 px-7 py-4 text-sm font-bold text-white transition-all backdrop-blur-md hover:scale-[1.02]"
          >
            <Zap className="h-5 w-5 text-emerald-400" />
            <div className="text-left">
              <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Download for</div>
              <div className="text-sm font-bold">Windows (x64 Setup / MSI)</div>
            </div>
          </a>
        </div>

        {/* CLI Quick Install Command Bar */}
        <div className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md px-4 py-2.5 text-xs font-mono text-white/80 shadow-2xl">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span>{installCmd}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title="Copy command"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
};
