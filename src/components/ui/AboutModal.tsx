import React, { useEffect, useState } from 'react';
import { X, Cpu, ShieldCheck, Github, ExternalLink, Download, BookOpen, FileText, Copy, Check } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useUIStore } from '@/store/useUIStore';
import { isTauri } from '@/lib/tauri';
import { open as shellOpen } from '@tauri-apps/plugin-shell';

const DEFAULT_VERSION = '0.1.0';

interface AboutModalProps {
  onClose: () => void;
}

const REPO_URL = 'https://github.com/abuzarkhan1/VibeGrid';
const DOCS_URL = 'https://vibegrid.vercel.app/';
const CHANGELOG_URL = 'https://github.com/abuzarkhan1/VibeGrid/blob/main/CHANGELOG.md';

const openExternal = (url: string) => {
  if (isTauri()) {
    shellOpen(url).catch(() => window.open(url, '_blank'));
  } else {
    window.open(url, '_blank');
  }
};

type UpdateState = 'idle' | 'checking' | 'available' | 'current' | 'unconfigured' | 'downloading';

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  const addToast = useUIStore((s) => s.addToast);
  const [updateState, setUpdateState] = useState<UpdateState>('idle');
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string>(DEFAULT_VERSION);
  const [copied, setCopied] = useState(false);

  const handleCopyDiagnostics = async () => {
    const diagnosticInfo = [
      `VibeGrid: v${appVersion}`,
      `Platform: ${navigator.userAgent}`,
      `Engine: Tauri 2 + Rust`,
      `Time: ${new Date().toISOString()}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(diagnosticInfo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast({
        type: 'success',
        title: 'Diagnostic info copied',
        description: `Version ${appVersion} diagnostic details copied to clipboard.`,
      });
    } catch (e) {
      console.warn('[VibeGrid] Could not copy diagnostics:', e);
      addToast({
        type: 'error',
        title: 'Copy failed',
        description: 'Could not access clipboard to copy diagnostic info.',
      });
    }
  };

  const handleCheckUpdates = async () => {
    if (!isTauri()) {
      setUpdateState('unconfigured');
      return;
    }
    setUpdateState('checking');
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (update) {
        setUpdateVersion(update.version);
        setUpdateState('available');
      } else {
        setUpdateState('current');
      }
    } catch (e) {
      console.warn('[VibeGrid] Update check failed:', e);
      setUpdateState('unconfigured');
    }
  };

  const handleDownloadUpdate = async () => {
    if (!isTauri() || updateState !== 'available') {
      openExternal(`${REPO_URL}/releases`);
      return;
    }
    setUpdateState('downloading');
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (!update) {
        setUpdateState('current');
        return;
      }
      await update.downloadAndInstall?.();
      setUpdateState('current');
    } catch (e) {
      console.warn('[VibeGrid] Download-and-install failed, opening releases:', e);
      setUpdateState('available');
      openExternal(`${REPO_URL}/releases`);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    import('../../../package.json')
      .then((pkg) => {
        if (!cancelled && typeof pkg.default?.version === 'string') setAppVersion(pkg.default.version);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="About VibeGrid"
      className="fixed inset-0 z-50 bg-[#090a0c]/80 flex items-center justify-center p-4 animate-fade-in font-sans select-none text-white"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#111111] border border-[#4a4b50] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#4a4b50] bg-[#111111]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#090a0c] border border-[#4a4b50] flex items-center justify-center overflow-hidden p-0.5 shadow-sm shrink-0">
              <img src="/logo.png" alt="VibeGrid Logo" className="w-full h-full object-contain rounded" />
            </div>
            <span className="font-bold text-xs tracking-wider text-white uppercase font-mono">About VibeGrid</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close about dialog"
            className="p-1 rounded-full hover:bg-[#303236] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#090a0c] border border-[#4a4b50] flex items-center justify-center shadow-lg overflow-hidden p-2">
            <img src="/logo.png" alt="VibeGrid Logo" className="w-10 h-10 object-contain rounded" />
          </div>

          <div>
            <h3 className="font-bold text-2xl leading-none text-white tracking-tight">VibeGrid</h3>
            <div className="mt-1.5 flex items-center justify-center">
              <button
                type="button"
                onClick={handleCopyDiagnostics}
                title="Click to copy diagnostic info"
                aria-label={`Copy diagnostic info for Version ${appVersion}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#303236] hover:bg-[#303236]/80 border border-[#4a4b50] hover:border-[#5683da] text-xs text-[#a9a9aa] hover:text-white font-mono transition-all active:scale-95 cursor-pointer"
              >
                <span>Version {appVersion}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-[#27c93f]" />
                ) : (
                  <Copy className="w-3 h-3 text-[#a9a9aa]" />
                )}
              </button>
            </div>
            <p className="text-xs text-[#a9a9aa] mt-2 max-w-xs mx-auto leading-relaxed">
              Multi-pane terminal grid and AI agent matrix.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-[#4a4b50]">
            <div className="p-3.5 rounded-xl bg-[#303236] border border-[#4a4b50]">
              <div className="text-[10px] text-[#a9a9aa] font-mono font-semibold uppercase tracking-wider">Engine</div>
              <div className="text-xs text-white font-medium mt-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#5683da]" />
                <span>Tauri 2 + Rust</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#303236] border border-[#4a4b50]">
              <div className="text-[10px] text-[#a9a9aa] font-mono font-semibold uppercase tracking-wider">License</div>
              <div className="text-xs text-white font-medium mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#27c93f]" />
                <span>MIT Open Source</span>
              </div>
            </div>
          </div>

          <div className="pt-1 flex justify-center gap-2">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openExternal(REPO_URL);
              }}
              className="h-8 flex items-center gap-1.5 px-3 rounded-full bg-[#303236] hover:bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] text-xs font-mono text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <Github className="w-3.5 h-3.5 text-[#a9a9aa]" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-[#6b6c6d]" />
            </a>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openExternal(DOCS_URL);
              }}
              className="h-8 flex items-center gap-1.5 px-3 rounded-full bg-[#303236] hover:bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] text-xs font-mono text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#a9a9aa]" />
              <span>Website</span>
              <ExternalLink className="w-3 h-3 text-[#6b6c6d]" />
            </a>
            <a
              href={CHANGELOG_URL}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openExternal(CHANGELOG_URL);
              }}
              className="h-8 flex items-center gap-1.5 px-3 rounded-full bg-[#303236] hover:bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] text-xs font-mono text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#a9a9aa]" />
              <span>Changelog</span>
              <ExternalLink className="w-3 h-3 text-[#6b6c6d]" />
            </a>
          </div>

          {/* Update Section */}
          <div className="p-3.5 rounded-2xl bg-[#303236] border border-[#4a4b50]">
            {updateState === 'available' || updateState === 'downloading' ? (
              <div className="flex items-center justify-between gap-2 px-1">
                <span aria-live="polite" className="flex items-center gap-1.5 text-xs font-mono text-white">
                  <Download className="w-3.5 h-3.5 text-[#5683da]" />
                  {updateState === 'downloading' ? 'Downloading update…' : `Update available: v${updateVersion}`}
                </span>
                <button
                  onClick={handleDownloadUpdate}
                  disabled={updateState === 'downloading'}
                  className="h-8 px-4 rounded-full bg-[#5683da] text-white hover:bg-[#5683da]/90 text-xs font-medium shadow-none transition-all active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {updateState === 'downloading' ? 'Downloading…' : 'Download & Install'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleCheckUpdates}
                disabled={updateState === 'checking'}
                className="h-8 flex items-center justify-center gap-2 px-4 rounded-full bg-[#090a0c] hover:bg-[#111111] border border-[#4a4b50] hover:border-[#5683da] text-[#a9a9aa] hover:text-white text-xs font-medium transition-all active:scale-95 w-full disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#a9a9aa]" />
                {updateState === 'checking' && <span>Checking for updates…</span>}
                {updateState === 'current' && <span>You're on the latest version</span>}
                {updateState === 'unconfigured' && <span>Check GitHub releases for updates</span>}
                {updateState === 'idle' && <span>Check for Updates</span>}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#4a4b50] bg-[#111111]">
          <span className="text-[11px] text-[#a9a9aa] font-mono">
            MIT License · Tauri 2 + Rust
          </span>
          <button
            onClick={onClose}
            className="h-8 flex items-center px-4 rounded-full bg-[#303236] hover:bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] text-[#a9a9aa] hover:text-white text-xs font-medium transition-all active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
