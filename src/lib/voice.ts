/**
 * Pure helpers for Voice-to-Terminal.
 *
 * The speech engine is now native (Whisper via whisper-rs + cpal in the Rust
 * backend) — it no longer depends on the Web Speech API, so there is no
 * browser feature detection needed. These helpers stay pure and unit-testable.
 */

/**
 * True when the event target is a real text input the user is typing in.
 *
 * NOTE: xterm.js captures ALL terminal keyboard input through a hidden helper
 * `<textarea class="xterm-helper-textarea">` that stays focused while any pane
 * is active. It is not a user text field — if we treated it as one, the voice
 * shortcut would be silently swallowed whenever the terminal has focus (which
 * is the default state). Exclude it (and anything inside an `.xterm` root)
 * explicitly so dictation always works from the terminal.
 */
export function isTypingTarget(target: EventTarget | null | undefined): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  // xterm.js hidden input textarea — always focused, never a real typing target.
  if (target.classList.contains('xterm-helper-textarea')) return false;
  if (target.closest('.xterm')) return false;

  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  // jsdom does not reliably reflect isContentEditable, so check the attribute too.
  return target.isContentEditable || target.getAttribute('contenteditable') === 'true';
}

/**
 * Per-bar heights (px) for the live voice waveform — a real traveling wave.
 *
 * Each bar sits on a bell/dome envelope (taller in the middle, tapering to the
 * edges) and oscillates with a per-bar phase offset that advances with `time`,
 * so the crests flow across the indicator like Siri/AirPods waves instead of a
 * flat equalizer. Amplitude scales with the 0..1 audio level; a small idle
 * floor keeps a gentle shimmer even before speech is detected.
 */
export function barHeights(level: number, count = 24, time = 0): number[] {
  const l = Math.min(1, Math.max(0, level));
  const center = (count - 1) / 2;
  // Idle floor keeps ~6px shimmer at level 0; speech drives up to ~25px.
  const amplitude = 3 + 22 * (0.15 + 0.85 * l);
  return Array.from({ length: count }, (_, i) => {
    // Dome envelope: 1 in the middle, ~0 at the edges.
    const d = (i - center) / (count * 0.3);
    const envelope = Math.exp(-d * d);
    // Traveling wave: each bar has its own phase; time shifts them all.
    const wave = 0.5 + 0.5 * Math.sin(time * 5 - i * 0.6);
    return 3 + (amplitude - 3) * envelope * wave;
  });
}
