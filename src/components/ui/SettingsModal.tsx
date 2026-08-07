import React, { useState, useEffect, useRef } from 'react';
import { X, Type, Palette, Terminal as TerminalIcon, Layout, Keyboard as KeyboardIcon, Plus, Trash2, Edit2, RotateCcw, Download, Upload, Mic, Copy, Sliders, UserRound, Play, Globe, Archive } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore, THEMES, CursorStyle, Macro, MacroStep, ThemeMode } from '@/store/useSettingsStore';
import { TerminalTheme } from '@/types/terminal';
import { useWorkspaceStore, WorkspaceOverrides } from '@/store/useWorkspaceStore';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';
import { eventToAccelerator } from '@/lib/commandUtils';
import { MACRO_ACTIONS, getMacroAction, runMacro } from '@/lib/macros';
import { getHttpPort } from '@/lib/tauri';
import { InputModal } from './InputModal';
import { ConfirmModal } from './ConfirmModal';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { voiceModelStatus, listenModelProgress } from '@/lib/tauri';
import { invoke } from '@tauri-apps/api/core';

/** Styled toggle switch (gap 13) — replaces raw checkboxes for prominent toggles. */
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-bright/60 ${
      checked ? 'bg-forest' : 'bg-white/15 hover:bg-white/20'
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

/** Color inputs require #rrggbb, but built-in palettes use rgba() for the
 *  selection swatch (e.g. 'rgba(60, 149, 240, 0.3)') — a custom theme copied
 *  from one would hand the <input type="color"> an invalid value. Sanitize:
 *  hex passes through, anything else falls back to a neutral swatch. */
function toHexColor(value: string): string {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000';
}

/** Palette slots editable in the custom-theme color editor (customization
 *  audit C1). Every value is a CSS color string. */
/** Drop empty/undefined entries so a cleared override field truly means
 *  "inherit global" (customization audit C12) — an object of only empty
 *  strings would otherwise be persisted as a phantom override. */
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

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, toggleSettings } = useUIStore();
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
    // Customization audit: P0 limits + appearance settings.
    maxPanes,
    minPaneSize,
    dividerSnap,
    snapEpsilon,
    doubleClickEqualize,
    fontSizeMin,
    fontSizeMax,
    scrollbackMax,
    terminalOpacityMin,
    toastMaxCount,
    toastDefaultDurationMs,
    autosaveIntervalMs,
    showSplash,
    hintDurationMs,
    confirmations,
    uiAccentColor,
    animationsEnabled,
    uiZoom,
    compactMode,
    hideStatusBar,
    hideHeader,
    sidebarWidth,
    statusBarBadges,
    // Customization audit: P0 bounds + P1 terminal behavior + C1 theme manager.
    lineHeightMin,
    lineHeightMax,
    scrollbackMin,
    voiceSilenceTimeoutMin,
    voiceSilenceTimeoutMax,
    paletteRecentsMax,
    rightClickPaste,
    clickableLinks,
    linkModifier,
    terminalBell,
    scrollOnOutput,
    wordSeparators,
    pasteConfirmNewlines,
    terminalPadding,
    cursorWidth,
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
    // Customization audit C3/C22/S1: chrome mode, macros, profiles.
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

  const [activeTab, setActiveTab] = useState<'font' | 'theme' | 'terminal' | 'workspaces' | 'limits' | 'appearance' | 'keyboard' | 'profiles'>('font');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renameWsId, setRenameWsId] = useState<string | null>(null);
  const [deleteWsId, setDeleteWsId] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  // UX audit P0 #2: destructive resets confirm first.
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [confirmResetKeybindings, setConfirmResetKeybindings] = useState(false);
  // UX audit P0 #3: importing settings confirms (it overwrites everything).
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  // UX audit P3 #29: quick microphone check (level meter) in Settings.
  const [micTesting, setMicTesting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useFocusTrap<HTMLDivElement>(isSettingsOpen);
  // Customization audit S1: settings-profile draft name + MCP endpoint port.
  const [profileName, setProfileName] = useState('');
  const [httpPort, setHttpPort] = useState<number | null>(null);
  const [modelReady, setModelReady] = useState<boolean | null>(null);
  const [micDevices, setMicDevices] = useState<string[]>([]);
  const [micLoading, setMicLoading] = useState(false);
  // Customization audit C1: theme manager state.
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [showCreateThemeModal, setShowCreateThemeModal] = useState(false);
  const [renameThemeId, setRenameThemeId] = useState<string | null>(null);
  const [confirmDeleteThemeId, setConfirmDeleteThemeId] = useState<string | null>(null);
  const [themeImportOpen, setThemeImportOpen] = useState(false);
  const [themeImportText, setThemeImportText] = useState('');

  // Customization audit S8: fetch the MCP/HTTP endpoint port once.
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

  // Customization audit C22: macro CRUD helpers.
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

  // Customization audit S1: save the current settings as a named profile.
  const saveProfile = () => {
    if (saveSettingsProfile(profileName)) {
      addToast({ type: 'success', title: 'Profile saved', description: `"${profileName.trim()}" is ready to apply anytime.` });
      setProfileName('');
    } else {
      addToast({ type: 'error', title: 'Could not save profile', description: 'Enter a profile name first.' });
    }
  };

  // Capture the new shortcut while a binding is in "recording" mode
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

  // UX audit P0 #3: import is now a CONFIRMED two-step flow. Selecting a file
  // only stages it; the confirm dialog explains the overwrite and backs up the
  // current settings first (so the user can restore if the import was wrong).
  const confirmImport = async () => {
    if (!pendingImportFile) return;
    try {
      localStorage.setItem('vibegrid_settings_backup_v1', exportSettings());
    } catch (e) {
      // backup is best-effort
    }
    await applyImport(pendingImportFile);
    setPendingImportFile(null);
  };

  // Esc closes the modal (unless a keybinding is being recorded)
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !recordingId) toggleSettings();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSettingsOpen, toggleSettings, recordingId]);

  // Gap 17: show whether the Whisper model is downloaded (badge on the Terminal
  // tab). Subscribes to download progress too, so the badge flips to "ready" the
  // moment a background download completes while Settings is open.
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

  // Gap 14: enumerate microphones once when the modal opens so the user can pick one.
  useEffect(() => {
    if (!isSettingsOpen) return;
    let cancelled = false;
    setMicLoading(true);
    invoke<string[]>('voice_list_input_devices')
      .then((devices) => {
        if (!cancelled) setMicDevices(devices);
      })
      .catch((e) => {
        // Not supported in web preview or this build — keep the dropdown hidden.
        console.warn('[VibeGrid] Could not list input devices:', e);
      })
      .finally(() => {
        if (!cancelled) setMicLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSettingsOpen]);

  // UX audit P0 #3: import is a two-step flow — pick a file, then CONFIRM
  // (it overwrites all current settings). Before applying, snapshot the current
  // settings to a backup key so the user can restore if the import was wrong.
  const applyImport = async (file: File) => {
    const text = await file.text();
    const ok = importSettings(text);
    addToast(
      ok
        ? { type: 'success', title: 'Settings imported', description: 'Your preferences were restored.' }
        : { type: 'error', title: 'Invalid settings file', description: 'Could not parse the JSON you selected.' }
    );
  };

  // UX audit P3 #29: quick mic check — record for ~1.6 s, watch the live level
  // (the Rust auto-stop watcher streams it even without committing a
  // transcript), then CANCEL so the test never inserts anything anywhere.
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


  // Customization audit C1: download a single theme as JSON.
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

  // Customization audit C1: import a single theme pasted as JSON.
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

  // Customization audit C1: full selectable theme universe + the theme whose
  // editor/actions are shown (follows the active theme until the user picks one).
  const allThemes = { ...THEMES, ...customThemes };
  const selThemeId = selectedThemeId ?? themeName;

  const renameTarget = workspaces.find((w) => w.id === renameWsId);
  const deleteTarget = workspaces.find((w) => w.id === deleteWsId);
  // Workspace isolation: deleting a workspace terminates its still-running
  // terminals — surface that in the confirmation instead of hiding it.
  const deleteRunningCount = deleteTarget
    ? (deleteTarget.id === activeWorkspaceId
        ? getTerminalNodes(usePaneStore.getState().root)
        : getTerminalNodes(deleteTarget.layout)
      ).filter((t) => t.paneId).length
    : 0;

  return (
    <div
      onClick={toggleSettings}
      role="dialog"
      aria-modal="true"
      aria-label="VibeGrid settings"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-zinc-900/95 border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <h2 className="text-xs font-bold font-space text-white/90 uppercase tracking-wider">VibeGrid Settings</h2>
          <button
            onClick={toggleSettings}
            aria-label="Close settings"
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] bg-black/40 px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('font')}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'font'
                ? 'border-white text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span className="font-space font-bold normal-case tracking-tight">Font &amp; Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'theme'
                ? 'border-white text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="font-space font-bold normal-case tracking-tight">Themes</span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'terminal'
                ? 'border-white text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span className="font-space font-bold normal-case tracking-tight">Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('workspaces')}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'workspaces'
                ? 'border-white text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span className="font-space font-bold normal-case tracking-tight">Workspaces</span>
          </button>

          <button
            onClick={() => setActiveTab('limits')}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'limits'
                ? 'border-white text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="font-space font-bold normal-case tracking-tight">Limits</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'appearance'
                ? 'border-white text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="font-space font-bold normal-case tracking-tight">Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('keyboard')}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'keyboard'
                ? 'border-white text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <KeyboardIcon className="w-3.5 h-3.5" />
            <span className="font-space font-bold normal-case tracking-tight">Keybindings</span>
          </button>

          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-4 py-3 text-xs font-mono uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'profiles'
                ? 'border-white text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <UserRound className="w-3.5 h-3.5" />
            <span className="font-space font-bold normal-case tracking-tight">Profiles</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'font' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">Font Family</label>
                {/* Customization audit C4: free-text font stack with quick picks. */}
                <input
                  list="vg-font-quickpicks"
                  type="text"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  placeholder="e.g. 'Fira Code', monospace"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-forest-bright font-mono"
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
                <span className="block text-[10px] text-white/40 mt-0.5">Any installed font family or CSS stack works — type it, or pick a quick pick.</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">Font Size ({fontSize}px)</label>
                </div>
                <input
                  type="range"
                  min={fontSizeMin}
                  max={fontSizeMax}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-white/70">Font Ligatures</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Fira Code / JetBrains Mono ligatures (&gt;=, =&gt;, -&gt;)</span>
                </div>
                <input
                  type="checkbox"
                  checked={fontLigatures}
                  onChange={(e) => setFontLigatures(e.target.checked)}
                  className="w-4 h-4 accent-forest-bright rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">Line Height ({lineHeight.toFixed(2)})</label>
                </div>
                <input
                  type="range"
                  min={lineHeightMin}
                  max={lineHeightMax}
                  step={0.05}
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">Terminal Opacity ({Math.round(terminalOpacity * 100)}%)</label>
                </div>
                <input
                  type="range"
                  min={terminalOpacityMin}
                  max={1}
                  step={0.05}
                  value={terminalOpacity}
                  onChange={(e) => setTerminalOpacity(Number(e.target.value))}
                  className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-space text-white/90 uppercase tracking-wider">Themes ({Object.keys(allThemes).length})</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreateThemeModal(true)}
                    className="px-3.5 py-1.5 rounded-2xl bg-white text-black hover:bg-zinc-200 text-xs font-extrabold font-space flex items-center gap-1.5 transition-colors"
                    title="Create a new theme based on the current one"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create from current</span>
                  </button>
                  <button
                    onClick={() => setThemeImportOpen(!themeImportOpen)}
                    className="px-3.5 py-1.5 rounded-2xl border border-white/10 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:bg-white/5 flex items-center gap-1.5 transition-colors"
                    title="Import a theme from JSON"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import JSON</span>
                  </button>
                </div>
              </div>

              {themeImportOpen && (
                <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-3 animate-fade-in">
                  <label className="block text-[10px] font-mono text-zinc-400">Paste a theme palette as JSON (a raw palette object, or {'{ name, ...palette }'}):</label>
                  <textarea
                    value={themeImportText}
                    onChange={(e) => setThemeImportText(e.target.value)}
                    rows={4}
                    placeholder='{"name":"My Theme","background":"#0b0d12","foreground":"#e2e8f0","cursor":"#3c95f0",...}'
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/[0.08] text-xs font-mono text-white/90 placeholder-white/25 focus:outline-none focus:border-white/30 resize-y"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleImportTheme}
                      disabled={!themeImportText.trim()}
                      className="px-4 py-2 rounded-2xl bg-white text-black hover:bg-zinc-200 disabled:opacity-40 text-xs font-extrabold font-space transition-colors"
                    >
                      Import Theme
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
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
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isActive
                          ? 'border-forest-bright bg-forest/10'
                          : isSelected
                            ? 'border-forest/60 bg-white/[0.03]'
                            : 'border-white/10 bg-black/40 hover:border-forest/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white/85 flex items-center gap-1.5">
                          {theme.name}
                          {isCustom && (
                            <span className="px-1 py-0.5 rounded bg-forest/15 border border-forest/30 text-[8px] font-medium text-forest-light">custom</span>
                          )}
                        </span>
                        {isActive && <div className="w-2 h-2 rounded-full bg-forest-bright" />}
                      </div>
                      <div className="flex gap-1.5 p-2 rounded bg-black/40">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.background }} />
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.foreground }} />
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.cursor }} />
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.blue }} />
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.green }} />
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        {isCustom ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedThemeId(duplicateTheme(key)); }}
                              className="flex-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-white/65 transition-colors"
                            >
                              Duplicate
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setRenameThemeId(key); }}
                              className="flex-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-white/65 transition-colors"
                            >
                              Rename
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleExportTheme(key); }}
                              className="flex-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-white/65 transition-colors"
                            >
                              Export
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteThemeId(key); }}
                              className="flex-1 px-2 py-1 rounded bg-rose-950/50 hover:bg-rose-950/80 text-[10px] text-rose-300 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedThemeId(duplicateTheme(key)); }}
                            className="flex-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-white/65 transition-colors"
                          >
                            Duplicate
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Customization audit C1: live color editor for the selected custom theme */}
              {selThemeId && selThemeId in customThemes && (
                <div className="rounded-lg border border-forest/25 bg-black/40 p-4 animate-fade-in">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Theme Editor</span>
                    <span className="text-[10px] text-white/40">{customThemes[selThemeId].name}</span>
                  </div>
                  <p className="text-[10px] text-white/40 mb-3">
                    Editing updates the terminal live. Click a swatch to pick a color.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                    {THEME_COLOR_SLOTS.map(([slot, label]) => (
                      <label key={slot} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="color"
                          value={toHexColor(customThemes[selThemeId][slot] ?? '')}
                          onChange={(e) => updateThemeColors(selThemeId, { [slot]: e.target.value })}
                          className="w-7 h-7 shrink-0 rounded cursor-pointer bg-transparent border border-white/10"
                          aria-label={label}
                        />
                        <span className="text-[10px] text-white/60 truncate">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="space-y-5">
              {/* UX audit P3 #28: global default shell for new panes (per-pane
                  overrides still win). Empty = system default. */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">Default Shell for New Panes</label>
                <input
                  type="text"
                  value={defaultShell}
                  onChange={(e) => setDefaultShell(e.target.value.trim())}
                  placeholder="/bin/zsh (empty = system default)"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-forest-bright"
                />
                <span className="block text-[10px] text-white/40 mt-0.5">Used for new panes unless a pane has its own shell override (right-click → Set Shell).</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">Default Working Directory for New Panes</label>
                <input
                  type="text"
                  value={defaultCwd}
                  onChange={(e) => updateSettings({ defaultCwd: e.target.value.trim() })}
                  placeholder="/Users/you/projects (empty = session directory)"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-forest-bright font-mono"
                />
                <span className="block text-[10px] text-white/40 mt-0.5">New panes open here unless the pane you split already has its own working directory.</span>
              </div>

              {/* Customization audit C11: startup args + env for the default shell. */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">Default Shell Arguments</label>
                <input
                  type="text"
                  value={shellArgs}
                  onChange={(e) => updateSettings({ shellArgs: e.target.value })}
                  placeholder="--login (space-separated; empty = none)"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-forest-bright font-mono"
                />
                <span className="block text-[10px] text-white/40 mt-0.5">Passed to the default shell on every new pane. Skipped when a pane overrides the shell (right-click → Set Shell).</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">Default Shell Environment</label>
                <textarea
                  value={shellEnv}
                  onChange={(e) => updateSettings({ shellEnv: e.target.value })}
                  placeholder={'EDITOR=nvim\nGIT_EDITOR=nvim\nMY_VAR=value'}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-forest-bright font-mono resize-y"
                />
                <span className="block text-[10px] text-white/40 mt-0.5">One KEY=VALUE per line. Merged into every new pane; built-in TERM/COLORTERM/LANG/VIBEGRID always win.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">Scrollback Lines ({scrollback.toLocaleString()})</label>
                <input
                  type="number"
                  min={scrollbackMin}
                  max={scrollbackMax}
                  step={500}
                  value={scrollback}
                  onChange={(e) => setScrollback(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">Cursor Style</label>
                <select
                  value={cursorStyle}
                  onChange={(e) => setCursorStyle(e.target.value as CursorStyle)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright"
                >
                  <option value="block">Block</option>
                  <option value="bar">Bar (Beam)</option>
                  <option value="underline">Underline</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">Cursor Blinking</span>
                <input
                  type="checkbox"
                  checked={cursorBlink}
                  onChange={(e) => setCursorBlink(e.target.checked)}
                  className="w-4 h-4 accent-forest-bright rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white/70">Copy on Select</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Automatically copy text to the clipboard when you select it with the mouse.</span>
                </div>
                <input
                  type="checkbox"
                  checked={copyOnSelect}
                  onChange={(e) => setCopyOnSelect(e.target.checked)}
                  className="w-4 h-4 accent-forest-bright rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white/70">Minimize to Tray</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Closing the window hides VibeGrid to the system tray instead of quitting. Use the tray icon to show it again.</span>
                </div>
                <input
                  type="checkbox"
                  checked={minimizeToTray}
                  onChange={(e) => setMinimizeToTray(e.target.checked)}
                  className="w-4 h-4 accent-forest-bright rounded cursor-pointer"
                />
              </div>

              <div className="border-t border-white/[0.06] pt-4">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Startup &amp; Tray</span>
                <div className="space-y-4 mt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white/70">Launch at login</span>
                      <span className="block text-[10px] text-white/40 mt-0.5">Start VibeGrid automatically when you log in (system LaunchAgent / autostart entry).</span>
                    </div>
                    <ToggleSwitch checked={launchAtLogin} onChange={(v) => updateSettings({ launchAtLogin: v })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white/70">Start maximized</span>
                      <span className="block text-[10px] text-white/40 mt-0.5">Open the window maximized on launch.</span>
                    </div>
                    <ToggleSwitch checked={startMaximized} onChange={(v) => updateSettings({ startMaximized: v })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white/70">Start hidden to tray</span>
                      <span className="block text-[10px] text-white/40 mt-0.5">Launch into the system tray without showing the window.</span>
                    </div>
                    <ToggleSwitch checked={startHidden} onChange={(v) => updateSettings({ startHidden: v })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white/70">Close to tray</span>
                      <span className="block text-[10px] text-white/40 mt-0.5">Close button hides to the tray instead of quitting (same as Minimize to Tray).</span>
                    </div>
                    <ToggleSwitch checked={closeToTray} onChange={(v) => updateSettings({ closeToTray: v })} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-forest-bright" />
                    Voice-to-Terminal
                    {/* Gap 17: model-downloaded badge */}
                    {modelReady === false && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[9px] font-medium text-amber-400">model not downloaded</span>
                    )}
                    {modelReady === true && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-forest/15 border border-forest/30 text-[9px] font-medium text-forest-light">model ready</span>
                    )}
                  </span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Dictate into the focused pane with Cmd/Ctrl+Shift+V. Audio is transcribed locally with the Whisper model — nothing leaves your machine.</span>
                </div>
                <ToggleSwitch checked={voiceToTerminal} onChange={setVoiceToTerminal} />
              </div>

              {/* Gap 10: silence timeout — how long to wait after you stop speaking before auto-inserting */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Dictation language</label>
                  <select
                    value={voiceLanguage}
                    onChange={(e) => updateSettings({ voiceLanguage: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright"
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
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Model size</label>
                  <select
                    value={voiceModelSize}
                    onChange={(e) => updateSettings({ voiceModelSize: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright"
                  >
                    <option value="tiny">Tiny (~75 MB) — fastest</option>
                    <option value="base">Base (~142 MB) — balanced</option>
                    <option value="small">Small (~466 MB) — accurate</option>
                    <option value="medium">Medium (~1.5 GB) — most accurate</option>
                  </select>
                  <span className="block text-[10px] text-white/40 mt-1">Changing the model downloads it on your next dictation. Non-English / auto-detect uses the multilingual model.</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">Auto-stop after silence ({voiceSilenceTimeoutMs} ms)</label>
                </div>
                <input
                  type="range"
                  min={voiceSilenceTimeoutMin}
                  max={voiceSilenceTimeoutMax}
                  step={100}
                  value={voiceSilenceTimeoutMs}
                  onChange={(e) => setVoiceSilenceTimeoutMs(Number(e.target.value))}
                  className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                />
                <span className="block text-[10px] text-white/40 mt-0.5">Lower = snappier dictation, higher = safer for natural pauses.</span>
              </div>

              {/* Gap 14: microphone selection + UX audit P3 #29 mic test */}
              {!micLoading && micDevices.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-white/70">Microphone</label>
                    <button
                      onClick={handleMicTest}
                      disabled={micTesting}
                      title="Record for 1.6s and check the input level"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white text-black hover:bg-zinc-200 text-xs font-extrabold font-space disabled:opacity-50 transition-colors"
                    >
                      <Mic className="w-3 h-3 text-black" />
                      {micTesting ? 'Listening…' : 'Test Microphone'}
                    </button>
                  </div>
                  <select
                    value={voiceInputDevice}
                    onChange={(e) => setVoiceInputDevice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright"
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
              <p className="text-[10px] text-white/35 mt-1.5 leading-relaxed">
                On first dictation, VibeGrid downloads the local Whisper model (~142 MB) into your app data folder.
                Press Cmd/Ctrl+Shift+V to start listening — speak, then press Enter to insert it in the focused pane,
                Esc to cancel, or just stop talking and it auto-inserts after a short pause. You run the command yourself.
              </p>

              <div className="border-t border-white/[0.06] pt-4">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Terminal Behavior</span>
                <div className="space-y-4 mt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white/70">Right-click pastes</span>
                      <span className="block text-[10px] text-white/40 mt-0.5">Paste the clipboard on right-click instead of opening the context menu (tmux-style).</span>
                    </div>
                    <ToggleSwitch checked={rightClickPaste} onChange={(v) => updateSettings({ rightClickPaste: v })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white/70">Clickable links</span>
                      <span className="block text-[10px] text-white/40 mt-0.5">Open URLs with a click (optionally plus a modifier key).</span>
                    </div>
                    <ToggleSwitch checked={clickableLinks} onChange={(v) => updateSettings({ clickableLinks: v })} />
                  </div>

                  {clickableLinks && (
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5">Link modifier</label>
                      <select
                        value={linkModifier}
                        onChange={(e) => updateSettings({ linkModifier: e.target.value as 'click' | 'meta' | 'ctrl' | 'alt' })}
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright"
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
                      <span className="text-xs font-semibold text-white/70">Terminal bell sound</span>
                      <span className="block text-[10px] text-white/40 mt-0.5">Play a beep when a program rings the terminal bell.</span>
                    </div>
                    <ToggleSwitch checked={terminalBell} onChange={(v) => updateSettings({ terminalBell: v })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white/70">Scroll to bottom on output</span>
                      <span className="block text-[10px] text-white/40 mt-0.5">Auto-scroll when the shell emits output (classic terminal behavior).</span>
                    </div>
                    <ToggleSwitch checked={scrollOnOutput} onChange={(v) => updateSettings({ scrollOnOutput: v })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white/70">Confirm multi-line paste</span>
                      <span className="block text-[10px] text-white/40 mt-0.5">Ask before pasting clipboard content that contains line breaks.</span>
                    </div>
                    <ToggleSwitch checked={pasteConfirmNewlines} onChange={(v) => updateSettings({ pasteConfirmNewlines: v })} />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-white/70">Terminal padding ({terminalPadding}px)</label>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      step={1}
                      value={terminalPadding}
                      onChange={(e) => updateSettings({ terminalPadding: Number(e.target.value) })}
                      className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">Word selection separators</label>
                    <input
                      type="text"
                      value={wordSeparators}
                      onChange={(e) => updateSettings({ wordSeparators: e.target.value })}
                      placeholder=" "
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 font-mono placeholder-white/30 focus:outline-none focus:border-forest-bright"
                    />
                    <span className="block text-[10px] text-white/40 mt-0.5">Characters treated as word boundaries when double-clicking to select text.</span>
                  </div>
                </div>
              </div>

              {/* Customization audit L7: free-form IPC interval (any value in
                  4–2000 ms, not just the four presets) with quick-pick chips. */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">IPC Batch Interval ({ipcBatchIntervalMs} ms)</label>
                <input
                  type="number"
                  min={4}
                  max={2000}
                  step={1}
                  value={ipcBatchIntervalMs}
                  onChange={(e) => setIpcBatchIntervalMs(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright"
                />
                <div className="flex items-center gap-1.5 mt-2">
                  {[8, 16, 33, 66].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setIpcBatchIntervalMs(preset)}
                      className={`px-2 py-1 rounded-md border text-[10px] font-mono transition-colors ${
                        ipcBatchIntervalMs === preset
                          ? 'border-forest-bright bg-forest/15 text-forest-light'
                          : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-forest/40 hover:text-white/80'
                      }`}
                    >
                      {preset} ms
                    </button>
                  ))}
                  <span className="text-[10px] text-white/35 ml-1">4–2000 ms · lower = faster echo, higher CPU</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workspaces' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-space text-white/90 uppercase tracking-wider">Active Workspaces ({workspaces.length})</span>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-2xl bg-white text-black hover:bg-zinc-200 text-xs font-extrabold font-space flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>

              {/* Customization audit C12: per-workspace settings overrides for the
                  ACTIVE workspace. Fields fall back to the global settings when
                  left empty; the object is persisted with the workspace file. */}
              {(() => {
                const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
                const ov = activeWs?.overrides ?? {};
                const hasOverrides = Object.keys(ov).length > 0;
                const setOv = (patch: WorkspaceOverrides) =>
                  setWorkspaceOverrides(activeWorkspaceId, cleanOverrides({ ...ov, ...patch }));
                return (
                  <div className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Workspace Overrides</span>
                        <span className="block text-[10px] text-white/40 mt-0.5">
                          Terminal settings for “{activeWs?.name ?? 'this workspace'}” only — themes, font, shell and cwd. Empty fields inherit the global settings.
                        </span>
                      </div>
                      {hasOverrides && (
                        <button
                          onClick={() => setWorkspaceOverrides(activeWorkspaceId, null)}
                          className="shrink-0 px-2 py-1 rounded-md border border-white/10 text-[10px] text-white/50 hover:border-rose-500/40 hover:text-rose-300 transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-white/50 mb-1">Theme (workspace)</label>
                        <select
                          value={ov.themeName ?? ''}
                          onChange={(e) => setOv({ themeName: e.target.value || undefined })}
                          className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright"
                        >
                          <option value="">— inherit global —</option>
                          {Object.entries(allThemes).map(([key, t]) => (
                            <option key={key} value={key}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-white/50 mb-1">Font Size (px, workspace)</label>
                        <input
                          type="number"
                          min={fontSizeMin}
                          max={fontSizeMax}
                          value={ov.fontSize ?? ''}
                          onChange={(e) => setOv({ fontSize: e.target.value === '' ? undefined : Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-white/50 mb-1">Font Family (workspace)</label>
                        <input
                          type="text"
                          value={ov.fontFamily ?? ''}
                          onChange={(e) => setOv({ fontFamily: e.target.value || undefined })}
                          placeholder="empty = inherit global"
                          className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-white/50 mb-1">Default Shell (workspace)</label>
                        <input
                          type="text"
                          value={ov.defaultShell ?? ''}
                          onChange={(e) => setOv({ defaultShell: e.target.value.trim() || undefined })}
                          placeholder="empty = inherit"
                          className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-white/50 mb-1">Default CWD (workspace)</label>
                        <input
                          type="text"
                          value={ov.defaultCwd ?? ''}
                          onChange={(e) => setOv({ defaultCwd: e.target.value.trim() || undefined })}
                          placeholder="empty = inherit"
                          className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-white/50 mb-1">Terminal Opacity (workspace) — {ov.terminalOpacity !== undefined ? `${Math.round(ov.terminalOpacity * 100)}%` : 'inherit global'}</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={terminalOpacityMin}
                            max={1}
                            step={0.05}
                            value={ov.terminalOpacity ?? 1}
                            onChange={(e) => setOv({ terminalOpacity: Number(e.target.value) })}
                            className="flex-1 accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                          />
                          {ov.terminalOpacity !== undefined && (
                            <button
                              onClick={() => setOv({ terminalOpacity: undefined })}
                              className="shrink-0 px-2 py-1 rounded-md border border-white/10 text-[10px] text-white/50 hover:border-white/30 hover:text-white/80 transition-colors"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1.5 -mr-1.5">
                {workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                      ws.id === activeWorkspaceId
                        ? 'border-forest-bright bg-forest/10'
                        : 'border-white/10 bg-black/40 hover:border-forest/40'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white/90">{ws.name}</div>
                      <div className="text-[10px] text-white/35 font-mono mt-0.5">ID: {ws.id}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ws.id !== activeWorkspaceId && (
                        <button
                          // Audit fix: route through the guard so switching from
                          // Settings warns before terminating running processes,
                          // matching Header / Sidebar / Palette behavior.
                          onClick={() => requestSwitchWorkspace(ws.id)}
                          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-white/65 transition-colors"
                        >
                          Switch
                        </button>
                      )}

                      <button
                        onClick={() => setRenameWsId(ws.id)}
                        className="p-1.5 rounded hover:bg-white/5 text-white/45 hover:text-white/80 transition-colors"
                        title="Rename"
                        aria-label={`Rename workspace ${ws.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* UX audit P3 #20: duplicate a workspace's layout. */}
                      <button
                        onClick={() => duplicateWorkspace(ws.id)}
                        className="p-1.5 rounded hover:bg-white/5 text-white/45 hover:text-white/80 transition-colors"
                        title="Duplicate Workspace"
                        aria-label={`Duplicate workspace ${ws.name}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Customization audit C23: archive / unarchive. */}
                      <button
                        onClick={() => toggleArchive(ws.id)}
                        className="p-1.5 rounded hover:bg-white/5 text-white/45 hover:text-white/80 transition-colors"
                        title={ws.archived ? 'Unarchive Workspace' : 'Archive Workspace'}
                        aria-label={ws.archived ? `Unarchive workspace ${ws.name}` : `Archive workspace ${ws.name}`}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      {/* Customization audit L16: the delete button is ALWAYS shown —
                          deleting the last workspace resets to a fresh default. */}
                      <button
                        onClick={() => setDeleteWsId(ws.id)}
                        className="p-1.5 rounded hover:bg-rose-950/60 text-white/45 hover:text-rose-400 transition-colors"
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

          {activeTab === 'limits' && (
            <div className="space-y-5">
              <p className="text-[11px] text-white/40 leading-relaxed">
                Customization audit: every hard limit in VibeGrid is now a setting. Nothing is
                silently capped unless you want it to be.
              </p>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">Max Panes ({maxPanes})</label>
                </div>
                <input
                  type="range"
                  min={1}
                  max={64}
                  value={maxPanes}
                  onChange={(e) => updateSettings({ maxPanes: Number(e.target.value) })}
                  className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                />
                <span className="block text-[10px] text-white/40 mt-0.5">Was hardcoded at 16. The WebGL context cap is the real GPU limit.</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">Minimum Pane Size ({minPaneSize}px)</label>
                </div>
                <input
                  type="range"
                  min={40}
                  max={400}
                  step={10}
                  value={minPaneSize}
                  onChange={(e) => updateSettings({ minPaneSize: Number(e.target.value) })}
                  className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">Snap divider to equal split on release</span>
                <ToggleSwitch checked={dividerSnap} onChange={(v) => updateSettings({ dividerSnap: v })} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">Snap threshold ({Math.round(snapEpsilon * 100)}% of equal split)</label>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.2}
                  step={0.01}
                  value={snapEpsilon}
                  onChange={(e) => updateSettings({ snapEpsilon: Number(e.target.value) })}
                  className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">Double-click divider to re-equalize</span>
                <ToggleSwitch checked={doubleClickEqualize} onChange={(v) => updateSettings({ doubleClickEqualize: v })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Font size min ({fontSizeMin}px)</label>
                  <input
                    type="range"
                    min={4}
                    max={96}
                    value={fontSizeMin}
                    onChange={(e) => updateSettings({ fontSizeMin: Number(e.target.value) })}
                    className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Font size max ({fontSizeMax}px)</label>
                  <input
                    type="range"
                    min={4}
                    max={96}
                    value={fontSizeMax}
                    onChange={(e) => updateSettings({ fontSizeMax: Number(e.target.value) })}
                    className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Scrollback max ({scrollbackMax.toLocaleString()})</label>
                  <input
                    type="range"
                    min={1000}
                    max={1000000}
                    step={1000}
                    value={scrollbackMax}
                    onChange={(e) => updateSettings({ scrollbackMax: Number(e.target.value) })}
                    className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Terminal opacity min ({terminalOpacityMin})</label>
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={terminalOpacityMin}
                    onChange={(e) => updateSettings({ terminalOpacityMin: Number(e.target.value) })}
                    className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Toast stack ({toastMaxCount})</label>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={toastMaxCount}
                    onChange={(e) => updateSettings({ toastMaxCount: Number(e.target.value) })}
                    className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Toast duration ({toastDefaultDurationMs}ms)</label>
                  <input
                    type="range"
                    min={500}
                    max={30000}
                    step={500}
                    value={toastDefaultDurationMs}
                    onChange={(e) => updateSettings({ toastDefaultDurationMs: Number(e.target.value) })}
                    className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">Palette recents ({paletteRecentsMax})</label>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={paletteRecentsMax}
                  onChange={(e) => updateSettings({ paletteRecentsMax: Number(e.target.value) })}
                  className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                />
                <span className="block text-[10px] text-white/40 mt-0.5">How many recently-used commands the palette remembers.</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Voice silence min ({voiceSilenceTimeoutMin}ms)</label>
                  <input
                    type="range"
                    min={100}
                    max={60000}
                    step={100}
                    value={voiceSilenceTimeoutMin}
                    onChange={(e) => updateSettings({ voiceSilenceTimeoutMin: Number(e.target.value) })}
                    className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Voice silence max ({voiceSilenceTimeoutMax}ms)</label>
                  <input
                    type="range"
                    min={100}
                    max={60000}
                    step={100}
                    value={voiceSilenceTimeoutMax}
                    onChange={(e) => updateSettings({ voiceSilenceTimeoutMax: Number(e.target.value) })}
                    className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">Autosave interval ({autosaveIntervalMs}ms)</label>
                </div>
                <input
                  type="range"
                  min={100}
                  max={10000}
                  step={100}
                  value={autosaveIntervalMs}
                  onChange={(e) => updateSettings({ autosaveIntervalMs: Number(e.target.value) })}
                  className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">First-run hint duration ({hintDurationMs === 0 ? 'sticky' : hintDurationMs + 'ms'})</label>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30000}
                  step={1000}
                  value={hintDurationMs}
                  onChange={(e) => updateSettings({ hintDurationMs: Number(e.target.value) })}
                  className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">Max WebGL contexts ({maxWebglSlots})</label>
                </div>
                <input
                  type="range"
                  min={1}
                  max={64}
                  value={maxWebglSlots}
                  onChange={(e) => updateSettings({ maxWebglSlots: Number(e.target.value) })}
                  className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                />
                <span className="block text-[10px] text-white/40 mt-0.5">Past this many panes, new ones render with the CPU canvas renderer instead of GPU WebGL.</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">Show splash screen at startup</span>
                <ToggleSwitch checked={showSplash} onChange={(v) => updateSettings({ showSplash: v })} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">Cursor width ({cursorWidth}px, bar style)</label>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={cursorWidth}
                  onChange={(e) => updateSettings({ cursorWidth: Number(e.target.value) })}
                  className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                />
              </div>

              <div className="border-t border-white/[0.06] pt-4">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Confirmations</span>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {([
                    ['paneClose', 'Close pane'],
                    ['quit', 'Quit with running processes'],
                    ['layoutShrink', 'Shrink / reset grid'],
                    ['workspaceDelete', 'Delete workspace'],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5">{label}</label>
                      <select
                        value={confirmations[key]}
                        onChange={(e) => updateSettings({ confirmations: { ...confirmations, [key]: e.target.value as 'always' | 'never' } })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright"
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

          {activeTab === 'appearance' && (
            <div className="space-y-5">
              {/* Customization audit C3: chrome color scheme. The TERMINAL theme
                  stays an independent pick under the Themes tab — light mode
                  offers the VibeLight palette there too. */}
              <div>
                <span className="block text-xs font-semibold text-white/70">Color Scheme (UI chrome)</span>
                <span className="block text-[10px] text-white/40 mt-0.5">'System' follows the OS (and the window theme in the desktop app). The terminal palette is a separate choice under Themes.</span>
                <div className="flex gap-1.5 mt-2">
                  {(['dark', 'light', 'system'] as ThemeMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => updateSettings({ themeMode: m })}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        themeMode === m
                          ? 'border-forest-bright bg-forest/15 text-forest-light'
                          : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-forest/40 hover:text-white/80'
                      }`}
                    >
                      {m === 'dark' ? 'Dark' : m === 'light' ? 'Light' : 'Follow System'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white/70">Animations</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Master switch for UI motion (also respects OS reduced-motion).</span>
                </div>
                <ToggleSwitch checked={animationsEnabled} onChange={(v) => updateSettings({ animationsEnabled: v })} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">UI Zoom ({uiZoom}%)</label>
                </div>
                <input
                  type="range"
                  min={80}
                  max={150}
                  step={5}
                  value={uiZoom}
                  onChange={(e) => updateSettings({ uiZoom: Number(e.target.value) })}
                  className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">Compact mode (tighter chrome)</span>
                <ToggleSwitch checked={compactMode} onChange={(v) => updateSettings({ compactMode: v })} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">Show status bar</span>
                <ToggleSwitch checked={!hideStatusBar} onChange={(v) => updateSettings({ hideStatusBar: !v })} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">Show header</span>
                <ToggleSwitch checked={!hideHeader} onChange={(v) => updateSettings({ hideHeader: !v })} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">Sidebar width ({sidebarWidth}px)</label>
                </div>
                <input
                  type="range"
                  min={160}
                  max={480}
                  step={8}
                  value={sidebarWidth}
                  onChange={(e) => updateSettings({ sidebarWidth: Number(e.target.value) })}
                  className="w-full accent-forest-bright bg-black/40 h-2 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white/70">UI accent color</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Overrides the accent derived from your terminal theme. Reset to auto-derive.</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={uiAccentColor ?? '#3c95f0'}
                    onChange={(e) => updateSettings({ uiAccentColor: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10"
                  />
                  {uiAccentColor && (
                    <button
                      onClick={() => updateSettings({ uiAccentColor: null })}
                      className="px-2 py-1 rounded-lg border border-white/10 text-[10px] text-white/60 hover:text-white transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-4">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Status bar badges</span>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {([
                    ['workspace', 'Workspace name'],
                    ['font', 'Font size'],
                    ['gpu', 'GPU / CPU'],
                    ['panes', 'Pane count'],
                  ] as const).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-white/70">{label}</span>
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

          {activeTab === 'keyboard' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-space text-white/90 uppercase tracking-wider">Custom Keybindings</span>
                <button
                  // UX audit P0 #2: resetting keybindings is destructive — confirm.
                  onClick={() => setConfirmResetKeybindings(true)}
                  className="px-3.5 py-1.5 rounded-2xl border border-white/10 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-amber-400 hover:bg-white/5 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">Click a shortcut to reassign it, then press the new key combination. Press <kbd className="px-1.5 py-0.5 font-mono bg-white/5 border border-white/10 rounded text-[10px] text-zinc-300">Esc</kbd> to cancel. Conflicts are detected automatically.</p>

              <div className="space-y-2">
                {Object.values(keybindings).map((kb) => (
                  <div
                    key={kb.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      recordingId === kb.id
                        ? 'border-white bg-white/10 text-white'
                        : 'border-white/[0.08] bg-black/40 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="font-space font-bold text-white/90">{kb.label}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{kb.id}</div>
                    </div>

                    <button
                      onClick={() => setRecordingId(recordingId === kb.id ? null : kb.id)}
                      title={recordingId === kb.id ? 'Press a key combination to record it' : 'Click to reassign'}
                      className={`flex items-center gap-2 px-3 py-1 font-mono border rounded-lg text-[11px] transition-colors ${
                        recordingId === kb.id
                          ? 'border-white bg-white/20 text-white animate-pulse'
                          : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/30'
                      }`}
                    >
                      {recordingId === kb.id ? 'Press keys…' : kb.currentKey}
                    </button>
                  </div>
                ))}
              </div>

              {/* Customization audit C22: macros (action sequences + pauses). */}
              <div className="mt-6 border-t border-white/[0.08] pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-space text-white/90 uppercase tracking-wider">Macros ({macros.length})</span>
                  <button
                    onClick={addMacro}
                    className="px-4 py-2 rounded-2xl bg-white text-black hover:bg-zinc-200 text-xs font-extrabold font-space flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Macro
                  </button>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed mb-3">
                  Macros run a sequence of app actions with optional pauses — trigger them from the command palette or a keybinding
                  (e.g. <kbd className="px-1 py-0.5 font-mono bg-white/5 border border-white/10 rounded text-[10px]">Mod+Alt+1</kbd>).
                  Actions that close panes keep their confirmations.
                </p>
                {macros.length === 0 && (
                  <p className="text-[11px] text-white/35 text-center py-3">No macros yet — create one to automate multi-step workflows.</p>
                )}
                <div className="space-y-3">
                  {macros.map((macro) => (
                    <div key={macro.id} className="p-3 rounded-lg border border-white/10 bg-black/40 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={macro.name}
                          onChange={(e) => updateMacro(macro.id, { name: e.target.value.slice(0, 60) })}
                          placeholder="Macro name"
                          className="flex-1 min-w-0 px-2 py-1 rounded bg-black/40 border border-white/10 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-forest-bright"
                        />
                        <input
                          type="text"
                          value={macro.keybinding}
                          onChange={(e) => updateMacro(macro.id, { keybinding: e.target.value.trim() })}
                          placeholder="Keybinding (Mod+Alt+1)"
                          className="w-40 shrink-0 px-2 py-1 font-mono rounded bg-black/40 border border-white/10 text-[11px] text-forest-light placeholder-white/30 focus:outline-none focus:border-forest-bright"
                        />
                        <button
                          onClick={() => runMacro(macro)}
                          title="Run now"
                          aria-label={`Run macro ${macro.name}`}
                          className="p-1.5 rounded hover:bg-forest/20 text-forest-light transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMacro(macro.id)}
                          title="Delete macro"
                          aria-label={`Delete macro ${macro.name}`}
                          className="p-1.5 rounded hover:bg-rose-950/60 text-white/45 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {macro.steps.map((step, si) => (
                          <div key={si} className="flex items-center gap-1.5">
                            <select
                              value={step.type === 'action' ? step.actionId ?? '' : 'delay'}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === 'delay') setMacroStep(macro.id, si, { type: 'delay', ms: 300 });
                                else setMacroStep(macro.id, si, { type: 'action', actionId: v });
                              }}
                              className="flex-1 min-w-0 px-2 py-1 rounded bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright"
                            >
                              <option value="delay">— pause —</option>
                              {MACRO_ACTIONS.map((a) => (
                                <option key={a.id} value={a.id}>{a.label}</option>
                              ))}
                            </select>
                            {step.type === 'delay' ? (
                              <input
                                type="number"
                                min={0}
                                max={10000}
                                step={50}
                                value={step.ms ?? 300}
                                onChange={(e) => setMacroStep(macro.id, si, { ms: Number(e.target.value) })}
                                className="w-24 shrink-0 px-2 py-1 rounded bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright"
                              />
                            ) : (
                              <span className="w-24 shrink-0 text-right text-[10px] text-white/35 truncate">
                                {getMacroAction(step.actionId ?? '')?.category ?? ''}
                              </span>
                            )}
                            <button
                              onClick={() => removeMacroStep(macro.id, si)}
                              title="Remove step"
                              aria-label="Remove macro step"
                              className="p-1 rounded hover:bg-rose-950/60 text-white/45 hover:text-rose-400 transition-colors shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => addMacroStep(macro.id)}
                        className="text-[10px] text-forest-light hover:text-forest-bright flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add step
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Customization audit S1/S8: settings profiles + MCP endpoint info. */}
          {activeTab === 'profiles' && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold font-space text-white/90 uppercase tracking-wider">Settings Profiles</span>
                <p className="text-[11px] text-zinc-400 font-sans mt-1">Save your current settings (fonts, themes, terminal options, voice, startup behavior…) as a named profile and switch between them. Profiles are stored locally.</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveProfile();
                  }}
                  placeholder="Profile name (e.g. Work / Home)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-space text-white/90 placeholder-white/30 focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={saveProfile}
                  className="px-4 py-2 rounded-2xl bg-white text-black hover:bg-zinc-200 text-xs font-extrabold font-space flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Current
                </button>
              </div>

              <div className="space-y-2">
                {listSettingsProfiles().length === 0 && (
                  <p className="text-[11px] text-zinc-500 font-mono text-center py-4">No profiles saved yet.</p>
                )}
                {listSettingsProfiles().map((name) => (
                  <div key={name} className="p-3.5 rounded-xl border border-white/[0.08] bg-black/40 flex items-center justify-between">
                    <span className="text-xs font-bold font-space text-white/90 truncate">{name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (loadSettingsProfile(name)) {
                            addToast({ type: 'success', title: 'Profile applied', description: `"${name}" is now active.` });
                          } else {
                            addToast({ type: 'error', title: 'Could not apply profile', description: `"${name}" appears to be corrupt.` });
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-2xl bg-white text-black hover:bg-zinc-200 text-xs font-extrabold font-space transition-colors"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => deleteSettingsProfile(name)}
                        title={`Delete profile ${name}`}
                        aria-label={`Delete profile ${name}`}
                        className="p-1.5 rounded-lg hover:bg-rose-950/60 text-white/45 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customization audit S8: MCP/HTTP endpoint info. */}
              <div className="border-t border-white/[0.08] pt-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-xs font-bold font-space text-white/90 uppercase tracking-wider">MCP / HTTP Endpoint</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans mt-1 leading-relaxed">
                  VibeGrid exposes a read-only state API that MCP clients and scripts can query (pane list, output history). The server listens on localhost only.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-[11px] font-mono text-zinc-300 truncate">
                    http://127.0.0.1:{httpPort ?? '…'}/panes
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`http://127.0.0.1:${httpPort ?? 8792}/panes`);
                      addToast({ type: 'success', title: 'Endpoint copied' });
                    }}
                    className="px-3 py-2 rounded-xl border border-white/10 text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                    title="Copy endpoint URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono mt-1.5">
                  Port override: <code className="font-mono text-zinc-400">VIBEGRID_HTTP_PORT</code> env var (default 8792).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer: import / export / reset */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-colors"
              title="Download settings as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              className="px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-colors"
              title="Import settings from JSON"
            >
              <Upload className="w-3.5 h-3.5" />
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
            // UX audit P0 #2: resetting ALL settings is destructive — confirm.
            onClick={() => setConfirmResetAll(true)}
            className="px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-amber-400 hover:bg-white/5 flex items-center gap-1.5 transition-colors"
            title="Reset all settings to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>
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
            // Customization audit L16: deleting the LAST workspace resets to a
            // fresh default instead of refusing.
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

      {/* Customization audit C1: theme create / rename / delete modals */}
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

      {/* UX audit P0 #2: reset-all confirmation */}
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

      {/* UX audit P0 #2: keybinding reset confirmation */}
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

      {/* UX audit P0 #3: import confirmation (current settings are backed up
          to localStorage before applying, so the user can restore). */}
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
