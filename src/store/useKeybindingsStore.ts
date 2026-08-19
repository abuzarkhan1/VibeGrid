import { create } from 'zustand';

interface Keybinding {
  id: string;
  label: string;
  category: string;
  defaultKey: string;
  currentKey: string;
}

interface KeybindingsState {
  keybindings: Record<string, Keybinding>;

  updateKeybinding: (id: string, newKey: string) => boolean;
  resetKeybindings: () => void;
  getKeybinding: (id: string) => string;
  matchesKeybinding: (e: KeyboardEvent, id: string) => boolean;
}

const defaultBindings: Record<string, Keybinding> = {
  'split-horizontal': {
    id: 'split-horizontal',
    label: 'Split Pane Horizontally',
    category: 'Pane Operations',
    defaultKey: 'Mod+D',
    currentKey: 'Mod+D',
  },
  'split-vertical': {
    id: 'split-vertical',
    label: 'Split Pane Vertically',
    category: 'Pane Operations',
    defaultKey: 'Mod+Shift+D',
    currentKey: 'Mod+Shift+D',
  },
  'close-pane': {
    id: 'close-pane',
    label: 'Close Focused Pane',
    category: 'Pane Operations',
    defaultKey: 'Mod+W',
    currentKey: 'Mod+W',
  },
  'toggle-maximize': {
    id: 'toggle-maximize',
    label: 'Maximize / Restore Pane',
    category: 'Pane Operations',
    defaultKey: 'Mod+Shift+Enter',
    currentKey: 'Mod+Shift+Enter',
  },
  'command-palette': {
    id: 'command-palette',
    label: 'Open Command Palette',
    category: 'Navigation',
    defaultKey: 'Mod+Shift+P',
    currentKey: 'Mod+Shift+P',
  },
  'open-settings': {
    id: 'open-settings',
    label: 'Open Settings Panel',
    category: 'Navigation',
    defaultKey: 'Mod+,',
    currentKey: 'Mod+,',
  },
  'search-terminal': {
    id: 'search-terminal',
    label: 'Find in Terminal',
    category: 'Terminal',
    defaultKey: 'Mod+F',
    currentKey: 'Mod+F',
  },
  'clear-terminal': {
    id: 'clear-terminal',
    label: 'Clear Terminal Scrollback',
    category: 'Terminal',
    defaultKey: 'Mod+K',
    currentKey: 'Mod+K',
  },
  'new-workspace': {
    id: 'new-workspace',
    label: 'Create New Workspace',
    category: 'Workspace',
    defaultKey: 'Mod+Shift+N',
    currentKey: 'Mod+Shift+N',
  },

  'toggle-sidebar': {
    id: 'toggle-sidebar',
    label: 'Toggle Workspace Sidebar',
    category: 'Navigation',
    defaultKey: 'Mod+B',
    currentKey: 'Mod+B',
  },
  'cycle-focus-next': {
    id: 'cycle-focus-next',
    label: 'Cycle Focus to Next Pane',
    category: 'Navigation',
    defaultKey: 'Mod+Tab',
    currentKey: 'Mod+Tab',
  },
  'cycle-focus-prev': {
    id: 'cycle-focus-prev',
    label: 'Cycle Focus to Previous Pane',
    category: 'Navigation',
    defaultKey: 'Mod+Shift+Tab',
    currentKey: 'Mod+Shift+Tab',
  },
  'focus-left': {
    id: 'focus-left',
    label: 'Move Focus Left',
    category: 'Navigation',
    defaultKey: 'Mod+ArrowLeft',
    currentKey: 'Mod+ArrowLeft',
  },
  'focus-right': {
    id: 'focus-right',
    label: 'Move Focus Right',
    category: 'Navigation',
    defaultKey: 'Mod+ArrowRight',
    currentKey: 'Mod+ArrowRight',
  },
  'focus-up': {
    id: 'focus-up',
    label: 'Move Focus Up',
    category: 'Navigation',
    defaultKey: 'Mod+ArrowUp',
    currentKey: 'Mod+ArrowUp',
  },
  'focus-down': {
    id: 'focus-down',
    label: 'Move Focus Down',
    category: 'Navigation',
    defaultKey: 'Mod+ArrowDown',
    currentKey: 'Mod+ArrowDown',
  },
  'switch-workspace-prev': {
    id: 'switch-workspace-prev',
    label: 'Switch to Previous Workspace',
    category: 'Workspace',
    defaultKey: 'Mod+Shift+ArrowLeft',
    currentKey: 'Mod+Shift+ArrowLeft',
  },
  'switch-workspace-next': {
    id: 'switch-workspace-next',
    label: 'Switch to Next Workspace',
    category: 'Workspace',
    defaultKey: 'Mod+Shift+ArrowRight',
    currentKey: 'Mod+Shift+ArrowRight',
  },
  'font-increase': {
    id: 'font-increase',
    label: 'Increase Terminal Font Size',
    category: 'View & Font',
    defaultKey: 'Mod+=',
    currentKey: 'Mod+=',
  },
  'font-decrease': {
    id: 'font-decrease',
    label: 'Decrease Terminal Font Size',
    category: 'View & Font',
    defaultKey: 'Mod+-',
    currentKey: 'Mod+-',
  },
  'font-reset': {
    id: 'font-reset',
    label: 'Reset Terminal Font Size',
    category: 'View & Font',
    defaultKey: 'Mod+0',
    currentKey: 'Mod+0',
  },

  'global-summon': {
    id: 'global-summon',
    label: 'Summon VibeGrid Window (system-wide)',
    category: 'Global',
    defaultKey: 'Mod+Shift+Space',
    currentKey: 'Mod+Shift+Space',
  },
  'voice-toggle': {
    id: 'voice-toggle',
    label: 'Toggle Voice-to-Terminal',
    category: 'Voice',
    defaultKey: 'Mod+Shift+V',
    currentKey: 'Mod+Shift+V',
  },
};

const STORAGE_KEY = 'vibegrid_keybindings_v1';

function loadStoredBindings(): Record<string, Keybinding> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultBindings, ...parsed };
    }
  } catch (e) {

  }
  return defaultBindings;
}

function normalizeAccel(key: string): string {
  return key
    .toLowerCase()
    .split('+')
    .map((part) => {
      const p = part.trim();
      if (p === 'cmd' || p === 'ctrl') return 'mod';
      return p;
    })
    .join('+');
}

export function matchesAccel(e: KeyboardEvent, accel: string): boolean {
  if (!accel) return false;
  const parts = accel.split('+').map((s) => s.trim().toLowerCase());
  const isModReq = parts.includes('mod') || parts.includes('cmd') || parts.includes('ctrl');
  const isShiftReq = parts.includes('shift');
  const isAltReq = parts.includes('alt');
  const keyReq = parts.find((p) => !['mod', 'cmd', 'ctrl', 'shift', 'alt'].includes(p));
  const isModPressed = e.metaKey || e.ctrlKey;
  const isShiftPressed = e.shiftKey;
  const isAltPressed = e.altKey;
  if (isModReq !== isModPressed) return false;
  if (isShiftReq !== isShiftPressed) return false;
  if (isAltReq !== isAltPressed) return false;
  if (!keyReq) return false;
  if (keyReq === 'enter' && e.code === 'Enter') return true;
  if (keyReq === 'comma' || keyReq === ',') return e.key === ',';
  if (keyReq.length === 1) {
    return e.key.toLowerCase() === keyReq || e.code.toLowerCase() === `key${keyReq}`;
  }
  // Arrow keys / Tab: match on the physical key (e.code) so Mod+Tab,
  // Mod+ArrowLeft, Mod+Shift+Tab etc. work regardless of keyboard layout.
  if (keyReq === 'arrowleft' || keyReq === 'arrowright' || keyReq === 'arrowup' || keyReq === 'arrowdown' || keyReq === 'tab') {
    return e.code.toLowerCase() === keyReq;
  }
  return e.code.toLowerCase() === keyReq;
}

export const useKeybindingsStore = create<KeybindingsState>((set, get) => ({
  keybindings: loadStoredBindings(),

  updateKeybinding: (id: string, newKey: string): boolean => {
    const { keybindings } = get();

    // Check for conflict (modifier aliases normalized — audit find 7)
    const conflict = Object.values(keybindings).find(
      (b) => b.id !== id && normalizeAccel(b.currentKey) === normalizeAccel(newKey)
    );

    if (conflict) {
      return false; // Conflict found
    }

    const updated = {
      ...keybindings,
      [id]: {
        ...keybindings[id],
        currentKey: newKey,
      },
    };

    set({ keybindings: updated });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore storage error
    }

    return true;
  },

  resetKeybindings: () => {
    set({ keybindings: defaultBindings });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  },

  getKeybinding: (id: string) => {
    return get().keybindings[id]?.currentKey || '';
  },

  matchesKeybinding: (e: KeyboardEvent, id: string) => {
    const binding = get().keybindings[id];
    if (!binding) return false;
    return matchesAccel(e, binding.currentKey);
  },
}));
