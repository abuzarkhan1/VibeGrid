'use client';

import React from 'react';

export function HeroTicker() {
  const items = [
    'Multi-Pane Grid (1–16 Panes)',
    'Native AI Agent CLIs',
    '60 FPS GPU Rendering',
    'Offline MCP Tool Server Bridge',
    'Native Rust PTY Engine',
    'Whisper Voice-to-Terminal',
    '100% Free & Open Source',
  ];

  return (
    <div className="w-full border-y border-[#4a4b50]/40 bg-[#0e0e10] overflow-hidden py-3.5 select-none">
      <div className="flex w-max animate-logo-scroll">
        {[...Array(4)].map((_, loopIdx) => (
          <div key={loopIdx} className="flex items-center gap-10 px-4">
            {items.map((item, itemIdx) => (
              <span
                key={`${loopIdx}-${itemIdx}`}
                className="font-mono text-xs uppercase tracking-widest text-[#a9a9aa] whitespace-nowrap flex items-center gap-3 font-medium"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff8964] shrink-0" />
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
