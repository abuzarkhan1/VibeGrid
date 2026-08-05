import { Macro } from '@/store/useSettingsStore';
import { usePaneStore } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * Customization audit C22: user-defined macros. A macro is a named sequence of
 * actions (from this catalog) + optional pauses, runnable from the command
 * palette or via an optional keybinding. Actions execute through the same
 * guarded store paths as the UI, so destructive ones (close pane) keep their
 * confirmations.
 */
export interface MacroAction {
  id: string;
  label: string;
  category: string;
  run: () => void;
}

export const MACRO_ACTIONS: MacroAction[] = [
  {
    id: 'split-horizontal',
    label: 'Split Pane Horizontally',
    category: 'Panes',
    run: () => {
      const ps = usePaneStore.getState();
      if (ps.focusedPaneId && !ps.splitPane(ps.focusedPaneId, 'horizontal')) {
        useUIStore.getState().notifyMaxPanes();
      }
    },
  },
  {
    id: 'split-vertical',
    label: 'Split Pane Vertically',
    category: 'Panes',
    run: () => {
      const ps = usePaneStore.getState();
      if (ps.focusedPaneId && !ps.splitPane(ps.focusedPaneId, 'vertical')) {
        useUIStore.getState().notifyMaxPanes();
      }
    },
  },
  {
    id: 'toggle-maximize',
    label: 'Maximize / Restore Focused Pane',
    category: 'Panes',
    run: () => usePaneStore.getState().toggleMaximize(),
  },
  {
    id: 'close-focused-pane',
    label: 'Close Focused Pane',
    category: 'Panes',
    run: () => {
      const focusedPaneId = usePaneStore.getState().focusedPaneId;
      if (focusedPaneId) useUIStore.getState().requestClosePane(focusedPaneId);
    },
  },
  {
    id: 'cycle-focus-next',
    label: 'Cycle Focus to Next Pane',
    category: 'Navigation',
    run: () => usePaneStore.getState().navigateFocus('next'),
  },
  {
    id: 'cycle-focus-prev',
    label: 'Cycle Focus to Previous Pane',
    category: 'Navigation',
    run: () => usePaneStore.getState().navigateFocus('prev'),
  },
  {
    id: 'switch-workspace-next',
    label: 'Switch to Next Workspace',
    category: 'Workspace',
    run: () => {
      const ws = useWorkspaceStore.getState();
      const visible = ws.workspaces.filter((w) => !w.archived);
      if (visible.length < 2) return;
      const idx = visible.findIndex((w) => w.id === ws.activeWorkspaceId);
      const next = visible[(idx + 1) % visible.length];
      if (next) useUIStore.getState().requestSwitchWorkspace(next.id);
    },
  },
  {
    id: 'switch-workspace-prev',
    label: 'Switch to Previous Workspace',
    category: 'Workspace',
    run: () => {
      const ws = useWorkspaceStore.getState();
      const visible = ws.workspaces.filter((w) => !w.archived);
      if (visible.length < 2) return;
      const idx = visible.findIndex((w) => w.id === ws.activeWorkspaceId);
      const prev = visible[(idx - 1 + visible.length) % visible.length];
      if (prev) useUIStore.getState().requestSwitchWorkspace(prev.id);
    },
  },
  {
    id: 'font-increase',
    label: 'Increase Terminal Font Size',
    category: 'View & Font',
    run: () => useSettingsStore.getState().increaseFontSize(),
  },
  {
    id: 'font-decrease',
    label: 'Decrease Terminal Font Size',
    category: 'View & Font',
    run: () => useSettingsStore.getState().decreaseFontSize(),
  },
  {
    id: 'font-reset',
    label: 'Reset Terminal Font Size',
    category: 'View & Font',
    run: () => useSettingsStore.getState().resetFontSize(),
  },
  {
    id: 'save-workspace',
    label: 'Save Workspace Now',
    category: 'Workspace',
    run: () => {
      useWorkspaceStore.getState().saveCurrentWorkspace();
    },
  },
  {
    id: 'open-settings',
    label: 'Open Settings Panel',
    category: 'Application',
    run: () => useUIStore.getState().toggleSettings(),
  },
  {
    id: 'open-palette',
    label: 'Open Command Palette',
    category: 'Application',
    run: () => useUIStore.getState().toggleCommandPalette(),
  },
  {
    id: 'reset-layout',
    label: 'Reset Grid to Single Terminal',
    category: 'Layout',
    run: () => useUIStore.getState().requestResetLayout(),
  },
];

/** Look up a catalog action by id (unknown ids are skipped at run time). */
export function getMacroAction(id: string): MacroAction | undefined {
  return MACRO_ACTIONS.find((a) => a.id === id);
}

/** One macro runs at a time — nested/interleaved runs would fight over focus. */
let runningMacro = false;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Between-step settle so the UI (focus moves, modal opens) keeps up. */
const SETTLE_MS = 120;

/**
 * Execute a macro's steps in order. Delay steps pause; action steps with an
 * unknown id are skipped (an imported/edited macro must never crash the app).
 * Runs fire-and-forget; a toast announces the run.
 */
export function runMacro(macro: Macro): void {
  if (runningMacro || !macro || macro.steps.length === 0) return;
  runningMacro = true;
  useUIStore.getState().addToast({ type: 'info', title: `Macro: ${macro.name}`, description: 'Running…' });

  const steps = [...macro.steps];
  const run = async () => {
    try {
      for (const step of steps) {
        if (step.type === 'delay') {
          await sleep(Math.max(0, step.ms ?? 300));
        } else if (step.type === 'action' && step.actionId) {
          const action = getMacroAction(step.actionId);
          if (action) {
            action.run();
            await sleep(SETTLE_MS);
          }
        }
      }
    } catch (e) {
      console.error('[VibeGrid] Macro aborted:', e);
    } finally {
      runningMacro = false;
    }
  };
  run();
}
