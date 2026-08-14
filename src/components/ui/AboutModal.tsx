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
      aria-label="About VibeGrid"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-surface/95 border border-border/[0.08] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden p-0.5">
              <img src="/logo.png" alt="VibeGrid Logo" className="w-full h-full object-contain rounded" />
            </div>
            <span className="font-space font-bold text-xs tracking-wider text-foreground/90 uppercase">About VibeGrid</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close about dialog"
            className="p-1 rounded-lg hover:bg-border/10 text-foreground/50 hover:text-foreground/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shadow-xl shadow-black/40 overflow-hidden p-2">
            <img src="/logo.png" alt="VibeGrid Logo" className="w-10 h-10 object-contain rounded-xl" />
          </div>

          <div>
            <h3 className="font-space font-extrabold text-[32px] leading-none text-white tracking-tight">VibeGrid</h3>
            <p className="text-xs text-muted font-mono mt-1">Version {appVersion}</p>
            <p className="text-xs text-foreground/80 mt-2 max-w-xs mx-auto leading-relaxed font-sans">
              The free, open-source GPU-accelerated multi-pane terminal workspace built for vibe coding.
            </p>
            <p className="text-[10px] text-muted/60 mt-1.5 font-mono">MIT License · Tauri 2 + Rust + React</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-white/[0.08]">
            <div className="p-3 rounded-xl bg-background/30 border border-border/[0.08]">
              <div className="text-[10px] text-muted font-mono font-semibold uppercase tracking-wider">Engine</div>
              <div className="text-xs text-foreground/90 font-space font-bold mt-0.5 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-foreground/70" />
                <span>Tauri 2 + Rust</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-background/30 border border-border/[0.08]">
              <div className="text-[10px] text-muted font-mono font-semibold uppercase tracking-wider">License</div>
              <div className="text-xs text-foreground/90 font-space font-bold mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-foreground/70" />
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-border/5 hover:bg-border/10 border border-border/10 text-xs font-mono text-foreground/80 transition-colors"
            >
              <Github className="w-3.5 h-3.5 text-muted" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-muted/60" />
            </a>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openExternal(DOCS_URL);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-border/5 hover:bg-border/10 border border-border/10 text-xs font-mono text-foreground/80 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-muted" />
              <span>Website</span>
              <ExternalLink className="w-3 h-3 text-muted/60" />
            </a>
            <a
              href={CHANGELOG_URL}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openExternal(CHANGELOG_URL);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>Changelog</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
          </div>
          <p className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 font-mono">
            <HelpCircle className="w-3 h-3" />
            Need help? Open an issue on GitHub or read the website docs.
          </p>

          {/* Download & Install / Check button */}
          <div className="flex w-full flex-col gap-2 rounded-2xl border border-white/[0.08] p-2 bg-black/20">
            {updateState === 'available' || updateState === 'downloading' ? (
              <div className="flex items-center justify-between gap-2 px-2 py-1">
                <span
                  aria-live="polite"
                  className="flex items-center gap-1.5 text-xs font-mono text-zinc-300"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  {updateState === 'downloading'
                    ? 'Downloading update…'
                    : `Update available: v${updateVersion}`}
                </span>
                <button
                  onClick={handleDownloadUpdate}
                  disabled={updateState === 'downloading'}
                  className="shrink-0 rounded-2xl bg-white px-4 py-1.5 text-xs font-extrabold font-space text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
                >
                  {updateState === 'downloading' ? 'Downloading…' : 'Download & Install'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleCheckUpdates}
                disabled={updateState === 'checking'}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-black hover:bg-zinc-200 text-xs font-extrabold font-space transition-colors w-full disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-black" />
                {updateState === 'checking' && <span>Checking for updates…</span>}
                {updateState === 'current' && <span>You're on the latest version</span>}
                {updateState === 'unconfigured' && <span>Updates not configured — see GitHub releases</span>}
                {updateState === 'idle' && <span>Check for Updates</span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};