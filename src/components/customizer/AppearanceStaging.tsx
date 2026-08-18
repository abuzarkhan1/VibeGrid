import React from 'react';
import { useCustomizationStore } from '@/store/useCustomizationStore';
import { THEMES } from '@/store/useSettingsStore';
import { Palette, Type } from 'lucide-react';

const FONT_OPTIONS = [
  'JetBrains Mono',
  'Fira Code',
  'Cascadia Code',
  'Source Code Pro',
  'monospace',
];

export const AppearanceStaging: React.FC = () => {
  const themeName = useCustomizationStore((s) => s.themeName);
  const fontFamily = useCustomizationStore((s) => s.fontFamily);
  const fontSize = useCustomizationStore((s) => s.fontSize);
  const terminalOpacity = useCustomizationStore((s) => s.terminalOpacity);
  const setDraftTheme = useCustomizationStore((s) => s.setDraftTheme);
  const setDraftFontFamily = useCustomizationStore((s) => s.setDraftFontFamily);
  const setDraftFontSize = useCustomizationStore((s) => s.setDraftFontSize);
  const setDraftOpacity = useCustomizationStore((s) => s.setDraftOpacity);

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/10 backdrop-blur-md font-sans select-none">
      <div className="flex items-center gap-2 text-xs font-semibold text-white/80 uppercase tracking-wider font-mono">
        <Palette className="w-4 h-4 text-white/60" />
        <span>Theme & Terminal Styling</span>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(THEMES).slice(0, 8).map(([key, theme]) => {
          const isSelected = themeName === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setDraftTheme(key)}
              className={`flex flex-col p-2.5 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-white/[0.06] border-white/80 ring-1 ring-white/10'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/30 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="text-xs font-medium text-white/90 truncate">{theme.name}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              {/* Color Swatch Dots */}
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full border border-white/15" style={{ backgroundColor: theme.background }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.green }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.blue }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.magenta }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.yellow }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Font & Opacity Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
        {/* Font Family */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60 flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-white/40" />
            <span>Font Family</span>
          </label>
          <select
            value={fontFamily}
            onChange={(e) => setDraftFontFamily(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white/80 text-xs focus:outline-none focus:border-white/40"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f} className="bg-black text-white">
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/60">Font Size</label>
            <span className="text-xs font-mono text-white/80">{fontSize}px</span>
          </div>
          <input
            type="range"
            min="10"
            max="20"
            step="1"
            value={fontSize}
            onChange={(e) => setDraftFontSize(Number(e.target.value))}
            className="w-full accent-white cursor-pointer"
          />
        </div>

        {/* Terminal Opacity */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/60">Opacity</label>
            <span className="text-xs font-mono text-white/80">
              {Math.round(terminalOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.0"
            step="0.05"
            value={terminalOpacity}
            onChange={(e) => setDraftOpacity(Number(e.target.value))}
            className="w-full accent-white cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};