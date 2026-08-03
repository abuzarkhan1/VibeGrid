import React, { useState } from 'react';
import { X, Type, Palette, Terminal as TerminalIcon, Layout, Keyboard as KeyboardIcon, Plus, Trash2, Edit2, RotateCcw } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore, THEMES } from '@/store/useSettingsStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';
import { InputModal } from './InputModal';
import { ConfirmModal } from './ConfirmModal';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, toggleSettings } = useUIStore();
  const {
    fontSize,
    fontFamily,
    themeName,
    scrollback,
    cursorBlink,
    cursorStyle,
    setFontSize,
    setFontFamily,
    setThemeName,
    setScrollback,
    setCursorBlink,
    setCursorStyle,
  } = useSettingsStore();

  const { workspaces, activeWorkspaceId, createWorkspace, renameWorkspace, deleteWorkspace, switchWorkspace } = useWorkspaceStore();
  const { keybindings, resetKeybindings } = useKeybindingsStore();

  const [activeTab, setActiveTab] = useState<'font' | 'theme' | 'terminal' | 'workspaces' | 'keyboard'>('font');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renameWsId, setRenameWsId] = useState<string | null>(null);
  const [deleteWsId, setDeleteWsId] = useState<string | null>(null);

  if (!isSettingsOpen) return null;

  const renameTarget = workspaces.find((w) => w.id === renameWsId);
  const deleteTarget = workspaces.find((w) => w.id === deleteWsId);

  return (
    <div
      onClick={toggleSettings}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-surfaceCard border border-forest/25 rounded-xl shadow-[0_0_50px_rgba(44,122,64,0.18)] overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-md"
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
                      ? 'border-forest-bright bg-forest/10 shadow-[0_0_16px_rgba(44,122,64,0.3)]'
                      : 'border-white/10 bg-black/40 hover:border-forest/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white/85">{theme.name}</span>
                    {themeName === key && <div className="w-2 h-2 rounded-full bg-forest-bright animate-pulse" />}
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
                  onChange={(e) => setCursorStyle(e.target.value as any)}
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
            </div>
          )}

          {activeTab === 'workspaces' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Active Workspaces ({workspaces.length})</span>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="install-box-glow px-3 py-1.5 rounded-lg bg-forest hover:bg-forest-bright text-xs font-medium text-white flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(44,122,64,0.35)]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>

              <div className="space-y-2">
                {workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                      ws.id === activeWorkspaceId
                        ? 'border-forest-bright bg-forest/10 shadow-[0_0_14px_rgba(44,122,64,0.25)]'
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
                          onClick={() => switchWorkspace(ws.id)}
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
                  onClick={resetKeybindings}
                  className="px-2.5 py-1 rounded border border-white/10 text-xs text-white/50 hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              <div className="space-y-2">
                {Object.values(keybindings).map((kb) => (
                  <div
                    key={kb.id}
                    className="p-3 rounded-lg border border-white/10 bg-black/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-white/85">{kb.label}</div>
                      <div className="text-[10px] text-white/35 font-mono">{kb.id}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <kbd className="px-2.5 py-1 font-mono bg-white/5 border border-white/10 rounded text-forest-light text-[11px]">
                        {kb.currentKey}
                      </kbd>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <InputModal
          title="Create New Workspace"
          placeholder={`Workspace ${workspaces.length + 1}`}
          initialValue={`Workspace ${workspaces.length + 1}`}
          onSave={(name) => createWorkspace(name.slice(0, 50))}
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
          message={`Are you sure you want to delete workspace "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete Workspace"
          isDanger={true}
          onConfirm={() => deleteWorkspace(deleteWsId)}
          onClose={() => setDeleteWsId(null)}
        />
      )}
    </div>
  );
};
