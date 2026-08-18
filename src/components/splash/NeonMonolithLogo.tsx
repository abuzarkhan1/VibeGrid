import React from 'react';

interface NeonMonolithLogoProps {
  size?: number;
  pulse?: boolean;
}

export const NeonMonolithLogo: React.FC<NeonMonolithLogoProps> = ({ size = 72, pulse: _pulse = false }) => {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* Container using Stealth Black Glassmorphism */}
      <div className="relative flex items-center justify-center w-full h-full rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-md p-3 overflow-hidden">
        {/* Monolith Icon */}
        <img
          src="/logo.png"
          alt="Codex Logo"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};