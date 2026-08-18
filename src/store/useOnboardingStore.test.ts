import { describe, it, expect, beforeEach } from 'vitest';
import { useOnboardingStore, ONBOARDING_COMPLETED_KEY } from './useOnboardingStore';
import { getTerminalNodesFromTree } from '@/lib/layoutUtils';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useOnboardingStore.setState({
      isOpen: true,
      currentStep: 'splash',
      workspaceName: 'AI Command Center',
      workspaceEmoji: '🚀',
      workspaceCwd: '',
      workspaceEnv: {},
    });
  });

  it('steps through the onboarding sequence', () => {
    const store = useOnboardingStore.getState();
    expect(store.currentStep).toBe('splash');

    store.nextStep();
    expect(useOnboardingStore.getState().currentStep).toBe('layout');

    store.nextStep();
    expect(useOnboardingStore.getState().currentStep).toBe('agents');

    store.nextStep();
    expect(useOnboardingStore.getState().currentStep).toBe('customizer');

    store.prevStep();
    expect(useOnboardingStore.getState().currentStep).toBe('agents');
  });

  it('changes preset and automatically populates terminal agent assignments', () => {
    const store = useOnboardingStore.getState();
    store.setPresetSelected(4);

    const updated = useOnboardingStore.getState();
    expect(updated.presetSelected).toBe(4);

    const terms = getTerminalNodesFromTree(updated.draftLayout);
    expect(terms.length).toBe(4);

    // Each terminal has an agent assignment
    for (const term of terms) {
      expect(updated.paneAgentAssignments[term.id]).toBeDefined();
    }
  });

  it('assigns custom agent config to a specific pane', () => {
    const store = useOnboardingStore.getState();
    const terms = getTerminalNodesFromTree(store.draftLayout);
    const targetId = terms[0].id;

    store.assignAgentToPane(targetId, {
      agentId: 'claude-code',
      binaryPath: '/usr/local/bin/claude',
      name: 'Claude Code',
      model: 'claude-3-7-sonnet',
      cliArgs: ['--dangerously-skip-permissions'],
      initialPrompt: 'Review the project',
      autoStart: true,
    });

    const updated = useOnboardingStore.getState().paneAgentAssignments[targetId];
    expect(updated.name).toBe('Claude Code');
    expect(updated.model).toBe('claude-3-7-sonnet');
    expect(updated.cliArgs).toContain('--dangerously-skip-permissions');
  });

  it('skips to default and marks onboarding as completed in localStorage', async () => {
    const store = useOnboardingStore.getState();
    await store.skipToDefault();

    expect(useOnboardingStore.getState().isOpen).toBe(false);
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true);
    expect(localStorage.getItem(ONBOARDING_COMPLETED_KEY)).toBe('1');
  });

  it('completes onboarding and launches workspace', async () => {
    const store = useOnboardingStore.getState();
    store.setWorkspaceIdentity('Engine Workspace', '⚡', '/path/to/project');
    store.setWorkspaceEnv({ ANTHROPIC_API_KEY: 'test-key' });

    await store.completeAndLaunch();

    expect(useOnboardingStore.getState().isOpen).toBe(false);
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true);
  });
});
