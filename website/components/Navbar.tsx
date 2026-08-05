'use client';

interface NavbarProps {
  /** Which page is currently active (controls the About link highlight). */
  active?: 'home' | 'about';
}

const SECTION_LINKS = ['Desktop', 'CLI', 'Workspaces', 'Themes'];

/** VibeGrid logo mark (2×2 pane grid). */
function LogoMark() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-forest text-white shadow-[0_0_18px_rgba(11,107,196,0.55)]">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.9"/>
        <rect x="9" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.2"/>
      </svg>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

/** Fixed top navbar, identical across every page. */
export function Navbar({ active }: NavbarProps) {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-black/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">

        {/* Logo */}
        <a href="/" className="flex shrink-0 items-center gap-2.5 hover:opacity-80 transition-opacity">
          <LogoMark />
          <span className="text-sm font-medium text-white/90 tracking-tight">VibeGrid</span>
        </a>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {SECTION_LINKS.map((item) => (
            <a key={item} href={`/#${item.toLowerCase()}`}
              className="rounded-md px-3 py-1.5 text-[13.5px] text-white/55 transition-colors hover:text-white hover:bg-white/5">
              {item}
            </a>
          ))}
          <a href="/about" aria-current={active === 'about' ? 'page' : undefined}
            className={`rounded-md px-3 py-1.5 text-[13.5px] transition-colors hover:bg-white/5 ${active === 'about' ? 'text-white' : 'text-white/55 hover:text-white'}`}>
            About
          </a>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2.5">
          <a href="https://github.com/abuzarkhan1/VibeGrid" target="_blank" rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] text-white/70 transition-colors hover:border-white/20 hover:text-white sm:flex">
            <GithubIcon />
            <span>Star us</span>
          </a>
          <a href="/#download"
            className="rounded-md bg-forest px-3.5 py-1.5 text-[13px] font-medium text-white transition-all hover:bg-forest-bright hover:shadow-[0_0_16px_rgba(60,149,240,0.4)] vg-install-glow">
            Download
          </a>
        </div>
      </div>
    </header>
  );
}
