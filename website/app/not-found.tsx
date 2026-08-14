import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Terminal } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { SiteFooter } from '../components/SiteFooter';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col justify-between selection:bg-white selection:text-black">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto my-auto relative z-10 pt-28">
        {/* Custom Terminal Grid 404 SVG Artwork */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 mb-6 flex items-center justify-center">
          <svg
            viewBox="0 0 300 300"
            className="w-full h-full drop-shadow-[0_0_35px_rgba(255,255,255,0.08)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="vibegrid-404-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Glowing Core */}
            <circle cx="150" cy="150" r="130" fill="url(#vibegrid-404-glow)" />

            {/* 4 Terminal Grid Panes Wireframe */}
            <rect x="50" y="50" width="90" height="90" rx="8" fill="#111115" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <rect x="160" y="50" width="90" height="90" rx="8" fill="#111115" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <rect x="50" y="160" width="90" height="90" rx="8" fill="#111115" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            
            {/* The 4th Pane with 404 Disconnect Signal */}
            <rect x="160" y="160" width="90" height="90" rx="8" fill="#18181f" stroke="#f43f5e" strokeWidth="2" />

            {/* Terminal Header Dots on Panes */}
            <circle cx="65" cy="65" r="3" fill="rgba(255,255,255,0.3)" />
            <circle cx="75" cy="65" r="3" fill="rgba(255,255,255,0.2)" />
            <circle cx="85" cy="65" r="3" fill="rgba(255,255,255,0.2)" />

            <circle cx="175" cy="65" r="3" fill="rgba(255,255,255,0.3)" />
            <circle cx="185" cy="65" r="3" fill="rgba(255,255,255,0.2)" />
            <circle cx="195" cy="65" r="3" fill="rgba(255,255,255,0.2)" />

            <circle cx="65" cy="175" r="3" fill="rgba(255,255,255,0.3)" />
            <circle cx="75" cy="175" r="3" fill="rgba(255,255,255,0.2)" />
            <circle cx="85" cy="175" r="3" fill="rgba(255,255,255,0.2)" />

            {/* Broken X inside Pane 4 */}
            <line x1="190" y1="190" x2="220" y2="220" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="220" y1="190" x2="190" y2="220" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />

            {/* Orbiting Matrix Signal */}
            <circle cx="150" cy="150" r="140" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="6 6" />

            {/* Bottom Status text */}
            <text
              x="150"
              y="288"
              textAnchor="middle"
              fill="rgba(255,255,255,0.35)"
              fontSize="11"
              fontFamily="monospace"
              letterSpacing="2"
            >
              PTY_PANE_UNBOUND_0x404
            </text>
          </svg>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span>TERMINAL_PANE_NOT_FOUND</span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4 font-sans">
          Workspace <span className="font-serif italic font-normal text-white/90">Unmapped</span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed font-sans">
          The terminal route, configuration, or pane layout you requested does not exist or has been closed.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all w-full sm:w-auto shadow-[0_0_25px_rgba(255,255,255,0.2)]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Workspace</span>
          </Link>
          <a
            href="https://github.com/abuzarkhan1/VibeGrid"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 font-semibold text-sm transition-all w-full sm:w-auto"
          >
            <Terminal className="w-4 h-4" />
            <span>GitHub Repository</span>
          </a>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
