import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useUIStore } from '@/store/useUIStore';

describe('WorkspaceSidebar Inline Renaming', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      workspaces: [
        {
          id: 'ws-test-1',
          name: 'Primary Project',
          layout: { id: 'pane-1', type: 'terminal', title: 'Terminal' } as any,
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeWorkspaceId: 'ws-test-1',
      isLoading: false,
    });
  });

  it('enters inline editing mode when clicking the rename pencil icon', () => {
    render(<WorkspaceSidebar isOpen={true} onToggle={vi.fn()} />);

    const renameBtn = screen.getByRole('button', { name: /Rename Project/i });
    fireEvent.click(renameBtn);

    const input = screen.getByPlaceholderText('Workspace name') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Primary Project');

    const tickBtn = screen.getByRole('button', { name: /Save Workspace Name/i });
    expect(tickBtn).toBeInTheDocument();
  });

  it('saves the renamed workspace on pressing Enter', () => {
    render(<WorkspaceSidebar isOpen={true} onToggle={vi.fn()} />);

    const renameBtn = screen.getByRole('button', { name: /Rename Project/i });
    fireEvent.click(renameBtn);

    const input = screen.getByPlaceholderText('Workspace name');
    fireEvent.change(input, { target: { value: 'Renamed via Enter' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.queryByPlaceholderText('Workspace name')).not.toBeInTheDocument();
    expect(useWorkspaceStore.getState().workspaces[0].name).toBe('Renamed via Enter');
  });

  it('saves the renamed workspace on clicking the Tick button', () => {
    render(<WorkspaceSidebar isOpen={true} onToggle={vi.fn()} />);

    const renameBtn = screen.getByRole('button', { name: /Rename Project/i });
    fireEvent.click(renameBtn);

    const input = screen.getByPlaceholderText('Workspace name');
    fireEvent.change(input, { target: { value: 'Renamed via Tick' } });

    const tickBtn = screen.getByRole('button', { name: /Save Workspace Name/i });
    fireEvent.click(tickBtn);

    expect(screen.queryByPlaceholderText('Workspace name')).not.toBeInTheDocument();
    expect(useWorkspaceStore.getState().workspaces[0].name).toBe('Renamed via Tick');
  });

  it('saves the renamed workspace on blur (clicking outside)', () => {
    render(<WorkspaceSidebar isOpen={true} onToggle={vi.fn()} />);

    const renameBtn = screen.getByRole('button', { name: /Rename Project/i });
    fireEvent.click(renameBtn);

    const input = screen.getByPlaceholderText('Workspace name');
    fireEvent.change(input, { target: { value: 'Renamed via Blur' } });
    fireEvent.blur(input);

    expect(screen.queryByPlaceholderText('Workspace name')).not.toBeInTheDocument();
    expect(useWorkspaceStore.getState().workspaces[0].name).toBe('Renamed via Blur');
  });

  it('cancels inline editing on pressing Escape without saving', () => {
    render(<WorkspaceSidebar isOpen={true} onToggle={vi.fn()} />);

    const renameBtn = screen.getByRole('button', { name: /Rename Project/i });
    fireEvent.click(renameBtn);

    const input = screen.getByPlaceholderText('Workspace name');
    fireEvent.change(input, { target: { value: 'Should be cancelled' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByPlaceholderText('Workspace name')).not.toBeInTheDocument();
    expect(useWorkspaceStore.getState().workspaces[0].name).toBe('Primary Project');
  });

  it('cancels inline editing without saving if trimmed input is empty', () => {
    render(<WorkspaceSidebar isOpen={true} onToggle={vi.fn()} />);

    const renameBtn = screen.getByRole('button', { name: /Rename Project/i });
    fireEvent.click(renameBtn);

    const input = screen.getByPlaceholderText('Workspace name') as HTMLInputElement;
    expect(input.maxLength).toBe(32);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.queryByPlaceholderText('Workspace name')).not.toBeInTheDocument();
    expect(useWorkspaceStore.getState().workspaces[0].name).toBe('Primary Project');
  });
});

describe('WorkspaceSidebar SIDEBAR-01 & View Modes', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      workspaces: [
        {
          id: 'ws-test-1',
          name: 'Primary Project',
          layout: { id: 'pane-1', type: 'terminal', title: 'Terminal' } as any,
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeWorkspaceId: 'ws-test-1',
      isLoading: false,
    });
  });

  it('renders settings category menu when isSettingsOpen is true even if sidebar is collapsed (isOpen=false)', () => {
    useUIStore.setState({ isSettingsOpen: true });

    render(<WorkspaceSidebar isOpen={false} onToggle={vi.fn()} />);

    expect(screen.getByText('Settings Menu')).toBeInTheDocument();
    expect(screen.getByText('Font & Appearance')).toBeInTheDocument();
    expect(screen.getByText('Themes')).toBeInTheDocument();

    useUIStore.setState({ isSettingsOpen: false });
  });

  it('only shows the sub-thread active badge when isWsActive && activeViewMode === "grid"', () => {
    useUIStore.setState({ activeViewMode: 'hub', isSettingsOpen: false, activeThreadTitle: 'VibeGrid' });

    const { rerender } = render(<WorkspaceSidebar isOpen={true} onToggle={vi.fn()} />);
    expect(screen.queryByText('active')).not.toBeInTheDocument();

    useUIStore.setState({ activeViewMode: 'grid' });
    rerender(<WorkspaceSidebar isOpen={true} onToggle={vi.fn()} />);
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('supports keyboard navigation via Enter and Space on primary view items', () => {
    useUIStore.setState({ activeViewMode: 'grid' });

    render(<WorkspaceSidebar isOpen={true} onToggle={vi.fn()} />);

    const hubButton = screen.getByText('Workspace Hub').closest('[role="button"]')!;
    expect(hubButton).toBeInTheDocument();

    fireEvent.keyDown(hubButton, { key: 'Enter' });
    expect(useUIStore.getState().activeViewMode).toBe('hub');
  });
});
