import React, { useState, useEffect, useRef } from 'react';
import { Search, Columns, Rows, Maximize2, X, ZoomIn, ZoomOut, RotateCcw, Palette, Plus, Settings, Info, Edit3, Grid, FolderOpen, BookOpen, Mic, Download, Upload, Save, Terminal as TerminalIcon, Trash2, Play, Zap, Bot, Layers, GitCommit } from 'lucide-react';
import { runMacro } from '@/lib/macros';
import { useUIStore } from '@/store/useUIStore';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { PresetCount } from '@/types/layout';
import { useSettingsStore, THEMES, UserCommand } from '@/store/useSettingsStore';
import { useWorkspaceStore, Workspace } from '@/store/useWorkspaceStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';
import { useVoiceStore } from '@/store/useVoiceStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useLayoutStudioStore } from '@/store/useLayoutStudioStore';
import { useAgentStore } from '@/store/useAgentStore';
import { useCustomizationStore } from '@/store/useCustomizationStore';
import { fuzzyScore } from '@/lib/commandUtils';
import { writeToPty } from '@/lib/tauri';
import { InputModal } from './InputModal';
import { ConfirmModal } from './ConfirmModal';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface CommandItem {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

const RECENTS_KEY = 'vibegrid_palette_recents_v1';

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

  }
  return [];
}

function pruneRecents(recents: string[], validIds: Set<string>): string[] {
  const pruned = recents.filter((id) => validIds.has(id));
  if (pruned.length !== recents.length) saveRecents(pruned);
  return pruned;
}

function saveRecents(recents: string[]) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, maxRecents())));
  } catch (e) {

  }
}

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

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, toggleSettings, setAboutOpen, addToast, setCheatsheetOpen, requestClosePane, requestSwitchWorkspace, requestCreateWorkspace, requestSetLayoutPreset, requestResetLayout, notifyMaxPanes } = useUIStore();
  const { splitPane, toggleMaximize, setPaneTitle, setPaneCwd, focusedPaneId, paneCount, maxPanes } = usePaneStore();
  const { increaseFontSize, decreaseFontSize, resetFontSize, setThemeName, voiceToTerminal, setVoiceToTerminal, exportSettings, importSettings, userCommands, updateSettings } = useSettingsStore();
  const { workspaces, saveCurrentWorkspace } = useWorkspaceStore();
  const { keybindings } = useKeybindingsStore();

  const lastTranscript = useVoiceStore((s) => s.lastTranscript);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showWsModal, setShowWsModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  const [showCmdModal, setShowCmdModal] = useState(false);
  const [cmdLabel, setCmdLabel] = useState('');
  const [cmdCommand, setCmdCommand] = useState('');
  const [pendingDeleteCmd, setPendingDeleteCmd] = useState<UserCommand | null>(null);
  const [pendingDeleteWs, setPendingDeleteWs] = useState<Workspace | null>(null);
  const [recents, setRecents] = useState<string[]>(loadRecents);
  const importInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useFocusTrap<HTMLDivElement>(isCommandPaletteOpen);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector<HTMLElement>('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isCommandPaletteOpen && !showWsModal && !showTitleModal && !showFolderModal && !showCmdModal && !pendingDeleteCmd) return null;

  const presets: PresetCount[] = [1, 2, 3, 4, 5, 6, 8, 9, 12, 16];

  const runCommand = (cmd: CommandItem) => {
    const next = [cmd.id, ...recents.filter((r) => r !== cmd.id)].slice(0, maxRecents());
    setRecents(next);
    saveRecents(next);
    cmd.action();
    setCommandPaletteOpen(false);
  };

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
      id: 'open-layout-studio',
      label: 'Open Layout Selection Studio…',
      category: 'Layout',
      icon: <Layers className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => useLayoutStudioStore.getState().openStudio(),
    },
    {
      id: 'open-agent-launcher',
      label: 'Open AI Agent Fleet Launcher…',
      category: 'AI Agents',
      icon: <Bot className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => useAgentStore.getState().openLauncher(),
    },
    {
      id: 'open-customizer-studio',
      label: 'Open Theme & Customization Studio…',
      category: 'Customization',
      icon: <Palette className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => useCustomizationStore.getState().openCustomizer(),
    },
    {
      id: 'toggle-diff-viewer',
      label: 'Toggle Content-Aware Diff Viewer',
      category: 'Workspace',
      icon: <GitCommit className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => useUIStore.getState().toggleDiffViewer(),
    },
    {
      id: 'app-setup-layout-studio',
      label: 'Open VibeGrid Setup & Onboarding Wizard…',
      category: 'Workspace',
      icon: <Zap className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => useOnboardingStore.getState().openOnboarding('splash'),
    },
    {
      id: 'edit-pane-title',
      label: 'Edit Focused Pane Title',
      category: 'Pane Operations',
      icon: <Edit3 className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => setShowTitleModal(true),
    },
    ...presets.map((p) => ({
      id: `preset-grid-${p}`,
      label: `Set Equal Grid Layout to ${p} Pane${p > 1 ? 's' : ''}`,
      category: 'Layout Presets',
      icon: <Grid className="w-4 h-4 text-[#a9a9aa]" />,
      // Guarded: a grid rebuild kills all running panes — confirm when running.
      action: () => requestSetLayoutPreset(p),
    })),
    {
      id: 'split-folder',
      label: 'Split Pane in a New Folder…',
      category: 'Pane Operations',
      icon: <FolderOpen className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => {
        if (!focusedPaneId) {
          addToast({ type: 'warning', title: 'No pane selected', description: 'Click on a pane first to split it.' });
          return;
        }
        setShowFolderModal(true);
      },
    },
    {
      id: 'split-horizontal',
      label: 'Split Pane Horizontally (Side by Side)',
      category: 'Pane Operations',
      shortcut: keybindings['split-horizontal']?.currentKey || 'Mod+D',
      icon: <Columns className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => {
        if (focusedPaneId) {
          const success = splitPane(focusedPaneId, 'horizontal');
          if (!success && paneCount >= maxPanes) {
            notifyMaxPanes();
          }
        } else {
          addToast({ type: 'warning', title: 'No pane selected', description: 'Click on a pane first to split it.' });
        }
      },
    },
    {
      id: 'split-vertical',
      label: 'Split Pane Vertically (Stacked)',
      category: 'Pane Operations',
      shortcut: keybindings['split-vertical']?.currentKey || 'Mod+Shift+E',
      icon: <Rows className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => {
        if (focusedPaneId) {
          const success = splitPane(focusedPaneId, 'vertical');
          if (!success && paneCount >= maxPanes) {
            notifyMaxPanes();
          }
        } else {
          addToast({ type: 'warning', title: 'No pane selected', description: 'Click on a pane first to split it.' });
        }
      },
    },
    {
      id: 'maximize-pane',
      label: 'Toggle Maximize / Restore Focused Pane',
      category: 'Pane Operations',
      shortcut: keybindings['toggle-maximize']?.currentKey || 'Mod+Shift+Enter',
      icon: <Maximize2 className="w-4 h-4 text-[#a9a9aa]" />,
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
      icon: <Plus className="w-4 h-4 text-[#a9a9aa]" />,
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
        icon: <Info className="w-4 h-4 text-[#a9a9aa]" />,
        action: () => requestSwitchWorkspace(ws.id),
      };
    }),
    ...workspaces.map((ws) => ({
      id: `ws-duplicate-${ws.id}`,
      label: `Duplicate Workspace: ${ws.name}`,
      category: 'Workspace',
      icon: <Plus className="w-4 h-4 text-[#a3a3ab]" />,
      action: () => {
        useWorkspaceStore.getState().duplicateWorkspace(ws.id);
        addToast({ type: 'success', title: 'Workspace duplicated' });
      },
    })),
    ...workspaces.map((ws) => ({
      id: `ws-delete-${ws.id}`,
      label: workspaces.length === 1 ? `Reset Workspace to Default: ${ws.name}` : `Delete Workspace: ${ws.name}`,
      category: 'Workspace',
      icon: <Trash2 className="w-4 h-4 text-rose-400" />,
      action: () => {
        setPendingDeleteWs(ws);
      },
    })),
    {
      // Customization audit C24: manual save — the debounced autosave is the
      // safety net, but sometimes you want the file updated right now.
      id: 'save-workspace-now',
      label: 'Save Workspace Now',
      category: 'Workspace',
      icon: <Save className="w-4 h-4 text-[#a3a3ab]" />,
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
      icon: <TerminalIcon className="w-4 h-4 text-[#a3a3ab]" />,
      action: () => runUserCommand(uc),
    })),
    // Customization audit C22: user-defined macros.
    ...useSettingsStore.getState().macros.map((m) => ({
      id: `macro-run-${m.id}`,
      label: `Run Macro: ${m.name}`,
      category: 'Macros',
      icon: <Zap className="w-4 h-4 text-[#a3a3ab]" />,
      action: () => runMacro(m),
    })),
    {
      id: 'manage-user-commands',
      label: 'Manage Custom Commands…',
      category: 'Custom Commands',
      icon: <Plus className="w-4 h-4 text-[#a3a3ab]" />,
      action: () => setShowCmdModal(true),
    },
    {
      id: 'open-settings',
      label: 'Open Settings Panel',
      category: 'Preferences',
      shortcut: keybindings['open-settings']?.currentKey || 'Mod+,',
      icon: <Settings className="w-4 h-4 text-[#a3a3ab]" />,
      action: () => toggleSettings(),
    },
    {
      id: 'open-shortcuts',
      label: 'Keyboard Shortcuts Reference',
      category: 'Preferences',
      icon: <BookOpen className="w-4 h-4 text-[#a3a3ab]" />,
      action: () => setCheatsheetOpen(true),
    },
    {
      id: 'open-about',
      label: 'About VibeGrid',
      category: 'Application',
      icon: <Info className="w-4 h-4 text-[#a9a9aa]" />,
      action: () => setAboutOpen(true),
    },
    {
      id: 'export-settings',
      label: 'Export Settings to JSON File',
      category: 'Preferences',
      icon: <Download className="w-4 h-4 text-[#a3a3ab]" />,
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
      icon: <Upload className="w-4 h-4 text-[#a3a3ab]" />,
      action: () => importInputRef.current?.click(),
    },
    {
      id: 'toggle-voice',
      label: voiceToTerminal ? 'Disable Voice-to-Terminal' : 'Enable Voice-to-Terminal',
      category: 'Preferences',
      icon: <Mic className={`w-4 h-4 ${voiceToTerminal ? 'text-[#a9a9aa]' : 'text-[#a3a3ab]'}`} />,
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
      icon: <ZoomIn className="w-4 h-4 text-[#a3a3ab]" />,
      action: () => increaseFontSize(),
    },
    {
      id: 'font-decrease',
      label: 'Decrease Terminal Font Size',
      category: 'View & Font',
      shortcut: 'Mod+Minus',
      icon: <ZoomOut className="w-4 h-4 text-[#a3a3ab]" />,
      action: () => decreaseFontSize(),
    },
    {
      id: 'font-reset',
      label: 'Reset Terminal Font Size to Default',
      category: 'View & Font',
      shortcut: 'Mod+0',
      icon: <RotateCcw className="w-4 h-4 text-[#a3a3ab]" />,
      action: () => resetFontSize(),
    },
    // Customization audit C1: the palette offers custom themes too (built-ins
    // plus any user-created palettes merged over them).
    ...Object.entries({ ...THEMES, ...useSettingsStore.getState().customThemes }).map(([key, theme]) => ({
      id: `theme-${key}`,
      label: `Switch Theme to ${theme.name}`,
      category: 'Themes',
      icon: <Palette className="w-4 h-4 text-[#a3a3ab]" />,
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
          className="fixed inset-0 z-50 bg-[#090a0c]/80 flex items-start justify-center pt-24 animate-fade-in"
        >
          <div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#111111] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] font-sans border border-[#4a4b50] text-white"
          >
            {/* Search Header */}
            <div className="flex items-center px-4 py-3.5 border-b border-[#4a4b50] bg-[#111111]">
              <Search className="w-4 h-4 text-[#5683da] mr-3 shrink-0" />
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
                className="w-full bg-transparent text-sm font-sans font-medium text-white placeholder:text-[#a9a9aa]/50 focus:outline-none"
              />
            </div>

            {/* Command List */}
            <div ref={listRef} className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 custom-scrollbar">
              {filteredCommands.length === 0 ? (
                 <div className="py-8 text-center text-xs font-mono text-[#a9a9aa]">No matching commands found</div>
              ) : (
                filteredCommands.map((cmd, idx) => (
                  <div
                    key={cmd.id}
                    data-selected={idx === selectedIndex}
                    onClick={() => runCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer text-xs transition-colors rounded-xl border ${
                      idx === selectedIndex
                        ? 'bg-[#303236] text-white border-[#5683da] shadow-sm'
                        : 'text-white hover:bg-[#303236] border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-[#090a0c] border border-[#4a4b50] text-[#5683da] shrink-0">
                        {cmd.icon}
                      </div>
                      <div className="truncate">
                        <div className="font-sans font-medium text-white tracking-tight truncate">{cmd.label}</div>
                        <div className="text-[10px] text-[#a9a9aa] font-mono uppercase tracking-wider">{cmd.category}</div>
                      </div>
                    </div>

                    {cmd.shortcut && (
                      <kbd className="px-2 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-[#a9a9aa] shrink-0 ml-2">{cmd.shortcut}</kbd>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[#4a4b50] bg-[#111111] text-[10px] font-mono text-[#a9a9aa]">
              <span><kbd className="px-1.5 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-white">↑</kbd> <kbd className="px-1.5 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-white">↓</kbd> navigate</span>
              <span><kbd className="px-1.5 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-white">↵</kbd> run</span>
              <span><kbd className="px-1.5 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-white">esc</kbd> close</span>
              {query.trim() === '' && recents.length > 0 && <span className="ml-auto text-[#a9a9aa] font-mono text-[10px]">Recently used first</span>}
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
          title="Create New Project Workspace"
          description="Enter a workspace name or click Browse to select a project directory."
          placeholder={`Workspace ${workspaces.length + 1}`}
          initialValue={`Workspace ${workspaces.length + 1}`}
          onBrowse={(path) => {
            const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
            const folderName = parts[parts.length - 1] || `Workspace ${workspaces.length + 1}`;
            const maxLen = useSettingsStore.getState().workspaceNameMaxLength;
            useWorkspaceStore.getState().createWorkspace(folderName.slice(0, maxLen), {
              activate: true,
              defaultCwd: path,
            });
            setShowWsModal(false);
            addToast({
              type: 'success',
              title: 'Workspace Created',
              description: `"${folderName}" is now active (${path}).`,
            });
          }}
          onSave={(name) => {
            requestCreateWorkspace(name.slice(0, useSettingsStore.getState().workspaceNameMaxLength));
            setShowWsModal(false);
          }}
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

      {/* Custom Command Manager Overlay */}
      {showCmdModal && (
        <div
          className="fixed inset-0 z-[60] bg-[#090a0c]/80 flex items-center justify-center p-4 animate-fade-in font-sans select-none"
          onClick={() => setShowCmdModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#111111] border border-[#4a4b50] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Manage custom commands"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#4a4b50] bg-[#111111]">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-[#5683da]" />
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Custom Commands</span>
              </div>
              <button
                onClick={() => setShowCmdModal(false)}
                className="p-1 rounded-full hover:bg-[#303236] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[55vh] overflow-y-auto custom-scrollbar">
              {/* Add form card */}
              <div className="space-y-3 rounded-2xl bg-[#303236] border border-[#4a4b50] p-5">
                <span className="text-[10px] font-mono font-semibold text-[#a9a9aa] uppercase tracking-wider block">New Command</span>
                <input
                  type="text"
                  value={cmdLabel}
                  onChange={(e) => setCmdLabel(e.target.value)}
                  placeholder="Label (e.g. Run tests)"
                  className="w-full h-9 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white placeholder-[#a9a9aa]/50 focus:outline-none focus:border-[#5683da] focus:ring-1 focus:ring-[#5683da] font-sans transition-colors"
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
                  className="w-full h-9 px-3.5 rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[13px] text-white placeholder-[#a9a9aa]/50 focus:outline-none focus:border-[#5683da] focus:ring-1 focus:ring-[#5683da] font-mono transition-colors"
                />
                <button
                  onClick={addUserCommand}
                  disabled={!cmdLabel.trim() || !cmdCommand.trim()}
                  className="w-full h-9 px-4 rounded-full bg-[#5683da] text-white hover:bg-[#5683da]/90 text-[13px] font-medium transition-all disabled:opacity-40 cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  Add Command
                </button>
              </div>

              {/* Command list */}
              {userCommands.length === 0 ? (
                <p className="text-[11px] text-[#a9a9aa] font-mono text-center py-4">
                  No custom commands yet — add one above.
                </p>
              ) : (
                userCommands.map((uc) => (
                  <div
                    key={uc.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-[#303236] border border-[#4a4b50] p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-white truncate">{uc.label}</div>
                      <div className="text-[11px] text-[#a9a9aa] font-mono truncate mt-0.5">$ {uc.command}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => runUserCommand(uc)}
                        title="Run in focused pane"
                        aria-label={`Run ${uc.label}`}
                        className="p-1.5 rounded-full bg-[#090a0c] hover:bg-[#111111] border border-[#4a4b50] text-[#5683da] hover:text-white transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPendingDeleteCmd(uc)}
                        title="Delete command"
                        aria-label={`Delete ${uc.label}`}
                        className="p-1.5 rounded-full bg-[#e06c75]/10 hover:bg-[#e06c75]/20 border border-[#e06c75]/30 text-[#e06c75] transition-colors cursor-pointer"
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

      {pendingDeleteCmd && (
        <ConfirmModal
          title="Delete Command?"
          message={`Are you sure you want to delete the custom command "${pendingDeleteCmd.label}"?`}
          confirmLabel="Delete Command"
          isDanger={true}
          onConfirm={() => {
            deleteUserCommand(pendingDeleteCmd.id);
            setPendingDeleteCmd(null);
            addToast({ type: 'success', title: 'Command deleted' });
          }}
          onClose={() => setPendingDeleteCmd(null)}
        />
      )}

      {pendingDeleteWs && (
        <ConfirmModal
          title={workspaces.length === 1 ? `Reset "${pendingDeleteWs.name}"?` : `Delete "${pendingDeleteWs.name}"?`}
          message={
            workspaces.length === 1
              ? 'This is your only workspace. Deleting it will terminate running processes and reset to a fresh default workspace. Continue?'
              : `This workspace and its running terminal processes will be permanently deleted. Continue?`
          }
          confirmLabel={workspaces.length === 1 ? 'Reset Workspace' : 'Delete Workspace'}
          isDanger={true}
          onConfirm={() => {
            useWorkspaceStore.getState().deleteWorkspace(pendingDeleteWs.id);
            setPendingDeleteWs(null);
            addToast({
              type: 'info',
              title: workspaces.length === 1 ? 'Workspace Reset' : 'Workspace Deleted',
              description: `"${pendingDeleteWs.name}" was ${workspaces.length === 1 ? 'reset' : 'deleted'}.`,
            });
          }}
          onClose={() => setPendingDeleteWs(null)}
        />
      )}

      {showFolderModal && (
        <InputModal
          title="Open New Pane in Folder"
          placeholder="/path/to/project"
          initialValue=""
          onBrowse={(path) => {
            const trimmed = path.trim();
            if (!trimmed) return;
            if (!focusedPaneId) {
              addToast({ type: 'warning', title: 'No pane selected', description: 'Click on a pane first to split it.' });
              return;
            }
            const ok = splitPane(focusedPaneId, 'horizontal');
            if (ok) {
              const newId = usePaneStore.getState().focusedPaneId;
              if (newId) setPaneCwd(newId, trimmed);
              addToast({ type: 'success', title: 'Pane opened', description: `New pane cwd: ${trimmed}` });
              setShowFolderModal(false);
            } else {
              notifyMaxPanes();
            }
          }}
          onSave={(path) => {
            const trimmed = path.trim();
            if (!trimmed) return;
            if (!focusedPaneId) {
              addToast({ type: 'warning', title: 'No pane selected', description: 'Click on a pane first to split it.' });
              return;
            }
            const ok = splitPane(focusedPaneId, 'horizontal');
            if (ok) {
              const newId = usePaneStore.getState().focusedPaneId;
              if (newId) setPaneCwd(newId, trimmed);
              addToast({ type: 'success', title: 'Pane opened', description: `New pane cwd: ${trimmed}` });
            } else {
              notifyMaxPanes();
            }
          }}
          onClose={() => setShowFolderModal(false)}
        />
      )}
    </>
  );
};
