import { describe, it, expect } from 'vitest';
import { useVoiceStore } from './useVoiceStore';

describe('VibeGrid Voice Store (UX gap phases)', () => {
  it('starts idle with no transcript', () => {
    const s = useVoiceStore.getState();
    expect(s.isListening).toBe(false);
    expect(s.phase).toBe('idle');
    expect(s.level).toBe(0);
    expect(s.lastTranscript).toBeNull();
  });

  it('setListening(true) enters the listening phase and resets level', () => {
    useVoiceStore.getState().setLevel(0.7);
    useVoiceStore.getState().setListening(true);
    const s = useVoiceStore.getState();
    expect(s.isListening).toBe(true);
    expect(s.phase).toBe('listening');
    expect(s.level).toBe(0);
  });

  it('setListening(false) returns to idle', () => {
    useVoiceStore.getState().setListening(true);
    useVoiceStore.getState().setListening(false);
    expect(useVoiceStore.getState().phase).toBe('idle');
    expect(useVoiceStore.getState().isListening).toBe(false);
  });

  it('setPhase drives the transient transcribing / inserted states (gaps 3 & 16)', () => {
    useVoiceStore.getState().setPhase('transcribing');
    expect(useVoiceStore.getState().phase).toBe('transcribing');
    useVoiceStore.getState().setPhase('inserted');
    expect(useVoiceStore.getState().phase).toBe('inserted');
    useVoiceStore.getState().setPhase('idle');
    expect(useVoiceStore.getState().phase).toBe('idle');
  });

  it('stores the last transcript for replay (gap 19)', () => {
    useVoiceStore.getState().setLastTranscript('ls -la');
    expect(useVoiceStore.getState().lastTranscript).toBe('ls -la');
    useVoiceStore.getState().setLastTranscript(null);
    expect(useVoiceStore.getState().lastTranscript).toBeNull();
  });

  it('clamps level into 0..1', () => {
    useVoiceStore.getState().setLevel(2.5);
    expect(useVoiceStore.getState().level).toBe(1);
    useVoiceStore.getState().setLevel(-0.5);
    expect(useVoiceStore.getState().level).toBe(0);
  });
});
