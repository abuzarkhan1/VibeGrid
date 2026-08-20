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
      className="fixed inset-0 z-50 bg-[#090a0c]/80 flex items-center justify-center p-4 animate-fade-in font-sans select-none text-white"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#111111] border border-[#4a4b50] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#4a4b50] bg-[#111111]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#090a0c] border border-[#4a4b50] flex items-center justify-center text-[#5683da] shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setCheatsheetOpen(false)}
            aria-label="Close shortcuts"
            className="p-1 rounded-full hover:bg-[#303236] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {groups.map((group) => (
            <div key={group.title} className="p-4 rounded-2xl bg-[#303236] border border-[#4a4b50] space-y-2">
              <h3 className="text-[10px] font-mono font-semibold text-[#a9a9aa] uppercase tracking-wider">{group.title}</h3>
              <div className="space-y-1">
                {group.ids.map((id) => {
                  const kb = keybindings[id];
                  if (!kb) return null;
                  return (
                    <div key={id} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl hover:bg-[#090a0c] transition-colors">
                      <span className="font-medium text-white">{kb.label}</span>
                      <kbd className="px-2.5 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] font-mono text-[#5683da] text-[11px]">{kb.currentKey}</kbd>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#4a4b50] bg-[#111111]">
          <span className="text-[11px] text-[#a9a9aa] font-mono">
            Customize in <span className="text-white">Settings → Keybindings</span>
          </span>
          <button
            onClick={() => setCheatsheetOpen(false)}
            className="h-8 flex items-center px-4 rounded-full bg-[#303236] hover:bg-[#303236] border border-[#4a4b50] hover:border-[#5683da] text-[#a9a9aa] hover:text-white text-xs font-medium transition-all active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
