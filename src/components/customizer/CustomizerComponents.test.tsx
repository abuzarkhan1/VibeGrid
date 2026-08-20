import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceCustomizerModal } from './WorkspaceCustomizerModal';
import { IdentitySection } from './IdentitySection';
import { DirectoryEnvSection } from './DirectoryEnvSection';
import { ThemeStudioSection } from './ThemeStudioSection';
import { useCustomizationStore } from '@/store/useCustomizationStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';

describe('Customizer Components & ICE UI', () => {
  beforeEach(() => {
    localStorage.clear();
    useOnboardingStore.setState({ isOpen: false });
    useCustomizationStore.setState({
      isOpen: false,
      activeSection: 'identity',
      workspaceName: 'Dev Center',
      workspaceIcon: { type: 'emoji', value: '⚡' },
      colorRingHex: '#3c95f0',
      defaultCwd: '/Users/test/dev',
      envVars: { OPENAI_API_KEY: 'sk-mock-123' },
      themeName: 'tokyoNight',
      themeMode: 'dark',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      fontLigatures: true,
      lineHeight: 1.2,
      terminalOpacity: 0.95,
      cursorStyle: 'bar',
      cursorBlink: true,
    });
  });

  describe('IdentitySection', () => {
    it('renders workspace name input, emblem choices and color rings', () => {
      render(<IdentitySection />);
      expect(screen.getByDisplayValue('Dev Center')).toBeTruthy();
      expect(screen.getByText('Workspace Emblem / Badge')).toBeTruthy();
      expect(screen.getByText('Color Identity Ring')).toBeTruthy();

      const autoBtn = screen.getByRole('button', { name: /Auto-Detect/i });
      fireEvent.click(autoBtn);
      expect(useCustomizationStore.getState().workspaceName).toBe('Dev');
    });

    it('updates vector icon badge on emblem click', () => {
      render(<IdentitySection />);
      const botBtn = screen.getByRole('button', { name: /Agent Bot/i });
      fireEvent.click(botBtn);
      expect(useCustomizationStore.getState().workspaceIcon.value).toBe('Bot');
    });

    it('renders emoji character when val is not a Lucide icon ID (EMOJI-01)', () => {
      useCustomizationStore.setState({
        workspaceIcon: { type: 'emoji', value: '⚡' },
      });
      render(<IdentitySection />);
      expect(screen.getByText('⚡')).toBeTruthy();
    });

    it('has aria-label tags on all color rings (EMOJI-01)', () => {
      render(<IdentitySection />);
      expect(screen.getByRole('button', { name: 'VibeGrid Violet' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Electric Azure' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Matrix Emerald' })).toBeTruthy();
      expect(screen.getByLabelText('Custom Hex Color')).toBeTruthy();
    });
  });

  describe('DirectoryEnvSection', () => {
    it('renders CWD input, Browse button, and secret vault', () => {
      render(<DirectoryEnvSection />);
      expect(screen.getByDisplayValue('/Users/test/dev')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Browse/i })).toBeTruthy();
      expect(screen.getByText('OPENAI_API_KEY')).toBeTruthy();

      const quickAddAnthropic = screen.getByText('+ ANTHROPIC_API_KEY');
      fireEvent.click(quickAddAnthropic);
      expect(useCustomizationStore.getState().envVars['ANTHROPIC_API_KEY']).toBeDefined();
    });
  });

  describe('ThemeStudioSection', () => {
    it('renders 3-role theme studio, WCAG scorecard badge, and theme cards', () => {
      render(<ThemeStudioSection />);
      expect(screen.getByText(/3-Role Theme Studio/i)).toBeTruthy();
      expect(screen.getAllByText('Tokyo Night')[0]).toBeTruthy();
      expect(screen.getAllByText('One Dark Pro')[0]).toBeTruthy();

      const oneDarkBtns = screen.getAllByRole('button', { name: /One Dark Pro/i });
      fireEvent.click(oneDarkBtns[oneDarkBtns.length - 1]);
      expect(useCustomizationStore.getState().themeName).toBe('oneDarkPro');
    });
  });

  describe('WorkspaceCustomizerModal', () => {
    it('renders full customizer modal and saves cleanly', () => {
      useCustomizationStore.setState({ isOpen: true });
      render(<WorkspaceCustomizerModal />);

      expect(screen.getByRole('dialog', { name: /Customization Studio/i })).toBeTruthy();

      const saveBtn = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveBtn);

      expect(useCustomizationStore.getState().isOpen).toBe(false);
    });
  });
});
