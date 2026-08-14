'use client';

import React, { useEffect, useRef } from 'react';
import {
  ZapHoverIcon,
  CpuHoverIcon,
  GridHoverIcon,
  HardDriveHoverIcon,
  PaletteHoverIcon,
  KeyboardHoverIcon,
  AppleHoverIcon,
  WindowHoverIcon,
} from '../components/ItsHoverIcons';
import dynamic from 'next/dynamic';
import { useScrollReveal } from '../components/useScrollReveal';
import { StarsCanvas } from '../components/StarsCanvas';
import { Navbar } from '../components/Navbar';
import { SiteFooter } from '../components/SiteFooter';
import StaggeredText from '../components/StaggeredText';
import { GridRadarHero } from '../components/GridRadarHero';
import { GridNetworkVisual } from '../components/GridNetworkVisual';
import {
  WebGLPulseRing,
  RustPtyDataFlow,
  MultiPaneGridVisual,
  AgentAgnosticHubVisual,
} from '../components/CardSignalVisual';

/* Live map (world SVG + 110 pulsing dots) is below the fold — lazy-load it */
const LiveMap = dynamic(() => import('../components/LiveMap'), {
  ssr: false,
  loading: () => <div className="h-[420px]" aria-hidden="true" />,
});

/* ─── Timeline Items for VibeGrid Architecture & Capabilities ─── */
interface TimelineItem {
  num: string;
  tag: string;
  titlePrefix: string;
  titleAccent: string;
  desc: string;
  badge: string;
}

const TIMELINE_ITEMS: TimelineItem[] = [
  {
    num: '01',
    tag: 'Rust Core',
    titlePrefix: 'Sub-10ms ',
    titleAccent: 'PTY Engine',
    desc: 'Hardware-level OS pseudo-terminal management written in Rust with backpressure-aware IPC batching for zero input lag.',
    badge: 'Native PTY',
  },
  {
    num: '02',
    tag: 'GPU WebGL',
    titlePrefix: '60 FPS ',
    titleAccent: 'Terminal Grid',
    desc: 'GPU-accelerated rendering powered by xterm.js WebGL engine, maintaining buttery smooth scrollback across 16 active panes.',
    badge: 'Hardware Accelerated',
  },
  {
    num: '03',
    tag: 'Agnostic AI',
    titlePrefix: 'Multi-Agent ',
    titleAccent: 'Orchestration',
    desc: 'Run Claude Code, Aider, Codex, or local Ollama models side-by-side. Zero walled gardens, zero lock-in, total freedom.',
    badge: 'Zero Lock-In',
  },
  {
    num: '04',
    tag: 'Workspaces',
    titlePrefix: 'Dynamic Layout ',
    titleAccent: 'Vault',
    desc: 'Create named workspaces with Cmd+Shift+N. Auto-saves exact pane split ratios, working directories, and shell states.',
    badge: 'Auto-Saved',
  },
  {
    num: '05',
    tag: 'Customization',
    titlePrefix: 'Fuzzy Palette & ',
    titleAccent: 'Built-in Themes',
    desc: '8 built-in themes including VibeDark, Catppuccin, and Nord, with a Cmd+Shift+P fuzzy command palette for keyboard velocity.',
    badge: '100% Configurable',
  },
];

/* ─── Parallax hook ─── */
function useParallax() {
  const skyRef   = useRef<HTMLImageElement>(null);
  const hillsRef = useRef<HTMLImageElement>(null);
  const cardRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const container = skyRef.current?.closest('.parallax-container') as HTMLElement;
        if (!container) { ticking = false; return; }
        const rect = container.getBoundingClientRect();
        const vh   = window.innerHeight;
        const progress = Math.max(0, Math.min(1, 1 - rect.bottom / (vh + rect.height)));

        if (skyRef.current) {
          const yv = 40 * progress;
          skyRef.current.style.transform   = `translateZ(0) translateY(${yv}vh)`;
          skyRef.current.style.opacity     = String(0.44 + progress * 0.3);
        }
        if (hillsRef.current) {
          const yv = 18 * progress;
          hillsRef.current.style.transform = `translateZ(0) translateY(${yv}vh)`;
        }
        if (cardRef.current) {
          const yv = 8 * progress;
          cardRef.current.style.transform  = `translateZ(0) translateY(${yv}vh)`;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { skyRef, hillsRef, cardRef };
}

/* ─── Comparison data ─── */
const COMPETITORS = [
  { name: 'VibeGrid',        price: '$0',    pct: 3,    primary: true },
  { name: 'MobaXterm Pro',   price: '$69',   pct: 20,   primary: false },
  { name: 'SecureCRT',       price: '$99',   pct: 30,   primary: false },
  { name: 'Termius Pro',     price: '$120',  pct: 40,   primary: false },
  { name: 'BridgeSpace',     price: '$120',  pct: 45,   primary: false },
  { name: 'Warp Pro',        price: '$240',  pct: 80,   primary: false },
];

/* ─── FAQ data ─── */
const FAQS = [
  { q: 'Is VibeGrid really free?', a: 'Yes. VibeGrid is completely free — no subscriptions, no API keys required. Download and run locally on macOS or Windows.' },
  { q: 'Why choose VibeGrid over BridgeSpace for Vibe Coding?', a: 'VibeGrid is completely agnostic. While BridgeSpace locks you into their walled garden of supported agents, VibeGrid lets you orchestrate ANY AI agent locally. It\'s true vibe coding without restrictions.' },
  { q: 'What makes VibeGrid different from other terminals?', a: 'VibeGrid uses WebGL GPU-accelerated rendering for 60 FPS across up to 16 live panes simultaneously, with a Rust PTY backend for <10ms keystroke latency.' },
  { q: 'Which platforms are supported?', a: 'macOS (Apple Silicon) is available today. Windows support is currently in development and coming soon.' },
  { q: 'How do workspaces work?', a: 'Create named workspaces with Cmd+Shift+N, switch between them instantly. Each workspace remembers your exact pane layout and restores it on launch.' },
  { q: 'Can I customize themes and keybindings?', a: 'Yes. VibeGrid ships with 8 built-in themes (VibeDark, One Dark Pro, Nord, Tokyo Night, Catppuccin, Gruvbox Dark, Solarized Dark, GitHub Dark) and a full keybinding editor.' },
];

export default function Home() {
  useScrollReveal();
  const { skyRef, hillsRef, cardRef } = useParallax();

  return (
    <div className="dark relative min-h-screen bg-[#08080a] font-sans text-white overflow-x-hidden selection:bg-white selection:text-black">

      {/* ═══════════════════════════ NAVBAR ═══════════════════════════ */}
      <Navbar active="home" />

      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section className="relative isolate overflow-hidden bg-[#08080a]">

        {/* Stars canvas */}
        <StarsCanvas />

        {/* Hero Grid Radar SVG Visual */}
        <GridRadarHero />

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-32 pt-36 text-center">

          {/* Section label badge */}
          <div className="vg-hidden vg-in-rise mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-zinc-900/60 px-4 py-1 font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            VibeGrid v0.1.0 · GPU-Accelerated Multi-Pane Terminal
          </div>

          {/* Main heading */}
          <h1 className="vg-hero-heading vg-hidden vg-in-text font-extrabold tracking-tight text-[44px] leading-[1.08] text-white sm:text-[58px] md:text-[72px] lg:text-[84px]"
              style={{ '--vg-delay': '0.05s', fontFamily: "'Space Grotesk', system-ui, sans-serif" } as React.CSSProperties}>
            The <span className="font-serif italic font-normal text-white">"Agnostic"</span><br />
            <StaggeredText text="Vibe Coder" className="vg-text-glow text-white font-extrabold tracking-tight" step={45} startDelay={450} />{' '}
          </h1>

          {/* Sub text */}
          <p className="vg-hidden vg-in-rise mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-zinc-400 font-normal"
             style={{ '--vg-delay': '0.12s' } as React.CSSProperties}>
            The lightning-fast, free, local-first grid for orchestrating <strong className="text-white font-extrabold">YOUR choice of AI agents.</strong> Escape BridgeSpace's walled garden and experience true vibe coding.
          </p>

          {/* CTA buttons */}
          <div className="vg-hidden vg-in-rise mt-10 flex flex-wrap items-center justify-center gap-3"
               style={{ '--vg-delay': '0.18s' } as React.CSSProperties}>
            <a href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg"
               target="_blank"
               rel="noreferrer"
               className="vg-install-glow group flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white text-black px-6 py-3.5 text-sm font-extrabold tracking-tight transition-all hover:bg-zinc-200 hover:shadow-[0_0_28px_rgba(255,255,255,0.2)] cursor-pointer"
               style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
              Download for macOS (v1)
            </a>
            <div
               className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-zinc-900/50 px-5 py-3.5 text-sm font-extrabold tracking-tight text-white/60 select-none"
               style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="opacity-60">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
              </svg>
              <span>Windows</span>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-normal">Coming Soon</span>
            </div>
          </div>

          {/* Social proof */}
          <p className="vg-hidden vg-in-rise mt-6 flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-zinc-500"
             style={{ '--vg-delay': '0.24s' } as React.CSSProperties}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            100% free & open source · no account, no telemetry, no walled garden
          </p>
        </div>

        {/* Landscape / Comparison Card section */}
        <div className="parallax-container relative -mt-[12vh] h-[108vh] w-full md:-mt-16 md:h-[118vh]">
          <img ref={skyRef} src="/sky-bg.webp" alt="" aria-hidden="true"
               decoding="async" draggable="false"
               className="vg-gpu pointer-events-none absolute inset-x-0 bottom-[32%] z-0 w-full select-none object-cover brightness-[0.7] saturate-[0.8]" />

          <img ref={hillsRef} src="/hills-bg.webp" alt="" aria-hidden="true"
               decoding="async" draggable="false"
               className="vg-gpu pointer-events-none absolute inset-x-0 bottom-[21%] z-[1] w-full select-none object-cover brightness-[1.15] contrast-[1.05]" />

          <div ref={cardRef} className="vg-gpu absolute inset-x-0 top-[11%] z-10 mx-auto w-full max-w-4xl px-3 sm:px-6">
            <div className="relative w-full overflow-hidden rounded-t-2xl border border-b-0 border-white/[0.08] bg-[#08080a]/95 px-4 pt-7 pb-[42vh] sm:px-9 sm:pt-9 sm:pb-[46vh] shadow-[0_50px_140px_-25px_rgba(0,0,0,0.9)]">
              <div className="animate-scan-line pointer-events-none absolute inset-x-0 z-50 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 text-center">
                One grid for every agent · zero lock-in
              </p>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 left-[112px] sm:left-[180px] lg:left-[200px]">
                  {[0, 14.67, 33.33, 53.77].map((pct, i) => (
                    <span key={i} className="absolute top-0 h-full w-px bg-white/[0.05]" style={{ left: `${pct}%` }} />
                  ))}
                </div>

                <div className="relative space-y-3 sm:space-y-4">
                  {COMPETITORS.map((comp, i) => (
                    <div key={i} className="flex items-center"
                         style={{ '--vg-index': i, '--vg-step': '60ms' } as React.CSSProperties}>
                      <div className="flex shrink-0 items-center gap-2 sm:gap-3 w-[112px] sm:w-[180px] lg:w-[200px]">
                        <div className={`h-[26px] w-[26px] rounded-[5px] flex items-center justify-center text-[10px] font-bold ${comp.primary ? 'bg-white/10 border border-white/20 text-white' : 'bg-white/5 border border-white/10 text-white/40'}`}>
                          {comp.name[0]}
                        </div>
                        <span className={`truncate text-[12.5px] sm:text-[15px] font-normal ${comp.primary ? 'text-white' : 'text-white/70'}`}>
                          {comp.name}
                        </span>
                      </div>
                      <div className="relative h-9 flex-1 sm:h-11">
                        {comp.primary ? (
                          <>
                            <div className="absolute left-0 top-1/2 h-[22px] w-[3px] -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_4px_rgba(255,255,255,0.3)] sm:h-[26px]" />
                            <span className="absolute top-1/2 -translate-y-1/2 pl-2 text-[12px] font-normal tabular-nums sm:pl-3 sm:text-[15px]" style={{ left: '3px' }}>
                              <span className="font-medium text-white">$0 / yr</span>
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="absolute left-0 top-1/2 h-[22px] -translate-y-1/2 rounded-l-[3px] rounded-r-[6px] sm:h-[26px]"
                                 style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.7))', width: `${comp.pct}%` }} />
                            <span className="absolute top-1/2 -translate-y-1/2 pl-2 text-[12px] font-normal tabular-nums sm:pl-3 sm:text-[15px]"
                                  style={{ left: `${comp.pct}%` }}>
                              <span className="text-white/60">{comp.price}<span className="text-white/30"> / yr</span></span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ MAIN CONTENT ═══════════════════════════ */}
      <div className="relative z-10 bg-[#08080a]">

        {/* ── Desktop Section ── */}
        <section id="desktop" className="relative z-30 -mt-[24vh] bg-[#08080a] px-6 py-10 md:-mt-[38vh] border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl divide-y divide-white/[0.06]">
            <div className="grid scroll-mt-24 items-center gap-10 py-24 md:grid-cols-2 md:gap-16 md:py-36">
              <div className="vg-hidden vg-in-rise">
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">
                  Desktop App
                </p>
                <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
                  Introducing <span className="text-white font-serif italic font-normal">VibeGrid Desktop</span>
                </h2>
                <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-zinc-400 font-normal">
                  Run coding agents in parallel on your machine — each in its own workspace.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg" className="vg-install-glow inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white text-black px-6 py-3.5 text-sm font-extrabold transition-all hover:bg-zinc-200 hover:shadow-[0_0_28px_rgba(255,255,255,0.2)] cursor-pointer">
                    Download DMG free →
                  </a>
                </div>
              </div>
              {/* Terminal mock */}
              <div className="vg-hidden vg-in-right" style={{ '--vg-delay': '0.08s' } as React.CSSProperties}>
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/50 transition-all duration-300 hover:border-white/[0.16]">
                  <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-3">
                    <span className="h-3 w-3 rounded-full bg-red-500/70" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                    <span className="h-3 w-3 rounded-full bg-white/70" />
                    <span className="ml-3 font-mono text-xs text-zinc-500">vibegrid — zsh</span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-white/[0.04] font-mono text-xs p-1 sm:p-2">
                    {[1,2,3,4].map((pane) => (
                      <div key={pane} className="min-h-[120px] p-3.5">
                        <div className="text-white/70 mb-1 font-bold">~/workspace-{pane}</div>
                        <div className="text-zinc-500">$ <span className="text-zinc-300">git status</span></div>
                        <div className="mt-1 text-zinc-600 text-[11px]">On branch main</div>
                        <div className="text-zinc-600 text-[11px]">nothing to commit</div>
                        {pane === 1 && (
                          <div className="mt-2 flex items-center gap-1.5 text-white">
                            <span className="animate-thinking-dot h-1.5 w-1.5 rounded-full bg-white" />
                            <span className="animate-thinking-dot h-1.5 w-1.5 rounded-full bg-white" style={{ animationDelay: '0.2s' }} />
                            <span className="animate-thinking-dot h-1.5 w-1.5 rounded-full bg-white" style={{ animationDelay: '0.4s' }} />
                            <span className="ml-1 text-[10px] uppercase font-bold tracking-widest">agent active</span>
                          </div>
                        )}
                        <div className="mt-2 text-zinc-400">$ <span className="animate-terminal-cursor text-white">▌</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── VERTICAL TIMELINE SECTION: ARCHITECTURE & CAPABILITIES ── */}
        <section id="architecture" className="relative overflow-hidden bg-[#08080a] py-28 sm:py-36 border-t border-white/[0.06]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-white/[0.025] blur-[120px]"
          />

          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
            <div className="max-w-3xl mb-20 sm:mb-28">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">
                Architecture & Capabilities
              </p>
              <h2
                className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]"
              >
                Built for performance.{' '}
                <br />
                <span className="text-zinc-400 font-normal">Every layer optimized.</span>
              </h2>
              <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-400 font-normal">
                How VibeGrid bridges low-level system PTY processes with GPU WebGL rendering and agent orchestration.
              </p>
            </div>

            {/* Vertical timeline line container */}
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute left-[23px] sm:left-[31px] top-8 bottom-8 w-px bg-gradient-to-b from-white/20 via-white/[0.08] to-transparent"
              />

              <div className="space-y-16 sm:space-y-24">
                {TIMELINE_ITEMS.map((item) => (
                  <article
                    key={item.num}
                    className="group relative grid grid-cols-[48px_1fr] sm:grid-cols-[64px_1fr] gap-6 sm:gap-10"
                  >
                    <div className="relative z-10">
                      <div
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#08080a] border border-white/[0.12] group-hover:border-white/30 flex items-center justify-center transition-all duration-300"
                      >
                        <span
                          className="text-xs sm:text-sm font-extrabold text-zinc-500 group-hover:text-white transition-colors"
                        >
                          {item.num}
                        </span>
                      </div>

                      <div
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-white/[0.04] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
                      />
                    </div>

                    <div className="pt-1 sm:pt-2 max-w-3xl">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="h-px w-6 bg-white/20 group-hover:w-10 group-hover:bg-white/50 transition-all duration-300" />
                        <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400 transition-colors">
                          {item.tag}
                        </span>
                      </div>

                      <h3
                        className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05] text-white"
                      >
                        {item.titlePrefix}
                        <span className="text-zinc-400 font-normal">{item.titleAccent}</span>
                      </h3>

                      <p className="mt-5 text-sm sm:text-base md:text-lg leading-relaxed text-zinc-400 font-normal max-w-2xl">
                        {item.desc}
                      </p>

                      <div className="mt-7 flex items-center gap-3">
                        <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.7)] transition-all" />
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-24 sm:mt-32 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
                Five pillars. One native engine.
              </p>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
                macOS · Windows (Coming Soon)
              </span>
            </div>
          </div>
        </section>



        {/* ── Workspaces Section ── */}
        <section id="workspaces" className="relative scroll-mt-24 bg-[#08080a] px-6 py-24 md:py-32 border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
              <div className="vg-hidden vg-in-rise">
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">
                  Workspaces
                </p>
                <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
                  Named workspaces, <span className="text-white font-serif italic font-normal">instant switching</span>
                </h2>
                <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-zinc-400 font-normal">
                  Create workspaces with <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-white/70">Cmd+Shift+N</kbd> and switch
                  between them with <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-white/70">Cmd+Shift+←/→</kbd>. Each workspace
                  remembers your exact pane layout and restores it on launch — switching
                  is confirmed first, since it starts a fresh shell in each pane.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['Rename anytime', 'Auto-saved to disk', 'Layout restored on launch'].map((t) => (
                    <span key={t} className="rounded-full border border-white/[0.08] bg-zinc-900/50 px-3 py-1 font-mono text-xs uppercase tracking-widest text-zinc-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="vg-hidden vg-in-right" style={{ '--vg-delay': '0.08s' } as React.CSSProperties}>
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-4 transition-all duration-300 hover:border-white/[0.16]">
                  <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-3 mb-3">
                    <span className="h-3 w-3 rounded-full bg-red-500/70" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                    <span className="h-3 w-3 rounded-full bg-white/70" />
                    <span className="ml-3 font-mono text-xs text-zinc-500">workspaces</span>
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    {['api-dev', 'db-admin', 'agent-lab', 'release-prep'].map((ws, i) => (
                      <div key={ws} className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 ${i === 0 ? 'border-white/[0.16] bg-white/[0.06] text-white font-bold' : 'border-white/[0.06] bg-black/30 text-zinc-500'}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        <span>{ws}</span>
                        <span className="ml-auto text-[10px] text-zinc-500">{i === 0 ? '4 panes · active' : `${[3, 2, 5][i - 1]} panes`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Themes Section ── */}
        <section id="themes" className="relative scroll-mt-24 bg-[#08080a] px-6 py-24 md:py-32 border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl">
            <div className="vg-hidden vg-in-rise mb-12 text-center">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 text-center">
                Built-in Themes
              </p>
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
                8 built-in themes, <span className="text-white font-serif italic font-normal">fully customizable</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-400 font-normal">
                VibeDark, One Dark Pro, Nord, Tokyo Night, Catppuccin, Gruvbox Dark, Solarized Dark, and GitHub Dark.
              </p>
            </div>

            <div className="vg-hidden vg-in-rise grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {[
                { name: 'VibeDark', bg: '#0b0d12', fg: '#e2e8f0', acc: '#ffffff' },
                { name: 'One Dark Pro', bg: '#282c34', fg: '#abb2bf', acc: '#61afef' },
                { name: 'Nord', bg: '#2e3440', fg: '#d8dee9', acc: '#88c0d0' },
                { name: 'Tokyo Night', bg: '#1a1b26', fg: '#c0caf5', acc: '#7aa2f7' },
                { name: 'Catppuccin', bg: '#1e1e2e', fg: '#cdd6f4', acc: '#cba6f7' },
                { name: 'Gruvbox Dark', bg: '#282828', fg: '#ebdbb2', acc: '#fabd2f' },
                { name: 'Solarized Dark', bg: '#002b36', fg: '#839496', acc: '#268bd2' },
                { name: 'GitHub Dark', bg: '#0d1117', fg: '#c9d1d9', acc: '#58a6ff' },
              ].map((t) => (
                <div key={t.name} className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-4 transition-all duration-300 hover:border-white/[0.16]">
                  <div className="shine-layer" aria-hidden="true" />
                  <div className="mb-3 flex h-12 items-end gap-1.5 rounded-xl border border-white/[0.06] p-2" style={{ backgroundColor: t.bg }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.acc }} />
                    <span className="h-3 w-1.5 rounded-sm" style={{ backgroundColor: t.acc }} />
                    <span className="h-2 w-1.5 rounded-sm" style={{ backgroundColor: t.fg }} />
                  </div>
                  <div className="font-mono text-xs font-bold text-white/90 uppercase tracking-widest">{t.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Architecture Topology Node Matrix Section ── */}
        <section id="network" className="relative scroll-mt-24 bg-[#08080a] px-6 py-20 md:py-28 border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl">
            <div className="vg-hidden vg-in-rise mb-12 text-center">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 text-center">
                Topology Matrix
              </p>
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
                Low-Latency <span className="text-white vg-text-glow font-serif italic font-normal">Node Network</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-400 font-normal">
                Real-time visualization of VibeGrid's multi-pane Rust PTY IPC bus, WebGL GPU stream, and agent routing matrix.
              </p>
            </div>

            <div className="vg-hidden vg-in-pop rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-4 sm:p-6">
              <GridNetworkVisual />
            </div>
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section className="relative bg-[#08080a] px-6 pt-24 pb-16 md:pt-32 md:pb-20 border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 text-center">
                Features
              </p>
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08] vg-hidden vg-in-text">
                Everything you need for Vibe Coding.<br/>
                <span className="animate-glow-pulse text-white vg-text-glow font-serif italic font-normal">No Walled Gardens.</span>
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: <ZapHoverIcon size={26} />, title: '60 FPS WebGL Rendering', desc: 'GPU-accelerated terminal using xterm.js WebGL renderer. Buttery smooth scrollback at 5000 lines.', visual: <WebGLPulseRing /> },
                { icon: <CpuHoverIcon size={26} />, title: 'Rust PTY Backend', desc: '<10ms keystroke latency. Native OS pseudo-terminal with backpressure-aware IPC batching at 16ms.', visual: <RustPtyDataFlow /> },
                { icon: <GridHoverIcon size={26} />, title: '1–16 Pane Grid', desc: 'Dynamically split into any layout. Perfect for orchestrating multiple AI agents side-by-side.', visual: <MultiPaneGridVisual /> },
                { icon: <HardDriveHoverIcon size={26} />, title: 'Agent Agnostic', desc: 'Break free from BridgeSpace. Run ANY AI coding agent locally without being locked into a walled garden ecosystem.', visual: <AgentAgnosticHubVisual /> },
                { icon: <PaletteHoverIcon size={26} />, title: '8 Built-in Themes', desc: 'VibeDark, One Dark Pro, Nord, Tokyo Night, Catppuccin, Gruvbox, Solarized, GitHub Dark.' },
                { icon: <KeyboardHoverIcon size={26} />, title: 'Command Palette', desc: 'Cmd+Shift+P fuzzy search. Every command, shortcut, and setting discoverable in one place.' },
              ].map((f, i) => (
                <div key={i}
                     className="vg-hidden vg-in-pop group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all duration-500 hover:border-white/[0.16] hover:bg-white/[0.04]"
                     style={{ '--vg-index': i, '--vg-step': '70ms', '--vg-delay': '0.05s' } as React.CSSProperties}>
                  <div className="shine-layer" aria-hidden="true" />
                  <div>
                    <div className="mb-4 flex items-center h-8">{f.icon}</div>
                    <h3 className="mb-2 text-[15px] font-extrabold tracking-tight text-white/90 font-sans">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-zinc-400 font-normal mb-4">{f.desc}</p>
                  </div>
                  {f.visual && <div className="mt-2">{f.visual}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Live activity map (world SVG + pulsing dots) ── */}
        <LiveMap />

        {/* ── Quote / Social Proof ── */}
        <section className="relative bg-[#08080a] px-6 py-16 md:py-24 border-t border-white/[0.08]">
          <div className="mx-auto max-w-3xl text-center">
            <div className="vg-hidden vg-in-fade">
              <p className="vg-serif font-serif italic text-[22px] leading-relaxed text-zinc-300 sm:text-[28px] md:text-[34px]">
                "Life-changing in making a dream of mine come true"
              </p>
              <p className="mt-4 font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">— Developer community feedback</p>
            </div>
          </div>
        </section>

        {/* ── Download Section ── */}
        <section id="download" className="relative bg-[#08080a] px-6 py-24 md:py-32 border-t border-white/[0.08]">
          <div className="mx-auto max-w-4xl">
            <div className="vg-hidden vg-in-rise mb-12 text-center">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 text-center">
                Download
              </p>
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08] mb-4">
                Download <span className="text-white vg-text-glow font-serif italic font-normal">VibeGrid</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-400 font-normal">Free forever. No account needed. Just download and run.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* macOS */}
              <div className="vg-hidden vg-in-pop group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 transition-all hover:border-white/[0.16] hover:bg-white/[0.03]"
                   style={{ '--vg-delay': '0s' } as React.CSSProperties}>
                <div className="shine-layer" aria-hidden="true" />
                <div className="absolute inset-0 animate-scan-line pointer-events-none">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="mb-6 flex items-center justify-between h-10">
                  <AppleHoverIcon size={32} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    Latest Release
                  </span>
                </div>
                <h3 className="mb-1 text-[18px] font-extrabold tracking-tight text-white font-sans">macOS</h3>
                <p className="mb-6 font-mono text-xs uppercase tracking-widest text-white/40">Apple Silicon · macOS 11+</p>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg"
                    target="_blank"
                    rel="noreferrer"
                    className="vg-install-glow flex items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white text-black px-6 py-3.5 text-sm font-extrabold tracking-tight transition-all hover:bg-zinc-200 hover:shadow-[0_0_28px_rgba(255,255,255,0.2)] cursor-pointer font-sans"
                  >
                    Download DMG (Apple Silicon · v1)
                  </a>
                  <a
                    href="https://github.com/abuzarkhan1/VibeGrid/releases/tag/v1"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-extrabold tracking-tight text-white/80 transition-all hover:bg-white/10 hover:text-white font-sans"
                  >
                    View Release on GitHub (v1)
                  </a>
                </div>
              </div>

              {/* Windows */}
              <div className="vg-hidden vg-in-pop group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 transition-all hover:border-white/15"
                   style={{ '--vg-delay': '0.08s' } as React.CSSProperties}>
                <div className="shine-layer" aria-hidden="true" />
                <div className="mb-6 flex items-center justify-between h-10">
                  <WindowHoverIcon size={32} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-zinc-300">
                    Coming Soon
                  </span>
                </div>
                <h3 className="mb-1 text-[18px] font-extrabold tracking-tight text-white font-sans">Windows</h3>
                <p className="mb-6 font-mono text-xs uppercase tracking-widest text-white/40">Windows 10 / 11 · x64 & ARM64</p>
                <div className="flex flex-col gap-2">
                  <div
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-sm font-extrabold tracking-tight text-white/40 select-none font-sans"
                  >
                    In Active Development · Coming Soon
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="relative bg-[#08080a] px-6 py-24 md:py-32 border-t border-white/[0.06]">
          <div className="mx-auto max-w-3xl">
            <div className="vg-hidden vg-in-rise mb-12 text-center">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 text-center">
                FAQ
              </p>
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">Frequently asked</h2>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {FAQS.map((faq, i) => (
                <details key={i} className="vg-hidden vg-in-fall group py-5"
                         style={{ '--vg-index': i, '--vg-step': '60ms' } as React.CSSProperties}>
                  <summary className="flex cursor-pointer items-center justify-between text-[15px] font-extrabold tracking-tight text-white/80 transition-colors hover:text-white list-none font-sans">
                    {faq.q}
                    <svg className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400 animate-accordion-down font-normal">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <SiteFooter active="home" />

      </div>
    </div>
  );
}
