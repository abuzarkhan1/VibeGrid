import { invoke } from '@tauri-apps/api/core';
import { listen, EventCallback, UnlistenFn } from '@tauri-apps/api/event';

// Check if running inside Tauri
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export async function spawnPty(cols: number, rows: number, cwd?: string): Promise<string> {
  if (!isTauri()) {
    console.warn('[VibeGrid] Not running in Tauri; returning mock PTY pane ID');
    return `mock-pty-${Date.now()}`;
  }
  return await invoke<string>('spawn_pty', { cols, rows, cwd });
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

export async function listenTerminalBatch(
  handler: EventCallback<Record<string, string>>
): Promise<UnlistenFn> {
  if (!isTauri()) {
    // Return dummy unlisten function for mock
    return () => {};
  }
  return await listen<Record<string, string>>('terminal-batch', handler);
}
