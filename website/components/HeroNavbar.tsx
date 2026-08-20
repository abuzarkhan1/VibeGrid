'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, Github, ArrowDown } from 'lucide-react';

export function HeroNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#090a0c]/90 backdrop-blur-md border-b border-[#4a4b50]/40 py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.6)]'
          : 'bg-transparent border-b border-transparent py-5'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-3 group select-none">
          <div className="h-8 w-8 rounded-full border border-[#4a4b50] bg-[#111111] flex items-center justify-center group-hover:border-[#5683da] transition-colors">
            <span className="font-mono text-xs font-bold text-[#5683da] tracking-tighter">VG</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white transition-colors">
            Vibe<span className="text-[#5683da]">Grid</span>
          </span>
        </a>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Productivity', href: '/#productivity' },
            { label: 'Agent Swarm', href: '/#agent-swarm' },
            { label: 'Powerhouse', href: '/#powerhouse' },
            { label: 'Demo', href: '/#demo' },
            { label: 'About', href: '/about' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[14px] font-medium text-[#a9a9aa] hover:text-white transition-colors duration-150 tracking-[-0.01em] relative py-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Actions (GitHub + Download) */}
        <div className="hidden lg:flex items-center gap-3">
          {/* GitHub Button */}
          <a
            href="https://github.com/abuzarkhan1/VibeGrid"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#4a4b50] bg-[#111111] text-[13px] font-medium text-white hover:border-[#a9a9aa] hover:bg-[#1b1c1e] transition-colors"
          >
            <Github size={15} />
            <span>GitHub</span>
          </a>

          {/* Download macOS (.dmg) Button */}
          <a
            href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg"
            className="px-4 py-2 rounded-full bg-[#5683da] text-white text-[13px] font-semibold tracking-[-0.01em] hover:bg-[#456ec2] transition-colors flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
          >
            <ArrowDown size={14} />
            <span>Download</span>
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-[#a9a9aa] hover:text-white transition-colors"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#4a4b50]/40 bg-[#090a0c] px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-3">
            {[
              { label: 'Productivity', href: '/#productivity' },
              { label: 'Agent Swarm', href: '/#agent-swarm' },
              { label: 'Powerhouse', href: '/#powerhouse' },
              { label: 'Demo', href: '/#demo' },
              { label: 'About', href: '/about' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-[15px] font-medium text-[#a9a9aa] hover:text-white py-1 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-[#4a4b50]/40 flex flex-col gap-3">
            <a
              href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg"
              className="w-full py-3 text-center rounded-full bg-[#5683da] text-white text-sm font-semibold hover:bg-[#456ec2] transition-colors"
            >
              Download for macOS
            </a>
            <a
              href="https://github.com/abuzarkhan1/VibeGrid"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 text-center rounded-full border border-[#4a4b50] bg-[#111111] text-white text-sm font-medium flex items-center justify-center gap-2 hover:border-[#a9a9aa] hover:bg-[#1b1c1e] transition-colors"
            >
              <Github size={16} />
              GitHub
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
