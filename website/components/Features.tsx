'use client';

import React from 'react';
import { Cpu, Zap, Grid, Layout, Keyboard, ShieldCheck, Sparkles } from 'lucide-react';

export const Features: React.FC = () => {
  const featureList = [
    {
      icon: <Cpu className="h-6 w-6 text-emerald-400" />,
      title: '60 FPS GPU WebGL Rendering',
      description: 'Powered by xterm.js + WebGL addon. Hardware accelerated rendering delivers silky smooth 60 FPS performance even under heavy log stdout output.',
    },
    {
      icon: <Zap className="h-6 w-6 text-emerald-400" />,
      title: '16ms IPC Output Batching',
      description: 'Rust backend batches PTY output every 16ms with High (10MB) / Low (1MB) watermark backpressure flags to prevent memory spikes.',
    },
    {
      icon: <Grid className="h-6 w-6 text-emerald-400" />,
      title: 'Dynamic Equal Grids (1..16)',
      description: 'One-click preset buttons for 1, 2, 4, 6, 8, and 16 pane layouts (2x2, 2x3, 2x4, 4x4) plus custom binary tree split options.',
    },
    {
      icon: <Layout className="h-6 w-6 text-emerald-400" />,
      title: 'Atomic Workspaces System',
      description: 'Organize terminal layouts into workspaces. Persisted atomically in Rust JSON format with background shell PTY session retention.',
    },
    {
      icon: <Keyboard className="h-6 w-6 text-emerald-400" />,
      title: 'Keyboard-First Design',
      description: 'Customize shortcuts for splitting (Cmd+D / Cmd+Shift+D), spatial 2D focus navigation, closing (Cmd+W), and Command Palette (Cmd+Shift+P).',
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-emerald-400" />,
      title: '100% Free & Open Source (MIT)',
      description: 'No subscription, no telemetry, no tracking. Native desktop application for macOS and Windows built on Tauri 2 + Rust + React.',
    },
  ];

  return (
    <section id="features" className="relative py-24 bg-black">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Built for Power Developers & AI Engineers</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl mb-4">
            Engineered for Maximum Speed
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto font-light">
            VibeGrid replaces clunky single-window terminals with a GPU-accelerated multi-pane workspace grid.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureList.map((feature, idx) => (
            <div
              key={idx}
              className="glass-card rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed font-light">{feature.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs font-semibold text-emerald-400">
                <span>Learn more →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
