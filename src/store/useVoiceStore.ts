import { create } from 'zustand';

/**
 * Live voice-to-terminal UI state. Kept separate from useUIStore so the
 * real-time waveform (updated ~10x/sec) only re-renders the indicator, never
 * the whole app tree.
 */
interface VoiceUIState {
  /** True while the mic is recording for dictation. */
  isListening: boolean;
  /** Live mic level 0..1, streamed from the Rust auto-stop watcher. */
  level: number;
  setListening: (v: boolean) => void;
  setLevel: (level: number) => void;
}

export const useVoiceStore = create<VoiceUIState>((set) => ({
  isListening: false,
  level: 0,
  setListening: (isListening) => set({ isListening, level: 0 }),
  setLevel: (level) => set({ level: Math.min(1, Math.max(0, level)) }),
}));
