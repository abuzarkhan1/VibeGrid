import React, { useState } from 'react';
import { useSettingsStore, THEMES, getAllThemes, ThemeMode } from '@/store/useSettingsStore';
import { useCustomizationStore } from '@/store/useCustomizationStore';
import { evaluateWCAG } from '@/lib/wcagContrast';
import { RetroShaderPresetName } from '@/types/customization';
import { CODEX_PRESETS, parseCodexThemeV1 } from '@/lib/codexTheme';
import {
  Type,
  Tv,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
  Copy,
  Check,
  Download,
  Upload,
  Sliders,
  FileCode,
  Palette,
  Eye,
} from 'lucide-react';

const UI_FONT_OPTIONS = [
  { label: 'Inter (Modern Sans)', value: 'Inter, system-ui, -apple-system, sans-serif' },
  { label: 'Roboto (Neutral Sans)', value: 'Roboto, system-ui, sans-serif' },
  { label: 'SF Pro Display (Apple Native)', value: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' },
  { label: 'Segoe UI (Windows Native)', value: '"Segoe UI", system-ui, sans-serif' },
  { label: 'Geist Sans (Developer Modern)', value: '"Geist Sans", system-ui, sans-serif' },
  { label: 'System UI (OS Default)', value: 'system-ui, -apple-system, sans-serif' },
];

const CODE_FONT_OPTIONS = [
  { label: 'JetBrains Mono', value: 'JetBrains Mono, monospace' },
  { label: 'Fira Code', value: 'Fira Code, monospace' },
  { label: 'Cascadia Code', value: 'Cascadia Code, monospace' },
  { label: 'SF Mono', value: 'SF Mono, monospace' },
  { label: 'Menlo', value: 'Menlo, monospace' },
  { label: 'Source Code Pro', value: 'Source Code Pro, monospace' },
  { label: 'System Monospace', value: 'monospace' },
];

const SHADER_PRESETS: { id: RetroShaderPresetName; label: string }[] = [
  { id: 'default', label: 'Default CRT' },
  { id: 'cyberpunk', label: 'Cyberpunk 1984' },
  { id: 'matrix', label: 'Matrix Phosphor' },
  { id: 'arcade', label: 'Arcade Cabinet' },
  { id: 'subtle', label: 'Subtle Scanlines' },
  { id: 'off', label: 'Disable Shader' },
];

const ACCENT_SWATCHES = [
  '#6366f1', // Indigo / Codex Default
  '#3c95f0', // Electric Azure
  '#06b6d4', // Cyber Cyan
  '#10b981', // Matrix Emerald
  '#cba6f7', // Catppuccin Lavender
  '#f59e0b', // Solar Amber
  '#f43f5e', // Rose Neon
  '#a855f7', // Synth Purple
];

export const ThemeStudioSection: React.FC = () => {
  const {
    themeName,
    themeMode,
    fontFamily,
    uiFont,
    fontSize,
    fontLigatures,
    lineHeight,
    terminalOpacity,
    cursorStyle,
    cursorBlink,
    retroShader,
    themeBackground,
    themeSurface,
    themeAccent,
    themeInk,
    contrast,
    diffAddColor,
    diffRemoveColor,
    setDraftTheme,
    setDraftThemeMode,
    setDraftFontFamily,
    setDraftUiFont,
    setDraftFontSize,
    setDraftFontLigatures,
    setDraftLineHeight,
    setDraftOpacity,
    setDraftCursorStyle,
    setDraftCursorBlink,
    setDraftThemeBackground,
    setDraftThemeSurface,
    setDraftThemeAccent,
    setDraftThemeInk,
    setDraftContrast,
    setDraftDiffAddColor,
    setDraftDiffRemoveColor,
    setRetroShader,
    applyShaderPreset,
    exportCodexThemeJson,
    importCodexThemeJson,
    applyCodexPreset,
  } = useCustomizationStore();

  const [copiedExport, setCopiedExport] = useState(false);
  const [showIoDrawer, setShowIoDrawer] = useState<'export' | 'import' | null>(null);
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const allThemes = getAllThemes(useSettingsStore.getState());
  const activeTerminalTheme = allThemes[themeName] || THEMES.tokyoNight;

  // Live WCAG 2.1 Contrast Calculation
  const effectiveInk = themeInk || activeTerminalTheme.foreground;
  const effectiveBg = themeBackground || activeTerminalTheme.background;
  const wcagResult = evaluateWCAG(effectiveInk, effectiveBg);

  const handleCopyExportJson = () => {
    const json = exportCodexThemeJson();
    navigator.clipboard.writeText(json);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleExecuteImport = () => {
    if (!importJsonText.trim()) {
      setImportStatus({ ok: false, msg: 'Please paste a valid codex-theme-v1 JSON string.' });
      return;
    }
    const validation = parseCodexThemeV1(importJsonText);
    if (!validation.success) {
      setImportStatus({ ok: false, msg: validation.error });
      return;
    }
    const ok = importCodexThemeJson(importJsonText);
    if (ok) {
      setImportStatus({ ok: true, msg: 'Theme imported & applied successfully!' });
      setTimeout(() => {
        setShowIoDrawer(null);
        setImportStatus(null);
        setImportJsonText('');
      }, 1200);
    } else {
      setImportStatus({ ok: false, msg: 'Failed to apply parsed theme settings.' });
    }
  };

  return (
    <div className="space-y-8 text-[#e8e8ea]">
      {/* ── Top Header & Action Cluster ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#333338]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366f1]/15 border border-[#6366f1]/30 text-[#6366f1]">
              <Palette className="w-4 h-4" />
            </div>
            <h3 className="font-sans font-bold text-sm text-[#e8e8ea] uppercase tracking-wider">
              3-Role Theme Studio
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#232327] border border-[#333338] text-[#a3a3ab]">
              codex-theme-v1
            </span>
          </div>
          <p className="text-xs text-[#a3a3ab] font-sans mt-1">
            Independent Background, Surface, Accent, and Ink roles + Contrast multiplier & Dual Font engines
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* WCAG Accessibility Scorecard Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              wcagResult.isAccessible
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
            title={`WCAG 2.1 Contrast Ratio: ${wcagResult.formattedRatio} (${wcagResult.rating})`}
          >
            {wcagResult.isAccessible ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className="font-bold">{wcagResult.formattedRatio}</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-[#1a1a1e] border border-[#333338] font-bold">
              {wcagResult.rating}
            </span>
          </div>

          {/* Import / Export Buttons */}
          <button
            type="button"
            onClick={() => setShowIoDrawer(showIoDrawer === 'export' ? null : 'export')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-bold border transition-colors ${
              showIoDrawer === 'export'
                ? 'bg-[#2a2a2f] border-[#6366f1] text-white'
                : 'bg-[#232327] hover:bg-[#2a2a2f] border-[#333338] text-[#e8e8ea]'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-[#6366f1]" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIoDrawer(showIoDrawer === 'import' ? null : 'import')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-bold border transition-colors ${
              showIoDrawer === 'import'
                ? 'bg-[#2a2a2f] border-[#6366f1] text-white'
                : 'bg-[#232327] hover:bg-[#2a2a2f] border-[#333338] text-[#e8e8ea]'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-[#6366f1]" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* ── codex-theme-v1 Import / Export Drawer ───────────────────────── */}
      {showIoDrawer === 'export' && (
        <div className="p-4 rounded-xl bg-[#232327] border border-[#333338] space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#6366f1]" />
              <span className="text-xs font-sans font-bold text-white">
                Export Portable `codex-theme-v1` JSON
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyExportJson}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#6366f1] hover:bg-[#5558e6] text-white text-xs font-sans font-bold transition-all shadow-sm"
            >
              {copiedExport ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedExport ? 'Copied JSON!' : 'Copy to Clipboard'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-[#1a1a1e] border border-[#333338] font-mono text-[11px] text-[#e8e8ea] max-h-48 overflow-y-auto leading-relaxed select-all">
            {exportCodexThemeJson()}
          </pre>
        </div>
      )}

      {showIoDrawer === 'import' && (
        <div className="p-4 rounded-xl bg-[#232327] border border-[#333338] space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#6366f1]" />
              <span className="text-xs font-sans font-bold text-white">
                Import `codex-theme-v1` JSON
              </span>
            </div>
            <button
              type="button"
              onClick={handleExecuteImport}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#6366f1] hover:bg-[#5558e6] text-white text-xs font-sans font-bold transition-all shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Validate & Apply</span>
            </button>
          </div>
          <textarea
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            placeholder='Paste {"version":"codex-theme-v1", "colors":{...}} here...'
            rows={4}
            className="w-full bg-[#1a1a1e] border border-[#333338] focus:border-[#6366f1] rounded-lg p-3 text-xs font-mono text-white placeholder-[#6f6f78] focus:outline-none"
          />
          {importStatus && (
            <div
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
                importStatus.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {importStatus.msg}
            </div>
          )}
        </div>
      )}

      {/* ── 1. 3-Role Independent Color Model ────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-sans font-bold text-[#e8e8ea] uppercase tracking-wider block">
            Three Semantic Color Roles
          </label>
          <div className="flex items-center gap-1.5 bg-[#232327] p-1 rounded-lg border border-[#333338]">
            <span className="text-[11px] font-sans text-[#a3a3ab] px-2">Mode:</span>
            {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDraftThemeMode(mode)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-sans font-bold capitalize transition-all ${
                  themeMode === mode
                    ? 'bg-[#6366f1] text-white shadow-sm'
                    : 'text-[#a3a3ab] hover:text-white'
                }`}
              >
                {mode === 'dark' && <Moon className="w-3 h-3" />}
                {mode === 'light' && <Sun className="w-3 h-3" />}
                {mode === 'system' && <Monitor className="w-3 h-3" />}
                <span>{mode}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Role 1: Background */}
          <div className="p-3 rounded-xl bg-[#232327] border border-[#333338] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold text-white">
                Role 1: Background
              </span>
              <span className="text-[10px] font-mono text-[#a3a3ab]">{themeBackground}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeBackground.startsWith('#') ? themeBackground : '#1a1a1e'}
                onChange={(e) => setDraftThemeBackground(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
              />
              <input
                type="text"
                value={themeBackground}
                onChange={(e) => setDraftThemeBackground(e.target.value)}
                placeholder="#1a1a1e"
                className="flex-1 bg-[#1a1a1e] border border-[#333338] focus:border-[#6366f1] rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-[#6f6f78] block">Shell & modal canvas</span>
          </div>

          {/* Role 1b: Surface */}
          <div className="p-3 rounded-xl bg-[#232327] border border-[#333338] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold text-white">
                Role 1b: Surface
              </span>
              <span className="text-[10px] font-mono text-[#a3a3ab]">{themeSurface}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeSurface.startsWith('#') ? themeSurface : '#232327'}
                onChange={(e) => setDraftThemeSurface(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
              />
              <input
                type="text"
                value={themeSurface}
                onChange={(e) => setDraftThemeSurface(e.target.value)}
                placeholder="#232327"
                className="flex-1 bg-[#1a1a1e] border border-[#333338] focus:border-[#6366f1] rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-[#6f6f78] block">Cards, panels & rows</span>
          </div>

          {/* Role 2: Ink / Text */}
          <div className="p-3 rounded-xl bg-[#232327] border border-[#333338] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold text-white">
                Role 2: Ink (Text)
              </span>
              <span className="text-[10px] font-mono text-[#a3a3ab]">{themeInk}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeInk.startsWith('#') ? themeInk : '#e8e8ea'}
                onChange={(e) => setDraftThemeInk(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
              />
              <input
                type="text"
                value={themeInk}
                onChange={(e) => setDraftThemeInk(e.target.value)}
                placeholder="#e8e8ea"
                className="flex-1 bg-[#1a1a1e] border border-[#333338] focus:border-[#6366f1] rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-[#6f6f78] block">Primary typography content</span>
          </div>

          {/* Role 3: Accent */}
          <div className="p-3 rounded-xl bg-[#232327] border border-[#333338] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold text-white">
                Role 3: Accent
              </span>
              <span className="text-[10px] font-mono text-[#a3a3ab]">{themeAccent}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeAccent.startsWith('#') ? themeAccent : '#6366f1'}
                onChange={(e) => setDraftThemeAccent(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
              />
              <input
                type="text"
                value={themeAccent}
                onChange={(e) => setDraftThemeAccent(e.target.value)}
                placeholder="#6366f1"
                className="flex-1 bg-[#1a1a1e] border border-[#333338] focus:border-[#6366f1] rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1 pt-1">
              {ACCENT_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setDraftThemeAccent(swatch)}
                  style={{ backgroundColor: swatch }}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${
                    themeAccent.toLowerCase() === swatch.toLowerCase() ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={swatch}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Contrast Slider & Semantic Diff Colors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Contrast Slider */}
          <div className="p-3 rounded-xl bg-[#232327] border border-[#333338] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#6366f1]" />
                <span className="text-xs font-sans font-bold text-white">
                  Contrast Multiplier
                </span>
              </div>
              <span className="text-xs font-mono text-[#6366f1] font-bold">
                {contrast.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.05"
              value={contrast}
              onChange={(e) => setDraftContrast(parseFloat(e.target.value))}
              className="w-full accent-[#6366f1] h-1.5 bg-[#1a1a1e] rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-[#6f6f78]">
              <span>Soft (0.8x)</span>
              <span>Default (1.0x)</span>
              <span>High (1.5x)</span>
            </div>
          </div>

          {/* Semantic Diff Add */}
          <div className="p-3 rounded-xl bg-[#232327] border border-[#333338] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold text-emerald-400">
                Diff Add (+ Line)
              </span>
              <span className="text-[10px] font-mono text-[#a3a3ab]">{diffAddColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={diffAddColor.startsWith('#') ? diffAddColor : '#3fb950'}
                onChange={(e) => setDraftDiffAddColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
              />
              <input
                type="text"
                value={diffAddColor}
                onChange={(e) => setDraftDiffAddColor(e.target.value)}
                className="flex-1 bg-[#1a1a1e] border border-[#333338] rounded-lg px-2.5 py-1 text-xs font-mono text-emerald-400 focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-[#6f6f78] block">Audit additions & patches</span>
          </div>

          {/* Semantic Diff Remove */}
          <div className="p-3 rounded-xl bg-[#232327] border border-[#333338] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold text-rose-400">
                Diff Remove (- Line)
              </span>
              <span className="text-[10px] font-mono text-[#a3a3ab]">{diffRemoveColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={diffRemoveColor.startsWith('#') ? diffRemoveColor : '#f85149'}
                onChange={(e) => setDraftDiffRemoveColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
              />
              <input
                type="text"
                value={diffRemoveColor}
                onChange={(e) => setDraftDiffRemoveColor(e.target.value)}
                className="flex-1 bg-[#1a1a1e] border border-[#333338] rounded-lg px-2.5 py-1 text-xs font-mono text-rose-400 focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-[#6f6f78] block">Audit removals & deletions</span>
          </div>
        </div>
      </div>

      {/* ── 2. Built-in Theme Presets Library ────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-sans font-bold text-[#e8e8ea] uppercase tracking-wider block">
            Built-in Presets & Palettes
          </label>
          <span className="text-[11px] font-mono text-[#a3a3ab]">1-Click apply</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Object.entries(CODEX_PRESETS).map(([key, preset]) => {
            const isSelected = themeBackground === preset.colors.background && themeAccent === preset.colors.accent;
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyCodexPreset(key)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-[#2a2a2f] border-[#6366f1] shadow-[0_0_16px_rgba(99,102,241,0.25)] scale-[1.02]'
                    : 'bg-[#232327] border-[#333338] hover:border-[#6f6f78]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-sans font-bold text-white truncate">
                    {preset.name}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#6366f1] shrink-0" />}
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: preset.colors.background }}
                    title="Background"
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: preset.colors.surface }}
                    title="Surface"
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: preset.colors.accent }}
                    title="Accent"
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: preset.colors.ink }}
                    title="Ink"
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Legacy Terminal Palettes */}
        <div className="pt-2">
          <span className="text-[11px] font-sans font-bold text-[#a3a3ab] block mb-2">
            Terminal ANSI Palettes:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(allThemes).map(([id, t]) => {
              const isSelected = themeName === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDraftTheme(id)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-[#2a2a2f] border-[#6366f1]'
                      : 'bg-[#1a1a1e] border-[#333338] hover:border-[#6f6f78]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-sans font-bold text-white truncate">
                      {t.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[t.background, t.cursor, t.red, t.green, t.blue].map((c, idx) => (
                      <span
                        key={idx}
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3. Live Diff & Terminal Preview Box ───────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-[#6366f1]" />
            <label className="text-xs font-sans font-bold text-[#e8e8ea] uppercase tracking-wider block">
              Live Semantic Diff & Buffer Preview
            </label>
          </div>
          <span className="text-[10px] font-mono text-[#a3a3ab]">
            UI: {uiFont.split(',')[0]} · Code: {fontFamily.split(',')[0]}
          </span>
        </div>

        <div
          className="p-4 rounded-xl border relative overflow-hidden transition-all shadow-xl"
          style={{
            backgroundColor: themeBackground || '#1a1a1e',
            borderColor: '#333338',
            opacity: terminalOpacity,
            fontFamily: uiFont,
          }}
        >
          {/* Chrome titlebar */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-sans font-bold text-white ml-2">
                Codex Diff Viewer · session/supervisor.ts
              </span>
            </div>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: `${themeAccent}20`,
                color: themeAccent,
                border: `1px solid ${themeAccent}40`,
              }}
            >
              Accent: {themeAccent}
            </span>
          </div>

          {/* Simulated Diff and Terminal code buffer */}
          <div
            className="p-3 rounded-xl text-xs space-y-1.5 transition-colors"
            style={{
              backgroundColor: themeSurface || '#232327',
              color: themeInk || '#e8e8ea',
              fontFamily,
              fontSize: `${fontSize}px`,
              lineHeight,
              filter: `contrast(${contrast})`,
            }}
          >
            {/* Terminal prompt */}
            <div className="flex items-center gap-2 opacity-90">
              <span style={{ color: themeAccent }}>❯</span>
              <span style={{ color: activeTerminalTheme.cyan }}>git</span>
              <span style={{ color: activeTerminalTheme.yellow }}>diff</span>
              <span className="opacity-80">--staged</span>
            </div>

            {/* Semantic diff lines */}
            <div
              className="px-2 py-0.5 rounded font-mono text-[11px]"
              style={{
                backgroundColor: `${diffRemoveColor}18`,
                color: diffRemoveColor,
                borderLeft: `2px solid ${diffRemoveColor}`,
              }}
            >
              - const supervisor = null;
            </div>

            <div
              className="px-2 py-0.5 rounded font-mono text-[11px]"
              style={{
                backgroundColor: `${diffAddColor}18`,
                color: diffAddColor,
                borderLeft: `2px solid ${diffAddColor}`,
              }}
            >
              {'+ const supervisor = new AgentSupervisor({ parallelThreads: 4 });'}
            </div>

            <div className="text-[11px] pt-1" style={{ color: diffAddColor }}>
              ✓ 1 change staged · 4 agent workers attached to session
            </div>

            {/* Active prompt with cursor */}
            <div className="flex items-center gap-1 pt-1">
              <span style={{ color: themeAccent }}>❯</span>
              <span
                className={`inline-block ${cursorBlink ? 'animate-pulse' : ''}`}
                style={{
                  backgroundColor: cursorStyle === 'block' ? themeAccent : 'transparent',
                  borderLeft: cursorStyle === 'bar' ? `2px solid ${themeAccent}` : 'none',
                  borderBottom: cursorStyle === 'underline' ? `2px solid ${themeAccent}` : 'none',
                  color: '#1a1a1e',
                  width: cursorStyle === 'block' ? '8px' : cursorStyle === 'bar' ? '2px' : '8px',
                  height: '14px',
                }}
              >
                &nbsp;
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Dual Font Pickers & Typography Engine ─────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-[#6366f1]" />
          <label className="text-xs font-sans font-bold text-[#e8e8ea] uppercase tracking-wider">
            Dual Typography & Cursor Engines
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* UI Font Picker */}
          <div>
            <label className="text-[11px] font-sans font-bold text-[#a3a3ab] block mb-1.5">
              UI Chrome Font (Menus, Headers, Chat)
            </label>
            <select
              value={uiFont}
              onChange={(e) => setDraftUiFont(e.target.value)}
              className="w-full bg-[#232327] border border-[#333338] focus:border-[#6366f1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              {UI_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Code Font Picker */}
          <div>
            <label className="text-[11px] font-sans font-bold text-[#a3a3ab] block mb-1.5">
              Code & Diff Font (Monospace)
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setDraftFontFamily(e.target.value)}
              className="w-full bg-[#232327] border border-[#333338] focus:border-[#6366f1] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
            >
              {CODE_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-sans font-bold text-[#a3a3ab]">
                Code Font Size
              </label>
              <span className="text-xs font-mono text-[#6366f1]">{fontSize}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="32"
              step="1"
              value={fontSize}
              onChange={(e) => setDraftFontSize(parseInt(e.target.value, 10))}
              className="w-full accent-[#6366f1] h-1.5 bg-[#1a1a1e] rounded-lg cursor-pointer"
            />
          </div>

          {/* Line Height */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-sans font-bold text-[#a3a3ab]">
                Line Height
              </label>
              <span className="text-xs font-mono text-[#6366f1]">{lineHeight.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.2"
              step="0.05"
              value={lineHeight}
              onChange={(e) => setDraftLineHeight(parseFloat(e.target.value))}
              className="w-full accent-[#6366f1] h-1.5 bg-[#1a1a1e] rounded-lg cursor-pointer"
            />
          </div>

          {/* Cursor Shape */}
          <div>
            <label className="text-[11px] font-sans font-bold text-[#a3a3ab] block mb-1.5">
              Cursor Shape
            </label>
            <div className="flex items-center gap-1 bg-[#232327] p-1 rounded-xl border border-[#333338]">
              {[
                { id: 'bar', label: 'Beam (|)' },
                { id: 'block', label: 'Block (█)' },
                { id: 'underline', label: 'Line (_)' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setDraftCursorStyle(style.id as 'bar' | 'block' | 'underline')}
                  className={`flex-1 py-1 text-[11px] font-mono rounded-lg transition-all ${
                    cursorStyle === style.id
                      ? 'bg-[#6366f1] text-white shadow-sm font-bold'
                      : 'text-[#a3a3ab] hover:text-white'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Window Opacity */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-sans font-bold text-[#a3a3ab]">
                Window Opacity
              </label>
              <span className="text-xs font-mono text-[#6366f1]">
                {Math.round(terminalOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={terminalOpacity}
              onChange={(e) => setDraftOpacity(parseFloat(e.target.value))}
              className="w-full accent-[#6366f1] h-1.5 bg-[#1a1a1e] rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Ligatures & Cursor Blink Toggles */}
        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fontLigatures}
              onChange={(e) => setDraftFontLigatures(e.target.checked)}
              className="w-4 h-4 accent-[#6366f1] rounded"
            />
            <span className="text-xs font-sans text-[#e8e8ea]">
              Code Ligatures (==&gt;, !=)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={cursorBlink}
              onChange={(e) => setDraftCursorBlink(e.target.checked)}
              className="w-4 h-4 accent-[#6366f1] rounded"
            />
            <span className="text-xs font-sans text-[#e8e8ea]">
              Blinking Cursor Animation
            </span>
          </label>
        </div>
      </div>

      {/* ── 5. WebGL Retro CRT Shader Studio ──────────────────────────────── */}
      <div className="space-y-4 pt-4 border-t border-[#333338]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-cyan-400" />
            <label className="text-xs font-sans font-bold text-[#e8e8ea] uppercase tracking-wider">
              WebGL Retro CRT Shader Overlay
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-[#232327] px-3 py-1.5 rounded-xl border border-[#333338]">
            <input
              type="checkbox"
              checked={retroShader.enabled}
              onChange={(e) => setRetroShader({ enabled: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
            <span className="text-xs font-sans font-bold text-cyan-300">
              {retroShader.enabled ? 'CRT Overlay Enabled' : 'CRT Overlay Disabled'}
            </span>
          </label>
        </div>

        {/* Shader Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-[#a3a3ab]">Shader Presets:</span>
          {SHADER_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyShaderPreset(p.id)}
              className="px-3 py-1 rounded-lg bg-[#232327] hover:bg-[#2a2a2f] text-[#e8e8ea] hover:text-cyan-300 text-xs font-sans font-bold border border-[#333338] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Shader Parameters Grid */}
        {retroShader.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl bg-[#232327] border border-[#333338]">
            {/* Curvature */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-sans font-bold text-[#a3a3ab]">
                  Barrel Curvature
                </label>
                <span className="text-xs font-mono text-cyan-400">
                  {retroShader.curvature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.25"
                step="0.01"
                value={retroShader.curvature}
                onChange={(e) => setRetroShader({ curvature: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-[#1a1a1e] rounded-lg cursor-pointer"
              />
            </div>

            {/* Scanline Intensity */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-sans font-bold text-[#a3a3ab]">
                  Scanline Intensity
                </label>
                <span className="text-xs font-mono text-cyan-400">
                  {Math.round(retroShader.scanlineIntensity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={retroShader.scanlineIntensity}
                onChange={(e) => setRetroShader({ scanlineIntensity: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-[#1a1a1e] rounded-lg cursor-pointer"
              />
            </div>

            {/* Scanline Count */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-sans font-bold text-[#a3a3ab]">
                  Scanline Count
                </label>
                <span className="text-xs font-mono text-cyan-400">{retroShader.scanlineCount}</span>
              </div>
              <input
                type="range"
                min="300"
                max="800"
                step="20"
                value={retroShader.scanlineCount}
                onChange={(e) => setRetroShader({ scanlineCount: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-400 h-1.5 bg-[#1a1a1e] rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
