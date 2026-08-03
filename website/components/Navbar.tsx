'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const Navbar: React.FC = () => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="lp-gpu fixed inset-x-0 top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10"
    >
      <div className="relative flex min-w-0 items-center justify-between gap-2 sm:gap-3 mx-auto max-w-6xl px-6 py-3.5 sm:px-10 lg:px-12">
        {/* Brand Logo & Wordmark */}
        <a className="group flex flex-shrink-0 items-center gap-2.5 opacity-90 transition-opacity duration-200 hover:opacity-100" href="#">
          <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-forest text-white font-mono font-bold text-xs shadow-[0_0_15px_rgba(84,169,103,0.5)]">
            &gt;_
          </div>
          <span className="lp-serif text-xl tracking-wide text-white/90 transition-colors group-hover:text-white">
            vibegrid
          </span>
        </a>

        {/* Product Menu Nav Links */}
        <nav aria-label="VibeGrid products" className="items-center flex">
          <div className="hidden items-center md:flex gap-1">
            <a href="#desktop" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] transition-colors text-white/60 hover:text-white">
              Desktop
              <span className="text-[8px] font-semibold uppercase leading-none tracking-wide rounded-full bg-forest/20 px-1.5 py-0.5 text-forest-bright">
                v0.1.0
              </span>
            </a>
            <a href="#cli" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] transition-colors text-white/60 hover:text-white">
              CLI
            </a>
            <a href="#workspaces" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] transition-colors text-white/60 hover:text-white">
              Workspaces
            </a>
            <a href="#features" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] transition-colors text-white/60 hover:text-white">
              Features
            </a>
            <a href="#faq" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] transition-colors text-white/60 hover:text-white">
              FAQ
            </a>
          </div>
        </nav>

        {/* Right CTA Utilities */}
        <div className="flex items-center gap-3">
          {/* GitHub Star Badge */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white hidden sm:inline-flex"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-[16px] w-[16px] shrink-0">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.523 2 12 2Z"></path>
            </svg>
            <span className="text-xs font-medium tabular-nums">8.4k</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star h-3 w-3 shrink-0 fill-current opacity-80 text-amber-400">
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
            </svg>
          </a>

          {/* Download App CTA */}
          <a
            href="#download"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-forest px-4 text-xs font-semibold text-white transition-all hover:bg-forest/90 shadow-[0_0_20px_rgba(84,169,103,0.4)]"
          >
            Download App
          </a>
        </div>
      </div>
    </motion.header>
  );
};
