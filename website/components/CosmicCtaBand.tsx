'use client';

import React from 'react';
import { ArrowDown, Github } from 'lucide-react';
import { HairlineGridPattern } from './TokenPrimitives';

export function CosmicCtaBand() {
  return (
    <section className="relative bg-[#090a0c] py-28 sm:py-36 border-t border-[#4a4b50] text-[#ffffff] overflow-hidden text-center">
      {/* Subtle Hairline Grid Accents */}
      <HairlineGridPattern className="opacity-60" />

      {/* Architectural Corner Accent Borders */}
      <div className="absolute inset-x-0 top-0 h-px bg-[#4a4b50]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-[#4a4b50]" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8">
        <h2 className="text-4xl sm:text-6xl md:text-[72px] font-display font-black tracking-tight leading-[1.05] max-w-4xl mx-auto text-[#ffffff]">
          Experience True <span className="text-[#5683da]">Vibe Coding.</span>
        </h2>

        <p className="mt-6 text-base sm:text-xl text-[#a9a9aa] max-w-2xl mx-auto font-normal leading-relaxed">
          100% free and open-source forever. No subscriptions, zero tracking, and no walled gardens.
        </p>

        {/* Solid Pill CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Primary Download DMG */}
          <a
            href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#5683da] text-[#ffffff] font-semibold text-[15px] hover:brightness-110 active:scale-[0.98] transition-all duration-200 cursor-pointer border border-[#5683da] shadow-sm"
          >
            <ArrowDown size={18} />
            <span>Download for macOS</span>
          </a>

          {/* Windows / Source Pill */}
          <a
            href="https://github.com/abuzarkhan1/VibeGrid"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#111111] border border-[#4a4b50] text-[#e5e5e7] font-semibold text-[15px] hover:bg-[#303236] hover:text-[#ffffff] hover:border-[#6b6c6d] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <Github size={18} />
            <span>View Source on GitHub</span>
          </a>
        </div>
      </div>
    </section>
  );
}
