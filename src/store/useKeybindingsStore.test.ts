import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKeybindingsStore } from './useKeybindingsStore';

describe('VibeGrid Keybindings Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useKeybindingsStore.getState().resetKeybindings();
  });

  it('updates a binding and persists it', () => {
    const ok = useKeybindingsStore.getState().updateKeybinding('split-horizontal', 'Mod+E');
    expect(ok).toBe(true);
    expect(useKeybindingsStore.getState().keybindings['split-horizontal'].currentKey).toBe('Mod+E');
    expect(localStorage.getItem('vibegrid_keybindings_v1')).toContain('Mod+E');
  });

  it('rejects an exact conflict with another binding', () => {
    // 'open-settings' tries to take split-horizontal's Mod+D → rejected
    const ok = useKeybindingsStore.getState().updateKeybinding('open-settings', 'Mod+D');
    expect(ok).toBe(false);
    expect(useKeybindingsStore.getState().keybindings['open-settings'].currentKey).toBe('Mod+,');
  });

  it('treats Mod / Cmd / Ctrl aliases as the same key (audit find 7)', () => {
    // 'Ctrl+D' is an alias of split-horizontal's 'Mod+D' — must conflict since
    // it matches identically at runtime on most platforms.
    const ok = useKeybindingsStore.getState().updateKeybinding('open-settings', 'Ctrl+D');
    expect(ok).toBe(false);

    // 'Cmd+D' is the same effective key too.
    const ok2 = useKeybindingsStore.getState().updateKeybinding('command-palette', 'Cmd+D');
    expect(ok2).toBe(false);
  });

  it('allows a genuinely different binding', () => {
    const ok = useKeybindingsStore.getState().updateKeybinding('split-horizontal', 'Alt+D');
    expect(ok).toBe(true);
  });

  it('matchesKeybinding respects the current stored binding', () => {
    useKeybindingsStore.getState().updateKeybinding('open-settings', 'Mod+S');
    const ev = new KeyboardEvent('keydown', { key: 's', code: 'KeyS', metaKey: true });
    expect(useKeybindingsStore.getState().matchesKeybinding(ev, 'open-settings')).toBe(true);
    const wrong = new KeyboardEvent('keydown', { key: 's', code: 'KeyS' });
    expect(useKeybindingsStore.getState().matchesKeybinding(wrong, 'open-settings')).toBe(false);
  });

  it('matches single-character keys via code', () => {
    const ev = new KeyboardEvent('keydown', { key: 'D', code: 'KeyD', shiftKey: true, metaKey: true });
    expect(useKeybindingsStore.getState().matchesKeybinding(ev, 'split-vertical')).toBe(true);
  });
});
