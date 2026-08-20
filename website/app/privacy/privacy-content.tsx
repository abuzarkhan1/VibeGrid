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
} from 'lucide-react';
import { HeroNavbar } from '../../components/HeroNavbar';
import { SiteFooter } from '../../components/SiteFooter';
import { AuroraBeamFX } from '../../components/AuroraBeamFX';

const PRIVACY_PILLARS = [
  {
    icon: <ServerOff size={24} className="text-[#5683da]" />,
    title: 'Zero Remote Telemetry',
    subtitle: 'No analytics SDKs, trackers, or cookies',
    desc: 'VibeGrid contains zero telemetry libraries. No Google Analytics, PostHog, Mixpanel, Sentry, or custom tracking daemons. We do not know who you are, when you launch the app, or what you build.',
    badge: '0 KB Egress',
  },
  {
    icon: <Lock size={24} className="text-[#ff8964]" />,
    title: 'Local POSIX/Windows PTY',
    subtitle: 'Direct OS kernel subprocess execution',
    desc: 'Every terminal pane runs as a native OS process directly on your machine through Rust Tokio PTY bindings. Terminal stdout, stderr, and keystrokes are rendered in local WebGL memory only.',
    badge: '100% Local PTY',
  },
  {
    icon: <HardDrive size={24} className="text-[#5683da]" />,
    title: 'Atomic Local Storage',
    subtitle: 'Everything stays in ~/.vibegrid',
    desc: 'Your layouts, agent configurations, workspace histories, and environment variables are saved solely as local JSON files on your hard drive. There is no cloud database or syncing server.',
    badge: 'On-Device Only',
  },
  {
    icon: <Code2 size={24} className="text-[#ff8964]" />,
    title: 'Verifiable MIT Open Source',
    subtitle: 'Inspect every line of code on GitHub',
    desc: 'The entire desktop application and website source code is publicly accessible under the MIT license. Anyone can inspect network calls, build from source, and verify our privacy invariants.',
    badge: 'Audit-Ready',
  },
];

const POLICY_SECTIONS = [
  {
    id: 'data-collection',
    num: '01',
    title: 'Information We Never Collect',
    content: [
      'Personal Identification: We do not collect names, email addresses, IP addresses, physical locations, or payment details.',
      'Telemetry & Usage Metrics: We do not track session duration, feature engagement, pane counts, error logs, or hardware specs.',
      'Source Code & Files: Your code, workspace directories, git repositories, and file buffers are never read or transmitted by VibeGrid.',
      'AI Prompts & Responses: Prompts sent to your CLI agents (Claude, Codex, Ollama, etc.) pass directly from your terminal to those CLI binaries. VibeGrid does not intercept, log, or store prompt tokens.',
    ],
  },
  {
    id: 'local-storage',
    num: '02',
    title: 'Local Workspace Storage & State',
    content: [
      'Configuration Files: All workspace layouts, theme preferences, and keybinding shortcuts are saved locally in ~/.vibegrid/config.json.',
      'Terminal Scrollback: Terminal history resides in volatile memory (RAM) while the window is open and is blitted to GPU textures for rendering.',
      'Environment Variables: Any API keys or environment variables passed to terminal panes are piped directly to your local shell and never stored in plain text by VibeGrid telemetry.',
    ],
  },
  {
    id: 'third-party-agents',
    num: '03',
    title: 'Third-Party AI Agents & Providers',
    content: [
      'Direct Process Execution: When you launch an agent like Claude Code, Codex, Ollama, Aider, or DeepSeek, VibeGrid executes their respective CLI binaries directly on your machine.',
      'Provider Communications: If an agent connects to an external model endpoint (e.g. Anthropic API, OpenAI API), that network traffic is managed directly by that agent CLI, not VibeGrid.',
      'Air-Gapped Offline Mode: If you use local models via Ollama, LM Studio, or llama.cpp, your entire workflow operates 100% offline with zero internet access required.',
    ],
  },
  {
    id: 'open-source-audit',
    num: '04',
    title: 'Independent Verification & Audits',
    content: [
      'Inspect Network Traffic: You can verify zero egress using tools like Wireshark, Little Snitch, Proxyman, or by running `lsof -i` in your terminal.',
      'Build from Source: The complete codebase is open source. You can compile the Tauri application yourself using `cargo tauri build` to guarantee zero modified dependencies.',
      'MIT License: You have full legal freedom to audit, fork, modify, and redistribute the application without restrictions.',
    ],
  },
];

export default function PrivacyContent() {
  const [activeAuditTab, setActiveAuditTab] = useState<'lsof' | 'netstat' | 'storage'>('lsof');

  return (
    <div className="min-h-screen bg-[#090a0c] font-sans text-white overflow-x-hidden selection:bg-[#5683da] selection:text-white">
      {/* Top Navigation */}
      <HeroNavbar />

      {/* ═══════════════════════════ SECTION 1: HERO (DARK / AURORA) ═══════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center items-center pt-28 pb-16 sm:pt-32 sm:pb-20 overflow-hidden">
        <AuroraBeamFX />

        <div className="relative z-10 max-w-[1200px] w-full mx-auto px-6 sm:px-8 text-center flex flex-col items-center justify-center my-auto">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111111] border border-[#4a4b50] text-[12px] font-mono text-[#5683da] mb-8">
            <ShieldCheck size={15} />
            <span>100% AIR-GAPPED // ZERO CLOUD EGRESS</span>
          </div>

          {/* Headline */}
          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[1.05] text-white max-w-4xl mx-auto">
            Privacy by Architecture.{' '}
            <span className="text-[#5683da]">Zero Telemetry.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 sm:mt-8 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-[#a9a9aa] leading-relaxed font-normal">
            Your source code, terminal history, and AI prompts belong to you.
            VibeGrid is engineered from the kernel up with zero tracking, zero accounts, and zero cloud servers.
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
              href="/privacy-guarantee"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#111111] border border-[#4a4b50] text-white font-medium text-[15px] hover:border-[#a9a9aa] hover:bg-[#1b1c1e] transition-colors whitespace-nowrap"
            >
              <span>Read 5 Privacy Guarantees</span>
            </a>
          </div>

          {/* 4 Quick Stat Pills */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl mx-auto">
            {[
              { label: 'Cloud Telemetry', val: '0 KB' },
              { label: 'Tracking Cookies', val: '0' },
              { label: 'Remote Servers', val: '0' },
              { label: 'Open Source', val: '100% MIT' },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-3.5 rounded-full bg-[#111111] border border-[#4a4b50] text-center"
              >
                <div className="font-mono text-base sm:text-lg font-bold text-white">{stat.val}</div>
                <div className="font-mono text-[10px] text-[#a9a9aa] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ SECTION 2: LIGHT BENTO BAND (4 PILLARS) ═══════════════════════════ */}
      <section className="relative bg-[#ffffff] text-[#090a0c] py-20 sm:py-28 border-y border-[#e5e5e7]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#5683da] block mb-3">
              FOUR CORE PILLARS
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl tracking-tight leading-[1.08] text-[#090a0c]">
              How we guarantee <span className="text-[#5683da]">absolute privacy.</span>
            </h2>
            <p className="mt-5 text-base sm:text-lg text-[#4a4b50] leading-relaxed">
              We do not treat privacy as a legal disclaimer. It is hardcoded into the binary architecture of our Rust backend and WebGL renderer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRIVACY_PILLARS.map((pillar, idx) => (
              <div
                key={idx}
                className="p-8 rounded-[12px] bg-[#f6f6f6] border border-[#e5e5e7] hover:border-[#5683da] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-white border border-[#e5e5e7] shadow-sm">
                      {pillar.icon}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white border border-[#e5e5e7] font-mono text-xs font-semibold text-[#5683da]">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="font-display font-black text-2xl text-[#090a0c] tracking-tight mb-1">
                    {pillar.title}
                  </h3>
                  <p className="font-mono text-xs text-[#6b6c6d] mb-4">
                    {pillar.subtitle}
                  </p>
                  <p className="text-sm text-[#4a4b50] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ SECTION 3: NETWORK AUDIT TERMINAL (DARK) ═══════════════════════════ */}
      <section className="relative py-24 sm:py-32 bg-[#090a0c] border-b border-[#4a4b50]/40">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#ff8964] block">
                INDEPENDENT AUDIT
              </span>
              <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-[1.08]">
                Verify it yourself in <span className="text-[#ff8964]">seconds.</span>
              </h2>
              <p className="text-base text-[#a9a9aa] leading-relaxed font-normal">
                Don&apos;t take our word for it. Inspect open socket descriptors, process network bindings, and local filesystem writes using standard OS utilities.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-white">
                  <CheckCircle2 size={18} className="text-[#27c93f] shrink-0" />
                  <span>Zero background telemetry daemons</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white">
                  <CheckCircle2 size={18} className="text-[#27c93f] shrink-0" />
                  <span>Zero outbound HTTP analytics requests</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white">
                  <CheckCircle2 size={18} className="text-[#27c93f] shrink-0" />
                  <span>Zero cloud authentication dependencies</span>
                </div>
              </div>
            </div>

            {/* Terminal HUD */}
            <div className="lg:col-span-7">
              <div className="rounded-[12px] bg-[#111111] border border-[#4a4b50] overflow-hidden shadow-2xl">
                <div className="px-4 py-3 bg-[#0e0e10] border-b border-[#4a4b50] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    <span className="ml-3 font-mono text-xs text-[#95979e]">network-audit.sh</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {(['lsof', 'netstat', 'storage'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveAuditTab(tab)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                          activeAuditTab === tab
                            ? 'bg-[#303236] text-white border border-[#4a4b50]'
                            : 'text-[#6b6c6d] hover:text-[#a9a9aa]'
                        }`}
                      >
                        {tab === 'lsof' ? 'lsof -i' : tab === 'netstat' ? 'netstat' : 'fs-audit'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 font-mono text-xs leading-relaxed space-y-3 bg-[#090a0c] min-h-[280px]">
                  {activeAuditTab === 'lsof' && (
                    <>
                      <div>
                        <span className="text-[#5683da] font-bold">$</span>{' '}
                        <span className="text-white">lsof -i -P | grep -i &quot;vibegrid&quot;</span>
                      </div>
                      <div className="text-[#a9a9aa] space-y-1 pl-3 border-l border-[#5683da]/40">
                        <p className="text-[#27c93f]"># Output: ZERO active internet sockets detected</p>
                        <p className="text-[#6b6c6d]">vibegrid-core (PID 48102): 0 TCP listeners, 0 UDP sockets</p>
                        <p className="text-[#6b6c6d]">IPC Protocol: Local unix domain socket (~/Library/Caches/vibegrid.ipc)</p>
                      </div>
                      <div className="text-white font-semibold pt-2">
                        ✔ Status: 100% Air-Gapped &amp; Isolated
                      </div>
                    </>
                  )}

                  {activeAuditTab === 'netstat' && (
                    <>
                      <div>
                        <span className="text-[#5683da] font-bold">$</span>{' '}
                        <span className="text-white">netstat -an | grep ESTABLISHED | grep -i vibegrid</span>
                      </div>
                      <div className="text-[#a9a9aa] space-y-1 pl-3 border-l border-[#ff8964]/40">
                        <p className="text-[#27c93f]"># Output: ZERO remote connections established</p>
                        <p className="text-[#6b6c6d]">Outbound Bytes Sent: 0 B</p>
                        <p className="text-[#6b6c6d]">Inbound Bytes Received: 0 B</p>
                      </div>
                    </>
                  )}

                  {activeAuditTab === 'storage' && (
                    <>
                      <div>
                        <span className="text-[#5683da] font-bold">$</span>{' '}
                        <span className="text-white">ls -la ~/.vibegrid/</span>
                      </div>
                      <div className="text-[#a9a9aa] space-y-1">
                        <p>-rw-r--r--  1 abuzar  staff   1.2K config.json</p>
                        <p>-rw-r--r--  1 abuzar  staff    840 layouts.json</p>
                        <p>-rw-r--r--  1 abuzar  staff    420 keybindings.json</p>
                        <p className="text-[#27c93f] pt-1">✔ Pure local file storage. Zero cloud sync.</p>
                      </div>
                    </>
                  )}

                  <div className="pt-2 flex items-center gap-1.5 text-[#5683da]">
                    <span>$</span>
                    <span className="animate-pulse inline-block w-2 h-4 bg-[#5683da]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ SECTION 4: FORMAL POLICY BREAKDOWN (DARK) ═══════════════════════════ */}
      <section className="relative py-24 sm:py-36 bg-[#090a0c] border-b border-[#4a4b50]/40">
        <div className="max-w-[1000px] mx-auto px-6 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#5683da] block mb-3">
              FORMAL POLICY
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-[1.08]">
              Transparent. Direct.{' '}
              <span className="text-[#5683da]">No legalese.</span>
            </h2>
            <p className="mt-4 text-base text-[#a9a9aa]">
              Last updated: August 2026 · Effective for all VibeGrid desktop releases.
            </p>
          </div>

          <div className="space-y-12">
            {POLICY_SECTIONS.map((sec) => (
              <div
                key={sec.id}
                id={sec.id}
                className="p-8 sm:p-10 rounded-[12px] bg-[#111111] border border-[#4a4b50] space-y-6"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[#5683da] px-2.5 py-1 rounded-md bg-[#090a0c] border border-[#4a4b50]">
                    SECTION {sec.num}
                  </span>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                    {sec.title}
                  </h3>
                </div>

                <ul className="space-y-3.5 text-sm sm:text-base text-[#a9a9aa] leading-relaxed">
                  {sec.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-[#5683da] font-bold mt-1">✦</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ SECTION 5: CTA ═══════════════════════════ */}
      <section className="relative py-20 sm:py-28 bg-[#090a0c]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 text-center">
          <div className="p-8 sm:p-14 rounded-[12px] bg-[#111111] border border-[#4a4b50] space-y-6">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#5683da]">
              VERIFY THE CODE
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-[1.08]">
              Ready to code in an <br />
              <span className="text-[#5683da]">air-gapped terminal matrix?</span>
            </h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-[#a9a9aa] leading-relaxed">
              Download VibeGrid free for macOS, or inspect our source code and build from source.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg"
                className="px-8 py-3.5 rounded-full bg-[#5683da] text-white font-semibold text-sm hover:bg-[#456ec2] transition-colors"
              >
                Download for macOS
              </a>
              <a
                href="/privacy-guarantee"
                className="px-6 py-3.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-white font-medium text-sm hover:border-[#a9a9aa] transition-colors"
              >
                Read 5 Privacy Guarantees →
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
