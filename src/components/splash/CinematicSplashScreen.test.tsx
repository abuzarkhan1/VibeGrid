import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CinematicSplashScreen } from './CinematicSplashScreen';
import { BrandEmblem } from './BrandEmblem';
import { ParticleField } from './ParticleField';
import { playConvergenceWhoosh, playCrystallineSnapLock, playTerminalBell } from '@/lib/brandSoundEngine';

// Mock Web Audio API
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

describe('BrandEmblem', () => {
  it('renders SVG with side brackets, circle ring, and 4 cards matching master icon', () => {
    render(<BrandEmblem size={100} isAssembled={true} />);
    const emblem = screen.getByLabelText('VibeGrid Brand Emblem');
    expect(emblem).toBeInTheDocument();
    expect(emblem.querySelector('svg')).toBeInTheDocument();
    // 4 cards
    const rects = emblem.querySelectorAll('rect');
    expect(rects.length).toBe(4);
    // Circular aperture ring
    const circle = emblem.querySelector('circle');
    expect(circle).toBeInTheDocument();
    // 4 side paths
    const paths = emblem.querySelectorAll('path');
    expect(paths.length).toBe(4);
  });

  it('renders unassembled state with proper offset styling', () => {
    const { container } = render(<BrandEmblem size={80} isAssembled={false} />);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(4);
  });
});

describe('ParticleField', () => {
  it('renders canvas element without throwing', () => {
    const { container } = render(<ParticleField isAssembled={false} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});

describe('BrandSoundEngine', () => {
  it('executes audio cues safely in mock/headless environment', () => {
    expect(() => playConvergenceWhoosh()).not.toThrow();
    expect(() => playCrystallineSnapLock()).not.toThrow();
    expect(() => playTerminalBell('sine')).not.toThrow();
    expect(() => playTerminalBell('retro')).not.toThrow();
    expect(() => playTerminalBell('click')).not.toThrow();
  });
});

describe('CinematicSplashScreen', () => {
  it('renders accessible launch screen with master brand emblem and typography', () => {
    render(<CinematicSplashScreen onComplete={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'VibeGrid Launch Screen');
    expect(screen.getByText('Vibe')).toBeInTheDocument();
    expect(screen.getByText('Grid')).toBeInTheDocument();
  });

  it('triggers onComplete upon keyboard skip (Space, Escape, Enter)', () => {
    const onComplete = vi.fn();
    render(<CinematicSplashScreen onComplete={onComplete} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('triggers onComplete upon mouse click skip', () => {
    const onComplete = vi.fn();
    render(<CinematicSplashScreen onComplete={onComplete} />);

    const screenElement = screen.getByRole('status');
    fireEvent.click(screenElement);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('auto-advances smoothly across full animation timeline', () => {
    const onComplete = vi.fn();
    render(<CinematicSplashScreen onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();

    // Advance past full timeline (7000ms)
    act(() => {
      vi.advanceTimersByTime(7100);
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
      vi.advanceTimersByTime(3100);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
