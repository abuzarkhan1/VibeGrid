import React, { useEffect } from 'react';
import { X, Cpu, ShieldCheck, Github, ExternalLink } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface AboutModalProps {
  onClose: () => void;
}

const REPO_URL = 'https://github.com/abuzarkhan1/VibeGrid';

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  const panelRef = useFocusTrap<HTMLDivElement>(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

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
            <p className="text-xs text-forest-bright font-mono mt-1">Version 0.1.0 (Beta)</p>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-forest/10 border border-white/10 text-xs text-white/70 transition-colors hover:border-forest/40"
            >
              <Github className="w-3.5 h-3.5 text-white/50" />
              <span>GitHub Repository</span>
              <ExternalLink className="w-3 h-3 text-white/35" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};