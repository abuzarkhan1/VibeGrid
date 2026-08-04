import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWorkspaceStore } from './useWorkspaceStore';
import { usePaneStore } from './usePaneStore';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@/lib/tauri', () => ({
  isTauri: vi.fn(() => true),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => []),
}));

const mockedInvoke = vi.mocked(invoke);

/** 4-terminal custom split layout with runtime paneId sprinkled in. */
function fourPaneLayout() {
  return {
    type: 'split',
    id: 'split-1',
    direction: 'horizontal',
    ratio: 0.5,
    children: [
      {
        type: 'split',
        id: 'split-2',
        direction: 'vertical',
        ratio: 0.5,
        children: [
          { type: 'terminal', id: 'term-1', title: 'Web Server', paneId: 'pty-111' },
          { type: 'terminal', id: 'term-2', title: 'DB', paneId: 'pty-222' },
        ],
      },
      {
        type: 'split',
        id: 'split-3',
        direction: 'vertical',
        ratio: 0.5,
        children: [
          { type: 'terminal', id: 'term-3', title: 'Tests', cwd: '/app', paneId: 'pty-333' },
          { type: 'terminal', id: 'term-4', title: 'Terminal 4', paneId: 'pty-444' },
        ],
      },
    ],
  };
}

describe('VibeGrid Workspace Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset workspace store to the default singleton state
    useWorkspaceStore.setState({
      workspaces: [
        {
          id: 'default-workspace',
          name: 'Default Workspace',
          layout: { type: 'terminal', id: 'term-x', title: 'Terminal 1' },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeWorkspaceId: 'default-workspace',
      // Loaded: saves are allowed unless a test explicitly sets isLoading=true
      isLoading: false,
    });
  });

  it('saves the active workspace name with the layout as an object (gap: layout_json mismatch)', async () => {
    // Rename + open 4 panes
    useWorkspaceStore.getState().renameWorkspace('default-workspace', 'My Project');
    usePaneStore.setState({ root: fourPaneLayout() as never });
    await useWorkspaceStore.getState().saveCurrentWorkspace();

    expect(mockedInvoke).toHaveBeenCalledWith('save_workspace', expect.anything());
    const payload = mockedInvoke.mock.calls[0][1] as {
      workspace: { name: string; layout: Record<string, unknown> };
    };
    expect(payload.workspace.name).toBe('My Project');
    // The layout must be a structured object — NOT a layout_json string
    expect(typeof payload.workspace.layout).toBe('object');
    expect(payload.workspace.layout).not.toHaveProperty('layout_json');
  });

  it('strips runtime paneId from the persisted layout (fresh shells on restore)', async () => {
    usePaneStore.setState({ root: fourPaneLayout() as never });
    await useWorkspaceStore.getState().saveCurrentWorkspace();

    const payload = mockedInvoke.mock.calls[0][1] as {
      workspace: { layout: Record<string, unknown> };
    };
    const json = JSON.stringify(payload.workspace.layout);
    expect(json).not.toContain('paneId');
    expect(json).not.toContain('pty-');
    // Titles and cwds survive
    expect(json).toContain('Web Server');
    expect(json).toContain('/app');
    expect(json).toContain('term-1');
  });

  it('restores the renamed workspace with all 4 panes from list_workspaces', async () => {
    mockedInvoke.mockResolvedValueOnce([
      {
        id: 'default-workspace',
        name: 'My Project',
        layout: fourPaneLayout(),
        created_at: 1000,
        updated_at: 2000,
      },
    ]);

    await useWorkspaceStore.getState().loadWorkspaces();

    const state = useWorkspaceStore.getState();
    expect(state.workspaces).toHaveLength(1);
    expect(state.workspaces[0].name).toBe('My Project');
    expect(state.activeWorkspaceId).toBe('default-workspace');

    // Pane store got the 4-pane layout back
    const root = usePaneStore.getState().root as {
      type: string;
      children: unknown[];
    };
    expect(root.type).toBe('split');
    const json = JSON.stringify(root);
    expect(json).toContain('term-1');
    expect(json).toContain('term-2');
    expect(json).toContain('term-3');
    expect(json).toContain('term-4');
    // Runtime paneIds must not survive the load
    expect(json).not.toContain('pty-');

    // Derived state is reconstructed (persistence-fidelity audit fix)
    const pane = usePaneStore.getState();
    expect(pane.paneCount).toBe(4);
    expect(pane.layoutMode).toBe('custom');
    expect(pane.focusedPaneId).toBe('term-1');
  });

  it('keeps the default workspace when nothing is persisted yet', async () => {
    mockedInvoke.mockResolvedValueOnce([]);
    await useWorkspaceStore.getState().loadWorkspaces();
    expect(useWorkspaceStore.getState().workspaces[0].name).toBe('Default Workspace');
    expect(useWorkspaceStore.getState().isLoading).toBe(false);
  });

  it('never saves while isLoading is true (startup data-loss guard)', async () => {
    // Simulate the startup window: isLoading is true until loadWorkspaces resolves
    useWorkspaceStore.setState({ isLoading: true });
    usePaneStore.setState({ root: fourPaneLayout() as never });
    await useWorkspaceStore.getState().saveCurrentWorkspace();
    // The default mock returns [] for list_workspaces — but save must not run
    expect(mockedInvoke).not.toHaveBeenCalledWith('save_workspace', expect.anything());
  });

  it('deletes a workspace from the backend too', async () => {
    useWorkspaceStore.setState((s) => ({
      workspaces: [
        ...s.workspaces,
        { id: 'ws-2', name: 'Second', layout: { type: 'terminal', id: 't2', title: 'T2' }, createdAt: 1, updatedAt: 1 },
      ],
      activeWorkspaceId: 'default-workspace',
    }));
    useWorkspaceStore.getState().deleteWorkspace('ws-2');
    expect(mockedInvoke).toHaveBeenCalledWith('delete_workspace', { id: 'ws-2' });
    expect(useWorkspaceStore.getState().workspaces).toHaveLength(1);
  });

  it('switchWorkspace saves the old live layout and restores the target', async () => {
    useWorkspaceStore.setState({
      workspaces: [
        { id: 'default-workspace', name: 'Default Workspace', layout: { type: 'terminal', id: 'term-x', title: 'Terminal 1' }, createdAt: 1, updatedAt: 1 },
        { id: 'ws-second', name: 'Second', layout: { type: 'terminal', id: 'term-s', title: 'Terminal 2' }, createdAt: 2, updatedAt: 2 },
      ],
      activeWorkspaceId: 'default-workspace',
      isLoading: false,
    });
    // The current workspace has 4 live panes (with runtime paneIds)
    usePaneStore.setState({ root: fourPaneLayout() as never });

    useWorkspaceStore.getState().switchWorkspace('ws-second');

    // Pre-switch save used the OLD workspace + the live 4-pane root
    const payload = mockedInvoke.mock.calls[0][1] as {
      workspace: { name: string; layout: Record<string, unknown> };
    };
    expect(payload.workspace.name).toBe('Default Workspace');
    expect(JSON.stringify(payload.workspace.layout)).toContain('term-1');

    // Target workspace restored, active switched + persisted
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('ws-second');
    expect(usePaneStore.getState().paneCount).toBe(1);
    expect(usePaneStore.getState().focusedPaneId).toBe('term-s');
    expect(localStorage.getItem('vibegrid.active-workspace')).toBe('ws-second');
  });

  it('restores the last active workspace from localStorage on load (not just recency)', async () => {
    localStorage.setItem('vibegrid.active-workspace', 'ws-second');
    // default-workspace is the most recently updated on disk, but the user was
    // last working in ws-second — recency alone would pick the wrong one.
    mockedInvoke.mockResolvedValueOnce([
      { id: 'default-workspace', name: 'Default Workspace', layout: { type: 'terminal', id: 'term-1', title: 'Terminal 1' }, created_at: 1000, updated_at: 5000 },
      { id: 'ws-second', name: 'Second', layout: { type: 'terminal', id: 'term-2', title: 'Terminal 2' }, created_at: 1000, updated_at: 1000 },
    ]);

    await useWorkspaceStore.getState().loadWorkspaces();

    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('ws-second');
    expect(usePaneStore.getState().focusedPaneId).toBe('term-2');
  });

  it('createWorkspace with activate:false defers the switch (guard for running processes)', async () => {
    usePaneStore.setState({ root: fourPaneLayout() as never, paneCount: 4, layoutMode: 'custom', focusedPaneId: 'term-1' });

    const id = useWorkspaceStore.getState().createWorkspace('Deferred', { activate: false });

    // Created, but the active workspace and live layout are untouched
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('default-workspace');
    expect(usePaneStore.getState().paneCount).toBe(4);
    expect(JSON.stringify(usePaneStore.getState().root)).toContain('term-4');
    expect(useWorkspaceStore.getState().workspaces.some((w) => w.id === id && w.name === 'Deferred')).toBe(true);
  });

  it('createWorkspace() activates immediately and applies the empty layout', async () => {
    usePaneStore.setState({ root: { type: 'terminal', id: 'term-1', title: 'T1' } as never }); // no paneId → nothing running

    const id = useWorkspaceStore.getState().createWorkspace('New WS');

    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe(id);
    expect(usePaneStore.getState().paneCount).toBe(1);
    expect(localStorage.getItem('vibegrid.active-workspace')).toBe(id);
  });

  it('deleting the active workspace falls back to the first remaining one and persists it', async () => {
    useWorkspaceStore.setState({
      workspaces: [
        { id: 'default-workspace', name: 'Default Workspace', layout: { type: 'terminal', id: 'term-x', title: 'Terminal 1' }, createdAt: 1, updatedAt: 1 },
        { id: 'ws-second', name: 'Second', layout: { type: 'terminal', id: 'term-s', title: 'Terminal 2' }, createdAt: 2, updatedAt: 2 },
      ],
      activeWorkspaceId: 'ws-second',
      isLoading: false,
    });

    useWorkspaceStore.getState().deleteWorkspace('ws-second');

    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('default-workspace');
    expect(usePaneStore.getState().paneCount).toBe(1);
    expect(mockedInvoke).toHaveBeenCalledWith('delete_workspace', { id: 'ws-second' });
    expect(localStorage.getItem('vibegrid.active-workspace')).toBe('default-workspace');
  });

  it('falls back to a single terminal when a persisted layout is malformed', async () => {
    mockedInvoke.mockResolvedValueOnce([
      { id: 'default-workspace', name: 'Broken', layout: { type: 'bogus', children: [] }, created_at: 1, updated_at: 1 },
    ] as never);

    await useWorkspaceStore.getState().loadWorkspaces();

    expect(useWorkspaceStore.getState().workspaces[0].name).toBe('Broken');
    expect(usePaneStore.getState().paneCount).toBe(1);
    expect(usePaneStore.getState().focusedPaneId).not.toBeNull();
  });
});
