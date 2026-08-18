import React, { useEffect, useCallback, useRef } from 'react';
import { playConvergenceWhoosh, playCrystallineSnapLock } from '@/lib/brandSoundEngine';
import { ArrowRight } from 'lucide-react';

interface CinematicSplashScreenProps {
  onComplete?: () => void;
  enableSound?: boolean;
}

export const CinematicSplashScreen: React.FC<CinematicSplashScreenProps> = ({
  onComplete,
  enableSound = true,
}) => {
  const isExitingRef = useRef(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = useCallback(() => {
    stageTimersRef.current.forEach(clearTimeout);
    stageTimersRef.current = [];
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const handleExit = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    clearAllTimers();
    onComplete?.();
  }, [onComplete, clearAllTimers]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  useEffect(() => {
    // Check OS reduced motion preference or app-wide animations toggle
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion =
      mediaQuery.matches ||
      document.documentElement.classList.contains('vibegrid-no-anim') ||
      (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test');

    if (prefersReducedMotion) {
      const reducedMotionTimer = setTimeout(() => {
        if (isExitingRef.current) return;
        handleExit();
      }, 3000);
      stageTimersRef.current.push(reducedMotionTimer);
      return () => clearTimeout(reducedMotionTimer);
    }

    // Sound sync 1: Initial side bracket whoosh
    const s1 = setTimeout(() => {
      if (isExitingRef.current) return;
      if (enableSound) playConvergenceWhoosh(0.25);
    }, 150);

    // Sound sync 2: Crystalline snap lock when cards converge & pop
    const s2 = setTimeout(() => {
      if (isExitingRef.current) return;
      if (enableSound) playCrystallineSnapLock(0.4);
    }, 2200);

    // Auto-advance after complete 7.0s sequence
    const completeTimer = setTimeout(() => {
      if (isExitingRef.current) return;
      handleExit();
    }, 7000);

    stageTimersRef.current = [s1, s2, completeTimer];

    return () => {
      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(completeTimer);
    };
  }, [enableSound, handleExit]);

  // Keyboard skip listener (Space, Enter, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' ||
        e.key === 'Enter' ||
        e.key === ' ' ||
        e.key === 'Space' ||
        e.key === 'Spacebar' ||
        e.code === 'Space'
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleExit]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="VibeGrid Launch Screen"
      onClick={handleExit}
      className="splash select-none cursor-pointer"
    >
      <div className="logo-container">
        {/* Soft glow behind logo */}
        <div className="logo-glow" />

        {/* SVG LOGO */}
        <svg
          className="logo"
          viewBox="0 0 300 300"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/*
              STEP 1: Four corner/sides appear
          */}
          <path
            className="side side-1"
            d="M55 90 V60 Q55 45 70 45 H100"
          />
          <path
            className="side side-2"
            d="M200 45 H230 Q245 45 245 60 V90"
          />
          <path
            className="side side-3"
            d="M55 210 V240 Q55 255 70 255 H100"
          />
          <path
            className="side side-4"
            d="M200 255 H230 Q245 255 245 240 V210"
          />

          {/*
              STEP 2: Circle draws around cards
          */}
          <circle
            className="circle"
            cx="150"
            cy="150"
            r="105"
          />

          {/*
              STEP 3: Four cards flying from 4 directions
          */}
          <rect
            className="card card-1"
            x="108"
            y="108"
            width="34"
            height="34"
            rx="9"
          />
          <rect
            className="card card-2"
            x="158"
            y="108"
            width="34"
            height="34"
            rx="9"
          />
          <rect
            className="card card-3"
            x="108"
            y="158"
            width="34"
            height="34"
            rx="9"
          />
          <rect
            className="card card-4"
            x="158"
            y="158"
            width="34"
            height="34"
            rx="9"
          />
        </svg>
      </div>

      {/* BRAND */}
      <div className="brand">
        <span className="vibe">Vibe</span>
        <span className="grid">Grid</span>
      </div>

      {/* Small glow line */}
      <div className="underline" />

      {/* Skip affordance badge at bottom */}
      <div className="absolute bottom-8 z-10 flex items-center gap-2 text-[11px] font-mono text-white/40 opacity-70 hover:opacity-100 transition-opacity">
        <span>Press</span>
        <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] font-mono text-[10px] text-white/90">Space</kbd>
        <span>or</span>
        <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] font-mono text-[10px] text-white/90">Esc</kbd>
        <span>to skip</span>
        <ArrowRight className="w-3 h-3 text-violet-400 ml-0.5" />
      </div>
    </div>
  );
};
