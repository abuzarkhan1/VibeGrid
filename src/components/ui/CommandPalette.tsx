import React, { useState, useEffect, useRef } from 'react';
import { Search, Columns, Rows, Maximize2, X, ZoomIn, ZoomOut, RotateCcw, Palette, Plus, Settings, Info, Edit3, Grid } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { usePaneStore } from '@/store/usePaneStore';
import { useSettingsStore, THEMES } from '@/store/useSettingsStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
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

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onOpenAbout }) => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, toggleSettings, addToast } = useUIStore();
  const { splitPane, closePane, toggleMaximize, resetLayout, setPaneTitle, focusedPaneId, paneCount, maxPanes, setLayoutPreset } = usePaneStore();
  const { increaseFontSize, decreaseFontSize, resetFontSize, setThemeName } = useSettingsStore();
  const { createWorkspace, switchWorkspace, workspaces } = useWorkspaceStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showWsModal, setShowWsModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen && !showWsModal && !showTitleModal) return null;

  const presets: (1 | 2 | 4 | 6 | 8 | 16)[] = [1, 2, 4, 6, 8, 16];

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
      id: 'split-horizontal',
      label: 'Split Pane Horizontally (Side by Side)',
      category: 'Pane Operations',
      shortcut: 'Cmd/Ctrl + D',
      icon: <Columns className="w-4 h-4 text-forest-bright" />,
      action: () => {
        if (focusedPaneId) {
          const success = splitPane(focusedPaneId, 'horizontal');
          if (!success && paneCount >= maxPanes) {
            addToast({
              type: 'warning',
              title: 'Maximum Pane Limit Reached',
              description: `VibeGrid limits total active panes to ${maxPanes}.`,
            });
          }
        }
      },
    },
    {
      id: 'split-vertical',
      label: 'Split Pane Vertically (Stacked)',
      category: 'Pane Operations',
      shortcut: 'Cmd/Ctrl + Shift + D',
      icon: <Rows className="w-4 h-4 text-forest-bright" />,
      action: () => {
        if (focusedPaneId) {
          const success = splitPane(focusedPaneId, 'vertical');
          if (!success && paneCount >= maxPanes) {
            addToast({
              type: 'warning',
              title: 'Maximum Pane Limit Reached',
              description: `VibeGrid limits total active panes to ${maxPanes}.`,
            });
          }
        }
      },
    },
    {
      id: 'maximize-pane',
      label: 'Toggle Maximize / Restore Focused Pane',
      category: 'Pane Operations',
      shortcut: 'Cmd/Ctrl + Shift + Enter',
      icon: <Maximize2 className="w-4 h-4 text-forest-bright" />,
      action: () => toggleMaximize(),
    },
    {
      id: 'close-pane',
      label: 'Close Focused Pane',
      category: 'Pane Operations',
      shortcut: 'Cmd/Ctrl + W',
      icon: <X className="w-4 h-4 text-rose-400" />,
      action: () => {
        if (focusedPaneId) closePane(focusedPaneId);
      },
    },
    {
      id: 'new-workspace',
      label: 'Create New Workspace',
      category: 'Workspace',
      shortcut: 'Cmd/Ctrl + Shift + N',
      icon: <Plus className="w-4 h-4 text-forest-bright" />,
      action: () => setShowWsModal(true),
    },
    ...workspaces.map((ws) => ({
      id: `ws-switch-${ws.id}`,
      label: `Switch to Workspace: ${ws.name}`,
      category: 'Workspace',
      icon: <Info className="w-4 h-4 text-forest-bright" />,
      action: () => switchWorkspace(ws.id),
    })),
    {
      id: 'open-settings',
      label: 'Open Settings Panel',
      category: 'Preferences',
      shortcut: 'Cmd/Ctrl + ,',
      icon: <Settings className="w-4 h-4 text-white/60" />,
      action: () => toggleSettings(),
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
      id: 'font-increase',
      label: 'Increase Terminal Font Size',
      category: 'View & Font',
      shortcut: 'Cmd/Ctrl + Plus',
      icon: <ZoomIn className="w-4 h-4 text-forest-light" />,
      action: () => increaseFontSize(),
    },
    {
      id: 'font-decrease',
      label: 'Decrease Terminal Font Size',
      category: 'View & Font',
      shortcut: 'Cmd/Ctrl + Minus',
      icon: <ZoomOut className="w-4 h-4 text-forest-light" />,
      action: () => decreaseFontSize(),
    },
    {
      id: 'font-reset',
      label: 'Reset Terminal Font Size to Default',
      category: 'View & Font',
      shortcut: 'Cmd/Ctrl + 0',
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

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

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
        filteredCommands[selectedIndex].action();
        setCommandPaletteOpen(false);
      }
    }
  };

  return (
    <>
      {isCommandPaletteOpen && (
        <div
          onClick={() => setCommandPaletteOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-surfaceCard border border-forest/30 rounded-xl shadow-[0_0_40px_rgba(44,122,64,0.15)] overflow-hidden flex flex-col max-h-[70vh] backdrop-blur-md"
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
                placeholder="Type a command or search actions... (Esc to cancel)"
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
                    onClick={() => {
                      cmd.action();
                      setCommandPaletteOpen(false);
                    }}
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
                      <kbd className="px-2 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 rounded text-forest-light">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showWsModal && (
        <InputModal
          title="Create New Workspace"
          placeholder={`Workspace ${workspaces.length + 1}`}
          initialValue={`Workspace ${workspaces.length + 1}`}
          onSave={(name) => createWorkspace(name.slice(0, 50))}
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
    </>
  );
};
