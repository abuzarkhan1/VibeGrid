import { WCAGContrastResult } from '@/types/customization';

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  } else if (clean.length === 8) {
    clean = clean.slice(0, 6);
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 255, g: 255, b: 255 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function calculateContrastRatio(fgHex: string, bgHex: string): number {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  const l1 = getRelativeLuminance(fg.r, fg.g, fg.b);
  const l2 = getRelativeLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function evaluateWCAG(fgHex: string, bgHex: string): WCAGContrastResult {
  const ratio = calculateContrastRatio(fgHex, bgHex);
  const rounded = Math.round(ratio * 10) / 10;
  const formattedRatio = `${rounded.toFixed(1)}:1`;

  if (ratio >= 7.0) {
    return {
      ratio,
      formattedRatio,
      rating: 'AAA',
      isAccessible: true,
      label: 'WCAG AAA · Enhanced',
    };
  }
  if (ratio >= 4.5) {
    return {
      ratio,
      formattedRatio,
      rating: 'AA',
      isAccessible: true,
      label: 'WCAG AA · Standard',
    };
  }
  if (ratio >= 3.0) {
    return {
      ratio,
      formattedRatio,
      rating: 'AA-large',
      isAccessible: true,
      label: 'WCAG AA · Large Only',
    };
  }
  return {
    ratio,
    formattedRatio,
    rating: 'Fail',
    isAccessible: false,
    label: 'WCAG Fail · Low Contrast',
  };
}
