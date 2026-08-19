import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  GitCommit,
  X,
} from 'lucide-react';

export type DiffContentType = 'code';

interface DiffLineItem {
  type: 'context' | 'add' | 'remove';
  lineOld: number | null;
  lineNew: number | null;
  text: string;
}

interface ContentAwareDiffViewerProps {
  onClose?: () => void;
  filePath?: string;
  initialMode?: DiffContentType;
  diffLines?: DiffLineItem[];
  stats?: { additions: number; deletions: number };
}

const DEFAULT_CODE_DIFF: DiffLineItem[] = [
  { type: 'context', lineOld: 12, lineNew: 12, text: 'import { AgentSupervisor } from "./supervisor";' },
  { type: 'context', lineOld: 13, lineNew: 13, text: 'import { PTYRegistry } from "./pty";' },
  { type: 'remove', lineOld: 14, lineNew: null, text: '- const defaultMaxWorkers = 1;' },
  { type: 'add', lineOld: null, lineNew: 14, text: '+ const defaultMaxWorkers = 4; // Parallel autonomous fleet' },
  { type: 'context', lineOld: 15, lineNew: 15, text: '' },
  { type: 'remove', lineOld: 16, lineNew: null, text: '- export function createSession() {' },
  { type: 'remove', lineOld: 17, lineNew: null, text: '-   return new Session({ workers: 1 });' },
  { type: 'remove', lineOld: 18, lineNew: null, text: '- }' },
  { type: 'add', lineOld: null, lineNew: 16, text: '+ export function createSession(options?: SessionOptions) {' },
  { type: 'add', lineOld: null, lineNew: 17, text: '+   const supervisor = new AgentSupervisor({ maxWorkers: defaultMaxWorkers });' },
  { type: 'add', lineOld: null, lineNew: 18, text: '+   return new Session({ supervisor, ...options });' },
  { type: 'add', lineOld: null, lineNew: 19, text: '+ }' },
];

export const ContentAwareDiffViewer: React.FC<ContentAwareDiffViewerProps> = ({
  onClose,
  filePath = 'src/session/supervisor.ts',
  diffLines = DEFAULT_CODE_DIFF,
  stats = { additions: 6, deletions: 4 },
}) => {
  const [copied, setCopied] = useState(false);

  const renderedRows = useMemo(
    () =>
      diffLines.map((line, idx) => {
        const isAdd = line.type === 'add';
        const isRemove = line.type === 'remove';

        let rowStyle: React.CSSProperties = {};
        let textStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.8)' };
        let marker = ' ';

        if (isAdd) {
          rowStyle = {
            backgroundColor: 'rgba(255,255,255,0.05)',
            boxShadow: 'inset 3px 0 0 rgba(255,255,255,0.8)',
          };
          textStyle = { color: '#ffffff', fontWeight: 500 };
          marker = '+';
        } else if (isRemove) {
          rowStyle = {
            backgroundColor: 'rgba(255,255,255,0.02)',
            boxShadow: 'inset 3px 0 0 rgba(255,255,255,0.3)',
          };
          textStyle = { color: 'rgba(255,255,255,0.4)', fontWeight: 500 };
          marker = '-';
        }

        return { line, idx, rowStyle, textStyle, marker };
      }),
    [diffLines]
  );

  const handleCopyDiff = () => {
    const raw = diffLines.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-black select-none font-sans overflow-hidden">
      {}
      <div className="h-10 px-3.5 bg-black/40 backdrop-blur-xl border-b border-white/10 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/10 border border-white/20 text-white/80">
            <GitCommit className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-mono font-medium truncate text-white/90 tracking-tight">
            {filePath}
          </span>
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-white/5 border border-white/10">
            <span className="text-white">+{stats.additions}</span>
            <span className="text-white/40">/</span>
            <span className="text-white/50">-{stats.deletions}</span>
          </span>
        </div>

        {}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyDiff}
            title="Copy Raw Diff (Cmd/Ctrl+C)"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Close Diff Panel"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {}
      <div className="flex-1 overflow-auto p-3 font-mono text-[12px] leading-relaxed">
        <div className="rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-black/40 backdrop-blur-md">
          <table className="w-full border-collapse text-left font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-black/60 text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                <th className="w-10 py-1.5 px-2 text-right select-none border-r border-white/5">Old</th>
                <th className="w-10 py-1.5 px-2 text-right select-none border-r border-white/5">New</th>
                <th className="w-6 py-1.5 text-center select-none">+/-</th>
                <th className="py-1.5 px-3">Diff Content</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {renderedRows.map(({ line, idx, rowStyle, textStyle, marker }) => (
                <tr
                  key={idx}
                  style={rowStyle}
                  className="hover:bg-white/[0.04] transition-colors group"
                >
                  <td className="w-10 py-0.5 px-2 text-right select-none text-[11px] text-white/30 bg-black/40 border-r border-white/5">
                    {line.lineOld ?? ''}
                  </td>
                  <td className="w-10 py-0.5 px-2 text-right select-none text-[11px] text-white/30 bg-black/40 border-r border-white/5">
                    {line.lineNew ?? ''}
                  </td>
                  <td
                    className="w-6 py-0.5 text-center select-none text-[12px] font-bold"
                    style={textStyle}
                  >
                    {marker}
                  </td>
                  <td className="py-0.5 px-3 whitespace-pre font-mono text-[12px]" style={textStyle}>
                    {line.text.replace(/^[+-]\s*/, '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {}
      <div className="h-7 px-3.5 bg-black/40 backdrop-blur-xl border-t border-white/10 flex items-center justify-between text-[11px] text-white/40 font-mono shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white/80" />
          <span className="text-white/80 font-medium">Stage Ready</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span>Encoding: UTF-8</span>
          <span>•</span>
          <span>LF</span>
          <span>•</span>
          <span className="text-white/60">Functional Glassmorphic Diff</span>
        </div>
      </div>
    </div>
  );
};
