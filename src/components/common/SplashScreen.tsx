import React, { useEffect, useState } from 'react';
import { BrandEmblem } from '@/components/splash/BrandEmblem';

const MIN_DISPLAY_MS = 700; // splash never flashes for less than this
const FADE_DURATION = 350;

interface SplashScreenProps {
  /** True once the app's real loading work (workspace restore) has finished.
   *  The splash stays until BOTH this and the minimum display time elapse */
  ready: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ ready }) => {
  const [minElapsed, setMinElapsed] = useState(false);
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible');

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || !minElapsed) return;
    const fadeTimer = setTimeout(() => setPhase('fading'), 80);
    const removeTimer = setTimeout(() => setPhase('gone'), 80 + FADE_DURATION);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [ready, minElapsed]);

  if (phase === 'gone') return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050608] transition-opacity duration-300 font-sans ${
        phase === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.035), transparent 38%), #050608',
      }}
    >
      <div className="relative mb-3">
        <BrandEmblem size={96} isAssembled={true} />
      </div>

      <div className="flex items-center tracking-tight text-3xl font-semibold">
        <span className="text-white">Vibe</span>
        <span className="text-[#aeb1b7]">Grid</span>
      </div>
      <div className="w-[100px] h-[1px] bg-white/70 mt-3 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
      <div className="mt-5 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
};
