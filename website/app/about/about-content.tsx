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

/* ─── Values data ─── */
const VALUES = [
  {
    icon: <HeartHandshake size={26} className="stroke-forest-bright" />,
    title: 'Free forever',
    desc: 'No subscriptions, no trials, no paid feature walls. VibeGrid is MIT licensed and open source — free for everyone, always.',
  },
  {
    icon: <Rocket size={26} className="stroke-amber-400" />,
    title: 'No walled gardens',
    desc: 'Run ANY AI coding agent you choose, locally. VibeGrid is completely agnostic — your stack, your agents, your rules.',
  },
  {
    icon: <Lock size={26} className="stroke-cyan-400" />,
    title: 'Private by default',
    desc: 'Zero telemetry, zero analytics, zero accounts. A 100% local desktop process — your terminals never leave your machine.',
  },
  {
    icon: <Cpu size={26} className="stroke-emerald-400" />,
    title: 'Fast by design',
    desc: '60 FPS WebGL rendering with a Rust PTY backend for sub-10ms keystroke latency. Tools should never slow you down.',
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
    <div className="dark relative min-h-screen bg-black font-sans text-white overflow-x-hidden selection:bg-emerald-500 selection:text-black">

      {/* ═══════════════════════════ NAVBAR ═══════════════════════════ */}
      <Navbar active="about" />

      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section className="relative isolate overflow-hidden">

        {/* Sky gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#03060a_0%,#060c12_24%,#101f23_44%,#172a29_57%,#121a1a_71%,#070a0b_86%,#000000_100%)]" />

        {/* Stars canvas */}
        <StarsCanvas />

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-24 pt-36 text-center sm:pb-28">

          {/* Badge */}
          <div className="fb-hidden fb-in-rise mb-8 inline-flex items-center gap-2 rounded-full border border-forest/30 bg-forest/10 px-3.5 py-1 text-[12px] text-forest-bright">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-bright opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-forest-bright" />
            </span>
            About the creator
          </div>


          {/* Main heading */}
          <h1 className="lp-hero-heading fb-hidden fb-in-text text-[40px] leading-[1.08] text-white sm:text-[54px] md:text-[64px] lg:text-[72px]"
              style={{ '--fb-delay': '0.08s' } as React.CSSProperties}>
            Hi, I&apos;m{' '}
            <StaggeredText text="Abuzar Khan" className="lp-text-glow-green text-forest-bright" step={40} startDelay={420} />
          </h1>

          {/* Sub text */}
          <p className="fb-hidden fb-in-rise mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-white/55"
             style={{ '--fb-delay': '0.14s' } as React.CSSProperties}>
            I build open-source tools that make developers&apos; work easier — faster, freer,
            and a little more fun. <strong className="text-white">VibeGrid</strong> is my love letter
            to everyone who codes.
          </p>

          {/* CTA buttons */}
          <div className="fb-hidden fb-in-rise mt-10 flex flex-wrap items-center justify-center gap-3"
               style={{ '--fb-delay': '0.2s' } as React.CSSProperties}>
            <a href="https://github.com/abuzarkhan1" target="_blank" rel="noreferrer"
              className="group flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-[14px] font-medium text-white transition-all hover:bg-forest-bright hover:shadow-[0_0_28px_rgba(84,169,103,0.55)]">
              <Github size={16} />
              Follow on GitHub
            </a>
            <a href="/#download"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[14px] text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white">
              Try VibeGrid
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ MAIN CONTENT ═══════════════════════════ */}
      <div className="relative z-10 bg-black">

        {/* ── Mission ── */}
        <section className="relative scroll-mt-24 bg-black px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="fb-hidden fb-in-rise mb-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50 uppercase tracking-widest">
                The Why
              </div>
              <h2 className="lp-feature-heading text-white">
                Built for one simple reason — to make{' '}
                <span className="text-forest-bright lp-text-glow-green">developers&apos; work easier</span>
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-white/50">
                VibeGrid started as a frustration. Terminal tools were either slow, expensive, or locked
                into walled gardens that decided which AI agents you were allowed to run. I wanted a
                workspace that was <span className="text-white/80">fast, free, local-first, and
                completely agnostic</span> — one grid where any developer can orchestrate any agent, without
                permission and without lock-in. That&apos;s the whole idea. No grand plan, no hidden agenda.
                Just: make the daily work of developers easier.
              </p>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map((s, i) => (
                <div key={s.label}
                     className="fb-hidden fb-in-fall group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-6 transition-all duration-500 hover:border-forest/30 hover:bg-forest/[0.04]"
                     style={{ '--fb-index': i, '--fb-step': '60ms' } as React.CSSProperties}>
                  <div className="shine-layer" aria-hidden="true" />
                  <div className="lp-serif text-[34px] leading-none text-forest-bright">{s.value}</div>
                  <div className="mt-2 text-[11.5px] text-white/40">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Story + Terminal ── */}
        <section className="relative scroll-mt-24 bg-black px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
              <div className="fb-hidden fb-in-rise">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50 uppercase tracking-widest">
                  The Story
                </div>
                <h2 className="lp-feature-heading text-white">
                  One developer, <span className="text-forest-bright">one mission</span>
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/50">
                  I&apos;m Abuzar Khan — a solo developer who believes the best software is the kind you
                  can hold in your hands, inspect line by line, and improve together. VibeGrid is built
                  the way I like to work: <span className="text-white/80">open source, MIT licensed, and
                  free forever</span>.
                </p>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/50">
                  Every pane, every keybinding, every theme in this app exists for the same reason the
                  project exists: to shave friction off a developer&apos;s day so they can focus on what
                  actually matters — building.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['Open source', 'MIT licensed', 'No telemetry', 'No accounts'].map((t) => (
                    <span key={t} className="rounded-full border border-forest/30 bg-forest/10 px-2.5 py-1 text-[11px] text-forest-light">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Terminal mock */}
              <div className="fb-hidden fb-in-right" style={{ '--fb-delay': '0.08s' } as React.CSSProperties}>
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0b0d] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
                  <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-3">
                    <span className="h-3 w-3 rounded-full bg-red-500/70" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                    <span className="h-3 w-3 rounded-full bg-forest/70" />
                    <span className="ml-3 text-[11px] text-white/30">abuzar — zsh</span>
                  </div>
                  <div className="space-y-1.5 p-5 font-mono text-[13px] leading-relaxed">
                    <div className="text-forest-bright/60">~/projects/vibegrid</div>
                    <div><span className="text-white/40">$</span> <span className="text-white/70">whoami</span></div>
                    <div className="text-white/45">abuzar khan</div>
                    <div><span className="text-white/40">$</span> <span className="text-white/70">echo $MISSION</span></div>
                    <div className="text-forest-bright">make developers&apos; work easier</div>
                    <div><span className="text-white/40">$</span> <span className="text-white/70">./vibegrid --philosophy</span></div>
                    <div className="text-white/45">free · local-first · agent-agnostic</div>
                    <div className="flex items-center gap-1.5 pt-1.5 text-forest-bright/80">
                      <span className="animate-thinking-dot h-1 w-1 rounded-full bg-forest-bright" />
                      <span className="animate-thinking-dot h-1 w-1 rounded-full bg-forest-bright" style={{ animationDelay: '0.2s' }} />
                      <span className="animate-thinking-dot h-1 w-1 rounded-full bg-forest-bright" style={{ animationDelay: '0.4s' }} />
                      <span className="ml-1 text-[10px] text-forest-bright/60">shipping open source…</span>
                    </div>
                    <div className="pt-1"><span className="text-white/40">$</span> <span className="animate-terminal-cursor text-forest-bright">▌</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="relative scroll-mt-24 bg-black px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="fb-hidden fb-in-rise mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50 uppercase tracking-widest">
                What I believe
              </div>
              <h2 className="lp-feature-heading text-white">
                The principles behind <span className="animate-glow-pulse text-forest-bright lp-text-glow-green">every line</span>
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map((v, i) => (
                <div key={i}
                     className="fb-hidden fb-in-pop group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all duration-500 hover:border-forest/30 hover:bg-forest/[0.04]"
                     style={{ '--fb-index': i, '--fb-step': '70ms', '--fb-delay': '0.05s' } as React.CSSProperties}>
                  <div className="shine-layer" aria-hidden="true" />
                  <div className="mb-4 flex items-center h-8">{v.icon}</div>
                  <h3 className="mb-2 text-[15px] font-medium text-white/90">{v.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-white/45">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stack ── */}
        <section className="relative scroll-mt-24 bg-black px-6 py-24 md:py-32">
          <div className="mx-auto max-w-4xl">
            <div className="fb-hidden fb-in-rise mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50 uppercase tracking-widest">
                The Stack
              </div>
              <h2 className="lp-feature-heading text-white">
                Built with <span className="text-forest-bright">tools I love</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] text-white/50">
                A modern desktop terminal deserves a modern foundation — Rust where it counts, React where it shines.
              </p>
            </div>

            <div className="fb-hidden fb-in-rise flex flex-wrap items-center justify-center gap-2.5">
              {STACK.map((s, i) => (
                <span key={s}
                  className="fb-hidden fb-in-fall rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 font-mono text-[12.5px] text-white/60 transition-all duration-300 hover:border-forest/40 hover:text-forest-bright"
                  style={{ '--fb-index': i, '--fb-step': '50ms' } as React.CSSProperties}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Connect ── */}
        <section className="relative bg-black px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl">
            <div className="fb-hidden fb-in-rise rounded-2xl border border-forest/20 bg-gradient-to-b from-forest/[0.06] to-transparent p-8 text-center sm:p-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-forest/30 bg-forest/10 px-3 py-1 text-[11px] text-forest-bright uppercase tracking-widest">
                Let&apos;s connect
              </div>
              <h2 className="lp-feature-heading text-white">
                Let&apos;s build something <span className="text-forest-bright lp-text-glow-green">together</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/50">
                VibeGrid is open to everyone — contributors, testers, and dreamers. Found a bug, want a
                feature, or just want to say hi? The door is open.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a href="https://github.com/abuzarkhan1/VibeGrid" target="_blank" rel="noreferrer"
                  className="install-box-glow flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-[14px] font-medium text-white transition-all hover:bg-forest-bright hover:shadow-[0_0_28px_rgba(84,169,103,0.55)]">
                  <Star size={16} className="fill-white" />
                  Star on GitHub
                </a>
                <a href="https://github.com/abuzarkhan1/VibeGrid/issues" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[14px] text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white">
                  <Sparkles size={15} />
                  Open an issue
                </a>
                <a href="/" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[14px] text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white">
                  <Globe size={15} />
                  Back to homepage
                </a>
              </div>
              <div className="mt-8 font-mono text-[12px] text-white/30">
                <span className="text-forest-bright">$</span> abuzarkhan1 — open source, always.
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
