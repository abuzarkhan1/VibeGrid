'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Cpu,
  ServerOff,
  EyeOff,
  HardDrive,
  Code2,
  Terminal,
  FileCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap,
  KeyRound,
  FileCode,
} from 'lucide-react';
import { HeroNavbar } from '../../components/HeroNavbar';
import { SiteFooter } from '../../components/SiteFooter';
import { AuroraBeamFX } from '../../components/AuroraBeamFX';

const GUARANTEES = [
  {
    num: '01',
    title: 'Zero Cloud Telemetry',
    subtitle: 'No analytics SDKs or remote tracking',
    desc: 'VibeGrid ships with zero telemetry libraries. Not a single byte of telemetry, error reporting, or usage heartbeat is sent to any remote server.',
    verification: 'strings VibeGrid | grep -E "telemetry|posthog|segment|mixpanel" → 0 matches',
    color: '#5683da',
  },
  {
    num: '02',
    title: 'Zero Account Requirement',
    subtitle: 'No sign-ups, logins, or cloud keys',
    desc: 'You never create an account to use VibeGrid. There is no auth gateway, email collection, or subscription license verification. Launch and code immediately.',
    verification: 'Air-gapped operation without internet connectivity',
    color: '#ff8964',
  },
  {
    num: '03',
    title: '100% Local-First Runtime',
    subtitle: 'Direct POSIX & Windows PTY subprocesses',
    desc: 'Every terminal pane is an isolated OS process spawned on your local machine. Keystrokes, terminal outputs, and files remain strictly in local GPU memory.',
    verification: 'lsof -i -P | grep -i vibegrid → 0 bound sockets',
    color: '#5683da',
  },
  {
    num: '04',
    title: 'Atomic On-Device Storage',
    subtitle: 'State stored only in ~/.vibegrid',
    desc: 'Layouts, agent profiles, and command shortcuts are saved solely as local JSON files on your hard drive. We have no remote databases or synchronization relays.',
    verification: 'cat ~/.vibegrid/config.json (plain local JSON)',
    color: '#ff8964',
  },
  {
    num: '05',
    title: 'Verifiable MIT Open Source',
    subtitle: 'Audit, fork, and compile yourself',
    desc: 'The entire desktop application is 100% open source under the MIT License. Anyone can inspect every Rust and TypeScript line, verify invariants, and build from source.',
    verification: 'github.com/abuzarkhan1/VibeGrid (Public Repository)',
    color: '#5683da',
  },
];

const INVARIANT_MATRIX = [
  {
    layer: 'Rust PTY Kernel',
    guarantee: 'Direct OS Process Isolation',
    detail: 'Terminal subprocesses (bash, zsh, powershell, agent CLIs) communicate with the UI via Tauri IPC channels with zero intermediate cloud relays.',
    status: 'ACTIVE',
  },
  {
    layer: 'WebGL 2.0 Renderer',
    guarantee: 'Zero Remote Frame Streaming',
    detail: 'All terminal text glyphs and quad-tree textures are blitted directly to your local GPU framebuffer at 60 FPS without WebRTC or canvas streaming.',
    status: 'ACTIVE',
  },
  {
    layer: 'MCP Stdio Bridge',
    guarantee: 'Process-Isolated Tool Execution',
    detail: 'Model Context Protocol tool servers run as local child processes communicating over stdio. Tool tokens and arguments are never broadcast over the network.',
    status: 'ACTIVE',
  },
  {
    layer: 'Local File System',
    guarantee: 'Zero Cloud Sync Storage',
    detail: 'All application state and settings are serialized to atomic JSON on your local filesystem with 0 remote database connections.',
    status: 'ACTIVE',
  },
];

export default function PrivacyGuaranteeContent() {
  const [activeVerifyStep, setActiveVerifyStep] = useState<number>(0);

  const VERIFY_STEPS = [
    {
      title: 'Step 1: Check Open Sockets',
      cmd: 'lsof -p $(pgrep -i vibegrid) -i',
      output: '# Zero network sockets listening or established\n# Process is completely air-gapped from cloud network',
      desc: 'Verify that the running VibeGrid desktop process has zero listening or established network connections.',
    },
    {
      title: 'Step 2: Scan Binary for Trackers',
      cmd: 'strings /Applications/VibeGrid.app/Contents/MacOS/VibeGrid | grep -iE "mixpanel|posthog|analytics"',
      output: '# 0 results found. Binary is 100% clean of tracking SDKs.',
      desc: 'Inspect the compiled binary for telemetry strings, analytics domain names, or tracking identifiers.',
    },
    {
      title: 'Step 3: Audit Local Storage',
      cmd: 'ls -la ~/.vibegrid',
      output: 'total 24\n-rw-r--r--  1 user  staff  1024 config.json\n-rw-r--r--  1 user  staff   512 layouts.json',
      desc: 'Verify that all workspace configurations remain strictly on your local filesystem in ~/.vibegrid.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090a0c] font-sans text-white overflow-x-hidden selection:bg-[#5683da] selection:text-white">
      {/* Top Navigation */}
      <HeroNavbar />

      {/* ═══════════════════════════ SECTION 1: HERO (DARK / AURORA) ═══════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center items-center pt-28 pb-16 sm:pt-32 sm:pb-20 overflow-hidden">
        <AuroraBeamFX />

        <div className="relative z-10 max-w-[1200px] w-full mx-auto px-6 sm:px-8 text-center flex flex-col items-center justify-center my-auto">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111111] border border-[#4a4b50] text-[12px] font-mono text-[#ff8964] mb-8">
            <Lock size={15} />
            <span>THE VIBEGRID COMMITMENT // 5 INVARIANTS</span>
          </div>

          {/* Headline */}
          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[1.05] text-white max-w-4xl mx-auto">
            Our 5 Immutable{' '}
            <span className="text-[#ff8964]">Privacy Guarantees.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 sm:mt-8 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-[#a9a9aa] leading-relaxed font-normal">
            Privacy is not a marketing promise or a togglable setting. In VibeGrid, privacy is an architectural invariant hardcoded into every line of our open-source Rust runtime.
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
              href="/privacy"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#111111] border border-[#4a4b50] text-white font-medium text-[15px] hover:border-[#a9a9aa] hover:bg-[#1b1c1e] transition-colors whitespace-nowrap"
            >
              <span>Read Full Privacy Policy</span>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ SECTION 2: LIGHT BENTO BAND (THE 5 GUARANTEES) ═══════════════════════════ */}
      <section className="relative bg-[#ffffff] text-[#090a0c] py-20 sm:py-28 border-y border-[#e5e5e7]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#ff8964] block mb-3">
              ARCHITECTURAL INVARIANTS
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl tracking-tight leading-[1.08] text-[#090a0c]">
              Five promises that <span className="text-[#5683da]">can never be broken.</span>
            </h2>
            <p className="mt-5 text-base sm:text-lg text-[#4a4b50] leading-relaxed">
              Because VibeGrid contains no telemetry code or cloud database infrastructure, we are physically incapable of collecting or selling your data.
            </p>
          </div>

          <div className="space-y-6">
            {GUARANTEES.map((g) => (
              <div
                key={g.num}
                className="p-8 rounded-[12px] bg-[#f6f6f6] border border-[#e5e5e7] hover:border-[#5683da] transition-all duration-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
              >
                <div className="md:col-span-1">
                  <div className="w-12 h-12 rounded-full bg-white border border-[#e5e5e7] flex items-center justify-center font-mono text-sm font-bold text-[#5683da] shadow-sm">
                    {g.num}
                  </div>
                </div>

                <div className="md:col-span-6 space-y-2">
                  <h3 className="font-display font-black text-2xl text-[#090a0c] tracking-tight">
                    {g.title}
                  </h3>
                  <p className="font-mono text-xs text-[#5683da] font-semibold">
                    {g.subtitle}
                  </p>
                  <p className="text-sm text-[#4a4b50] leading-relaxed">
                    {g.desc}
                  </p>
                </div>

                <div className="md:col-span-5 flex flex-col justify-between h-full bg-white p-4 rounded-[10px] border border-[#e5e5e7]">
                  <div className="font-mono text-[11px] text-[#6b6c6d] uppercase tracking-wider mb-2">
                    How to verify:
                  </div>
                  <code className="font-mono text-xs text-[#090a0c] bg-[#f6f6f6] px-2.5 py-1.5 rounded border border-[#e5e5e7] break-all">
                    {g.verification}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ SECTION 3: INVARIANT MATRIX (DARK) ═══════════════════════════ */}
      <section className="relative py-24 sm:py-32 bg-[#090a0c] border-b border-[#4a4b50]/40">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#5683da] block mb-3">
              KERNEL TO UI ISOLATION
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-[1.08]">
              Security &amp; Privacy <span className="text-[#5683da]">by Design.</span>
            </h2>
            <p className="mt-4 text-base text-[#a9a9aa] leading-relaxed">
              Every subsystem in VibeGrid is engineered with hard boundaries ensuring zero data leakage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {INVARIANT_MATRIX.map((inv, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-[12px] bg-[#111111] border border-[#4a4b50] hover:border-[#5683da] transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white px-3 py-1 rounded-full bg-[#090a0c] border border-[#4a4b50]">
                    {inv.layer}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#27c93f]">
                    <span className="w-2 h-2 rounded-full bg-[#27c93f] animate-pulse" />
                    {inv.status}
                  </span>
                </div>
                <h3 className="font-display font-black text-xl text-white tracking-tight">
                  {inv.guarantee}
                </h3>
                <p className="text-sm text-[#a9a9aa] leading-relaxed font-normal">
                  {inv.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ SECTION 4: INTERACTIVE VERIFICATION TOOLKIT (DARK) ═══════════════════════════ */}
      <section className="relative py-24 sm:py-36 bg-[#090a0c] border-b border-[#4a4b50]/40">
        <div className="max-w-[1000px] mx-auto px-6 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#ff8964] block mb-3">
              REPRODUCIBLE VERIFICATION
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-[1.08]">
              The Developer <span className="text-[#ff8964]">Audit Toolkit.</span>
            </h2>
            <p className="mt-4 text-base text-[#a9a9aa] leading-relaxed">
              Step-by-step commands to audit VibeGrid on your own machine.
            </p>
          </div>

          <div className="rounded-[12px] bg-[#111111] border border-[#4a4b50] overflow-hidden shadow-2xl">
            {/* Step Selector Tabs */}
            <div className="p-3 bg-[#0e0e10] border-b border-[#4a4b50] flex flex-wrap gap-2">
              {VERIFY_STEPS.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveVerifyStep(idx)}
                  className={`px-4 py-2 rounded-full text-xs font-mono transition-colors cursor-pointer ${
                    activeVerifyStep === idx
                      ? 'bg-[#5683da] text-white font-bold'
                      : 'bg-[#1b1c1e] text-[#a9a9aa] hover:text-white border border-[#4a4b50]'
                  }`}
                >
                  {step.title}
                </button>
              ))}
            </div>

            {/* Terminal Window */}
            <div className="p-6 sm:p-8 font-mono text-xs leading-relaxed space-y-4 bg-[#090a0c]">
              <p className="text-[#a9a9aa] text-sm">{VERIFY_STEPS[activeVerifyStep].desc}</p>
              <div className="p-4 rounded-lg bg-[#111111] border border-[#4a4b50] space-y-2">
                <div className="text-[#5683da] font-bold">$ {VERIFY_STEPS[activeVerifyStep].cmd}</div>
                <pre className="text-[#27c93f] whitespace-pre-wrap">{VERIFY_STEPS[activeVerifyStep].output}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ SECTION 5: CTA ═══════════════════════════ */}
      <section className="relative py-20 sm:py-28 bg-[#090a0c]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 text-center">
          <div className="p-8 sm:p-14 rounded-[12px] bg-[#111111] border border-[#4a4b50] space-y-6">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#5683da]">
              AUDIT-READY OPEN SOURCE
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-[1.08]">
              Ready for high-velocity, <br />
              <span className="text-[#5683da]">air-gapped vibe coding?</span>
            </h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-[#a9a9aa] leading-relaxed">
              Download VibeGrid free for macOS and experience the fastest, most private AI terminal workspace.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg"
                className="px-8 py-3.5 rounded-full bg-[#5683da] text-white font-semibold text-sm hover:bg-[#456ec2] transition-colors"
              >
                Download for macOS
              </a>
              <a
                href="https://github.com/abuzarkhan1/VibeGrid"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-white font-medium text-sm hover:border-[#a9a9aa] transition-colors inline-flex items-center gap-2"
              >
                <Code2 size={16} />
                <span>Inspect Source Code</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter active="about" />
    </div>
  );
}
