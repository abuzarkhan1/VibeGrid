import { create } from 'zustand';

/**
 * Live voice-to-terminal UI state. Kept separate from useUIStore so the
 * real-time waveform (updated ~10x/sec) only re-renders the indicator, never
 * the whole app tree.
 */
type VoicePhase = 'idle' | 'listening' | 'transcribing' | 'inserted';

interface VoiceUIState {
  /** True while the mic is recording for dictation. */
  isListening: boolean;
  /** Live mic level 0..1, streamed from the Rust auto-stop watcher. */
  level: number;
  /**
   * Lifecycle phase for the floating indicator:
   * - 'listening'    → waveform while the mic is open
   * - 'transcribing' → commit in flight (Enter/shortcut pressed, Rust transcribing)
   * - 'inserted'     → transcript landed in the focused pane (brief flash)
   * - 'idle'         → nothing to show
   */
  phase: VoicePhase;
  /** The last successfully inserted transcript (re-playable, gap 19). */
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
