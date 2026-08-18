import React, { useState } from 'react';
import {
  FileCode,
  FileText,
  Layout,
  Database,
  Check,
  Copy,
  GitCommit,
  Sparkles,
  X,
} from 'lucide-react';

export type DiffContentType = 'code' | 'markdown' | 'ui' | 'schema';

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
  initialMode = 'code',
  diffLines = DEFAULT_CODE_DIFF,
  stats = { additions: 6, deletions: 4 },
}) => {
  const [mode, setMode] = useState<DiffContentType>(initialMode);
  const [copied, setCopied] = useState(false);

  const handleCopyDiff = () => {
    const raw = diffLines.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#131420] select-none font-sans overflow-hidden">
      {/* Diff Header Bar */}
      <div className="h-10 px-3.5 bg-[#1A1B26] border-b border-white/[0.06] flex items-center justify-between shrink-0 border-b border-white/10 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-400">
            <GitCommit className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-mono font-medium truncate text-white/90 tracking-tight">
            {filePath}
          </span>
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-white/5 border border-white/10">
            <span style={{ color: 'var(--diff-add-text, #4ADE80)' }}>+{stats.additions}</span>
            <span className="text-white/40">/</span>
            <span style={{ color: 'var(--diff-remove-text, #F87171)' }}>-{stats.deletions}</span>
          </span>
        </div>

        {/* Content-Aware Mode Switcher */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <button
            onClick={() => setMode('code')}
            title="Monospace High-Contrast Code Diff"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${mode === 'code' ? 'bg-white/[0.10] text-white font-medium' : 'text-white/40 hover:text-white/70'}`}
          >
            <FileCode className="w-3 h-3" />
            <span className="hidden sm:inline">Code</span>
          </button>
          <button
            onClick={() => setMode('markdown')}
            title="Rendered Markdown Document Diff"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${mode === 'markdown' ? 'bg-white/[0.10] text-white font-medium' : 'text-white/40 hover:text-white/70'}`}
          >
            <FileText className="w-3 h-3" />
            <span className="hidden sm:inline">Markdown</span>
          </button>
          <button
            onClick={() => setMode('ui')}
            title="Visual UI Mockup Diff"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${mode === 'ui' ? 'bg-white/[0.10] text-white font-medium' : 'text-white/40 hover:text-white/70'}`}
          >
            <Layout className="w-3 h-3" />
            <span className="hidden sm:inline">UI Diff</span>
          </button>
          <button
            onClick={() => setMode('schema')}
            title="Structured Schema & Data Model Diff"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${mode === 'schema' ? 'bg-white/[0.10] text-white font-medium' : 'text-white/40 hover:text-white/70'}`}
          >
            <Database className="w-3 h-3" />
            <span className="hidden sm:inline">Schema</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyDiff}
            title="Copy Raw Diff (Cmd/Ctrl+C)"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.08] text-white/70 hover:text-white transition-all"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" style={{ color: 'var(--diff-add-text, #4ADE80)' }} />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Close Diff Panel"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/[0.08] hover:border-rose-500/40 text-white/70 hover:text-rose-300 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Diff Content */}
      <div className="flex-1 overflow-auto p-3 font-mono text-[12px] leading-relaxed">
        {mode === 'code' && (
          <div className="rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-black/40 ">
            <table className="w-full border-collapse text-left font-mono">
              <thead>
                <tr className="border-b border-white/10 glass-d3 text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                  <th className="w-10 py-1.5 px-2 text-right select-none border-r border-white/5">Old</th>
                  <th className="w-10 py-1.5 px-2 text-right select-none border-r border-white/5">New</th>
                  <th className="w-6 py-1.5 text-center select-none">+/-</th>
                  <th className="py-1.5 px-3">Diff Content</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {diffLines.map((line, idx) => {
                  const isAdd = line.type === 'add';
                  const isRemove = line.type === 'remove';

                  let rowStyle: React.CSSProperties = {};
                  let textStyle: React.CSSProperties = { color: 'var(--ink-primary, #F3F4F6)' };
                  let marker = ' ';

                  if (isAdd) {
                    rowStyle = {
                      backgroundColor: 'var(--diff-add-bg, rgba(34, 197, 94, 0.15))',
                      boxShadow: 'inset 3px 0 0 var(--diff-add-text, #4ADE80)',
                    };
                    textStyle = { color: 'var(--diff-add-text, #4ADE80)', fontWeight: 500 };
                    marker = '+';
                  } else if (isRemove) {
                    rowStyle = {
                      backgroundColor: 'var(--diff-remove-bg, rgba(239, 68, 68, 0.15))',
                      boxShadow: 'inset 3px 0 0 var(--diff-remove-text, #F87171)',
                    };
                    textStyle = { color: 'var(--diff-remove-text, #F87171)', fontWeight: 500 };
                    marker = '-';
                  }

                  return (
                    <tr
                      key={idx}
                      style={rowStyle}
                      className="hover:bg-white/[0.04] transition-colors group"
                    >
                      {/* Old Line Gutter */}
                      <td className="w-10 py-0.5 px-2 text-right select-none text-[11px] text-white/40 glass-d3 border-r border-white/5">
                        {line.lineOld ?? ''}
                      </td>
                      {/* New Line Gutter */}
                      <td className="w-10 py-0.5 px-2 text-right select-none text-[11px] text-white/40 glass-d3 border-r border-white/5">
                        {line.lineNew ?? ''}
                      </td>
                      {/* Sign Marker */}
                      <td
                        className="w-6 py-0.5 text-center select-none text-[12px] font-bold"
                        style={textStyle}
                      >
                        {marker}
                      </td>
                      {/* Monospace Code Line */}
                      <td className="py-0.5 px-3 whitespace-pre font-mono text-[12px]" style={textStyle}>
                        {line.text.replace(/^[+-]\s*/, '')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {mode === 'markdown' && (
          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#1A1B26] space-y-4 font-sans">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-400">
              <Sparkles className="w-4 h-4" />
              <span>Rendered Document Diff (Markdown Mode)</span>
            </div>
            <h2 className="text-base font-bold text-white/90 border-b border-white/10 pb-2">
              Autonomous Agent Supervisor Architecture
            </h2>
            <p className="text-xs text-white/70 leading-relaxed">
              Codex agents coordinate parallel execution threads across git worktrees and unified PTY runners.
            </p>
            <div
              className="p-3 rounded-lg border text-xs"
              style={{
                backgroundColor: 'var(--diff-add-bg, rgba(34, 197, 94, 0.15))',
                borderColor: 'var(--diff-add-text, #4ADE80)',
                color: 'var(--diff-add-text, #4ADE80)',
              }}
            >
              <strong>+ Added:</strong> Full support for 16-worker heterogeneous agent pods with autonomous PATH resolution and atomic worktree isolation.
            </div>
          </div>
        )}

        {mode === 'ui' && (
          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#1A1B26] font-sans space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-violet-400">
                <Layout className="w-4 h-4" />
                <span>Visual UI Mockup Diff</span>
              </div>
              <span className="text-[11px] font-mono text-white/70">Side-by-Side Surface Render</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div
                className="p-4 rounded-xl border space-y-2 bg-black/40"
                style={{ borderColor: 'var(--diff-remove-text, #F87171)' }}
              >
                <span
                  className="text-[10px] font-mono font-bold tracking-wider uppercase"
                  style={{ color: 'var(--diff-remove-text, #F87171)' }}
                >
                  Previous Surface Mockup
                </span>
                <div className="h-24 rounded-lg bg-black/50 border border-white/5 flex items-center justify-center text-xs text-white/40">
                  Single Terminal
                </div>
              </div>
              <div
                className="p-4 rounded-xl border space-y-2 bg-black/40"
                style={{ borderColor: 'var(--diff-add-text, #4ADE80)' }}
              >
                <span
                  className="text-[10px] font-mono font-bold tracking-wider uppercase"
                  style={{ color: 'var(--diff-add-text, #4ADE80)' }}
                >
                  Updated Glassmorphic Grid
                </span>
                <div
                  className="h-24 rounded-lg flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--diff-add-bg, rgba(34, 197, 94, 0.15))',
                    color: 'var(--diff-add-text, #4ADE80)',
                  }}
                >
                  Multi-Pane Agent Matrix
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'schema' && (
          <div className="p-5 rounded-xl border border-white/[0.08] bg-[#1A1B26] font-mono text-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 font-sans">
              <Database className="w-4 h-4" />
              <span>Structured Schema & Data Model Changes</span>
            </div>
            <div className="p-3 rounded-lg bg-black/50 border border-white/10 space-y-1.5">
              <div
                className="p-1.5 rounded"
                style={{
                  backgroundColor: 'var(--diff-remove-bg, rgba(239, 68, 68, 0.15))',
                  color: 'var(--diff-remove-text, #F87171)',
                }}
              >
                - type: SessionConfig &#123; maxThreads: 1 &#125;
              </div>
              <div
                className="p-1.5 rounded"
                style={{
                  backgroundColor: 'var(--diff-add-bg, rgba(34, 197, 94, 0.15))',
                  color: 'var(--diff-add-text, #4ADE80)',
                }}
              >
                + type: SessionConfig &#123; maxThreads: 16, worktreeIsolation: true, ptyMultiplexing: true &#125;
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Diff Footer Status */}
      <div className="h-7 px-3.5 bg-[#1A1B26] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/70 font-mono shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--diff-add-text, #4ADE80)' }}
          />
          <span className="text-white/90 font-medium">Stage Ready</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span>Encoding: UTF-8</span>
          <span>•</span>
          <span>LF</span>
          <span>•</span>
          <span className="text-violet-400">Functional Glassmorphic Diff</span>
        </div>
      </div>
    </div>
  );
};
