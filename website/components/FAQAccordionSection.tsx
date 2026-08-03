'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FAQAccordionSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How is VibeGrid 100% free with zero subscription?',
      a: 'VibeGrid is open-source software released under the MIT license. It runs entirely on your local GPU and CPU without cloud servers or telemetry.',
    },
    {
      q: 'How does GPU acceleration work in VibeGrid?',
      a: 'VibeGrid uses xterm.js coupled with the WebGL hardware acceleration addon. Terminal text glyphs and scrollback buffers are rendered directly via WebGL, achieving a steady 60 FPS.',
    },
    {
      q: 'How do equal grid presets work (1, 2, 4, 6, 8, 16)?',
      a: 'Selecting a preset generates an equal 2D grid (4 panes = 2x2, 6 panes = 2x3, 8 panes = 2x4, 16 panes = 4x4) with strict CSS container bounds (min-h-0 min-w-0), preventing window collapse.',
    },
    {
      q: 'Can I split panes manually?',
      a: 'Yes! You can press Cmd+D (horizontal split) or Cmd+Shift+D (vertical split) at any time. Splitting switches VibeGrid to dynamic binary tree split mode.',
    },
    {
      q: 'What operating systems are supported?',
      a: 'Native macOS builds (Universal Apple Silicon M1-M4 & Intel Macs) and Windows 10/11 x64 (PowerShell & Cmd via ConPTY). Linux AppImage and .deb builds are also included.',
    },
    {
      q: 'Are background terminal tasks preserved when switching workspaces?',
      a: 'Yes. PTY sessions are kept alive in background memory tasks. Switching workspaces does not terminate your long-running builds, servers, or scripts.',
    },
  ];

  return (
    <section id="faq" className="relative px-6 py-24 md:py-32 bg-black border-t border-white/[0.08]">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.8fr_1.4fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="lp-feature-heading text-white">FAQs</h2>
        </div>
        <div className="divide-y divide-white/[0.08]">
          {faqs.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className={isOpen ? 'bg-forest/[0.03]' : ''}>
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="group flex w-full items-center gap-4 px-2 py-5 text-left"
                >
                  <span className={`font-mono text-xs ${isOpen ? 'text-forest-bright' : 'text-white/35'}`}>
                    0{idx + 1}
                  </span>
                  <span className={`flex-1 font-normal transition-colors ${isOpen ? 'text-white' : 'text-white/75 group-hover:text-white'}`}>
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${isOpen ? 'rotate-180 text-forest-bright' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="overflow-hidden">
                    <p className="ml-[2.1rem] mr-2 whitespace-pre-line border-l-2 border-forest/40 pb-5 pl-4 text-sm leading-relaxed text-white/60">
                      {item.a}
                    </p>
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
