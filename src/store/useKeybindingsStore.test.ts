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

  // Audit: global-summon + voice-toggle are now reassignable store bindings.
  it('defaults the global-summon binding to Mod+Shift+Space', () => {
    expect(useKeybindingsStore.getState().keybindings['global-summon'].defaultKey).toBe('Mod+Shift+Space');
    expect(useKeybindingsStore.getState().keybindings['global-summon'].category).toBe('Global');
  });

  it('matches the global-summon default', () => {
    const ev = new KeyboardEvent('keydown', { key: ' ', code: 'Space', shiftKey: true, metaKey: true });
    expect(useKeybindingsStore.getState().matchesKeybinding(ev, 'global-summon')).toBe(true);
    const wrong = new KeyboardEvent('keydown', { key: ' ', code: 'Space', metaKey: true });
    expect(useKeybindingsStore.getState().matchesKeybinding(wrong, 'global-summon')).toBe(false);
  });

  it('defaults the voice-toggle binding to Mod+Shift+V', () => {
    expect(useKeybindingsStore.getState().keybindings['voice-toggle'].defaultKey).toBe('Mod+Shift+V');
    expect(useKeybindingsStore.getState().keybindings['voice-toggle'].category).toBe('Voice');
  });

  it('matches the voice-toggle default', () => {
    const ev = new KeyboardEvent('keydown', { key: 'V', code: 'KeyV', shiftKey: true, metaKey: true });
    expect(useKeybindingsStore.getState().matchesKeybinding(ev, 'voice-toggle')).toBe(true);
  });

  it('reassigning the global-summon binding updates matchesKeybinding', () => {
    const ok = useKeybindingsStore.getState().updateKeybinding('global-summon', 'Mod+Shift+G');
    expect(ok).toBe(true);
    const old = new KeyboardEvent('keydown', { key: ' ', code: 'Space', shiftKey: true, metaKey: true });
    expect(useKeybindingsStore.getState().matchesKeybinding(old, 'global-summon')).toBe(false);
    const fresh = new KeyboardEvent('keydown', { key: 'G', code: 'KeyG', shiftKey: true, metaKey: true });
    expect(useKeybindingsStore.getState().matchesKeybinding(fresh, 'global-summon')).toBe(true);
  });
});
