import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Download,
  Upload,
  Mic,
  Copy,
  Play,
  Globe,
  Archive,
} from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore, THEMES, CursorStyle, Macro, MacroStep, ThemeMode } from '@/store/useSettingsStore';
import { TerminalTheme } from '@/types/terminal';
import { useWorkspaceStore, WorkspaceOverrides } from '@/store/useWorkspaceStore';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';
import { eventToAccelerator } from '@/lib/commandUtils';
import { MACRO_ACTIONS, runMacro } from '@/lib/macros';
import { getHttpPort } from '@/lib/tauri';
import { InputModal } from './InputModal';
import { ConfirmModal } from './ConfirmModal';
import { voiceModelStatus, listenModelProgress } from '@/lib/tauri';
import { invoke } from '@tauri-apps/api/core';

/** Styled toggle switch matching sidebar aesthetic */
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none cursor-pointer ${
      checked ? 'bg-white' : 'bg-white/10 hover:bg-white/20'
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
        checked ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/70'
      }`}
    />
  </button>
);

function toHexColor(value: string): string {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000';
}

function cleanOverrides(o: WorkspaceOverrides): WorkspaceOverrides {
  const clean: WorkspaceOverrides = {};
  (Object.entries(o) as Array<[keyof WorkspaceOverrides, string | number | undefined]>).forEach(([k, v]) => {
    const isNanNumber = typeof v === 'number' && Number.isNaN(v);
    if (v !== undefined && v !== null && v !== '' && !isNanNumber) clean[k] = v as never;
  });
  return clean;
}

const THEME_COLOR_SLOTS: Array<[keyof TerminalTheme, string]> = [
  ['background', 'Background'],
  ['foreground', 'Foreground'],
  ['cursor', 'Cursor'],
  ['cursorAccent', 'Cursor accent'],
  ['selectionBackground', 'Selection'],
  ['black', 'Black'],
  ['red', 'Red'],
  ['green', 'Green'],
  ['yellow', 'Yellow'],
  ['blue', 'Blue'],
  ['magenta', 'Magenta'],
  ['cyan', 'Cyan'],
  ['white', 'White'],
  ['brightBlack', 'Bright black'],
  ['brightRed', 'Bright red'],
  ['brightGreen', 'Bright green'],
  ['brightYellow', 'Bright yellow'],
  ['brightBlue', 'Bright blue'],
  ['brightMagenta', 'Bright magenta'],
  ['brightCyan', 'Bright cyan'],
  ['brightWhite', 'Bright white'],
];

const SETTINGS_TAB_LABELS: Record<string, string> = {
  font: 'Font & Appearance',
  theme: 'Themes & Palettes',
  terminal: 'Terminal Engine',
  workspaces: 'Workspaces & Overrides',
  limits: 'Limits & Confirmations',
  appearance: 'UI Chrome & Styling',
  keyboard: 'Keybindings & Macros',
  profiles: 'Profiles & Endpoints',
};

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, toggleSettings, activeSettingsTab } = useUIStore();
  const {
    fontSize,
    fontFamily,
    themeName,
    scrollback,
    cursorBlink,
    cursorStyle,
    ipcBatchIntervalMs,
    fontLigatures,
    lineHeight,
    terminalOpacity,
    copyOnSelect,
    minimizeToTray,
    defaultShell,
    voiceToTerminal,
    voiceSilenceTimeoutMs,
    voiceInputDevice,
    setFontSize,
    setFontFamily,
    setThemeName,
    setScrollback,
    setCursorBlink,
    setCursorStyle,
    setIpcBatchIntervalMs,
    setFontLigatures,
    setLineHeight,
    setTerminalOpacity,
    setCopyOnSelect,
    setMinimizeToTray,
    setDefaultShell,
    setVoiceToTerminal,
    setVoiceSilenceTimeoutMs,
    setVoiceInputDevice,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    maxPanes,
    minPaneSize,
    dividerSnap,
    doubleClickEqualize,
    fontSizeMin,
    fontSizeMax,
    scrollbackMax,
    terminalOpacityMin,
    showSplash,
    confirmations,
    animationsEnabled,
    uiZoom,
    sidebarWidth,
    statusBarBadges,
    lineHeightMin,
    lineHeightMax,
    scrollbackMin,
    voiceSilenceTimeoutMin,
    voiceSilenceTimeoutMax,
    rightClickPaste,
    clickableLinks,
    linkModifier,
    terminalBell,
    scrollOnOutput,
    wordSeparators,
    pasteConfirmNewlines,
    terminalPadding,
    defaultCwd,
    shellArgs,
    shellEnv,
    maxWebglSlots,
    launchAtLogin,
    startMaximized,
    startHidden,
    closeToTray,
    voiceLanguage,
    voiceModelSize,
    customThemes,
    saveThemeAs,
    duplicateTheme,
    renameTheme,
    deleteTheme,
    updateThemeColors,
    importTheme,
    exportTheme,
    themeMode,
    macros,
    saveSettingsProfile,
    loadSettingsProfile,
    deleteSettingsProfile,
    listSettingsProfiles,
  } = useSettingsStore();

  const { workspaces, activeWorkspaceId, renameWorkspace, deleteWorkspace, duplicateWorkspace, setWorkspaceOverrides, toggleArchive } = useWorkspaceStore();
  const { keybindings, updateKeybinding, resetKeybindings } = useKeybindingsStore();
  const { addToast, requestSwitchWorkspace, requestCreateWorkspace } = useUIStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renameWsId, setRenameWsId] = useState<string | null>(null);
  const [deleteWsId, setDeleteWsId] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [confirmResetKeybindings, setConfirmResetKeybindings] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [micTesting, setMicTesting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [profileName, setProfileName] = useState('');
  const [httpPort, setHttpPort] = useState<number | null>(null);
  const [modelReady, setModelReady] = useState<boolean | null>(null);
  const [micDevices, setMicDevices] = useState<string[]>([]);
  const [micLoading, setMicLoading] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [showCreateThemeModal, setShowCreateThemeModal] = useState(false);
  const [renameThemeId, setRenameThemeId] = useState<string | null>(null);
  const [confirmDeleteThemeId, setConfirmDeleteThemeId] = useState<string | null>(null);
  const [themeImportOpen, setThemeImportOpen] = useState(false);
  const [themeImportText, setThemeImportText] = useState('');

  useEffect(() => {
    let cancelled = false;
    getHttpPort()
      .then((p) => {
        if (!cancelled) setHttpPort(p);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const updateMacro = (id: string, patch: Partial<Macro>) =>
    updateSettings({ macros: macros.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const addMacro = () => {
    const m: Macro = {
      id: `macro-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: 'New Macro',
      keybinding: '',
      steps: [{ type: 'action', actionId: 'split-horizontal' }],
    };
    updateSettings({ macros: [...macros, m] });
  };
  const deleteMacro = (id: string) => updateSettings({ macros: macros.filter((m) => m.id !== id) });
  const addMacroStep = (id: string) => {
    const m = macros.find((x) => x.id === id);
    if (m) updateMacro(id, { steps: [...m.steps, { type: 'delay', ms: 300 }] });
  };
  const removeMacroStep = (id: string, idx: number) => {
    const m = macros.find((x) => x.id === id);
    if (m) updateMacro(id, { steps: m.steps.filter((_, i) => i !== idx) });
  };
  const setMacroStep = (id: string, idx: number, patch: Partial<MacroStep>) => {
    const m = macros.find((x) => x.id === id);
    if (m) updateMacro(id, { steps: m.steps.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  };

  const saveProfile = () => {
    if (saveSettingsProfile(profileName)) {
      addToast({ type: 'success', title: 'Profile saved', description: `"${profileName.trim()}" is ready to apply anytime.` });
      setProfileName('');
    } else {
      addToast({ type: 'error', title: 'Could not save profile', description: 'Enter a profile name first.' });
    }
  };

  useEffect(() => {
    if (!recordingId) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setRecordingId(null);
        return;
      }
      const accel = eventToAccelerator(e);
      if (!accel) return;
      const ok = updateKeybinding(recordingId, accel);
      if (ok) {
        addToast({ type: 'success', title: 'Shortcut updated', description: `${keybindings[recordingId]?.label} → ${accel}` });
      } else {
        addToast({ type: 'warning', title: 'Shortcut conflict', description: `${accel} is already assigned to another action.` });
      }
      setRecordingId(null);
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [recordingId, updateKeybinding, keybindings, addToast]);

  const handleExport = () => {
    const blob = new Blob([exportSettings()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vibegrid-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: 'Settings exported', description: 'Saved to vibegrid-settings.json' });
  };

  const confirmImport = async () => {
    if (!pendingImportFile) return;
    try {
      localStorage.setItem('vibegrid_settings_backup_v1', exportSettings());
    } catch (e) {}
    await applyImport(pendingImportFile);
    setPendingImportFile(null);
  };

  useEffect(() => {
    if (!isSettingsOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !recordingId) toggleSettings();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSettingsOpen, toggleSettings, recordingId]);

  useEffect(() => {
    if (!isSettingsOpen) return;
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    voiceModelStatus()
      .then((status) => {
        if (!cancelled && status) setModelReady(status.ready);
      })
      .catch(() => {});

    listenModelProgress(({ payload }) => {
      if (cancelled) return;
      if (payload.percent >= 100) setModelReady(true);
    }).then((fn) => {
      if (cancelled) {
        fn();
      } else {
        unlisten = fn;
      }
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [isSettingsOpen]);

  useEffect(() => {
    if (!isSettingsOpen) return;
    let cancelled = false;
    setMicLoading(true);
    invoke<string[]>('voice_list_input_devices')
      .then((devices) => {
        if (!cancelled) setMicDevices(devices);
      })
      .catch((e) => {
        console.warn('[VibeGrid] Could not list input devices:', e);
      })
      .finally(() => {
        if (!cancelled) setMicLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSettingsOpen]);

  const applyImport = async (file: File) => {
    const text = await file.text();
    const ok = importSettings(text);
    addToast(
      ok
        ? { type: 'success', title: 'Settings imported', description: 'Your preferences were restored.' }
        : { type: 'error', title: 'Invalid settings file', description: 'Could not parse the JSON you selected.' }
    );
  };

  const handleMicTest = async () => {
    if (micTesting) return;
    setMicTesting(true);
    try {
      const { voiceStartRecording, voiceCancelRecording, listenAudioLevel } = await import('@/lib/tauri');
      let peak = 0;
      const unlisten = await listenAudioLevel(({ payload }) => {
        peak = Math.max(peak, payload.level);
      });
      await voiceStartRecording();
      await new Promise((r) => setTimeout(r, 1600));
      await voiceCancelRecording();
      unlisten();
      addToast({
        type: peak > 0.05 ? 'success' : 'warning',
        title: peak > 0.05 ? 'Microphone working' : 'No audio detected',
        description: peak > 0.05
          ? `Peak level ${Math.round(peak * 100)}% — you're good to dictate.`
          : 'No sound was picked up. Check the selected microphone and try again.',
      });
    } catch (e) {
      console.warn('[VibeGrid] Mic test failed:', e);
      addToast({ type: 'error', title: 'Mic test unavailable', description: 'Voice recording is not available in this build.' });
    } finally {
      setMicTesting(false);
    }
  };

  const handleExportTheme = (id: string) => {
    const json = exportTheme(id);
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vibegrid-theme.json';
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: 'Theme exported', description: 'Saved to vibegrid-theme.json' });
  };

  const handleImportTheme = () => {
    const ok = importTheme(themeImportText);
    addToast(
      ok
        ? { type: 'success', title: 'Theme imported', description: 'It is now available in the theme list.' }
        : { type: 'error', title: 'Invalid theme JSON', description: 'Expected a palette object with background / foreground / cursor colors.' }
    );
    if (ok) {
      setThemeImportText('');
      setThemeImportOpen(false);
    }
  };

  if (!isSettingsOpen) return null;

  const allThemes = { ...THEMES, ...customThemes };
  const selThemeId = selectedThemeId ?? themeName;

  const renameTarget = workspaces.find((w) => w.id === renameWsId);
  const deleteTarget = workspaces.find((w) => w.id === deleteWsId);
  const deleteRunningCount = deleteTarget
    ? (deleteTarget.id === activeWorkspaceId
        ? getTerminalNodes(usePaneStore.getState().root)
        : getTerminalNodes(deleteTarget.layout)
      ).filter((t) => t.paneId).length
    : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181924] overflow-hidden font-sans animate-fade-in text-white/90">
      {/* Top Header Bar */}
      <div className="px-8 py-5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/90 font-mono">
            {SETTINGS_TAB_LABELS[activeSettingsTab] || activeSettingsTab}
          </h2>
          <span className="text-xs text-white/40 font-sans hidden sm:inline">
            Preferences & Configurations
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-white/60">
            SETTINGS
          </span>
        </div>
      </div>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar max-w-4xl">
        {/* --- TAB 1: FONT --- */}
        {activeSettingsTab === 'font' && (
          <div className="space-y-4 max-w-3xl">
            {/* Font Family Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Font Family</label>
              </div>
              <input
                list="vg-font-quickpicks"
                type="text"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                placeholder="e.g. 'Fira Code', monospace"
                className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-white/30 font-mono transition-colors"
              />
              <datalist id="vg-font-quickpicks">
                <option value="JetBrains Mono, monospace" />
                <option value="Fira Code, monospace" />
                <option value="Menlo, Monaco, monospace" />
                <option value="Consolas, monospace" />
                <option value="SF Mono, monospace" />
                <option value="Cascadia Code, monospace" />
                <option value="IBM Plex Mono, monospace" />
                <option value="monospace" />
              </datalist>
              <span className="block text-[10px] text-white/40 mt-1">Any installed font family or CSS stack works — type it, or pick a quick pick.</span>
            </div>

            {/* Font Size Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Font Size</label>
                <span className="text-[13px] text-white/90 font-mono">{fontSize}px</span>
              </div>
              <input
                type="range"
                min={fontSizeMin}
                max={fontSizeMax}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-white bg-black/40 h-2 rounded-full cursor-pointer"
              />
            </div>

            {/* Font Ligatures Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white/90">Font Ligatures</span>
                <span className="block text-[10px] text-white/40 mt-0.5">Fira Code / JetBrains Mono ligatures (&gt;=, =&gt;, -&gt;)</span>
              </div>
              <ToggleSwitch checked={fontLigatures} onChange={(v) => setFontLigatures(v)} />
            </div>

            {/* Line Height Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Line Height</label>
                <span className="text-[13px] text-white/90 font-mono">{lineHeight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={lineHeightMin}
                max={lineHeightMax}
                step={0.05}
                value={lineHeight}
                onChange={(e) => setLineHeight(Number(e.target.value))}
                className="w-full accent-white bg-black/40 h-2 rounded-full cursor-pointer"
              />
            </div>

            {/* Terminal Opacity Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Terminal Opacity</label>
                <span className="text-[13px] text-white/90 font-mono">{Math.round(terminalOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={terminalOpacityMin}
                max={1}
                step={0.05}
                value={terminalOpacity}
                onChange={(e) => setTerminalOpacity(Number(e.target.value))}
                className="w-full accent-white bg-black/40 h-2 rounded-full cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* --- TAB 2: THEME --- */}
        {activeSettingsTab === 'theme' && (
          <div className="space-y-5 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[13px] font-bold font-sans text-white/90">Theme Library</span>
                <span className="block text-[10px] text-white/40 mt-0.5">{Object.keys(allThemes).length} installed themes available</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateThemeModal(true)}
                  className="h-10 flex items-center gap-2 px-4 rounded-2xl bg-white text-black hover:bg-white/90 text-[13px] font-semibold transition-all cursor-pointer"
                  title="Create a new theme based on the current one"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Theme</span>
                </button>
                <button
                  onClick={() => setThemeImportOpen(!themeImportOpen)}
                  className="h-10 flex items-center gap-2 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-white/90 text-[13px] transition-all cursor-pointer"
                  title="Import a theme from JSON"
                >
                  <Upload className="w-4 h-4 text-white/70" />
                  <span>Import JSON</span>
                </button>
              </div>
            </div>

            {themeImportOpen && (
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 animate-fade-in">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-white/40">Paste theme palette JSON ({'{ name, ...palette }'}):</label>
                <textarea
                  value={themeImportText}
                  onChange={(e) => setThemeImportText(e.target.value)}
                  rows={4}
                  placeholder='{"name":"My Theme","background":"#0b0d12","foreground":"#e2e8f0","cursor":"#3c95f0",...}'
                  className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white/90 placeholder-white/25 focus:outline-none focus:border-white/30 resize-y"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleImportTheme}
                    disabled={!themeImportText.trim()}
                    className="h-9 px-4 rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-40 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Import Theme
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(allThemes).map(([key, theme]) => {
                const isCustom = key in customThemes;
                const isActive = themeName === key;
                const isSelected = selThemeId === key;
                return (
                  <div
                    key={key}
                    onClick={() => {
                      setThemeName(key);
                      setSelectedThemeId(key);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isActive
                        ? 'border-white/80 bg-white/[0.06] shadow-[0_0_16px_rgba(255,255,255,0.06)]'
                        : isSelected
                          ? 'border-white/40 bg-white/[0.03]'
                          : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[13px] font-bold text-white/90 flex items-center gap-1.5">
                        {theme.name}
                        {isCustom && (
                          <span className="px-1.5 py-0.5 rounded-md bg-white/10 border border-white/15 text-[9px] font-medium text-white/80 font-mono">custom</span>
                        )}
                      </span>
                      {isActive && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                    </div>
                    <div className="flex gap-1.5 p-2.5 rounded-xl bg-black/60 border border-white/[0.04]">
                      <div className="w-4 h-4 rounded-lg border border-white/10" style={{ backgroundColor: theme.background }} />
                      <div className="w-4 h-4 rounded-lg" style={{ backgroundColor: theme.foreground }} />
                      <div className="w-4 h-4 rounded-lg" style={{ backgroundColor: theme.cursor }} />
                      <div className="w-4 h-4 rounded-lg" style={{ backgroundColor: theme.blue }} />
                      <div className="w-4 h-4 rounded-lg" style={{ backgroundColor: theme.green }} />
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      {isCustom ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedThemeId(duplicateTheme(key)); }}
                            className="flex-1 h-8 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 text-[11px] text-white/70 hover:text-white transition-colors"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setRenameThemeId(key); }}
                            className="flex-1 h-8 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 text-[11px] text-white/70 hover:text-white transition-colors"
                          >
                            Rename
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleExportTheme(key); }}
                            className="flex-1 h-8 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 text-[11px] text-white/70 hover:text-white transition-colors"
                          >
                            Export
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteThemeId(key); }}
                            className="flex-1 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-[11px] text-rose-300 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedThemeId(duplicateTheme(key)); }}
                          className="flex-1 h-8 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 text-[11px] text-white/70 hover:text-white transition-colors"
                        >
                          Duplicate Theme
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selThemeId && selThemeId in customThemes && (
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3 animate-fade-in">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-bold text-white/90">Theme Editor</span>
                  <span className="text-[11px] text-white/40 font-mono">{customThemes[selThemeId].name}</span>
                </div>
                <p className="text-[11px] text-white/40 mb-3">
                  Live preview active. Click a swatch below to customize palette channels.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {THEME_COLOR_SLOTS.map(([slot, label]) => (
                    <label key={slot} className="flex items-center gap-2.5 p-2 rounded-xl bg-black/40 border border-white/5 cursor-pointer hover:border-white/15 transition-colors">
                      <input
                        type="color"
                        value={toHexColor(customThemes[selThemeId][slot] ?? '')}
                        onChange={(e) => updateThemeColors(selThemeId, { [slot]: e.target.value })}
                        className="w-7 h-7 shrink-0 rounded-lg cursor-pointer bg-transparent border border-white/20"
                        aria-label={label}
                      />
                      <span className="text-xs text-white/80 truncate">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: TERMINAL --- */}
        {activeSettingsTab === 'terminal' && (
          <div className="space-y-4 max-w-3xl">
            {/* Default Shell Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Default Shell for New Panes</label>
              <input
                type="text"
                value={defaultShell}
                onChange={(e) => setDefaultShell(e.target.value.trim())}
                placeholder="/bin/zsh (empty = system default)"
                className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-white/30 font-mono transition-colors"
              />
              <span className="block text-[10px] text-white/40 mt-1">Used for new panes unless overridden via context menu.</span>
            </div>

            {/* Default Working Directory Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Default Working Directory (CWD)</label>
              <input
                type="text"
                value={defaultCwd}
                onChange={(e) => updateSettings({ defaultCwd: e.target.value.trim() })}
                placeholder="/Users/you/projects (empty = session directory)"
                className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-white/30 font-mono transition-colors"
              />
              <span className="block text-[10px] text-white/40 mt-1">New panes open here unless the split parent has its own directory.</span>
            </div>

            {/* Default Shell Arguments Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Default Shell Arguments</label>
              <input
                type="text"
                value={shellArgs}
                onChange={(e) => updateSettings({ shellArgs: e.target.value })}
                placeholder="--login (space-separated; empty = none)"
                className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-white/30 font-mono transition-colors"
              />
              <span className="block text-[10px] text-white/40 mt-1">Passed to the default shell on every new pane spawn.</span>
            </div>

            {/* Default Shell Environment Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Default Shell Environment</label>
              <textarea
                value={shellEnv}
                onChange={(e) => updateSettings({ shellEnv: e.target.value })}
                placeholder={'EDITOR=nvim\nGIT_EDITOR=nvim\nMY_VAR=value'}
                rows={3}
                className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-white/30 font-mono resize-y"
              />
              <span className="block text-[10px] text-white/40 mt-1">One KEY=VALUE per line. Merged into every new pane session.</span>
            </div>

            {/* Scrollback Lines Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Scrollback Buffer</label>
                <span className="text-[13px] text-white/90 font-mono">{scrollback.toLocaleString()} lines</span>
              </div>
              <input
                type="number"
                min={scrollbackMin}
                max={scrollbackMax}
                step={500}
                value={scrollback}
                onChange={(e) => setScrollback(Number(e.target.value))}
                className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 focus:outline-none focus:border-white/30 font-mono"
              />
            </div>

            {/* Cursor Style Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Cursor Style</label>
              <select
                value={cursorStyle}
                onChange={(e) => setCursorStyle(e.target.value as CursorStyle)}
                className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 focus:outline-none focus:border-white/30"
              >
                <option value="block">Block</option>
                <option value="bar">Bar (Beam)</option>
                <option value="underline">Underline</option>
              </select>
            </div>

            {/* Cursor Blinking Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white/90">Cursor Blinking</span>
                <span className="block text-[10px] text-white/40 mt-0.5">Smooth cursor blink animation</span>
              </div>
              <ToggleSwitch checked={cursorBlink} onChange={(v) => setCursorBlink(v)} />
            </div>

            {/* Copy on Select Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white/90">Copy on Select</span>
                <span className="block text-[10px] text-white/40 mt-0.5">Automatically copy highlighted text to clipboard</span>
              </div>
              <ToggleSwitch checked={copyOnSelect} onChange={(v) => setCopyOnSelect(v)} />
            </div>

            {/* Minimize to Tray Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white/90">Minimize to Tray</span>
                <span className="block text-[10px] text-white/40 mt-0.5">Hides to system tray on window close</span>
              </div>
              <ToggleSwitch checked={minimizeToTray} onChange={(v) => setMinimizeToTray(v)} />
            </div>

            {/* Startup & Tray Section */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Startup & System Tray</span>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white/90">Launch at Login</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Start VibeGrid automatically on system login</span>
                </div>
                <ToggleSwitch checked={launchAtLogin} onChange={(v) => updateSettings({ launchAtLogin: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white/90">Start Maximized</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Open window maximized on startup</span>
                </div>
                <ToggleSwitch checked={startMaximized} onChange={(v) => updateSettings({ startMaximized: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white/90">Start Hidden to Tray</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Launch quietly in background</span>
                </div>
                <ToggleSwitch checked={startHidden} onChange={(v) => updateSettings({ startHidden: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white/90">Close to Tray</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Close button minimizes to tray instead of quitting</span>
                </div>
                <ToggleSwitch checked={closeToTray} onChange={(v) => updateSettings({ closeToTray: v })} />
              </div>
            </div>

            {/* Voice-to-Terminal Section */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-bold text-white/90 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-white/80" />
                    Voice-to-Terminal
                    {modelReady === false && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[9px] font-mono text-amber-400">model downloading</span>
                    )}
                    {modelReady === true && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[9px] font-mono text-white/80">ready</span>
                    )}
                  </span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Local Whisper dictation with Cmd/Ctrl+Shift+V</span>
                </div>
                <ToggleSwitch checked={voiceToTerminal} onChange={setVoiceToTerminal} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1.5">Dictation Language</label>
                  <select
                    value={voiceLanguage}
                    onChange={(e) => updateSettings({ voiceLanguage: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 focus:outline-none focus:border-white/30"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ru">Russian</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="hi">Hindi</option>
                    <option value="ar">Arabic</option>
                    <option value="nl">Dutch</option>
                    <option value="pl">Polish</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1.5">Model Size</label>
                  <select
                    value={voiceModelSize}
                    onChange={(e) => updateSettings({ voiceModelSize: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 focus:outline-none focus:border-white/30"
                  >
                    <option value="tiny">Tiny (~75 MB) — fastest</option>
                    <option value="base">Base (~142 MB) — balanced</option>
                    <option value="small">Small (~466 MB) — accurate</option>
                    <option value="medium">Medium (~1.5 GB) — most accurate</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Silence Timeout</label>
                  <span className="text-[13px] text-white/90 font-mono">{voiceSilenceTimeoutMs} ms</span>
                </div>
                <input
                  type="range"
                  min={voiceSilenceTimeoutMin}
                  max={voiceSilenceTimeoutMax}
                  step={100}
                  value={voiceSilenceTimeoutMs}
                  onChange={(e) => setVoiceSilenceTimeoutMs(Number(e.target.value))}
                  className="w-full accent-white bg-black/40 h-2 rounded-full cursor-pointer"
                />
              </div>

              {!micLoading && micDevices.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Microphone Input</label>
                    <button
                      onClick={handleMicTest}
                      disabled={micTesting}
                      className="h-8 flex items-center gap-1.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-white/90 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{micTesting ? 'Testing…' : 'Test Mic'}</span>
                    </button>
                  </div>
                  <select
                    value={voiceInputDevice}
                    onChange={(e) => setVoiceInputDevice(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 focus:outline-none focus:border-white/30"
                  >
                    <option value="">System Default</option>
                    {micDevices.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Terminal Behavior Section */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Terminal Behavior</span>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white/90">Right-Click Pastes</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Quick paste clipboard on right click</span>
                </div>
                <ToggleSwitch checked={rightClickPaste} onChange={(v) => updateSettings({ rightClickPaste: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white/90">Clickable Links</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Open URLs in default browser</span>
                </div>
                <ToggleSwitch checked={clickableLinks} onChange={(v) => updateSettings({ clickableLinks: v })} />
              </div>

              {clickableLinks && (
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1.5">Link Modifier Key</label>
                  <select
                    value={linkModifier}
                    onChange={(e) => updateSettings({ linkModifier: e.target.value as 'click' | 'meta' | 'ctrl' | 'alt' })}
                    className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 focus:outline-none focus:border-white/30"
                  >
                    <option value="click">Plain click</option>
                    <option value="meta">Cmd / Win key</option>
                    <option value="ctrl">Ctrl key</option>
                    <option value="alt">Alt / Option key</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white/90">Terminal Bell</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Play audio beep on ASCII bell</span>
                </div>
                <ToggleSwitch checked={terminalBell} onChange={(v) => updateSettings({ terminalBell: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white/90">Scroll on Output</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Auto-scroll viewport when receiving terminal stdout</span>
                </div>
                <ToggleSwitch checked={scrollOnOutput} onChange={(v) => updateSettings({ scrollOnOutput: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white/90">Confirm Multi-line Paste</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Prompt confirmation before pasting multi-line text</span>
                </div>
                <ToggleSwitch checked={pasteConfirmNewlines} onChange={(v) => updateSettings({ pasteConfirmNewlines: v })} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Terminal Padding</label>
                  <span className="text-[13px] text-white/90 font-mono">{terminalPadding}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={terminalPadding}
                  onChange={(e) => updateSettings({ terminalPadding: Number(e.target.value) })}
                  className="w-full accent-white bg-black/40 h-2 rounded-full cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1.5">Word Selection Separators</label>
                <input
                  type="text"
                  value={wordSeparators}
                  onChange={(e) => updateSettings({ wordSeparators: e.target.value })}
                  placeholder=" "
                  className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 font-mono focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">IPC Batch Interval</label>
                  <span className="text-[13px] text-white/90 font-mono">{ipcBatchIntervalMs} ms</span>
                </div>
                <input
                  type="number"
                  min={4}
                  max={2000}
                  step={1}
                  value={ipcBatchIntervalMs}
                  onChange={(e) => setIpcBatchIntervalMs(Number(e.target.value))}
                  className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 focus:outline-none focus:border-white/30 font-mono"
                />
                <div className="flex items-center gap-2 mt-2.5">
                  {[8, 16, 33, 66].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setIpcBatchIntervalMs(preset)}
                      className={`px-3 py-1 rounded-lg border text-xs font-mono transition-colors ${
                        ipcBatchIntervalMs === preset
                          ? 'border-white/80 bg-white/15 text-white font-bold'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {preset} ms
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 4: WORKSPACES --- */}
        {activeSettingsTab === 'workspaces' && (
          <div className="space-y-5 max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[13px] font-bold font-sans text-white/90">Workspaces</span>
                <span className="block text-[10px] text-white/40 mt-0.5">{workspaces.length} active workspaces managed</span>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-10 flex items-center gap-2 px-4 rounded-2xl bg-white text-black hover:bg-white/90 text-[13px] font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Workspace</span>
              </button>
            </div>

            {/* Active Workspace Overrides Box */}
            {(() => {
              const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
              const ov = activeWs?.overrides ?? {};
              const hasOverrides = Object.keys(ov).length > 0;
              const setOv = (patch: WorkspaceOverrides) =>
                setWorkspaceOverrides(activeWorkspaceId, cleanOverrides({ ...ov, ...patch }));
              return (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[13px] font-bold text-white/90">Workspace Overrides</span>
                      <span className="block text-[10px] text-white/40 mt-0.5">
                        Scoped settings for "{activeWs?.name ?? 'Active Workspace'}"
                      </span>
                    </div>
                    {hasOverrides && (
                      <button
                        onClick={() => setWorkspaceOverrides(activeWorkspaceId, null)}
                        className="px-3 py-1 rounded-xl border border-white/10 text-xs text-white/60 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                      >
                        Clear All Overrides
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1.5">Theme Override</label>
                      <select
                        value={ov.themeName ?? ''}
                        onChange={(e) => setOv({ themeName: e.target.value || undefined })}
                        className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 focus:outline-none focus:border-white/30"
                      >
                        <option value="">— inherit global —</option>
                        {Object.entries(allThemes).map(([key, t]) => (
                          <option key={key} value={key}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1.5">Font Size Override (px)</label>
                      <input
                        type="number"
                        min={fontSizeMin}
                        max={fontSizeMax}
                        value={ov.fontSize ?? ''}
                        onChange={(e) => setOv({ fontSize: e.target.value === '' ? undefined : Number(e.target.value) })}
                        placeholder="inherit"
                        className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 focus:outline-none focus:border-white/30 font-mono"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1.5">Font Family Override</label>
                      <input
                        type="text"
                        value={ov.fontFamily ?? ''}
                        onChange={(e) => setOv({ fontFamily: e.target.value || undefined })}
                        placeholder="empty = inherit global"
                        className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 focus:outline-none focus:border-white/30 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1.5">Default Shell Override</label>
                      <input
                        type="text"
                        value={ov.defaultShell ?? ''}
                        onChange={(e) => setOv({ defaultShell: e.target.value.trim() || undefined })}
                        placeholder="empty = inherit"
                        className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 focus:outline-none focus:border-white/30 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1.5">Default CWD Override</label>
                      <input
                        type="text"
                        value={ov.defaultCwd ?? ''}
                        onChange={(e) => setOv({ defaultCwd: e.target.value.trim() || undefined })}
                        placeholder="empty = inherit"
                        className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 focus:outline-none focus:border-white/30 font-mono"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Workspaces List Cards */}
            <div className="space-y-2">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                    ws.id === activeWorkspaceId
                      ? 'border-white/80 bg-white/[0.06] shadow-[0_0_16px_rgba(255,255,255,0.06)]'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="text-[13px] font-bold text-white/90 flex items-center gap-2">
                      <span>{ws.name}</span>
                      {ws.id === activeWorkspaceId && (
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-[9px] font-mono text-white/80 font-normal">active</span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/40 font-mono mt-0.5">ID: {ws.id}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {ws.id !== activeWorkspaceId && (
                      <button
                        onClick={() => requestSwitchWorkspace(ws.id)}
                        className="h-8 px-3 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-semibold transition-all cursor-pointer"
                      >
                        Switch
                      </button>
                    )}

                    <button
                      onClick={() => setRenameWsId(ws.id)}
                      className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Rename"
                      aria-label={`Rename workspace ${ws.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => duplicateWorkspace(ws.id)}
                      className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Duplicate Workspace"
                      aria-label={`Duplicate workspace ${ws.name}`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleArchive(ws.id)}
                      className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title={ws.archived ? 'Unarchive Workspace' : 'Archive Workspace'}
                      aria-label={ws.archived ? `Unarchive workspace ${ws.name}` : `Archive workspace ${ws.name}`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteWsId(ws.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors"
                      title="Delete Workspace"
                      aria-label={`Delete workspace ${ws.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 5: LIMITS --- */}
        {activeSettingsTab === 'limits' && (
          <div className="space-y-4 max-w-3xl">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Max Panes Allowed</label>
                <span className="text-[13px] text-white/90 font-mono">{maxPanes} panes</span>
              </div>
              <input
                type="range"
                min={1}
                max={64}
                value={maxPanes}
                onChange={(e) => updateSettings({ maxPanes: Number(e.target.value) })}
                className="w-full accent-white bg-black/40 h-2 rounded-full cursor-pointer"
              />
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Minimum Pane Size</label>
                <span className="text-[13px] text-white/90 font-mono">{minPaneSize}px</span>
              </div>
              <input
                type="range"
                min={40}
                max={400}
                step={10}
                value={minPaneSize}
                onChange={(e) => updateSettings({ minPaneSize: Number(e.target.value) })}
                className="w-full accent-white bg-black/40 h-2 rounded-full cursor-pointer"
              />
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white/90">Snap Divider on Release</span>
                <span className="block text-[10px] text-white/40 mt-0.5">Snap to center split when near equal threshold</span>
              </div>
              <ToggleSwitch checked={dividerSnap} onChange={(v) => updateSettings({ dividerSnap: v })} />
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white/90">Double-Click Divider to Equalize</span>
                <span className="block text-[10px] text-white/40 mt-0.5">Quickly restore equal split by double-clicking sash</span>
              </div>
              <ToggleSwitch checked={doubleClickEqualize} onChange={(v) => updateSettings({ doubleClickEqualize: v })} />
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Max WebGL Contexts</label>
                <span className="text-[13px] text-white/90 font-mono">{maxWebglSlots}</span>
              </div>
              <input
                type="range"
                min={1}
                max={64}
                value={maxWebglSlots}
                onChange={(e) => updateSettings({ maxWebglSlots: Number(e.target.value) })}
                className="w-full accent-white bg-black/40 h-2 rounded-full cursor-pointer"
              />
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white/90">Show Cinematic Splash Screen</span>
                <span className="block text-[10px] text-white/40 mt-0.5">Play splash intro animation on app launch</span>
              </div>
              <ToggleSwitch checked={showSplash} onChange={(v) => updateSettings({ showSplash: v })} />
            </div>

            {/* Confirmations Cards */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Safety & Confirmations</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  ['paneClose', 'Close pane'],
                  ['quit', 'Quit with running processes'],
                  ['layoutShrink', 'Shrink / reset grid'],
                  ['workspaceDelete', 'Delete workspace'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1.5">{label}</label>
                    <select
                      value={confirmations[key]}
                      onChange={(e) => updateSettings({ confirmations: { ...confirmations, [key]: e.target.value as 'always' | 'never' } })}
                      className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 focus:outline-none focus:border-white/30"
                    >
                      <option value="always">Always ask</option>
                      <option value="never">Never ask (act immediately)</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 6: APPEARANCE --- */}
        {activeSettingsTab === 'appearance' && (
          <div className="space-y-4 max-w-3xl">
            {/* Color Scheme Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Color Scheme (UI Chrome)</label>
              <div className="flex gap-2">
                {(['dark', 'light', 'system'] as ThemeMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => updateSettings({ themeMode: m })}
                    className={`h-10 px-4 rounded-xl border text-[13px] font-medium transition-all ${
                      themeMode === m
                        ? 'border-white/80 bg-white text-black font-semibold'
                        : 'border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {m === 'dark' ? 'Dark Mode' : m === 'light' ? 'Light Mode' : 'Follow System'}
                  </button>
                ))}
              </div>
            </div>

            {/* Animations Switch */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white/90">UI Animations</span>
                <span className="block text-[10px] text-white/40 mt-0.5">Smooth transitions and modal fades</span>
              </div>
              <ToggleSwitch checked={animationsEnabled} onChange={(v) => updateSettings({ animationsEnabled: v })} />
            </div>

            {/* UI Zoom */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">UI Zoom</label>
                <span className="text-[13px] text-white/90 font-mono">{uiZoom}%</span>
              </div>
              <input
                type="range"
                min={80}
                max={150}
                step={5}
                value={uiZoom}
                onChange={(e) => updateSettings({ uiZoom: Number(e.target.value) })}
                className="w-full accent-white bg-black/40 h-2 rounded-full cursor-pointer"
              />
            </div>

            {/* Sidebar Width */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Sidebar Width</label>
                <span className="text-[13px] text-white/90 font-mono">{sidebarWidth}px</span>
              </div>
              <input
                type="range"
                min={160}
                max={480}
                step={8}
                value={sidebarWidth}
                onChange={(e) => updateSettings({ sidebarWidth: Number(e.target.value) })}
                className="w-full accent-white bg-black/40 h-2 rounded-full cursor-pointer"
              />
            </div>

            {/* Status Bar Badges */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Status Bar Badges</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  ['workspace', 'Workspace Name'],
                  ['font', 'Font Size Display'],
                  ['gpu', 'GPU / CPU Status'],
                  ['panes', 'Active Pane Count'],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[13px] text-white/80">{label}</span>
                    <ToggleSwitch
                      checked={statusBarBadges[key]}
                      onChange={(v) => updateSettings({ statusBarBadges: { ...statusBarBadges, [key]: v } })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 7: KEYBOARD --- */}
        {activeSettingsTab === 'keyboard' && (
          <div className="space-y-5 max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[13px] font-bold font-sans text-white/90">Custom Keybindings</span>
                <span className="block text-[10px] text-white/40 mt-0.5">Click any shortcut to reassign</span>
              </div>
              <button
                onClick={() => setConfirmResetKeybindings(true)}
                className="h-10 flex items-center gap-2 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[13px] text-white/90 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-white/70" />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="space-y-2">
              {Object.values(keybindings).map((kb) => (
                <div
                  key={kb.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
                    recordingId === kb.id
                      ? 'border-white bg-white/10 text-white'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                  }`}
                >
                  <div>
                    <div className="font-sans font-bold text-white/90 text-[13px]">{kb.label}</div>
                    <div className="text-[10px] text-white/40 font-mono mt-0.5">{kb.id}</div>
                  </div>

                  <button
                    onClick={() => setRecordingId(recordingId === kb.id ? null : kb.id)}
                    className={`h-9 px-3.5 rounded-xl font-mono text-xs border transition-all ${
                      recordingId === kb.id
                        ? 'border-white bg-white text-black font-bold animate-pulse'
                        : 'border-white/10 bg-black/40 text-white/80 hover:border-white/30'
                    }`}
                  >
                    {recordingId === kb.id ? 'Press keys…' : kb.currentKey}
                  </button>
                </div>
              ))}
            </div>

            {/* Macros Studio */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-bold text-white/90">Macros Studio</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Automate multi-action sequences</span>
                </div>
                <button
                  onClick={addMacro}
                  className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Macro</span>
                </button>
              </div>

              <div className="space-y-3">
                {macros.map((macro) => (
                  <div key={macro.id} className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={macro.name}
                        onChange={(e) => updateMacro(macro.id, { name: e.target.value.slice(0, 60) })}
                        placeholder="Macro name"
                        className="flex-1 h-9 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-white/30"
                      />
                      <input
                        type="text"
                        value={macro.keybinding}
                        onChange={(e) => updateMacro(macro.id, { keybinding: e.target.value.trim() })}
                        placeholder="Keybinding (Mod+Alt+1)"
                        className="w-36 h-9 px-3 font-mono rounded-lg bg-black/60 border border-white/10 text-xs text-white/80 focus:outline-none focus:border-white/30"
                      />
                      <button
                        onClick={() => runMacro(macro)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Run macro"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMacro(macro.id)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors"
                        title="Delete macro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {macro.steps.map((step, si) => (
                        <div key={si} className="flex items-center gap-2">
                          <select
                            value={step.type === 'action' ? step.actionId ?? '' : 'delay'}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === 'delay') setMacroStep(macro.id, si, { type: 'delay', ms: 300 });
                              else setMacroStep(macro.id, si, { type: 'action', actionId: v });
                            }}
                            className="flex-1 h-8 px-2.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white/90 focus:outline-none"
                          >
                            <option value="delay">— pause delay —</option>
                            {MACRO_ACTIONS.map((a) => (
                              <option key={a.id} value={a.id}>{a.label}</option>
                            ))}
                          </select>
                          {step.type === 'delay' && (
                            <input
                              type="number"
                              min={0}
                              max={10000}
                              step={50}
                              value={step.ms ?? 300}
                              onChange={(e) => setMacroStep(macro.id, si, { ms: Number(e.target.value) })}
                              className="w-20 h-8 px-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white/90 focus:outline-none font-mono"
                            />
                          )}
                          <button
                            onClick={() => removeMacroStep(macro.id, si)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addMacroStep(macro.id)}
                      className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Step
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 8: PROFILES --- */}
        {activeSettingsTab === 'profiles' && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <span className="text-[13px] font-bold font-sans text-white/90">Settings Profiles</span>
              <p className="text-[11px] text-white/40 mt-0.5">Save complete configurations as named presets.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveProfile();
                }}
                placeholder="Profile name (e.g. Fullstack Dev / Minimal)"
                className="flex-1 h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-white/30"
              />
              <button
                onClick={saveProfile}
                className="h-10 flex items-center gap-2 px-4 rounded-2xl bg-white text-black hover:bg-white/90 text-[13px] font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>

            <div className="space-y-2">
              {listSettingsProfiles().map((name) => (
                <div key={name} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <span className="text-[13px] font-bold text-white/90">{name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (loadSettingsProfile(name)) {
                          addToast({ type: 'success', title: 'Profile applied', description: `"${name}" is now active.` });
                        } else {
                          addToast({ type: 'error', title: 'Could not apply profile', description: `"${name}" appears to be corrupt.` });
                        }
                      }}
                      className="h-8 px-3 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => deleteSettingsProfile(name)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* MCP HTTP Endpoint */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-white/80" />
                <span className="text-[13px] font-bold text-white/90">MCP / HTTP Endpoint</span>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">
                VibeGrid state API for local AI agents and external scripts:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white/80 truncate">
                  http://127.0.0.1:{httpPort ?? '8792'}/panes
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`http://127.0.0.1:${httpPort ?? 8792}/panes`);
                    addToast({ type: 'success', title: 'Endpoint copied' });
                  }}
                  className="h-10 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Copy endpoint URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer: Import / Export / Reset matching Sidebar buttons */}
      <div className="flex items-center justify-between px-8 py-4 border-t border-white/5 bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="h-10 flex items-center gap-2 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-white/90 text-[13px] font-normal transition-all cursor-pointer"
            title="Download settings as JSON"
          >
            <Download className="w-4 h-4 text-white/70" />
            <span>Export</span>
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            className="h-10 flex items-center gap-2 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-white/90 text-[13px] font-normal transition-all cursor-pointer"
            title="Import settings from JSON"
          >
            <Upload className="w-4 h-4 text-white/70" />
            <span>Import</span>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPendingImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
        <button
          onClick={() => setConfirmResetAll(true)}
          className="h-10 flex items-center gap-2 px-4 rounded-2xl bg-white/[0.04] hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-white/90 hover:text-rose-400 text-[13px] font-normal transition-all cursor-pointer"
          title="Reset all settings to defaults"
        >
          <RotateCcw className="w-4 h-4 text-white/70" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Confirmation & Input Modals */}
      {showCreateModal && (
        <InputModal
          title="Create New Workspace"
          placeholder={`Workspace ${workspaces.length + 1}`}
          initialValue={`Workspace ${workspaces.length + 1}`}
          onSave={(name) => requestCreateWorkspace(name.slice(0, useSettingsStore.getState().workspaceNameMaxLength))}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {renameWsId && renameTarget && (
        <InputModal
          title="Rename Workspace"
          initialValue={renameTarget.name}
          onSave={(name) => {
            renameWorkspace(renameWsId, name.slice(0, useSettingsStore.getState().workspaceNameMaxLength));
            setRenameWsId(null);
          }}
          onClose={() => setRenameWsId(null)}
        />
      )}

      {deleteWsId && deleteTarget && (
        <ConfirmModal
          title="Delete Workspace"
          message={
            workspaces.length === 1
              ? `Delete the last workspace "${deleteTarget.name}"? VibeGrid will reset to a fresh Default Workspace and terminate any running terminals.`
              : deleteRunningCount > 0
                ? `Delete workspace "${deleteTarget.name}"? This will terminate ${deleteRunningCount} running terminal${deleteRunningCount > 1 ? 's' : ''} in it. This action cannot be undone.`
                : `Delete workspace "${deleteTarget.name}"? This action cannot be undone.`
          }
          confirmLabel="Delete Workspace"
          isDanger={true}
          onConfirm={() => deleteWorkspace(deleteWsId)}
          onClose={() => setDeleteWsId(null)}
        />
      )}

      {showCreateThemeModal && (
        <InputModal
          title="Create Custom Theme"
          placeholder="My Theme"
          initialValue=""
          onSave={(name) => {
            const id = saveThemeAs(name);
            setThemeName(id);
            setSelectedThemeId(id);
            addToast({ type: 'success', title: 'Theme created', description: `"${name}" is based on your current palette and ready to edit.` });
          }}
          onClose={() => setShowCreateThemeModal(false)}
        />
      )}

      {renameThemeId && customThemes[renameThemeId] && (
        <InputModal
          title="Rename Theme"
          initialValue={customThemes[renameThemeId].name}
          onSave={(name) => {
            renameTheme(renameThemeId, name);
            setRenameThemeId(null);
          }}
          onClose={() => setRenameThemeId(null)}
        />
      )}

      {confirmDeleteThemeId && customThemes[confirmDeleteThemeId] && (
        <ConfirmModal
          title="Delete Custom Theme?"
          message={`Delete "${customThemes[confirmDeleteThemeId].name}"? If it is active, VibeGrid falls back to the default theme. This cannot be undone.`}
          confirmLabel="Delete Theme"
          isDanger={true}
          onConfirm={() => {
            deleteTheme(confirmDeleteThemeId);
            if (selectedThemeId === confirmDeleteThemeId) setSelectedThemeId(null);
            setConfirmDeleteThemeId(null);
          }}
          onClose={() => setConfirmDeleteThemeId(null)}
        />
      )}

      {confirmResetAll && (
        <ConfirmModal
          title="Reset All Settings?"
          message="This resets every preference — font, theme, terminal options, voice settings, and shortcuts — back to defaults. This cannot be undone. Continue?"
          confirmLabel="Reset Everything"
          isDanger={true}
          onConfirm={() => {
            resetSettings();
            addToast({ type: 'success', title: 'Settings reset', description: 'All preferences restored to defaults.' });
          }}
          onClose={() => setConfirmResetAll(false)}
        />
      )}

      {confirmResetKeybindings && (
        <ConfirmModal
          title="Reset Keybindings?"
          message="All custom shortcut assignments will be restored to their defaults. This cannot be undone. Continue?"
          confirmLabel="Reset Shortcuts"
          isDanger={true}
          onConfirm={() => {
            resetKeybindings();
            addToast({ type: 'success', title: 'Keybindings reset', description: 'All shortcuts restored to defaults.' });
          }}
          onClose={() => setConfirmResetKeybindings(false)}
        />
      )}

      {pendingImportFile && (
        <ConfirmModal
          title="Import Settings?"
          message="Importing will overwrite your current settings (font, theme, shortcuts, voice). Your current settings are backed up automatically to 'vibegrid_settings_backup_v1' in case you want to restore them. Continue?"
          confirmLabel="Import & Overwrite"
          isDanger={true}
          onConfirm={confirmImport}
          onClose={() => setPendingImportFile(null)}
        />
      )}
    </div>
  );
};
