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
  Check,
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

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-9 h-5 rounded-full transition-all focus:outline-none cursor-pointer active:scale-95 disabled:scale-100 disabled:opacity-40 disabled:cursor-not-allowed border ${
      checked ? 'bg-[#5683da] border-[#5683da]' : 'bg-[#303236] border-[#4a4b50]'
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform bg-white ${
        checked ? 'translate-x-4' : 'translate-x-0'
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
  const { isSettingsOpen, toggleSettings, activeSettingsTab, setActiveSettingsTab } = useUIStore();
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
  const [editingWsId, setEditingWsId] = useState<string | null>(null);
  const [editingWsName, setEditingWsName] = useState<string>('');
  const editWsInputRef = useRef<HTMLInputElement>(null);
  const isEscapeWsRef = useRef(false);
  const [deleteWsId, setDeleteWsId] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [confirmResetKeybindings, setConfirmResetKeybindings] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [micTesting, setMicTesting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    if (editingWsId && editWsInputRef.current) {
      editWsInputRef.current.focus();
      editWsInputRef.current.select();
    }
  }, [editingWsId]);

  const handleSaveWsRename = (wsId: string) => {
    const trimmed = editingWsName.trim();
    if (!trimmed) {
      setEditingWsId(null);
      return;
    }
    const maxLen = useSettingsStore.getState().workspaceNameMaxLength || 32;
    renameWorkspace(wsId, trimmed.slice(0, maxLen));
    setEditingWsId(null);
  };
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

  const deleteTarget = workspaces.find((w) => w.id === deleteWsId);
  const deleteRunningCount = deleteTarget
    ? (deleteTarget.id === activeWorkspaceId
        ? getTerminalNodes(usePaneStore.getState().root)
        : getTerminalNodes(deleteTarget.layout)
      ).filter((t) => t.paneId).length
    : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111111] overflow-hidden font-sans animate-fade-in text-white">

      <div className="px-8 py-5 border-b border-[#4a4b50] flex items-center justify-between bg-[#111111] shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
            {SETTINGS_TAB_LABELS[activeSettingsTab] || activeSettingsTab}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-[#303236] border border-[#4a4b50] text-[11px] font-mono text-[#5683da]">
            SETTINGS
          </span>
          <button
            type="button"
            onClick={toggleSettings}
            aria-label="Close Settings"
            className="p-1.5 rounded-full hover:bg-[#303236] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Tabs Wrapper */}
      <div className="px-8 py-2.5 border-b border-[#4a4b50]/60 bg-[#111111] shrink-0 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {(Object.entries(SETTINGS_TAB_LABELS) as Array<[typeof activeSettingsTab, string]>).map(([tabId, label]) => {
          const isActive = activeSettingsTab === tabId;
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveSettingsTab(tabId)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#5683da] text-white font-semibold shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236] bg-[#090a0c] border border-[#4a4b50]/50'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar max-w-4xl">

        {activeSettingsTab === 'font' && (
          <div className="space-y-4 max-w-3xl">

            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Font Family</label>
              </div>
              <input
                list="vg-font-quickpicks"
                type="text"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                placeholder="e.g. 'Fira Code', monospace"
                className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white placeholder-[#a9a9aa]/40 focus:outline-none focus:border-[#5683da] font-mono transition-colors"
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
            </div>

            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Font Size</label>
                <span className="text-[13px] text-white font-mono">{fontSize}px</span>
              </div>
              <input
                type="range"
                min={fontSizeMin}
                max={fontSizeMax}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-[#5683da] bg-[#090a0c] h-2 rounded-full cursor-pointer"
              />
            </div>

            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white">Font Ligatures</span>
              </div>
              <ToggleSwitch checked={fontLigatures} onChange={(v) => setFontLigatures(v)} />
            </div>

            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Line Height</label>
                <span className="text-[13px] text-white font-mono">{lineHeight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={lineHeightMin}
                max={lineHeightMax}
                step={0.05}
                value={lineHeight}
                onChange={(e) => setLineHeight(Number(e.target.value))}
                className="w-full accent-[#5683da] bg-[#090a0c] h-2 rounded-full cursor-pointer"
              />
            </div>

            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Terminal Opacity</label>
                <span className="text-[13px] text-white font-mono">{Math.round(terminalOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={terminalOpacityMin}
                max={1}
                step={0.05}
                value={terminalOpacity}
                onChange={(e) => setTerminalOpacity(Number(e.target.value))}
                className="w-full accent-[#5683da] bg-[#090a0c] h-2 rounded-full cursor-pointer"
              />
            </div>
          </div>
        )}

        {activeSettingsTab === 'theme' && (
          <div className="space-y-5 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[13px] font-bold font-sans text-white">Theme Library</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateThemeModal(true)}
                  className="h-9 flex items-center gap-2 px-4 rounded-full bg-[#5683da] text-white hover:bg-[#5683da]/90 text-[13px] font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="Create a new theme based on the current one"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Theme</span>
                </button>
                <button
                  onClick={() => setThemeImportOpen(!themeImportOpen)}
                  className="h-9 flex items-center gap-2 px-4 rounded-full bg-[#303236] hover:bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] text-[#a9a9aa] hover:text-white text-[13px] transition-all active:scale-95 cursor-pointer"
                  title="Import a theme from JSON"
                >
                  <Upload className="w-4 h-4 text-[#a9a9aa]" />
                  <span>Import JSON</span>
                </button>
              </div>
            </div>

            {themeImportOpen && (
              <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3 animate-fade-in">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Paste theme palette JSON ({'{ name, ...palette }'}):</label>
                <textarea
                  value={themeImportText}
                  onChange={(e) => setThemeImportText(e.target.value)}
                  rows={4}
                  placeholder='{"name":"My Theme","background":"#0b0d12","foreground":"#e2e8f0","cursor":"#3c95f0",...}'
                  className="w-full p-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-xs font-mono text-white placeholder-[#a9a9aa]/40 focus:outline-none focus:border-[#5683da] resize-y"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleImportTheme}
                    disabled={!themeImportText.trim()}
                    className="h-9 px-4 rounded-full bg-[#5683da] text-white hover:bg-[#5683da]/90 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
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
                        ? 'border-2 border-[#5683da] bg-[#303236] shadow-md'
                        : isSelected
                          ? 'border-[#5683da] bg-[#303236]'
                          : 'border-[#4a4b50] bg-[#303236] hover:border-[#5683da]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[13px] font-bold text-white flex items-center gap-1.5">
                        {theme.name}
                        {isCustom && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#090a0c] border border-[#4a4b50] text-[9px] font-medium text-[#5683da] font-mono">custom</span>
                        )}
                      </span>
                      {isActive && <div className="w-2.5 h-2.5 rounded-full bg-[#5683da] shadow-sm" />}
                    </div>
                    <div className="flex gap-1.5 p-2.5 rounded-xl bg-[#090a0c] border border-[#4a4b50]">
                      <div className="w-4 h-4 rounded-lg border border-[#4a4b50]" style={{ backgroundColor: theme.background }} />
                      <div className="w-4 h-4 rounded-lg border border-[#4a4b50]" style={{ backgroundColor: theme.foreground }} />
                      <div className="w-4 h-4 rounded-lg border border-[#4a4b50]" style={{ backgroundColor: theme.cursor }} />
                      <div className="w-4 h-4 rounded-lg border border-[#4a4b50]" style={{ backgroundColor: theme.blue }} />
                      <div className="w-4 h-4 rounded-lg border border-[#4a4b50]" style={{ backgroundColor: theme.green }} />
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      {isCustom ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedThemeId(duplicateTheme(key)); }}
                            className="flex-1 h-8 rounded-full bg-[#090a0c] hover:bg-[#111111] border border-[#4a4b50] text-[11px] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setRenameThemeId(key); }}
                            className="flex-1 h-8 rounded-full bg-[#090a0c] hover:bg-[#111111] border border-[#4a4b50] text-[11px] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
                          >
                            Rename
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleExportTheme(key); }}
                            className="flex-1 h-8 rounded-full bg-[#090a0c] hover:bg-[#111111] border border-[#4a4b50] text-[11px] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
                          >
                            Export
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteThemeId(key); }}
                            className="flex-1 h-8 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-[11px] text-rose-300 transition-all active:scale-95 cursor-pointer"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedThemeId(duplicateTheme(key)); }}
                          className="flex-1 h-8 rounded-full bg-[#090a0c] hover:bg-[#111111] border border-[#4a4b50] text-[11px] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
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
              <div className="p-5 rounded-2xl border border-[#4a4b50] bg-[#303236] space-y-3 animate-fade-in">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-bold text-white">Theme Editor</span>
                  <span className="text-[11px] text-[#a9a9aa] font-mono">{customThemes[selThemeId].name}</span>
                </div>
                <p className="text-[11px] text-[#a9a9aa] mb-3">
                  Live preview active. Click a swatch below to customize palette channels.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {THEME_COLOR_SLOTS.map(([slot, label]) => (
                    <label key={slot} className="flex items-center gap-2.5 p-2 rounded-xl bg-[#090a0c] border border-[#4a4b50] cursor-pointer hover:border-[#5683da] transition-colors">
                      <input
                        type="color"
                        value={toHexColor(customThemes[selThemeId][slot] ?? '')}
                        onChange={(e) => updateThemeColors(selThemeId, { [slot]: e.target.value })}
                        className="w-7 h-7 shrink-0 rounded-lg cursor-pointer bg-transparent border border-[#4a4b50]"
                        aria-label={label}
                      />
                      <span className="text-xs text-white truncate">{label}</span>
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
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Default Shell for New Panes</label>
              <input
                type="text"
                value={defaultShell}
                onChange={(e) => setDefaultShell(e.target.value.trim())}
                placeholder="/bin/zsh (empty = system default)"
                className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white placeholder-[#a9a9aa]/40 focus:outline-none focus:border-[#5683da] font-mono transition-colors"
              />
            </div>

            {/* Default Working Directory Card */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Default Working Directory (CWD)</label>
              <input
                type="text"
                value={defaultCwd}
                onChange={(e) => updateSettings({ defaultCwd: e.target.value.trim() })}
                placeholder="/Users/you/projects (empty = session directory)"
                className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white placeholder-[#a9a9aa]/40 focus:outline-none focus:border-[#5683da] font-mono transition-colors"
              />
            </div>

            {/* Default Shell Arguments Card */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Default Shell Arguments</label>
              <input
                type="text"
                value={shellArgs}
                onChange={(e) => updateSettings({ shellArgs: e.target.value })}
                placeholder="--login (space-separated; empty = none)"
                className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white placeholder-[#a9a9aa]/40 focus:outline-none focus:border-[#5683da] font-mono transition-colors"
              />
            </div>

            {/* Default Shell Environment Card */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Default Shell Environment</label>
              <textarea
                value={shellEnv}
                onChange={(e) => updateSettings({ shellEnv: e.target.value })}
                placeholder={'EDITOR=nvim\nGIT_EDITOR=nvim\nMY_VAR=value'}
                rows={3}
                className="w-full p-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white placeholder-[#a9a9aa]/40 focus:outline-none focus:border-[#5683da] font-mono resize-y"
              />
            </div>

            {/* Scrollback Lines Card */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Scrollback Buffer</label>
                <span className="text-[13px] text-white font-mono">{scrollback.toLocaleString()} lines</span>
              </div>
              <input
                type="number"
                min={scrollbackMin}
                max={scrollbackMax}
                step={500}
                value={scrollback}
                onChange={(e) => setScrollback(Number(e.target.value))}
                className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white focus:outline-none focus:border-[#5683da] font-mono"
              />
            </div>

            {/* Cursor Style Card */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Cursor Style</label>
              <select
                value={cursorStyle}
                onChange={(e) => setCursorStyle(e.target.value as CursorStyle)}
                className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white focus:outline-none focus:border-[#5683da]"
              >
                <option value="block">Block</option>
                <option value="bar">Bar (Beam)</option>
                <option value="underline">Underline</option>
              </select>
            </div>

            {/* Cursor Blinking Card */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white">Cursor Blinking</span>
              </div>
              <ToggleSwitch checked={cursorBlink} onChange={(v) => setCursorBlink(v)} />
            </div>

            {/* Copy on Select Card */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white">Copy on Select</span>
              </div>
              <ToggleSwitch checked={copyOnSelect} onChange={(v) => setCopyOnSelect(v)} />
            </div>

            {/* Minimize to Tray Card */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white">Minimize to Tray</span>
              </div>
              <ToggleSwitch checked={minimizeToTray} onChange={(v) => setMinimizeToTray(v)} />
            </div>

            {/* Startup & Tray Section */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa] block">Startup &amp; System Tray</span>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white">Launch at Login</span>
                </div>
                <ToggleSwitch checked={launchAtLogin} onChange={(v) => updateSettings({ launchAtLogin: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white">Start Maximized</span>
                </div>
                <ToggleSwitch checked={startMaximized} onChange={(v) => updateSettings({ startMaximized: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white">Start Hidden to Tray</span>
                </div>
                <ToggleSwitch checked={startHidden} onChange={(v) => updateSettings({ startHidden: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white">Close to Tray</span>
                </div>
                <ToggleSwitch checked={closeToTray} onChange={(v) => updateSettings({ closeToTray: v })} />
              </div>
            </div>

            {/* Voice-to-Terminal Section */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-bold text-white flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-[#5683da]" />
                    Voice-to-Terminal
                    {modelReady === false && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[9px] font-mono text-amber-400">model downloading</span>
                    )}
                    {modelReady === true && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[9px] font-mono text-[#27c93f]">ready</span>
                    )}
                  </span>
                </div>
                <ToggleSwitch checked={voiceToTerminal} onChange={setVoiceToTerminal} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa] block mb-1.5">Dictation Language</label>
                  <select
                    value={voiceLanguage}
                    onChange={(e) => updateSettings({ voiceLanguage: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white focus:outline-none focus:border-[#5683da]"
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
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa] block mb-1.5">Model Size</label>
                  <select
                    value={voiceModelSize}
                    onChange={(e) => updateSettings({ voiceModelSize: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white focus:outline-none focus:border-[#5683da]"
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
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Silence Timeout</label>
                  <span className="text-[13px] text-white font-mono">{voiceSilenceTimeoutMs} ms</span>
                </div>
                <input
                  type="range"
                  min={voiceSilenceTimeoutMin}
                  max={voiceSilenceTimeoutMax}
                  step={100}
                  value={voiceSilenceTimeoutMs}
                  onChange={(e) => setVoiceSilenceTimeoutMs(Number(e.target.value))}
                  className="w-full accent-[#5683da] bg-[#090a0c] h-2 rounded-full cursor-pointer"
                />
              </div>

              {!micLoading && micDevices.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Microphone Input</label>
                    <button
                      onClick={handleMicTest}
                      disabled={micTesting}
                      className="h-8 flex items-center gap-1.5 px-3 rounded-full bg-[#090a0c] hover:bg-[#111111] border border-[#4a4b50] text-xs text-[#a9a9aa] hover:text-white disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{micTesting ? 'Testing…' : 'Test Mic'}</span>
                    </button>
                  </div>
                  <select
                    value={voiceInputDevice}
                    onChange={(e) => setVoiceInputDevice(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white focus:outline-none focus:border-[#5683da]"
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
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa] block">Terminal Behavior</span>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white">Right-Click Pastes</span>
                </div>
                <ToggleSwitch checked={rightClickPaste} onChange={(v) => updateSettings({ rightClickPaste: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white">Clickable Links</span>
                </div>
                <ToggleSwitch checked={clickableLinks} onChange={(v) => updateSettings({ clickableLinks: v })} />
              </div>

              {clickableLinks && (
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa] block mb-1.5">Link Modifier Key</label>
                  <select
                    value={linkModifier}
                    onChange={(e) => updateSettings({ linkModifier: e.target.value as 'click' | 'meta' | 'ctrl' | 'alt' })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white focus:outline-none focus:border-[#5683da]"
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
                  <span className="block text-[13px] text-white">Terminal Bell</span>
                </div>
                <ToggleSwitch checked={terminalBell} onChange={(v) => updateSettings({ terminalBell: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white">Scroll on Output</span>
                </div>
                <ToggleSwitch checked={scrollOnOutput} onChange={(v) => updateSettings({ scrollOnOutput: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[13px] text-white">Confirm Multi-line Paste</span>
                </div>
                <ToggleSwitch checked={pasteConfirmNewlines} onChange={(v) => updateSettings({ pasteConfirmNewlines: v })} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Terminal Padding</label>
                  <span className="text-[13px] text-white font-mono">{terminalPadding}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={terminalPadding}
                  onChange={(e) => updateSettings({ terminalPadding: Number(e.target.value) })}
                  className="w-full accent-[#5683da] bg-[#090a0c] h-2 rounded-full cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa] block mb-1.5">Word Selection Separators</label>
                <input
                  type="text"
                  value={wordSeparators}
                  onChange={(e) => updateSettings({ wordSeparators: e.target.value })}
                  placeholder=" "
                  className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white font-mono focus:outline-none focus:border-[#5683da]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">IPC Batch Interval</label>
                  <span className="text-[13px] text-white font-mono">{ipcBatchIntervalMs} ms</span>
                </div>
                <input
                  type="number"
                  min={4}
                  max={2000}
                  step={1}
                  value={ipcBatchIntervalMs}
                  onChange={(e) => setIpcBatchIntervalMs(Number(e.target.value))}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white focus:outline-none focus:border-[#5683da] font-mono"
                />
                <div className="flex items-center gap-2 mt-2.5">
                  {[8, 16, 33, 66].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setIpcBatchIntervalMs(preset)}
                      className={`px-3 py-1 rounded-full border text-xs font-mono transition-all active:scale-95 cursor-pointer ${
                        ipcBatchIntervalMs === preset
                          ? 'border-[#5683da] bg-[#5683da] text-white font-bold'
                          : 'border-[#4a4b50] bg-[#090a0c] text-[#a9a9aa] hover:border-[#5683da] hover:text-white'
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
                <span className="text-[13px] font-bold font-sans text-white">Workspaces</span>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-9 flex items-center gap-2 px-4 rounded-full bg-[#5683da] text-white hover:bg-[#5683da]/90 text-[13px] font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
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
                <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[13px] font-bold text-white">Workspace Overrides</span>
                    </div>
                    {hasOverrides && (
                      <button
                        onClick={() => setWorkspaceOverrides(activeWorkspaceId, null)}
                        className="px-3 py-1 rounded-full border border-[#4a4b50] bg-[#090a0c] text-xs text-[#a9a9aa] hover:text-rose-400 hover:border-rose-500/30 transition-all active:scale-95 cursor-pointer"
                      >
                        Clear All Overrides
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa] block mb-1.5">Theme Override</label>
                      <select
                        value={ov.themeName ?? ''}
                        onChange={(e) => setOv({ themeName: e.target.value || undefined })}
                        className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white focus:outline-none focus:border-[#5683da]"
                      >
                        <option value="">— inherit global —</option>
                        {Object.entries(allThemes).map(([key, t]) => (
                          <option key={key} value={key}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa] block mb-1.5">Font Size Override (px)</label>
                      <input
                        type="number"
                        min={fontSizeMin}
                        max={fontSizeMax}
                        value={ov.fontSize ?? ''}
                        onChange={(e) => setOv({ fontSize: e.target.value === '' ? undefined : Number(e.target.value) })}
                        placeholder="inherit"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white focus:outline-none focus:border-[#5683da] font-mono"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa] block mb-1.5">Font Family Override</label>
                      <input
                        type="text"
                        value={ov.fontFamily ?? ''}
                        onChange={(e) => setOv({ fontFamily: e.target.value || undefined })}
                        placeholder="empty = inherit global"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white focus:outline-none focus:border-[#5683da] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa] block mb-1.5">Default Shell Override</label>
                      <input
                        type="text"
                        value={ov.defaultShell ?? ''}
                        onChange={(e) => setOv({ defaultShell: e.target.value.trim() || undefined })}
                        placeholder="empty = inherit"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white focus:outline-none focus:border-[#5683da] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa] block mb-1.5">Default CWD Override</label>
                      <input
                        type="text"
                        value={ov.defaultCwd ?? ''}
                        onChange={(e) => setOv({ defaultCwd: e.target.value.trim() || undefined })}
                        placeholder="empty = inherit"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white focus:outline-none focus:border-[#5683da] font-mono"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Workspaces List Cards */}
            <div className="space-y-2">
              {workspaces.map((ws) => {
                const isEditing = editingWsId === ws.id;
                return (
                  <div
                    key={ws.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                      ws.id === activeWorkspaceId
                        ? 'border-2 border-[#5683da] bg-[#303236] shadow-md'
                        : 'border-[#4a4b50] bg-[#303236] hover:border-[#5683da]'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 mr-3">
                        <input
                          ref={editWsInputRef}
                          type="text"
                          maxLength={32}
                          value={editingWsName}
                          onChange={(e) => setEditingWsName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveWsRename(ws.id);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              isEscapeWsRef.current = true;
                              setEditingWsId(null);
                            }
                          }}
                          onBlur={() => {
                            if (isEscapeWsRef.current) {
                              isEscapeWsRef.current = false;
                              return;
                            }
                            handleSaveWsRename(ws.id);
                          }}
                          className="h-8 px-2.5 rounded-lg bg-[#090a0c] border border-[#5683da] text-[13px] text-white font-medium focus:outline-none flex-1 max-w-sm"
                          placeholder="Workspace name"
                          autoFocus
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSaveWsRename(ws.id)}
                          title="Save Workspace Name"
                          aria-label="Save Workspace Name"
                          className="p-1.5 rounded-full bg-[#5683da] hover:bg-[#5683da]/90 text-white transition-colors cursor-pointer shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-[13px] font-bold text-white flex items-center gap-2">
                          <span>{ws.name}</span>
                          {ws.id === activeWorkspaceId && (
                            <span className="px-2 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-[#5683da]">active</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#a9a9aa] font-mono mt-0.5">ID: {ws.id}</div>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      {!isEditing && ws.id !== activeWorkspaceId && (
                        <button
                          onClick={() => requestSwitchWorkspace(ws.id)}
                          className="h-8 px-3 rounded-full bg-[#5683da] text-white hover:bg-[#5683da]/90 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
                        >
                          Switch
                        </button>
                      )}

                      {!isEditing && (
                        <button
                          onClick={() => {
                            isEscapeWsRef.current = false;
                            setEditingWsId(ws.id);
                            setEditingWsName(ws.name);
                          }}
                          className="p-2 rounded-full bg-[#090a0c] hover:bg-[#111111] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
                          title="Rename"
                          aria-label={`Rename workspace ${ws.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => duplicateWorkspace(ws.id)}
                        className="p-2 rounded-full bg-[#090a0c] hover:bg-[#111111] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
                        title="Duplicate Workspace"
                        aria-label={`Duplicate workspace ${ws.name}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleArchive(ws.id)}
                        className="p-2 rounded-full bg-[#090a0c] hover:bg-[#111111] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
                        title={ws.archived ? 'Unarchive Workspace' : 'Archive Workspace'}
                        aria-label={ws.archived ? `Unarchive workspace ${ws.name}` : `Archive workspace ${ws.name}`}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteWsId(ws.id)}
                        className="p-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition-all active:scale-95 cursor-pointer"
                        title="Delete Workspace"
                        aria-label={`Delete workspace ${ws.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB 5: LIMITS --- */}
        {activeSettingsTab === 'limits' && (
          <div className="space-y-4 max-w-3xl">
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Max Panes Allowed</label>
                <span className="text-[13px] text-white font-mono">{maxPanes} panes</span>
              </div>
              <input
                type="range"
                min={1}
                max={64}
                value={maxPanes}
                onChange={(e) => updateSettings({ maxPanes: Number(e.target.value) })}
                className="w-full accent-[#5683da] bg-[#090a0c] h-2 rounded-full cursor-pointer"
              />
            </div>

            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Minimum Pane Size</label>
                <span className="text-[13px] text-white font-mono">{minPaneSize}px</span>
              </div>
              <input
                type="range"
                min={40}
                max={400}
                step={10}
                value={minPaneSize}
                onChange={(e) => updateSettings({ minPaneSize: Number(e.target.value) })}
                className="w-full accent-[#5683da] bg-[#090a0c] h-2 rounded-full cursor-pointer"
              />
            </div>

            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white">Snap Divider on Release</span>
              </div>
              <ToggleSwitch checked={dividerSnap} onChange={(v) => updateSettings({ dividerSnap: v })} />
            </div>

            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white">Double-Click Divider to Equalize</span>
              </div>
              <ToggleSwitch checked={doubleClickEqualize} onChange={(v) => updateSettings({ doubleClickEqualize: v })} />
            </div>

            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Max WebGL Contexts</label>
                <span className="text-[13px] text-white font-mono">{maxWebglSlots}</span>
              </div>
              <input
                type="range"
                min={1}
                max={64}
                value={maxWebglSlots}
                onChange={(e) => updateSettings({ maxWebglSlots: Number(e.target.value) })}
                className="w-full accent-[#5683da] bg-[#090a0c] h-2 rounded-full cursor-pointer"
              />
            </div>

            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white">Show Cinematic Splash Screen</span>
              </div>
              <ToggleSwitch checked={showSplash} onChange={(v) => updateSettings({ showSplash: v })} />
            </div>

            {/* Confirmations Cards */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa] block">Safety &amp; Confirmations</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  ['paneClose', 'Close pane'],
                  ['quit', 'Quit with running processes'],
                  ['layoutShrink', 'Shrink / reset grid'],
                  ['workspaceDelete', 'Delete workspace'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa] block mb-1.5">{label}</label>
                    <select
                      value={confirmations[key]}
                      onChange={(e) => updateSettings({ confirmations: { ...confirmations, [key]: e.target.value as 'always' | 'never' } })}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white focus:outline-none focus:border-[#5683da]"
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
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Color Scheme (UI Chrome)</label>
              <div className="flex gap-2">
                {(['dark', 'light', 'system'] as ThemeMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => updateSettings({ themeMode: m })}
                    className={`h-10 px-4 rounded-full border text-[13px] font-medium transition-all cursor-pointer ${
                      themeMode === m
                        ? 'border-[#5683da] bg-[#5683da] text-white font-semibold'
                        : 'border-[#4a4b50] bg-[#090a0c] text-[#a9a9aa] hover:text-white hover:bg-[#111111]'
                    }`}
                  >
                    {m === 'dark' ? 'Dark Mode' : m === 'light' ? 'Light Mode' : 'Follow System'}
                  </button>
                ))}
              </div>
            </div>

            {/* Animations Switch */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-white">UI Animations</span>
              </div>
              <ToggleSwitch checked={animationsEnabled} onChange={(v) => updateSettings({ animationsEnabled: v })} />
            </div>

            {/* UI Zoom */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">UI Zoom</label>
                <span className="text-[13px] text-white font-mono">{uiZoom}%</span>
              </div>
              <input
                type="range"
                min={80}
                max={150}
                step={5}
                value={uiZoom}
                onChange={(e) => updateSettings({ uiZoom: Number(e.target.value) })}
                className="w-full accent-[#5683da] bg-[#090a0c] h-2 rounded-full cursor-pointer"
              />
            </div>

            {/* Sidebar Width */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa]">Sidebar Width</label>
                <span className="text-[13px] text-white font-mono">{sidebarWidth}px</span>
              </div>
              <input
                type="range"
                min={160}
                max={480}
                step={8}
                value={sidebarWidth}
                onChange={(e) => updateSettings({ sidebarWidth: Number(e.target.value) })}
                className="w-full accent-[#5683da] bg-[#090a0c] h-2 rounded-full cursor-pointer"
              />
            </div>

            {/* Status Bar Badges */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#a9a9aa] block">Status Bar Badges</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  ['workspace', 'Workspace Name'],
                  ['font', 'Font Size Display'],
                  ['gpu', 'GPU / CPU Status'],
                  ['panes', 'Active Pane Count'],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-[#090a0c] border border-[#4a4b50]">
                    <span className="text-[13px] text-white">{label}</span>
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
                <span className="text-[13px] font-bold font-sans text-white">Custom Keybindings</span>
              </div>
              <button
                onClick={() => setConfirmResetKeybindings(true)}
                className="h-9 flex items-center gap-2 px-4 rounded-full bg-[#303236] hover:bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] text-[13px] text-[#a9a9aa] hover:text-white transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#a9a9aa]" />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="space-y-2">
              {Object.values(keybindings).map((kb) => (
                <div
                  key={kb.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
                    recordingId === kb.id
                      ? 'border-[#5683da] bg-[#303236] text-white shadow-md'
                      : 'border-[#4a4b50] bg-[#303236] hover:border-[#5683da]'
                  }`}
                >
                  <div>
                    <div className="font-sans font-bold text-white text-[13px]">{kb.label}</div>
                    <div className="text-[11px] text-[#a9a9aa] font-mono mt-0.5">{kb.id}</div>
                  </div>

                  <button
                    onClick={() => setRecordingId(recordingId === kb.id ? null : kb.id)}
                    className={`h-9 px-3.5 rounded-full font-mono text-xs border transition-all cursor-pointer ${
                      recordingId === kb.id
                        ? 'border-[#5683da] bg-[#5683da] text-white font-bold animate-pulse'
                        : 'border-[#4a4b50] bg-[#090a0c] text-white hover:border-[#5683da]'
                    }`}
                  >
                    {recordingId === kb.id ? 'Press keys…' : kb.currentKey}
                  </button>
                </div>
              ))}
            </div>

            {/* Macros Studio */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-bold text-white">Macros</span>
                </div>
                <button
                  onClick={addMacro}
                  className="h-9 flex items-center gap-1.5 px-3.5 rounded-full bg-[#5683da] text-white hover:bg-[#5683da]/90 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Macro</span>
                </button>
              </div>

              <div className="space-y-3">
                {macros.map((macro) => (
                  <div key={macro.id} className="p-4 rounded-xl border border-[#4a4b50] bg-[#090a0c] space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={macro.name}
                        onChange={(e) => updateMacro(macro.id, { name: e.target.value.slice(0, 60) })}
                        placeholder="Macro name"
                        className="flex-1 h-9 px-3 rounded-lg bg-[#111111] border border-[#4a4b50] text-xs text-white focus:outline-none focus:border-[#5683da]"
                      />
                      <input
                        type="text"
                        value={macro.keybinding}
                        onChange={(e) => updateMacro(macro.id, { keybinding: e.target.value.trim() })}
                        placeholder="Keybinding (Mod+Alt+1)"
                        className="w-36 h-9 px-3 font-mono rounded-lg bg-[#111111] border border-[#4a4b50] text-xs text-white focus:outline-none focus:border-[#5683da]"
                      />
                      <button
                        onClick={() => runMacro(macro)}
                        className="p-2 rounded-full bg-[#090a0c] hover:bg-[#111111] border border-[#4a4b50] text-[#5683da] hover:text-white transition-colors cursor-pointer"
                        title="Run macro"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMacro(macro.id)}
                        className="p-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
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
                            className="flex-1 h-8 px-2.5 rounded-lg bg-[#111111] border border-[#4a4b50] text-xs text-white focus:outline-none"
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
                              className="w-20 h-8 px-2 rounded-lg bg-[#111111] border border-[#4a4b50] text-xs text-white focus:outline-none font-mono"
                            />
                          )}
                          <button
                            onClick={() => removeMacroStep(macro.id, si)}
                            className="p-1.5 rounded-full hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addMacroStep(macro.id)}
                      className="text-xs text-[#a9a9aa] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
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
              <span className="text-[13px] font-bold font-sans text-white">Settings Profiles</span>
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
                className="flex-1 h-10 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white placeholder-[#a9a9aa]/40 focus:outline-none focus:border-[#5683da]"
              />
              <button
                onClick={saveProfile}
                className="h-10 flex items-center gap-2 px-4 rounded-full bg-[#5683da] text-white hover:bg-[#5683da]/90 text-[13px] font-semibold transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>

            <div className="space-y-2">
              {listSettingsProfiles().map((name) => (
                <div key={name} className="p-4 rounded-2xl border border-[#4a4b50] bg-[#303236] flex items-center justify-between">
                  <span className="text-[13px] font-bold text-white">{name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (loadSettingsProfile(name)) {
                          addToast({ type: 'success', title: 'Profile applied', description: `"${name}" is now active.` });
                        } else {
                          addToast({ type: 'error', title: 'Could not apply profile', description: `"${name}" appears to be corrupt.` });
                        }
                      }}
                      className="h-8 px-3 rounded-full bg-[#5683da] text-white hover:bg-[#5683da]/90 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => deleteSettingsProfile(name)}
                      className="p-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* MCP HTTP Endpoint */}
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#5683da]" />
                <span className="text-[13px] font-bold text-white">MCP / HTTP Endpoint</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-xs font-mono text-white truncate">
                  http://127.0.0.1:{httpPort ?? '8792'}/panes
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`http://127.0.0.1:${httpPort ?? 8792}/panes`);
                    addToast({ type: 'success', title: 'Endpoint copied' });
                  }}
                  className="h-10 px-3.5 rounded-full bg-[#090a0c] hover:bg-[#111111] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
                  title="Copy endpoint URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-8 py-3.5 border-t border-[#4a4b50] bg-[#111111] shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="h-9 flex items-center gap-2 px-4 rounded-full bg-[#303236] hover:bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] text-[#a9a9aa] hover:text-white text-[13px] font-medium transition-all active:scale-95 cursor-pointer"
            title="Download settings as JSON"
          >
            <Download className="w-4 h-4 text-[#a9a9aa]" />
            <span>Export</span>
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            className="h-9 flex items-center gap-2 px-4 rounded-full bg-[#303236] hover:bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] text-[#a9a9aa] hover:text-white text-[13px] font-medium transition-all active:scale-95 cursor-pointer"
            title="Import settings from JSON"
          >
            <Upload className="w-4 h-4 text-[#a9a9aa]" />
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
          className="h-9 flex items-center gap-2 px-4 rounded-full bg-[#303236] hover:bg-rose-500/10 border border-[#4a4b50] hover:border-rose-500/30 text-[#a9a9aa] hover:text-rose-400 text-[13px] font-medium transition-all active:scale-95 cursor-pointer"
          title="Reset all settings to defaults"
        >
          <RotateCcw className="w-4 h-4 text-[#a9a9aa]" />
          <span>Reset All</span>
        </button>
      </div>

      {showCreateModal && (
        <InputModal
          title="Create New Workspace"
          placeholder={`Workspace ${workspaces.length + 1}`}
          initialValue={`Workspace ${workspaces.length + 1}`}
          onSave={(name) => requestCreateWorkspace(name.slice(0, useSettingsStore.getState().workspaceNameMaxLength))}
          onClose={() => setShowCreateModal(false)}
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
          confirmLabel={workspaces.length === 1 ? 'Reset Workspace' : 'Delete Workspace'}
          isDanger={true}
          onConfirm={() => {
            const name = deleteTarget.name;
            deleteWorkspace(deleteWsId);
            setDeleteWsId(null);
            addToast({
              type: 'info',
              title: workspaces.length === 1 ? 'Workspace Reset' : 'Workspace Deleted',
              description: `"${name}" was ${workspaces.length === 1 ? 'reset' : 'deleted'}.`,
            });
          }}
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
          message="Resets all preferences — font, theme, terminal options, and shortcuts — to defaults. Cannot be undone."
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
          message="All custom shortcuts will be restored to defaults. Cannot be undone."
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
          message="Overwrites your current settings. A backup is saved automatically. Continue?"
          confirmLabel="Import & Overwrite"
          isDanger={true}
          onConfirm={confirmImport}
          onClose={() => setPendingImportFile(null)}
        />
      )}
    </div>
  );
};
