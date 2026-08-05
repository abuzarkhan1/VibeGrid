'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from './useScrollReveal';
import CountUp from './CountUp';
import { CONTINENT_PATHS, MAP_DOTS } from './livemap-data';

/* ─── Top countries ─── */
const COUNTRIES = [
  { code: 'PK', name: 'Pakistan', count: 223 },
  { code: 'IN', name: 'India', count: 82 },
  { code: 'DE', name: 'Germany', count: 76 },
  { code: 'BR', name: 'Brazil', count: 72 },
  { code: 'GB', name: 'United Kingdom', count: 71 },
];
const MAX_COUNT = Math.max(...COUNTRIES.map((c) => c.count));

const flag = (code: string) =>
  /^[A-Z]{2}$/.test(code)
    ? String.fromCodePoint(...Array.from(code.toUpperCase(), (c) => 127397 + c.charCodeAt(0)))
    : '🌐';

export default function LiveMap() {
  useScrollReveal();

  return (
    <section className="relative bg-black px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,360px)_1fr] lg:gap-12">
          {/* ── Live stats card ── */}
          <div className="vg-hidden vg-in-rise rounded-2xl bg-white/[0.02] p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-bright opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-forest-bright" />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">
                  Live now
                </span>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">
                Top countries
              </span>
            </div>

            <div className="mt-6 flex items-end gap-3">
              <span className="vg-text-glow font-mono text-5xl leading-none text-forest-bright md:text-6xl">
                <CountUp target={4821} duration={1.8} />
              </span>
              <span className="pb-1 text-sm leading-tight text-white/55">
                terminal panes
                <br />
                running right now
              </span>
            </div>

            <ol className="mt-8 flex flex-col gap-3.5">
              {COUNTRIES.map((c, i) => (
                <li key={c.code}>
                  <div className="flex items-center gap-3">
                    <span className="text-base leading-none">{flag(c.code)}</span>
                    <span className="flex-1 truncate text-sm text-white/85">{c.name}</span>
                    <span className="font-mono text-sm tabular-nums text-forest-bright">
                      {c.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #056fc7, #3c95f0)',
                      }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(c.count / MAX_COUNT) * 100}%` }}
                      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
                      transition={{ duration: 0.7, delay: 0.05 * i, ease: 'easeOut' }}
                    />
                  </div>
                </li>
              ))}
            </ol>

            <a
              href="/#download"
              className="mt-7 inline-flex items-center gap-1.5 text-[13px] text-white/45 transition-colors hover:text-white"
            >
              Get VibeGrid free
              <span aria-hidden="true">→</span>
            </a>
          </div>

          {/* ── World map with pulsing dots ── */}
          <div className="vg-hidden vg-in-right overflow-hidden rounded-2xl border border-forest/15 bg-[#030d18] p-2 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)]">
            <svg
              viewBox="0 0 1000 520"
              preserveAspectRatio="xMidYMid slice"
              role="img"
              aria-label="World map of live VibeGrid activity by region"
              className="relative aspect-[25/13] w-full"
            >
              <defs>
                <pattern id="vg-map-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M48 0H0V48" fill="none" stroke="rgba(92,194,255,0.06)" strokeWidth="1" />
                </pattern>
                <linearGradient id="vg-ocean" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#030d18" />
                  <stop offset="46%" stopColor="#041a26" />
                  <stop offset="100%" stopColor="#01060a" />
                </linearGradient>
              </defs>

              {/* Ocean + grid */}
              <rect width="1000" height="520" fill="url(#vg-ocean)" />
              <rect width="1000" height="520" fill="url(#vg-map-grid)" />

              {/* Continents */}
              {CONTINENT_PATHS.map((d, i) => (
                <path
                  key={i}
                  d={d}
              fill="rgba(11,107,196,0.22)"
              stroke="rgba(60,149,240,0.28)"
                  strokeWidth="0.8"
                />
              ))}

              {/* Pulsing activity dots */}
              {MAP_DOTS.map((dot, i) => (
                <g key={i}>
                  <circle
                    className="vg-lm-pulse"
                    cx={dot.x}
                    cy={dot.y}
                    r={dot.r}
                    fill="rgba(60,149,240,0.14)"
                    stroke="rgba(60,149,240,0.48)"
                    strokeWidth="1.8"
                    style={{ '--dur': `${dot.dur}s`, '--delay': `${dot.delay}s` } as React.CSSProperties}
                  />
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={Math.max(2.2, dot.r / 4)}
                    fill="#5CC2FF"
                    stroke="rgba(255,255,255,0.82)"
                    strokeWidth="1.2"
                  />
                  {dot.count && (
                    <g className="pointer-events-none">
                      <rect
                        x={dot.x + dot.r + 2}
                        y={dot.y - 14}
                        width={dot.count.length * 10 + 18}
                        height="24"
                        rx="5"
                        fill="rgba(0,0,0,0.66)"
                        stroke="rgba(255,255,255,0.14)"
                      />
                      <text
                        x={dot.x + dot.r + 12}
                        y={dot.y + 4}
                        className="fill-white font-mono text-[15px] font-medium"
                      >
                        {dot.count}
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
