import { create } from 'zustand';
import { usePaneStore } from './usePaneStore';
import { PaneNode } from '@/types/layout';
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
  createWorkspace: (name: string) => void;
  switchWorkspace: (id: string) => void;
  renameWorkspace: (id: string, newName: string) => void;
  deleteWorkspace: (id: string) => void;
  loadWorkspaces: () => Promise<void>;
  saveCurrentWorkspace: () => Promise<void>;
}

const defaultWorkspaceId = 'default-workspace';
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

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [defaultWorkspace],
  activeWorkspaceId: defaultWorkspaceId,
  isLoading: true,

  createWorkspace: (name: string) => {
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
      activeWorkspaceId: id,
    }));

    // Apply layout to pane store
    usePaneStore.setState({
      root: newWs.layout,
      focusedPaneId: newWs.layout.type === 'terminal' ? newWs.layout.id : null,
      maximizedPaneId: null,
      paneCount: 1,
    });

    get().saveCurrentWorkspace();
  },

  switchWorkspace: (id: string) => {
    const { workspaces, activeWorkspaceId } = get();
    if (id === activeWorkspaceId) return;

    // Save active workspace first
    get().saveCurrentWorkspace();

    const targetWs = workspaces.find((w) => w.id === id);
    if (!targetWs) return;

    set({ activeWorkspaceId: id });

    // Restore target workspace layout in pane store
    usePaneStore.setState({
      root: targetWs.layout,
      focusedPaneId: targetWs.layout.type === 'terminal' ? targetWs.layout.id : null,
      maximizedPaneId: null,
    });
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
      usePaneStore.setState({ root: remaining[0].layout });
    }

    set({
      workspaces: remaining,
      activeWorkspaceId: nextActiveId,
    });

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
      const list = await invoke<Array<{ id: string; name: string; layout_json: string; created_at: number; updated_at: number }>>('list_workspaces');
      if (list && list.length > 0) {
        const loaded: Workspace[] = list.map((w) => ({
          id: w.id,
          name: w.name,
          layout: JSON.parse(w.layout_json),
          createdAt: w.created_at,
          updatedAt: w.updated_at,
        }));
        set({
          workspaces: loaded,
          activeWorkspaceId: loaded[0].id,
        });
        usePaneStore.setState({ root: loaded[0].layout });
      }
    } catch (e) {
      console.warn('[WorkspaceStore] Load workspaces notice:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  saveCurrentWorkspace: async () => {
    const { workspaces, activeWorkspaceId } = get();
    const currentRoot = usePaneStore.getState().root;

    const updatedWorkspaces = workspaces.map((w) => {
      if (w.id === activeWorkspaceId) {
        return {
          ...w,
          layout: currentRoot,
          updatedAt: Date.now(),
        };
      }
      return w;
    });

    set({ workspaces: updatedWorkspaces });

    const activeWs = updatedWorkspaces.find((w) => w.id === activeWorkspaceId);
    if (activeWs && isTauri()) {
      try {
        await invoke('save_workspace', {
          workspace: {
            id: activeWs.id,
            name: activeWs.name,
            layout_json: JSON.stringify(activeWs.layout),
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
