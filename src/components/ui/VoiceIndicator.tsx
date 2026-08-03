import React, { useEffect, useRef, useState } from 'react';
import { Mic, CornerDownLeft, X } from 'lucide-react';
import { useVoiceStore } from '@/store/useVoiceStore';
import { barHeights } from '@/lib/voice';

const BAR_COUNT = 24;

/**
 * Real-time voice waveform shown while dictating. Subscribes to the live mic
 * level (from useVoiceStore) directly, so the level updates only re-render this
 * component — never the pane grid. The wave is animated with a
 * requestAnimationFrame clock (time-based traveling wave), so it flows
 * continuously even when the mic level itself is steady.
 */
export const VoiceIndicator: React.FC = () => {
  const isListening = useVoiceStore((s) => s.isListening);
  const level = useVoiceStore((s) => s.level);
  const [time, setTime] = useState(0);
  const rafRef = useRef<number>(0);

  // Advance the wave clock while listening. rAF re-renders only this tiny
  // indicator (24 bars), so the 60fps clock costs nothing elsewhere.
  useEffect(() => {
    if (!isListening) return;
    const start = performance.now();
    const tick = (now: number) => {
      setTime((now - start) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isListening]);

  if (!isListening) return null;

  const heights = barHeights(level, BAR_COUNT, time);
  const idle = level < 0.05;

  return (
    <div className="fixed bottom-9 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-full bg-surfaceCard/95 border border-forest/40 shadow-2xl shadow-black/60 backdrop-blur-md animate-fade-in-up select-none">
      {/* Mic + pulsing ring */}
      <div className="relative flex items-center justify-center">
        <span className="absolute inline-flex h-6 w-6 rounded-full bg-forest/30 animate-ping" />
        <Mic className={`w-4 h-4 text-forest-bright relative ${idle ? 'animate-pulse' : ''}`} />
      </div>

      {/* Live waveform bars — traveling wave */}
      <div className={`flex items-end gap-[3px] h-6 ${idle ? 'opacity-70' : ''}`} aria-hidden>
        {heights.map((h, i) => (
          <div
            key={i}
            className="w-[3px] rounded-full bg-forest-bright transition-none"
            style={{
              height: `${h.toFixed(1)}px`,
              opacity: 0.4 + 0.6 * Math.min(1, h / 26),
            }}
          />
        ))}
      </div>

      <span className={`text-[11px] whitespace-nowrap ${idle ? 'text-white/45 animate-pulse' : 'text-white/70'}`}>
        {idle ? 'Listening… speak when ready' : 'Listening…'}
      </span>

      <span className="flex items-center gap-1 text-[10px] text-white/40 whitespace-nowrap">
        <CornerDownLeft className="w-3 h-3 text-forest-light" />
        <span>Insert</span>
        <span className="mx-1 text-white/20">·</span>
        <X className="w-3 h-3 text-white/40" />
        <span>Cancel</span>
      </span>
    </div>
  );
};
