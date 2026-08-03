'use client';

import React from 'react';
import { Command, Columns, Rows, Maximize2, X, PanelLeft, ArrowLeftRight, Search } from 'lucide-react';

export const ShortcutsShowcase: React.FC = () => {
  const shortcuts = [
    {
      key: 'Cmd / Ctrl + D',
      action: 'Split Horizontally',
      description: 'Splits focused terminal side-by-side.',
      icon: <Columns className="h-4 w-4 text-emerald-400" />,
    },
    {
      key: 'Cmd / Ctrl + Shift + D',
      action: 'Split Vertically',
      description: 'Splits focused terminal stacked top/bottom.',
      icon: <Rows className="h-4 w-4 text-emerald-400" />,
    },
    {
      key: 'Cmd / Ctrl + W',
      action: 'Close Focused Pane',
      description: 'Gracefully kills process and closes pane.',
      icon: <X className="h-4 w-4 text-rose-400" />,
    },
    {
      key: 'Cmd / Ctrl + Shift + Enter',
      action: 'Maximize / Restore Pane',
      description: 'Toggles full-screen focus mode on active pane.',
      icon: <Maximize2 className="h-4 w-4 text-emerald-400" />,
    },
    {
      key: 'Cmd / Ctrl + Shift + P',
      action: 'Command Palette',
      description: 'Fuzzy search commands, themes, and font size.',
      icon: <Search className="h-4 w-4 text-indigo-400" />,
    },
    {
      key: 'Cmd / Ctrl + B',
      action: 'Toggle Workspaces Sidebar',
      description: 'Expands or collapses left workspaces panel.',
      icon: <PanelLeft className="h-4 w-4 text-indigo-400" />,
    },
    {
      key: 'Cmd / Ctrl + Shift + Left / Right',
      action: 'Switch Workspaces',
      description: 'Cycle through active workspaces instantly.',
      icon: <ArrowLeftRight className="h-4 w-4 text-amber-400" />,
    },
    {
      key: 'Cmd / Ctrl + Arrows',
      action: 'Spatial 2D Focus Navigation',
      description: 'Navigates focus geometrically to neighboring pane.',
      icon: <Command className="h-4 w-4 text-emerald-400" />,
    },
  ];

  return (
    <section id="shortcuts" className="relative py-20 bg-black">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl mb-4">
            Keyboard-First Productivity
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto font-light">
            Keep your hands on the keyboard. VibeGrid provides customizable shortcuts for every terminal action.
          </p>
        </div>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl p-5 border border-white/10 bg-white/[0.02] hover:border-emerald-500/40 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-white/[0.05] border border-white/10">{sc.icon}</div>
                <kbd className="px-2.5 py-1 rounded bg-[#141622] border border-[#2e3247] text-[11px] font-mono text-emerald-300">
                  {sc.key}
                </kbd>
              </div>

              <h4 className="text-sm font-bold text-white mb-1">{sc.action}</h4>
              <p className="text-xs text-white/50 font-light leading-relaxed">{sc.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
