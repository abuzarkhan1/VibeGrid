import React, { useEffect, useRef, useState } from 'react';
import { Mic, CornerDownLeft, X, Loader2, Check } from 'lucide-react';
import { useVoiceStore } from '@/store/useVoiceStore';
import { barHeights } from '@/lib/voice';

const BAR_COUNT = 24;

export const VoiceIndicator: React.FC = () => {
  const isListening = useVoiceStore((s) => s.isListening);
  const level = useVoiceStore((s) => s.level);
  const phase = useVoiceStore((s) => s.phase);
  const lastTranscript = useVoiceStore((s) => s.lastTranscript);
  const [time, setTime] = useState(0);
  const rafRef = useRef<number>(0);
  const heardVoiceRef = useRef(false);

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

  const SPEECH_FLOOR = 0.12;
  useEffect(() => {
    if (isListening) {
      heardVoiceRef.current = level >= SPEECH_FLOOR;
    }
  }, [isListening, level]);

  const visible = isListening || phase === 'transcribing' || phase === 'inserted';
  if (!visible) return null;

  const heights = barHeights(level, BAR_COUNT, time);
  const idle = !heardVoiceRef.current && level < SPEECH_FLOOR;

  return (
    <div
      data-voice-indicator
      className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#1A1B26] border border-white/20 shadow-2xl animate-fade-in-up select-none font-sans "
    >
      {phase === 'transcribing' && (
        <>
          <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
          <span className="text-[11px] text-white/90 whitespace-nowrap">Transcribing…</span>
        </>
      )}

      {phase === 'inserted' && (
        <>
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-6 w-6 rounded-full bg-emerald-400/30 animate-ping" />
            <Check className="w-4 h-4 text-emerald-400 relative" />
          </div>
          <span className="text-[11px] text-emerald-400 whitespace-nowrap max-w-[280px] truncate font-medium">
            {lastTranscript ? `Inserted: "${lastTranscript}"` : 'Inserted'}
          </span>
        </>
      )}

      {phase === 'listening' && (
        <>
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-6 w-6 rounded-full bg-violet-500/30 animate-ping" />
            <Mic className={`w-4 h-4 text-violet-400 relative ${idle ? 'animate-pulse' : ''}`} />
          </div>

          <div className={`flex items-end gap-[3px] h-6 ${idle ? 'opacity-70' : ''}`} aria-hidden>
            {heights.map((h, i) => (
              <div
                key={i}
                className="w-[3px] rounded-full bg-violet-500 transition-none"
                style={{
                  height: `${h.toFixed(1)}px`,
                  opacity: 0.4 + 0.6 * Math.min(1, h / 26),
                }}
              />
            ))}
          </div>

          <span className={`text-[11px] whitespace-nowrap ${idle ? 'text-white/70 animate-pulse' : 'text-white/90 font-medium'}`}>
            {idle ? 'Listening… speak when ready' : 'Listening…'}
          </span>

          <span className="flex items-center gap-1 text-[10px] text-white/40 whitespace-nowrap font-mono">
            <CornerDownLeft className="w-3 h-3 text-violet-400" />
            <span>Insert</span>
            <span className="mx-1 text-white/10">·</span>
            <X className="w-3 h-3 text-white/70" />
            <span>Cancel</span>
          </span>
        </>
      )}
    </div>
  );
};
