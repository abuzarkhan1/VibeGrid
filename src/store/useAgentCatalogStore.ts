import { create } from 'zustand';
import { DiscoveredAgent } from '@/types/onboarding';
import { discoverInstalledAgents } from '@/lib/tauri';
import { BUILTIN_AGENTS } from '@/lib/agentRegistry';

export const DEFAULT_AGENT_CATALOG: Record<string, DiscoveredAgent> = BUILTIN_AGENTS.reduce(
  (acc, agent) => {
    acc[agent.id] = { ...agent };
    return acc;
  },
  {} as Record<string, DiscoveredAgent>
);

interface AgentCatalogState {
  agents: Record<string, DiscoveredAgent>;
  isScanning: boolean;
  lastScannedAt: number | null;
  scanInstalledAgents: () => Promise<void>;
  getAgentById: (id: string) => DiscoveredAgent | undefined;
}

export const useAgentCatalogStore = create<AgentCatalogState>((set, get) => ({
  agents: DEFAULT_AGENT_CATALOG,
  isScanning: false,
  lastScannedAt: null,

  scanInstalledAgents: async () => {
    set({ isScanning: true });
    try {
      const results = await discoverInstalledAgents();
      set((state) => {
        const updated = { ...state.agents };
        for (const res of results) {
          if (updated[res.agentId]) {
            updated[res.agentId] = {
              ...updated[res.agentId],
              isInstalled: res.isInstalled,
              binaryPath: res.binaryPath,
              detectedVersion: res.detectedVersion,
            };
          }
        }
        // Shell is always considered installed
        if (updated.shell) {
          updated.shell.isInstalled = true;
        }
        return { agents: updated, isScanning: false, lastScannedAt: Date.now() };
      });
    } catch (e) {
      console.warn('[VibeGrid] Agent discovery failed, fallback to defaults:', e);
      set({ isScanning: false, lastScannedAt: Date.now() });
    }
  },

  getAgentById: (id: string) => {
    return get().agents[id];
  },
}));
