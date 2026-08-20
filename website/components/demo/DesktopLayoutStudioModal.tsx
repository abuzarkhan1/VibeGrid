'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Grid,
  Sliders,
  ArrowRight,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { DEMO_LAYOUT_PRESETS, DemoLayoutPreset } from './demoLayouts';
import { DemoTheme } from './demoThemes';

interface DesktopLayoutStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: DemoTheme;
  activeLayoutId?: string;
  onApplyLayout?: (
    layoutId: string,
    cornerRadius?: number,
    gutterSize?: number,
    customRows?: number,
    customCols?: number
  ) => void;
}

export function DesktopLayoutStudioModal({
  isOpen,
  onClose,
  activeLayoutId = '2x2',
  onApplyLayout,
}: DesktopLayoutStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(activeLayoutId || '2x2');
  const [cornerRadius, setCornerRadius] = useState<number>(12);
  const [gutterSize, setGutterSize] = useState<number>(2);
  const [terminalPadding, setTerminalPadding] = useState<number>(8);
  const [customRows, setCustomRows] = useState<number>(2);
  const [customCols, setCustomCols] = useState<number>(2);
  const [ratioMode, setRatioMode] = useState<'equal' | 'golden' | 'hero-sidebar'>('equal');

  // Keyboard shortcut listener (1-9 numeric, Escape, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handleDeploy();
        return;
      }

      // Check numeric 1-9 shortcuts
      const found = DEMO_LAYOUT_PRESETS.find((p) => p.shortcut === e.key);
      if (found) {
        e.preventDefault();
        setSelectedPresetId(found.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedPresetId, cornerRadius, gutterSize, customRows, customCols]);

  if (!isOpen) return null;

  const handleDeploy = () => {
    if (onApplyLayout) {
      if (activeTab === 'custom') {
        const customId = `${customRows}x${customCols}`;
        onApplyLayout(customId, cornerRadius, gutterSize, customRows, customCols);
      } else {
        onApplyLayout(selectedPresetId, cornerRadius, gutterSize);
      }
    }
    onClose();
  };

  const renderMiniWireframe = (preset: DemoLayoutPreset) => {
    switch (preset.id) {
      case 'solo':
        return (
          <div className="w-full h-full bg-[#111111] rounded border border-[#5683da]/40 p-2 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[8px] font-mono text-[#5683da]">
              <span>#01 Primary Terminal</span>
              <span>zsh</span>
            </div>
            <div className="text-[8px] font-mono text-[#a9a9aa] space-y-0.5">
              <div>$ cargo check</div>
              <div className="text-[#27c93f]">✔ 0 errors</div>
            </div>
          </div>
        );
      case '1x2':
        return (
          <div className="grid grid-cols-2 gap-1 w-full h-full">
            <div className="bg-[#111111] rounded border border-[#5683da]/50 p-1.5 flex flex-col justify-between text-[8px] font-mono">
              <span className="text-[#5683da]">#01 Editor</span>
              <span className="text-[#a9a9aa]">$ claude</span>
            </div>
            <div className="bg-[#111111] rounded border border-[#4a4b50] p-1.5 flex flex-col justify-between text-[8px] font-mono">
              <span className="text-[#a9a9aa]">#02 Tests</span>
              <span className="text-[#27c93f]">142 passed</span>
            </div>
          </div>
        );
      case '2-vertical':
        return (
          <div className="grid grid-rows-2 gap-1 w-full h-full">
            <div className="bg-[#111111] rounded border border-[#5683da]/40 p-1.5 flex items-center justify-between text-[8px] font-mono">
              <span className="text-[#5683da]">#01 Work Tree</span>
              <span className="text-[#6b6c6d]">nvim</span>
            </div>
            <div className="bg-[#111111] rounded border border-[#4a4b50] p-1.5 flex items-center justify-between text-[8px] font-mono">
              <span className="text-[#a9a9aa]">#02 Log Stream</span>
              <span className="text-[#ffbd2e]">tail -f</span>
            </div>
          </div>
        );
      case '3-t-top':
        return (
          <div className="flex flex-col gap-1 w-full h-full">
            <div className="h-1/2 bg-[#111111] rounded border border-[#5683da]/60 p-1.5 flex items-center justify-between text-[8px] font-mono">
              <span className="text-[#5683da] font-bold">#01 Lead Master</span>
              <span className="text-[#27c93f]">Active</span>
            </div>
            <div className="h-1/2 grid grid-cols-2 gap-1">
              <div className="bg-[#111111] rounded border border-[#4a4b50] p-1 flex items-center justify-center text-[7px] text-[#a9a9aa] font-mono">
                #02 Worker A
              </div>
              <div className="bg-[#111111] rounded border border-[#4a4b50] p-1 flex items-center justify-center text-[7px] text-[#a9a9aa] font-mono">
                #03 Worker B
              </div>
            </div>
          </div>
        );
      case 'hero-1-3':
        return (
          <div className="flex gap-1 w-full h-full">
            <div className="w-2/3 h-full bg-[#111111] rounded border border-[#5683da]/60 p-2 flex flex-col justify-between text-[8px] font-mono">
              <span className="text-[#5683da] font-bold">#01 Hero Workspace</span>
              <span className="text-[#a9a9aa]">$ npm run dev:orchestrator</span>
            </div>
            <div className="w-1/3 h-full flex flex-col gap-1">
              <div className="h-1/3 bg-[#111111] rounded border border-[#4a4b50] flex items-center justify-center text-[7px] text-[#a9a9aa] font-mono">#02 Mon</div>
              <div className="h-1/3 bg-[#111111] rounded border border-[#4a4b50] flex items-center justify-center text-[7px] text-[#a9a9aa] font-mono">#03 Test</div>
              <div className="h-1/3 bg-[#111111] rounded border border-[#4a4b50] flex items-center justify-center text-[7px] text-[#a9a9aa] font-mono">#04 Svr</div>
            </div>
          </div>
        );
      case '3x3':
        return (
          <div className="grid grid-cols-3 grid-rows-2 gap-1 w-full h-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#111111] rounded border border-[#4a4b50] flex items-center justify-center text-[7px] text-[#a9a9aa] font-mono"
              >
                #0{i + 1}
              </div>
            ))}
          </div>
        );
      case '9-hivemind':
        return (
          <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-full h-full">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#111111] rounded border border-[#4a4b50]/60 flex items-center justify-center text-[6px] text-[#a9a9aa] font-mono"
              >
                #{i + 1}
              </div>
            ))}
          </div>
        );
      case '16-godmode':
        return (
          <div className="grid grid-cols-4 grid-rows-4 gap-0.5 w-full h-full">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#111111] rounded border border-[#4a4b50]/40 flex items-center justify-center text-[5px] text-[#a9a9aa] font-mono"
              >
                {i + 1}
              </div>
            ))}
          </div>
        );
      case '2x2':
      default:
        return (
          <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-full">
            <div className="bg-[#111111] rounded border border-[#5683da]/40 p-1 flex items-center justify-center text-[8px] text-[#5683da] font-mono">
              #01 Claude
            </div>
            <div className="bg-[#111111] rounded border border-[#4a4b50] p-1 flex items-center justify-center text-[8px] text-[#a9a9aa] font-mono">
              #02 Aider
            </div>
            <div className="bg-[#111111] rounded border border-[#4a4b50] p-1 flex items-center justify-center text-[8px] text-[#a9a9aa] font-mono">
              #03 Ollama
            </div>
            <div className="bg-[#111111] rounded border border-[#4a4b50] p-1 flex items-center justify-center text-[8px] text-[#a9a9aa] font-mono">
              #04 Dev
            </div>
          </div>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-layout-studio-title"
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in select-none font-sans"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] rounded-2xl border border-[#4a4b50] bg-[#090a0c]/95 shadow-[0_20px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-left"
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-[#4a4b50] flex items-center justify-between bg-[#111111]/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[#5683da]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="desktop-layout-studio-title"
                  className="font-sans font-bold text-sm sm:text-base text-white tracking-tight"
                >
                  Layout Selection Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-[#5683da]">
                  v2.0 Grid Engine
                </span>
              </div>
              <p className="text-[11px] text-[#a9a9aa] font-sans">
                Choose a structured blueprint preset or craft an infinite custom matrix canvas
              </p>
            </div>
          </div>

          {/* Tab Switcher: Presets vs Custom */}
          <div className="hidden sm:flex items-center gap-1 bg-[#090a0c] p-1 rounded-xl border border-[#4a4b50]">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-[#5683da] text-white font-semibold shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#111111]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Preset Gallery</span>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-[#5683da] text-white font-semibold shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#111111]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom Matrix Studio</span>
            </button>
          </div>

          {/* Close affordance */}
          <button
            onClick={onClose}
            aria-label="Close layout studio"
            className="p-1.5 rounded-lg hover:bg-[#111111] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {/* Mobile Mode Switcher */}
          <div className="flex sm:hidden items-center gap-1 bg-[#090a0c] p-1 rounded-xl border border-[#4a4b50]">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'presets' ? 'bg-[#5683da] text-white' : 'text-[#a9a9aa]'
              }`}
            >
              Preset Gallery
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'custom' ? 'bg-[#5683da] text-white' : 'text-[#a9a9aa]'
              }`}
            >
              Custom Matrix
            </button>
          </div>

          {/* ═══════════ TAB 1: PRESETS GALLERY ═══════════ */}
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {DEMO_LAYOUT_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#111111] border-[#5683da] ring-1 ring-[#5683da] shadow-[0_0_20px_rgba(86,131,218,0.25)]'
                        : 'bg-[#0e0e10] border-[#4a4b50] hover:border-[#6b6c6d] hover:bg-[#111111]/80'
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-[#5683da] font-bold">
                            {preset.shortcut}
                          </span>
                          <h3 className="font-sans font-bold text-white text-xs leading-tight">
                            {preset.name}
                          </h3>
                        </div>

                        <span className="px-2 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-[#a9a9aa]">
                          {preset.paneCount} {preset.paneCount === 1 ? 'Pane' : 'Panes'}
                        </span>
                      </div>

                      {/* Mini Layout Canvas Box */}
                      <div className="w-full h-28 rounded-lg bg-[#090a0c] border border-[#4a4b50]/60 p-1.5 mb-3 overflow-hidden flex items-center justify-center">
                        {renderMiniWireframe(preset)}
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-[#a9a9aa] font-sans leading-relaxed mb-2.5">
                        {preset.description}
                      </p>
                    </div>

                    {/* Tags Strip */}
                    <div className="pt-2 border-t border-[#4a4b50]/60 flex items-center gap-1.5 flex-wrap">
                      {preset.tags.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50]/60 text-[9px] text-[#6b6c6d] font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ═══════════ TAB 2: CUSTOM MATRIX BUILDER ═══════════ */
            <div className="space-y-5">
              <div className="p-5 rounded-xl bg-[#111111] border border-[#4a4b50] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-sans font-semibold text-white text-xs sm:text-sm">
                    <Grid className="w-4 h-4 text-[#5683da]" />
                    <span>Custom Grid Matrix Canvas</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-xs font-mono text-[#5683da] font-bold">
                    {customRows} × {customCols} ({customRows * customCols} Terminal Panes)
                  </span>
                </div>

                {/* Matrix Selector Chips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-[#a9a9aa]">Number of Rows</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4].map((r) => (
                        <button
                          key={r}
                          onClick={() => setCustomRows(r)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                            customRows === r
                              ? 'bg-[#5683da] text-white border-[#5683da]'
                              : 'bg-[#090a0c] border-[#4a4b50] text-[#a9a9aa] hover:text-white'
                          }`}
                        >
                          {r} Row{r > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-[#a9a9aa]">Number of Columns</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4].map((c) => (
                        <button
                          key={c}
                          onClick={() => setCustomCols(c)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                            customCols === c
                              ? 'bg-[#5683da] text-white border-[#5683da]'
                              : 'bg-[#090a0c] border-[#4a4b50] text-[#a9a9aa] hover:text-white'
                          }`}
                        >
                          {c} Col{c > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Matrix Canvas Wireframe */}
                <div className="p-3 bg-[#090a0c] rounded-xl border border-[#4a4b50] h-48 flex items-center justify-center">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateRows: `repeat(${customRows}, minmax(0, 1fr))`,
                      gridTemplateColumns: `repeat(${customCols}, minmax(0, 1fr))`,
                      gap: `${gutterSize * 2}px`,
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    {Array.from({ length: customRows * customCols }).map((_, idx) => (
                      <div
                        key={idx}
                        style={{ borderRadius: `${cornerRadius / 2}px` }}
                        className="bg-[#111111] border border-[#5683da]/40 flex items-center justify-center text-[10px] font-mono text-[#5683da] font-bold shadow-inner"
                      >
                        #0{idx + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Geometry Tuning Sliders */}
              <div className="p-5 rounded-xl bg-[#111111] border border-[#4a4b50] space-y-4">
                <div className="flex items-center gap-2 font-sans font-semibold text-white text-xs sm:text-sm">
                  <Sliders className="w-4 h-4 text-[#5683da]" />
                  <span>Terminal Canvas Geometry & Spacing</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#a9a9aa]">Corner Radius</span>
                      <span className="text-white font-mono">{cornerRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      step="2"
                      value={cornerRadius}
                      onChange={(e) => setCornerRadius(Number(e.target.value))}
                      className="w-full accent-[#5683da] cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#a9a9aa]">Gutter Divider Size</span>
                      <span className="text-white font-mono">{gutterSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={gutterSize}
                      onChange={(e) => setGutterSize(Number(e.target.value))}
                      className="w-full accent-[#5683da] cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#a9a9aa]">Terminal Padding</span>
                      <span className="text-white font-mono">{terminalPadding}px</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="16"
                      step="2"
                      value={terminalPadding}
                      onChange={(e) => setTerminalPadding(Number(e.target.value))}
                      className="w-full accent-[#5683da] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Studio Action Bar */}
        <div className="px-5 py-3.5 border-t border-[#4a4b50] bg-[#111111]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-xs text-[#a9a9aa] font-mono">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-[10px] text-white">
                1-9
              </kbd>{' '}
              Preset Shortcuts
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-[10px] text-white">
                Enter
              </kbd>{' '}
              Apply & Deploy
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#090a0c] hover:bg-[#1c1d22] border border-[#4a4b50] text-xs text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeploy}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#5683da] hover:bg-[#456ec2] text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
            >
              <span>Deploy Layout Grid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
