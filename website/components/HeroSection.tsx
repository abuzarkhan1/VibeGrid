'use client';

import React from 'react';
import { AuroraBeamFX } from './AuroraBeamFX';
import { HeroNavbar } from './HeroNavbar';
import { FloatingProductFrame } from './FloatingProductFrame';
import { ArrowDown } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#090a0c] pt-28 pb-20">
      {/* 1. Architectural Geometric Grid Canvas */}
      <AuroraBeamFX />

      {/* 2. Top Glassmorphic Navigation */}
      <HeroNavbar />

      {/* 3. Centerstage Content */}
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 text-center pt-8 sm:pt-14 pb-14">
        {/* 84px Display Headline in Solid High-Contrast Typography */}
        <h1 className="mx-auto max-w-5xl text-[44px] sm:text-[68px] md:text-[84px] font-black tracking-[-0.04em] leading-none text-white">
          <span className="block mb-7 sm:mb-8">The Agnostic Grid for</span>
          <span className="block"><span className="text-[#5683da]">Vibe</span> <span className="text-[#ff8964]">Coding</span></span>
        </h1>

        {/* 18px Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-[17px] sm:text-[18px] leading-[1.5] text-[#a9a9aa] font-normal tracking-[-0.36px]">
          Free, local-first workspace for orchestrating your choice of AI agents.
        </p>

        {/* Solid Pill CTA Button Group */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Primary Pill Button: Solid #5683da (Electric Iris) */}
          <a
            href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-[#5683da] text-white px-7 py-3.5 text-[15px] font-semibold tracking-[-0.01em] hover:bg-[#456ec2] transition-colors active:scale-[0.98] cursor-pointer select-none"
          >
            <ArrowDown size={18} />
            Download for macOS
          </a>

          {/* White Pill Button: Solid #ffffff */}
          <a
            href="#desktop-app-demo"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-white text-[#090a0c] px-7 py-3.5 text-[15px] font-bold tracking-[-0.01em] hover:bg-[#e5e5e7] transition-colors active:scale-[0.98] cursor-pointer select-none"
          >
            See in Action →
          </a>
        </div>
      </div>

      {/* 4. Floating Product Frame Showcase */}
      <div className="relative z-10">
        <FloatingProductFrame />
      </div>
    </section>
  );
}
