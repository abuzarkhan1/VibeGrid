'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'How does VibeGrid achieve 60 FPS terminal rendering?',
      answer: 'VibeGrid uses xterm.js combined with the WebGL hardware acceleration addon. Terminal output is rendered directly on the GPU, avoiding CPU bottlenecks even when streaming high-volume stdout logs.',
    },
    {
      question: 'Is VibeGrid 100% free and open-source?',
      answer: 'Yes! VibeGrid is completely free and open-source under the MIT License. There are no subscriptions, no credit card requirements, no paid tiers, and zero telemetry.',
    },
    {
      question: 'How do equal grid layout presets work (1, 2, 4, 6, 8, 16)?',
      answer: 'VibeGrid features dedicated preset layout buttons in the top header and Command Palette. Selecting 4 creates a 2x2 grid (2 on top, 2 on bottom), 6 creates a 2x3 grid, 8 creates a 2x4 grid, and 16 creates a 4x4 grid with equal dimensions.',
    },
    {
      question: 'What shells and operating systems are supported?',
      answer: 'VibeGrid runs natively on macOS (Apple Silicon M1/M2/M3/M4 & Intel Macs running zsh/bash/fish) and Windows 10/11 (PowerShell & cmd.exe via ConPTY). Linux AppImage and .deb builds are also supported.',
    },
    {
      question: 'What happens to background tasks when I switch workspaces?',
      answer: 'VibeGrid retains background PTY sessions in memory. When you switch workspaces, background shell processes continue executing without being killed, allowing you to return to active tasks seamlessly.',
    },
    {
      question: 'Can I customize keyboard shortcuts and terminal themes?',
      answer: 'Yes. Press Cmd/Ctrl+, to open the Settings panel. You can customize keybindings, adjust scrollback lines (up to 100,000), choose font families/sizes, and switch between 7 built-in themes (VibeDark, VibeLight, Midnight Blue, Solarized, Dracula, Nord).',
    },
  ];

  return (
    <section id="faq" className="relative py-24 bg-black border-t border-white/10">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 mb-4">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto font-light">
            Everything you need to know about VibeGrid, GPU acceleration, and workspace customization.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl border border-white/10 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      0{idx + 1}
                    </span>
                    <span className="text-base font-bold text-white">{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-white/50 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 text-sm text-white/60 font-light leading-relaxed border-l-2 border-emerald-500 ml-6 mb-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
