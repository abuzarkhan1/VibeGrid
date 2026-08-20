'use client';

import React from 'react';
import { Terminal, Github, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface SiteFooterProps {
  /** Which page is currently active (used to highlight navigation links). */
  active?: 'home' | 'about';
}

const VIBEGRID_LETTERS = [
  { char: 'V', color: '#5683da' },
  { char: 'I', color: '#5683da' },
  { char: 'B', color: '#5683da' },
  { char: 'E', color: '#5683da' },
  { char: 'G', color: '#ff8964' },
  { char: 'R', color: '#ff8964' },
  { char: 'I', color: '#ff8964' },
  { char: 'D', color: '#ff8964' },
];

function AnimatedFooterWordmark() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.25 }}
      className="pt-10 pb-6 sm:pt-16 sm:pb-10 border-t border-[#4a4b50]/40 overflow-hidden text-center select-none"
    >
      <span className="font-display font-black text-6xl sm:text-9xl md:text-[11rem] lg:text-[14rem] tracking-tight leading-none inline-flex items-center justify-center select-none uppercase">
        {VIBEGRID_LETTERS.map((item, index) => (
          <motion.span
            key={index}
            variants={{
              hidden: {
                color: 'rgba(255, 255, 255, 0.08)',
                y: 10,
                opacity: 0.4,
              },
              visible: {
                color: item.color,
                y: 0,
                opacity: 1,
                transition: {
                  duration: 0.6,
                  delay: index * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }}
            whileHover={{
              scale: 1.08,
              y: -8,
              transition: { duration: 0.2 },
            }}
            className="inline-block transition-transform duration-200 cursor-default"
          >
            {item.char}
          </motion.span>
        ))}
      </span>
    </motion.div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function SiteFooter({ active }: SiteFooterProps) {
  return (
    <footer className="relative border-t border-[#4a4b50] bg-[#090a0c] pt-16 pb-12 text-[#ffffff] overflow-hidden select-none">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 relative z-10">
        {/* Main Grid: Brand Column + 4 Categorized Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8 pb-14">
          {/* Brand Mark & Tagline (2 cols on large) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#111111] border border-[#4a4b50] flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
                <img src="/logo.png" alt="VibeGrid Logo" className="w-full h-full object-cover rounded-md" />
              </div>
              <span className="font-display font-black text-xl tracking-tight text-[#ffffff]">
                VIBEGRID
              </span>
            </div>

            {/* GitHub Star Counter */}
            <div className="pt-2">
              <a
                href="https://github.com/abuzarkhan1/VibeGrid"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111111] border border-[#4a4b50] text-[#e5e5e7] hover:bg-[#303236] hover:text-[#ffffff] hover:border-[#6b6c6d] text-xs font-mono transition-all cursor-pointer"
              >
                <GitHubIcon className="w-3.5 h-3.5 text-[#ffffff]" />
                <span>Star on GitHub</span>
                <span className="px-1.5 py-0.5 rounded bg-[#303236] text-[#d1d1d1] text-[10px] font-bold border border-[#4a4b50]">
                  ★ Star
                </span>
              </a>
            </div>
          </div>

          {/* Column 1: Product */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-[#ffffff]">
              Product
            </h3>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a href="/#desktop-app-demo" className="text-[#95979e] hover:text-[#ffffff] transition-colors">
                  Agent Swarm
                </a>
              </li>
              <li>
                <a href="/#powerhouse" className="text-[#95979e] hover:text-[#ffffff] transition-colors">
                  MetaBrain Engine
                </a>
              </li>
              <li>
                <a href="/#productivity" className="text-[#95979e] hover:text-[#ffffff] transition-colors">
                  Light Bento
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg"
                  className="text-[#5683da] hover:text-[#ffffff] transition-colors font-medium"
                >
                  Download for macOS
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className={`transition-colors ${
                    active === 'about' ? 'text-[#ffffff] font-bold' : 'text-[#95979e] hover:text-[#ffffff]'
                  }`}
                >
                  About VibeGrid
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-[#ffffff]">
              Resources
            </h3>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a
                  href="https://github.com/abuzarkhan1/VibeGrid#readme"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#95979e] hover:text-[#ffffff] transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abuzarkhan1/VibeGrid#quick-start"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#95979e] hover:text-[#ffffff] transition-colors"
                >
                  Quickstart Guide
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abuzarkhan1/VibeGrid#agent-support"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#95979e] hover:text-[#ffffff] transition-colors"
                >
                  Agent Setup
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abuzarkhan1/VibeGrid#architecture"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#95979e] hover:text-[#ffffff] transition-colors"
                >
                  Architecture
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abuzarkhan1/VibeGrid/discussions"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#95979e] hover:text-[#ffffff] transition-colors"
                >
                  Discussions
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Developers */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-[#ffffff]">
              Developers
            </h3>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a
                  href="https://github.com/abuzarkhan1/VibeGrid"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#95979e] hover:text-[#ffffff] transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abuzarkhan1/VibeGrid/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#95979e] hover:text-[#ffffff] transition-colors"
                >
                  Releases & Changelog
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abuzarkhan1/VibeGrid/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#95979e] hover:text-[#ffffff] transition-colors"
                >
                  Issue Tracker
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abuzarkhan1/VibeGrid/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#95979e] hover:text-[#ffffff] transition-colors"
                >
                  Contributing
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abuzarkhan1/VibeGrid#mcp-support"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#95979e] hover:text-[#ffffff] transition-colors"
                >
                  MCP Tools
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-[#ffffff]">
              Legal
            </h3>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a
                  href="https://github.com/abuzarkhan1/VibeGrid/blob/main/LICENSE"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#95979e] hover:text-[#ffffff] transition-colors"
                >
                  MIT License
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-[#95979e] hover:text-[#ffffff] transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/privacy-guarantee"
                  className="text-[#95979e] hover:text-[#ffffff] transition-colors"
                >
                  Privacy Guarantee
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abuzarkhan1/VibeGrid/security"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#95979e] hover:text-[#ffffff] transition-colors"
                >
                  Security Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Giant Animated VibeGrid Wordmark */}
        <AnimatedFooterWordmark />

        {/* Bottom Bar: Copyright */}
        <div className="flex items-center justify-between pt-8 border-t border-[#4a4b50] text-center sm:text-left">
          <div className="font-mono text-[11px] sm:text-xs text-[#95979e]">
            © 2026 Abuzar Khan · VibeGrid MIT License. All systems nominal.
          </div>
        </div>
      </div>
    </footer>
  );
}
