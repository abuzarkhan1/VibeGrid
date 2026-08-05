// Fuzzy subsequence scorer used by the command palette.
// Substring matches get a big bonus; otherwise character matches in order are scored.
export function fuzzyScore(query: string, target: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const t = target.toLowerCase();
  const subIdx = t.indexOf(q);
  if (subIdx >= 0) return 1000 - subIdx;
  let qi = 0;
  let score = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 10 + qi;
      qi++;
    }
  }
  return qi === q.length ? score : -1;
}

// Convert a raw keyboard event into the accelerator string format used by the store
// (e.g. "Mod+Shift+D"). Returns null for modifier-only presses.
export function eventToAccelerator(e: KeyboardEvent): string | null {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return null;
  const parts: string[] = [];
  if (e.metaKey || e.ctrlKey) parts.push('Mod');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  const code = e.code;
  let key = code;
  if (code.startsWith('Key')) key = code.slice(3);
  else if (code.startsWith('Digit')) key = code.slice(5);
  else if (code === 'Comma') key = ',';
  else if (code === 'Period') key = '.';
  else if (code === 'Slash') key = '/';
  else if (code === 'Backquote') key = '`';
  else if (code === 'Minus') key = '-';
  else if (code === 'Equal') key = '=';
  else if (code === 'BracketLeft') key = '[';
  else if (code === 'BracketRight') key = ']';
  else if (code === 'Backslash') key = '\\';
  else if (code === 'Semicolon') key = ';';
  else if (code === 'Quote') key = "'";
  else if (['Enter', 'Space', 'Tab', 'Backspace', 'Escape'].includes(code)) key = code;
  else if (code.startsWith('Arrow')) key = code;
  else if (/^F[1-9]$/.test(code)) key = code;
  else key = (e.key || code).toUpperCase();
  parts.push(key);
  return parts.join('+');
}

// Windows shells (cmd.exe, PowerShell) use different quoting than POSIX
// shells, and cmd.exe doesn't support bracketed paste at all — this appends
// the platform decision so drag-dropped paths / pastes behave on Windows too
// (audit: paths were always POSIX-quoted, breaking PowerShell/cmd insertion).
export function isWindowsPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  // Word-boundary match: /win/i would match "darwin" (macOS). We want an
  // exact Windows platform token (Win32/Win64/Windows) or a "Windows"
  // user agent — never "darwin".
  const platform = navigator.platform || '';
  const ua = navigator.userAgent || '';
  return /(^|\s)win(dows|32|64|ce)?(\s|$)/i.test(platform) || /windows/i.test(ua);
}

// Shell-escape a path for insertion into a shell. POSIX: single-quote quoting
// (' → '\''). PowerShell: single quotes are literal, escape a quote by
// DOUBLING it (''). cmd.exe: no quoting exists — wrap in double quotes.
export function escapeShellPath(p: string): string {
  if (isWindowsPlatform()) {
    return `'${p.replace(/'/g, "''")}'`;
  }
  return `'${p.replace(/'/g, `'\\''`)}'`;
}

// Wrap text in bracketed-paste markers — unless the shell is cmd.exe, which
// does not support the bracketed paste protocol and would print the escape
// sequences literally. PowerShell 7.4+ (Windows Terminal) supports it; raw
// text insertion is safe there anyway.
export function bracketedPaste(text: string): string {
  if (isWindowsPlatform()) {
    // Assume cmd.exe on bare Windows; raw text is the safe universal form.
    return text;
  }
  return `\x1b[200~${text}\x1b[201~`;
}
