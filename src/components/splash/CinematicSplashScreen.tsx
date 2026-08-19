import React, { useEffect, useCallback, useRef, useState } from 'react';
import { playConvergenceWhoosh, playCrystallineSnapLock } from '@/lib/brandSoundEngine';

interface CinematicSplashScreenProps {
  onComplete?: () => void;
  enableSound?: boolean;
}

export const CinematicSplashScreen: React.FC<CinematicSplashScreenProps> = ({
  onComplete,
  enableSound = true,
}) => {
  const [isFading, setIsFading] = useState(false);
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
    setIsFading(true);
    exitTimerRef.current = setTimeout(() => {
      onComplete?.();
    }, 500);
  }, [onComplete, clearAllTimers]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion =
      mediaQuery.matches ||
      document.documentElement.classList.contains('vibegrid-no-anim');

    if (prefersReducedMotion) {
      const reducedMotionTimer = setTimeout(() => {
        if (isExitingRef.current) return;
        handleExit();
      }, 3000);
      stageTimersRef.current.push(reducedMotionTimer);
      return () => clearTimeout(reducedMotionTimer);
    }

    const s1 = setTimeout(() => {
      if (isExitingRef.current) return;
      if (enableSound) playConvergenceWhoosh(0.25);
    }, 150);

    const s2 = setTimeout(() => {
      if (isExitingRef.current) return;
      if (enableSound) playCrystallineSnapLock(0.4);
    }, 2200);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key === 'Space' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleExit]);

  const brandText = "VibeGrid".split('').map((ch, i) => (
    <span key={i} style={{ '--i': i } as React.CSSProperties}>{ch}</span>
  ));

  return (
    <div 
      className="vibegrid-splash-root"
      role="status"
      aria-live="polite"
      aria-label="VibeGrid Launch Screen"
      onClick={handleExit}
      style={{
        transition: 'opacity 0.5s ease',
        opacity: isFading ? 0 : 1,
        pointerEvents: isFading ? 'none' : 'auto',
      }}
    >
      <style>{`
        .vibegrid-splash-root {
          --white: #ffffff;

          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          /* Pure Black Background */
          background: radial-gradient(circle at 50% 42%, #0a0a0a 0%, #000000 70%);
          font-family: 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif;
          overflow: hidden;
          cursor: pointer;
        }

        .vibegrid-splash-root .ambient-glow {
          position: absolute;
          top: 50%; left: 50%;
          width: min(70vmin, 520px); height: min(70vmin, 520px);
          transform: translate(-50%,-50%) scale(0.8);
          background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 68%);
          opacity: 0;
          filter: blur(12px);
          animation: glowBloom 2.6s ease-out 1.9s forwards, glowBreathe 3.4s ease-in-out 4.5s infinite;
          pointer-events: none;
        }

        .vibegrid-splash-root .icon-stage {
          width: min(46vmin, 260px);
          height: min(46vmin, 260px);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vibegrid-splash-root .icon-svg { 
          width: 100%; height: 100%; overflow: visible; 
        }

        /* Glassmorphism Cards */
        .vibegrid-splash-root .card {
          opacity: 0;
          fill: url(#glassGrad);
          stroke: rgba(255,255,255,0.9);
          stroke-width: 2;
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.8));
          transform-box: fill-box;
          transform-origin: center;
        }
        
        .vibegrid-splash-root .card-tl { animation: flyTL 0.85s cubic-bezier(.2,.7,.2,1) 0.15s forwards; }
        .vibegrid-splash-root .card-tr { animation: flyTR 0.85s cubic-bezier(.2,.7,.2,1) 0.32s forwards; }
        .vibegrid-splash-root .card-bl { animation: flyBL 0.85s cubic-bezier(.2,.7,.2,1) 0.49s forwards; }
        .vibegrid-splash-root .card-br { animation: flyBR 0.85s cubic-bezier(.2,.7,.2,1) 0.66s forwards; }

        @keyframes flyTL { from { transform: translate(-70vw,-70vh) rotate(-30deg); opacity: 0; } to { transform: translate(0,0) rotate(0); opacity: 1; } }
        @keyframes flyTR { from { transform: translate(70vw,-70vh) rotate(30deg); opacity: 0; } to { transform: translate(0,0) rotate(0); opacity: 1; } }
        @keyframes flyBL { from { transform: translate(-70vw,70vh) rotate(30deg); opacity: 0; } to { transform: translate(0,0) rotate(0); opacity: 1; } }
        @keyframes flyBR { from { transform: translate(70vw,70vh) rotate(-30deg); opacity: 0; } to { transform: translate(0,0) rotate(0); opacity: 1; } }

        /* Ring Animation (Hardcoded circumference 974 for r=155) */
        .vibegrid-splash-root .ring {
          fill: none;
          stroke: url(#neonGrad);
          stroke-width: 10;
          stroke-linecap: round;
          stroke-dasharray: 974;
          stroke-dashoffset: 974;
          opacity: 0;
          filter: drop-shadow(0 0 8px rgba(255,255,255,0.2));
          transform-box: fill-box;
          transform-origin: center;
          animation: ringClose 1s cubic-bezier(.32,1.5,.55,1) 1.15s forwards;
        }
        @keyframes ringClose {
          0%   { stroke-dashoffset: 974; opacity: 0; transform: scale(.82) rotate(-90deg); }
          55%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; transform: scale(1) rotate(-90deg); }
        }

        /* Brand Container Flex Fix */
        .vibegrid-splash-root .brand {
          margin-top: clamp(20px, 4vh, 34px);
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .vibegrid-splash-root .brand-text {
          margin: 0;
          display: flex;
          justify-content: center;
          font-size: clamp(26px, 4.4vw, 40px);
          font-weight: 700;
          letter-spacing: 0.04em;
          color: var(--white);
          position: relative;
          overflow: hidden;
        }

        .vibegrid-splash-root .brand-text span {
          display: inline-block;
          opacity: 0;
          transform: translateY(16px);
          animation: letterUp 0.55s ease-out forwards;
          animation-delay: calc(2.15s + (var(--i) * 0.045s));
        }
        
        @keyframes letterUp { to { opacity: 1; transform: translateY(0); } }

        .vibegrid-splash-root .brand-underline {
          height: 2px;
          width: 0;
          margin-top: 10px; /* Removed auto, flex handles centering */
          background: linear-gradient(90deg, transparent, var(--white), transparent);
          box-shadow: 0 0 10px rgba(255,255,255,0.5);
          animation: underlineDraw 0.7s ease-out 2.55s forwards;
        }
        @keyframes underlineDraw { to { width: 190px; } }

        /* Dimmed Glow Animations */
        @keyframes glowBloom { to { opacity: 0.5; transform: translate(-50%,-50%) scale(1); } }
        @keyframes glowBreathe { 0%,100% { opacity: 0.4; } 50% { opacity: 0.2; } }

        .vibegrid-splash-root .skip-badge {
          position: absolute;
          bottom: 32px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          color: rgba(255,255,255,0.4);
          opacity: 0.7;
          transition: opacity 0.2s;
          cursor: pointer;
        }
        .vibegrid-splash-root .skip-badge:hover {
          opacity: 1;
        }
        .vibegrid-splash-root .skip-badge kbd {
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 10px;
          color: rgba(255,255,255,0.9);
        }

        @media (prefers-reduced-motion: reduce) {
          .vibegrid-splash-root .card, .vibegrid-splash-root .ring, .vibegrid-splash-root .brand-text span, .vibegrid-splash-root .brand-underline, .vibegrid-splash-root .ambient-glow {
            animation-duration: 0.01s !important;
            animation-delay: 0s !important;
            transform: none !important;
            opacity: 1 !important;
            stroke-dashoffset: 0 !important;
            width: 190px !important;
          }
        }
      `}</style>

      <div className="ambient-glow"></div>

      <div className="icon-stage">
        <svg className="icon-svg" viewBox="0 0 400 400">
          <defs>
            {/* Glass Gradient for Cards */}
            <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
            </linearGradient>
            
            {/* Neon Gradient for Ring */}
            <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
            </linearGradient>
          </defs>

          <circle className="ring" cx="200" cy="200" r="155" />
          
          <rect className="card card-tl" x="108" y="108" width="84" height="84" rx="18" />
          <rect className="card card-tr" x="208" y="108" width="84" height="84" rx="18" />
          <rect className="card card-bl" x="108" y="208" width="84" height="84" rx="18" />
          <rect className="card card-br" x="208" y="208" width="84" height="84" rx="18" />
        </svg>
      </div>

      <div className="brand">
        <h1 className="brand-text">{brandText}</h1>
        <div className="brand-underline"></div>
      </div>

      <div className="skip-badge" onClick={handleExit} role="button" tabIndex={0}>
        <span>Press</span>
        <kbd>Space</kbd>
        <span>or</span>
        <kbd>Esc</kbd>
        <span>to skip</span>
      </div>
    </div>
  );
};