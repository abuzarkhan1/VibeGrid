import React, { useState, useEffect, useRef } from 'react';
import { Search, Columns, Rows, Maximize2, X, ZoomIn, ZoomOut, RotateCcw, Palette, Plus, Settings, Info, Edit3, Grid, FolderOpen, BookOpen, Mic, Download, Upload } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { usePaneStore } from '@/store/usePaneStore';
import { useSettingsStore, THEMES } from '@/store/useSettingsStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';
import { useVoiceStore } from '@/store/useVoiceStore';
import { fuzzyScore } from '@/lib/commandUtils';
import { writeToPty } from '@/lib/tauri';
import { InputModal } from './InputModal';

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
const MAX_RECENTS = 8;

function loadRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string').slice(0, MAX_RECENTS);
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
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)));
  } catch (e) {
    // ignore
  }
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onOpenAbout }) => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, toggleSettings, addToast, setCheatsheetOpen, requestClosePane, requestSwitchWorkspace, requestCreateWorkspace } = useUIStore();
  const { splitPane, toggleMaximize, resetLayout, setPaneTitle, setPaneCwd, focusedPaneId, paneCount, maxPanes, setLayoutPreset } = usePaneStore();
  const { increaseFontSize, decreaseFontSize, resetFontSize, setThemeName, voiceToTerminal, setVoiceToTerminal, exportSettings, importSettings } = useSettingsStore();
  const { workspaces } = useWorkspaceStore();
  const { keybindings } = useKeybindingsStore();
  // Gap 19: last transcription, re-playable from the palette. Must be called
  // before any early return (rules-of-hooks).
  const lastTranscript = useVoiceStore((s) => s.lastTranscript);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showWsModal, setShowWsModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [recents, setRecents] = useState<string[]>(loadRecents);
  const importInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);



  if (!isCommandPaletteOpen && !showWsModal && !showTitleModal && !showFolderModal) return null;

  const presets: (1 | 2 | 4 | 6 | 8 | 16)[] = [1, 2, 4, 6, 8, 16];

  const runCommand = (cmd: CommandItem) => {
    const next = [cmd.id, ...recents.filter((r) => r !== cmd.id)].slice(0, MAX_RECENTS);
    setRecents(next);
    saveRecents(next);
    cmd.action();
    setCommandPaletteOpen(false);
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
      action: () => setLayoutPreset(p),
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
            addToast({ type: 'warning', title: 'Maximum Pane Limit Reached', description: `VibeGrid limits total active panes to ${maxPanes}.` });
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
            addToast({ type: 'warning', title: 'Maximum Pane Limit Reached', description: `VibeGrid limits total active panes to ${maxPanes}.` });
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
    ...workspaces.map((ws) => ({
      id: `ws-switch-${ws.id}`,
      label: `Switch to Workspace: ${ws.name}`,
      category: 'Workspace',
      icon: <Info className="w-4 h-4 text-forest-bright" />,
      action: () => requestSwitchWorkspace(ws.id),
    })),
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
    ...Object.values(THEMES).map((theme) => ({
      id: `theme-${theme.name}`,
      label: `Switch Theme to ${theme.name}`,
      category: 'Themes',
      icon: <Palette className="w-4 h-4 text-forest-light" />,
      action: () => setThemeName(Object.keys(THEMES).find((key) => THEMES[key].name === theme.name) || 'vibeDark'),
    })),
    {
      id: 'reset-grid',
      label: 'Reset Grid to Single Terminal Pane',
      category: 'Workspace',
      icon: <RotateCcw className="w-4 h-4 text-amber-400" />,
      action: () => resetLayout(),
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
        const paneId = usePaneStore.getState().focusedPaneId;
        const nodes = usePaneStore.getState().root;
        // Find the terminal pane id for the focused layout node
        const find = (node: import('@/types/layout').PaneNode | null): string | undefined => {
          if (!node) return undefined;
          if (node.id === paneId && node.type === 'terminal') return node.paneId;
          if (node.type === 'split') return find(node.children[0]) || find(node.children[1]);
          return undefined;
        };
        const ptyId = find(nodes);
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
          onSave={(name) => requestCreateWorkspace(name.slice(0, 50))}
          onClose={() => setShowWsModal(false)}
        />
      )}

      {showTitleModal && focusedPaneId && (
        <InputModal
          title="Edit Focused Pane Title"
          placeholder="Custom Pane Title"
          initialValue=""
          onSave={(title) => setPaneTitle(focusedPaneId, title.slice(0, 40))}
          onClose={() => setShowTitleModal(false)}
        />
      )}

      {showFolderModal && (
        <InputModal
          title="Open New Pane in Folder"
          placeholder="/path/to/project"
          initialValue=""
          onSave={(path) => {
            const trimmed = path.trim();
            if (trimmed && focusedPaneId) {
              const ok = splitPane(focusedPaneId, 'horizontal');
              if (ok) {
                const newId = usePaneStore.getState().focusedPaneId;
                if (newId) setPaneCwd(newId, trimmed);
                addToast({ type: 'success', title: 'Pane opened', description: `New pane cwd: ${trimmed}` });
              } else {
                addToast({ type: 'warning', title: 'Maximum Pane Limit Reached', description: `VibeGrid limits total active panes to ${maxPanes}.` });
              }
            }
          }}
          onClose={() => setShowFolderModal(false)}
        />
      )}
    </>
  );
};
