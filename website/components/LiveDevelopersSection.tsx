'use client';

import React from 'react';

export const LiveDevelopersSection: React.FC = () => {
  const countries = [
    { flag: '🇺🇸', name: 'United States', count: 428, width: '100%' },
    { flag: '🇮🇳', name: 'India', count: 312, width: '72.8%' },
    { flag: '🇩🇪', name: 'Germany', count: 184, width: '42.9%' },
    { flag: '🇬🇧', name: 'United Kingdom', count: 142, width: '33.1%' },
    { flag: '🇯🇵', name: 'Japan', count: 118, width: '27.5%' },
  ];

  return (
    <section className="relative bg-black px-6 py-16 md:py-20">
      <div className="will-change-transform mx-auto max-w-xl rounded-2xl bg-white/[0.02] p-6 md:p-8 border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#54a967] opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#54a967]" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">Live now</span>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">Top regions</span>
        </div>

        <div className="mt-6 flex items-end gap-3">
          <span className="lp-text-glow-green font-mono text-5xl leading-none md:text-6xl text-[#54a967]">
            1,568
          </span>
          <span className="pb-1 text-sm leading-tight text-white/55">
            developers building with VibeGrid<br />right now
          </span>
        </div>

        <ol className="mt-8 flex flex-col gap-3.5">
          {countries.map((c, idx) => (
            <li key={idx}>
              <div className="flex items-center gap-3">
                <span className="text-base leading-none">{c.flag}</span>
                <span className="flex-1 truncate text-sm text-white/85">{c.name}</span>
                <span className="font-mono text-sm tabular-nums text-[#54a967]">{c.count}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    background: 'linear-gradient(90deg, rgb(44, 122, 64), rgb(84, 169, 103))',
                    width: c.width,
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
