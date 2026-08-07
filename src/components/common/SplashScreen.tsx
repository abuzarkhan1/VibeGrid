import React, { useEffect, useState } from 'react';

const MIN_DISPLAY_MS = 700; // splash never flashes for less than this
const FADE_DURATION = 350;

interface SplashScreenProps {
  /** True once the app's real loading work (workspace restore) has finished.
   *  The splash stays until BOTH this and the minimum display time elapse —
   *  it is no longer a fixed timer that fakes progress (audit). */
  ready: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ ready }) => {
  const [minElapsed, setMinElapsed] = useState(false);
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible');

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Fade out only when the workspace restore actually finished AND the minimum
  // display time passed. A slow disk keeps the splash until load resolves.
  //
  // BUGFIX (delete-workspace root cause): the fade and removal timers were
  // BOTH cleaned up whenever `phase` changed — so when the 80ms fade timer
  // flipped phase to 'fading', its cleanup cancelled the 430ms removal timer
  // and the splash was stuck as an invisible full-screen z-[100] layer that
  // swallowed every click in the app (you could never press Delete Workspace
  // — or anything else). Timers are now keyed off [ready, minElapsed] only,
  // so flipping phase never cancels the unmount timer.
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
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#08080a] transition-opacity duration-300 ${
        // While fading, the splash must NEVER intercept clicks — it is
        // invisible but still mounted, so pointer-events: none guarantees the
        // app underneath stays fully interactive during the fade.
        phase === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative mb-6">
        {/* Glowing white halo pulse */}
        <div className="absolute inset-0 rounded-2xl bg-white/20 blur-xl animate-pulse" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white shadow-[0_0_32px_rgba(255,255,255,0.25)]">
          <svg width="36" height="36" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.95" />
            <rect x="9" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.6" />
            <rect x="1" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.6" />
            <rect x="9" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.3" />
          </svg>
        </div>
      </div>
      <h1 className="font-['Space_Grotesk'] font-bold text-4xl text-white tracking-tight">VibeGrid</h1>
      <p className="mt-2 text-xs text-zinc-400 font-mono">GPU-Accelerated Terminal Workspace</p>
      <div className="mt-8 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
};
