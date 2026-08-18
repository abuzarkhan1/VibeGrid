import React from 'react';

export type BrandEmblemPhase = 'spawn' | 'converge' | 'locked' | 'revealed' | 'exiting';

export interface BrandEmblemProps {
  size?: number;
  className?: string;
  isAssembled?: boolean;
  phase?: BrandEmblemPhase;
  showBackdrop?: boolean;
}

export const BrandEmblem: React.FC<BrandEmblemProps> = ({
  size = 120,
  className = '',
  isAssembled = true,
  phase,
}) => {
  const currentPhase: BrandEmblemPhase = phase ?? (isAssembled ? 'locked' : 'spawn');
  const isSpawn = currentPhase === 'spawn';
  const isConverging = currentPhase === 'converge';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label="VibeGrid Brand Emblem"
      role="img"
    >
      <svg
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_12px_36px_rgba(0,0,0,0.8)] filter"
      >
        <defs>
          <filter id="vibe-card-shadow" x="-20%" y="-20%" width="140%" height="140%">
            {/* Black shadow for depth */}
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* 1. Four corner / side bracket lines (Pure White) */}
        <path
          className="side side-1"
          d="M55 90 V60 Q55 45 70 45 H100"
          style={{ strokeDashoffset: isSpawn ? 55 : isConverging ? 10 : 0, stroke: '#ffffff' }}
        />
        <path
          className="side side-2"
          d="M200 45 H230 Q245 45 245 60 V90"
          style={{ strokeDashoffset: isSpawn ? 55 : isConverging ? 10 : 0, stroke: '#ffffff' }}
        />
        <path
          className="side side-3"
          d="M55 210 V240 Q55 255 70 255 H100"
          style={{ strokeDashoffset: isSpawn ? 55 : isConverging ? 10 : 0, stroke: '#ffffff' }}
        />
        <path
          className="side side-4"
          d="M200 255 H230 Q245 255 245 240 V210"
          style={{ strokeDashoffset: isSpawn ? 55 : isConverging ? 10 : 0, stroke: '#ffffff' }}
        />

        {/* 2. Central Circular Aperture Ring (Pure White) */}
        <circle
          className="circle"
          cx="150"
          cy="150"
          r="105"
          style={{ strokeDashoffset: isSpawn ? 660 : isConverging ? 80 : 0, stroke: '#ffffff' }}
        />

        {/* 3. Four 2x2 Rounded Square Cards (Pure White Fill) */}
        <rect
          className="card card-1"
          x="108"
          y="108"
          width="34"
          height="34"
          rx="9"
          style={{
            opacity: isSpawn ? 0 : 1,
            transform: isSpawn ? 'translate(-75px, -75px) scale(0.45)' : 'translate(0, 0) scale(1)',
            fill: '#ffffff',
          }}
        />
        <rect
          className="card card-2"
          x="158"
          y="108"
          width="34"
          height="34"
          rx="9"
          style={{
            opacity: isSpawn ? 0 : 1,
            transform: isSpawn ? 'translate(75px, -75px) scale(0.45)' : 'translate(0, 0) scale(1)',
            fill: '#ffffff',
          }}
        />
        <rect
          className="card card-3"
          x="108"
          y="158"
          width="34"
          height="34"
          rx="9"
          style={{
            opacity: isSpawn ? 0 : 1,
            transform: isSpawn ? 'translate(-75px, 75px) scale(0.45)' : 'translate(0, 0) scale(1)',
            fill: '#ffffff',
          }}
        />
        <rect
          className="card card-4"
          x="158"
          y="158"
          width="34"
          height="34"
          rx="9"
          style={{
            opacity: isSpawn ? 0 : 1,
            transform: isSpawn ? 'translate(75px, 75px) scale(0.45)' : 'translate(0, 0) scale(1)',
            fill: '#ffffff',
          }}
        />
      </svg>
    </div>
  );
};