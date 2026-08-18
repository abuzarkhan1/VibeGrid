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
      {/* Container */}
      <div className="relative flex items-center justify-center w-full h-full rounded-xl bg-[#232327] border border-[#333338] shadow-md p-3 overflow-hidden">
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
