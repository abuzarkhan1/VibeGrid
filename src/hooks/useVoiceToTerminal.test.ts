import { describe, it, expect } from 'vitest';
import { isTypingTarget, barHeights } from '@/lib/voice';

describe('isTypingTarget', () => {
  it('returns false for non-elements and null', () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(undefined)).toBe(false);
  });

  it('returns true for INPUT and TEXTAREA', () => {
    const input = document.createElement('input');
    expect(isTypingTarget(input)).toBe(true);
    const textarea = document.createElement('textarea');
    expect(isTypingTarget(textarea)).toBe(true);
    const select = document.createElement('select');
    expect(isTypingTarget(select)).toBe(true);
  });

  it('returns false for regular elements (div, button)', () => {
    const div = document.createElement('div');
    expect(isTypingTarget(div)).toBe(false);
    const button = document.createElement('button');
    expect(isTypingTarget(button)).toBe(false);
  });

  it('returns false for xterm\'s hidden helper textarea (the always-focused terminal input)', () => {
    const textarea = document.createElement('textarea');
    textarea.className = 'xterm-helper-textarea';
    // Even though it is a TEXTAREA, xterm\'s hidden input must not block the voice shortcut.
    expect(isTypingTarget(textarea)).toBe(false);
  });

  it('returns false for elements inside an .xterm root (screen / scroll area)', () => {
    const root = document.createElement('div');
    root.className = 'xterm';
    const screen = document.createElement('div');
    screen.className = 'xterm-screen';
    const textarea = document.createElement('textarea');
    textarea.className = 'xterm-helper-textarea';
    screen.appendChild(textarea);
    root.appendChild(screen);
    document.body.appendChild(root);
    try {
      expect(isTypingTarget(textarea)).toBe(false);
    } finally {
      document.body.removeChild(root);
    }
  });

  it('returns true for contentEditable elements', () => {
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    expect(isTypingTarget(editable)).toBe(true);
  });
});

describe('barHeights', () => {
  it('returns count bars and clamps level into 0..1', () => {
    const bars = barHeights(0.5, 24);
    expect(bars).toHaveLength(24);
    expect(barHeights(2, 8)).toHaveLength(8);
    expect(barHeights(-1, 4)).toHaveLength(4);
  });

  it('keeps a small idle shimmer at level 0 and respects the 3px floor', () => {
    const bars = barHeights(0, 24);
    expect(bars.every((h) => h >= 3)).toBe(true);
    // Idle shimmer stays low (the dome envelope caps it well under speech levels).
    expect(Math.max(...bars)).toBeLessThan(8);
  });

  it('builds a dome envelope: middle bars taller than edges at full level', () => {
    const bars = barHeights(1, 24);
    expect(bars[12]).toBeGreaterThan(bars[0]);
    expect(bars[12]).toBeGreaterThan(bars[23]);
    expect(Math.max(...bars)).toBeLessThanOrEqual(26);
  });

  it('scales heights with level and stays deterministic', () => {
    const low = barHeights(0.1, 24);
    const high = barHeights(1, 24);
    // Every bar is taller (or equal) at a higher level…
    expect(high.every((h, i) => h >= low[i])).toBe(true);
    // …and the peak stays within bounds.
    expect(Math.max(...high)).toBeLessThanOrEqual(26);
    expect(Math.min(...high)).toBeGreaterThanOrEqual(3);
    // Deterministic: same input → same output.
    expect(barHeights(0.5, 24)).toEqual(barHeights(0.5, 24));
  });

  it('advances the wave over time (crests move with the time clock)', () => {
    const t0 = barHeights(0.5, 24, 0);
    const t1 = barHeights(0.5, 24, 0.3);
    const t2 = barHeights(0.5, 24, 0.6);
    // A traveling wave must actually change bar heights as time advances.
    expect(t0).not.toEqual(t1);
    expect(t1).not.toEqual(t2);
    expect(t0).not.toEqual(t2);
  });
});
