import { create } from 'zustand';
import { usePaneStore, getTerminalNodes, killPanesInLayout } from './usePaneStore';
import { PaneNode, TerminalNode } from '@/types/layout';
import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '@/lib/tauri';

interface Workspace {
  id: string;
  name: string;
  layout: PaneNode;
  createdAt: number;
  updatedAt: number;
  /** On-disk schema version (audit improvement) — kept in sync with Rust. */
  version: number;
  /**
   * In-memory-only view state captured when the workspace is left, restored
   * when it is switched back to (workspace isolation): which pane was focused,
   * whether one was maximized, and the grid mode/preset identity so preset
   * grids come back as presets (not as custom split trees). Not persisted to
   * disk — paneIds don't survive a restart, so these ids would be stale.
   */
  view?: {
    focusedPaneId: string | null;
    maximizedPaneId: string | null;
    layoutMode: 'preset' | 'custom';
    presetCount: 1 | 2 | 4 | 6 | 8 | 16;
  };
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
  /** Duplicate a workspace's layout into a new workspace (fresh shells — the
   * copy is sanitized so it never shares the original's live paneIds). UX
   * audit P3: no way to stage a copy of a workspace before. */
  duplicateWorkspace: (id: string) => string;
  /** Reorder a workspace in the list (UX audit P3: workspaces were unordered). */
  moveWorkspace: (id: string, direction: -1 | 1) => void;
  loadWorkspaces: () => Promise<void>;
  saveCurrentWorkspace: () => Promise<void>;
}

const defaultWorkspaceId = 'default-workspace';

// Collision-proof workspace id: two workspaces created in the same millisecond
// used to collide on `ws-${Date.now()}` (audit: create+duplicate in the same
// tick silently overwrote one file). Adds a random suffix. Charset stays
// [a-zA-Z0-9_-] to match the Rust-side is_safe_id validation.
function newWorkspaceId(): string {
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
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
  version: 1,
};

/**
 * Strip runtime-only state from a layout tree before persisting it.
 *
 * `paneId` is the live PTY UUID from the Rust backend — it is meaningless
 * after a restart (the process is gone), so it must never be written to disk.
 * In-memory workspace layouts KEEP their paneIds (workspace isolation: hidden
 * workspaces' terminals stay alive and are re-attached on switch-back); only
 * the on-disk copy is sanitized. Titles, cwds and shells are kept.
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
 * Single source of truth for the on-disk workspace payload: a SANITIZED copy
 * (no runtime paneId) of the given layout. Kept in one place so every caller
 * (switch, create, autosave) writes the exact same shape Rust expects.
 */
function persistWorkspaceToDisk(ws: Workspace, layout: PaneNode) {
  if (!isTauri()) return;
  invoke('save_workspace', {
    workspace: {
      id: ws.id,
      name: ws.name,
      layout: sanitizeLayout(layout),
      created_at: ws.createdAt,
      updated_at: Date.now(),
      version: ws.version,
    },
  }).catch(console.error);
}

/**
 * Apply a (sanitized) persisted layout to the pane store, reconstructing the
 * derived state (paneCount, layoutMode, focusedPaneId) so the UI is correct
 * after a restart or workspace switch — the layout tree alone doesn't carry
 * those (persistence-fidelity audit fix).
 */
/**
 * Capture the pane store's current view state (focused/maximized pane + grid
 * mode identity) so it can be restored when the user switches back.
 */
function capturePaneView() {
  const ps = usePaneStore.getState();
  return {
    focusedPaneId: ps.focusedPaneId,
    maximizedPaneId: ps.maximizedPaneId,
    layoutMode: ps.layoutMode,
    presetCount: ps.presetCount,
  };
}

function applyLayoutToPaneStore(layout: PaneNode, view?: Workspace['view']) {
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
  // Restore the saved view when available (workspace isolation). Guard each id
  // so a stale/invalid id (e.g. a pane closed since) never leaves the UI with
  // no focused pane or a maximized pane that no longer exists.
  const focusedId = view?.focusedPaneId && terminals.some((t) => t.id === view.focusedPaneId) ? view.focusedPaneId : firstTermId;
  const maximizedId = view?.maximizedPaneId && terminals.some((t) => t.id === view.maximizedPaneId) ? view.maximizedPaneId : null;
  const layoutMode = view?.layoutMode ?? (layout.type === 'terminal' ? 'preset' : 'custom');
  const presetCount = view?.presetCount ?? 1;
  usePaneStore.setState({
    root: layout,
    focusedPaneId: focusedId,
    maximizedPaneId: maximizedId,
    paneCount: terminals.length,
    layoutMode,
    presetCount,
  });
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [defaultWorkspace],
  activeWorkspaceId: defaultWorkspaceId,
  isLoading: true,

  createWorkspace: (name: string, opts?: { activate?: boolean }): string => {
    const activate = opts?.activate !== false;
    const id = newWorkspaceId();
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
      version: 1,
    };

    // Workspace isolation: before the pane store switches to the fresh
    // workspace, capture the CURRENT workspace's live layout (with paneIds) and
    // view state so its terminals keep running in the background and its view
    // is restored on switch-back — never kill them. Also persist a sanitized
    // copy to disk, mirroring switchWorkspace, so the leaving workspace's
    // latest layout isn't lost if the app quits before the user ever switches
    // back.
    if (activate) {
      const leavingRoot = usePaneStore.getState().root;
      const leavingView = capturePaneView();
      const leavingWs = get().workspaces.find((w) => w.id === get().activeWorkspaceId);
      set((state) => ({
        workspaces: state.workspaces.map((w) =>
          w.id === state.activeWorkspaceId ? { ...w, layout: leavingRoot, view: leavingView, updatedAt: Date.now() } : w
        ),
      }));
      if (leavingWs) persistWorkspaceToDisk(leavingWs, leavingRoot);
    }

    set((state) => ({
      workspaces: [...state.workspaces, newWs],
      activeWorkspaceId: activate ? id : state.activeWorkspaceId,
    }));

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

    // Workspace isolation: capture the LEAVING workspace's live layout (with
    // paneIds) and view state into its in-memory record so its terminals keep
    // running in the background and its view is restored on switch-back.
    const leavingRoot = usePaneStore.getState().root;
    const leavingView = capturePaneView();
    const leavingWs = workspaces.find((w) => w.id === activeWorkspaceId);
    const now = Date.now();
    const updatedWorkspaces = workspaces.map((w) =>
      w.id === activeWorkspaceId ? { ...w, layout: leavingRoot, view: leavingView, updatedAt: now } : w
    );

    const targetWs = updatedWorkspaces.find((w) => w.id === id);
    if (!targetWs) return;

    set({ workspaces: updatedWorkspaces, activeWorkspaceId: id });
    persistActiveWorkspaceId(id);

    // Persist a SANITIZED copy of the leaving workspace to disk (paneId is
    // meaningless after a restart — fresh shells spawn on load).
    if (leavingWs) persistWorkspaceToDisk(leavingWs, leavingRoot);

    // Restore the target's LIVE layout — panes that still have paneIds
    // re-attach to their running PTYs instead of spawning fresh shells — and
    // its saved view (focused/maximized pane, preset grid identity).
    applyLayoutToPaneStore(targetWs.layout, targetWs.view);
  },

  renameWorkspace: (id: string, newName: string) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, name: newName, updatedAt: Date.now() } : w)),
    }));
    const renamed = get().workspaces.find((w) => w.id === id);
    // Persist the RENAMED workspace itself to disk — saveCurrentWorkspace only
    // persists the ACTIVE workspace, so renaming a non-active workspace from
    // the dropdown/settings would otherwise silently revert on next launch.
    if (renamed) persistWorkspaceToDisk(renamed, renamed.layout);
  },

  duplicateWorkspace: (id: string): string => {
    const { workspaces, activeWorkspaceId } = get();
    const src = workspaces.find((w) => w.id === id);
    if (!src) return '';
    const newId = newWorkspaceId();
    const copy: Workspace = {
      id: newId,
      name: `${src.name} Copy`,
      // Sanitized copy → fresh shells, never shared with the original's PTYs.
      layout: sanitizeLayout(src.layout),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    };
    // If we duplicated the ACTIVE workspace, capture its live state into its
    // in-memory record first (isolation) so nothing is lost on the switch.
    if (activeWorkspaceId === id) {
      const leavingRoot = usePaneStore.getState().root;
      const leavingView = capturePaneView();
      set((state) => ({
        workspaces: state.workspaces.map((w) =>
          w.id === id ? { ...w, layout: leavingRoot, view: leavingView, updatedAt: Date.now() } : w
        ),
      }));
    }
    set((state) => ({ workspaces: [...state.workspaces, copy] }));
    persistWorkspaceToDisk(copy, copy.layout);
    return newId;
  },

  moveWorkspace: (id: string, direction: -1 | 1) => {
    const { workspaces } = get();
    const idx = workspaces.findIndex((w) => w.id === id);
    const target = idx + direction;
    if (idx === -1 || target < 0 || target >= workspaces.length) return;
    const next = [...workspaces];
    [next[idx], next[target]] = [next[target], next[idx]];
    set({ workspaces: next });
  },

  deleteWorkspace: (id: string) => {
    const { workspaces, activeWorkspaceId } = get();
    if (workspaces.length <= 1) return; // Retain at least 1 workspace

    // Workspace isolation: only an EXPLICIT delete terminates a workspace's
    // background terminals (they survive switches). Kill its live panes.
    if (activeWorkspaceId === id) {
      // Deleting the ACTIVE workspace: its panes live in the pane store root
      // (the in-memory record may be stale) — kill the live root once.
      killPanesInLayout(usePaneStore.getState().root);
    } else {
      const doomed = workspaces.find((w) => w.id === id);
      if (doomed) killPanesInLayout(doomed.layout);
    }

    const remaining = workspaces.filter((w) => w.id !== id);
    let nextActiveId = activeWorkspaceId;

    if (activeWorkspaceId === id) {
      nextActiveId = remaining[0].id;
      applyLayoutToPaneStore(remaining[0].layout, remaining[0].view);
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
        Array<{ id: string; name: string; layout: PaneNode; created_at: number; updated_at: number; version?: number }>
      >('list_workspaces');
      if (list && list.length > 0) {
        const loaded: Workspace[] = list.map((w) => ({
          id: w.id,
          name: w.name,
          layout: sanitizeLayout(w.layout),
          createdAt: w.created_at,
          updatedAt: w.updated_at,
          version: w.version ?? 1,
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
          // In-memory: keep the LIVE layout (with paneIds) so switching back
          // re-attaches to the still-running terminals (isolation). Keep the
          // view state fresh too so a switch-away captures the current state.
          layout: currentRoot,
          view: capturePaneView(),
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
        // WorkspaceData field. Only the DISK copy is sanitized (no paneId);
        // the in-memory layout above keeps the live paneIds for isolation.
        await invoke('save_workspace', {
          workspace: {
            id: activeWs.id,
            name: activeWs.name,
            layout: sanitizeLayout(currentRoot),
            created_at: activeWs.createdAt,
            updated_at: activeWs.updatedAt,
            version: activeWs.version,
          },
        });
      } catch (e) {
        console.error('[WorkspaceStore] Save workspace failed:', e);
      }
    }
  },
}));
