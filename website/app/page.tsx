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

/* Live map (world SVG + 110 pulsing dots) is below the fold — lazy-load it
   so the 115KB map data + framer-motion don't inflate first load. */
const LiveMap = dynamic(() => import('../components/LiveMap'), {
  ssr: false,
  loading: () => <div className="h-[420px]" aria-hidden="true" />,
});

/* ─── Install command chip with copy button (CLI section) ─── */
function InstallCmd({ cmd }: { cmd: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-[13px] text-white/60">
      <span className="text-forest-bright">$</span>
      <span className="truncate">{cmd}</span>
      <button
        className="shrink-0 transition-colors hover:text-white/80"
        aria-label={`Copy ${cmd}`}
        onClick={() => {
          navigator.clipboard?.writeText(cmd).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? (
          <span className="text-forest-bright">✓</span>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}

/* ─── Parallax hook for footer hills ─── */
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
        // progress: 0 when bottom enters viewport, 1 when top leaves
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
  { q: 'Which platforms are supported?', a: 'macOS (Apple Silicon & Intel) and Windows (x64). Linux support is coming soon.' },
  { q: 'How do workspaces work?', a: 'Create named workspaces with Cmd+Shift+N, switch between them instantly. Each workspace remembers your exact pane layout and restores it on launch — switching to another workspace starts fresh shells, so running processes in the current one are terminated after confirmation.' },
  { q: 'Can I customize themes and keybindings?', a: 'Yes. VibeGrid ships with 8 built-in themes (VibeDark, One Dark Pro, Nord, Tokyo Night, Catppuccin, Gruvbox Dark, Solarized Dark, GitHub Dark) and a full keybinding editor.' },
];

export default function Home() {
  useScrollReveal();
  const { skyRef, hillsRef, cardRef } = useParallax();

  return (
    <div className="dark relative min-h-screen bg-black font-sans text-white overflow-x-hidden selection:bg-emerald-500 selection:text-black">

      {/* ═══════════════════════════ NAVBAR ═══════════════════════════ */}
      <Navbar active="home" />

      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section className="relative isolate overflow-hidden">

        {/* Sky gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#03060a_0%,#060c12_24%,#101f23_44%,#172a29_57%,#121a1a_71%,#070a0b_86%,#000000_100%)]" />

        {/* Stars canvas */}
        <StarsCanvas />

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-32 pt-36 text-center">

          {/* Badge */}
          <div className="fb-hidden fb-in-rise mb-8 inline-flex items-center gap-2 rounded-full border border-forest/30 bg-forest/10 px-3.5 py-1 text-[12px] text-forest-bright">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-bright opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-forest-bright" />
            </span>
            VibeGrid v0.1.0 · GPU-Accelerated Multi-Pane Terminal
          </div>

          {/* Main heading */}
          <h1 className="lp-hero-heading fb-hidden fb-in-text text-[44px] leading-[1.08] text-white sm:text-[58px] md:text-[72px] lg:text-[84px]"
              style={{ '--fb-delay': '0.05s' } as React.CSSProperties}>
            The "Agnostic"<br />
            <StaggeredText text="Vibe Coder" className="lp-text-glow-green text-forest-bright" step={45} startDelay={450} />{' '}
          </h1>

          {/* Sub text */}
          <p className="fb-hidden fb-in-rise mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-white/55"
             style={{ '--fb-delay': '0.12s' } as React.CSSProperties}>
            The lightning-fast, free, local-first grid for orchestrating <strong className="text-white">YOUR choice of AI agents.</strong> Escape BridgeSpace's walled garden and experience true vibe coding.
          </p>

          {/* CTA buttons */}
          <div className="fb-hidden fb-in-rise mt-10 flex flex-wrap items-center justify-center gap-3"
               style={{ '--fb-delay': '0.18s' } as React.CSSProperties}>
            <a href="/#download"
               className="install-box-glow group flex items-center gap-2 rounded-xl border border-forest/40 bg-forest px-5 py-3 text-[14px] font-medium text-white transition-all hover:bg-forest-bright hover:shadow-[0_0_28px_rgba(84,169,103,0.55)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
              Download for macOS
            </a>
            <a href="/#download"
               className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[14px] text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
              </svg>
              Windows
            </a>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 font-mono text-[13px] text-white/50">
              curl -fsSL https://vibegrid.vercel.app/install.sh | sh
              <button className="transition-colors hover:text-white/80" onClick={() => navigator.clipboard?.writeText('curl -fsSL https://vibegrid.vercel.app/install.sh | sh')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Social proof */}
          <p className="fb-hidden fb-in-rise mt-6 flex items-center justify-center gap-2 text-[13px] text-white/30"
             style={{ '--fb-delay': '0.24s' } as React.CSSProperties}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-bright opacity-75" />
              <span className="animate-pulse relative inline-flex h-2 w-2 rounded-full bg-forest-bright" />
            </span>
            100% free & open source · no account, no telemetry, no walled garden
          </p>
        </div>

        {/* Landscape / Comparison Card section */}
        <div className="parallax-container relative -mt-[12vh] h-[108vh] w-full md:-mt-16 md:h-[118vh]">

          {/* Sky layer */}
          <img ref={skyRef} src="/sky-bg.webp" alt="" aria-hidden="true"
               decoding="async" draggable="false"
               className="lp-gpu pointer-events-none absolute inset-x-0 bottom-[32%] z-0 w-full select-none object-cover brightness-[0.7] saturate-[0.8]" />

          {/* Hills layer */}
          <img ref={hillsRef} src="/hills-bg.webp" alt="" aria-hidden="true"
               decoding="async" draggable="false"
               className="lp-gpu pointer-events-none absolute inset-x-0 bottom-[21%] z-[1] w-full select-none object-cover brightness-[1.15] contrast-[1.05]" />

          {/* Comparison card */}
          <div ref={cardRef} className="lp-gpu absolute inset-x-0 top-[11%] z-10 mx-auto w-full max-w-4xl px-3 sm:px-6">
            <div className="relative w-full overflow-hidden rounded-t-[20px] border border-b-0 border-white/[0.08] bg-[#0b0c0e]/95 px-4 pt-7 pb-[42vh] sm:px-9 sm:pt-9 sm:pb-[46vh] shadow-[0_50px_140px_-25px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04)_inset]">

              {/* Scan line effect */}
              <div className="animate-scan-line pointer-events-none absolute inset-x-0 z-50 h-px bg-gradient-to-r from-transparent via-forest-bright/20 to-transparent" />

              <p className="text-white/55 mb-6 text-center text-[15px] sm:mb-7 sm:text-base">
                One grid for every agent · zero lock-in
              </p>

              {/* Grid lines */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 left-[112px] sm:left-[180px] lg:left-[200px]">
                  {[0, 14.67, 33.33, 53.77].map((pct, i) => (
                    <span key={i} className="absolute top-0 h-full w-px bg-white/[0.05]" style={{ left: `${pct}%` }} />
                  ))}
                </div>

                {/* Competitor bars */}
                <div className="relative space-y-3 sm:space-y-4">
                  {COMPETITORS.map((comp, i) => (
                    <div key={i} className="flex items-center"
                         style={{ '--fb-index': i, '--fb-step': '60ms' } as React.CSSProperties}>
                      <div className="flex shrink-0 items-center gap-2 sm:gap-3 w-[112px] sm:w-[180px] lg:w-[200px]">
                        <div className={`h-[26px] w-[26px] rounded-[5px] flex items-center justify-center text-[10px] font-bold ${comp.primary ? 'bg-forest/20 border border-forest/30 text-forest-bright' : 'bg-white/5 border border-white/10 text-white/40'}`}>
                          {comp.name[0]}
                        </div>
                        <span className={`truncate text-[12.5px] sm:text-[15px] font-normal ${comp.primary ? 'text-white' : 'text-white/70'}`}>
                          {comp.name}
                        </span>
                      </div>
                      <div className="relative h-9 flex-1 sm:h-11">
                        {comp.primary ? (
                          <>
                            <div className="absolute left-0 top-1/2 h-[22px] w-[3px] -translate-y-1/2 rounded-full bg-forest-bright shadow-[0_0_14px_4px_rgba(84,169,103,0.7)] sm:h-[26px]" />
                            <span className="absolute top-1/2 -translate-y-1/2 pl-2 text-[12px] font-normal tabular-nums sm:pl-3 sm:text-[15px]" style={{ left: '3px' }}>
                              <span className="font-medium text-forest-bright">$0 / yr</span>
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="absolute left-0 top-1/2 h-[22px] -translate-y-1/2 rounded-l-[3px] rounded-r-[6px] sm:h-[26px]"
                                 style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.12), rgba(239,68,68,0.7))', width: `${comp.pct}%` }} />
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
      <div className="relative z-10 bg-black">

        {/* ── Desktop Section ── */}
        <section id="desktop" className="relative z-30 -mt-[24vh] bg-black px-6 py-10 md:-mt-[38vh]">
          <div className="mx-auto max-w-6xl divide-y divide-white/[0.06]">
            <div className="grid scroll-mt-24 items-center gap-10 py-24 md:grid-cols-2 md:gap-16 md:py-36">
              <div className="fb-hidden fb-in-rise">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full border border-forest/40 bg-forest/15 px-2 py-0.5 text-[10px] font-normal uppercase tracking-wide text-forest-bright">New</span>
                </div>
                <h2 className="lp-feature-heading text-white">
                  Introducing <span className="text-forest-bright">VibeGrid Desktop</span>
                </h2>
                <p className="mt-4 max-w-md text-lg text-white/55">
                  Run coding agents in parallel on your machine — each in its own workspace.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="/#download" className="install-box-glow inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-forest-bright">
                    Download free →
                  </a>
                </div>
              </div>
              {/* Terminal mock */}
              <div className="fb-hidden fb-in-right" style={{ '--fb-delay': '0.08s' } as React.CSSProperties}>
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0b0d] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
                  {/* Terminal title bar */}
                  <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-3">
                    <span className="h-3 w-3 rounded-full bg-red-500/70" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                    <span className="h-3 w-3 rounded-full bg-forest/70" />
                    <span className="ml-3 text-[11px] text-white/30">vibegrid — zsh</span>
                  </div>
                  {/* Terminal content */}
                  <div className="grid grid-cols-2 divide-x divide-white/[0.04] font-mono text-[12px]">
                    {[1,2,3,4].map((pane) => (
                      <div key={pane} className="min-h-[120px] p-3">
                        <div className="text-forest-bright/60 mb-1">~/workspace-{pane}</div>
                        <div className="text-white/40">$ <span className="text-white/70">git status</span></div>
                        <div className="mt-1 text-white/30 text-[11px]">On branch main</div>
                        <div className="text-white/30 text-[11px]">nothing to commit</div>
                        {pane === 1 && (
                          <div className="mt-2 flex items-center gap-1.5 text-forest-bright/80">
                            <span className="animate-thinking-dot h-1 w-1 rounded-full bg-forest-bright" />
                            <span className="animate-thinking-dot h-1 w-1 rounded-full bg-forest-bright" style={{ animationDelay: '0.2s' }} />
                            <span className="animate-thinking-dot h-1 w-1 rounded-full bg-forest-bright" style={{ animationDelay: '0.4s' }} />
                            <span className="ml-1 text-[10px] text-forest-bright/60">agent orchestrating…</span>
                          </div>
                        )}
                        <div className="mt-2 text-white/70">$ <span className="animate-terminal-cursor text-forest-bright">▌</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CLI Section ── */}
        <section id="cli" className="relative scroll-mt-24 bg-black px-6 py-24 md:py-32">
          <div className="mx-auto max-w-4xl">
            <div className="fb-hidden fb-in-rise mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50 uppercase tracking-widest">
                INSTALLER
              </div>
              <h2 className="lp-feature-heading text-white">
                One command to <span className="text-forest-bright lp-text-glow-green">install</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] text-white/50">
                Pipe the official installer script — it detects your OS and architecture and grabs the right build.
              </p>
            </div>

            <div className="fb-hidden fb-in-rise mx-auto flex max-w-xl flex-col gap-3">
              <InstallCmd cmd="curl -fsSL https://vibegrid.vercel.app/install.sh | sh" />
            </div>
          </div>
        </section>

        {/* ── Workspaces Section ── */}
        <section id="workspaces" className="relative scroll-mt-24 bg-black px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
              <div className="fb-hidden fb-in-rise">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50 uppercase tracking-widest">
                  Workspaces
                </div>
                <h2 className="lp-feature-heading text-white">
                  Named workspaces, <span className="text-forest-bright">instant switching</span>
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/50">
                  Create workspaces with <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-white/70">Cmd+Shift+N</kbd> and switch
                  between them with <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-white/70">Cmd+Shift+←/→</kbd>. Each workspace
                  remembers your exact pane layout and restores it on launch — switching
                  is confirmed first, since it starts a fresh shell in each pane.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['Rename anytime', 'Auto-saved to disk', 'Layout restored on launch'].map((t) => (
                    <span key={t} className="rounded-full border border-forest/30 bg-forest/10 px-2.5 py-1 text-[11px] text-forest-light">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="fb-hidden fb-in-right" style={{ '--fb-delay': '0.08s' } as React.CSSProperties}>
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0b0d] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
                  <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-3">
                    <span className="h-3 w-3 rounded-full bg-red-500/70" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                    <span className="h-3 w-3 rounded-full bg-forest/70" />
                    <span className="ml-3 text-[11px] text-white/30">workspaces</span>
                  </div>
                  <div className="space-y-2 p-4 font-mono text-[12px]">
                    {['api-dev', 'db-admin', 'agent-lab', 'release-prep'].map((ws, i) => (
                      <div key={ws} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${i === 0 ? 'border-forest/40 bg-forest/10 text-white' : 'border-white/[0.06] bg-white/[0.02] text-white/40'}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-forest-bright" />
                        <span>{ws}</span>
                        <span className="ml-auto text-[10px] text-white/30">{i === 0 ? '4 panes · active' : `${[3, 2, 5][i - 1]} panes`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Themes Section ── */}
        <section id="themes" className="relative scroll-mt-24 bg-black px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="fb-hidden fb-in-rise mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50 uppercase tracking-widest">
                Themes
              </div>
              <h2 className="lp-feature-heading text-white">
                8 built-in themes, <span className="text-forest-bright">fully customizable</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] text-white/50">
                VibeDark, One Dark Pro, Nord, Tokyo Night, Catppuccin, Gruvbox Dark, Solarized Dark, and GitHub Dark —
                switch instantly or tune every color to your taste.
              </p>
            </div>

            <div className="fb-hidden fb-in-rise grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {[
                { name: 'VibeDark', bg: '#0b0d12', fg: '#e2e8f0', acc: '#54a967' },
                { name: 'One Dark Pro', bg: '#282c34', fg: '#abb2bf', acc: '#61afef' },
                { name: 'Nord', bg: '#2e3440', fg: '#d8dee9', acc: '#88c0d0' },
                { name: 'Tokyo Night', bg: '#1a1b26', fg: '#c0caf5', acc: '#7aa2f7' },
                { name: 'Catppuccin', bg: '#1e1e2e', fg: '#cdd6f4', acc: '#cba6f7' },
                { name: 'Gruvbox Dark', bg: '#282828', fg: '#ebdbb2', acc: '#fabd2f' },
                { name: 'Solarized Dark', bg: '#002b36', fg: '#839496', acc: '#268bd2' },
                { name: 'GitHub Dark', bg: '#0d1117', fg: '#c9d1d9', acc: '#58a6ff' },
              ].map((t) => (
                <div key={t.name} className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 transition-colors hover:border-forest/30">
                  <div className="shine-layer" aria-hidden="true" />
                  <div className="mb-2 flex h-12 items-end gap-1.5 rounded-lg border border-white/[0.06] p-2" style={{ backgroundColor: t.bg }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.acc }} />
                    <span className="h-3 w-1.5 rounded-sm" style={{ backgroundColor: t.acc }} />
                    <span className="h-2 w-1.5 rounded-sm" style={{ backgroundColor: t.fg }} />
                  </div>
                  <div className="text-[12px] font-medium text-white/80">{t.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section className="relative bg-black px-6 pt-24 pb-16 md:pt-32 md:pb-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <div className="fb-hidden fb-in-rise mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50 uppercase tracking-widest">
                Features
              </div>
              <h2 className="lp-feature-heading fb-hidden fb-in-text text-white">
                Everything you need for Vibe Coding.<br/>
                <span className="animate-glow-pulse text-forest-bright lp-text-glow-green">No Walled Gardens.</span>
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: <ZapHoverIcon size={26} />, title: '60 FPS WebGL Rendering', desc: 'GPU-accelerated terminal using xterm.js WebGL renderer. Buttery smooth scrollback at 5000 lines.' },
                { icon: <CpuHoverIcon size={26} />, title: 'Rust PTY Backend', desc: '<10ms keystroke latency. Native OS pseudo-terminal with backpressure-aware IPC batching at 16ms.' },
                { icon: <GridHoverIcon size={26} />, title: '1–16 Pane Grid', desc: 'Dynamically split into any layout. Perfect for orchestrating multiple AI agents side-by-side.' },
                { icon: <HardDriveHoverIcon size={26} />, title: 'Agent Agnostic', desc: 'Break free from BridgeSpace. Run ANY AI coding agent locally without being locked into a walled garden ecosystem.' },
                { icon: <PaletteHoverIcon size={26} />, title: '8 Built-in Themes', desc: 'VibeDark, One Dark Pro, Nord, Tokyo Night, Catppuccin, Gruvbox, Solarized, GitHub Dark.' },
                { icon: <KeyboardHoverIcon size={26} />, title: 'Command Palette', desc: 'Cmd+Shift+P fuzzy search. Every command, shortcut, and setting discoverable in one place.' },
              ].map((f, i) => (
                <div key={i}
                     className="fb-hidden fb-in-pop group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all duration-500 hover:border-forest/30 hover:bg-forest/[0.04]"
                     style={{ '--fb-index': i, '--fb-step': '70ms', '--fb-delay': '0.05s' } as React.CSSProperties}>
                  <div className="shine-layer" aria-hidden="true" />
                  <div className="mb-4 flex items-center h-8">{f.icon}</div>
                  <h3 className="mb-2 text-[15px] font-medium text-white/90">{f.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-white/45">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Live Map (Freebuff live-stats + pulsing world map) ── */}
        <LiveMap />

        {/* ── Quote / Social Proof ── */}
        <section className="relative bg-black px-6 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="fb-hidden fb-in-fade">
              <p className="lp-serif text-[22px] leading-relaxed text-white/70 sm:text-[28px] md:text-[34px]">
                "Life-changing in making a dream of mine come true"
              </p>
              <p className="mt-4 text-[13px] text-white/35">— Developer community feedback</p>
            </div>
          </div>
        </section>

        {/* ── Download Section ── */}
        <section id="download" className="relative bg-black px-6 py-24 md:py-32">
          <div className="mx-auto max-w-4xl">
            <div className="fb-hidden fb-in-rise mb-12 text-center">
              <h2 className="lp-feature-heading text-white mb-4">
                Download <span className="text-forest-bright lp-text-glow-green">VibeGrid</span>
              </h2>
              <p className="text-white/50 text-lg">Free forever. No account needed. Just download and run.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* macOS */}
              <div className="fb-hidden fb-in-pop group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 transition-all hover:border-forest/30 hover:bg-forest/[0.03]"
                   style={{ '--fb-delay': '0s' } as React.CSSProperties}>
                <div className="shine-layer" aria-hidden="true" />
                <div className="absolute inset-0 animate-scan-line pointer-events-none">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-forest/10 to-transparent" />
                </div>
                <div className="mb-6 flex items-center h-10"><AppleHoverIcon size={32} /></div>
                <h3 className="mb-1 text-[18px] font-medium text-white">macOS</h3>
                <p className="mb-6 text-[13px] text-white/40">Apple Silicon & Intel · macOS 12+</p>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v0.1.0/VibeGrid_0.1.0_aarch64.dmg"
                    target="_blank"
                    rel="noreferrer"
                    className="install-box-glow flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-medium text-white transition-all hover:bg-forest-bright"
                  >
                    Download for Apple Silicon
                  </a>
                  <a
                    href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v0.1.0/VibeGrid_0.1.0_x64.dmg"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60 transition-all hover:bg-white/10 hover:text-white"
                  >
                    Intel (x86)
                  </a>
                </div>
              </div>

              {/* Windows */}
              <div className="fb-hidden fb-in-pop group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 transition-all hover:border-white/15"
                   style={{ '--fb-delay': '0.08s' } as React.CSSProperties}>
                <div className="shine-layer" aria-hidden="true" />
                <div className="mb-6 flex items-center h-10"><WindowHoverIcon size={32} /></div>
                <h3 className="mb-1 text-[18px] font-medium text-white">Windows</h3>
                <p className="mb-6 text-[13px] text-white/40">Windows 10/11 · x64</p>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v0.1.0/VibeGrid_0.1.0_x64-setup.exe"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60 transition-all hover:bg-white/10 hover:text-white"
                  >
                    Download for Windows
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="relative bg-black px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl">
            <div className="fb-hidden fb-in-rise mb-12 text-center">
              <h2 className="lp-feature-heading text-white">Frequently asked</h2>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {FAQS.map((faq, i) => (
                <details key={i} className="fb-hidden fb-in-fall group py-5"
                         style={{ '--fb-index': i, '--fb-step': '60ms' } as React.CSSProperties}>
                  <summary className="flex cursor-pointer items-center justify-between text-[15px] font-normal text-white/80 transition-colors hover:text-white list-none">
                    {faq.q}
                    <svg className="h-4 w-4 shrink-0 text-white/30 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </summary>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/45 animate-accordion-down">
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
