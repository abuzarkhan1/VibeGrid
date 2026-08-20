import React, { useEffect, useRef, useState } from 'react';
import { Mic, CornerDownLeft, X, Loader2, Check } from 'lucide-react';
import { useVoiceStore } from '@/store/useVoiceStore';
import { barHeights } from '@/lib/voice';

const BAR_COUNT = 20;

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
      role="status"
      aria-live="polite"
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 h-11 rounded-full bg-[#111111] border border-[#4a4b50] shadow-2xl animate-fade-in-up select-none font-sans"
    >
      {phase === 'transcribing' && (
        <div className="flex items-center gap-2.5 px-1">
          <Loader2 className="w-4 h-4 text-[#5683da] animate-spin shrink-0" />
          <span className="text-xs text-[#a9a9aa] font-medium whitespace-nowrap">Transcribing…</span>
        </div>
      )}

      {phase === 'inserted' && (
        <div className="flex items-center gap-2.5 px-1">
          <div className="relative flex items-center justify-center shrink-0">
            <span className="absolute inline-flex h-5 w-5 rounded-full bg-[#5683da]/25 animate-ping" />
            <Check className="w-4 h-4 text-[#5683da] relative" />
          </div>
          <span className="text-xs text-[#5683da] whitespace-nowrap max-w-[240px] truncate font-medium">
            {lastTranscript ? `Inserted: "${lastTranscript}"` : 'Inserted'}
          </span>
        </div>
      )}

      {phase === 'listening' && (
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center shrink-0">
            <span className="absolute inline-flex h-5 w-5 rounded-full bg-[#5683da]/25 animate-ping" />
            <Mic className={`w-4 h-4 text-[#5683da] relative ${idle ? 'animate-pulse' : ''}`} />
          </div>

          <div className={`flex items-end gap-[2.5px] h-5 transition-opacity duration-200 ${idle ? 'opacity-50' : 'opacity-100'}`} aria-hidden>
            {heights.map((h, i) => (
              <div
                key={i}
                className="w-[2.5px] rounded-full bg-[#5683da] transition-none"
                style={{
                  height: `${Math.max(3, h * 0.8).toFixed(1)}px`,
                  opacity: 0.4 + 0.6 * Math.min(1, h / 22),
                }}
              />
            ))}
          </div>

          <span className={`text-xs whitespace-nowrap transition-colors ${idle ? 'text-[#a9a9aa]' : 'text-white font-medium'}`}>
            Listening…
          </span>

          <div className="flex items-center gap-1.5 pl-1 text-[10px] text-[#a9a9aa] whitespace-nowrap font-mono border-l border-[#4a4b50]/60">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3 text-[#5683da]" />
              <span className="text-white">Insert</span>
            </span>
            <span className="text-[#4a4b50]">·</span>
            <span className="flex items-center gap-1">
              <X className="w-3 h-3 text-[#ff8964]" />
              <span className="text-[#a9a9aa]">Cancel</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

