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
  HeartHoverIcon,
} from '../components/ItsHoverIcons';

/* ─── Scroll-reveal hook (IntersectionObserver → fb-animate) ─── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.fb-hidden');
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.classList.remove('fb-hidden');
            el.classList.add('fb-animate');
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
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

/* ─── Stars data ─── */
const STARS = [
  { left:'84.18%', top:'8.85%',  w:2, min:0.5, max:1, glow:'4px', dur:'5.949s', delay:'0.101s' },
  { left:'8.42%',  top:'51.41%', w:3, min:0.5, max:1, glow:'5px', dur:'5.516s', delay:'1.879s' },
  { left:'21.10%', top:'22.89%', w:3, min:0.5, max:1, glow:'5px', dur:'3.545s', delay:'1.894s' },
  { left:'26.15%', top:'7.74%',  w:3, min:0.5, max:1, glow:'5px', dur:'4.636s', delay:'2.575s' },
  { left:'26.46%', top:'66.14%', w:3, min:0.5, max:1, glow:'5px', dur:'4.070s', delay:'4.793s' },
  { left:'89.21%', top:'3.14%',  w:3, min:0.5, max:1, glow:'5px', dur:'5.912s', delay:'1.773s' },
  { left:'55.25%', top:'55.31%', w:2, min:0.5, max:1, glow:'4px', dur:'5.115s', delay:'0.597s' },
  { left:'32.67%', top:'22.03%', w:3, min:0.5, max:1, glow:'5px', dur:'4.444s', delay:'2.224s' },
  { left:'76.28%', top:'73.86%', w:3, min:0.5, max:1, glow:'5px', dur:'4.523s', delay:'2.250s' },
  { left:'5.32%',  top:'71.79%', w:2, min:0.5, max:1, glow:'4px', dur:'4.107s', delay:'2.597s' },
  { left:'12.38%', top:'12.62%', w:2, min:0.5, max:1, glow:'4px', dur:'6.023s', delay:'0.312s' },
  { left:'63.11%', top:'18.44%', w:3, min:0.5, max:1, glow:'5px', dur:'3.882s', delay:'3.107s' },
  { left:'47.55%', top:'44.22%', w:2, min:0.5, max:1, glow:'4px', dur:'5.331s', delay:'1.450s' },
  { left:'38.90%', top:'35.67%', w:3, min:0.5, max:1, glow:'5px', dur:'4.788s', delay:'0.820s' },
  { left:'72.44%', top:'60.19%', w:2, min:0.5, max:1, glow:'4px', dur:'5.673s', delay:'3.995s' },
  { left:'18.72%', top:'82.55%', w:3, min:0.5, max:1, glow:'5px', dur:'4.231s', delay:'2.040s' },
];

const SHOOTING_STARS = [
  { top:'8%',  left:'6%',  dx:'360px', dy:'190px', dur:'6s',   delay:'0.5s' },
  { top:'14%', left:'52%', dx:'420px', dy:'220px', dur:'7s',   delay:'2.2s' },
  { top:'22%', left:'78%', dx:'320px', dy:'170px', dur:'6.5s', delay:'4s'   },
  { top:'30%', left:'20%', dx:'460px', dy:'250px', dur:'8s',   delay:'1.4s' },
  { top:'38%', left:'64%', dx:'380px', dy:'200px', dur:'7.5s', delay:'3.3s' },
  { top:'46%', left:'34%', dx:'300px', dy:'160px', dur:'6.8s', delay:'5s'   },
];

/* ─── Comparison data ─── */
const COMPETITORS = [
  { name: 'VibeGrid',    price: '$0',    pct: 3,    primary: true },
  { name: 'BridgeSpace', price: '$120',  pct: 14.7, primary: false },
  { name: 'Warp Pro',    price: '$240',  pct: 29.5, primary: false },
  { name: 'iTerm2 Grid', price: '$480',  pct: 48.2, primary: false },
  { name: 'tmux',        price: '$720',  pct: 62.8, primary: false },
  { name: 'WezTerm',     price: '$1200', pct: 82.4, primary: false },
];

/* ─── FAQ data ─── */
const FAQS = [
  { q: 'Is VibeGrid really free?', a: 'Yes. VibeGrid is completely free — no subscriptions, no API keys required. Download and run locally on macOS or Windows.' },
  { q: 'What makes VibeGrid different from other terminals?', a: 'VibeGrid uses WebGL GPU-accelerated rendering for 60 FPS across up to 16 live panes simultaneously, with a Rust PTY backend for <10ms keystroke latency.' },
  { q: 'Which platforms are supported?', a: 'macOS (Apple Silicon & Intel) and Windows (x64). Linux support is coming soon.' },
  { q: 'How do workspaces work?', a: 'Create named workspaces with Cmd+Shift+N, switch between them instantly. Each workspace remembers your exact pane layout and sessions.' },
  { q: 'Can I customize themes and keybindings?', a: 'Yes. VibeGrid ships with 7 built-in themes (VibeDark, Midnight Blue, Dracula, Nord, Solarized Dark/Light, VibeLight) and a full keybinding editor.' },
];

export default function Home() {
  useScrollReveal();
  const { skyRef, hillsRef, cardRef } = useParallax();

  return (
    <div className="dark relative min-h-screen bg-black font-sans text-white overflow-x-hidden selection:bg-emerald-500 selection:text-black">

      {/* ═══════════════════════════ NAVBAR ═══════════════════════════ */}
      <header className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-black/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">

          {/* Logo */}
          <a href="/" className="flex shrink-0 items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-forest text-white shadow-[0_0_18px_rgba(44,122,64,0.55)]">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.9"/>
                <rect x="9" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.5"/>
                <rect x="1" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.5"/>
                <rect x="9" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.2"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-white/90 tracking-tight">VibeGrid</span>
          </a>

          {/* Nav links */}
          <nav className="hidden items-center gap-1 md:flex">
            {['Desktop','CLI','Workspaces','Themes'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="rounded-md px-3 py-1.5 text-[13.5px] text-white/55 transition-colors hover:text-white hover:bg-white/5">
                {item}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            <a href="https://github.com/vibegrid/vibegrid" target="_blank" rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] text-white/70 transition-colors hover:border-white/20 hover:text-white sm:flex">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>8.2k</span>
            </a>
            <button className="rounded-md bg-forest px-3.5 py-1.5 text-[13px] font-medium text-white transition-all hover:bg-forest-bright hover:shadow-[0_0_16px_rgba(84,169,103,0.4)] install-box-glow">
              Download
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section className="relative isolate overflow-hidden">

        {/* Sky gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#03060a_0%,#060c12_24%,#101f23_44%,#172a29_57%,#121a1a_71%,#070a0b_86%,#000000_100%)]" />

        {/* Stars canvas */}
        <div className="lp-gpu pointer-events-none absolute inset-0">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {STARS.map((s, i) => (
              <span key={i} className="lp-star" style={{
                left: s.left, top: s.top,
                width: `${s.w}px`, height: `${s.w}px`,
                '--min': s.min, '--max': s.max,
                '--glow': s.glow, '--dur': s.dur, '--delay': s.delay,
              } as React.CSSProperties} />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {SHOOTING_STARS.map((s, i) => (
              <span key={i} className="lp-shooting-star" style={{
                top: s.top, left: s.left,
                '--dx': s.dx, '--dy': s.dy, '--dur': s.dur, '--delay': s.delay,
              } as React.CSSProperties} />
            ))}
          </div>
        </div>

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
            The workspace<br />
            <span className="lp-text-glow-green text-forest-bright">terminals</span>{' '}
            <span className="text-white/40 lp-serif italic">dream of</span>
          </h1>

          {/* Sub text */}
          <p className="fb-hidden fb-in-rise mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-white/55"
             style={{ '--fb-delay': '0.12s' } as React.CSSProperties}>
            Dynamic 1–16 equal panes, Rust PTY backend, 60 FPS WebGL GPU rendering.{' '}
            <span className="text-white/80">Zero cost. Forever free.</span>
          </p>

          {/* CTA buttons */}
          <div className="fb-hidden fb-in-rise mt-10 flex flex-wrap items-center justify-center gap-3"
               style={{ '--fb-delay': '0.18s' } as React.CSSProperties}>
            <a href="#download"
               className="install-box-glow group flex items-center gap-2 rounded-xl border border-forest/40 bg-forest px-5 py-3 text-[14px] font-medium text-white transition-all hover:bg-forest-bright hover:shadow-[0_0_28px_rgba(84,169,103,0.55)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
              Download for macOS
            </a>
            <a href="#download"
               className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[14px] text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
              </svg>
              Windows
            </a>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 font-mono text-[13px] text-white/50">
              npm i -g vibegrid
              <button className="transition-colors hover:text-white/80" onClick={() => navigator.clipboard?.writeText('npm i -g vibegrid')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Social proof */}
          <p className="fb-hidden fb-in-rise mt-6 text-[13px] text-white/30"
             style={{ '--fb-delay': '0.24s' } as React.CSSProperties}>
            Join <span className="font-medium text-white/60">127,000+</span> developers already using VibeGrid
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
                Join <span className="font-normal text-white/85">127,000</span> developers
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
                  <a href="#download" className="install-box-glow inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-forest-bright">
                    Download free →
                  </a>
                </div>
              </div>
              {/* Terminal mock */}
              <div className="fb-hidden fb-in-pop" style={{ '--fb-delay': '0.08s' } as React.CSSProperties}>
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
                        <div className="mt-2 text-white/70">$ <span className="lp-caret-blink text-forest-bright">▌</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
                Everything you need.<br/>
                <span className="text-forest-bright lp-text-glow-green">Nothing you don't.</span>
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: <ZapHoverIcon size={26} />, title: '60 FPS WebGL Rendering', desc: 'GPU-accelerated terminal using xterm.js WebGL renderer. Buttery smooth scrollback at 5000 lines.' },
                { icon: <CpuHoverIcon size={26} />, title: 'Rust PTY Backend', desc: '<10ms keystroke latency. Native OS pseudo-terminal with backpressure-aware IPC batching at 16ms.' },
                { icon: <GridHoverIcon size={26} />, title: '1–16 Pane Grid', desc: 'Dynamically split into any layout. Binary tree grid with drag-to-resize and keyboard navigation.' },
                { icon: <HardDriveHoverIcon size={26} />, title: 'Workspaces', desc: 'Named workspaces persisted to disk in atomic JSON. Switch instantly with Cmd+Shift+Left/Right.' },
                { icon: <PaletteHoverIcon size={26} />, title: '7 Built-in Themes', desc: 'VibeDark, Midnight Blue, Dracula, Nord, Solarized Dark/Light, VibeLight. Full customization.' },
                { icon: <KeyboardHoverIcon size={26} />, title: 'Command Palette', desc: 'Cmd+Shift+P fuzzy search. Every command, shortcut, and setting discoverable in one place.' },
              ].map((f, i) => (
                <div key={i}
                     className="fb-hidden fb-in-pop group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all duration-500 hover:border-forest/30 hover:bg-forest/[0.04]"
                     style={{ '--fb-index': i, '--fb-step': '70ms', '--fb-delay': '0.05s' } as React.CSSProperties}>
                  <div className="mb-4 flex items-center h-8">{f.icon}</div>
                  <h3 className="mb-2 text-[15px] font-medium text-white/90">{f.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-white/45">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

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
                <div className="absolute inset-0 animate-scan-line pointer-events-none">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-forest/10 to-transparent" />
                </div>
                <div className="mb-6 flex items-center h-10"><AppleHoverIcon size={32} /></div>
                <h3 className="mb-1 text-[18px] font-medium text-white">macOS</h3>
                <p className="mb-6 text-[13px] text-white/40">Apple Silicon & Intel · macOS 12+</p>
                <div className="flex flex-col gap-2">
                  <a href="#" className="install-box-glow flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-medium text-white transition-all hover:bg-forest-bright">
                    Download for Apple Silicon
                  </a>
                  <a href="#" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60 transition-all hover:bg-white/10 hover:text-white">
                    Intel (x86)
                  </a>
                </div>
              </div>

              {/* Windows */}
              <div className="fb-hidden fb-in-pop group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 transition-all hover:border-white/15"
                   style={{ '--fb-delay': '0.08s' } as React.CSSProperties}>
                <div className="mb-6 flex items-center h-10"><WindowHoverIcon size={32} /></div>
                <h3 className="mb-1 text-[18px] font-medium text-white">Windows</h3>
                <p className="mb-6 text-[13px] text-white/40">Windows 10/11 · x64</p>
                <div className="flex flex-col gap-2">
                  <a href="#" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60 transition-all hover:bg-white/10 hover:text-white">
                    Download for Windows
                  </a>
                  <a href="#" className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.05] px-4 py-3 text-sm text-white/30 transition-all hover:text-white/50">
                    Or: npm i -g vibegrid
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
                <details key={i} className="group py-5">
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

        {/* ── Footer Landscape ── */}
        <section className="relative overflow-hidden bg-black">
          <div className="parallax-container relative h-[60vh] w-full">

            {/* Bushes foreground */}
            <img src="/bushes-fg.webp" alt="" aria-hidden="true"
                 decoding="async" draggable="false"
                 className="lp-gpu pointer-events-none absolute inset-x-0 bottom-0 z-[2] w-full select-none object-cover" />

            {/* VibeGrid wordmark in landscape */}
            <div className="absolute inset-x-0 bottom-[18%] z-[3] flex items-center justify-center">
              <span className="select-none font-sans text-[clamp(3rem,10vw,9rem)] font-black uppercase tracking-[0.15em] text-white opacity-[0.22]">
                VIBEGRID
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
