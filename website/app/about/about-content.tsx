'use client';

import React from 'react';
import {
  Rocket,
  Lock,
  HeartHandshake,
  Cpu,
  Github,
  ArrowRight,
  Sparkles,
  Star,
  Globe,
} from 'lucide-react';
import { useScrollReveal } from '../../components/useScrollReveal';
import { StarsCanvas } from '../../components/StarsCanvas';
import { Navbar } from '../../components/Navbar';
import { SiteFooter } from '../../components/SiteFooter';
import StaggeredText from '../../components/StaggeredText';
import { GridRadarHero } from '../../components/GridRadarHero';

/* ─── Timeline Principles data ─── */
interface PrincipleItem {
  num: string;
  tag: string;
  titlePrefix: string;
  titleAccent: string;
  desc: string;
  badge: string;
  icon: React.ReactNode;
}

const PRINCIPLE_ITEMS: PrincipleItem[] = [
  {
    num: '01',
    tag: 'Open Source',
    titlePrefix: 'Free ',
    titleAccent: 'Forever',
    desc: 'No subscriptions, no trials, no paid feature walls. VibeGrid is MIT licensed and open source — free for everyone, always.',
    badge: 'MIT License',
    icon: <HeartHandshake size={20} className="stroke-white" />,
  },
  {
    num: '02',
    tag: 'Agnostic',
    titlePrefix: 'No Walled ',
    titleAccent: 'Gardens',
    desc: 'Run ANY AI coding agent you choose, locally. VibeGrid is completely agnostic — your stack, your agents, your rules.',
    badge: 'Zero Lock-In',
    icon: <Rocket size={20} className="stroke-white" />,
  },
  {
    num: '03',
    tag: 'Security',
    titlePrefix: 'Private by ',
    titleAccent: 'Default',
    desc: 'Zero telemetry, zero analytics, zero accounts. A 100% local desktop process — your terminals never leave your machine.',
    badge: '100% Local',
    icon: <Lock size={20} className="stroke-white" />,
  },
  {
    num: '04',
    tag: 'Performance',
    titlePrefix: 'Fast by ',
    titleAccent: 'Design',
    desc: '60 FPS WebGL rendering with a Rust PTY backend for sub-10ms keystroke latency. Tools should never slow you down.',
    badge: '<10ms Latency',
    icon: <Cpu size={20} className="stroke-white" />,
  },
];

const STACK = [
  'Tauri 2', 'Rust', 'React 18', 'TypeScript', 'xterm.js', 'WebGL', 'Zustand', 'Tailwind CSS', 'Framer Motion',
];

/* ─── Stats data ─── */
const STATS = [
  { value: '1', label: 'Solo developer' },
  { value: '$0', label: 'Cost to use, forever' },
  { value: '16', label: 'Live terminal panes' },
  { value: '100%', label: 'Free & open source' },
];

export default function AboutContent() {
  useScrollReveal();

  return (
    <div className="dark relative min-h-screen bg-[#08080a] font-sans text-white overflow-x-hidden selection:bg-white selection:text-black">

      {/* ═══════════════════════════ NAVBAR ═══════════════════════════ */}
      <Navbar active="about" />

      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section className="relative isolate overflow-hidden bg-[#08080a]">

        {/* Stars canvas */}
        <StarsCanvas />

        {/* Hero Grid Radar SVG Visual */}
        <GridRadarHero />

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-24 pt-36 text-center sm:pb-28">

          {/* Section label badge */}
          <div className="vg-hidden vg-in-rise mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-zinc-900/50 px-3.5 py-1 font-mono text-xs uppercase tracking-widest text-white">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            About the creator
          </div>

          {/* Main heading */}
          <h1 className="vg-hero-heading vg-hidden vg-in-text font-extrabold tracking-tight text-[40px] leading-[1.08] text-white sm:text-[54px] md:text-[64px] lg:text-[72px]"
              style={{ '--vg-delay': '0.08s' } as React.CSSProperties}>
            Hi, I&apos;m{' '}
            <StaggeredText text="Abuzar Khan" className="vg-text-glow text-white font-extrabold tracking-tight" step={40} startDelay={420} />
          </h1>

          {/* Sub text */}
          <p className="vg-hidden vg-in-rise mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-400 font-normal"
             style={{ '--vg-delay': '0.14s' } as React.CSSProperties}>
            I build open-source tools that make developers&apos; work easier — faster, freer,
            and a little more fun. <strong className="text-white font-extrabold">VibeGrid</strong> is my love letter
            to everyone who codes.
          </p>

          {/* CTA buttons */}
          <div className="vg-hidden vg-in-rise mt-10 flex flex-wrap items-center justify-center gap-3"
               style={{ '--vg-delay': '0.2s' } as React.CSSProperties}>
            <a href="https://github.com/abuzarkhan1" target="_blank" rel="noreferrer"
              className="vg-install-glow group flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white text-black px-6 py-3.5 text-sm font-extrabold tracking-tight transition-all hover:bg-zinc-200 hover:shadow-[0_0_28px_rgba(255,255,255,0.2)] cursor-pointer font-sans">
              <Github size={16} />
              Follow on GitHub
            </a>
            <a href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[14px] font-extrabold tracking-tight text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white cursor-pointer font-sans">
              Download DMG
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ MAIN CONTENT ═══════════════════════════ */}
      <div className="relative z-10 bg-[#08080a]">

        {/* ── Mission Section ── */}
        <section className="relative scroll-mt-24 bg-[#08080a] px-6 py-24 md:py-32 border-t border-white/[0.06]">
          <div className="mx-auto max-w-3xl text-center">
            <div className="vg-hidden vg-in-rise mb-12 text-center">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 text-center">
                The Why
              </p>
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
                Built for one simple reason — to make{' '}
                <span className="text-white vg-text-glow font-serif italic font-normal">developers&apos; work easier</span>
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-400 font-normal">
                VibeGrid started as a frustration. Terminal tools were either slow, expensive, or locked
                into walled gardens that decided which AI agents you were allowed to run. I wanted a
                workspace that was <span className="text-white font-extrabold">fast, free, local-first, and
                completely agnostic</span> — one grid where any developer can orchestrate any agent, without
                permission and without lock-in. That&apos;s the whole idea.
              </p>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((s, i) => (
                <div key={s.label}
                     className="vg-hidden vg-in-fall group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-6 transition-all duration-500 hover:border-white/[0.16] hover:bg-white/[0.04]"
                     style={{ '--vg-index': i, '--vg-step': '60ms' } as React.CSSProperties}>
                  <div className="shine-layer" aria-hidden="true" />
                  <div className="font-mono text-3xl sm:text-4xl font-bold text-white">{s.value}</div>
                  <div className="mt-2 font-mono text-xs uppercase tracking-widest text-white/40">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Story + Terminal Section ── */}
        <section className="relative scroll-mt-24 bg-[#08080a] px-6 py-24 md:py-32 border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
              <div className="vg-hidden vg-in-rise">
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">
                  The Story
                </p>
                <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
                  One developer, <span className="text-white font-serif italic font-normal">one mission</span>
                </h2>
                <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-zinc-400 font-normal">
                  I&apos;m Abuzar Khan — a solo developer who believes the best software is the kind you
                  can hold in your hands, inspect line by line, and improve together. VibeGrid is built
                  the way I like to work: <span className="text-white font-extrabold">open source, MIT licensed, and
                  free forever</span>.
                </p>
                <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-zinc-400 font-normal">
                  Every pane, every keybinding, every theme in this app exists for the same reason the
                  project exists: to shave friction off a developer&apos;s day so they can focus on what
                  actually matters — building.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['Open source', 'MIT licensed', 'No telemetry', 'No accounts'].map((t) => (
                    <span key={t} className="rounded-full border border-white/[0.08] bg-zinc-900/50 px-3 py-1 font-mono text-xs uppercase tracking-widest text-zinc-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Terminal mock */}
              <div className="vg-hidden vg-in-right" style={{ '--vg-delay': '0.08s' } as React.CSSProperties}>
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 transition-all duration-300 hover:border-white/[0.16]">
                  <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-3 mb-3">
                    <span className="h-3 w-3 rounded-full bg-red-500/70" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                    <span className="h-3 w-3 rounded-full bg-white/70" />
                    <span className="ml-3 font-mono text-xs text-zinc-500">abuzar — zsh</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs leading-relaxed">
                    <div className="text-white/70 font-bold">~/projects/vibegrid</div>
                    <div><span className="text-zinc-500">$</span> <span className="text-zinc-300">whoami</span></div>
                    <div className="text-zinc-400">abuzar khan</div>
                    <div><span className="text-zinc-500">$</span> <span className="text-zinc-300">echo $MISSION</span></div>
                    <div className="text-white font-bold">make developers&apos; work easier</div>
                    <div><span className="text-zinc-500">$</span> <span className="text-zinc-300">./vibegrid --philosophy</span></div>
                    <div className="text-zinc-400">free · local-first · agent-agnostic</div>
                    <div className="flex items-center gap-1.5 pt-1.5 text-white">
                      <span className="animate-thinking-dot h-1.5 w-1.5 rounded-full bg-white" />
                      <span className="animate-thinking-dot h-1.5 w-1.5 rounded-full bg-white" style={{ animationDelay: '0.2s' }} />
                      <span className="animate-thinking-dot h-1.5 w-1.5 rounded-full bg-white" style={{ animationDelay: '0.4s' }} />
                      <span className="ml-1 font-mono text-[10px] font-bold uppercase tracking-widest">shipping open source…</span>
                    </div>
                    <div className="pt-1"><span className="text-zinc-500">$</span> <span className="animate-terminal-cursor text-white">▌</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── VERTICAL TIMELINE SECTION: PRINCIPLES / WHAT I BELIEVE ── */}
        <section className="relative overflow-hidden bg-[#08080a] py-28 sm:py-36 border-t border-white/[0.06]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-white/[0.025] blur-[120px]"
          />

          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
            <div className="max-w-3xl mb-20 sm:mb-28">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">
                What I Believe
              </p>
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
                The principles behind{' '}
                <br />
                <span className="text-white vg-text-glow font-serif italic font-normal">every line of code.</span>
              </h2>
              <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-400 font-normal">
                Four core tenets guiding VibeGrid's architecture, roadmap, and philosophy.
              </p>
            </div>

            {/* Vertical timeline line container */}
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute left-[23px] sm:left-[31px] top-8 bottom-8 w-px bg-gradient-to-b from-white/20 via-white/[0.08] to-transparent"
              />

              <div className="space-y-16 sm:space-y-24">
                {PRINCIPLE_ITEMS.map((item) => (
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
                        className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05] text-white flex items-center gap-3"
                      >
                        <span className="inline-flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 text-white">
                          {item.icon}
                        </span>
                        <span>
                          {item.titlePrefix}
                          <span className="text-zinc-400 font-normal">{item.titleAccent}</span>
                        </span>
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
                Four principles. No compromises.
              </p>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
                100% Free & Open Source
              </span>
            </div>
          </div>
        </section>

        {/* ── Stack Section ── */}
        <section className="relative scroll-mt-24 bg-[#08080a] px-6 py-24 md:py-32 border-t border-white/[0.06]">
          <div className="mx-auto max-w-4xl">
            <div className="vg-hidden vg-in-rise mb-12 text-center">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 text-center">
                The Stack
              </p>
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
                Built with <span className="text-white font-serif italic font-normal">tools I love</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-400 font-normal">
                A modern desktop terminal deserves a modern foundation — Rust where it counts, React where it shines.
              </p>
            </div>

            <div className="vg-hidden vg-in-rise flex flex-wrap items-center justify-center gap-3">
              {STACK.map((s, i) => (
                <span key={s}
                  className="vg-hidden vg-in-fall rounded-full border border-white/[0.08] bg-zinc-900/50 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 transition-all duration-300 hover:border-white/[0.16] hover:text-white"
                  style={{ '--vg-index': i, '--vg-step': '50ms' } as React.CSSProperties}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Connect Section ── */}
        <section className="relative bg-[#08080a] px-6 py-24 md:py-32 border-t border-white/[0.06]">
          <div className="mx-auto max-w-3xl">
            <div className="vg-hidden vg-in-rise rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-8 text-center sm:p-12 hover:border-white/[0.16] transition-all duration-300">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 text-center">
                Let&apos;s connect
              </p>
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
                Let&apos;s build something <span className="text-white vg-text-glow font-serif italic font-normal">together</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-400 font-normal">
                VibeGrid is open to everyone — contributors, testers, and dreamers. Found a bug, want a
                feature, or just want to say hi? The door is open.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a href="https://github.com/abuzarkhan1/VibeGrid" target="_blank" rel="noreferrer"
                  className="vg-install-glow flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white text-black px-6 py-3.5 text-sm font-extrabold tracking-tight transition-all hover:bg-zinc-200 hover:shadow-[0_0_28px_rgba(255,255,255,0.2)] cursor-pointer font-sans">
                  <Star size={16} className="fill-black" />
                  Star on GitHub
                </a>
                <a href="https://github.com/abuzarkhan1/VibeGrid/issues" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-zinc-900/50 px-6 py-3.5 text-sm font-extrabold tracking-tight text-white/70 transition-all hover:border-white/[0.16] hover:bg-zinc-800 hover:text-white cursor-pointer font-sans">
                  <Sparkles size={15} />
                  Open an issue
                </a>
                <a href="/" className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-zinc-900/50 px-6 py-3.5 text-sm font-extrabold tracking-tight text-white/70 transition-all hover:border-white/[0.16] hover:bg-zinc-800 hover:text-white cursor-pointer font-sans">
                  <Globe size={15} />
                  Back to homepage
                </a>
              </div>
              <div className="mt-8 font-mono text-xs uppercase tracking-widest text-white/40">
                <span className="text-white">$</span> abuzarkhan1 — open source, always.
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <SiteFooter active="about" />

      </div>
    </div>
  );
}
