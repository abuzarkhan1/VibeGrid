import React, { useEffect, useCallback, useRef, useState } from 'react';

interface CinematicSplashScreenProps {
  onComplete?: () => void;
}

export const CinematicSplashScreen: React.FC<CinematicSplashScreenProps> = ({
  onComplete,
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
      }, 2000);
      stageTimersRef.current.push(reducedMotionTimer);
      return () => clearTimeout(reducedMotionTimer);
    }

    const completeTimer = setTimeout(() => {
      if (isExitingRef.current) return;
      handleExit();
    }, 2000);

    stageTimersRef.current.push(completeTimer);

    return () => {
      clearTimeout(completeTimer);
    };
  }, [handleExit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.code === 'Space') {
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
      style={{
        transition: 'opacity 0.5s ease',
        opacity: isFading ? 0 : 1,
        pointerEvents: isFading ? 'none' : 'auto',
      }}
    >
      <style>{`
        .vibegrid-splash-root {
          --iris: #5683da;
          --ember: #ff8964;
          --charcoal: #111111;
          --slate-edge: #4a4b50;
          --ash: #a9a9aa;
          --void: #090a0c;
          --obsidian: #303236;

          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #090a0c;
          font-family: 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif;
          overflow: hidden;
        }

        .vibegrid-splash-root .icon-stage {
          width: min(52vmin, 280px);
          height: min(52vmin, 280px);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vibegrid-splash-root .icon-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        /* Outer App Tile */
        .vibegrid-splash-root .tile-bg {
          fill: #111111;
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          filter: drop-shadow(0 14px 36px rgba(0, 0, 0, 0.65));
          animation: tilePop 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .vibegrid-splash-root .tile-border {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: tileBorderFade 0.55s ease-out 0.05s forwards;
        }

        .vibegrid-splash-root .tile-border-left,
        .vibegrid-splash-root .frame-left {
          stroke: #5683da;
          stroke-width: 5;
        }

        .vibegrid-splash-root .tile-border-right,
        .vibegrid-splash-root .frame-right {
          stroke: #ff8964;
          stroke-width: 5;
        }

        @keyframes tilePop {
          0% { opacity: 0; transform: scale(0.88); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes tileBorderFade {
          0% { opacity: 0; transform: scale(0.88); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* 1. Split Ring Entrance: Left Blue Arc & Right Orange Arc draw simultaneously (0.6s ease-out) */
        .vibegrid-splash-root .ring {
          fill: none;
          stroke-width: 7;
          stroke-linecap: round;
          stroke-dasharray: 362;
          stroke-dashoffset: 362;
          animation: ringDraw 0.6s ease-out forwards;
        }

        .vibegrid-splash-root .ring-left {
          stroke: #5683da;
        }

        .vibegrid-splash-root .ring-right {
          stroke: #ff8964;
        }

        @keyframes ringDraw {
          from {
            stroke-dashoffset: 362;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        /* 2. 4 Cards Pop In: Crisp Spring Effect cubic-bezier(0.34, 1.56, 0.64, 1) */
        .vibegrid-splash-root .card {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          stroke-width: 1.5;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
          animation: cardPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Blue cards (Top-Left & Bottom-Left) */
        .vibegrid-splash-root .card-tl {
          animation-delay: 0.2s;
          fill: #5683da;
          stroke: #5683da;
          stroke-width: 1.5;
        }
        .vibegrid-splash-root .card-bl {
          animation-delay: 0.3s;
          fill: #5683da;
          stroke: #5683da;
          stroke-width: 1.5;
        }

        /* Orange cards (Top-Right & Bottom-Right) */
        .vibegrid-splash-root .card-tr {
          animation-delay: 0.25s;
          fill: #ff8964;
          stroke: #ff8964;
          stroke-width: 1.5;
        }
        .vibegrid-splash-root .card-br {
          animation-delay: 0.35s;
          fill: #ff8964;
          stroke: #ff8964;
          stroke-width: 1.5;
        }

        @keyframes cardPop {
          0% {
            opacity: 0;
            transform: scale(0.6);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* 3. Brand Text with #5683da accent */
        .vibegrid-splash-root .brand {
          margin-top: 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .vibegrid-splash-root .brand-text {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #ffffff;
          margin: 0;
          display: flex;
        }

        .vibegrid-splash-root .brand-text span {
          display: inline-block;
          opacity: 0;
          transform: translateY(16px);
          animation: letterUp 0.35s ease-out forwards;
          animation-delay: calc(0.55s + (var(--i) * 0.035s));
        }

        @keyframes letterUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .vibegrid-splash-root .brand-underline {
          height: 2px;
          width: 0;
          margin-top: 10px;
          background: #5683da;
          animation: underlineDraw 0.45s ease-out 0.85s forwards;
        }

        @keyframes underlineDraw {
          to {
            width: 190px;
          }
        }

        /* Skip Badge Pill Button */
        .vibegrid-splash-root .skip-badge {
          position: absolute;
          bottom: 32px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          color: #a9a9aa;
          padding: 8px 16px;
          border-radius: 9999px;
          background: #111111;
          border: 1px solid #4a4b50;
          transition: all 0.2s ease;
          cursor: pointer;
          user-select: none;
        }
        .vibegrid-splash-root .skip-badge:hover {
          color: #ffffff;
          border-color: #5683da;
          background: #1a1c22;
          box-shadow: 0 0 12px rgba(86, 131, 218, 0.25);
        }
        .vibegrid-splash-root .skip-badge:active {
          transform: scale(0.96);
        }
        .vibegrid-splash-root .skip-badge kbd {
          padding: 2px 6px;
          border-radius: 4px;
          background: #303236;
          border: 1px solid #4a4b50;
          font-size: 10px;
          color: #ffffff;
        }

        @media (prefers-reduced-motion: reduce) {
          .vibegrid-splash-root .card,
          .vibegrid-splash-root .ring,
          .vibegrid-splash-root .tile-bg,
          .vibegrid-splash-root .tile-border,
          .vibegrid-splash-root .brand-text span,
          .vibegrid-splash-root .brand-underline {
            animation-duration: 0.01s !important;
            animation-delay: 0s !important;
            transform: none !important;
            opacity: 1 !important;
            stroke-dashoffset: 0 !important;
            width: 190px !important;
          }
        }
      `}</style>

      <div className="icon-stage" data-testid="splash-icon-stage">
        <svg className="icon-svg" viewBox="0 0 400 400" data-testid="splash-emblem">
          <defs>
            <clipPath id="tile-split-left">
              <rect x="0" y="0" width="200" height="400" />
            </clipPath>
            <clipPath id="tile-split-right">
              <rect x="200" y="0" width="200" height="400" />
            </clipPath>
          </defs>

          {/* 1. Outer App Tile / Frame */}
          <rect
            className="tile-bg"
            x="40"
            y="40"
            width="320"
            height="320"
            rx="48"
            fill="#111111"
            data-testid="tile-bg"
          />
          <rect
            className="tile-border tile-border-left frame-left"
            x="40"
            y="40"
            width="320"
            height="320"
            rx="48"
            fill="none"
            stroke="#5683da"
            strokeWidth="5"
            clipPath="url(#tile-split-left)"
            data-testid="tile-border-left"
          />
          <rect
            className="tile-border tile-border-right frame-right"
            x="40"
            y="40"
            width="320"
            height="320"
            rx="48"
            fill="none"
            stroke="#ff8964"
            strokeWidth="5"
            clipPath="url(#tile-split-right)"
            data-testid="tile-border-right"
          />

          {/* 2. Inner Circle (Dual-Tone Semicircle Arcs) */}
          <g className="ring-group" data-testid="splash-ring">
            <path
              className="ring ring-left"
              d="M 200 85 A 115 115 0 0 0 200 315"
              fill="none"
              stroke="#5683da"
              strokeWidth="7"
              strokeLinecap="round"
              data-testid="splash-ring-left"
            />
            <path
              className="ring ring-right"
              d="M 200 85 A 115 115 0 0 1 200 315"
              fill="none"
              stroke="#ff8964"
              strokeWidth="7"
              strokeLinecap="round"
              data-testid="splash-ring-right"
            />
          </g>

          {/* 3. Inner 4 Grid Cards (2x2) */}
          {/* Left Column (Solid Electric Blue #5683da) */}
          <rect
            className="card card-tl"
            x="120"
            y="120"
            width="68"
            height="68"
            rx="14"
            fill="#5683da"
            stroke="#5683da"
            strokeWidth="1.5"
            data-testid="card-tl"
          />
          <rect
            className="card card-bl"
            x="120"
            y="212"
            width="68"
            height="68"
            rx="14"
            fill="#5683da"
            stroke="#5683da"
            strokeWidth="1.5"
            data-testid="card-bl"
          />

          {/* Right Column (Solid Ember Orange #ff8964) */}
          <rect
            className="card card-tr"
            x="212"
            y="120"
            width="68"
            height="68"
            rx="14"
            fill="#ff8964"
            stroke="#ff8964"
            strokeWidth="1.5"
            data-testid="card-tr"
          />
          <rect
            className="card card-br"
            x="212"
            y="212"
            width="68"
            height="68"
            rx="14"
            fill="#ff8964"
            stroke="#ff8964"
            strokeWidth="1.5"
            data-testid="card-br"
          />
        </svg>
      </div>

      <div className="brand">
        <h1 className="brand-text">{brandText}</h1>
        <div className="brand-underline"></div>
      </div>

      <div
        className="skip-badge"
        onClick={handleExit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
            e.preventDefault();
            handleExit();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Press Space or Esc to skip"
      >
        <span>Press</span>
        <kbd>Space</kbd>
        <span>or</span>
        <kbd>Esc</kbd>
        <span>to skip</span>
      </div>
    </div>
  );
};
