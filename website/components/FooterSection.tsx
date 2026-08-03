'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const FooterSection: React.FC = () => {
  const { scrollY } = useScroll();
  const hillsY = useTransform(scrollY, [1000, 3000], [0, -30]);
  const bushesY = useTransform(scrollY, [1000, 3000], [0, -50]);

  return (
    <footer className="relative overflow-hidden bg-black pt-24 pb-0">
      {/* Background Gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#000000_0%,#04070c_42%,#080d16_72%,#0b1422_100%)]" />

      {/* Quote Callout */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative z-20 mx-auto max-w-6xl px-6 text-center"
      >
        <p className="lp-serif text-2xl text-white/90 md:text-4xl leading-tight">
          We just revolutionized terminal workspaces
        </p>
      </motion.div>

      {/* Large Watermark Wordmark & Parallax Landscape Layers */}
      <div className="relative mt-12 h-[42vh] min-h-[320px] select-none md:h-[52vh] overflow-hidden">
        {/* Wordmark */}
        <div className="absolute inset-x-0 bottom-12 z-0">
          <h2
            aria-label="vibegrid"
            className="lp-hero-heading bg-gradient-to-b from-white via-white/80 to-white/20 bg-clip-text text-center font-medium leading-none tracking-tight text-transparent select-none"
            style={{ fontSize: 'clamp(3.25rem, 13vw, 11rem)' }}
          >
            vibegrid
          </h2>
        </div>

        {/* Hills Artwork Layer with Parallax */}
        <motion.img
          style={{ y: hillsY }}
          src="/hills-bg.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-[8%] z-[1] h-[clamp(150px,26vw,380px)] w-full select-none object-cover object-bottom opacity-30 brightness-[0.5] saturate-[0.7]"
        />

        {/* Bushes Artwork Layer with Parallax */}
        <motion.img
          style={{ y: bushesY }}
          src="/bushes-fg.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[clamp(130px,22vw,440px)] w-full origin-bottom select-none object-cover object-bottom brightness-[0.5] saturate-[0.8]"
        />
      </div>

      {/* Footer Navigation & Copyright */}
      <div className="relative z-20 border-t border-white/10 bg-black">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 py-7 md:flex-row md:items-center md:justify-between">
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-white/45">
            <a href="#desktop" className="transition-colors hover:text-white">
              Desktop
              <span className="ml-1 align-super text-[8px] font-medium uppercase tracking-wide text-forest-bright">
                v0.1.0
              </span>
            </a>
            <a href="#cli" className="transition-colors hover:text-white">CLI</a>
            <a href="#workspaces" className="transition-colors hover:text-white">Workspaces</a>
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
            <a href="#" className="transition-colors hover:text-white">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-white">Terms of Service</a>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-xs text-white/30">© 2026 VibeGrid. All rights reserved.</span>
            <span className="h-4 w-px bg-white/10" />

            {/* GitHub Star Badge */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-white/55 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white inline-flex"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-[16px] w-[16px] shrink-0">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.523 2 12 2Z"></path>
              </svg>
              <span className="text-xs font-medium tabular-nums">8.4k</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
