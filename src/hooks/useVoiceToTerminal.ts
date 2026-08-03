import { useEffect, useState, useRef, useCallback } from 'react';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVoiceStore } from '@/store/useVoiceStore';
import { writeToPty } from '@/lib/tauri';
import { isVoiceShortcut, isTypingTarget } from '@/lib/voice';
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

export function useVoiceToTerminal() {
  const { addToast, updateToast, removeToast } = useUIStore();
  const { setListening, setLevel } = useVoiceStore();
  const voiceEnabled = useSettingsStore((s) => s.voiceToTerminal);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const listeningRef = useRef(false);
  // Guards: Enter/Esc presses must not double-fire while Rust auto-stop is running.
  const insertInFlightRef = useRef(false);
  const cancelInFlightRef = useRef(false);
  // One persistent toast for the whole download — updated in place, not stacked.
  const progressToastRef = useRef<string | null>(null);

  const setListeningState = useCallback(
    (v: boolean) => {
      listeningRef.current = v;
      setListening(v);
      if (!v) setLevel(0);
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

  // Insert transcript into the focused pane. The text is always inserted
  // WITHOUT pressing Enter (no \r) so it lands on the command line for the
  // user to review and run themselves — Enter during dictation only inserts.
  const handleTranscript = useCallback(
    async (text: string) => {
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
        addToast({
          type: 'success',
          title: 'Transcribed to terminal',
          description: `"${trimmed}"`,
        });
      } else {
        addToast({ type: 'error', title: 'No active pane', description: 'Could not insert text. No active PTY pane found.' });
      }
    },
    [addToast]
  );

  // Live audio level → waveform store + auto-stop result handling
  useEffect(() => {
    let cancelled = false;
    const unlistens: (() => void)[] = [];

    listenAudioLevel(({ payload }) => {
      if (!cancelled) setLevel(payload.level);
    }).then((fn) => (cancelled ? fn() : unlistens.push(fn)));

    // Rust auto-stopped after silence: transcribe + insert (no Enter).
    listenDictationResult(async ({ payload }) => {
      if (cancelled) return;
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
    };
  }, []);

  // Manual commit: Enter while listening → transcribe + insert (not run)
  const insertDictation = useCallback(async () => {
    if (insertInFlightRef.current) return;
    insertInFlightRef.current = true;
    setListeningState(false);
    try {
      const text = await voiceStopRecording();
      await handleTranscript(text);
    } catch (e) {
      // The Rust watcher already consumed the audio (auto-stop won the race), or
      // the recording was all silence — neither is a failure to report.
      if (String(e).includes('No audio captured') || /no speech/i.test(String(e))) return;
      addToast({ type: 'error', title: 'Transcription failed', description: String(e) });
    } finally {
      insertInFlightRef.current = false;
    }
  }, [setListeningState, handleTranscript, addToast]);

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
      setListeningState(false);
      try {
        const text = await voiceStopRecording();
        await handleTranscript(text);
      } catch (e) {
        // Silent recording (or already-consumed by the auto-stop watcher) is not
        // a failure — the state already reset, so just skip the toast.
        if (String(e).includes('No audio captured') || /no speech/i.test(String(e))) return;
        addToast({ type: 'error', title: 'Transcription failed', description: String(e) });
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
      addToast({ type: 'error', title: 'Could not start microphone', description: String(e) });
    }
  }, [isModelReady, isDownloading, setListeningState, handleTranscript, addToast, removeToast]);

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

      if (!isVoiceShortcut(e)) return;
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
