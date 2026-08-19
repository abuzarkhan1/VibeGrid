import { create } from 'zustand';

type VoicePhase = 'idle' | 'listening' | 'transcribing' | 'inserted';

interface VoiceUIState {

  isListening: boolean;

  level: number;

  phase: VoicePhase;

  lastTranscript: string | null;
  setListening: (v: boolean) => void;
  setLevel: (level: number) => void;
  setPhase: (phase: VoicePhase) => void;
  setLastTranscript: (text: string | null) => void;
}

export const useVoiceStore = create<VoiceUIState>((set) => ({
  isListening: false,
  level: 0,
  phase: 'idle',
  lastTranscript: null,
  setListening: (isListening) => set({ isListening, level: 0, phase: isListening ? 'listening' : 'idle' }),
  setLevel: (level) => set({ level: Math.min(1, Math.max(0, level)) }),
  setPhase: (phase) => set({ phase }),
  setLastTranscript: (lastTranscript) => set({ lastTranscript }),
}));
