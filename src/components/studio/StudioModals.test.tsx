import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LayoutStudioModal } from './LayoutStudioModal';
import { LayoutStudio } from './LayoutStudio';
import { CustomGridBuilder } from './CustomGridBuilder';
import { GridTemplatePicker } from './GridTemplatePicker';
import { AgentLauncherModal } from '../agent/AgentLauncherModal';
import { WorkspaceCustomizerModal } from '../customizer/WorkspaceCustomizerModal';
import { useLayoutStudioStore } from '@/store/useLayoutStudioStore';
import { useAgentStore } from '@/store/useAgentStore';
import { useCustomizationStore } from '@/store/useCustomizationStore';
import { usePaneStore } from '@/store/usePaneStore';

describe('Studio Modals & Chained Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
    useLayoutStudioStore.setState({ isOpen: false, selectedPresetId: '4-quad' });
    useAgentStore.setState({ isOpen: false, selectedAgentId: 'claude-code' });
    useCustomizationStore.setState({ isOpen: false, activeSection: 'identity' });
  });

  describe('LayoutStudioModal', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(<LayoutStudioModal />);
      expect(container.firstChild).toBeNull();
    });

    it('renders and allows selecting a preset and deploying layout', () => {
      useLayoutStudioStore.setState({ isOpen: true });
      render(<LayoutStudioModal />);

      expect(screen.getByRole('dialog', { name: /Layout Studio/i })).toBeTruthy();
      expect(screen.getByText('Layout Studio')).toBeTruthy();

      const soloCard = screen.getByText('Solo').closest('button');
      expect(soloCard).toBeTruthy();
      if (soloCard) fireEvent.click(soloCard);

      const deployBtn = screen.getByRole('button', { name: /Deploy Layout/i });
      fireEvent.click(deployBtn);

      expect(useLayoutStudioStore.getState().isOpen).toBe(false);
      expect(usePaneStore.getState().layoutMode).toBe('custom');
    });

    it('chains to AgentLauncherModal when onProceedToAgents is passed', () => {
      useLayoutStudioStore.setState({ isOpen: true });
      const onProceed = () => useAgentStore.getState().openLauncher();
      render(<LayoutStudioModal onProceedToAgents={onProceed} />);

      const deployBtn = screen.getByRole('button', { name: /Deploy Layout/i });
      fireEvent.click(deployBtn);

      expect(useLayoutStudioStore.getState().isOpen).toBe(false);
      expect(useAgentStore.getState().isOpen).toBe(true);
    });

    it('sets --sash-size to 0px when gutterWidth is 0 (GUTTER-01)', () => {
      useLayoutStudioStore.setState({ isOpen: true, gutterWidth: 0 });
      render(<LayoutStudioModal />);

      const deployBtn = screen.getByRole('button', { name: /Deploy Layout/i });
      fireEvent.click(deployBtn);

      expect(document.documentElement.style.getPropertyValue('--sash-size')).toBe('0px');
    });
  });

  describe('CustomGridBuilder', () => {
    it('formats raw enum ratioMode into human-readable titles (TXT-02)', () => {
      act(() => {
        useLayoutStudioStore.setState({ ratioMode: 'hero-sidebar', customRatioValue: 0.7 });
      });
      const { rerender } = render(<CustomGridBuilder />);

      expect(screen.getByText(/Hero Sidebar/i)).toBeTruthy();

      act(() => {
        useLayoutStudioStore.setState({ ratioMode: 'golden', customRatioValue: 0.618 });
      });
      rerender(<CustomGridBuilder />);
      expect(screen.getByText(/Golden Ratio/i)).toBeTruthy();

      act(() => {
        useLayoutStudioStore.setState({ ratioMode: 'tri-split', customRatioValue: 0.25 });
      });
      rerender(<CustomGridBuilder />);
      expect(screen.getByText(/Tri-Split/i)).toBeTruthy();
    });

    it('resets isMouseDown on global window mouseup (DRAG-01)', () => {
      render(<CustomGridBuilder />);
      const cell1 = screen.getByRole('button', { name: '1x1' });
      fireEvent.mouseDown(cell1);
      fireEvent.mouseUp(window);
      const cell8 = screen.getByRole('button', { name: '8x8' });
      fireEvent.mouseEnter(cell8);
      expect(useLayoutStudioStore.getState().customRows).toBe(2);
      expect(useLayoutStudioStore.getState().customCols).toBe(2);
    });
  });

  describe('LayoutStudio', () => {
    it('displays Live Layout Preview label (TXT-01)', () => {
      render(<LayoutStudio />);
      expect(screen.getByText('Live Layout Preview')).toBeTruthy();
      expect(screen.queryByText('Live Grid Topology')).toBeNull();
    });
  });

  describe('GridTemplatePicker', () => {
    it('does not render floating POPULAR / SWARM / FLEET badges', () => {
      render(<GridTemplatePicker />);
      expect(screen.queryByText('POPULAR')).toBeNull();
      expect(screen.queryByText('SWARM')).toBeNull();
      expect(screen.queryByText('FLEET')).toBeNull();
    });
  });

  describe('AgentLauncherModal', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(<AgentLauncherModal />);
      expect(container.firstChild).toBeNull();
    });

    it('renders and provisions agents across panes', async () => {
      useAgentStore.setState({ isOpen: true });
      render(<AgentLauncherModal />);

      expect(screen.getByRole('dialog', { name: /Agent Launcher/i })).toBeTruthy();
      expect(screen.getByText('Agent Launcher')).toBeTruthy();

      const claudeCard = screen.getByText('Claude').closest('div');
      expect(claudeCard).toBeTruthy();
      if (claudeCard) fireEvent.click(claudeCard);

      const provisionBtn = screen.getByRole('button', { name: /Deploy Agents/i });
      fireEvent.click(provisionBtn);

      await waitFor(() => {
        expect(useAgentStore.getState().isOpen).toBe(false);
      });
    });

    it('chains to WorkspaceCustomizerModal when onProceedToCustomizer is passed', async () => {
      useAgentStore.setState({ isOpen: true });
      const onProceed = () => useCustomizationStore.getState().openCustomizer();
      render(<AgentLauncherModal onProceedToCustomizer={onProceed} />);

      const provisionBtn = screen.getByRole('button', { name: /Deploy Agents/i });
      fireEvent.click(provisionBtn);

      await waitFor(() => {
        expect(useAgentStore.getState().isOpen).toBe(false);
        expect(useCustomizationStore.getState().isOpen).toBe(true);
      });
    });
  });

  describe('WorkspaceCustomizerModal', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(<WorkspaceCustomizerModal />);
      expect(container.firstChild).toBeNull();
    });

    it('renders, switches sections, and saves customizations', () => {
      useCustomizationStore.setState({ isOpen: true });
      render(<WorkspaceCustomizerModal />);

      expect(screen.getByRole('dialog', { name: /Customization Studio/i })).toBeTruthy();
      expect(screen.getByText('Customization Studio')).toBeTruthy();

      const themeTab = screen.getByRole('button', { name: /Theme Studio/i });
      fireEvent.click(themeTab);
      expect(useCustomizationStore.getState().activeSection).toBe('appearance');

      const saveBtn = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveBtn);

      expect(useCustomizationStore.getState().isOpen).toBe(false);
    });
  });
});
