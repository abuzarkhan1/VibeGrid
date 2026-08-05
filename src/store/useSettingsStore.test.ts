import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSettingsStore, THEMES } from './useSettingsStore';
import { setBatchInterval, voiceSetSilenceTimeout, voiceSetInputDevice } from '@/lib/tauri';

vi.mock('@/lib/tauri', () => ({
  setBatchInterval: vi.fn(async (intervalMs: number) => intervalMs),
  voiceSetSilenceTimeout: vi.fn(async (ms: number) => ms),
  voiceSetInputDevice: vi.fn(async () => {}),
  // Customization audit C28/C9: voice language/model + autostart are pushed to
  // the Rust backend on reset/import/update — mock them like the others.
  voiceSetLanguage: vi.fn(async () => {}),
  voiceSetModelSize: vi.fn(async () => {}),
  autostartSetEnabled: vi.fn(async () => {}),
}));

const STORAGE_KEY = 'vibegrid_settings_v2';
const LEGACY_STORAGE_KEY = 'vibegrid_settings_v1';
const DEFAULT_THEME = 'vibeDark';

describe('VibeGrid Settings Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset to a known baseline for each test
    useSettingsStore.getState().resetSettings();
  });

  it('initializes ipcBatchIntervalMs to 16', () => {
    expect(useSettingsStore.getState().ipcBatchIntervalMs).toBe(16);
  });

  it('clamps ipcBatchIntervalMs to the [4, 2000] range', () => {
    useSettingsStore.getState().setIpcBatchIntervalMs(1);
    expect(useSettingsStore.getState().ipcBatchIntervalMs).toBe(4);

    useSettingsStore.getState().setIpcBatchIntervalMs(5000);
    expect(useSettingsStore.getState().ipcBatchIntervalMs).toBe(2000);

    useSettingsStore.getState().setIpcBatchIntervalMs(33);
    expect(useSettingsStore.getState().ipcBatchIntervalMs).toBe(33);
  });

  it('rounds fractional ipcBatchIntervalMs values', () => {
    useSettingsStore.getState().setIpcBatchIntervalMs(16.6);
    expect(useSettingsStore.getState().ipcBatchIntervalMs).toBe(17);
  });

  it('pushes the clamped interval to the Tauri backend', () => {
    useSettingsStore.getState().setIpcBatchIntervalMs(9);
    expect(setBatchInterval).toHaveBeenCalledWith(9);

    useSettingsStore.getState().setIpcBatchIntervalMs(3);
    expect(setBatchInterval).toHaveBeenLastCalledWith(4);
  });

  describe('new options (UX overhaul)', () => {
    it('clamps fontSize to [8, 32]', () => {
      useSettingsStore.getState().setFontSize(40);
      expect(useSettingsStore.getState().fontSize).toBe(32);

      useSettingsStore.getState().setFontSize(4);
      expect(useSettingsStore.getState().fontSize).toBe(8);

      useSettingsStore.getState().setFontSize(18);
      expect(useSettingsStore.getState().fontSize).toBe(18);
    });

    // Customization audit L4/L5/L6: the clamp bounds are now configurable
    // settings; defaults widened (scrollback 1e6, lineHeight 0.8–2.5, opacity
    // 0.1–1) so users can go truly translucent / very tight or tall.
    it('clamps scrollback to the default [100, 1000000] range', () => {
      useSettingsStore.getState().setScrollback(10);
      expect(useSettingsStore.getState().scrollback).toBe(100);

      useSettingsStore.getState().setScrollback(5_000_000);
      expect(useSettingsStore.getState().scrollback).toBe(1000000);

      useSettingsStore.getState().setScrollback(5000);
      expect(useSettingsStore.getState().scrollback).toBe(5000);
    });

    it('clamps lineHeight to the default [0.8, 2.5] with 2 decimals', () => {
      useSettingsStore.getState().setLineHeight(0.5);
      expect(useSettingsStore.getState().lineHeight).toBe(0.8);

      useSettingsStore.getState().setLineHeight(3);
      expect(useSettingsStore.getState().lineHeight).toBe(2.5);

      useSettingsStore.getState().setLineHeight(1.333);
      expect(useSettingsStore.getState().lineHeight).toBe(1.33);
    });

    it('clamps terminalOpacity to the default [0.1, 1] range', () => {
      useSettingsStore.getState().setTerminalOpacity(0.1);
      expect(useSettingsStore.getState().terminalOpacity).toBe(0.1);

      useSettingsStore.getState().setTerminalOpacity(0.85);
      expect(useSettingsStore.getState().terminalOpacity).toBe(0.85);
    });

    it('toggles fontLigatures and voiceToTerminal', () => {
      useSettingsStore.getState().setFontLigatures(false);
      expect(useSettingsStore.getState().fontLigatures).toBe(false);

      useSettingsStore.getState().setVoiceToTerminal(true);
      expect(useSettingsStore.getState().voiceToTerminal).toBe(true);
    });

    it('font size increment/decrement/reset helpers work', () => {
      useSettingsStore.getState().setFontSize(14);
      useSettingsStore.getState().increaseFontSize();
      expect(useSettingsStore.getState().fontSize).toBe(15);

      useSettingsStore.getState().decreaseFontSize();
      expect(useSettingsStore.getState().fontSize).toBe(14);

      useSettingsStore.getState().resetFontSize();
      expect(useSettingsStore.getState().fontSize).toBe(14);
    });

    it('setThemeName resolves valid theme keys', () => {
      useSettingsStore.getState().setThemeName('nord');
      expect(useSettingsStore.getState().themeName).toBe('nord');
      expect(THEMES[useSettingsStore.getState().themeName]).toBeDefined();
    });

    it('setThemeName falls back to the default for unknown keys', () => {
      useSettingsStore.getState().setThemeName('dracula');
      expect(useSettingsStore.getState().themeName).toBe(DEFAULT_THEME);
      expect(THEMES[useSettingsStore.getState().themeName]).toBeDefined();
    });

    // Customization audit L8: silence-timeout bounds widened to [200, 15000].
    it('clamps voiceSilenceTimeoutMs to the default [200, 15000] and pushes to Rust (gap 10)', () => {
      useSettingsStore.getState().setVoiceSilenceTimeoutMs(100);
      expect(useSettingsStore.getState().voiceSilenceTimeoutMs).toBe(200);
      expect(voiceSetSilenceTimeout).toHaveBeenCalledWith(200);

      useSettingsStore.getState().setVoiceSilenceTimeoutMs(20000);
      expect(useSettingsStore.getState().voiceSilenceTimeoutMs).toBe(15000);
      expect(voiceSetSilenceTimeout).toHaveBeenLastCalledWith(15000);

      useSettingsStore.getState().setVoiceSilenceTimeoutMs(1200);
      expect(useSettingsStore.getState().voiceSilenceTimeoutMs).toBe(1200);
      expect(voiceSetSilenceTimeout).toHaveBeenLastCalledWith(1200);
    });

    it('defaults voiceInputDevice to system default and pushes selections to Rust (gap 14)', () => {
      expect(useSettingsStore.getState().voiceInputDevice).toBe('');
      useSettingsStore.getState().setVoiceInputDevice('MacBook Pro Microphone');
      expect(useSettingsStore.getState().voiceInputDevice).toBe('MacBook Pro Microphone');
      expect(voiceSetInputDevice).toHaveBeenCalledWith('MacBook Pro Microphone');
      // '' resets to the system default.
      useSettingsStore.getState().setVoiceInputDevice('');
      expect(voiceSetInputDevice).toHaveBeenLastCalledWith('');
    });
  });

  describe('persistence', () => {
    it('writes settings to localStorage on change', () => {
      useSettingsStore.getState().setFontSize(20);
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed.fontSize).toBe(20);
    });

    it('restores persisted settings on a fresh module load', async () => {
      useSettingsStore.getState().setFontSize(21);
      useSettingsStore.getState().setThemeName('nord');
      useSettingsStore.getState().setVoiceSilenceTimeoutMs(2000);

      // Simulate app restart: clear the module registry so the store re-initializes
      vi.resetModules();
      const { useSettingsStore: FreshStore } = await import('./useSettingsStore');
      expect(FreshStore.getState().fontSize).toBe(21);
      expect(FreshStore.getState().themeName).toBe('nord');
      expect(FreshStore.getState().voiceSilenceTimeoutMs).toBe(2000);
    });
  });

  describe('export / import / reset', () => {
    it('exports a JSON string with current settings', () => {
      useSettingsStore.getState().setFontSize(17);
      const out = useSettingsStore.getState().exportSettings();
      const parsed = JSON.parse(out);
      expect(parsed.fontSize).toBe(17);
      expect(parsed.themeName).toBeDefined();
    });

    it('imports valid JSON and applies it', () => {
      const json = JSON.stringify({ fontSize: 24, themeName: 'nord', scrollback: 999 });
      const ok = useSettingsStore.getState().importSettings(json);
      expect(ok).toBe(true);
      expect(useSettingsStore.getState().fontSize).toBe(24);
      expect(useSettingsStore.getState().themeName).toBe('nord');
      expect(useSettingsStore.getState().scrollback).toBe(999);
      // Clamped after import
      expect(setBatchInterval).toHaveBeenCalledWith(useSettingsStore.getState().ipcBatchIntervalMs);
    });

    it('imports fall back to the default theme for unknown theme keys', () => {
      const json = JSON.stringify({ themeName: 'midnightBlue' });
      const ok = useSettingsStore.getState().importSettings(json);
      expect(ok).toBe(true);
      expect(useSettingsStore.getState().themeName).toBe(DEFAULT_THEME);
    });

    it('import pushes imported voice settings to the Rust backend (audit find 3)', () => {
      const json = JSON.stringify({ fontSize: 20, voiceSilenceTimeoutMs: 2400, voiceInputDevice: 'USB Mic' });
      useSettingsStore.getState().importSettings(json);
      expect(useSettingsStore.getState().voiceSilenceTimeoutMs).toBe(2400);
      expect(useSettingsStore.getState().voiceInputDevice).toBe('USB Mic');
      expect(voiceSetSilenceTimeout).toHaveBeenLastCalledWith(2400);
      expect(voiceSetInputDevice).toHaveBeenLastCalledWith('USB Mic');
    });

    it('resetSettings pushes default voice settings to the Rust backend (audit find 3)', () => {
      useSettingsStore.getState().setVoiceSilenceTimeoutMs(3000);
      useSettingsStore.getState().setVoiceInputDevice('USB Mic');
      useSettingsStore.getState().resetSettings();
      expect(useSettingsStore.getState().voiceSilenceTimeoutMs).toBe(1600);
      expect(useSettingsStore.getState().voiceInputDevice).toBe('');
      expect(voiceSetSilenceTimeout).toHaveBeenLastCalledWith(1600);
      expect(voiceSetInputDevice).toHaveBeenLastCalledWith('');
    });

    it('rejects invalid JSON without corrupting state', () => {
      useSettingsStore.getState().setFontSize(18);
      const ok = useSettingsStore.getState().importSettings('not json');
      expect(ok).toBe(false);
      expect(useSettingsStore.getState().fontSize).toBe(18);
    });

    it('ignores unknown keys on import', () => {
      const json = JSON.stringify({ fontSize: 22, totallyUnknown: true });
      useSettingsStore.getState().importSettings(json);
      expect(useSettingsStore.getState().fontSize).toBe(22);
      expect((useSettingsStore.getState() as unknown as Record<string, unknown>).totallyUnknown).toBeUndefined();
    });

    it('resetSettings restores defaults and clears storage', () => {
      useSettingsStore.getState().setFontSize(30);
      useSettingsStore.getState().setThemeName('nord');
      useSettingsStore.getState().resetSettings();
      expect(useSettingsStore.getState().fontSize).toBe(14);
      expect(useSettingsStore.getState().themeName).toBe(DEFAULT_THEME);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    // Customization audit S2: a legacy v1 blob is migrated in place to the v2
    // schema (schemaVersion stamped, themeMode defaulted, canonical key used).
    it('migrates legacy v1 storage to the v2 schema on load', async () => {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ fontSize: 19, themeName: 'nord' }));
      vi.resetModules();
      const { useSettingsStore: FreshStore } = await import('./useSettingsStore');
      expect(FreshStore.getState().fontSize).toBe(19);
      expect(FreshStore.getState().themeName).toBe('nord');
      expect(FreshStore.getState().schemaVersion).toBe(2);
      expect(FreshStore.getState().themeMode).toBe('dark');
      // The legacy key is consumed and the canonical v2 key is written.
      expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw as string).schemaVersion).toBe(2);
    });

    // Customization audit C3: themeMode defaults to dark and persists.
    it('themeMode defaults to dark and persists through updateSettings', () => {
      expect(useSettingsStore.getState().themeMode).toBe('dark');
      useSettingsStore.getState().updateSettings({ themeMode: 'light' });
      expect(useSettingsStore.getState().themeMode).toBe('light');
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw as string).themeMode).toBe('light');
    });

    // Customization audit S1: named settings profiles round-trip.
    it('settings profiles save / apply / delete roundtrip', () => {
      useSettingsStore.getState().setFontSize(23);
      expect(useSettingsStore.getState().saveSettingsProfile('Work')).toBe(true);
      expect(useSettingsStore.getState().listSettingsProfiles()).toContain('Work');

      // Change the live settings, then apply the profile back.
      useSettingsStore.getState().setFontSize(10);
      expect(useSettingsStore.getState().loadSettingsProfile('Work')).toBe(true);
      expect(useSettingsStore.getState().fontSize).toBe(23);

      useSettingsStore.getState().deleteSettingsProfile('Work');
      expect(useSettingsStore.getState().listSettingsProfiles()).not.toContain('Work');
    });
  });
});
