import { describe, it, expect } from 'vitest';
import { useAgentCatalogStore } from './useAgentCatalogStore';

describe('useAgentCatalogStore', () => {
  it('initializes with all 14 major AI CLI agents and native shell', () => {
    const agents = useAgentCatalogStore.getState().agents;
    const requiredAgents = [
      'claude-code',
      'codex',
      'antigravity',
      'grok',
      'kimi',
      'qwen',
      'aider',
      'openhands',
      'ollama',
      'deepseek',
      'gemini',
      'goose',
      'cline',
      'shell',
    ];

    for (const id of requiredAgents) {
      expect(agents[id], `Expected agent ${id} to be defined`).toBeDefined();
    }
  });

  it('scans and discovers agents via tauri API', async () => {
    const store = useAgentCatalogStore.getState();
    await store.scanInstalledAgents();

    const updated = useAgentCatalogStore.getState();
    expect(updated.lastScannedAt).not.toBeNull();
    expect(updated.agents.shell.isInstalled).toBe(true);
    expect(updated.agents['claude-code'].isInstalled).toBe(true);
    expect(updated.agents.aider.isInstalled).toBe(true);
  });

  it('retrieves agent by ID correctly', () => {
    const store = useAgentCatalogStore.getState();
    const claude = store.getAgentById('claude-code');
    expect(claude).toBeDefined();
    expect(claude?.name).toBe('Claude Code');
    expect(claude?.supportedModels).toContain('claude-3-7-sonnet');
  });
});
