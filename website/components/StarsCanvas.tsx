'use client';

import React from 'react';

/* ─── Stars data (same across landing & about heroes) ─── */
const STARS = [
  { left: '84.18%', top: '8.85%', w: 2, min: 0.5, max: 1, glow: '4px', dur: '5.949s', delay: '0.101s' },
  { left: '8.42%', top: '51.41%', w: 3, min: 0.5, max: 1, glow: '5px', dur: '5.516s', delay: '1.879s' },
  { left: '21.10%', top: '22.89%', w: 3, min: 0.5, max: 1, glow: '5px', dur: '3.545s', delay: '1.894s' },
  { left: '26.15%', top: '7.74%', w: 3, min: 0.5, max: 1, glow: '5px', dur: '4.636s', delay: '2.575s' },
  { left: '26.46%', top: '66.14%', w: 3, min: 0.5, max: 1, glow: '5px', dur: '4.070s', delay: '4.793s' },
  { left: '89.21%', top: '3.14%', w: 3, min: 0.5, max: 1, glow: '5px', dur: '5.912s', delay: '1.773s' },
  { left: '55.25%', top: '55.31%', w: 2, min: 0.5, max: 1, glow: '4px', dur: '5.115s', delay: '0.597s' },
  { left: '32.67%', top: '22.03%', w: 3, min: 0.5, max: 1, glow: '5px', dur: '4.444s', delay: '2.224s' },
  { left: '76.28%', top: '73.86%', w: 3, min: 0.5, max: 1, glow: '5px', dur: '4.523s', delay: '2.250s' },
  { left: '5.32%', top: '71.79%', w: 2, min: 0.5, max: 1, glow: '4px', dur: '4.107s', delay: '2.597s' },
  { left: '12.38%', top: '12.62%', w: 2, min: 0.5, max: 1, glow: '4px', dur: '6.023s', delay: '0.312s' },
  { left: '63.11%', top: '18.44%', w: 3, min: 0.5, max: 1, glow: '5px', dur: '3.882s', delay: '3.107s' },
  { left: '47.55%', top: '44.22%', w: 2, min: 0.5, max: 1, glow: '4px', dur: '5.331s', delay: '1.450s' },
  { left: '38.90%', top: '35.67%', w: 3, min: 0.5, max: 1, glow: '5px', dur: '4.788s', delay: '0.820s' },
  { left: '72.44%', top: '60.19%', w: 2, min: 0.5, max: 1, glow: '4px', dur: '5.673s', delay: '3.995s' },
  { left: '18.72%', top: '82.55%', w: 3, min: 0.5, max: 1, glow: '5px', dur: '4.231s', delay: '2.040s' },
];

const SHOOTING_STARS = [
  { top: '8%', left: '6%', dx: '360px', dy: '190px', dur: '6s', delay: '0.5s' },
  { top: '14%', left: '52%', dx: '420px', dy: '220px', dur: '7s', delay: '2.2s' },
  { top: '22%', left: '78%', dx: '320px', dy: '170px', dur: '6.5s', delay: '4s' },
  { top: '30%', left: '20%', dx: '460px', dy: '250px', dur: '8s', delay: '1.4s' },
  { top: '38%', left: '64%', dx: '380px', dy: '200px', dur: '7.5s', delay: '3.3s' },
  { top: '46%', left: '34%', dx: '300px', dy: '160px', dur: '6.8s', delay: '5s' },
];

/** Twinkling + shooting star field. Place inside a `relative` hero. */
export function StarsCanvas() {
  return (
    <div className="vg-gpu pointer-events-none absolute inset-0">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {STARS.map((s, i) => (
          <span key={i} className="vg-star" style={{
            left: s.left, top: s.top,
            width: `${s.w}px`, height: `${s.w}px`,
            '--min': s.min, '--max': s.max,
            '--glow': s.glow, '--dur': s.dur, '--delay': s.delay,
          } as React.CSSProperties} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {SHOOTING_STARS.map((s, i) => (
          <span key={i} className="vg-shooting-star" style={{
            top: s.top, left: s.left,
            '--dx': s.dx, '--dy': s.dy, '--dur': s.dur, '--delay': s.delay,
          } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
