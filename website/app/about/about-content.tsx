'use client';

import React, { useState } from 'react';
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
  Terminal,
  Layers,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Code2,
} from 'lucide-react';
import { HeroNavbar } from '../../components/HeroNavbar';
import { SiteFooter } from '../../components/SiteFooter';
import { AuroraBeamFX } from '../../components/AuroraBeamFX';

/* ─── Timeline Principles Data ─── */
interface PrincipleItem {
  num: string;
  tag: string;
  titlePrefix: string;
  titleAccent: string;
  desc: string;
  badge: string;
  accentColor: string;
  icon: React.ReactNode;
}

const PRINCIPLE_ITEMS: PrincipleItem[] = [
  {
    num: '01',
    tag: 'Open Source',
    titlePrefix: 'Free ',
    titleAccent: 'Forever',
    desc: 'No subscriptions, no paid feature gates, and no enterprise tiers. VibeGrid is MIT licensed and open source — free for every developer, everywhere, forever.',
    badge: 'MIT License',
    accentColor: '#5683da',
    icon: <HeartHandshake size={20} className="text-[#5683da]" />,
  },
  {
    num: '02',
    tag: 'Agent Agnostic',
    titlePrefix: 'Zero Walled ',
    titleAccent: 'Gardens',
    desc: 'Run Claude Code, Codex, Antigravity, Grok, Aider, Ollama, or custom scripts side by side. VibeGrid never restricts which AI agents or models you can orchestrate.',
    badge: 'Universal Mesh',
    accentColor: '#ff8964',
    icon: <Rocket size={20} className="text-[#ff8964]" />,
  },
  {
    num: '03',
    tag: 'Security & Privacy',
    titlePrefix: 'Private by ',
    titleAccent: 'Architecture',
    desc: 'Zero telemetry, zero remote analytics, and zero cloud accounts. A 100% air-gapped local desktop process — your terminal buffers and files never leave your machine.',
    badge: '100% Local-First',
    accentColor: '#5683da',
    icon: <Lock size={20} className="text-[#5683da]" />,
  },
  {
    num: '04',
    tag: 'Rust Hardware Speed',
    titlePrefix: 'Engineered for ',
    titleAccent: 'Raw Velocity',
    desc: '60 FPS GPU-accelerated rendering paired with a low-overhead Rust PTY backend. Sub-10ms keystroke latency so your tools never interrupt your flow state.',
    badge: 'Rust PTY Engine',
    accentColor: '#ff8964',
    icon: <Cpu size={20} className="text-[#ff8964]" />,
  },
];

const STACK_ITEMS = [
  { name: 'Tauri 2.0', role: 'Native Rust Core & IPC', color: '#ff8964' },
  { name: 'Rust & Tokio', role: 'Direct POSIX/Windows PTY', color: '#ff8964' },
  { name: 'React 18 & TypeScript', role: 'Reactive Terminal Studio UI', color: '#5683da' },
  { name: 'WebGL 2.0 Canvas', role: '60 FPS GPU Rendering', color: '#5683da' },
  { name: 'xterm.js Engine', role: 'High-Throughput ANSI Parser', color: '#5683da' },
  { name: 'Zustand 5', role: 'Atomic Grid State Manager', color: '#5683da' },
  { name: 'Tailwind CSS', role: 'Design System & Utility Layer', color: '#5683da' },
  { name: 'Framer Motion', role: 'Physics-Based UI Animations', color: '#ff8964' },
];

const STATS = [
  { value: '1', label: 'Solo Developer', desc: 'Crafted with obsessive care' },
  { value: '$0', label: 'Cost to Use', desc: 'Free & MIT licensed forever' },
  { value: '16', label: 'Concurrent Panes', desc: 'Multi-agent orchestration' },
  { value: '0ms', label: 'Cloud Telemetry', desc: '100% local on-device runtime' },
];

export default function AboutContent() {
  const [activeTerminalTab, setActiveTerminalTab] = useState<'philosophy' | 'stack' | 'manifesto'>('philosophy');

  return (
    <div className="min-h-screen bg-[#090a0c] font-sans text-white overflow-x-hidden selection:bg-[#5683da] selection:text-white">
      {/* Top Site-Wide Navigation */}
      <HeroNavbar />

      {/* ═══════════════════════════ SECTION 1: HERO (DARK / AURORA) ═══════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center items-center pt-28 pb-16 sm:pt-32 sm:pb-20 overflow-hidden">
        <AuroraBeamFX />

        <div className="relative z-10 max-w-[1200px] w-full mx-auto px-6 sm:px-8 text-center flex flex-col items-center justify-center my-auto">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111111] border border-[#4a4b50] text-[12px] font-mono text-[#a9a9aa] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5683da] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5683da]" />
            </span>
            <span>SOLO CREATOR & OPEN SOURCE</span>
          </div>

          {/* Giant Display Headline */}
          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[1.05] text-white max-w-4xl mx-auto">
            Hi, I&apos;m{' '}
            <span className="text-[#5683da]">Abuzar</span>{' '}
            <span className="text-[#ff8964]">Khan</span>.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 sm:mt-8 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-[#a9a9aa] leading-relaxed font-normal">
            I build open-source developer tools that eliminate friction — making multi-agent coding{' '}
            <strong className="text-white font-semibold">faster, local-first, and completely free</strong>.
            VibeGrid is my craft for the developer community.
          </p>

          {/* Pill CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg mx-auto">
            <a
              href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#5683da] text-white font-semibold text-[15px] hover:bg-[#456ec2] transition-colors active:scale-[0.98] cursor-pointer shadow-sm whitespace-nowrap"
            >
              <span>Download for macOS</span>
              <ArrowRight size={16} />
            </a>
            <a
              href="https://github.com/abuzarkhan1"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#111111] border border-[#4a4b50] text-white font-medium text-[15px] hover:border-[#a9a9aa] hover:bg-[#1b1c1e] transition-colors whitespace-nowrap"
            >
              <Github size={17} />
              <span>Follow on GitHub</span>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ SECTION 2: LIGHT BENTO BAND (THE WHY) ═══════════════════════════ */}
      <section className="relative bg-[#ffffff] text-[#090a0c] py-20 sm:py-28 border-y border-[#e5e5e7]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#5683da] block mb-3">
              THE MISSION & THE WHY
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl tracking-tight leading-[1.08] text-[#090a0c]">
              Built for one reason — to make{' '}
              <span className="text-[#5683da]">developers&apos; work easier.</span>
            </h2>
            <p className="mt-5 text-base sm:text-lg text-[#4a4b50] leading-relaxed">
              Modern AI coding tools became fragmented into locked ecosystems, cloud telemetry, and sluggish web wrappers.
              I built VibeGrid as the antidote: a high-performance local terminal grid where you own the runtime.
            </p>
          </div>

          {/* 4 Asymmetrical Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat, idx) => (
              <div
                key={idx}
                className="p-8 rounded-[12px] bg-[#f6f6f6] border border-[#e5e5e7] hover:border-[#5683da] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="font-display font-black text-4xl sm:text-5xl text-[#090a0c] tracking-tight mb-2">
                    {stat.value}
                  </div>
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#5683da] mb-2">
                    {stat.label}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#6b6c6d] font-normal leading-relaxed">
                  {stat.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Deep Focus Callout Card */}
          <div className="mt-8 p-8 sm:p-10 rounded-[12px] bg-[#090a0c] text-white border border-[#303236] flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#4a4b50] text-xs font-mono text-[#5683da]">
                <ShieldCheck size={14} />
                <span>100% AIR-GAPPED BY DESIGN</span>
              </div>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                No Cloud Accounts. No Telemetry. No Paywalls.
              </h3>
              <p className="text-sm sm:text-base text-[#a9a9aa] leading-relaxed">
                Everything runs locally on your machine via direct Tauri Rust PTY subprocesses. Your keystrokes, environment variables, and proprietary code never touch a 3rd-party server.
              </p>
            </div>
            <a
              href="/privacy-guarantee"
              className="px-6 py-3 rounded-full bg-[#5683da] text-white font-semibold text-sm hover:bg-[#456ec2] transition-colors whitespace-nowrap"
            >
              Read Privacy Guarantee →
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ SECTION 3: THE STORY & TERMINAL HUD (DARK) ═══════════════════════════ */}
      <section className="relative py-24 sm:py-32 bg-[#090a0c] border-b border-[#4a4b50]/40">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Story Column */}
            <div className="lg:col-span-6 space-y-6">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#ff8964] block">
                THE STORY
              </span>
              <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-[1.08]">
                One developer, <span className="text-[#ff8964]">one mission.</span>
              </h2>
              <p className="text-base sm:text-lg text-[#a9a9aa] leading-relaxed font-normal">
                I&apos;m Abuzar Khan — a solo engineer building software you can inspect, verify, and modify freely.
                VibeGrid was born from personal frustration with heavy terminal emulators and walled-garden agent hubs.
              </p>
              <p className="text-base sm:text-lg text-[#a9a9aa] leading-relaxed font-normal">
                Every split layout, keybinding, and GPU shader was engineered to give developers an ultra-responsive, zero-latency cockpit for multi-agent vibe coding.
              </p>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-2 pt-2">
                {['Open Source (MIT)', 'Zero Telemetry', 'Agent Agnostic', 'Rust PTY Engine', 'Offline Ready'].map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full bg-[#111111] border border-[#4a4b50] font-mono text-xs text-[#d1d1d1]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Interactive Terminal Mockup */}
            <div className="lg:col-span-6">
              <div className="rounded-[12px] bg-[#111111] border border-[#4a4b50] overflow-hidden shadow-2xl">
                {/* Window Titlebar */}
                <div className="px-4 py-3 bg-[#0e0e10] border-b border-[#4a4b50] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    <span className="ml-3 font-mono text-xs text-[#95979e]">abuzar@vibegrid-core</span>
                  </div>

                  {/* Interactive Terminal Tabs */}
                  <div className="flex items-center gap-1">
                    {(['philosophy', 'stack', 'manifesto'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTerminalTab(tab)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                          activeTerminalTab === tab
                            ? 'bg-[#303236] text-white border border-[#4a4b50]'
                            : 'text-[#6b6c6d] hover:text-[#a9a9aa]'
                        }`}
                      >
                        {tab}.sh
                      </button>
                    ))}
                  </div>
                </div>

                {/* Terminal Body */}
                <div className="p-6 font-mono text-xs leading-relaxed space-y-3 bg-[#090a0c] min-h-[300px]">
                  <div className="text-[#6b6c6d]">~/vibegrid/creator-manifesto (main)</div>

                  {activeTerminalTab === 'philosophy' && (
                    <>
                      <div>
                        <span className="text-[#5683da] font-bold">$</span>{' '}
                        <span className="text-white">cat philosophy.md</span>
                      </div>
                      <div className="text-[#a9a9aa] pl-3 border-l border-[#5683da]/40 space-y-1">
                        <p className="text-white font-semibold"># The VibeGrid Philosophy</p>
                        <p>1. Tools should feel instantaneous — sub-10ms response.</p>
                        <p>2. No developer should be forced into a single AI model.</p>
                        <p>3. Privacy is not a feature; it is an architectural invariant.</p>
                        <p>4. 100% Free and open source under MIT.</p>
                      </div>
                      <div className="pt-2">
                        <span className="text-[#5683da] font-bold">$</span>{' '}
                        <span className="text-[#27c93f]">echo $STATUS</span> → &quot;shipping free open source tools&quot;
                      </div>
                    </>
                  )}

                  {activeTerminalTab === 'stack' && (
                    <>
                      <div>
                        <span className="text-[#5683da] font-bold">$</span>{' '}
                        <span className="text-white">cargo check --release</span>
                      </div>
                      <div className="text-[#a9a9aa] space-y-1">
                        <p className="text-[#27c93f]">✔ Compiling vibegrid-pty-engine v0.1.0 (Rust 2021)</p>
                        <p className="text-[#27c93f]">✔ Compiling vibegrid-mcp-bridge v0.1.0</p>
                        <p className="text-white font-semibold">Finished release [optimized] in 1.42s</p>
                        <p className="text-[#6b6c6d]">PTY Latency: 0.8ms · Memory footprint: 18.4MB</p>
                      </div>
                    </>
                  )}

                  {activeTerminalTab === 'manifesto' && (
                    <>
                      <div>
                        <span className="text-[#5683da] font-bold">$</span>{' '}
                        <span className="text-white">./vibegrid --manifesto</span>
                      </div>
                      <div className="text-[#a9a9aa] space-y-1">
                        <p className="text-white font-bold">&quot;Vibe Coding is human intent at the speed of thought.&quot;</p>
                        <p className="text-[#a9a9aa]">Orchestrate Claude Code, Codex, Antigravity &amp; Ollama in one synchronized matrix.</p>
                        <p className="text-[#ff8964] font-semibold">Author: Abuzar Khan (@abuzarkhan1)</p>
                      </div>
                    </>
                  )}

                  {/* Blinking Cursor */}
                  <div className="pt-3 flex items-center gap-1.5 text-[#5683da]">
                    <span>$</span>
                    <span className="animate-pulse inline-block w-2 h-4 bg-[#5683da]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ SECTION 4: 4 CORE PRINCIPLES (VERTICAL TIMELINE) ═══════════════════════════ */}
      <section className="relative py-24 sm:py-36 bg-[#090a0c] border-b border-[#4a4b50]/40">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          {/* Section Header */}
          <div className="max-w-3xl mb-20">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#5683da] block mb-3">
              WHAT I BELIEVE
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.08]">
              The principles behind <br />
              <span className="text-[#5683da]">every line of code.</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#a9a9aa] leading-relaxed">
              Four core commitments guiding VibeGrid&apos;s architecture, roadmap, and philosophy.
            </p>
          </div>

          {/* 4 Principles List */}
          <div className="space-y-12 sm:space-y-16">
            {PRINCIPLE_ITEMS.map((item) => (
              <article
                key={item.num}
                className="group relative p-6 sm:p-8 rounded-[12px] bg-[#111111] border border-[#4a4b50] hover:border-[#5683da] transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
              >
                {/* Number Badge */}
                <div className="md:col-span-2 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#090a0c] border border-[#4a4b50] group-hover:border-[#5683da] flex items-center justify-center transition-colors">
                    <span className="font-mono text-sm font-bold text-[#5683da]">{item.num}</span>
                  </div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#6b6c6d] md:hidden">
                    {item.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="md:col-span-7 space-y-3">
                  <div className="hidden md:flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#6b6c6d]">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                    {item.titlePrefix}
                    <span className="text-[#5683da]">{item.titleAccent}</span>
                  </h3>
                  <p className="text-sm sm:text-base text-[#a9a9aa] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

                {/* Pill Badge */}
                <div className="md:col-span-3 flex md:justify-end items-center">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#090a0c] border border-[#4a4b50] font-mono text-xs text-[#ffffff]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5683da]" />
                    {item.badge}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ SECTION 5: TECH STACK ARCHITECTURE ═══════════════════════════ */}
      <section className="relative py-20 sm:py-28 bg-[#090a0c] border-b border-[#4a4b50]/40">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#ff8964] block mb-3">
            THE ARCHITECTURE
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-[1.08] mb-6">
            Built with modern, <span className="text-[#ff8964]">battle-tested tools.</span>
          </h2>
          <p className="max-w-2xl mx-auto text-base text-[#a9a9aa] leading-relaxed mb-12">
            A high-performance desktop terminal demands a rock-solid foundation — Rust for kernel speed, React &amp; TypeScript for UI fluidity.
          </p>

          {/* Stack Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STACK_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-[12px] bg-[#111111] border border-[#4a4b50] hover:border-[#6b6c6d] transition-all text-left flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-white">{item.name}</span>
                  <Code2 size={16} className="text-[#5683da]" />
                </div>
                <span className="text-xs text-[#a9a9aa] font-mono">{item.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ SECTION 6: COMMUNITY & CONNECT CTA ═══════════════════════════ */}
      <section className="relative py-20 sm:py-28 bg-[#090a0c]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 text-center">
          <div className="p-8 sm:p-14 rounded-[12px] bg-[#111111] border border-[#4a4b50] space-y-6">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#5683da]">
              COMMUNITY &amp; OPEN SOURCE
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-[1.08]">
              Let&apos;s build the future of <br />
              <span className="text-[#5683da]">vibe coding together.</span>
            </h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-[#a9a9aa] leading-relaxed">
              VibeGrid is open to all developers, contributors, and builders. Star the repository, report an issue, or contribute a pull request.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href="https://github.com/abuzarkhan1/VibeGrid"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-full bg-[#5683da] text-white font-semibold text-sm hover:bg-[#456ec2] transition-colors inline-flex items-center gap-2"
              >
                <Star size={16} />
                <span>Star on GitHub</span>
              </a>
              <a
                href="https://github.com/abuzarkhan1/VibeGrid/issues"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-full bg-[#090a0c] border border-[#4a4b50] text-white font-medium text-sm hover:border-[#a9a9aa] transition-colors inline-flex items-center gap-2"
              >
                <Sparkles size={16} />
                <span>Open an Issue</span>
              </a>
              <a
                href="/"
                className="px-6 py-3 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[#a9a9aa] hover:text-white font-medium text-sm hover:border-[#a9a9aa] transition-colors inline-flex items-center gap-2"
              >
                <Globe size={16} />
                <span>Back to Homepage</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ FOOTER ═══════════════════════════ */}
      <SiteFooter active="about" />
    </div>
  );
}
