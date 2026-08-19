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

export function isWindowsPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;

  const platform = navigator.platform || '';
  const ua = navigator.userAgent || '';
  return /(^|\s)win(dows|32|64|ce)?(\s|$)/i.test(platform) || /windows/i.test(ua);
}

export function escapeShellPath(p: string): string {
  if (isWindowsPlatform()) {
    return `'${p.replace(/'/g, "''")}'`;
  }
  return `'${p.replace(/'/g, `'\\''`)}'`;
}

export function bracketedPaste(text: string): string {
  if (isWindowsPlatform()) {

    return text;
  }
  return `\x1b[200~${text}\x1b[201~`;
}
