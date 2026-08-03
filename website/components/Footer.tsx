'use client';

import React from 'react';
import { Terminal, Github, Disc as Discord } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-black border-t border-white/10 pt-16 pb-8 overflow-hidden select-none">
      {/* Background Watermark Typography */}
      <div className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 text-[14vw] font-extrabold tracking-tight text-white/[0.02] uppercase leading-none select-none">
        VibeGrid
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="max-w-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/30 border border-emerald-500/50 text-emerald-400">
                <Terminal className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-wider text-white uppercase">VibeGrid</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed font-light">
              Free, open-source, GPU-accelerated multi-pane terminal workspace for macOS & Windows. Built with Tauri 2 + Rust + React + WebGL.
            </p>
          </div>

          {/* Nav Links Column */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-medium text-white/60">
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">Product</div>
              <div><a href="#features" className="hover:text-emerald-400 transition-colors">Features</a></div>
              <div><a href="#demo" className="hover:text-emerald-400 transition-colors">Interactive Grid</a></div>
              <div><a href="#shortcuts" className="hover:text-emerald-400 transition-colors">Shortcuts</a></div>
              <div><a href="#downloads" className="hover:text-emerald-400 transition-colors">Downloads</a></div>
            </div>

            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">Resources</div>
              <div><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">GitHub Repo</a></div>
              <div><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">Documentation</a></div>
              <div><a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a></div>
              <div><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">MIT License</a></div>
            </div>

            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">Community</div>
              <div><a href="https://discord.gg" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">Discord Server</a></div>
              <div><a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">Twitter / X</a></div>
            </div>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40 font-light">
          <div>
            © 2026 VibeGrid Open Source Community. Released under the MIT License.
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              <Github className="h-4 w-4" />
            </a>
            <a href="https://discord.gg" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              <Discord className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
