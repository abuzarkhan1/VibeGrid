import React, { useState, useEffect, useRef } from 'react';
import { Search, Columns, Rows, Maximize2, X, ZoomIn, ZoomOut, RotateCcw, Palette, Plus, Settings, Info, Edit3, Grid, FolderOpen, BookOpen, Mic, Download, Upload, Save, Terminal as TerminalIcon, Trash2, Play, Zap } from 'lucide-react';
import { runMacro } from '@/lib/macros';
import { useUIStore } from '@/store/useUIStore';
import { usePaneStore, getTerminalNodes, PresetCount } from '@/store/usePaneStore';
import { useSettingsStore, THEMES, UserCommand } from '@/store/useSettingsStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';
import { useVoiceStore } from '@/store/useVoiceStore';
import { fuzzyScore } from '@/lib/commandUtils';
import { writeToPty } from '@/lib/tauri';
import { InputModal } from './InputModal';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface CommandItem {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  onOpenAbout?: () => void;
}

const RECENTS_KEY = 'vibegrid_palette_recents_v1';

/** Live recents cap (customization audit L15) — reads the setting so a change
 *  in Settings applies immediately, no store subscription needed. */
function maxRecents(): number {
  return useSettingsStore.getState().paletteRecentsMax;
}

function loadRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string').slice(0, maxRecents());
    }
  } catch (e) {
    // ignore
  }
  return [];
}

/**
 * Gap 7: drop recents whose command ids no longer exist (stale across
 * versions), so the recents list never points at removed commands.
 */
function pruneRecents(recents: string[], validIds: Set<string>): string[] {
  const pruned = recents.filter((id) => validIds.has(id));
  if (pruned.length !== recents.length) saveRecents(pruned);
  return pruned;
}

function saveRecents(recents: string[]) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, maxRecents())));
  } catch (e) {
    // ignore
  }
}

/** Resolve the focused pane's live PTY id from the layout tree (shared by the
 *  replay-transcript and custom-command actions). */
function getFocusedPtyId(): string | undefined {
  const paneId = usePaneStore.getState().focusedPaneId;
  const find = (node: import('@/types/layout').PaneNode | null): string | undefined => {
    if (!node) return undefined;
    if (node.id === paneId && node.type === 'terminal') return node.paneId;
    if (node.type === 'split') return find(node.children[0]) || find(node.children[1]);
    return undefined;
  };
  return find(usePaneStore.getState().root);
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onOpenAbout }) => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, toggleSettings, addToast, setCheatsheetOpen, requestClosePane, requestSwitchWorkspace, requestCreateWorkspace, requestSetLayoutPreset, requestResetLayout, notifyMaxPanes } = useUIStore();
  const { splitPane, toggleMaximize, setPaneTitle, setPaneCwd, focusedPaneId, paneCount, maxPanes } = usePaneStore();
  const { increaseFontSize, decreaseFontSize, resetFontSize, setThemeName, voiceToTerminal, setVoiceToTerminal, exportSettings, importSettings, userCommands, updateSettings } = useSettingsStore();
  const { workspaces, saveCurrentWorkspace } = useWorkspaceStore();
  const { keybindings } = useKeybindingsStore();
  // Gap 19: last transcription, re-playable from the palette. Must be called
  // before any early return (rules-of-hooks).
  const lastTranscript = useVoiceStore((s) => s.lastTranscript);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showWsModal, setShowWsModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  // Customization audit C21: custom command manager.
  const [showCmdModal, setShowCmdModal] = useState(false);
  const [cmdLabel, setCmdLabel] = useState('');
  const [cmdCommand, setCmdCommand] = useState('');
  const [recents, setRecents] = useState<string[]>(loadRecents);
  const importInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useFocusTrap<HTMLDivElement>(isCommandPaletteOpen);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);



  if (!isCommandPaletteOpen && !showWsModal && !showTitleModal && !showFolderModal && !showCmdModal) return null;

  // Customization audit L12: 3/5/9/12 added to the equal-grid presets.
  const presets: PresetCount[] = [1, 2, 3, 4, 5, 6, 8, 9, 12, 16];

  const runCommand = (cmd: CommandItem) => {
    const next = [cmd.id, ...recents.filter((r) => r !== cmd.id)].slice(0, maxRecents());
    setRecents(next);
    saveRecents(next);
    cmd.action();
    setCommandPaletteOpen(false);
  };

  // Customization audit C21: type a user-defined command into the focused pane
  // and press Enter. The pane must have a live PTY.
  const runUserCommand = (uc: UserCommand) => {
    const ptyId = getFocusedPtyId();
    if (!ptyId) {
      addToast({ type: 'error', title: 'No active pane', description: 'Focus a terminal pane before running a command.' });
      return;
    }
    writeToPty(ptyId, `${uc.command}\r`);
    addToast({ type: 'success', title: `Ran: ${uc.label}`, description: uc.command });
  };

  const addUserCommand = () => {
    if (!cmdLabel.trim() || !cmdCommand.trim()) return;
    const cmd: UserCommand = {
      id: `uc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: cmdLabel.trim().slice(0, 60),
      command: cmdCommand.trim(),
    };
    updateSettings({ userCommands: [...userCommands, cmd] });
    setCmdLabel('');
    setCmdCommand('');
    addToast({ type: 'success', title: 'Command added', description: `${cmd.label} will appear in the palette.` });
  };

  const deleteUserCommand = (id: string) => {
    updateSettings({ userCommands: userCommands.filter((u) => u.id !== id) });
  };

  const commands: CommandItem[] = [
    {
      id: 'edit-pane-title',
      label: 'Edit Focused Pane Title',
      category: 'Pane Operations',
      icon: <Edit3 className="w-4 h-4 text-forest-bright" />,
      action: () => setShowTitleModal(true),
    },
    ...presets.map((p) => ({
      id: `preset-grid-${p}`,
      label: `Set Equal Grid Layout to ${p} Pane${p > 1 ? 's' : ''}`,
      category: 'Layout Presets',
      icon: <Grid className="w-4 h-4 text-forest-bright" />,
      // Guarded: a grid rebuild kills all running panes — confirm when running.
      action: () => requestSetLayoutPreset(p),
    })),
    {
      id: 'split-folder',
      label: 'Split Pane in a New Folder…',
      category: 'Pane Operations',
      icon: <FolderOpen className="w-4 h-4 text-forest-bright" />,
      action: () => setShowFolderModal(true),
    },
    {
      id: 'split-horizontal',
      label: 'Split Pane Horizontally (Side by Side)',
      category: 'Pane Operations',
      shortcut: keybindings['split-horizontal']?.currentKey || 'Mod+D',
      icon: <Columns className="w-4 h-4 text-forest-bright" />,
      action: () => {
        if (focusedPaneId) {
          const success = splitPane(focusedPaneId, 'horizontal');
          if (!success && paneCount >= maxPanes) {
            notifyMaxPanes();
          }
        }
      },
    },
    {
      id: 'split-vertical',
      label: 'Split Pane Vertically (Stacked)',
      category: 'Pane Operations',
      shortcut: keybindings['split-vertical']?.currentKey || 'Mod+Shift+D',
      icon: <Rows className="w-4 h-4 text-forest-bright" />,
      action: () => {
        if (focusedPaneId) {
          const success = splitPane(focusedPaneId, 'vertical');
          if (!success && paneCount >= maxPanes) {
            notifyMaxPanes();
          }
        }
      },
    },
    {
      id: 'maximize-pane',
      label: 'Toggle Maximize / Restore Focused Pane',
      category: 'Pane Operations',
      shortcut: keybindings['toggle-maximize']?.currentKey || 'Mod+Shift+Enter',
      icon: <Maximize2 className="w-4 h-4 text-forest-bright" />,
      action: () => toggleMaximize(),
    },
    {
      id: 'close-pane',
      label: 'Close Focused Pane',
      category: 'Pane Operations',
      shortcut: keybindings['close-pane']?.currentKey || 'Mod+W',
      icon: <X className="w-4 h-4 text-rose-400" />,
      action: () => {
        if (focusedPaneId) requestClosePane(focusedPaneId);
      },
    },
    {
      id: 'new-workspace',
      label: 'Create New Workspace',
      category: 'Workspace',
      shortcut: keybindings['new-workspace']?.currentKey || 'Mod+Shift+N',
      icon: <Plus className="w-4 h-4 text-forest-bright" />,
      action: () => setShowWsModal(true),
    },
    ...workspaces.map((ws) => {
      const running = ws.id === useWorkspaceStore.getState().activeWorkspaceId
        ? getTerminalNodes(usePaneStore.getState().root).filter((t) => t.paneId).length
        : getTerminalNodes(ws.layout).filter((t) => t.paneId).length;
      return {
        id: `ws-switch-${ws.id}`,
        label: `Switch to Workspace: ${ws.name}${running > 0 ? `  ●${running} running` : ''}`,
        category: 'Workspace',
        icon: <Info className="w-4 h-4 text-forest-bright" />,
        action: () => requestSwitchWorkspace(ws.id),
      };
    }),
    ...workspaces.map((ws) => ({
      id: `ws-duplicate-${ws.id}`,
      label: `Duplicate Workspace: ${ws.name}`,
      category: 'Workspace',
      icon: <Plus className="w-4 h-4 text-forest-light" />,
      action: () => {
        useWorkspaceStore.getState().duplicateWorkspace(ws.id);
      },
    })),
    {
      // Customization audit C24: manual save — the debounced autosave is the
      // safety net, but sometimes you want the file updated right now.
      id: 'save-workspace-now',
      label: 'Save Workspace Now',
      category: 'Workspace',
      icon: <Save className="w-4 h-4 text-forest-light" />,
      action: () => {
        saveCurrentWorkspace();
        addToast({ type: 'success', title: 'Workspace saved', description: 'The current layout and settings were written to disk.' });
      },
    },
    // Customization audit C21: user-defined commands (persisted with settings).
    ...userCommands.map((uc) => ({
      id: `user-cmd-${uc.id}`,
      label: uc.label,
      category: 'Custom Commands',
      icon: <TerminalIcon className="w-4 h-4 text-forest-light" />,
      action: () => runUserCommand(uc),
    })),
    // Customization audit C22: user-defined macros.
    ...useSettingsStore.getState().macros.map((m) => ({
      id: `macro-run-${m.id}`,
      label: `Run Macro: ${m.name}`,
      category: 'Macros',
      icon: <Zap className="w-4 h-4 text-forest-light" />,
      action: () => runMacro(m),
    })),
    {
      id: 'manage-user-commands',
      label: 'Manage Custom Commands…',
      category: 'Custom Commands',
      icon: <Plus className="w-4 h-4 text-forest-light" />,
      action: () => setShowCmdModal(true),
    },
    {
      id: 'open-settings',
      label: 'Open Settings Panel',
      category: 'Preferences',
      shortcut: keybindings['open-settings']?.currentKey || 'Mod+,',
      icon: <Settings className="w-4 h-4 text-white/60" />,
      action: () => toggleSettings(),
    },
    {
      id: 'open-shortcuts',
      label: 'Keyboard Shortcuts Reference',
      category: 'Preferences',
      icon: <BookOpen className="w-4 h-4 text-forest-light" />,
      action: () => setCheatsheetOpen(true),
    },
    {
      id: 'open-about',
      label: 'About VibeGrid',
      category: 'Application',
      icon: <Info className="w-4 h-4 text-forest-bright" />,
      action: () => {
        if (onOpenAbout) onOpenAbout();
      },
    },
    {
      id: 'export-settings',
      label: 'Export Settings to JSON File',
      category: 'Preferences',
      icon: <Download className="w-4 h-4 text-forest-light" />,
      action: () => {
        const blob = new Blob([exportSettings()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vibegrid-settings.json';
        a.click();
        URL.revokeObjectURL(url);
        addToast({ type: 'success', title: 'Settings exported' });
      },
    },
    {
      id: 'import-settings',
      label: 'Import Settings from JSON File…',
      category: 'Preferences',
      icon: <Upload className="w-4 h-4 text-forest-light" />,
      action: () => importInputRef.current?.click(),
    },
    {
      id: 'toggle-voice',
      label: voiceToTerminal ? 'Disable Voice-to-Terminal' : 'Enable Voice-to-Terminal',
      category: 'Preferences',
      icon: <Mic className={`w-4 h-4 ${voiceToTerminal ? 'text-forest-bright' : 'text-white/60'}`} />,
      action: () => {
        setVoiceToTerminal(!voiceToTerminal);
        addToast({ type: 'success', title: voiceToTerminal ? 'Voice disabled' : 'Voice enabled', description: 'Press Cmd/Ctrl+Shift+V to dictate into the focused pane.' });
      },
    },
    {
      id: 'font-increase',
      label: 'Increase Terminal Font Size',
      category: 'View & Font',
      shortcut: 'Mod+Plus',
      icon: <ZoomIn className="w-4 h-4 text-forest-light" />,
      action: () => increaseFontSize(),
    },
    {
      id: 'font-decrease',
      label: 'Decrease Terminal Font Size',
      category: 'View & Font',
      shortcut: 'Mod+Minus',
      icon: <ZoomOut className="w-4 h-4 text-forest-light" />,
      action: () => decreaseFontSize(),
    },
    {
      id: 'font-reset',
      label: 'Reset Terminal Font Size to Default',
      category: 'View & Font',
      shortcut: 'Mod+0',
      icon: <RotateCcw className="w-4 h-4 text-forest-light" />,
      action: () => resetFontSize(),
    },
    // Customization audit C1: the palette offers custom themes too (built-ins
    // plus any user-created palettes merged over them).
    ...Object.entries({ ...THEMES, ...useSettingsStore.getState().customThemes }).map(([key, theme]) => ({
      id: `theme-${key}`,
      label: `Switch Theme to ${theme.name}`,
      category: 'Themes',
      icon: <Palette className="w-4 h-4 text-forest-light" />,
      action: () => setThemeName(key),
    })),
    {
      id: 'reset-grid',
      label: 'Reset Grid to Single Terminal Pane',
      category: 'Workspace',
      icon: <RotateCcw className="w-4 h-4 text-amber-400" />,
      // Guarded: reset kills all running panes — confirm when running.
      action: () => requestResetLayout(),
    },
  ];

  // Gap 19: replay the last transcription into the focused pane.
  if (lastTranscript) {
    commands.push({
      id: 'replay-last-transcript',
      label: `Re-Insert Last Transcription: "${lastTranscript.length > 30 ? lastTranscript.slice(0, 30) + '…' : lastTranscript}"`,
      category: 'Voice',
      icon: <Mic className="w-4 h-4 text-forest-light" />,
      action: () => {
        const ptyId = getFocusedPtyId();
        if (ptyId) {
          writeToPty(ptyId, lastTranscript);
          addToast({ type: 'success', title: 'Re-inserted', description: `"${lastTranscript}"` });
        } else {
          addToast({ type: 'error', title: 'No active pane', description: 'Could not re-insert the last transcription.' });
        }
      },
    });
  }

  // Gap 7: prune stale recents against the current command ids. Done as a
  // guarded render-time computation (no effect needed): once recents contain
  // only valid ids the guard stops firing, so this never loops.
  const validIds = new Set(commands.map((c) => c.id));
  if (recents.some((id) => !validIds.has(id))) {
    setRecents(pruneRecents(recents, validIds));
  }

  // Fuzzy filter + rank (recents first on empty query)
  const ranked = commands
    .map((cmd) => ({ cmd, score: fuzzyScore(query, cmd.label) + fuzzyScore(query, cmd.category) / 100 }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => {
      if (!query.trim()) {
        const ra = recents.indexOf(a.cmd.id);
        const rb = recents.indexOf(b.cmd.id);
        if (ra !== -1 || rb !== -1) return (ra === -1 ? 999 : ra) - (rb === -1 ? 999 : rb);
        return a.cmd.category.localeCompare(b.cmd.category) || a.cmd.label.localeCompare(b.cmd.label);
      }
      return b.score - a.score;
    });
  const filteredCommands = ranked.map((entry) => entry.cmd);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        runCommand(filteredCommands[selectedIndex]);
      }
    }
  };

  return (
    <>
      {isCommandPaletteOpen && (
        <div
          onClick={() => setCommandPaletteOpen(false)}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 animate-fade-in"
        >
          <div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-surfaceCard border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col max-h-[70vh] backdrop-blur-md"
          >
            {/* Search Header */}
            <div className="flex items-center px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
              <Search className="w-4 h-4 text-forest-bright mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search actions…"
                aria-label="Search commands"
                className="w-full bg-transparent text-sm text-white/90 placeholder-white/35 focus:outline-none"
              />
            </div>

            {/* Command List */}
            <div className="flex-1 overflow-y-auto py-2">
              {filteredCommands.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/40">No matching commands found</div>
              ) : (
                filteredCommands.map((cmd, idx) => (
                  <div
                    key={cmd.id}
                    onClick={() => runCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-4 py-2.5 flex items-center justify-between cursor-pointer text-xs transition-colors ${
                      idx === selectedIndex ? 'bg-forest/[0.15] text-forest-light border-l-2 border-forest-bright' : 'text-white/65 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {cmd.icon}
                      <div>
                        <div className="font-medium">{cmd.label}</div>
                        <div className="text-[10px] text-white/40">{cmd.category}</div>
                      </div>
                    </div>

                    {cmd.shortcut && (
                      <kbd className="px-2 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 rounded text-forest-light">{cmd.shortcut}</kbd>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.06] bg-white/[0.02] text-[10px] text-white/40">
              <span><kbd className="px-1 py-0.5 font-mono bg-white/5 border border-white/10 rounded">↑</kbd> <kbd className="px-1 py-0.5 font-mono bg-white/5 border border-white/10 rounded">↓</kbd> navigate</span>
              <span><kbd className="px-1 py-0.5 font-mono bg-white/5 border border-white/10 rounded">↵</kbd> run</span>
              <span><kbd className="px-1 py-0.5 font-mono bg-white/5 border border-white/10 rounded">esc</kbd> close</span>
              {query.trim() === '' && recents.length > 0 && <span className="ml-auto text-forest-light/70">Recently used first</span>}
            </div>
          </div>
        </div>
      )}

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const text = await file.text();
            const ok = importSettings(text);
            addToast(ok ? { type: 'success', title: 'Settings imported' } : { type: 'error', title: 'Invalid settings file' });
          }
          e.target.value = '';
        }}
      />

      {showWsModal && (
        <InputModal
          title="Create New Workspace"
          placeholder={`Workspace ${workspaces.length + 1}`}
          initialValue={`Workspace ${workspaces.length + 1}`}
          onSave={(name) => requestCreateWorkspace(name.slice(0, useSettingsStore.getState().workspaceNameMaxLength))}
          onClose={() => setShowWsModal(false)}
        />
      )}

      {showTitleModal && focusedPaneId && (
        <InputModal
          title="Edit Focused Pane Title"
          placeholder="Custom Pane Title"
          initialValue=""
          onSave={(title) => setPaneTitle(focusedPaneId, title.slice(0, useSettingsStore.getState().paneTitleMaxLength))}
          onClose={() => setShowTitleModal(false)}
        />
      )}

      {/* Customization audit C21: custom-command manager overlay (z-60 above
          the palette). Add/run/delete commands that type into the focused pane. */}
      {showCmdModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in"
          onClick={() => setShowCmdModal(false)}
        >
          <div
            className="w-full max-w-md bg-surfaceCard border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Manage custom commands"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-forest-bright" />
                <span className="text-xs font-bold text-white/80">Custom Commands</span>
              </div>
              <button
                onClick={() => setShowCmdModal(false)}
                className="p-1 rounded hover:bg-white/10 text-white/45 hover:text-white/80 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
              {/* Add form */}
              <div className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">New command</span>
                <input
                  type="text"
                  value={cmdLabel}
                  onChange={(e) => setCmdLabel(e.target.value)}
                  placeholder="Label (e.g. Run tests)"
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-forest-bright"
                />
                <input
                  type="text"
                  value={cmdCommand}
                  onChange={(e) => setCmdCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addUserCommand();
                    }
                  }}
                  placeholder="Shell command (e.g. npm test)"
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-forest-bright font-mono"
                />
                <button
                  onClick={addUserCommand}
                  disabled={!cmdLabel.trim() || !cmdCommand.trim()}
                  className="w-full px-3 py-1.5 rounded-lg bg-forest hover:bg-forest-bright text-xs font-medium text-white transition-colors disabled:opacity-40 disabled:hover:bg-forest"
                >
                  Add Command
                </button>
              </div>

              {/* Command list */}
              {userCommands.length === 0 ? (
                <p className="text-[11px] text-white/35 text-center py-4">
                  No custom commands yet — add one above. It will appear in the palette under “Custom Commands”.
                </p>
              ) : (
                userCommands.map((uc) => (
                  <div
                    key={uc.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white/85 truncate">{uc.label}</div>
                      <div className="text-[10px] text-white/40 font-mono truncate">$ {uc.command}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => runUserCommand(uc)}
                        title="Run in focused pane"
                        aria-label={`Run ${uc.label}`}
                        className="p-1 rounded hover:bg-forest/20 text-forest-light transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteUserCommand(uc.id)}
                        title="Delete command"
                        aria-label={`Delete ${uc.label}`}
                        className="p-1 rounded hover:bg-rose-950/60 text-white/45 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showFolderModal && (
        <InputModal
          title="Open New Pane in Folder"
          placeholder="/path/to/project"
          initialValue=""
          onBrowse={(path) => {
            // Native picker selected a folder — open the pane immediately.
            const trimmed = path.trim();
            if (trimmed && focusedPaneId) {
              const ok = splitPane(focusedPaneId, 'horizontal');
              if (ok) {
                const newId = usePaneStore.getState().focusedPaneId;
                if (newId) setPaneCwd(newId, trimmed);
                addToast({ type: 'success', title: 'Pane opened', description: `New pane cwd: ${trimmed}` });
                setShowFolderModal(false);
              } else {
                notifyMaxPanes();
              }
            }
          }}
          onSave={(path) => {
            const trimmed = path.trim();
            if (trimmed && focusedPaneId) {
              const ok = splitPane(focusedPaneId, 'horizontal');
              if (ok) {
                const newId = usePaneStore.getState().focusedPaneId;
                if (newId) setPaneCwd(newId, trimmed);
                addToast({ type: 'success', title: 'Pane opened', description: `New pane cwd: ${trimmed}` });
              } else {
                notifyMaxPanes();
              }
            }
          }}
          onClose={() => setShowFolderModal(false)}
        />
      )}
    </>
  );
};
