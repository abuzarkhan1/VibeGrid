import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentStore } from './useAgentStore';
import { BUILTIN_AGENTS, HETEROGENEOUS_ROLE_PODS, buildAgentCommand } from '@/lib/agentRegistry';

describe('useAgentStore', () => {
  beforeEach(() => {
    useAgentStore.setState({
      isOpen: false,
      agents: BUILTIN_AGENTS,
      isScanning: false,
      selectedAgentId: 'claude-code',
      selectedModel: 'claude-3-7-sonnet',
      selectedCliArgs: ['--dangerously-skip-permissions'],
      selectedInitialPrompt: '',
      selectedAutoStart: true,
      paneAssignments: {},
    });
  });

  it('initializes with all 14 built-in AI agents and pods', () => {
    const state = useAgentStore.getState();
    expect(state.agents.length).toBe(14);
    expect(state.isOpen).toBe(false);
    expect(state.selectedAgentId).toBe('claude-code');
  });

  it('toggles launcher open and close states', () => {
    const store = useAgentStore.getState();
    store.openLauncher();
    expect(useAgentStore.getState().isOpen).toBe(true);

    store.closeLauncher();
    expect(useAgentStore.getState().isOpen).toBe(false);
  });

  it('updates selected agent and automatically sets its default model and args', () => {
    const store = useAgentStore.getState();
    store.setSelectedAgent('aider');

    const state = useAgentStore.getState();
    expect(state.selectedAgentId).toBe('aider');
    expect(state.selectedModel).toBe('claude-3-7-sonnet');
    expect(state.selectedCliArgs).toContain('--auto-commits');
  });

  it('assigns single pane agent configuration', () => {
    const store = useAgentStore.getState();
    store.assignAgentToPane('pane-1', {
      agentId: 'codex',
      binaryPath: 'codex',
      name: 'OpenAI Codex',
      model: 'o3-mini',
      cliArgs: ['--verbose'],
      initialPrompt: 'Review auth system',
      autoStart: true,
    });

    const assignment = useAgentStore.getState().paneAssignments['pane-1'];
    expect(assignment).toBeDefined();
    expect(assignment.agentId).toBe('codex');
    expect(assignment.model).toBe('o3-mini');
    expect(assignment.initialPrompt).toBe('Review auth system');
  });

  it('performs batch assignment across multiple panes', () => {
    const store = useAgentStore.getState();
    const paneIds = ['pane-1', 'pane-2', 'pane-3', 'pane-4'];

    store.batchAssignAgentToAll(
      paneIds,
      'ollama',
      'deepseek-r1:32b',
      ['--verbose'],
      'Inspect local files',
      true
    );

    const assignments = useAgentStore.getState().paneAssignments;
    for (const id of paneIds) {
      expect(assignments[id]).toBeDefined();
      expect(assignments[id].agentId).toBe('ollama');
      expect(assignments[id].model).toBe('deepseek-r1:32b');
      expect(assignments[id].cliArgs).toEqual(['--verbose']);
      expect(assignments[id].initialPrompt).toBe('Inspect local files');
      expect(assignments[id].autoStart).toBe(true);
    }
  });

  it('applies heterogeneous role pods across panes', () => {
    const store = useAgentStore.getState();
    const quadPod = HETEROGENEOUS_ROLE_PODS.find((p) => p.id === 'feature-team-4')!;
    expect(quadPod).toBeDefined();

    const paneIds = ['pane-1', 'pane-2', 'pane-3', 'pane-4'];
    store.applyRolePod(quadPod, paneIds);

    const state = useAgentStore.getState();

    const a0 = state.paneAssignments['pane-1'];
    expect(a0.agentId).toBe('claude-code');
    expect(a0.name).toBe('Claude Code (Architect)');

    const a1 = state.paneAssignments['pane-2'];
    expect(a1.agentId).toBe('aider');
    expect(a1.name).toBe('Aider (Refactorer)');

    const a2 = state.paneAssignments['pane-3'];
    expect(a2.agentId).toBe('ollama');
    expect(a2.model).toBe('deepseek-r1:32b');

    const a3 = state.paneAssignments['pane-4'];
    expect(a3.agentId).toBe('shell');
    expect(a3.name).toBe('Dev Server');
  });

  it('scans installed agents and updates version/status', async () => {
    const store = useAgentStore.getState();
    await store.scanInstalledAgents();

    const state = useAgentStore.getState();
    expect(state.isScanning).toBe(false);

    const claude = state.agents.find((a) => a.id === 'claude-code')!;
    expect(claude.isInstalled).toBe(true);
    expect(claude.binaryPath).toBe('/usr/local/bin/claude');

    const shell = state.agents.find((a) => a.id === 'shell')!;
    expect(shell.isInstalled).toBe(true);
  });

  it('correctly builds CLI command strings via buildAgentCommand', () => {

    const claudeCmd = buildAgentCommand({
      agentId: 'claude-code',
      binaryPath: 'claude',
      name: 'Claude Code',
      model: 'claude-3-7-sonnet',
      cliArgs: ['--dangerously-skip-permissions'],
      initialPrompt: 'Fix failing tests in auth.rs',
      autoStart: true,
    });
    expect(claudeCmd).toBe('claude --model claude-3-7-sonnet --dangerously-skip-permissions "Fix failing tests in auth.rs"');

    const aiderCmd = buildAgentCommand({
      agentId: 'aider',
      binaryPath: 'aider',
      name: 'Aider',
      model: 'claude-3-7-sonnet',
      cliArgs: ['--auto-commits'],
      autoStart: true,
    });
    expect(aiderCmd).toBe('aider --model claude-3-7-sonnet --auto-commits');

    const ollamaCmd = buildAgentCommand({
      agentId: 'ollama',
      binaryPath: 'ollama',
      name: 'Ollama',
      model: 'deepseek-r1:32b',
      cliArgs: ['run', 'deepseek-r1:32b'],
      autoStart: true,
    });
    expect(ollamaCmd).toBe('ollama run deepseek-r1:32b');

    const shellCmd = buildAgentCommand({
      agentId: 'shell',
      binaryPath: 'zsh',
      name: 'Terminal',
      cliArgs: [],
      autoStart: true,
    });
    expect(shellCmd).toBe('');
  });
});
