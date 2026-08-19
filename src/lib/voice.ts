export function isTypingTarget(target: EventTarget | null | undefined): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  if (target.classList.contains('xterm-helper-textarea')) return false;
  if (target.closest('.xterm')) return false;

  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;

  return target.isContentEditable || target.getAttribute('contenteditable') === 'true';
}

export function barHeights(level: number, count = 24, time = 0): number[] {
  const l = Math.min(1, Math.max(0, level));
  const center = (count - 1) / 2;

  const amplitude = 3 + 22 * (0.15 + 0.85 * l);
  return Array.from({ length: count }, (_, i) => {

    const d = (i - center) / (count * 0.3);
    const envelope = Math.exp(-d * d);

    const wave = 0.5 + 0.5 * Math.sin(time * 5 - i * 0.6);
    return 3 + (amplitude - 3) * envelope * wave;
  });
}
