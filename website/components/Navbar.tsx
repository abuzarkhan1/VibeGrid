'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface NavbarProps {
  /** Which page is currently active (controls the About link highlight). */
  active?: 'home' | 'about';
}

const NAV_LINKS = [
  { label: 'Desktop', href: '/#desktop' },
  { label: 'Workspaces', href: '/#workspaces' },
  { label: 'Themes', href: '/#themes' },
  { label: 'About', href: '/about' },
];

export function Navbar({ active }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileNavRef = useRef<HTMLElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    if (menuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const nav = mobileNavRef.current;
    if (!nav) return;

    const focusable = Array.from(
      nav.querySelectorAll<HTMLElement>('a, button')
    ).filter((el) => !el.hasAttribute('disabled'));

    if (focusable.length === 0) return;

    focusable[0].focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    nav.addEventListener('keydown', handleTab);
    return () => nav.removeEventListener('keydown', handleTab);
  }, [menuOpen]);

  return (
    <>
      <header
        role="banner"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? 'bg-[#08080a] backdrop-blur-2xl border-white/[0.08] py-4'
            : 'bg-[#08080a]/80 backdrop-blur-xl border-transparent py-5'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex items-center justify-between h-12">
          <a
            href="/"
            className="text-2xl sm:text-3xl font-black text-white tracking-tight select-none flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 border border-white/15 overflow-hidden p-1 shadow-sm">
              <img src="/logo.png" alt="VibeGrid Logo" className="w-full h-full object-contain rounded" />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-black tracking-tight text-white">Vibe</span>
              <em className="italic font-serif font-bold text-zinc-100 text-2xl sm:text-3xl">
                Grid
              </em>
            </div>
          </a>

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-current={link.label === 'About' && active === 'about' ? 'page' : undefined}
                className="text-base font-black tracking-tight text-white hover:text-zinc-300 transition-colors duration-150"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center">
            <a
              href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg"
              className="text-base font-black tracking-tight px-7 py-3 rounded-full bg-white text-black hover:bg-zinc-200 transition-all duration-200 shadow-2xl shadow-white/30 active:scale-[0.98] inline-flex items-center justify-center cursor-pointer select-none border-2 border-white"
            >
              Download (.dmg)
            </a>
          </div>

          <button
            ref={hamburgerRef}
            className="md:hidden flex flex-col justify-center items-center w-11 h-11 min-w-[44px] min-h-[44px] p-2 gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            <span
              className={`block h-0.5 w-6 bg-white transition-all duration-200 origin-center ${
                menuOpen ? 'rotate-45 translate-y-[8px]' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-white transition-all duration-200 ${
                menuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-white transition-all duration-200 origin-center ${
                menuOpen ? '-rotate-45 -translate-y-[8px]' : ''
              }`}
            />
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav
          id="mobile-nav"
          ref={mobileNavRef}
          aria-label="Mobile navigation"
          className="fixed inset-0 z-40 bg-[#08080a]/98 backdrop-blur-3xl flex flex-col justify-center items-center gap-8 md:hidden px-6"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-3xl font-black tracking-tight text-white hover:text-zinc-300 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://github.com/abuzarkhan1/VibeGrid/releases/download/v1/VibeGrid_0.1.0_aarch64.dmg"
            className="text-lg font-black tracking-tight px-8 py-4 rounded-full bg-white text-black hover:bg-zinc-200 transition-all mt-4 w-full text-center shadow-2xl active:scale-[0.98] border-2 border-white"
            onClick={() => setMenuOpen(false)}
          >
            Download VibeGrid (.dmg)
          </a>
        </nav>
      )}
    </>
  );
}
