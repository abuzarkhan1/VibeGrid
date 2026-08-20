'use client';

import React from 'react';

export interface TagChipProps {
  label: string;
  variant?: 'iris' | 'ember' | 'ash' | 'emerald';
  className?: string;
}

export function TagChip({ label, variant = 'iris', className = '' }: TagChipProps) {
  const variantStyles = {
    iris: 'bg-[#111111] text-[#5683da] border-[#5683da]',
    ember: 'bg-[#111111] text-[#ff8964] border-[#ff8964]',
    ash: 'bg-[#111111] text-[#a9a9aa] border-[#4a4b50]',
    emerald: 'bg-[#111111] text-[#e5e5e7] border-[#4a4b50]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border select-none transition-colors ${variantStyles[variant]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export interface StatusBadgeProps {
  status: string;
  active?: boolean;
  pulseColor?: string;
  className?: string;
}

export function StatusBadge({ status, active = true, pulseColor = 'bg-[#5683da]', className = '' }: StatusBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#4a4b50] text-[11px] font-mono text-[#a9a9aa] select-none ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {active && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${pulseColor}`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${pulseColor}`} />
      </span>
      <span>{status}</span>
    </div>
  );
}

export function PrimaryPillButton({
  children,
  href,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#5683da] text-[#ffffff] font-medium text-[14px] tracking-[-0.14px] border border-[#5683da] shadow-sm hover:brightness-110 active:scale-[0.98] transition-all duration-200 cursor-pointer';

  if (href) {
    return (
      <a href={href} className={`${base} ${className}`}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={`${base} ${className}`}>
      {children}
    </button>
  );
}

export function WhitePillButton({
  children,
  href,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#ffffff] text-[#090a0c] font-semibold text-[14px] tracking-[-0.14px] border border-[#ffffff] hover:bg-[#e5e5e7] active:scale-[0.98] transition-all duration-200 cursor-pointer';

  if (href) {
    return (
      <a href={href} className={`${base} ${className}`}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={`${base} ${className}`}>
      {children}
    </button>
  );
}

export function GhostPillButton({
  children,
  href,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#111111] border border-[#4a4b50] text-[#ffffff] font-medium text-[14px] tracking-[-0.14px] hover:bg-[#303236] hover:text-[#ffffff] hover:border-[#6b6c6d] active:scale-[0.98] transition-all duration-200 cursor-pointer';

  if (href) {
    return (
      <a href={href} className={`${base} ${className}`}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={`${base} ${className}`}>
      {children}
    </button>
  );
}

export function HairlineGridPattern({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="hairline-grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#4a4b50" strokeWidth="0.75" strokeOpacity="0.25" />
          <circle cx="0" cy="0" r="1" fill="#4a4b50" fillOpacity="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hairline-grid-pattern)" />
    </svg>
  );
}
