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

    useWorkspaceStore.setState({
      workspaces: [
        {
          id: 'default-workspace',
          name: 'Default Workspace',
          layout: { type: 'terminal', id: 'term-x', title: 'Terminal 1' },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
        },
      ],
      activeWorkspaceId: 'default-workspace',

      isLoading: false,
    });
  });

  it('saves the active workspace name with the layout as an object (gap: layout_json mismatch)', async () => {

    useWorkspaceStore.getState().renameWorkspace('default-workspace', 'My Project');
    usePaneStore.setState({ root: fourPaneLayout() as never });
    await useWorkspaceStore.getState().saveCurrentWorkspace();

    expect(mockedInvoke).toHaveBeenCalledWith('save_workspace', expect.anything());
    const payload = mockedInvoke.mock.calls[0][1] as {
      workspace: { name: string; layout: Record<string, unknown> };
    };
    expect(payload.workspace.name).toBe('My Project');

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

    expect(json).not.toContain('pty-');

    const pane = usePaneStore.getState();
    expect(pane.paneCount).toBe(4);
    expect(pane.layoutMode).toBe('custom');
    expect(pane.focusedPaneId).toBe('term-1');
  });

  it('loadWorkspaces bumps gridVersion so the restored grid remounts fresh', async () => {
    mockedInvoke.mockResolvedValueOnce([
      {
        id: 'default-workspace',
        name: 'My Project',
        layout: fourPaneLayout(),
        created_at: 1000,
        updated_at: 2000,
      },
    ]);
    const before = usePaneStore.getState().gridVersion;

    await useWorkspaceStore.getState().loadWorkspaces();

    expect(usePaneStore.getState().gridVersion).toBe(before + 1);
    expect(usePaneStore.getState().paneCount).toBe(4);
  });

  it('switchWorkspace bumps gridVersion when restoring the target layout', () => {
    useWorkspaceStore.setState({
      workspaces: [
        { id: 'default-workspace', name: 'Default Workspace', layout: { type: 'terminal', id: 'term-x', title: 'Terminal 1' }, createdAt: 1, updatedAt: 1, version: 1 },
        { id: 'ws-second', name: 'Second', layout: fourPaneLayout() as never, createdAt: 2, updatedAt: 2, version: 1 },
      ],
      activeWorkspaceId: 'default-workspace',
      isLoading: false,
    });
    const before = usePaneStore.getState().gridVersion;

    useWorkspaceStore.getState().switchWorkspace('ws-second');

    expect(usePaneStore.getState().gridVersion).toBe(before + 1);
    expect(usePaneStore.getState().paneCount).toBe(4);
  });

  it('keeps the default workspace when nothing is persisted yet', async () => {
    mockedInvoke.mockResolvedValueOnce([]);
    await useWorkspaceStore.getState().loadWorkspaces();
    expect(useWorkspaceStore.getState().workspaces[0].name).toBe('Default Workspace');
    expect(useWorkspaceStore.getState().isLoading).toBe(false);
  });

  it('never saves while isLoading is true (startup data-loss guard)', async () => {

    useWorkspaceStore.setState({ isLoading: true });
    usePaneStore.setState({ root: fourPaneLayout() as never });
    await useWorkspaceStore.getState().saveCurrentWorkspace();

    expect(mockedInvoke).not.toHaveBeenCalledWith('save_workspace', expect.anything());
  });

  it('renaming a NON-active workspace persists it to disk (not just the active one)', async () => {
    useWorkspaceStore.setState({
      workspaces: [
        { id: 'default-workspace', name: 'Default Workspace', layout: { type: 'terminal', id: 'term-x', title: 'Terminal 1' }, createdAt: 1, updatedAt: 1, version: 1 },
        { id: 'ws-second', name: 'Second', layout: { type: 'terminal', id: 'term-s', title: 'Terminal 2' }, createdAt: 2, updatedAt: 2, version: 1 },
      ],
      activeWorkspaceId: 'default-workspace',
      isLoading: false,
    });

    useWorkspaceStore.getState().renameWorkspace('ws-second', 'Renamed Second');

    expect(useWorkspaceStore.getState().workspaces.find((w) => w.id === 'ws-second')?.name).toBe('Renamed Second');

    expect(mockedInvoke).toHaveBeenCalledWith(
      'save_workspace',
      expect.objectContaining({ workspace: expect.objectContaining({ id: 'ws-second', name: 'Renamed Second' }) })
    );
  });

  it('captures and restores per-workspace view state on switch-back', () => {
    useWorkspaceStore.setState({
      workspaces: [
        { id: 'default-workspace', name: 'Default Workspace', layout: { type: 'terminal', id: 'term-x', title: 'Terminal 1' }, createdAt: 1, updatedAt: 1, version: 1 },
        { id: 'ws-second', name: 'Second', layout: { type: 'terminal', id: 'term-s', title: 'Terminal 2' }, createdAt: 2, updatedAt: 2, version: 1 },
      ],
      activeWorkspaceId: 'default-workspace',
      isLoading: false,
    });

    usePaneStore.setState({
      root: fourPaneLayout() as never,
      paneCount: 4,
      layoutMode: 'preset' as const,
      presetCount: 4,
      focusedPaneId: 'term-2',
      maximizedPaneId: 'term-3',
    });

    useWorkspaceStore.getState().switchWorkspace('ws-second');
    const leaving = useWorkspaceStore.getState().workspaces.find((w) => w.id === 'default-workspace');
    expect(leaving?.view).toEqual({
      focusedPaneId: 'term-2',
      maximizedPaneId: 'term-3',
      layoutMode: 'preset',
      presetCount: 4,
    });

    useWorkspaceStore.getState().switchWorkspace('default-workspace');
    const ps = usePaneStore.getState();
    expect(ps.focusedPaneId).toBe('term-2');
    expect(ps.maximizedPaneId).toBe('term-3');
    expect(ps.layoutMode).toBe('preset');
    expect(ps.presetCount).toBe(4);
  });

  it('falls back gracefully when a restored focused pane no longer exists', () => {
    useWorkspaceStore.setState({
      workspaces: [
        { id: 'default-workspace', name: 'Default Workspace', layout: fourPaneLayout() as never, createdAt: 1, updatedAt: 1, version: 1, view: { focusedPaneId: 'term-gone', maximizedPaneId: null, layoutMode: 'custom' as const, presetCount: 1 } },
        { id: 'ws-second', name: 'Second', layout: { type: 'terminal', id: 'term-s', title: 'Terminal 2' }, createdAt: 2, updatedAt: 2, version: 1 },
      ],
      activeWorkspaceId: 'ws-second',
      isLoading: false,
    });

    useWorkspaceStore.getState().switchWorkspace('default-workspace');

    expect(usePaneStore.getState().focusedPaneId).toBe('term-1');
    expect(usePaneStore.getState().paneCount).toBe(4);
  });

  it('deletes a workspace from the backend too', async () => {
    useWorkspaceStore.setState((s) => ({
      workspaces: [
        ...s.workspaces,
        { id: 'ws-2', name: 'Second', layout: { type: 'terminal', id: 't2', title: 'T2' }, createdAt: 1, updatedAt: 1, version: 1 },
      ],
      activeWorkspaceId: 'default-workspace',
    }));
    useWorkspaceStore.getState().deleteWorkspace('ws-2');
    expect(mockedInvoke).toHaveBeenCalledWith('delete_workspace', { id: 'ws-2' });
    expect(useWorkspaceStore.getState().workspaces).toHaveLength(1);
  });

  it('switchWorkspace saves the old live layout (sanitized to disk) and restores the target', async () => {
    useWorkspaceStore.setState({
      workspaces: [
        { id: 'default-workspace', name: 'Default Workspace', layout: { type: 'terminal', id: 'term-x', title: 'Terminal 1' }, createdAt: 1, updatedAt: 1, version: 1 },
        { id: 'ws-second', name: 'Second', layout: { type: 'terminal', id: 'term-s', title: 'Terminal 2' }, createdAt: 2, updatedAt: 2, version: 1 },
      ],
      activeWorkspaceId: 'default-workspace',
      isLoading: false,
    });

    usePaneStore.setState({ root: fourPaneLayout() as never });

    useWorkspaceStore.getState().switchWorkspace('ws-second');

    const payload = mockedInvoke.mock.calls[0][1] as {
      workspace: { name: string; layout: Record<string, unknown> };
    };
    expect(payload.workspace.name).toBe('Default Workspace');
    expect(JSON.stringify(payload.workspace.layout)).toContain('term-1');

    expect(JSON.stringify(payload.workspace.layout)).not.toContain('pty-');

    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('ws-second');
    expect(usePaneStore.getState().paneCount).toBe(1);
    expect(usePaneStore.getState().focusedPaneId).toBe('term-s');
    expect(localStorage.getItem('vibegrid.active-workspace')).toBe('ws-second');
  });

  it('keeps live paneIds in the in-memory leaving workspace (isolation: terminals survive the switch)', () => {
    useWorkspaceStore.setState({
      workspaces: [
        { id: 'default-workspace', name: 'Default Workspace', layout: { type: 'terminal', id: 'term-x', title: 'Terminal 1' }, createdAt: 1, updatedAt: 1, version: 1 },
        { id: 'ws-second', name: 'Second', layout: { type: 'terminal', id: 'term-s', title: 'Terminal 2' }, createdAt: 2, updatedAt: 2, version: 1 },
      ],
      activeWorkspaceId: 'default-workspace',
      isLoading: false,
    });
    usePaneStore.setState({ root: fourPaneLayout() as never, paneCount: 4, layoutMode: 'custom', focusedPaneId: 'term-1' });

    useWorkspaceStore.getState().switchWorkspace('ws-second');

    const leaving = useWorkspaceStore.getState().workspaces.find((w) => w.id === 'default-workspace');
    expect(JSON.stringify(leaving?.layout)).toContain('pty-111');
    expect(JSON.stringify(leaving?.layout)).toContain('pty-444');
  });

  it('round-trips back to a workspace and re-attaches its live panes', () => {
    useWorkspaceStore.setState({
      workspaces: [
        { id: 'default-workspace', name: 'Default Workspace', layout: fourPaneLayout() as never, createdAt: 1, updatedAt: 1, version: 1 },
        { id: 'ws-second', name: 'Second', layout: { type: 'terminal', id: 'term-s', title: 'Terminal 2' }, createdAt: 2, updatedAt: 2, version: 1 },
      ],
      activeWorkspaceId: 'ws-second',
      isLoading: false,
    });
    usePaneStore.setState({ root: { type: 'terminal', id: 'term-s', title: 'Terminal 2' } as never, paneCount: 1, layoutMode: 'preset', focusedPaneId: 'term-s' });

    useWorkspaceStore.getState().switchWorkspace('default-workspace');

    expect(usePaneStore.getState().paneCount).toBe(4);
    const json = JSON.stringify(usePaneStore.getState().root);
    expect(json).toContain('term-1');
    expect(json).toContain('pty-333');
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('default-workspace');
  });

  it('restores the last active workspace from localStorage on load (not just recency)', async () => {
    localStorage.setItem('vibegrid.active-workspace', 'ws-second');

    mockedInvoke.mockResolvedValueOnce([
      { id: 'default-workspace', name: 'Default Workspace', layout: { type: 'terminal', id: 'term-1', title: 'Terminal 1' }, created_at: 1000, updated_at: 5000, version: 1 },
      { id: 'ws-second', name: 'Second', layout: { type: 'terminal', id: 'term-2', title: 'Terminal 2' }, created_at: 1000, updated_at: 1000, version: 1 },
    ]);

    await useWorkspaceStore.getState().loadWorkspaces();

    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('ws-second');
    expect(usePaneStore.getState().focusedPaneId).toBe('term-2');
  });

  it('createWorkspace with activate:false defers the switch (guard for running processes)', async () => {
    usePaneStore.setState({ root: fourPaneLayout() as never, paneCount: 4, layoutMode: 'custom', focusedPaneId: 'term-1' });

    const id = useWorkspaceStore.getState().createWorkspace('Deferred', { activate: false });

    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('default-workspace');
    expect(usePaneStore.getState().paneCount).toBe(4);
    expect(JSON.stringify(usePaneStore.getState().root)).toContain('term-4');
    expect(useWorkspaceStore.getState().workspaces.some((w) => w.id === id && w.name === 'Deferred')).toBe(true);
  });

  it('createWorkspace() activates immediately and applies the empty layout', async () => {
    usePaneStore.setState({ root: { type: 'terminal', id: 'term-1', title: 'T1' } as never });

    const id = useWorkspaceStore.getState().createWorkspace('New WS');

    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe(id);
    expect(usePaneStore.getState().paneCount).toBe(1);
    expect(localStorage.getItem('vibegrid.active-workspace')).toBe(id);
  });

  it('deleting the active workspace falls back to the first remaining one and persists it', async () => {
    useWorkspaceStore.setState({
      workspaces: [
        { id: 'default-workspace', name: 'Default Workspace', layout: { type: 'terminal', id: 'term-x', title: 'Terminal 1' }, createdAt: 1, updatedAt: 1, version: 1 },
        { id: 'ws-second', name: 'Second', layout: { type: 'terminal', id: 'term-s', title: 'Terminal 2' }, createdAt: 2, updatedAt: 2, version: 1 },
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

  it('duplicateWorkspace copies a workspace with a sanitized layout (no shared paneIds)', async () => {
    useWorkspaceStore.setState({
      workspaces: [
        { id: 'default-workspace', name: 'Default Workspace', layout: { type: 'terminal', id: 'term-x', title: 'Terminal 1' }, createdAt: 1, updatedAt: 1, version: 1 },
        { id: 'ws-src', name: 'Source', layout: fourPaneLayout() as never, createdAt: 2, updatedAt: 2, version: 1 },
      ],
      activeWorkspaceId: 'default-workspace',
      isLoading: false,
    });

    const id = useWorkspaceStore.getState().duplicateWorkspace('ws-src');

    const copy = useWorkspaceStore.getState().workspaces.find((w) => w.id === id);
    expect(copy).toBeDefined();
    expect(copy?.name).toBe('Source Copy');

    expect(JSON.stringify(copy?.layout)).not.toContain('pty-');

    expect(JSON.stringify(copy?.layout)).toContain('Web Server');
    expect(usePaneStore.getState().paneCount).toBe(1);

    expect(mockedInvoke).toHaveBeenCalledWith(
      'save_workspace',
      expect.objectContaining({ workspace: expect.objectContaining({ id }) })
    );
  });

  it('setWorkspaceOverrides stores, clears and persists overrides', () => {
    useWorkspaceStore.setState({
      workspaces: [
        { id: 'a', name: 'A', layout: { type: 'terminal', id: 't1', title: 'T1' }, createdAt: 1, updatedAt: 1, version: 1 },
      ],
      activeWorkspaceId: 'a',
      isLoading: false,
    });

    useWorkspaceStore
      .getState()
      .setWorkspaceOverrides('a', { themeName: 'nord', fontSize: 16, defaultShell: '/bin/zsh' });

    const afterSet = useWorkspaceStore.getState().workspaces[0];
    expect(afterSet.overrides).toEqual({ themeName: 'nord', fontSize: 16, defaultShell: '/bin/zsh' });

    const lastPayload = mockedInvoke.mock.calls.find((c) => c[0] === 'save_workspace')?.[1];
    expect((lastPayload as { workspace: { overrides?: unknown } }).workspace.overrides).toEqual({
      themeName: 'nord',
      fontSize: 16,
      defaultShell: '/bin/zsh',
    });

    useWorkspaceStore.getState().setWorkspaceOverrides('a', null);
    expect(useWorkspaceStore.getState().workspaces[0].overrides).toBeUndefined();
  });

  it('deleting the last workspace resets to a fresh default instead of refusing', () => {
    const state = useWorkspaceStore.getState();
    expect(state.workspaces.length).toBe(1);
    const oldId = state.workspaces[0].id;

    useWorkspaceStore.getState().deleteWorkspace(oldId);

    const after = useWorkspaceStore.getState();
    expect(after.workspaces.length).toBe(1);
    expect(after.workspaces[0].id).not.toBe(oldId);
    expect(after.workspaces[0].name).toBe('Default Workspace');
    expect(after.activeWorkspaceId).toBe(after.workspaces[0].id);
    expect(usePaneStore.getState().paneCount).toBe(1);
    expect(usePaneStore.getState().root.type).toBe('terminal');

    expect(mockedInvoke).toHaveBeenCalledWith('delete_workspace', { id: oldId });
    expect(mockedInvoke).toHaveBeenCalledWith(
      'save_workspace',
      expect.objectContaining({ workspace: expect.objectContaining({ id: after.workspaces[0].id }) })
    );
  });
});
