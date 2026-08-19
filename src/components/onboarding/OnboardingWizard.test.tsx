import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingWizard } from './OnboardingWizard';
import { useOnboardingStore, ONBOARDING_COMPLETED_KEY } from '@/store/useOnboardingStore';
import { usePaneStore } from '@/store/usePaneStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

describe('OnboardingWizard End-to-End User Journey', () => {
  beforeEach(() => {
    localStorage.clear();
    useOnboardingStore.setState({
      isOpen: true,
      currentStep: 'splash',
      workspaceName: 'AI Command Center',
      workspaceEmoji: '🚀',
      workspaceCwd: '',
      workspaceEnv: {},
      isLaunching: false,
    });
  });

  it('renders nothing when isOpen is false', () => {
    useOnboardingStore.setState({ isOpen: false });
    const { container } = render(<OnboardingWizard />);
    expect(container.firstChild).toBeNull();
  });

  it('Step 1: renders Cinematic Splash Screen and advances on skip/complete', async () => {
    render(<OnboardingWizard />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByLabelText(/Launch Screen/i)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('VibeGrid');

    fireEvent.keyDown(window, { key: 'Space' });

    await waitFor(() => {
      expect(useOnboardingStore.getState().currentStep).toBe('layout');
    });
  });

  it('Step 2: renders Visual Layout Studio, selects preset, and advances', async () => {
    useOnboardingStore.setState({ currentStep: 'layout' });
    render(<OnboardingWizard />);

    expect(screen.getByText('Select Grid Layout')).toBeTruthy();
    expect(screen.getByText('AI Pair')).toBeTruthy();
    expect(screen.getByText('Quad Swarm')).toBeTruthy();

    const quadBtn = screen.getByText('Quad Swarm').closest('button');
    expect(quadBtn).toBeTruthy();
    if (quadBtn) fireEvent.click(quadBtn);

    expect(useOnboardingStore.getState().presetSelected).toBe(4);

    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    expect(useOnboardingStore.getState().currentStep).toBe('agents');
  });

  it('Step 3: renders Agent Launcher, scans and configures panes', async () => {
    useOnboardingStore.setState({ currentStep: 'agents' });
    render(<OnboardingWizard />);

    expect(screen.getByText(/Agent & Provider Engine|AI Agent & Shell Provider/i)).toBeTruthy();
    expect(screen.getByText('Pane Assignment Matrix')).toBeTruthy();

    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
    fireEvent.change(selects[0], { target: { value: 'aider' } });

    const expandButtons = screen.getAllByTitle(/Expand detailed config/i);
    expect(expandButtons.length).toBeGreaterThan(0);
    fireEvent.click(expandButtons[0]);

    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    expect(useOnboardingStore.getState().currentStep).toBe('customizer');
  });

  it('Step 4 & 5: renders Workspace Customizer, sets identity, and executes live launch', async () => {
    useOnboardingStore.setState({ currentStep: 'customizer' });
    render(<OnboardingWizard />);

    expect(screen.getByText(/Workspace Studio & Styling|Workspace Identity/i)).toBeTruthy();

    const nameInput = screen.getByPlaceholderText('e.g. Fullstack AI Agent Lab');
    fireEvent.change(nameInput, { target: { value: 'Production Nexus' } });

    expect(useOnboardingStore.getState().workspaceName).toBe('Production Nexus');

    const launchBtn = screen.getByRole('button', { name: /Launch Workspace/i });
    fireEvent.click(launchBtn);

    await waitFor(() => {
      expect(useOnboardingStore.getState().isOpen).toBe(false);
      expect(localStorage.getItem(ONBOARDING_COMPLETED_KEY)).toBe('1');
    });

    const currentWs = useWorkspaceStore.getState().workspaces.find((w) => w.name === 'Production Nexus');
    expect(currentWs).toBeDefined();
    expect(usePaneStore.getState().root).toBeDefined();
  });

  it('allows clicking Skip to immediately jump to default workspace', async () => {
    useOnboardingStore.setState({ currentStep: 'layout' });
    render(<OnboardingWizard />);

    const skipBtn = screen.getByRole('button', { name: /Skip/i });
    fireEvent.click(skipBtn);

    await waitFor(() => {
      expect(useOnboardingStore.getState().isOpen).toBe(false);
      expect(localStorage.getItem(ONBOARDING_COMPLETED_KEY)).toBe('1');
    });
  });

  it('navigates back and forward through step progress bar', () => {
    useOnboardingStore.setState({ currentStep: 'agents' });
    render(<OnboardingWizard />);

    const layoutStepBtn = screen.getByRole('button', { name: /Layout Studio/i });
    fireEvent.click(layoutStepBtn);
    expect(useOnboardingStore.getState().currentStep).toBe('layout');

    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);
    expect(useOnboardingStore.getState().currentStep).toBe('agents');
  });
});
