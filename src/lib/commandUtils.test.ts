import { describe, it, expect } from 'vitest';
import { fuzzyScore, eventToAccelerator, escapeShellPath } from './commandUtils';

describe('fuzzyScore', () => {
  it('returns 0 for an empty query', () => {
    expect(fuzzyScore('', 'anything')).toBe(0);
    expect(fuzzyScore('   ', 'anything')).toBe(0);
  });

  it('scores substring matches highest', () => {
    const sub = fuzzyScore('open', 'Open Settings Panel');
    const seq = fuzzyScore('ost', 'Open Settings Panel');
    expect(sub).toBeGreaterThan(0);
    expect(seq).toBeGreaterThan(0);
    expect(sub).toBeGreaterThan(seq);
  });

  it('is case-insensitive', () => {
    expect(fuzzyScore('OPEN', 'open settings panel')).toBe(fuzzyScore('open', 'Open Settings Panel'));
  });

  it('returns -1 when the query chars cannot be matched in order', () => {
    expect(fuzzyScore('zzz', 'Open Settings Panel')).toBe(-1);
    expect(fuzzyScore('xop', 'Open Settings Panel')).toBe(-1);
  });

  it('matches characters in order (subsequence)', () => {
    expect(fuzzyScore('spa', 'Split Pane Horizontally')).toBeGreaterThan(0);
  });
});

describe('eventToAccelerator', () => {
  it('returns null for modifier-only presses', () => {
    expect(eventToAccelerator({ key: 'Control', metaKey: true } as KeyboardEvent)).toBeNull();
    expect(eventToAccelerator({ key: 'Shift' } as KeyboardEvent)).toBeNull();
    expect(eventToAccelerator({ key: 'Meta' } as KeyboardEvent)).toBeNull();
  });

  it('maps Cmd/Ctrl to Mod', () => {
    const ev = { key: 'd', code: 'KeyD', metaKey: true, ctrlKey: false, shiftKey: false, altKey: false } as KeyboardEvent;
    expect(eventToAccelerator(ev)).toBe('Mod+D');
  });

  it('includes Shift and Alt', () => {
    const ev = { key: 'D', code: 'KeyD', metaKey: true, ctrlKey: false, shiftKey: true, altKey: false } as KeyboardEvent;
    expect(eventToAccelerator(ev)).toBe('Mod+Shift+D');
  });

  it('maps plain letters without a modifier', () => {
    const ev = { key: 'x', code: 'KeyX', metaKey: false, ctrlKey: false, shiftKey: false, altKey: false } as KeyboardEvent;
    expect(eventToAccelerator(ev)).toBe('X');
  });

  it('maps digits and punctuation codes', () => {
    expect(eventToAccelerator({ key: '5', code: 'Digit5', metaKey: true } as KeyboardEvent)).toBe('Mod+5');
    expect(eventToAccelerator({ key: ',', code: 'Comma', metaKey: true } as KeyboardEvent)).toBe('Mod+,');
    expect(eventToAccelerator({ key: ' ', code: 'Space', metaKey: true } as KeyboardEvent)).toBe('Mod+Space');
  });

  it('maps arrow keys and function keys', () => {
    expect(eventToAccelerator({ key: 'ArrowLeft', code: 'ArrowLeft', metaKey: true } as KeyboardEvent)).toBe('Mod+ArrowLeft');
    expect(eventToAccelerator({ key: 'F5', code: 'F5', metaKey: true } as KeyboardEvent)).toBe('Mod+F5');
  });
});

describe('escapeShellPath', () => {
  it('wraps a simple path in single quotes', () => {
    expect(escapeShellPath('/Users/me/project')).toBe("'/Users/me/project'");
  });

  it('preserves spaces inside the quotes', () => {
    expect(escapeShellPath('/Users/me/My Project')).toBe("'/Users/me/My Project'");
  });

  it('escapes embedded single quotes', () => {
    expect(escapeShellPath("/Users/me/it's")).toBe("'/Users/me/it'\\''s'");
  });
});
