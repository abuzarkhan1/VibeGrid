import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useUIStore } from './useUIStore';

describe('VibeGrid UI Store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUIStore.setState({
      toasts: [],
      activeWebglPanes: [],
      pendingClosePaneId: null,
      pendingSwitchWsId: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('guarded destructive flows (UX audit 7.1 / 3.6)', () => {
    it('requestClosePane sets pendingClosePaneId and cancel clears it', () => {
      useUIStore.getState().requestClosePane('term-1');
      expect(useUIStore.getState().pendingClosePaneId).toBe('term-1');

      useUIStore.getState().cancelPendingClose();
      expect(useUIStore.getState().pendingClosePaneId).toBeNull();
    });

    it('requestSwitchWorkspace sets pendingSwitchWsId and cancel clears it', () => {
      useUIStore.getState().requestSwitchWorkspace('ws-2');
      expect(useUIStore.getState().pendingSwitchWsId).toBe('ws-2');

      useUIStore.getState().cancelPendingSwitch();
      expect(useUIStore.getState().pendingSwitchWsId).toBeNull();
    });

    it('requesting a new close replaces the pending one', () => {
      useUIStore.getState().requestClosePane('term-1');
      useUIStore.getState().requestClosePane('term-2');
      expect(useUIStore.getState().pendingClosePaneId).toBe('term-2');
    });
  });

  describe('toasts', () => {
    it('addToast creates a toast with an id', () => {
      useUIStore.getState().addToast({ type: 'info', title: 'Hello' });
      const toasts = useUIStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].title).toBe('Hello');
      expect(toasts[0].id).toBeDefined();
    });

    it('auto-removes toasts after durationMs', () => {
      useUIStore.getState().addToast({ type: 'warning', title: 'Hi', durationMs: 100 });
      expect(useUIStore.getState().toasts).toHaveLength(1);
      vi.advanceTimersByTime(150);
      expect(useUIStore.getState().toasts).toHaveLength(0);
    });

    it('removeToast removes by id', () => {
      useUIStore.getState().addToast({ type: 'info', title: 'A' });
      const id = useUIStore.getState().toasts[0].id;
      useUIStore.getState().removeToast(id);
      expect(useUIStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('WebGL slot management', () => {
    it('acquires slots up to the max', () => {
      expect(useUIStore.getState().acquireWebglSlot('p1')).toBe(true);
      expect(useUIStore.getState().acquireWebglSlot('p2')).toBe(true);
      expect(useUIStore.getState().activeWebglPanes).toEqual(['p1', 'p2']);
    });

    it('returns false past maxWebglSlots (canvas fallback)', () => {
      const max = useUIStore.getState().maxWebglSlots;
      for (let i = 0; i < max; i++) {
        expect(useUIStore.getState().acquireWebglSlot(`p${i}`)).toBe(true);
      }
      expect(useUIStore.getState().acquireWebglSlot('overflow')).toBe(false);
    });

    it('releasing a slot frees capacity', () => {
      useUIStore.getState().acquireWebglSlot('p1');
      useUIStore.getState().releaseWebglSlot('p1');
      expect(useUIStore.getState().activeWebglPanes).toEqual([]);
      expect(useUIStore.getState().acquireWebglSlot('p2')).toBe(true);
    });

    it('is idempotent for re-acquiring the same pane', () => {
      useUIStore.getState().acquireWebglSlot('p1');
      expect(useUIStore.getState().acquireWebglSlot('p1')).toBe(true);
      expect(useUIStore.getState().activeWebglPanes).toHaveLength(1);
    });
  });

  describe('overlay toggles', () => {
    it('toggles command palette and settings', () => {
      useUIStore.getState().setCommandPaletteOpen(true);
      expect(useUIStore.getState().isCommandPaletteOpen).toBe(true);
      useUIStore.getState().toggleCommandPalette();
      expect(useUIStore.getState().isCommandPaletteOpen).toBe(false);
    });
  });
});
