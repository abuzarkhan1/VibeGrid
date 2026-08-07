'use client';

import React from 'react';

const CX = 800;
const CY = 380;
const CIRCLE_RADII = [140, 260, 400, 560, 740];
const ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const RADIUS = 850;

const GRID_RAYS = ANGLES.map((angle) => {
  const rad = (angle * Math.PI) / 180;
  return {
    x: Math.round(CX + RADIUS * Math.cos(rad)),
    y: Math.round(CY + RADIUS * Math.sin(rad)),
    angle,
  };
});

// Secondary intersection nodes around center ring
const SUB_NODES = [
  { x: CX + 260 * Math.cos((45 * Math.PI) / 180), y: CY + 260 * Math.sin((45 * Math.PI) / 180), label: 'Pane 01', delay: '0s' },
  { x: CX + 260 * Math.cos((135 * Math.PI) / 180), y: CY + 260 * Math.sin((135 * Math.PI) / 180), label: 'Pane 02', delay: '0.8s' },
  { x: CX + 260 * Math.cos((225 * Math.PI) / 180), y: CY + 260 * Math.sin((225 * Math.PI) / 180), label: 'Pane 03', delay: '1.6s' },
  { x: CX + 260 * Math.cos((315 * Math.PI) / 180), y: CY + 260 * Math.sin((315 * Math.PI) / 180), label: 'Pane 04', delay: '2.4s' },
];

export function GridRadarHero() {
  return (
    <svg
      viewBox="0 0 1600 860"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full select-none opacity-40"
    >
      <defs>
        <style>{`
          .grid-radar-scan-ring,
          .grid-ring-pulse-ring,
          .grid-core-dot,
          .subnode-pulse {
            transform-box: fill-box;
            transform-origin: center;
          }
          @keyframes grid-radar-scan {
            0% {
              transform: scale(0.0588);
              opacity: 0.7;
              stroke-width: 2px;
            }
            65% {
              opacity: 0.25;
            }
            100% {
              transform: scale(1);
              opacity: 0;
              stroke-width: 0.5px;
            }
          }
          @keyframes grid-ring-pulse {
            0%, 100% {
              transform: scale(0.5);
              opacity: 0.35;
              stroke-width: 1px;
            }
            50% {
              transform: scale(1);
              opacity: 0.85;
              stroke-width: 2px;
            }
          }
          @keyframes subnode-ring {
            0% {
              transform: scale(0.142);
              opacity: 0.9;
              stroke-width: 1px;
            }
            100% {
              transform: scale(1);
              opacity: 0;
              stroke-width: 0.5px;
            }
          }
          @keyframes grid-core-glow {
            0%, 100% {
              transform: scale(0.667);
              opacity: 0.9;
            }
            50% {
              transform: scale(1);
              opacity: 1;
            }
          }
          .grid-radar-scan-ring {
            animation: grid-radar-scan 5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
          }
          .grid-ring-pulse-ring {
            animation: grid-ring-pulse 3.5s ease-in-out infinite;
          }
          .grid-core-dot {
            animation: grid-core-glow 2.4s ease-in-out infinite;
          }
          .subnode-pulse {
            animation: subnode-ring 3s cubic-bezier(0, 0.2, 0.8, 1) infinite;
          }
        `}</style>

        <radialGradient id="heroGridGlow" cx="50%" cy="44%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.025" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="rayLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* Central Ambient Glow */}
      <circle cx={CX} cy={CY} r={650} fill="url(#heroGridGlow)" />

      {/* Concentric Signal Rings */}
      {CIRCLE_RADII.map((r, idx) => (
        <circle
          key={`circle-${r}`}
          cx={CX}
          cy={CY}
          r={r}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
          strokeDasharray={idx % 2 === 1 ? '4 4' : undefined}
          fill="none"
        />
      ))}

      {/* Animated Expanding Radar Pulse Ring */}
      <circle
        className="grid-radar-scan-ring"
        cx={CX}
        cy={CY}
        r={680}
        stroke="rgba(255, 255, 255, 0.4)"
        fill="none"
      />

      {/* Radial Network Grid Rays */}
      {GRID_RAYS.map((pt, i) => (
        <line
          key={`ray-${i}`}
          x1={CX}
          y1={CY}
          x2={pt.x}
          y2={pt.y}
          stroke="url(#rayLineGrad)"
          strokeWidth="1"
          strokeOpacity={i % 3 === 0 ? '0.2' : '0.08'}
        />
      ))}

      {/* Data Flow Packets moving along Rays */}
      {GRID_RAYS.map((pt, i) => {
        // Inward path
        const pathIn = `M ${pt.x},${pt.y} L ${CX},${CY}`;
        const dur = 3.2 + (i % 4) * 0.5;
        const delay = (i * 0.3) % 3;

        return (
          <g key={`flow-${i}`}>
            <circle r="2.5" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }}>
              <animateMotion
                dur={`${dur}s`}
                repeatCount="indefinite"
                path={pathIn}
                begin={`${delay}s`}
              />
            </circle>
          </g>
        );
      })}

      {/* Sub-node Intersection Rings */}
      {SUB_NODES.map((node, i) => (
        <g key={`subnode-${i}`}>
          <circle
            className="subnode-pulse"
            cx={node.x}
            cy={node.y}
            r={28}
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            style={{ animationDelay: node.delay }}
          />
          <circle
            cx={node.x}
            cy={node.y}
            r={3.5}
            fill="#FFFFFF"
            style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))' }}
          />
        </g>
      ))}

      {/* Center Core Node Signal Ring */}
      <circle
        className="grid-ring-pulse-ring"
        cx={CX}
        cy={CY}
        r={32}
        fill="none"
        stroke="rgba(255, 255, 255, 0.5)"
      />

      {/* Core Node Center Dot */}
      <circle
        className="grid-core-dot"
        cx={CX}
        cy={CY}
        r={9}
        fill="#FFFFFF"
        style={{ filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 1))' }}
      />
    </svg>
  );
}

