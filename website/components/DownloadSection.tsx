'use client';

import React from 'react';
import { Apple, Zap, Terminal, ExternalLink, Download } from 'lucide-react';

export const DownloadSection: React.FC = () => {
  return (
    <section id="downloads" className="relative py-24 bg-black">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 bottom-1/4 -translate-x-1/2 h-[350px] w-[550px] rounded-full bg-emerald-500/10 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 mb-4">
            <Download className="h-3.5 w-3.5" />
            <span>Download VibeGrid v0.1.0</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl mb-4">
            Get VibeGrid for macOS & Windows
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto font-light">
            100% Free, Open Source (MIT License), and zero telemetry. Download your native build below.
          </p>
        </div>

        {/* Downloads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* macOS Build */}
          <div className="glass-card rounded-3xl p-8 border border-emerald-500/30 bg-white/[0.02] flex flex-col justify-between hover:border-emerald-500/60 transition-all shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mb-6 text-emerald-400">
                <Apple className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">macOS</h3>
              <p className="text-xs text-white/50 mb-6">macOS 10.15 Catalina or newer (Apple Silicon M1/M2/M3/M4 & Intel)</p>

              <div className="space-y-3">
                <a
                  href="https://github.com/VibeGrid/vibegrid/releases/download/v0.1.0/VibeGrid_0.1.0_aarch64.dmg"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-xs font-bold text-white transition-all shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  <span>Apple Silicon (M1/M2/M3/M4) .dmg</span>
                </a>
                <a
                  href="https://github.com/VibeGrid/vibegrid/releases/download/v0.1.0/VibeGrid_0.1.0_x64.dmg"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] px-4 py-3 text-xs font-bold text-white transition-all"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>Intel Mac .dmg</span>
                </a>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 text-[11px] font-mono text-white/40 flex items-center justify-between">
              <span>SHA256 Checksum</span>
              <a href="#" className="text-emerald-400 hover:underline flex items-center gap-1">
                <span>shasum.txt</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Windows Build */}
          <div className="glass-card rounded-3xl p-8 border border-white/10 bg-white/[0.02] flex flex-col justify-between hover:border-emerald-500/40 transition-all">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.08] border border-white/15 mb-6 text-emerald-400">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Windows</h3>
              <p className="text-xs text-white/50 mb-6">Windows 10 / 11 64-bit (PowerShell & Cmd PTY integration)</p>

              <div className="space-y-3">
                <a
                  href="https://github.com/VibeGrid/vibegrid/releases/download/v0.1.0/VibeGrid_0.1.0_x64-setup.exe"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-xs font-bold text-white transition-all shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  <span>Windows Setup (.exe)</span>
                </a>
                <a
                  href="https://github.com/VibeGrid/vibegrid/releases/download/v0.1.0/VibeGrid_0.1.0_x64.msi"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] px-4 py-3 text-xs font-bold text-white transition-all"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>MSI Installer (.msi)</span>
                </a>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 text-[11px] font-mono text-white/40 flex items-center justify-between">
              <span>SHA256 Checksum</span>
              <a href="#" className="text-emerald-400 hover:underline flex items-center gap-1">
                <span>shasum.txt</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Linux Build */}
          <div className="glass-card rounded-3xl p-8 border border-white/10 bg-white/[0.02] flex flex-col justify-between hover:border-emerald-500/40 transition-all">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.08] border border-white/15 mb-6 text-emerald-400">
                <Terminal className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Linux</h3>
              <p className="text-xs text-white/50 mb-6">Ubuntu, Debian, Fedora, Arch Linux (AppImage & .deb)</p>

              <div className="space-y-3">
                <a
                  href="https://github.com/VibeGrid/vibegrid/releases/download/v0.1.0/VibeGrid_0.1.0_amd64.AppImage"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] px-4 py-3 text-xs font-bold text-white transition-all"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>AppImage (.AppImage)</span>
                </a>
                <a
                  href="https://github.com/VibeGrid/vibegrid/releases/download/v0.1.0/vibegrid_0.1.0_amd64.deb"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] px-4 py-3 text-xs font-bold text-white transition-all"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>Debian Package (.deb)</span>
                </a>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 text-[11px] font-mono text-white/40 flex items-center justify-between">
              <span>SHA256 Checksum</span>
              <a href="#" className="text-emerald-400 hover:underline flex items-center gap-1">
                <span>shasum.txt</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
