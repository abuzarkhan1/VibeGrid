import { create } from 'zustand';
import { usePaneStore, getTerminalNodes, killPanesInLayout } from './usePaneStore';
import { PaneNode, TerminalNode, PresetCount } from '@/types/layout';
import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '@/lib/tauri';

export interface WorkspaceOverrides {
  themeName?: string;
  fontSize?: number;
  fontFamily?: string;
  defaultShell?: string;
  defaultCwd?: string;
  terminalOpacity?: number;
}

interface Workspace {
  id: string;
  name: string;
  layout: PaneNode;
  createdAt: number;
  updatedAt: number;

  version: number;

  overrides?: WorkspaceOverrides;

  emoji?: string;

  archived?: boolean;

  view?: {
    focusedPaneId: string | null;
    maximizedPaneId: string | null;
    layoutMode: 'preset' | 'custom';
    presetCount: PresetCount;
  };
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  isLoading: boolean;

  createWorkspace: (name: string, opts?: { activate?: boolean }) => string;
  switchWorkspace: (id: string) => void;
  renameWorkspace: (id: string, newName: string) => void;
  deleteWorkspace: (id: string) => void;

  duplicateWorkspace: (id: string) => string;

  setWorkspaceOverrides: (id: string, overrides: WorkspaceOverrides | null) => void;

  setWorkspaceEmoji: (id: string, emoji: string) => void;

  toggleArchive: (id: string) => void;

  freshDefaultWorkspace: () => Workspace;
  loadWorkspaces: () => Promise<void>;
  saveCurrentWorkspace: () => Promise<void>;
}

const defaultWorkspaceId = 'default-workspace';

function newWorkspaceId(): string {
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
const ACTIVE_WS_STORAGE_KEY = 'vibegrid.active-workspace';
const WORKSPACE_ORDER_KEY = 'vibegrid.workspace-order';

/** Persist the sidebar order (customization audit C23) so a drag-reorder
 *  survives restarts — the on-disk list is sorted by updated_at, so without
 *  this the user's manual order would be silently lost on next launch. */
function persistWorkspaceOrder(ids: string[]) {
  try {
    localStorage.setItem(WORKSPACE_ORDER_KEY, JSON.stringify(ids));
  } catch {
    // storage unavailable — non-fatal
  }
}

function readStoredWorkspaceOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : null;
  } catch {
    return null;
  }
}

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
      overrides: ws.overrides ?? null,
      emoji: ws.emoji ?? null,
      archived: ws.archived ?? null,
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
      // gridVersion: structural change — the root GridRenderer remounts its
      // Allotment tree so a restored deeper grid (9/12/16) can never inherit a
      // stale collapsed layout (allotment v1 in-place restructure bug).
      gridVersion: usePaneStore.getState().gridVersion + 1,
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
    // gridVersion: structural change — remount the Allotment tree (see above).
    gridVersion: usePaneStore.getState().gridVersion + 1,
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
    persistWorkspaceOrder(get().workspaces.map((w) => w.id));

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
    // Customization audit C23: archived workspaces are not switchable — the
    // sidebar/palette exclude them from the active list anyway, this is the
    // guard for any stray call (e.g. a stale keybinding).
    if (targetWs.archived) return;

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
    persistWorkspaceOrder(get().workspaces.map((w) => w.id));
    persistWorkspaceToDisk(copy, copy.layout);
    return newId;
  },

  setWorkspaceOverrides: (id: string, overrides: WorkspaceOverrides | null) => {
    const next = overrides && Object.keys(overrides).length > 0 ? overrides : undefined;
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, overrides: next, updatedAt: Date.now() } : w
      ),
    }));
    const target = get().workspaces.find((w) => w.id === id);
    if (target) persistWorkspaceToDisk(target, target.layout);
  },

  setWorkspaceEmoji: (id: string, emoji: string) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, emoji: emoji || undefined, updatedAt: Date.now() } : w
      ),
    }));
    const target = get().workspaces.find((w) => w.id === id);
    if (target) persistWorkspaceToDisk(target, target.layout);
  },

  toggleArchive: (id: string) => {
    const { workspaces, activeWorkspaceId } = get();
    const target = workspaces.find((w) => w.id === id);
    if (!target) return;
    const archived = !target.archived;
    // Archiving the ACTIVE workspace: switch to another visible workspace
    // first (archived workspaces are not switchable). Non-destructive — the
    // archived workspace's terminals keep running in the background.
    let nextActiveId = activeWorkspaceId;
    if (archived && activeWorkspaceId === id) {
      const nextVisible = workspaces.find((w) => w.id !== id && !w.archived);
      nextActiveId = nextVisible?.id ?? id;
    }
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, archived, updatedAt: Date.now() } : w
      ),
      activeWorkspaceId: nextActiveId,
    }));
    if (nextActiveId !== activeWorkspaceId) {
      persistActiveWorkspaceId(nextActiveId);
      const nextWs = get().workspaces.find((w) => w.id === nextActiveId);
      if (nextWs) applyLayoutToPaneStore(nextWs.layout, nextWs.view);
    }
    const updated = get().workspaces.find((w) => w.id === id);
    if (updated) persistWorkspaceToDisk(updated, updated.layout);
  },

  /** A brand-new empty workspace (fresh id so it never collides with the
   *  deleted one on disk). Customization audit L16: deleting the LAST workspace
   *  resets to a fresh default instead of refusing. */
  freshDefaultWorkspace: (): Workspace => ({
    id: newWorkspaceId(),
    name: 'Default Workspace',
    layout: {
      type: 'terminal',
      id: `term-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      title: 'Terminal 1',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  }),

  deleteWorkspace: (id: string) => {
    const { workspaces, activeWorkspaceId } = get();

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

    // Customization audit L16: deleting the LAST workspace no longer refuses —
    // the user gets a fresh default workspace instead (the app must always have
    // one, but the slate is wiped clean, running terminals included).
    if (workspaces.length <= 1) {
      const fresh = get().freshDefaultWorkspace();
      set({ workspaces: [fresh], activeWorkspaceId: fresh.id });
      persistActiveWorkspaceId(fresh.id);
      persistWorkspaceOrder([fresh.id]);
      applyLayoutToPaneStore(fresh.layout);
      if (isTauri()) {
        invoke('delete_workspace', { id }).catch(console.error);
        persistWorkspaceToDisk(fresh, fresh.layout);
      }
      return;
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
    persistWorkspaceOrder(remaining.map((w) => w.id));

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
        Array<{
          id: string;
          name: string;
          layout: PaneNode;
          created_at: number;
          updated_at: number;
          version?: number;
          overrides?: WorkspaceOverrides | null;
          emoji?: string | null;
          archived?: boolean | null;
        }>
      >('list_workspaces');
      if (list && list.length > 0) {
        const loaded: Workspace[] = list.map((w) => ({
          id: w.id,
          name: w.name,
          layout: sanitizeLayout(w.layout),
          createdAt: w.created_at,
          updatedAt: w.updated_at,
          version: w.version ?? 1,
          // Customization audit C12: restore per-workspace overrides.
          overrides: w.overrides ?? undefined,
          // Customization audit C23: restore emoji badge + archive flag.
          emoji: w.emoji ?? undefined,
          archived: w.archived ?? false,
        }));

        // Customization audit C23: apply the user's persisted sidebar order
        // (drag-reorder) on top of the disk's updated_at ordering. Unknown ids
        // sort last, keeping their relative disk order (stable sort).
        const storedOrder = readStoredWorkspaceOrder();
        if (storedOrder && storedOrder.length > 0) {
          const rank = new Map(storedOrder.map((id, i) => [id, i]));
          loaded.sort((a, b) => {
            const ra = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
            const rb = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
            return ra - rb;
          });
        }

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
            overrides: activeWs.overrides ?? null,
            emoji: activeWs.emoji ?? null,
            archived: activeWs.archived ?? null,
          },
        });
      } catch (e) {
        console.error('[WorkspaceStore] Save workspace failed:', e);
      }
    }
  },
}));
