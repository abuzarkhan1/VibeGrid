'use client';

import React, { useState } from 'react';
import { Layers, Grid, Sliders, ArrowRight, X, Check, Shield } from 'lucide-react';
import { DEMO_LAYOUT_PRESETS, DemoLayoutPreset } from './demoLayouts';
import { DemoTheme } from './demoThemes';

interface DemoLayoutStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: DemoTheme;
  activeLayoutId: DemoLayoutPreset['id'];
  onApplyLayout: (layoutId: DemoLayoutPreset['id'], cornerRadius?: number, gutterSize?: number) => void;
}

export function DemoLayoutStudioModal({
  isOpen,
  onClose,
  currentTheme,
  activeLayoutId,
  onApplyLayout,
}: DemoLayoutStudioModalProps) {
  const [selectedId, setSelectedId] = useState<DemoLayoutPreset['id']>(activeLayoutId || '2x2');
  const [cornerRadius, setCornerRadius] = useState<number>(12);
  const [gutterSize, setGutterSize] = useState<number>(1);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyLayout(selectedId, cornerRadius, gutterSize);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-layout-studio-title"
      className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in select-none font-sans"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92%] rounded-[12px] border border-[#4a4b50] bg-[#090a0c] shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#4a4b50] bg-[#111111] px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#090a0c] border border-[#4a4b50] text-[#5683da]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="demo-layout-studio-title" className="text-sm font-bold text-white tracking-tight">
                  Layout Selection Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-[#5683da]">
                  v2.0 Grid Engine
                </span>
              </div>
              <p className="text-[11px] text-[#a9a9aa]">
                Select a visual grid blueprint or customize terminal matrix geometry
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close layout studio"
            className="p-1.5 rounded-lg hover:bg-[#111111] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-mono custom-scrollbar">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#6b6c6d] font-bold">
              Available Grid Blueprints (1-Click Switch)
            </span>
          </div>

          {/* Grid Layout Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {DEMO_LAYOUT_PRESETS.map((preset) => {
              const isSelected = selectedId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => setSelectedId(preset.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#111111] border-[#5683da] ring-1 ring-[#5683da] shadow-[0_0_18px_rgba(86,131,218,0.25)]'
                      : 'bg-[#0e0e10] border-[#4a4b50] hover:border-[#6b6c6d] hover:bg-[#111111]/80'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-white text-xs">
                          {preset.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#090a0c] border border-[#4a4b50] text-[#a9a9aa]">
                          {preset.paneCount} Panes
                        </span>
                      </div>
                      {isSelected ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5683da] text-white">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#111111] text-[#6b6c6d]">
                          Key {preset.shortcut}
                        </span>
                      )}
                    </div>

                    {/* Wireframe Diagram */}
                    <div className="h-24 w-full bg-[#090a0c] rounded-lg border border-[#4a4b50]/60 p-1.5 mb-3 flex gap-1 overflow-hidden">
                      {preset.id === '2x2' && (
                        <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-full">
                          <div className="bg-[#111111] rounded border border-[#5683da]/40 flex items-center justify-center text-[9px] text-[#5683da] font-mono">#01 Claude</div>
                          <div className="bg-[#111111] rounded border border-[#4a4b50] flex items-center justify-center text-[9px] text-[#a9a9aa] font-mono">#02 Aider</div>
                          <div className="bg-[#111111] rounded border border-[#4a4b50] flex items-center justify-center text-[9px] text-[#a9a9aa] font-mono">#03 Ollama</div>
                          <div className="bg-[#111111] rounded border border-[#4a4b50] flex items-center justify-center text-[9px] text-[#a9a9aa] font-mono">#04 Dev</div>
                        </div>
                      )}

                      {preset.id === 'hero-1-3' && (
                        <div className="flex gap-1 w-full h-full">
                          <div className="w-2/3 h-full bg-[#111111] rounded border border-[#5683da]/60 flex items-center justify-center text-[10px] text-[#5683da] font-mono font-bold">
                            #01 Hero Workspace
                          </div>
                          <div className="w-1/3 h-full flex flex-col gap-1">
                            <div className="h-1/3 bg-[#111111] rounded border border-[#4a4b50] flex items-center justify-center text-[8px] text-[#a9a9aa]">#02 Monitor</div>
                            <div className="h-1/3 bg-[#111111] rounded border border-[#4a4b50] flex items-center justify-center text-[8px] text-[#a9a9aa]">#03 Tests</div>
                            <div className="h-1/3 bg-[#111111] rounded border border-[#4a4b50] flex items-center justify-center text-[8px] text-[#a9a9aa]">#04 Server</div>
                          </div>
                        </div>
                      )}

                      {preset.id === '1x2' && (
                        <div className="grid grid-cols-2 gap-1 w-full h-full">
                          <div className="bg-[#111111] rounded border border-[#5683da]/50 flex items-center justify-center text-[10px] text-[#5683da] font-mono">#01 Primary Editor</div>
                          <div className="bg-[#111111] rounded border border-[#4a4b50] flex items-center justify-center text-[10px] text-[#a9a9aa] font-mono">#02 Diff / Pairing</div>
                        </div>
                      )}

                      {preset.id === '3x3' && (
                        <div className="grid grid-cols-3 grid-rows-2 gap-1 w-full h-full">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-[#111111] rounded border border-[#4a4b50] flex items-center justify-center text-[8px] text-[#a9a9aa]">
                              #0{i + 1}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-[#a9a9aa] font-sans leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Geometry Tuning Sliders Strip */}
          <div className="p-4 rounded-xl bg-[#111111] border border-[#4a4b50] space-y-3">
            <div className="flex items-center gap-2 font-sans font-semibold text-white text-xs">
              <Sliders className="w-3.5 h-3.5 text-[#5683da]" />
              <span>Canvas Geometry & Corner Radii</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
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
                <div className="flex items-center justify-between text-[11px]">
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
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#4a4b50] bg-[#111111] px-5 py-3 shrink-0">
          <div className="flex items-center gap-3 text-[11px] text-[#a9a9aa]">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-[10px] text-white">
                1-4
              </kbd>{' '}
              Preset keys
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-[10px] text-white">
                Enter
              </kbd>{' '}
              Deploy
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full border border-[#4a4b50] bg-[#090a0c] text-xs text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-1.5 rounded-full bg-[#5683da] hover:bg-[#456ec2] text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
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
