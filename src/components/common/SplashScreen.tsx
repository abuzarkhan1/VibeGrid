import React, { useEffect, useState } from 'react';

const SPLASH_DURATION = 900; // ms before fade-out starts
const FADE_DURATION = 350;

export const SplashScreen: React.FC = () => {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible');

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase('fading'), SPLASH_DURATION);
    const removeTimer = setTimeout(() => setPhase('gone'), SPLASH_DURATION + FADE_DURATION);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-300 ${
        phase === 'fading' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest shadow-[0_0_28px_rgba(84,169,103,0.35)] mb-6">
        <svg width="36" height="36" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.9" />
          <rect x="9" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.5" />
          <rect x="1" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.5" />
          <rect x="9" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.2" />
        </svg>
      </div>
      <h1 className="lp-serif text-4xl text-white tracking-wide">VibeGrid</h1>
      <p className="mt-2 text-xs text-white/40 font-mono">GPU-Accelerated Terminal Workspace</p>
      <div className="mt-8 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-forest-bright animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
};
