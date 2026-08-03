'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const FeaturesBlogSection: React.FC = () => {
  const posts = [
    {
      tag: 'Architecture',
      tagBg: '#60a5fa22',
      tagColor: '#60a5fa',
      title: '60 FPS WebGL GPU Acceleration Architecture',
      description: 'How VibeGrid uses xterm.js WebGL addon and 16ms Rust IPC output batching to eliminate input latency and rendering lag.',
      date: 'Aug 3, 2026 · 6 min read',
    },
    {
      tag: 'Workspaces',
      tagBg: '#fbbf2422',
      tagColor: '#fbbf24',
      title: 'Atomic Rust Persistence for Terminal Session Retention',
      description: 'Learn how atomic JSON file I/O prevents workspace corruption and keeps background PTY processes running seamlessly.',
      date: 'Aug 2, 2026 · 5 min read',
    },
    {
      tag: 'Performance',
      tagBg: '#34d39922',
      tagColor: '#34d399',
      title: 'Dynamic Equal Grid Presets (1 to 16 Panes)',
      description: 'Why nesting flex layout containers causes distortion, and how VibeGrid enforces pixel-perfect 2D screen divisions.',
      date: 'Aug 1, 2026 · 8 min read',
    },
  ];

  return (
    <section id="blog" className="relative scroll-mt-24 bg-black px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-forest-bright/90">
              VibeGrid Blog
            </p>
            <h2 className="lp-serif text-2xl text-white md:text-[28px]">Deep Dives & Engineering</h2>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {posts.map((post, idx) => (
            <a
              key={idx}
              href="#"
              className="group flex min-h-[280px] flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-colors hover:border-forest/40 hover:bg-white/[0.04]"
            >
              <div>
                <span
                  className="w-fit rounded-full px-3 py-1 text-xs font-normal"
                  style={{ backgroundColor: post.tagBg, color: post.tagColor }}
                >
                  {post.tag}
                </span>
                <h3 className="mt-6 lp-serif text-[26px] leading-[1.15] text-white transition-colors group-hover:text-forest-bright">
                  {post.title}
                </h3>
                <p className="mt-4 line-clamp-2 text-[15px] leading-relaxed text-white/50">
                  {post.description}
                </p>
              </div>
              <div className="mt-8 flex items-center justify-between text-xs text-white/35">
                <span>{post.date}</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest-bright" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
