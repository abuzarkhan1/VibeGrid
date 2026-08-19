import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AboutModal } from './AboutModal';
import { ShortcutsModal } from './ShortcutsModal';
import { NotificationToastContainer } from './NotificationToast';
import { VoiceIndicator } from './VoiceIndicator';
import { useUIStore } from '@/store/useUIStore';
import { useVoiceStore } from '@/store/useVoiceStore';

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
