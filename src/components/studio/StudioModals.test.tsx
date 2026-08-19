import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LayoutStudioModal } from './LayoutStudioModal';
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

      expect(screen.getByRole('dialog', { name: /Layout Selection Studio/i })).toBeTruthy();
      expect(screen.getByText('Layout Selection Studio')).toBeTruthy();

      // Select preset
      const soloCard = screen.getByText('1-Pane Solo').closest('button');
      expect(soloCard).toBeTruthy();
      if (soloCard) fireEvent.click(soloCard);

      // Deploy layout
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
  });

  describe('AgentLauncherModal', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(<AgentLauncherModal />);
      expect(container.firstChild).toBeNull();
    });

    it('renders and provisions agents across panes', async () => {
      useAgentStore.setState({ isOpen: true });
      render(<AgentLauncherModal />);

      expect(screen.getByRole('dialog', { name: /AI Agent & CLI Launcher/i })).toBeTruthy();
      expect(screen.getByText('AI Agent & CLI Launcher')).toBeTruthy();

      // Select Claude Code
      const claudeCard = screen.getByText('Claude Code').closest('div');
      expect(claudeCard).toBeTruthy();
      if (claudeCard) fireEvent.click(claudeCard);

      // Click Provision Agents
      const provisionBtn = screen.getByRole('button', { name: /Provision Agents/i });
      fireEvent.click(provisionBtn);

      await waitFor(() => {
        expect(useAgentStore.getState().isOpen).toBe(false);
      });
    });

    it('chains to WorkspaceCustomizerModal when onProceedToCustomizer is passed', async () => {
      useAgentStore.setState({ isOpen: true });
      const onProceed = () => useCustomizationStore.getState().openCustomizer();
      render(<AgentLauncherModal onProceedToCustomizer={onProceed} />);

      const provisionBtn = screen.getByRole('button', { name: /Provision Agents/i });
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

      expect(screen.getByRole('dialog', { name: /VibeGrid Customization Studio/i })).toBeTruthy();
      expect(screen.getByText('VibeGrid Customization Studio')).toBeTruthy();

      // Switch to Theme Studio tab
      const themeTab = screen.getByRole('button', { name: /Theme Studio/i });
      fireEvent.click(themeTab);
      expect(useCustomizationStore.getState().activeSection).toBe('appearance');

      // Click Save & Apply
      const saveBtn = screen.getByRole('button', { name: /Save & Apply/i });
      fireEvent.click(saveBtn);

      expect(useCustomizationStore.getState().isOpen).toBe(false);
    });
  });
});
