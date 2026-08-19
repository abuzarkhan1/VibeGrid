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

  return (
    <div
      onClick={() => setCheatsheetOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts reference"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#181924] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-white/80" />
            <h2 className="text-xs font-bold text-white/90 uppercase tracking-wider font-mono">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setCheatsheetOpen(false)}
            aria-label="Close shortcuts"
            className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {groups.map((group) => (
            <div key={group.title} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <h3 className="text-[10px] font-mono font-semibold text-white/40 uppercase tracking-wider">{group.title}</h3>
              <div className="space-y-1">
                {group.ids.map((id) => {
                  const kb = keybindings[id];
                  if (!kb) return null;
                  return (
                    <div key={id} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                      <span className="font-medium text-white/90">{kb.label}</span>
                      <kbd className="px-2.5 py-0.5 rounded-lg bg-black/40 border border-white/10 font-mono text-white/80 text-[11px]">{kb.currentKey}</kbd>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <p className="text-[11px] text-white/60 font-sans leading-relaxed pt-3 border-t border-white/[0.06]">
            Reassign any shortcut in <span className="text-white/90 font-medium">Settings → Keybindings</span>. Press <kbd className="px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[10px] font-mono text-white/90">Esc</kbd> to close.
          </p>
        </div>
      </div>
    </div>
  );
};
