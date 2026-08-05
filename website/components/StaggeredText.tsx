'use client';

import React from 'react';

/**
 * Staggered letter reveal — each character fades up with a cascading delay
 * using the Freebuff `letter-fade-in` keyframe (globals.css). Falls back to
 * plain text under prefers-reduced-motion (CSS handles the animation).
 */
export default function StaggeredText({
  text,
  className = '',
  step = 40,
  startDelay = 0,
}: {
  text: string;
  className?: string;
  step?: number;
  startDelay?: number;
}) {
  return (
    <span className={className} aria-label={text} role="text">
      {text.split('').map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="animate-letter-fade-in inline-block"
          style={{ animationDelay: `${startDelay + i * step}ms` }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
}
