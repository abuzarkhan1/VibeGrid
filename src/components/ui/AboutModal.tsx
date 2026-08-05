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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-surfaceCard border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col backdrop-blur-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[6px] bg-forest flex items-center justify-center shadow-[0_0_8px_rgba(44,122,64,0.35)]">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.9"/>
                <rect x="9" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.5"/>
                <rect x="1" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.5"/>
                <rect x="9" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.2"/>
              </svg>
            </div>
            <span className="font-medium text-xs tracking-wider text-white/90 uppercase">About VibeGrid</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close about dialog"
            className="p-1 rounded hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-forest flex items-center justify-center shadow-[0_0_16px_rgba(84,169,103,0.3)]">
            <svg width="32" height="32" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.9"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.2"/>
            </svg>
          </div>

          <div>
            <h3 className="lp-serif hover-glow-flare text-[34px] leading-none text-white lp-text-glow-green">VibeGrid</h3>
            <p className="text-xs text-forest-bright font-mono mt-1">Version {appVersion}</p>
            <p className="text-xs text-white/50 mt-2 max-w-xs mx-auto leading-relaxed">
              The free, open-source GPU-accelerated multi-pane terminal workspace built for vibe coding.
            </p>
            <p className="text-[10px] text-white/30 mt-1.5 font-mono">MIT License · Tauri 2 + Rust + React</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-white/[0.06]">
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/10">
              <div className="text-[10px] text-white/35 font-semibold uppercase">Engine</div>
              <div className="text-xs text-white/85 font-medium mt-0.5 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-forest-bright" />
                <span>Tauri 2 + Rust</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-white/10">
              <div className="text-[10px] text-white/35 font-semibold uppercase">License</div>
              <div className="text-xs text-white/85 font-medium mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-forest-light" />
                <span>MIT Open Source</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openExternal(REPO_URL);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-forest/10 border border-white/10 text-xs text-white/70 transition-colors hover:border-forest/40"
            >
              <Github className="w-3.5 h-3.5 text-white/50" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-white/35" />
            </a>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openExternal(DOCS_URL);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-forest/10 border border-white/10 text-xs text-white/70 transition-colors hover:border-forest/40"
            >
              <BookOpen className="w-3.5 h-3.5 text-white/50" />
              <span>Website</span>
              <ExternalLink className="w-3 h-3 text-white/35" />
            </a>
            <a
              href={CHANGELOG_URL}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openExternal(CHANGELOG_URL);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-forest/10 border border-white/10 text-xs text-white/70 transition-colors hover:border-forest/40"
            >
              <FileText className="w-3.5 h-3.5 text-white/50" />
              <span>Changelog</span>
              <ExternalLink className="w-3 h-3 text-white/35" />
            </a>
          </div>
          <p className="flex items-center justify-center gap-1 text-[10px] text-white/30">
            <HelpCircle className="w-3 h-3" />
            Need help? Open an issue on GitHub or read the website docs.
          </p>

          {/* Audit: the Download & Install button was previously NESTED inside
              the Check button (invalid HTML — browsers reparent it and break
              focus/click semantics). They are now siblings inside a container.
              aria-live lives on the status TEXT, not the container — a live
              region wrapping interactive controls would make screen readers
              re-announce the buttons on every state change. */}
          <div className="flex w-full flex-col gap-2 rounded-lg border p-1.5 transition-colors ${
              updateState === 'available' || updateState === 'downloading'
                ? 'border-forest/40 bg-forest/10'
                : 'border-transparent'
            }"
          >
            {updateState === 'available' || updateState === 'downloading' ? (
              <div className="flex items-center justify-between gap-2 px-1.5 py-0.5">
                <span
                  aria-live="polite"
                  className="flex items-center gap-1.5 text-xs text-forest-light"
                >
                  <Download className="w-3.5 h-3.5 text-forest-bright" />
                  {updateState === 'downloading'
                    ? 'Downloading update…'
                    : `Update available: v${updateVersion}`}
                </span>
                <button
                  onClick={handleDownloadUpdate}
                  disabled={updateState === 'downloading'}
                  className="shrink-0 rounded-md bg-forest px-2.5 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-forest-bright disabled:opacity-50"
                >
                  {updateState === 'downloading' ? 'Downloading…' : 'Download & Install'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleCheckUpdates}
                disabled={updateState === 'checking'}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors w-full ${
                  updateState === 'current'
                    ? 'bg-white/[0.03] border-white/10 text-white/60'
                    : 'bg-white/[0.03] hover:bg-forest/10 border-white/10 text-white/70 hover:border-forest/40'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-forest-bright" />
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