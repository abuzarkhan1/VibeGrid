import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceCustomizerModal } from './WorkspaceCustomizerModal';
import { IdentitySection } from './IdentitySection';
import { DirectoryEnvSection } from './DirectoryEnvSection';
import { ThemeStudioSection } from './ThemeStudioSection';
import { ModularStatusBarEditor } from './ModularStatusBarEditor';
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

      // Click auto-detect name
      const autoBtn = screen.getByRole('button', { name: /Auto-Detect Name/i });
      fireEvent.click(autoBtn);
      expect(useCustomizationStore.getState().workspaceName).toBe('Dev');
    });

    it('updates emoji badge on emblem click', () => {
      render(<IdentitySection />);
      const robotBtn = screen.getByText('🤖');
      fireEvent.click(robotBtn);
      expect(useCustomizationStore.getState().workspaceIcon.value).toBe('🤖');
    });
  });

  describe('DirectoryEnvSection', () => {
    it('renders CWD input, Browse button, and secret vault', () => {
      render(<DirectoryEnvSection />);
      expect(screen.getByDisplayValue('/Users/test/dev')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Browse/i })).toBeTruthy();
      expect(screen.getByText('OPENAI_API_KEY')).toBeTruthy();

      // Quick add a key
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

      // Switch theme
      const oneDarkBtns = screen.getAllByRole('button', { name: /One Dark Pro/i });
      fireEvent.click(oneDarkBtns[oneDarkBtns.length - 1]);
      expect(useCustomizationStore.getState().themeName).toBe('oneDarkPro');
    });
  });

  describe('ModularStatusBarEditor', () => {
    it('renders all 8 telemetry widget cards and toggles widgets', () => {
      render(<ModularStatusBarEditor />);
      expect(screen.getAllByText('Workspace Identity')[0]).toBeTruthy();
      expect(screen.getAllByText('Git Branch & Status')[0]).toBeTruthy();
      expect(screen.getAllByText('Active Agents HUD')[0]).toBeTruthy();
      expect(screen.getAllByText('Token & Cost Meter')[0]).toBeTruthy();
      expect(screen.getAllByText('GPU WebGL Telemetry')[0]).toBeTruthy();
      expect(screen.getAllByText('CPU & RAM Monitor')[0]).toBeTruthy();
      expect(screen.getAllByText('Listening Ports')[0]).toBeTruthy();
      expect(screen.getAllByText('Audio VU Meter')[0]).toBeTruthy();

      // Toggle widget
      const toggleButtons = screen.getAllByTitle(/widget/i);
      expect(toggleButtons.length).toBeGreaterThan(0);
      fireEvent.click(toggleButtons[0]);
    });
  });

  describe('WorkspaceCustomizerModal', () => {
    it('renders full customizer modal and saves cleanly', () => {
      useCustomizationStore.setState({ isOpen: true });
      render(<WorkspaceCustomizerModal />);

      expect(screen.getByRole('dialog', { name: /Codex Customization Studio/i })).toBeTruthy();

      // Click Save & Apply
      const saveBtn = screen.getByRole('button', { name: /Save & Apply/i });
      fireEvent.click(saveBtn);

      expect(useCustomizationStore.getState().isOpen).toBe(false);
    });
  });
});
