'use client';

import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { HeroTicker } from '../components/HeroTicker';
import { ProductivityLightGrid } from '../components/ProductivityLightGrid';
import { MultiAgentSwarmMatrix } from '../components/MultiAgentSwarmMatrix';
import { InteractiveAppDemo } from '../components/InteractiveAppDemo';
import { MetaBrainCapabilitiesSection } from '../components/MetaBrainCapabilitiesSection';
import { CosmicCtaBand } from '../components/CosmicCtaBand';
import { SiteFooter } from '../components/SiteFooter';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#090a0c] text-white flex flex-col selection:bg-[#5683da]/30 selection:text-white overflow-x-hidden w-full">
      {/* Section 1: Dark Hero */}
      <HeroSection />

      {/* Ticker Marquee — sits between hero and first content section */}
      <div className="bg-[#090a0c] border-y border-[#303236]/60">
        <HeroTicker />
      </div>

      {/* Section 2: Productivity (#productivity) */}
      <ProductivityLightGrid />

      {/* Section 3: Agent Swarm (#agent-swarm) */}
      <MultiAgentSwarmMatrix />

      {/* Section 4: Interactive Demo (#demo) */}
      <div id="demo">
        <InteractiveAppDemo />
      </div>

      {/* Section 5: Powerhouse (#powerhouse) */}
      <MetaBrainCapabilitiesSection />

      {/* Section 5: Cosmic CTA Band (Cosmic Horizon with Amber Sunburst & Downloads) */}
      <CosmicCtaBand />

      {/* Footer: Minimal Obsidian Navigation & System Status */}
      <SiteFooter active="home" />
    </main>
  );
}
