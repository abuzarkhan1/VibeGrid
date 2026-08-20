'use client';

import React from 'react';
import { Palette, Check, ArrowRight, X, Sparkles } from 'lucide-react';
import { DEMO_THEMES, DemoTheme } from './demoThemes';

interface DemoThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: DemoTheme;
  onSelectTheme: (theme: DemoTheme) => void;
}

export function DemoThemeSelectorModal({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}: DemoThemeSelectorModalProps) {
  if (!isOpen) return null;

  const themesList = Object.values(DEMO_THEMES);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-theme-studio-title"
      className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in select-none font-sans"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[92%] rounded-[12px] border border-[#4a4b50] bg-[#090a0c] shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#4a4b50] bg-[#111111] px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#090a0c] border border-[#4a4b50] text-[#5683da]">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="demo-theme-studio-title" className="text-sm font-bold text-white tracking-tight">
                  Theme Studio & Color Customizer
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-[#5683da]">
                  5 High-Contrast Palettes
                </span>
              </div>
              <p className="text-[11px] text-[#a9a9aa]">
                Live dynamic recoloring across all terminal surfaces, headers, and badge tokens
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close theme studio"
            className="p-1.5 rounded-lg hover:bg-[#111111] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themesList.map((theme) => {
              const isSelected = currentTheme.id === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    onSelectTheme(theme);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#111111] border-[#5683da] ring-1 ring-[#5683da] shadow-[0_0_18px_rgba(86,131,218,0.25)]'
                      : 'bg-[#0e0e10] border-[#4a4b50] hover:border-[#6b6c6d] hover:bg-[#111111]/80'
                  }`}
                >
                  <div>
                    {/* Title + Indicator */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-sans font-bold text-white text-xs">
                          {theme.name}
                        </div>
                        <div className="text-[10px] text-[#6b6c6d] font-mono">
                          {theme.subtitle}
                        </div>
                      </div>

                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5683da] text-white">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* Color Swatch Bar */}
                    <div className="flex items-center gap-1.5 my-2.5">
                      {theme.previewColors.map((col, idx) => (
                        <div
                          key={idx}
                          style={{ backgroundColor: col }}
                          className="h-5 flex-1 rounded-md border border-white/10 shadow-sm"
                        />
                      ))}
                    </div>

                    {/* Mini Prompt Preview */}
                    <div
                      style={{
                        backgroundColor: theme.bgCanvas,
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      }}
                      className="p-2 rounded-lg border font-mono text-[10px] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ color: theme.accentPrimary }} className="font-semibold">
                          ▲ {theme.id}
                        </span>
                        <span
                          style={{ borderColor: theme.border, color: theme.accentSecondary }}
                          className="px-1.5 py-0.2 rounded border text-[8px]"
                        >
                          ACTIVE
                        </span>
                      </div>
                      <div style={{ color: theme.textSecondary }}>
                        $ cargo build --release <span style={{ color: theme.accentSuccess }}>[OK]</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#4a4b50] bg-[#111111] px-5 py-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-[#a9a9aa] font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#5683da]" />
            <span>Active Theme: <strong className="text-white">{currentTheme.name}</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-full bg-[#5683da] hover:bg-[#456ec2] text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
