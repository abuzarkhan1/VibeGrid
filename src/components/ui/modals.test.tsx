import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AboutModal } from './AboutModal';
import { ShortcutsModal } from './ShortcutsModal';
import { NotificationToastContainer } from './NotificationToast';
import { VoiceIndicator } from './VoiceIndicator';
import { useUIStore } from '@/store/useUIStore';
import { useVoiceStore } from '@/store/useVoiceStore';
import { SettingsModal } from './SettingsModal';

describe('AboutModal', () => {
  it('renders modal with engine info and close action', () => {
    const onClose = vi.fn();
    render(<AboutModal onClose={onClose} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'About VibeGrid');
    expect(screen.getByText('Tauri 2 + Rust')).toBeTruthy();
    expect(screen.getByText('MIT Open Source')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Close about dialog' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('copies diagnostic info with toast feedback when clicking version badge (ABOUT-01)', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<AboutModal onClose={vi.fn()} />);
    const versionBtn = screen.getByRole('button', { name: /Copy diagnostic info for Version/i });
    expect(versionBtn).toBeTruthy();

    fireEvent.click(versionBtn);
    expect(writeTextMock).toHaveBeenCalled();

    await waitFor(() => {
      const toasts = useUIStore.getState().toasts;
      expect(toasts.some((t) => t.title === 'Diagnostic info copied')).toBe(true);
    });
  });
});

describe('SettingsModal', () => {
  it('renders top-right Close button and closes on click (SETTINGS-01)', () => {
    useUIStore.setState({ isSettingsOpen: true });
    render(<SettingsModal />);
    const closeBtn = screen.getByRole('button', { name: 'Close Settings' });
    expect(closeBtn).toBeTruthy();

    fireEvent.click(closeBtn);
    expect(useUIStore.getState().isSettingsOpen).toBe(false);
  });

  it('supports inline workspace renaming in Workspaces tab (RENAME-01)', async () => {
    const { useWorkspaceStore } = await import('@/store/useWorkspaceStore');
    useWorkspaceStore.setState({
      workspaces: [
        {
          id: 'ws-test-settings',
          name: 'Settings Project',
          layout: { id: 'pane-1', type: 'terminal', title: 'Terminal' } as any,
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeWorkspaceId: 'ws-test-settings',
      isLoading: false,
    });
    useUIStore.setState({ isSettingsOpen: true, activeSettingsTab: 'workspaces' });

    render(<SettingsModal />);

    const renameBtn = screen.getByRole('button', { name: /Rename workspace Settings Project/i });
    fireEvent.click(renameBtn);

    const input = screen.getByPlaceholderText('Workspace name') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Settings Project');
    expect(input.maxLength).toBe(32);

    fireEvent.change(input, { target: { value: 'Updated Project Name' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(useWorkspaceStore.getState().workspaces[0].name).toBe('Updated Project Name');
    expect(screen.queryByPlaceholderText('Workspace name')).not.toBeInTheDocument();
  });
});

describe('ShortcutsModal', () => {
  it('renders keybindings when store is open', () => {
    useUIStore.setState({ isCheatsheetOpen: true });
    render(<ShortcutsModal />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Keyboard shortcuts reference');
    expect(screen.getByText('Pane Operations')).toBeTruthy();
    expect(screen.getByText('Navigation')).toBeTruthy();
  });
});

describe('NotificationToastContainer', () => {
  it('renders toasts for all semantic types', () => {
    useUIStore.setState({
      toasts: [
        { id: '1', type: 'info', title: 'Info Toast', description: 'Informational message' },
        { id: '2', type: 'success', title: 'Success Toast' },
        { id: '3', type: 'warning', title: 'Warning Toast' },
        { id: '4', type: 'error', title: 'Error Toast' },
      ],
    });
    render(<NotificationToastContainer />);
    expect(screen.getByText('Info Toast')).toBeTruthy();
    expect(screen.getByText('Success Toast')).toBeTruthy();
    expect(screen.getByText('Warning Toast')).toBeTruthy();
    expect(screen.getByText('Error Toast')).toBeTruthy();
  });
});

describe('VoiceIndicator', () => {
  it('renders listening and transcribing indicators accurately', () => {
    useVoiceStore.setState({ isListening: true, phase: 'listening', level: 0.5 });
    const { rerender } = render(<VoiceIndicator />);
    expect(screen.getByText('Listening…')).toBeTruthy();

    useVoiceStore.setState({ isListening: false, phase: 'transcribing' });
    rerender(<VoiceIndicator />);
    expect(screen.getByText('Transcribing…')).toBeTruthy();
  });
});
