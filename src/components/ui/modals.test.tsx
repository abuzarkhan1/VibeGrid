import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmModal } from './ConfirmModal';
import { InputModal } from './InputModal';

describe('ConfirmModal', () => {
  it('renders as a labelled modal dialog', () => {
    render(
      <ConfirmModal title="Delete Workspace" message="This cannot be undone." onConfirm={vi.fn()} onClose={vi.fn()} />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Delete Workspace');
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();
  });

  it('autofocuses the confirm button', () => {
    render(<ConfirmModal title="T" message="M" onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus();
  });

  it('Enter confirms and closes, Escape cancels (audit P2 #7)', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmModal title="T" message="M" onConfirm={onConfirm} onClose={onClose} />);

    // user-event drives the keydown listener on window (the modal is
    // autofocused on Confirm, which is where a real user's Enter lands).
    await user.keyboard('{Enter}');
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('marks the confirm button with the danger styling when isDanger', () => {
    render(<ConfirmModal title="T" message="M" confirmLabel="Delete" isDanger onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('bg-rose-600');
  });

  it('renders an accessible close button', () => {
    render(<ConfirmModal title="T" message="M" onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Close confirmation dialog' })).toBeTruthy();
  });
});

describe('InputModal', () => {
  it('renders a labelled modal with the initial value', () => {
    render(<InputModal title="Rename Workspace" initialValue="My Space" onSave={vi.fn()} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleName('Rename Workspace');
    expect(screen.getByDisplayValue('My Space')).toBeTruthy();
  });

  it('submits the trimmed value on save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<InputModal title="T" onSave={onSave} onClose={onClose} />);
    await user.type(screen.getByRole('textbox'), '  hello  ');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith('hello');
    expect(onClose).toHaveBeenCalled();
  });

  it('disables save when the value is empty', () => {
    render(<InputModal title="T" onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('Esc closes without saving', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<InputModal title="T" onSave={onSave} onClose={onClose} />);
    await user.type(screen.getByRole('textbox'), 'draft');
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('has an accessible close button', () => {
    render(<InputModal title="T" onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeTruthy();
  });
});
