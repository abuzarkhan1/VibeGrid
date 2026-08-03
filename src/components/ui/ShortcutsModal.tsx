import React, { useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';

export const ShortcutsModal: React.FC = () => {
  const { isCheatsheetOpen, setCheatsheetOpen } = useUIStore();
  const { keybindings } = useKeybindingsStore();

  useEffect(() => {
    if (!isCheatsheetOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCheatsheetOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isCheatsheetOpen, setCheatsheetOpen]);

  if (!isCheatsheetOpen) return null;

  const groups = [
    { title: 'Pane Operations', ids: ['split-horizontal', 'split-vertical', 'close-pane', 'toggle-maximize'] },
    { title: 'Navigation', ids: ['command-palette', 'open-settings'] },
    { title: 'Terminal', ids: ['search-terminal', 'clear-terminal'] },
    { title: 'Workspace', ids: ['new-workspace'] },
  ];

  const additional: { label: string; keys: string }[] = [
    { label: 'Move focus between panes', keys: 'Mod + Arrow keys' },
    { label: 'Cycle focused pane', keys: 'Mod + Tab / Mod+Shift+Tab' },
    { label: 'Switch workspace', keys: 'Mod + Shift + ← / →' },
    { label: 'Zoom terminal font', keys: 'Mod + = / - / 0' },
    { label: 'Voice-to-Terminal', keys: 'Mod + Shift + V' },
    { label: 'Maximize / Restore', keys: 'Mod + Shift + Enter' },
  ];

  return (
    <div
      onClick={() => setCheatsheetOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts reference"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-surfaceCard border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col max-h-[80vh] backdrop-blur-md"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-forest-bright" />
            <h2 className="text-xs font-medium text-white/90 uppercase tracking-wider">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setCheatsheetOpen(false)}
            aria-label="Close shortcuts"
            className="p-1 rounded hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">{group.title}</h3>
              <div className="space-y-1.5">
                {group.ids.map((id) => {
                  const kb = keybindings[id];
                  if (!kb) return null;
                  return (
                    <div key={id} className="flex items-center justify-between text-xs">
                      <span className="text-white/70">{kb.label}</span>
                      <kbd className="px-2 py-0.5 font-mono bg-white/5 border border-white/10 rounded text-forest-light text-[11px]">{kb.currentKey}</kbd>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Quick Reference</h3>
            <div className="space-y-1.5">
              {additional.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-white/70">{item.label}</span>
                  <kbd className="px-2 py-0.5 font-mono bg-white/5 border border-white/10 rounded text-forest-light text-[11px]">{item.keys}</kbd>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-white/40 leading-relaxed pt-1 border-t border-white/[0.06]">
            Reassign any shortcut in <span className="text-forest-light">Settings → Keybindings</span>. Press <kbd className="px-1 py-0.5 font-mono bg-white/5 border border-white/10 rounded text-[10px]">Esc</kbd> to close this panel.
          </p>
        </div>
      </div>
    </div>
  );
};
