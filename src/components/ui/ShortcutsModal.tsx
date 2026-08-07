import React, { useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useKeybindingsStore } from '@/store/useKeybindingsStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export const ShortcutsModal: React.FC = () => {
  const { isCheatsheetOpen, setCheatsheetOpen } = useUIStore();
  const { keybindings } = useKeybindingsStore();
  const panelRef = useFocusTrap<HTMLDivElement>(isCheatsheetOpen);

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
    { title: 'Navigation', ids: ['command-palette', 'open-settings', 'toggle-sidebar', 'cycle-focus-next', 'cycle-focus-prev', 'focus-left', 'focus-right', 'focus-up', 'focus-down'] },
    { title: 'Terminal', ids: ['search-terminal', 'clear-terminal'] },
    { title: 'Workspace', ids: ['new-workspace', 'switch-workspace-prev', 'switch-workspace-next'] },
    { title: 'View & Font', ids: ['font-increase', 'font-decrease', 'font-reset'] },
    { title: 'Global', ids: ['global-summon'] },
    { title: 'Voice', ids: ['voice-toggle'] },
  ];

  // UX audit P2 #10: everything shown here comes from the keybinding store, so
  // reassignments in Settings are reflected live and nothing hardcoded drifts.

  return (
    <div
      onClick={() => setCheatsheetOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts reference"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-zinc-900/95 border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[80vh] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-white/80" />
            <h2 className="text-xs font-bold font-space text-white/90 uppercase tracking-wider">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setCheatsheetOpen(false)}
            aria-label="Close shortcuts"
            className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-widest mb-2.5">{group.title}</h3>
              <div className="space-y-1.5">
                {group.ids.map((id) => {
                  const kb = keybindings[id];
                  if (!kb) return null;
                  return (
                    <div key={id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="font-space font-bold text-white/90">{kb.label}</span>
                      <kbd className="px-2 py-0.5 font-mono bg-white/5 border border-white/10 rounded-md text-zinc-300 text-[11px]">{kb.currentKey}</kbd>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed pt-2 border-t border-white/[0.08]">
            Reassign any shortcut in <span className="text-white font-space font-bold">Settings → Keybindings</span>. Press <kbd className="px-1.5 py-0.5 font-mono bg-white/5 border border-white/10 rounded text-[10px] text-zinc-300">Esc</kbd> to close this panel.
          </p>
        </div>
      </div>
    </div>
  );
};
