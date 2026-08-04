import { create } from 'zustand';
import { usePaneStore, getTerminalNodes } from './usePaneStore';
import { PaneNode, TerminalNode } from '@/types/layout';
import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '@/lib/tauri';

export interface Workspace {
  id: string;
  name: string;
  layout: PaneNode;
  createdAt: number;
  updatedAt: number;
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  isLoading: boolean;

  // Actions
  createWorkspace: (name: string, opts?: { activate?: boolean }) => string;
  switchWorkspace: (id: string) => void;
  renameWorkspace: (id: string, newName: string) => void;
  deleteWorkspace: (id: string) => void;
  loadWorkspaces: () => Promise<void>;
  saveCurrentWorkspace: () => Promise<void>;
}

const defaultWorkspaceId = 'default-workspace';
const ACTIVE_WS_STORAGE_KEY = 'vibegrid.active-workspace';

function persistActiveWorkspaceId(id: string) {
  try {
    localStorage.setItem(ACTIVE_WS_STORAGE_KEY, id);
  } catch {
    // storage unavailable (web preview / privacy mode) — non-fatal
  }
}

function readStoredActiveWorkspaceId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_WS_STORAGE_KEY);
  } catch {
    return null;
  }
}

const defaultWorkspace: Workspace = {
  id: defaultWorkspaceId,
  name: 'Default Workspace',
  layout: {
    type: 'terminal',
    id: `term-${Date.now()}`,
    title: 'Terminal 1',
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

/**
 * Strip runtime-only state from a layout tree before persisting it.
 *
 * `paneId` is the live PTY UUID from the Rust backend — it is meaningless
 * after a restart (the process is gone) and after a workspace switch (the
 * process was killed). Persisting it would make TerminalPane reuse a dead PTY
 * instead of spawning a fresh shell, so it must never be written to disk or
 * stored in a restored workspace. Titles, cwds and shells are kept.
 */
function sanitizeLayout(node: PaneNode): PaneNode {
  // Defensive: a persisted layout could be malformed (e.g. hand-edited JSON) —
  // never crash the store on it, fall back to a safe single terminal.
  if (node?.type === 'terminal') {
    const rest = { ...node };
    delete (rest as { paneId?: string }).paneId;
    return rest as TerminalNode;
  }
  if (node?.type === 'split' && Array.isArray(node.children) && node.children.length === 2) {
    return {
      ...node,
      children: [sanitizeLayout(node.children[0]), sanitizeLayout(node.children[1])],
    };
  }
  // Unknown shape — safe fresh terminal (unique id, matching the codebase
  // pattern so multiple malformed workspaces can't collide in the same ms)
  return {
    type: 'terminal',
    id: `term-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    title: 'Terminal 1',
  };
}

/**
 * Apply a (sanitized) persisted layout to the pane store, reconstructing the
 * derived state (paneCount, layoutMode, focusedPaneId) so the UI is correct
 * after a restart or workspace switch — the layout tree alone doesn't carry
 * those (persistence-fidelity audit fix).
 */
function applyLayoutToPaneStore(layout: PaneNode) {
  const terminals = getTerminalNodes(layout);
  if (terminals.length === 0) {
    // Malformed/empty persisted tree — render a single fresh terminal instead
    // of a blank grid with no focusable pane.
    const fallback: TerminalNode = { type: 'terminal', id: `term-${Date.now()}-${Math.floor(Math.random() * 10000)}`, title: 'Terminal 1' };
    usePaneStore.setState({
      root: fallback,
      focusedPaneId: fallback.id,
      maximizedPaneId: null,
      paneCount: 1,
      layoutMode: 'preset',
      presetCount: 1,
    });
    return;
  }
  const firstTermId = terminals[0]?.id ?? null;
  usePaneStore.setState({
    root: layout,
    focusedPaneId: firstTermId,
    maximizedPaneId: null,
    paneCount: terminals.length,
    layoutMode: layout.type === 'terminal' ? 'preset' : 'custom',
    // presetCount only makes sense for the preset grids (1/2/4/6/8/16); a
    // custom split tree uses 1 so the value is always valid.
    presetCount: 1,
  });
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [defaultWorkspace],
  activeWorkspaceId: defaultWorkspaceId,
  isLoading: true,

  createWorkspace: (name: string, opts?: { activate?: boolean }): string => {
    const activate = opts?.activate !== false;
    const id = `ws-${Date.now()}`;
    const newWs: Workspace = {
      id,
      name,
      layout: {
        type: 'terminal',
        id: `term-${Date.now()}`,
        title: 'Terminal 1',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      workspaces: [...state.workspaces, newWs],
      activeWorkspaceId: activate ? id : state.activeWorkspaceId,
    }));

    // When deferred (guarded create), DON'T touch the pane store: the current
    // workspace keeps its live layout and processes until the user confirms the
    // switch — activating now would silently kill them.
    if (activate) {
      applyLayoutToPaneStore(newWs.layout);
    }

    persistActiveWorkspaceId(get().activeWorkspaceId);
    get().saveCurrentWorkspace();
    return id;
  },

  switchWorkspace: (id: string) => {
    const { workspaces, activeWorkspaceId } = get();
    if (id === activeWorkspaceId) return;

    // Save active workspace first
    get().saveCurrentWorkspace();

    const targetWs = workspaces.find((w) => w.id === id);
    if (!targetWs) return;

    set({ activeWorkspaceId: id });
    persistActiveWorkspaceId(id);

    // Restore target workspace layout in pane store. The stored layout is
    // always sanitized (no paneId), so the panes spawn fresh shells — the old
    // PTYs were killed when this workspace was left (see sanitizeLayout).
    applyLayoutToPaneStore(targetWs.layout);
  },

  renameWorkspace: (id: string, newName: string) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, name: newName, updatedAt: Date.now() } : w)),
    }));
    get().saveCurrentWorkspace();
  },

  deleteWorkspace: (id: string) => {
    const { workspaces, activeWorkspaceId } = get();
    if (workspaces.length <= 1) return; // Retain at least 1 workspace

    const remaining = workspaces.filter((w) => w.id !== id);
    let nextActiveId = activeWorkspaceId;

    if (activeWorkspaceId === id) {
      nextActiveId = remaining[0].id;
      applyLayoutToPaneStore(remaining[0].layout);
    }

    set({
      workspaces: remaining,
      activeWorkspaceId: nextActiveId,
    });
    persistActiveWorkspaceId(nextActiveId);

    if (isTauri()) {
      invoke('delete_workspace', { id }).catch(console.error);
    }
  },

  loadWorkspaces: async () => {
    if (!isTauri()) {
      set({ isLoading: false });
      return;
    }
    try {
      // The Rust WorkspaceData struct serializes the layout as a `layout`
      // JSON object (serde_json::Value) — NOT a string. Read it directly.
      const list = await invoke<
        Array<{ id: string; name: string; layout: PaneNode; created_at: number; updated_at: number }>
      >('list_workspaces');
      if (list && list.length > 0) {
        const loaded: Workspace[] = list.map((w) => ({
          id: w.id,
          name: w.name,
          layout: sanitizeLayout(w.layout),
          createdAt: w.created_at,
          updatedAt: w.updated_at,
        }));

        // Restore the workspace the user was actually in last session (audit
        // fix): the disk list is ordered by most-recently-updated, but the
        // active choice is only known if we persisted it.
        const storedId = readStoredActiveWorkspaceId();
        const storedIndex = storedId ? loaded.findIndex((w) => w.id === storedId) : -1;
        const activeId = storedIndex !== -1 ? loaded[storedIndex].id : loaded[0].id;
        const activeLayout = loaded.find((w) => w.id === activeId)?.layout ?? loaded[0].layout;

        set({
          workspaces: loaded,
          activeWorkspaceId: activeId,
        });
        persistActiveWorkspaceId(activeId);
        applyLayoutToPaneStore(activeLayout);
      }
    } catch (e) {
      console.warn('[WorkspaceStore] Load workspaces notice:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  saveCurrentWorkspace: async () => {
    // Never persist during the initial load window: until loadWorkspaces()
    // resolves, the in-memory state is still the DEFAULT workspace, and saving
    // now would overwrite the persisted (renamed, multi-pane) workspace on disk
    // — re-introducing the exact "name reverts / terminals gone" bug.
    if (get().isLoading) return;

    const { workspaces, activeWorkspaceId } = get();
    const currentRoot = usePaneStore.getState().root;

    const updatedWorkspaces = workspaces.map((w) => {
      if (w.id === activeWorkspaceId) {
        return {
          ...w,
          // Persist a sanitized layout (no runtime paneId) so both the disk
          // copy and the in-memory restore spawn fresh shells later.
          layout: sanitizeLayout(currentRoot),
          updatedAt: Date.now(),
        };
      }
      return w;
    });

    set({ workspaces: updatedWorkspaces });

    const activeWs = updatedWorkspaces.find((w) => w.id === activeWorkspaceId);
    if (activeWs && isTauri()) {
      try {
        // Send `layout` as the structured object — matches the Rust
        // WorkspaceData field (previously `layout_json` string was sent and
        // Rust rejected the save with "missing field `layout`").
        await invoke('save_workspace', {
          workspace: {
            id: activeWs.id,
            name: activeWs.name,
            layout: activeWs.layout,
            created_at: activeWs.createdAt,
            updated_at: activeWs.updatedAt,
          },
        });
      } catch (e) {
        console.error('[WorkspaceStore] Save workspace failed:', e);
      }
    }
  },
}));
