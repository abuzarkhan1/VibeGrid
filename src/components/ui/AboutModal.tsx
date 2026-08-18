import React, { useEffect, useState } from 'react';
import { X, Cpu, ShieldCheck, Github, ExternalLink, Download, BookOpen, FileText, HelpCircle } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { isTauri } from '@/lib/tauri';
// Reviewer catch: window.open does not reliably launch an external browser
// from the Tauri webview. Route external links through the shell plugin
// (same pattern as TerminalPane's WebLinksAddon handler) with a web fallback.
import { open as shellOpen } from '@tauri-apps/plugin-shell';
// UX audit P3 #16: read the real version from package.json instead of a
// hardcoded string that drifts out of sync with releases. Vite supports
// dynamic JSON imports; load it once in an effect (no `require` in ESM).
const DEFAULT_VERSION = '0.1.0';

interface AboutModalProps {
  onClose: () => void;
}

const REPO_URL = 'https://github.com/abuzarkhan1/VibeGrid';
const DOCS_URL = 'https://vibegrid.vercel.app/';
const CHANGELOG_URL = 'https://github.com/abuzarkhan1/VibeGrid/blob/main/CHANGELOG.md';

/** Open an external URL in the system browser (Tauri shell plugin, web fallback). */
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
  const [updateState, setUpdateState] = useState<UpdateState>('idle');
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string>(DEFAULT_VERSION);

  // In-app update check (audit: auto-updater was MISSING). Requires the
  // `plugins.updater` endpoint + pubkey configured in tauri.conf.json and a
  // signed release; degrades gracefully when not configured.
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

  // UX audit P3 #32: one-click download+install. Falls back to opening the
  // releases page if the updater plugin isn't configured for this build.
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
      // If we reach this point the plugin installed (or the call was a no-op);
      // prompt the user to relaunch.
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

  // UX audit P3 #16: real version from package.json (dynamic import — Vite
  // supports JSON modules; no `require` in an ESM webview). Guarded against
  // setState-after-unmount (the modal can close while the import resolves).
  useEffect(() => {
    let cancelled = false;
    import('../../../package.json')
      .then((pkg) => {
        if (!cancelled && typeof pkg.default?.version === 'string') setAppVersion(pkg.default.version);
      })
      .catch(() => {
        // keep the fallback version
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="About Codex Grid"
      className="fixed inset-0 z-50 bg-black/70  flex items-center justify-center p-4 animate-fade-in font-sans"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#1A1B26] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
              <img src="/logo.png" alt="Codex Logo" className="w-full h-full object-contain rounded" />
            </div>
            <span className="font-bold text-xs tracking-wider text-white/90 uppercase">About Codex Grid</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close about dialog"
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.10] flex items-center justify-center shadow-lg overflow-hidden p-2">
            <img src="/logo.png" alt="Codex Logo" className="w-10 h-10 object-contain rounded" />
          </div>

          <div>
            <h3 className="font-bold text-[26px] leading-none text-white/90 tracking-tight">Codex Grid</h3>
            <p className="text-xs text-white/70 font-mono mt-1">Version {appVersion}</p>
            <p className="text-xs text-white/70 mt-2 max-w-xs mx-auto leading-relaxed">
              The high-performance multi-pane terminal & AI agent matrix built for modern developer workflows.
            </p>
            <p className="text-[10px] text-white/40 mt-1.5 font-mono">Open Source · Tauri 2 + Rust + React</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-white/10">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-[10px] text-white/40 font-mono font-semibold uppercase tracking-wider">Engine</div>
              <div className="text-xs text-white/90 font-medium mt-0.5 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
                <span>Tauri 2 + Rust</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-[10px] text-white/40 font-mono font-semibold uppercase tracking-wider">License</div>
              <div className="text-xs text-white/90 font-medium mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] rounded-md text-xs font-mono text-white/70 hover:text-white transition-colors"
            >
              <Github className="w-3.5 h-3.5 text-white/70" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-white/40" />
            </a>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openExternal(DOCS_URL);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] rounded-md text-xs font-mono text-white/70 hover:text-white transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-white/70" />
              <span>Website</span>
              <ExternalLink className="w-3 h-3 text-white/40" />
            </a>
            <a
              href={CHANGELOG_URL}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openExternal(CHANGELOG_URL);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] rounded-md text-xs font-mono text-white/70 hover:text-white transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-white/70" />
              <span>Changelog</span>
              <ExternalLink className="w-3 h-3 text-white/40" />
            </a>
          </div>
          <p className="flex items-center justify-center gap-1 text-[10px] text-white/40 font-mono">
            <HelpCircle className="w-3 h-3" />
            Need help? Open an issue on GitHub or read the website docs.
          </p>

          {/* Download & Install / Check button */}
          <div className="flex w-full flex-col gap-2 rounded-2xl border border-white/[0.08] p-2.5 bg-white/[0.03]">
            {updateState === 'available' || updateState === 'downloading' ? (
              <div className="flex items-center justify-between gap-2 px-2 py-1">
                <span
                  aria-live="polite"
                  className="flex items-center gap-1.5 text-xs font-mono text-white/90"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  {updateState === 'downloading'
                    ? 'Downloading update…'
                    : `Update available: v${updateVersion}`}
                </span>
                <button
                  onClick={handleDownloadUpdate}
                  disabled={updateState === 'downloading'}
                  className="shrink-0 rounded-full bg-violet-500 hover:bg-violet-500/90 px-4 py-1.5 text-xs font-medium text-white shadow-none transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {updateState === 'downloading' ? 'Downloading…' : 'Download & Install'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleCheckUpdates}
                disabled={updateState === 'checking'}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.07] rounded-md text-white/90 text-xs font-medium transition-colors w-full disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-violet-400" />
                {updateState === 'checking' && <span>Checking for updates…</span>}
                {updateState === 'current' && <span>You're on the latest version</span>}
                {updateState === 'unconfigured' && <span>Check GitHub releases for updates</span>}
                {updateState === 'idle' && <span>Check for Updates</span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};