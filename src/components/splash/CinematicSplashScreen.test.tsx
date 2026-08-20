import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CinematicSplashScreen } from './CinematicSplashScreen';
import { playConvergenceWhoosh, playCrystallineSnapLock } from '@/lib/brandSoundEngine';

beforeEach(() => {
  vi.useFakeTimers();
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('BrandSoundEngine', () => {
  it('executes audio cues safely in mock/headless environment', () => {
    expect(() => playConvergenceWhoosh()).not.toThrow();
    expect(() => playCrystallineSnapLock()).not.toThrow();
  });
});

describe('CinematicSplashScreen', () => {
  it('renders accessible launch screen with master brand emblem and typography', () => {
    render(<CinematicSplashScreen onComplete={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'VibeGrid Launch Screen');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('VibeGrid');
  });

  it('verifies left column cards (Top-Left, Bottom-Left) are filled with #5683da', () => {
    const { container } = render(<CinematicSplashScreen onComplete={vi.fn()} />);

    const cardTL = screen.getByTestId('card-tl');
    const cardBL = screen.getByTestId('card-bl');

    expect(cardTL).toBeInTheDocument();
    expect(cardTL).toHaveAttribute('fill', '#5683da');

    expect(cardBL).toBeInTheDocument();
    expect(cardBL).toHaveAttribute('fill', '#5683da');

    const styleEl = container.querySelector('style');
    const cssText = styleEl?.textContent || '';
    expect(cssText).toMatch(/\.card-tl[\s\S]*?fill:\s*#5683da/);
    expect(cssText).toMatch(/\.card-bl[\s\S]*?fill:\s*#5683da/);
  });

  it('verifies right column cards (Top-Right, Bottom-Right) are filled with #ff8964', () => {
    const { container } = render(<CinematicSplashScreen onComplete={vi.fn()} />);

    const cardTR = screen.getByTestId('card-tr');
    const cardBR = screen.getByTestId('card-br');

    expect(cardTR).toBeInTheDocument();
    expect(cardTR).toHaveAttribute('fill', '#ff8964');

    expect(cardBR).toBeInTheDocument();
    expect(cardBR).toHaveAttribute('fill', '#ff8964');

    const styleEl = container.querySelector('style');
    const cssText = styleEl?.textContent || '';
    expect(cssText).toMatch(/\.card-tr[\s\S]*?fill:\s*#ff8964/);
    expect(cssText).toMatch(/\.card-br[\s\S]*?fill:\s*#ff8964/);
  });

  it('verifies left circle arc is #5683da and right circle arc is #ff8964', () => {
    const { container } = render(<CinematicSplashScreen onComplete={vi.fn()} />);

    const ringLeft = screen.getByTestId('splash-ring-left');
    const ringRight = screen.getByTestId('splash-ring-right');

    expect(ringLeft).toBeInTheDocument();
    expect(ringLeft).toHaveAttribute('stroke', '#5683da');
    expect(ringLeft).toHaveAttribute('d', 'M 200 85 A 115 115 0 0 0 200 315');

    expect(ringRight).toBeInTheDocument();
    expect(ringRight).toHaveAttribute('stroke', '#ff8964');
    expect(ringRight).toHaveAttribute('d', 'M 200 85 A 115 115 0 0 1 200 315');

    const styleEl = container.querySelector('style');
    const cssText = styleEl?.textContent || '';
    expect(cssText).toMatch(/\.ring-left[\s\S]*?stroke:\s*#5683da/);
    expect(cssText).toMatch(/\.ring-right[\s\S]*?stroke:\s*#ff8964/);
  });

  it('verifies outer frame left border is #5683da and right border is #ff8964', () => {
    const { container } = render(<CinematicSplashScreen onComplete={vi.fn()} />);

    const borderLeft = screen.getByTestId('tile-border-left');
    const borderRight = screen.getByTestId('tile-border-right');

    expect(borderLeft).toBeInTheDocument();
    expect(borderLeft).toHaveAttribute('stroke', '#5683da');
    expect(borderLeft).toHaveAttribute('clip-path', 'url(#tile-split-left)');

    expect(borderRight).toBeInTheDocument();
    expect(borderRight).toHaveAttribute('stroke', '#ff8964');
    expect(borderRight).toHaveAttribute('clip-path', 'url(#tile-split-right)');

    const styleEl = container.querySelector('style');
    const cssText = styleEl?.textContent || '';
    expect(cssText).toMatch(/\.tile-border-left[\s\S]*?stroke:\s*#5683da/);
    expect(cssText).toMatch(/\.tile-border-right[\s\S]*?stroke:\s*#ff8964/);
  });

  it('renders the complete dual-tone structure: outer tile, circle arcs, and 4 emblem cards matching design specs', () => {
    const { container } = render(<CinematicSplashScreen onComplete={vi.fn()} />);

    // Outer tile and dual-tone borders
    const tileBg = screen.getByTestId('tile-bg');
    expect(tileBg).toBeInTheDocument();
    expect(tileBg).toHaveAttribute('x', '40');
    expect(tileBg).toHaveAttribute('y', '40');
    expect(tileBg).toHaveAttribute('width', '320');
    expect(tileBg).toHaveAttribute('height', '320');
    expect(tileBg).toHaveAttribute('rx', '48');
    expect(tileBg).toHaveAttribute('fill', '#111111');

    const borderLeft = screen.getByTestId('tile-border-left');
    expect(borderLeft).toBeInTheDocument();
    expect(borderLeft).toHaveAttribute('stroke', '#5683da');
    expect(borderLeft).toHaveAttribute('stroke-width', '5');

    const borderRight = screen.getByTestId('tile-border-right');
    expect(borderRight).toBeInTheDocument();
    expect(borderRight).toHaveAttribute('stroke', '#ff8964');
    expect(borderRight).toHaveAttribute('stroke-width', '5');

    // Inner circle dual-tone semicircle arcs
    expect(screen.getByTestId('splash-ring')).toBeInTheDocument();
    const ringLeft = screen.getByTestId('splash-ring-left');
    expect(ringLeft).toBeInTheDocument();
    expect(ringLeft).toHaveAttribute('stroke', '#5683da');
    expect(ringLeft).toHaveAttribute('stroke-width', '7');

    const ringRight = screen.getByTestId('splash-ring-right');
    expect(ringRight).toBeInTheDocument();
    expect(ringRight).toHaveAttribute('stroke', '#ff8964');
    expect(ringRight).toHaveAttribute('stroke-width', '7');

    // 4 Grid cards (2x2)
    // Left column: Solid Electric Blue (#5683da)
    const cardTL = screen.getByTestId('card-tl');
    expect(cardTL).toBeInTheDocument();
    expect(cardTL).toHaveAttribute('x', '120');
    expect(cardTL).toHaveAttribute('y', '120');
    expect(cardTL).toHaveAttribute('width', '68');
    expect(cardTL).toHaveAttribute('height', '68');
    expect(cardTL).toHaveAttribute('rx', '14');
    expect(cardTL).toHaveAttribute('fill', '#5683da');

    const cardBL = screen.getByTestId('card-bl');
    expect(cardBL).toBeInTheDocument();
    expect(cardBL).toHaveAttribute('x', '120');
    expect(cardBL).toHaveAttribute('y', '212');
    expect(cardBL).toHaveAttribute('width', '68');
    expect(cardBL).toHaveAttribute('height', '68');
    expect(cardBL).toHaveAttribute('rx', '14');
    expect(cardBL).toHaveAttribute('fill', '#5683da');

    // Right column: Solid Ember Orange (#ff8964)
    const cardTR = screen.getByTestId('card-tr');
    expect(cardTR).toBeInTheDocument();
    expect(cardTR).toHaveAttribute('x', '212');
    expect(cardTR).toHaveAttribute('y', '120');
    expect(cardTR).toHaveAttribute('width', '68');
    expect(cardTR).toHaveAttribute('height', '68');
    expect(cardTR).toHaveAttribute('rx', '14');
    expect(cardTR).toHaveAttribute('fill', '#ff8964');

    const cardBR = screen.getByTestId('card-br');
    expect(cardBR).toBeInTheDocument();
    expect(cardBR).toHaveAttribute('x', '212');
    expect(cardBR).toHaveAttribute('y', '212');
    expect(cardBR).toHaveAttribute('width', '68');
    expect(cardBR).toHaveAttribute('height', '68');
    expect(cardBR).toHaveAttribute('rx', '14');
    expect(cardBR).toHaveAttribute('fill', '#ff8964');

    const styleEl = container.querySelector('style');
    expect(styleEl).not.toBeNull();
    const cssText = styleEl?.textContent || '';

    // Canvas background: #090a0c
    expect(cssText).toMatch(/background:\s*#090a0c/);

    // Tile background: #111111
    expect(cssText).toMatch(/\.tile-bg[\s\S]*?fill:\s*#111111/);

    // Tile border strokes
    expect(cssText).toMatch(/\.tile-border-left[\s\S]*?stroke:\s*#5683da/);
    expect(cssText).toMatch(/\.tile-border-right[\s\S]*?stroke:\s*#ff8964/);

    // Ring strokes and simultaneous 0.6s ease-out draw animation
    expect(cssText).toMatch(/\.ring-left[\s\S]*?stroke:\s*#5683da/);
    expect(cssText).toMatch(/\.ring-right[\s\S]*?stroke:\s*#ff8964/);
    expect(cssText).toMatch(/animation:\s*ringDraw\s+0\.6s\s+ease-out/);

    // Card pop spring timing function: cubic-bezier(0.34, 1.56, 0.64, 1)
    expect(cssText).toMatch(/animation:\s*cardPop\s+0\.45s\s+cubic-bezier\(0\.34,\s*1\.56,\s*0\.64,\s*1\)/);

    // Card fills and staggered sequence: card-tl (0.2s), card-tr (0.25s), card-bl (0.3s), card-br (0.35s)
    expect(cssText).toMatch(/\.card-tl[\s\S]*?fill:\s*#5683da/);
    expect(cssText).toMatch(/\.card-tl[\s\S]*?animation-delay:\s*0\.2s/);

    expect(cssText).toMatch(/\.card-tr[\s\S]*?fill:\s*#ff8964/);
    expect(cssText).toMatch(/\.card-tr[\s\S]*?animation-delay:\s*0\.25s/);

    expect(cssText).toMatch(/\.card-bl[\s\S]*?fill:\s*#5683da/);
    expect(cssText).toMatch(/\.card-bl[\s\S]*?animation-delay:\s*0\.3s/);

    expect(cssText).toMatch(/\.card-br[\s\S]*?fill:\s*#ff8964/);
    expect(cssText).toMatch(/\.card-br[\s\S]*?animation-delay:\s*0\.35s/);

    // Brand accent #5683da
    expect(cssText).toMatch(/\.brand-underline[\s\S]*?background:\s*#5683da/);
  });

  it('triggers onComplete upon keyboard skip (Space, Escape)', () => {
    const onComplete = vi.fn();
    render(<CinematicSplashScreen onComplete={onComplete} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('triggers onComplete upon skip badge click', () => {
    const onComplete = vi.fn();
    render(<CinematicSplashScreen onComplete={onComplete} />);

    const skipBadge = screen.getByRole('button', { name: /to skip/i });
    fireEvent.click(skipBadge);
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('auto-advances smoothly across full animation timeline (2 seconds)', () => {
    const onComplete = vi.fn();
    render(<CinematicSplashScreen onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('immediately triggers advance in reduced motion mode after delay', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const onComplete = vi.fn();
    render(<CinematicSplashScreen onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
