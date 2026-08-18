import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  getRelativeLuminance,
  calculateContrastRatio,
  evaluateWCAG,
} from './wcagContrast';

describe('WCAG Contrast Validation Engine', () => {
  it('correctly converts 3-digit and 6-digit hex strings to RGB', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#3c95f0')).toEqual({ r: 60, g: 149, b: 240 });
  });

  it('computes relative luminance for pure black and white', () => {
    expect(getRelativeLuminance(0, 0, 0)).toBe(0);
    expect(getRelativeLuminance(255, 255, 255)).toBe(1);
  });

  it('calculates 21:1 contrast ratio for pure black on pure white', () => {
    const ratio = calculateContrastRatio('#ffffff', '#000000');
    expect(ratio).toBeCloseTo(21.0, 1);
  });

  it('evaluates WCAG rating levels accurately', () => {
    // Pure white on black -> AAA
    const resAAA = evaluateWCAG('#ffffff', '#08080a');
    expect(resAAA.rating).toBe('AAA');
    expect(resAAA.isAccessible).toBe(true);

    // Medium gray on dark -> AA or AA-large
    const resAA = evaluateWCAG('#abb2bf', '#282c34');
    expect(['AAA', 'AA']).toContain(resAA.rating);
    expect(resAA.isAccessible).toBe(true);

    // Dark gray on black -> Fail
    const resFail = evaluateWCAG('#222222', '#000000');
    expect(resFail.rating).toBe('Fail');
    expect(resFail.isAccessible).toBe(false);
  });
});
