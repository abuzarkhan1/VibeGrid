'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SiteFooterProps {
  /** Which page is currently active (used to highlight the About link). */
  active?: 'home' | 'about';
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function SiteFooter({ active }: SiteFooterProps) {
  const footerRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!footerRef.current) return;
      const rect = footerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative border-t border-white/[0.08] bg-[#08080a] pt-16 pb-12 text-white overflow-hidden select-none"
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-8 relative z-10">
        {/* Giant Mouse-following Glow Brand */}
        <div className="relative flex items-center justify-center my-8 py-10 overflow-hidden pointer-events-none min-h-[180px] sm:min-h-[240px]">
          <div
            className="text-6xl sm:text-9xl lg:text-[13rem] font-extrabold tracking-tighter text-transparent bg-clip-text leading-none transition-all duration-300 drop-shadow-2xl text-center"
            style={{
              backgroundImage: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.08) 100%)`,
              WebkitBackgroundClip: 'text',
              textShadow: '0 0 50px rgba(255,255,255,0.15)',
            }}
          >
            VIBEGRID
          </div>
        </div>

        {/* Clean bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-white/[0.08]">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">
              © 2026 Abuzar Khan · VibeGrid MIT License
            </div>
            <a
              href="/about"
              aria-current={active === 'about' ? 'page' : undefined}
              className={`font-mono text-xs uppercase tracking-widest transition-colors ${
                active === 'about' ? 'text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              About
            </a>
            <a
              href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg"
              className="font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Download (.dmg)
            </a>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/abuzarkhan1/VibeGrid"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-200 transition-colors flex items-center gap-2 font-extrabold text-base sm:text-lg text-white tracking-tighter"
            >
              <GitHubIcon className="w-4 h-4 text-white" />
              <span>GitHub</span>
            </a>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
