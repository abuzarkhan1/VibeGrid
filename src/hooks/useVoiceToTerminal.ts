import { useEffect, useState, useRef, useCallback } from 'react';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVoiceStore } from '@/store/useVoiceStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';
import { writeToPty } from '@/lib/tauri';
import { isTypingTarget } from '@/lib/voice';
import {
  voiceModelStatus,
  voiceEnsureModel,
  voiceStartRecording,
  voiceStopRecording,
  voiceCancelRecording,
  listenModelProgress,
  listenAudioLevel,
  listenDictationResult,
  listenDictationError,
} from '@/lib/tauri';

// ── Shared Web Audio (gap 15: reuse one AudioContext instead of one per sound) ──
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContext();
    }
    // Autoplay policies may suspend the context; resume on demand.
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/** Play a soft notification tone to confirm dictation was inserted. */
function playInsertSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    g.connect(ctx.destination);

    // Two-tone ding: 880 Hz + 1320 Hz (pleasant A5/E6 chime)
    for (const freq of [880, 1320]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      o.connect(g);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // AudioContext unavailable — silence is fine.
  }
}

/** Play a short error buzz when dictation fails. */
function playErrorSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    g.connect(ctx.destination);

    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(220, ctx.currentTime);
    o.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.25);
    o.connect(g);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.3);
  } catch {
    // AudioContext unavailable.
  }
}

/** Map a mic/start-recording error to actionable guidance (gap 20). */
function describeMicError(e: unknown): string {
  const msg = String(e);
  const lower = msg.toLowerCase();
  if (/permission|denied|access/i.test(lower)) {
    return 'Microphone access was denied. Grant it in System Settings → Privacy & Security → Microphone, then try again.';
  }
  if (/no.*device|device.*not found|not found/i.test(lower)) {
    return 'No microphone was detected. Connect or select a microphone and try again.';
  }
  if (/in use|busy|occupied/i.test(lower)) {
    return 'The microphone is in use by another app. Close that app and try again.';
  }
  return msg;
}

export function useVoiceToTerminal() {
  const { addToast, updateToast, removeToast } = useUIStore();
  const { setListening, setLevel, setPhase, setLastTranscript } = useVoiceStore();
  const voiceEnabled = useSettingsStore((s) => s.voiceToTerminal);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const listeningRef = useRef(false);
  // Guards: Enter/Esc presses must not double-fire while Rust auto-stop is running.
  const insertInFlightRef = useRef(false);
  const cancelInFlightRef = useRef(false);
  // True only after a manual path (Enter / toggle-stop) actually inserted text.
  // The auto-stop watcher checks this instead of insertInFlightRef, so a manual
  // path that LOST the IPC race ("No audio captured" — the watcher consumed the
  // audio first) never suppresses the watcher's own dictation-result event.
  const committedRef = useRef(false);
  // One persistent toast for the whole download — updated in place, not stacked.
  const progressToastRef = useRef<string | null>(null);
  // Clears the 'inserted' flash after a moment (gap 3)
  const flashTimerRef = useRef<number | null>(null);

  const setListeningState = useCallback(
    (v: boolean) => {
      listeningRef.current = v;
      setListening(v);
      if (!v) setLevel(0);
      // A fresh recording starts from an un-committed state: clear any pending
      // 'inserted' flash timer so a quick re-dictation never blanks the
      // indicator mid-listen.
      if (v) {
        committedRef.current = false;
        if (flashTimerRef.current) {
          window.clearTimeout(flashTimerRef.current);
          flashTimerRef.current = null;
        }
      }
    },
    [setListening, setLevel]
  );

  // Check model status on mount + subscribe to download progress
  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    voiceModelStatus().then((status) => {
      if (!cancelled && status) {
        setIsModelReady(status.ready);
        if (!status.ready) {
          addToast({
            type: 'info',
            title: 'Whisper model required',
            description: 'VibeGrid will download the local Whisper model (~142 MB) on your first dictation.',
            durationMs: 5000,
          });
        }
      }
    });

    listenModelProgress(({ payload }) => {
      if (cancelled) return;

      if (payload.percent >= 100) {
        setIsDownloading(false);
        setIsModelReady(true);
        if (progressToastRef.current) {
          removeToast(progressToastRef.current);
          progressToastRef.current = null;
        }
        addToast({
          type: 'success',
          title: 'Whisper model ready',
          description: 'Voice-to-Terminal is ready. Press Cmd/Ctrl+Shift+V to start dictating.',
          durationMs: 4000,
        });
        return;
      }

      setIsDownloading(true);
      const mb = Math.round(payload.downloaded / 1024 / 1024);
      const totalMb = payload.total > 0 ? Math.round(payload.total / 1024 / 1024) : null;
      const description = totalMb ? `${payload.percent}% · ${mb} MB / ${totalMb} MB` : `${payload.percent}% · ${mb} MB`;
      if (progressToastRef.current) {
        updateToast(progressToastRef.current, {
          title: `Downloading Whisper model — ${payload.percent}%`,
          description,
          progress: payload.percent,
        });
      } else {
        progressToastRef.current = addToast({
          type: 'info',
          title: `Downloading Whisper model — ${payload.percent}%`,
          description,
          progress: payload.percent,
          durationMs: 0, // persistent; removed on completion
        });
      }
    }).then((fn) => {
      // If the hook unmounted before listen resolved, unsubscribe immediately.
      if (cancelled) {
        fn();
      } else {
        unlisten = fn;
      }
    });

    return () => {
      cancelled = true;
      unlisten?.();
      // Make sure a persistent download toast never outlives the hook.
      if (progressToastRef.current) {
        removeToast(progressToastRef.current);
        progressToastRef.current = null;
      }
    };
  }, [addToast, updateToast, removeToast]);

  /** Briefly show the 'inserted' flash, then fade back to idle. */
  const flashInserted = useCallback(
    (text: string) => {
      setLastTranscript(text);
      setPhase('inserted');
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = window.setTimeout(() => {
        setPhase('idle');
      }, 2000);
    },
    [setLastTranscript, setPhase]
  );

  /** Re-focus the terminal that owns the given layout node (gap 4). */
  const refocusPane = useCallback((layoutNodeId: string) => {
    window.dispatchEvent(new CustomEvent('vibegrid:focus-pane', { detail: layoutNodeId }));
  }, []);

  // Insert transcript into the focused pane. The text is always inserted
  // WITHOUT pressing Enter (no \r) so it lands on the command line for the
  // user to review and run themselves — Enter during dictation only inserts.
  //
  // When `silent` is true the caller suppresses the confirmation toast (e.g.
  // Enter-press — the user already knows they committed); a soft tone is
  // played instead so the ear confirms insertion without visual noise.
  const handleTranscript = useCallback(
    async (text: string, silent = false) => {
      const trimmed = text.trim();
      if (!trimmed) {
        addToast({ type: 'warning', title: 'No speech detected', description: 'Try speaking a little louder or closer to the microphone.' });
        return;
      }
      const nodes = getTerminalNodes(usePaneStore.getState().root);
      const activeNode = nodes.find((n) => n.id === usePaneStore.getState().focusedPaneId);
      if (activeNode?.paneId) {
        // Insert only — the exact words, no trailing space or Enter. The user
        // reviews the command line and presses Enter themselves to run it.
        await writeToPty(activeNode.paneId, trimmed);
        committedRef.current = true; // this recording was inserted — dedupe the watcher
        playInsertSound();
        flashInserted(trimmed);
        refocusPane(activeNode.id);
        if (!silent) {
          addToast({
            type: 'success',
            title: 'Transcribed to terminal',
            description: `"${trimmed}"`,
          });
        }
      } else {
        addToast({ type: 'error', title: 'No active pane', description: 'Could not insert text. No active PTY pane found.' });
        playErrorSound();
      }
    },
    [addToast, flashInserted, refocusPane]
  );

  // Live audio level → waveform store + auto-stop result handling
  useEffect(() => {
    let cancelled = false;
    const unlistens: (() => void)[] = [];

    listenAudioLevel(({ payload }) => {
      if (!cancelled) setLevel(payload.level);
    }).then((fn) => (cancelled ? fn() : unlistens.push(fn)));

    // Rust auto-stopped after silence: transcribe + insert (no Enter).
    // Guarded so a manual path (Enter / toggle-stop) that already inserted never
    // double-inserts the same audio (gap 18). Only `committedRef` suppresses the
    // watcher — a manual path that lost the race must NOT block it (see above).
    listenDictationResult(async ({ payload }) => {
      if (cancelled) return;
      if (committedRef.current || cancelInFlightRef.current) return; // another path already handled it
      setListeningState(false);
      await handleTranscript(payload.text);
    }).then((fn) => (cancelled ? fn() : unlistens.push(fn)));

    // Rust reported an error (e.g. no speech detected).
    listenDictationError(({ payload }) => {
      if (cancelled) return;
      setListeningState(false);
      // A silent recording is a gentle nudge, not a failure.
      if (/no speech/i.test(payload.error)) {
        addToast({ type: 'warning', title: 'No speech detected', description: 'Try speaking a little louder or closer to the microphone.' });
        return;
      }
      addToast({ type: 'error', title: 'Dictation failed', description: payload.error });
    }).then((fn) => (cancelled ? fn() : unlistens.push(fn)));

    return () => {
      cancelled = true;
      unlistens.forEach((fn) => fn());
    };
  }, [setListeningState, setLevel, addToast, handleTranscript]);

  // Dismiss on outside click / middle-click while listening (gap 6): a click
  // that lands anywhere except the floating indicator cancels dictation, so
  // users aren't stuck waiting for silence detection.
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!listeningRef.current) return;
      const target = e.target as HTMLElement;
      const insideIndicator = target.closest && target.closest('[data-voice-indicator]');
      // Middle-click (button === 1) anywhere cancels; left-click outside the
      // indicator cancels too. Clicks inside the indicator are ignored so the
      // user can keep interacting with it (or press Enter/Esc). No
      // preventDefault — the click still focuses/selects whatever they clicked.
      if (e.button === 1 || !insideIndicator) {
        cancelDictation().catch(() => {});
      }
    };
    window.addEventListener('mousedown', onMouseDown, true);
    return () => window.removeEventListener('mousedown', onMouseDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop recording if the user disables voice while listening
  useEffect(() => {
    if (!voiceEnabled && listeningRef.current) {
      setListeningState(false);
      voiceStopRecording().catch(() => {});
    }
  }, [voiceEnabled, setListeningState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listeningRef.current) {
        voiceStopRecording().catch(() => {});
      }
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    };
  }, []);

  // Manual commit: Enter while listening → transcribe + insert (not run).
  // Silent — no toast popup, just a soft chime to confirm.
  const insertDictation = useCallback(async () => {
    if (insertInFlightRef.current) return;
    insertInFlightRef.current = true;
    setListeningState(false);
    setPhase('transcribing'); // show the "Transcribing…" state (gap 16)
    try {
      const text = await voiceStopRecording();
      await handleTranscript(text, true);
    } catch (e) {
      // The Rust watcher already consumed the audio (auto-stop won the race), or
      // the recording was all silence — neither is a failure to report.
      if (String(e).includes('No audio captured') || /no speech/i.test(String(e))) {
        setPhase('idle');
        return;
      }
      addToast({ type: 'error', title: 'Transcription failed', description: String(e) });
      playErrorSound();
      setPhase('idle');
    } finally {
      insertInFlightRef.current = false;
    }
  }, [setListeningState, handleTranscript, addToast, setPhase]);

  // Manual cancel: Esc while listening → discard audio
  const cancelDictation = useCallback(async () => {
    if (cancelInFlightRef.current) return;
    cancelInFlightRef.current = true;
    setListeningState(false);
    try {
      await voiceCancelRecording();
      addToast({ type: 'info', title: 'Dictation cancelled', description: 'Recording discarded.' });
    } catch (e) {
      addToast({ type: 'error', title: 'Could not cancel', description: String(e) });
    } finally {
      cancelInFlightRef.current = false;
    }
  }, [setListeningState, addToast]);

  // Handle a dictation toggle press: start or stop recording, download model if needed
  const toggleDictation = useCallback(async () => {
    if (listeningRef.current) {
      // Manual stop via shortcut: transcribe + insert (no Enter).
      // Show toast here since the user may be expecting visual feedback
      // (they didn't press Enter, they pressed Cmd/Ctrl+Shift+V again).
      setListeningState(false);
      setPhase('transcribing');
      try {
        const text = await voiceStopRecording();
        await handleTranscript(text, false);
      } catch (e) {
        // Silent recording (or already-consumed by the auto-stop watcher) is not
        // a failure — the state already reset, so just skip the toast.
        if (String(e).includes('No audio captured') || /no speech/i.test(String(e))) {
          setPhase('idle');
          return;
        }
        addToast({ type: 'error', title: 'Transcription failed', description: String(e) });
        playErrorSound();
        setPhase('idle');
      }
      return;
    }

    // Not listening yet: make sure the model is available
    if (!isModelReady) {
      if (isDownloading) {
        addToast({ type: 'info', title: 'Whisper model is downloading…', description: 'Watch the progress toast, then press Cmd/Ctrl+Shift+V again once it says ready.' });
        return;
      }
      setIsDownloading(true);
      addToast({
        type: 'info',
        title: 'Downloading Whisper model',
        description: 'This happens once (~142 MB). A progress toast will appear in the top-right — press Cmd/Ctrl+Shift+V when it says ready.',
        durationMs: 5000,
      });
      try {
        await voiceEnsureModel();
        setIsModelReady(true);
      } catch (e) {
        setIsDownloading(false);
        if (progressToastRef.current) {
          removeToast(progressToastRef.current);
          progressToastRef.current = null;
        }
        addToast({ type: 'error', title: 'Model download failed', description: String(e) });
        return;
      }
      setIsDownloading(false);
    }

    try {
      await voiceStartRecording();
      setListeningState(true);
      // No top toast here — the floating VoiceIndicator at the bottom already
      // shows the live waveform + status, so a duplicate notification is noise.
    } catch (e) {
      // Gap 20: surface mic permission problems with actionable guidance.
      addToast({ type: 'error', title: 'Could not start microphone', description: describeMicError(e) });
    }
  }, [isModelReady, isDownloading, setListeningState, handleTranscript, addToast, removeToast, setPhase]);

  // Global capture-phase key handling: Cmd/Ctrl+Shift+V toggle; while listening,
  // Enter commits + submits and Esc cancels.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // While listening: Enter = commit & insert, Esc = cancel.
      if (listeningRef.current) {
        if (e.key === 'Enter' && !e.repeat) {
          e.preventDefault();
          e.stopPropagation();
          insertDictation().catch(() => {});
          return;
        }
        if (e.key === 'Escape' && !e.repeat) {
          e.preventDefault();
          e.stopPropagation();
          cancelDictation().catch(() => {});
          return;
        }
      }

      // Audit: the voice toggle is now a REASSIGNABLE keybinding from the store
      // instead of the hardcoded Cmd/Ctrl+Shift+V check.
      if (!useKeybindingsStore.getState().matchesKeybinding(e, 'voice-toggle')) return;
      // Never steal the shortcut while typing in an input (e.g. Settings keybinding capture)
      if (isTypingTarget(e.target)) return;

      e.preventDefault();
      e.stopPropagation();

      if (!voiceEnabled) {
        addToast({
          type: 'warning',
          title: 'Voice-to-Terminal is off',
          description: 'Enable it in Settings → Terminal → Voice-to-Terminal.',
        });
        return;
      }

      toggleDictation().catch(() => {});
    };

    window.addEventListener('keydown', handleKeyDown, true); // capture phase: wins over xterm
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [voiceEnabled, toggleDictation, insertDictation, cancelDictation, addToast]);

  return {};
}
