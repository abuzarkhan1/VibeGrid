// Shared per-pane identity colors (cycled by pane tree-order index).
// Plain hex so the badge + rail render identically on every webview — no
// Tailwind class generation, no CSS-variable opacity, no compositing tricks.
const PANE_COLORS = [
  '#3c95f0', '#2dd4bf', '#a78bfa', '#fbbf24',
  '#fb7185', '#34d399', '#f472b6', '#38bdf8',
  '#a3e635', '#c084fc',
] as const;

/** Color for a 0-based pane index (clamped; cycles after 10 panes). */
export function paneColorForIndex(index: number): string {
  const n = Math.max(0, index);
  return PANE_COLORS[n % PANE_COLORS.length];
}
