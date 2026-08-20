import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Check,
  Copy,
  GitCommit,
  GitBranch,
  RefreshCw,
  X,
  FileCode,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { getGitDiff, GitDiffResponse, GitFileEntry } from '@/lib/tauri';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

interface ContentAwareDiffViewerProps {
  onClose?: () => void;
  filePath?: string;
  cwd?: string;
}

export const ContentAwareDiffViewer: React.FC<ContentAwareDiffViewerProps> = ({
  onClose,
  filePath: initialFilePath,
  cwd: propCwd,
}) => {
  const root = usePaneStore((s) => s.root);
  const focusedPaneId = usePaneStore((s) => s.focusedPaneId);
  const terminals = getTerminalNodes(root);
  const focusedTerminal = terminals.find((t) => t.id === focusedPaneId) || terminals[0];

  const activeWorkspace = useWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === s.activeWorkspaceId)
  );

  const effectiveCwd = propCwd || focusedTerminal?.cwd || activeWorkspace?.overrides?.defaultCwd || '';

  const [diffData, setDiffData] = useState<GitDiffResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>(initialFilePath || '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileDropdownOpen, setFileDropdownOpen] = useState(false);

  const fetchDiff = useCallback(
    async (targetFile?: string) => {
      setLoading(true);
      try {
        const res = await getGitDiff(effectiveCwd, targetFile || selectedFile);
        setDiffData(res);
        if (!selectedFile && res.active_file) {
          setSelectedFile(res.active_file);
        }
      } catch (err) {
        console.error('[DiffViewer] Failed to load git diff:', err);
      } finally {
        setLoading(false);
      }
    },
    [effectiveCwd, selectedFile]
  );

  useEffect(() => {
    fetchDiff();
  }, [fetchDiff]);

  const handleSelectFile = (path: string) => {
    setSelectedFile(path);
    setFileDropdownOpen(false);
    fetchDiff(path);
  };

  const handleCopyDiff = () => {
    if (!diffData || !diffData.diff_lines) return;
    const raw = diffData.diff_lines.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderedRows = useMemo(() => {
    if (!diffData || !diffData.diff_lines) return [];
    return diffData.diff_lines.map((line, idx) => {
      const isAdd = line.line_type === 'add';
      const isRemove = line.line_type === 'remove';

      let rowBg = 'hover:bg-[#303236]/40';
      let textStyle: React.CSSProperties = { color: '#d1d2d3' };
      let marker = ' ';
      let markerColor = 'text-[#6b6c6d]';
      let leftBorder = 'border-l-2 border-transparent';

      if (isAdd) {
        rowBg = 'bg-[#5683da]/10 hover:bg-[#5683da]/15';
        leftBorder = 'border-l-2 border-[#5683da]';
        textStyle = { color: '#ffffff', fontWeight: 500 };
        marker = '+';
        markerColor = 'text-[#5683da] font-bold';
      } else if (isRemove) {
        rowBg = 'bg-[#ff8964]/10 hover:bg-[#ff8964]/15';
        leftBorder = 'border-l-2 border-[#ff8964]';
        textStyle = {
          color: '#a9a9aa',
          textDecoration: 'line-through',
          textDecorationColor: 'rgba(255, 137, 100, 0.4)',
        };
        marker = '-';
        markerColor = 'text-[#ff8964] font-bold';
      }

      return { line, idx, rowBg, leftBorder, textStyle, marker, markerColor };
    });
  }, [diffData]);

  const getStatusBadge = (file: GitFileEntry) => {
    switch (file.status) {
      case 'added':
        return <span className="text-[10px] font-mono text-[#27c93f] font-bold">A</span>;
      case 'deleted':
        return <span className="text-[10px] font-mono text-[#ff8964] font-bold">D</span>;
      case 'untracked':
        return <span className="text-[10px] font-mono text-[#ff8964] font-bold">U</span>;
      case 'modified':
      default:
        return <span className="text-[10px] font-mono text-[#5683da] font-bold">M</span>;
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#111111] select-none font-sans overflow-hidden">
      {/* Top Header */}
      <div className="h-10 px-3.5 bg-[#111111] border-b border-[#4a4b50] flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          {/* Branch Pill */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[11px] font-mono text-[#a9a9aa] shrink-0">
            <GitBranch className="w-3 h-3 text-[#5683da]" />
            <span className="truncate max-w-[90px]">{diffData?.branch || 'git'}</span>
          </div>

          {/* File Selector Dropdown */}
          <div className="relative min-w-0 flex-1 max-w-[220px]">
            <button
              type="button"
              onClick={() => setFileDropdownOpen(!fileDropdownOpen)}
              className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-lg bg-[#090a0c] hover:bg-[#303236] border border-[#4a4b50] text-xs font-mono text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-1.5 truncate">
                <FileCode className="w-3.5 h-3.5 text-[#5683da] shrink-0" />
                <span className="truncate">{selectedFile || 'Select Changed File'}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-[#a9a9aa] shrink-0" />
            </button>

            {fileDropdownOpen && diffData?.files && diffData.files.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-72 max-w-[calc(100vw-2rem)] sm:max-w-xs max-h-60 bg-[#111111] border border-[#4a4b50] rounded-xl shadow-2xl overflow-y-auto p-1 z-30 font-mono text-xs">
                <div className="px-2 py-1 text-[10px] text-[#a9a9aa] uppercase tracking-wider border-b border-[#4a4b50] mb-1">
                  Changed Files ({diffData.files.length})
                </div>
                {diffData.files.map((file) => (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => handleSelectFile(file.path)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer disabled:cursor-not-allowed ${
                      file.path === selectedFile
                        ? 'bg-[#303236] text-white'
                        : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236]/60'
                    }`}
                  >
                    <span className="truncate mr-2">{file.path}</span>
                    {getStatusBadge(file)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats Badge */}
          {diffData && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-[#303236] border border-[#4a4b50] shrink-0">
              <span className="text-[#5683da]">+{diffData.stats.additions}</span>
              <span className="text-[#6b6c6d]">/</span>
              <span className="text-[#ff8964]">-{diffData.stats.deletions}</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => fetchDiff()}
            disabled={loading}
            title="Refresh Git Diff (Cmd/Ctrl+R)"
            className="p-1.5 rounded-full bg-[#303236] hover:bg-[#4a4b50] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#5683da]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleCopyDiff}
            disabled={!diffData || !diffData.diff_lines || diffData.diff_lines.length === 0}
            title="Copy Raw Diff"
            className="p-1.5 rounded-full bg-[#303236] hover:bg-[#4a4b50] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#27c93f]" /> : <Copy className="w-3.5 h-3.5 text-[#a9a9aa]" />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close Diff Panel"
              className="p-1.5 rounded-full bg-[#303236] hover:bg-[#4a4b50] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Diff Content Area */}
      <div className="flex-1 overflow-auto p-3 font-mono text-[12px] leading-relaxed bg-[#111111] custom-scrollbar">
        {loading && !diffData ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#a9a9aa] space-y-3">
            <RefreshCw className="w-8 h-8 text-[#5683da] animate-spin" />
            <p className="text-xs font-sans text-white font-medium">Analyzing repository changes…</p>
          </div>
        ) : diffData?.error ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#a9a9aa] space-y-2">
            <AlertCircle className="w-8 h-8 text-[#ff8964]" />
            <p className="text-xs font-sans text-white font-medium">{diffData.error}</p>
            <p className="text-[11px] text-[#a9a9aa]">Run git init in your project to enable version diffs.</p>
          </div>
        ) : diffData?.files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#a9a9aa] space-y-2">
            <Check className="w-8 h-8 text-[#27c93f]" />
            <p className="text-xs font-sans text-white font-medium">Working tree clean</p>
            <p className="text-[11px] text-[#a9a9aa]">No modified or untracked files detected in repository.</p>
          </div>
        ) : renderedRows.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#a9a9aa] space-y-2">
            <GitCommit className="w-8 h-8 text-[#5683da]" />
            <p className="text-xs font-sans text-white font-medium">Select a file above to inspect changes</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#4a4b50] overflow-hidden shadow-2xl bg-[#090a0c]">
            <table className="w-full border-collapse text-left font-mono">
              <thead>
                <tr className="border-b border-[#4a4b50] bg-[#111111] text-[10px] text-[#a9a9aa] uppercase tracking-wider font-semibold">
                  <th className="w-12 py-1.5 px-2.5 text-right select-none border-r border-[#4a4b50]">Old</th>
                  <th className="w-12 py-1.5 px-2.5 text-right select-none border-r border-[#4a4b50]">New</th>
                  <th className="w-7 py-1.5 text-center select-none border-r border-[#4a4b50]/60">+/-</th>
                  <th className="py-1.5 px-3">Diff Content</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4a4b50]/30">
                {renderedRows.map(({ line, idx, rowBg, leftBorder, textStyle, marker, markerColor }) => (
                  <tr key={idx} className={`${rowBg} ${leftBorder} transition-colors group`}>
                    <td className="w-12 py-0.5 px-2.5 text-right select-none text-[11px] text-[#8e8f92] bg-[#090a0c]/60 border-r border-[#4a4b50]">
                      {line.line_old ?? ''}
                    </td>
                    <td className="w-12 py-0.5 px-2.5 text-right select-none text-[11px] text-[#8e8f92] bg-[#090a0c]/60 border-r border-[#4a4b50]">
                      {line.line_new ?? ''}
                    </td>
                    <td className={`w-7 py-0.5 text-center select-none text-[12px] border-r border-[#4a4b50]/40 ${markerColor}`}>
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
        )}
      </div>
    </div>
  );
};
