'use client';

import React from 'react';

export function AuroraBeamFX() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
      {/* 1. Deep Solid Void Base Surface */}
      <div className="absolute inset-0 bg-[#090a0c]" />

      {/* 2. Precision Architectural Geometric Grid Pattern */}
      <svg
        className="absolute inset-0 h-full w-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Minor 48px grid */}
          <pattern id="arch-grid-minor" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#4a4b50" strokeWidth="0.75" strokeOpacity="0.4" />
          </pattern>
          {/* Major 192px grid */}
          <pattern id="arch-grid-major" width="192" height="192" patternUnits="userSpaceOnUse">
            <rect width="192" height="192" fill="url(#arch-grid-minor)" />
            <path d="M 192 0 L 0 0 0 192" fill="none" stroke="#4a4b50" strokeWidth="1.25" strokeOpacity="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#arch-grid-major)" />
      </svg>
    </div>
  );
}
