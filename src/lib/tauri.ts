import { invoke } from '@tauri-apps/api/core';
import { listen, EventCallback, UnlistenFn } from '@tauri-apps/api/event';

// Check if running inside Tauri
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export async function spawnPty(cols: number, rows: number, cwd?: string, shell?: string): Promise<string> {
  if (!isTauri()) {
    console.warn('[VibeGrid] Not running in Tauri; returning mock PTY pane ID');
    return `mock-pty-${Date.now()}`;
  }
  return await invoke<string>('spawn_pty', { cols, rows, cwd, shell });
}

export async function writeToPty(paneId: string, data: string): Promise<void> {
  if (!isTauri()) {
    return;
  }
  await invoke('write_to_pty', { paneId, data });
}

export async function resizePty(paneId: string, cols: number, rows: number): Promise<void> {
  if (!isTauri()) {
    return;
  }
  await invoke('resize_pty', { paneId, cols, rows });
}

export async function killPty(paneId: string): Promise<void> {
  if (!isTauri()) {
    return;
  }
  await invoke('kill_pty', { paneId });
}

export async function setBatchInterval(intervalMs: number): Promise<number> {
  if (!isTauri()) return intervalMs;
  return await invoke<number>('set_batch_interval', { intervalMs });
}

/**
 * Fetch the recent output history of a pane (last ~256 KB) plus whether its
 * process already exited. Used when switching back to a workspace: the pane's
 * terminal was unmounted while hidden, so its live events (including
 * terminal-exit) were dropped — this repaints what the process printed
 * meanwhile and surfaces the exited state so the banner can show immediately.
 */
export async function paneSnapshot(paneId: string): Promise<{ output: string; exited: boolean }> {
  if (!isTauri()) return { output: '', exited: false };
  try {
    const [output, exited] = await invoke<[string, boolean]>('pane_snapshot', { paneId });
    return { output, exited };
  } catch (e) {
    console.warn('[VibeGrid] pane_snapshot failed:', e);
    return { output: '', exited: false };
  }
}

export async function listenTerminalBatch(
  handler: EventCallback<Record<string, string>>
): Promise<UnlistenFn> {
  if (!isTauri()) {
    // Return dummy unlisten function for mock
    return () => {};
  }
  return await listen<Record<string, string>>('terminal-batch', handler);
}

/** Payload of the `terminal-exit` event emitted when a pane's process exits. */
export interface TerminalExitPayload {
  paneId: string;
}

/**
 * Subscribe to PTY exit events (audit fix): the Rust reader emits this on EOF
 * so the frontend can show a "process exited" banner instead of a frozen pane.
 */
export async function listenTerminalExit(
  handler: EventCallback<TerminalExitPayload>
): Promise<UnlistenFn> {
  if (!isTauri()) return () => {};
  return await listen<TerminalExitPayload>('terminal-exit', handler);
}

// Listen for non-fatal startup warnings emitted by the Rust side
// (e.g. global summon shortcut could not be registered).
export async function listenStartupWarning(
  handler: EventCallback<string>
): Promise<UnlistenFn> {
  if (!isTauri()) return () => {};
  return await listen<string>('vibegrid://shortcut-warning', handler);
}

// ── Whisper Voice-to-Terminal (native, replaces Web Speech API) ────────────

export interface VoiceModelStatus {
  ready: boolean;
  path: string | null;
  sizeBytes: number | null;
}

export interface ModelProgress {
  downloaded: number;
  total: number;
  percent: number;
}

export async function voiceModelStatus(): Promise<VoiceModelStatus | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<VoiceModelStatus>('voice_model_status');
  } catch (e) {
    console.error('[VibeGrid] voice_model_status failed:', e);
    return null;
  }
}

/** Download (or confirm) the Whisper model; resolves to the model path. */
export async function voiceEnsureModel(): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<string>('voice_ensure_model');
  } catch (e) {
    console.error('[VibeGrid] voice_ensure_model failed:', e);
    throw e;
  }
}

export async function voiceStartRecording(): Promise<void> {
  if (!isTauri()) return;
  await invoke('voice_start_recording');
}

export async function voiceStopRecording(): Promise<string> {
  if (!isTauri()) return '';
  return await invoke<string>('voice_stop_recording');
}

export async function voiceCancelRecording(): Promise<void> {
  if (!isTauri()) return;
  await invoke('voice_cancel_recording');
}

export async function voiceIsRecording(): Promise<boolean> {
  if (!isTauri()) return false;
  return await invoke<boolean>('voice_is_recording');
}

/** Configure the auto-stop silence timeout (ms) used by the Rust watcher (gap 10). */
export async function voiceSetSilenceTimeout(ms: number): Promise<number> {
  if (!isTauri()) return ms;
  try {
    return await invoke<number>('voice_set_silence_timeout', { ms });
  } catch (e) {
    console.error('[VibeGrid] voice_set_silence_timeout failed:', e);
    return ms;
  }
}

/** Prefer a specific microphone by name ('' = system default) for recording (gap 14). */
export async function voiceSetInputDevice(name: string): Promise<void> {
  if (!isTauri()) return;
  try {
    await invoke('voice_set_input_device', { name });
  } catch (e) {
    console.error('[VibeGrid] voice_set_input_device failed:', e);
  }
}

/** Live mic level (0..1) for the real-time waveform while dictating. */
export interface AudioLevelPayload {
  level: number;
}

/** Emitted by the Rust auto-stop watcher when dictation ends by silence. */
export interface DictationResultPayload {
  text: string;
  auto: boolean;
}

/** Subscribe to live audio levels (~10/sec) for the waveform UI. */
export async function listenAudioLevel(
  handler: EventCallback<AudioLevelPayload>
): Promise<UnlistenFn> {
  if (!isTauri()) return () => {};
  return await listen<AudioLevelPayload>('vibegrid://audio-level', handler);
}

/** Subscribe to auto-stopped dictation results (silence-detected). */
export async function listenDictationResult(
  handler: EventCallback<DictationResultPayload>
): Promise<UnlistenFn> {
  if (!isTauri()) return () => {};
  return await listen<DictationResultPayload>('vibegrid://dictation-result', handler);
}

/** Subscribe to dictation errors (e.g. no audio captured). */
export async function listenDictationError(
  handler: EventCallback<{ error: string }>
): Promise<UnlistenFn> {
  if (!isTauri()) return () => {};
  return await listen<{ error: string }>('vibegrid://dictation-error', handler);
}

/** Subscribe to Whisper model download progress. */
export async function listenModelProgress(
  handler: EventCallback<ModelProgress>
): Promise<UnlistenFn> {
  if (!isTauri()) return () => {};
  return await listen<ModelProgress>('vibegrid://model-progress', handler);
}
