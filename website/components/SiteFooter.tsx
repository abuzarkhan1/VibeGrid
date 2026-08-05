'use client';

interface SiteFooterProps {
  /** Which page is currently active (used to highlight the About link). */
  active?: 'home' | 'about';
}

/** Slim footer bar with identity, license, and quick links. */
function FooterBar({ active }: SiteFooterProps) {
  return (
    <div className="border-t border-white/[0.06] bg-black">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex items-center gap-2.5 text-[12.5px] text-white/35">
          <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-forest/80">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.9"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.2"/>
            </svg>
          </div>
          <span>
            VibeGrid · © 2026 · <span className="text-forest-light">MIT License</span>
          </span>
        </div>

        <nav className="flex items-center gap-5 text-[12.5px]">
          <a href="/about" aria-current={active === 'about' ? 'page' : undefined}
            className={`transition-colors ${active === 'about' ? 'text-forest-bright' : 'text-white/45 hover:text-white'}`}>
            About
          </a>
          <a href="https://github.com/abuzarkhan1/VibeGrid" target="_blank" rel="noreferrer"
            className="text-white/45 transition-colors hover:text-white">
            GitHub
          </a>
          <a href="/#download"
            className="text-white/45 transition-colors hover:text-white">
            Download
          </a>
        </nav>
      </div>
    </div>
  );
}

/** Bushes landscape with the oversized VIBEGRID wordmark. */
function Landscape() {
  return (
    <section className="relative overflow-hidden bg-black">
      <div className="parallax-container relative h-[60vh] w-full">

        {/* Bushes foreground */}
        <img src="/bushes-fg.webp" alt="" aria-hidden="true"
             decoding="async" draggable="false"
             className="lp-gpu pointer-events-none absolute inset-x-0 bottom-0 z-[2] w-full select-none object-cover" />

        {/* VibeGrid wordmark in landscape */}
        <div className="absolute inset-x-0 bottom-[18%] z-[3] flex items-center justify-center">
          <span className="select-none font-sans text-[clamp(3rem,10vw,9rem)] font-black uppercase tracking-[0.15em] text-white opacity-[0.22]">
            VIBEGRID
          </span>
        </div>
      </div>
    </section>
  );
}

/** Shared site footer: slim bar + bushes landscape. */
export function SiteFooter({ active }: SiteFooterProps) {
  return (
    <>
      <FooterBar active={active} />
      <Landscape />
    </>
  );
}
