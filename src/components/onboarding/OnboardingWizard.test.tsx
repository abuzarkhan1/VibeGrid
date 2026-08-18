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
      hasSeenOnboarding: false,
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
    expect(screen.getByText('Vibe')).toBeTruthy();
    expect(screen.getByText('Grid')).toBeTruthy();

    // Skip splash using keyboard Space
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

    // Select Quad Swarm preset
    const quadBtn = screen.getByText('Quad Swarm').closest('button');
    expect(quadBtn).toBeTruthy();
    if (quadBtn) fireEvent.click(quadBtn);

    expect(useOnboardingStore.getState().presetSelected).toBe(4);

    // Click Continue
    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    expect(useOnboardingStore.getState().currentStep).toBe('agents');
  });

  it('Step 3: renders Agent Launcher, scans and configures panes', async () => {
    useOnboardingStore.setState({ currentStep: 'agents' });
    render(<OnboardingWizard />);

    expect(screen.getByText(/Agent & Provider Engine|AI Agent & Shell Provider/i)).toBeTruthy();
    expect(screen.getByText('Pane Assignment Matrix')).toBeTruthy();

    // Find and click configure on first pane
    const configButtons = screen.getAllByRole('button', { name: /Configure/i });
    expect(configButtons.length).toBeGreaterThan(0);
    fireEvent.click(configButtons[0]);

    // Agent config modal opens
    expect(screen.getByText(/Configure Pane 1/i)).toBeTruthy();

    // Save configuration
    const saveBtn = screen.getByRole('button', { name: /Save Pane Config/i });
    fireEvent.click(saveBtn);

    // Click Continue
    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    expect(useOnboardingStore.getState().currentStep).toBe('customizer');
  });

  it('Step 4 & 5: renders Workspace Customizer, sets identity, and executes live launch', async () => {
    useOnboardingStore.setState({ currentStep: 'customizer' });
    render(<OnboardingWizard />);

    expect(screen.getByText(/Workspace Studio & Styling|Workspace Identity/i)).toBeTruthy();

    // Change workspace name via placeholder
    const nameInput = screen.getByPlaceholderText('e.g. Fullstack AI Agent Lab');
    fireEvent.change(nameInput, { target: { value: 'Production Nexus' } });

    expect(useOnboardingStore.getState().workspaceName).toBe('Production Nexus');

    // Click Launch Workspace
    const launchBtn = screen.getByRole('button', { name: /Launch Workspace/i });
    fireEvent.click(launchBtn);

    await waitFor(() => {
      expect(useOnboardingStore.getState().isOpen).toBe(false);
      expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true);
      expect(localStorage.getItem(ONBOARDING_COMPLETED_KEY)).toBe('1');
    });

    // Check workspace store created and pane store updated
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
      expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true);
      expect(localStorage.getItem(ONBOARDING_COMPLETED_KEY)).toBe('1');
    });
  });

  it('navigates back and forward through step progress bar', () => {
    useOnboardingStore.setState({ currentStep: 'agents' });
    render(<OnboardingWizard />);

    // Click progress bar button for visited step (Layout Studio)
    const layoutStepBtn = screen.getByRole('button', { name: /Layout Studio/i });
    fireEvent.click(layoutStepBtn);
    expect(useOnboardingStore.getState().currentStep).toBe('layout');

    // From layout, click footer continue to advance to agents
    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);
    expect(useOnboardingStore.getState().currentStep).toBe('agents');
  });
});
