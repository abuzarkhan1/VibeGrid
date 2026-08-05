import React, { useState, useEffect, useRef } from 'react';
import { X, Type, Palette, Terminal as TerminalIcon, Layout, Keyboard as KeyboardIcon, Plus, Trash2, Edit2, RotateCcw, Download, Upload, Mic, Copy } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore, THEMES, CursorStyle } from '@/store/useSettingsStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';
import { eventToAccelerator } from '@/lib/commandUtils';
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
    resetSettings,
    exportSettings,
    importSettings,
  } = useSettingsStore();

  const { workspaces, activeWorkspaceId, renameWorkspace, deleteWorkspace, duplicateWorkspace } = useWorkspaceStore();
  const { keybindings, updateKeybinding, resetKeybindings } = useKeybindingsStore();
  const { addToast, requestSwitchWorkspace, requestCreateWorkspace } = useUIStore();

  const [activeTab, setActiveTab] = useState<'font' | 'theme' | 'terminal' | 'workspaces' | 'keyboard'>('font');

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
  const [modelReady, setModelReady] = useState<boolean | null>(null);
  const [micDevices, setMicDevices] = useState<string[]>([]);
  const [micLoading, setMicLoading] = useState(false);

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


  if (!isSettingsOpen) return null;

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

  return (      <div
        onClick={toggleSettings}
        role="dialog"
        aria-modal="true"
        aria-label="VibeGrid settings"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      >
        <div
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-surfaceCard border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.03]">
          <h2 className="text-sm font-medium text-white/90 uppercase tracking-wider">VibeGrid Settings</h2>
          <button
            onClick={toggleSettings}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.06] bg-black/30 px-4">
          <button
            onClick={() => setActiveTab('font')}
            className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'font'
                ? 'border-forest-bright text-forest-bright bg-forest/10'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Font & Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'theme'
                ? 'border-forest-bright text-forest-bright bg-forest/10'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Themes</span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'terminal'
                ? 'border-forest-bright text-forest-bright bg-forest/10'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('workspaces')}
            className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'workspaces'
                ? 'border-forest-bright text-forest-bright bg-forest/10'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Workspaces</span>
          </button>

          <button
            onClick={() => setActiveTab('keyboard')}
            className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'keyboard'
                ? 'border-forest-bright text-forest-bright bg-forest/10'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <KeyboardIcon className="w-3.5 h-3.5" />
            <span>Keybindings</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'font' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright"
                >
                  <option value="JetBrains Mono, monospace">JetBrains Mono</option>
                  <option value="Fira Code, monospace">Fira Code</option>
                  <option value="Menlo, Monaco, monospace">Menlo / Monaco</option>
                  <option value="Consolas, monospace">Consolas</option>
                  <option value="monospace">System Monospace</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">Font Size ({fontSize}px)</label>
                </div>
                <input
                  type="range"
                  min={8}
                  max={32}
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
                  min={1}
                  max={1.8}
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
                  min={0.6}
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
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(THEMES).map(([key, theme]) => (
                <div
                  key={key}
                  onClick={() => setThemeName(key)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    themeName === key
                      ? 'border-forest-bright bg-forest/10'
                      : 'border-white/10 bg-black/40 hover:border-forest/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white/85">{theme.name}</span>
                    {themeName === key && <div className="w-2 h-2 rounded-full bg-forest-bright" />}
                  </div>
                  <div className="flex gap-1.5 p-2 rounded bg-black/40">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.background }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.foreground }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.cursor }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.blue }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.green }} />
                  </div>
                </div>
              ))}
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
                <label className="block text-xs font-semibold text-white/70 mb-2">Scrollback Lines ({scrollback.toLocaleString()})</label>
                <input
                  type="number"
                  min={100}
                  max={100000}
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
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-white/70">Auto-stop after silence ({voiceSilenceTimeoutMs} ms)</label>
                </div>
                <input
                  type="range"
                  min={600}
                  max={5000}
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
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-white/60 hover:text-forest-light hover:border-forest/40 disabled:opacity-50 transition-colors"
                    >
                      <Mic className="w-3 h-3" />
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

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">IPC Batch Interval ({ipcBatchIntervalMs} ms)</label>
                <select
                  value={ipcBatchIntervalMs}
                  onChange={(e) => setIpcBatchIntervalMs(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-forest-bright"
                >
                  {![8, 16, 33, 66].includes(ipcBatchIntervalMs) && (
                    <option value={ipcBatchIntervalMs}>{ipcBatchIntervalMs} ms (custom)</option>
                  )}
                  <option value={8}>8 ms — fastest echo, higher CPU</option>
                  <option value={16}>16 ms — balanced (default)</option>
                  <option value={33}>33 ms — smoother, lower CPU</option>
                  <option value={66}>66 ms — max smoothing, lowest CPU</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'workspaces' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Active Workspaces ({workspaces.length})</span>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-forest hover:bg-forest-bright text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>

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
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* UX audit P3 #20: duplicate a workspace's layout. */}
                      <button
                        onClick={() => duplicateWorkspace(ws.id)}
                        className="p-1.5 rounded hover:bg-white/5 text-white/45 hover:text-white/80 transition-colors"
                        title="Duplicate Workspace"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {workspaces.length > 1 && (
                        <button
                          onClick={() => setDeleteWsId(ws.id)}
                          className="p-1.5 rounded hover:bg-rose-950/60 text-white/45 hover:text-rose-400 transition-colors"
                          title="Delete Workspace"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'keyboard' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Custom Keybindings</span>
                <button
                  // UX audit P0 #2: resetting keybindings is destructive — confirm.
                  onClick={() => setConfirmResetKeybindings(true)}
                  className="px-2.5 py-1 rounded border border-white/10 text-xs text-white/50 hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              <p className="text-[11px] text-white/40 leading-relaxed">Click a shortcut to reassign it, then press the new key combination. Press <kbd className="px-1 py-0.5 font-mono bg-white/5 border border-white/10 rounded text-[10px]">Esc</kbd> to cancel. Conflicts are detected automatically.</p>

              <div className="space-y-2">
                {Object.values(keybindings).map((kb) => (
                  <div
                    key={kb.id}
                    className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                      recordingId === kb.id
                        ? 'border-forest-bright bg-forest/10'
                        : 'border-white/10 bg-black/40 hover:border-forest/40'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-white/85">{kb.label}</div>
                      <div className="text-[10px] text-white/35 font-mono">{kb.id}</div>
                    </div>

                    <button
                      onClick={() => setRecordingId(recordingId === kb.id ? null : kb.id)}
                      title={recordingId === kb.id ? 'Press a key combination to record it' : 'Click to reassign'}
                      className={`flex items-center gap-2 px-2.5 py-1 font-mono border rounded text-[11px] transition-colors ${
                        recordingId === kb.id
                          ? 'border-forest-bright/70 bg-forest/20 text-forest-light animate-pulse'
                          : 'border-white/10 bg-white/5 text-forest-light hover:border-forest/50'
                      }`}
                    >
                      {recordingId === kb.id ? 'Press keys…' : kb.currentKey}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer: import / export / reset */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-2.5 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:bg-white/5 flex items-center gap-1.5 transition-colors"
              title="Download settings as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:bg-white/5 flex items-center gap-1.5 transition-colors"
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
            className="px-2.5 py-1.5 rounded-lg border border-white/10 text-xs text-white/50 hover:text-amber-400 hover:bg-white/5 flex items-center gap-1.5 transition-colors"
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
          onSave={(name) => requestCreateWorkspace(name.slice(0, 50))}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {renameWsId && renameTarget && (
        <InputModal
          title="Rename Workspace"
          initialValue={renameTarget.name}
          onSave={(name) => {
            renameWorkspace(renameWsId, name.slice(0, 50));
            setRenameWsId(null);
          }}
          onClose={() => setRenameWsId(null)}
        />
      )}

      {deleteWsId && deleteTarget && (
        <ConfirmModal
          title="Delete Workspace"
          message={
            deleteRunningCount > 0
              ? `Delete workspace "${deleteTarget.name}"? This will terminate ${deleteRunningCount} running terminal${deleteRunningCount > 1 ? 's' : ''} in it. This action cannot be undone.`
              : `Delete workspace "${deleteTarget.name}"? This action cannot be undone.`
          }
          confirmLabel="Delete Workspace"
          isDanger={true}
          onConfirm={() => deleteWorkspace(deleteWsId)}
          onClose={() => setDeleteWsId(null)}
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
