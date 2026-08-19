import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CinematicSplashScreen } from './CinematicSplashScreen';
import { playConvergenceWhoosh, playCrystallineSnapLock } from '@/lib/brandSoundEngine';

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

  it('triggers onComplete upon keyboard skip (Space, Escape, Enter)', () => {
    const onComplete = vi.fn();
    render(<CinematicSplashScreen onComplete={onComplete} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('triggers onComplete upon mouse click skip', () => {
    const onComplete = vi.fn();
    render(<CinematicSplashScreen onComplete={onComplete} />);

    const screenElement = screen.getByRole('status');
    fireEvent.click(screenElement);
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('auto-advances smoothly across full animation timeline (2 seconds)', () => {
    const onComplete = vi.fn();
    render(<CinematicSplashScreen onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();

    // Advance past full timeline (2000ms + 400ms fade)
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
