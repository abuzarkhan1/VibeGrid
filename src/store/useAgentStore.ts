import { create } from 'zustand';
import { DiscoveredAgent, PaneAgentConfig, HeterogeneousRolePod } from '@/types/agent';
import { BUILTIN_AGENTS, buildAgentCommand } from '@/lib/agentRegistry';
import { discoverInstalledAgents, writeToPty } from '@/lib/tauri';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';

interface AgentStoreState {
  isOpen: boolean;
  agents: DiscoveredAgent[];
  isScanning: boolean;
  selectedAgentId: string;
  selectedModel: string;
  selectedCliArgs: string[];
  selectedInitialPrompt: string;
  selectedAutoStart: boolean;
  paneAssignments: Record<string, PaneAgentConfig>;

  openLauncher: () => void;
  closeLauncher: () => void;
  setSelectedAgent: (id: string) => void;
  setSelectedModel: (model: string) => void;
  setSelectedCliArgs: (args: string[]) => void;
  setSelectedInitialPrompt: (prompt: string) => void;
  setSelectedAutoStart: (autoStart: boolean) => void;
  assignAgentToPane: (paneNodeId: string, config: PaneAgentConfig) => void;
  batchAssignAgentToAll: (
    paneNodeIds: string[],
    agentId: string,
    model?: string,
    cliArgs?: string[],
    initialPrompt?: string,
    autoStart?: boolean
  ) => void;
  applyRolePod: (pod: HeterogeneousRolePod, paneNodeIds: string[]) => void;
  scanInstalledAgents: () => Promise<void>;
  provisionActivePanes: () => Promise<number>;
}

export const useAgentStore = create<AgentStoreState>((set, get) => ({
  isOpen: false,
  agents: BUILTIN_AGENTS,
  isScanning: false,
  selectedAgentId: 'claude-code',
  selectedModel: 'claude-3-7-sonnet',
  selectedCliArgs: ['--dangerously-skip-permissions'],
  selectedInitialPrompt: '',
  selectedAutoStart: true,
  paneAssignments: {},

  openLauncher: () => set({ isOpen: true }),
  closeLauncher: () => set({ isOpen: false }),
  setSelectedAgent: (selectedAgentId) => {
    const agent = get().agents.find((a) => a.id === selectedAgentId);
    set({
      selectedAgentId,
      selectedModel: agent?.supportedModels[0] || '',
      selectedCliArgs: agent?.defaultArgs ? [...agent.defaultArgs] : [],
    });
  },
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setSelectedCliArgs: (selectedCliArgs) => set({ selectedCliArgs }),
  setSelectedInitialPrompt: (selectedInitialPrompt) => set({ selectedInitialPrompt }),
  setSelectedAutoStart: (selectedAutoStart) => set({ selectedAutoStart }),

  assignAgentToPane: (paneNodeId, config) =>
    set((state) => ({
      paneAssignments: {
        ...state.paneAssignments,
        [paneNodeId]: config,
      },
    })),

  batchAssignAgentToAll: (paneNodeIds, agentId, model, cliArgs, initialPrompt, autoStart = true) => {
    const agent = get().agents.find((a) => a.id === agentId) || BUILTIN_AGENTS[0];
    const newAssignments: Record<string, PaneAgentConfig> = {};
    paneNodeIds.forEach((id) => {
      newAssignments[id] = {
        agentId: agent.id,
        binaryPath: agent.binaryPath || (agent.id === 'claude-code' ? 'claude' : agent.id === 'antigravity' ? 'agy' : agent.id),
        name: agent.name,
        model: model !== undefined ? model : agent.supportedModels[0],
        cliArgs: cliArgs !== undefined ? [...cliArgs] : [...agent.defaultArgs],
        initialPrompt: initialPrompt,
        autoStart,
      };
    });
    set({ paneAssignments: newAssignments });
  },

  applyRolePod: (pod, paneNodeIds) => {
    const newAssignments: Record<string, PaneAgentConfig> = {};
    pod.assignments.forEach((assignment, index) => {
      const paneNodeId = paneNodeIds[index];
      if (paneNodeId) {
        const agent = get().agents.find((a) => a.id === assignment.agentId) || BUILTIN_AGENTS[0];
        newAssignments[paneNodeId] = {
          agentId: agent.id,
          binaryPath: agent.binaryPath || (agent.id === 'claude-code' ? 'claude' : agent.id === 'antigravity' ? 'agy' : agent.id),
          name: assignment.title,
          model: assignment.model || agent.supportedModels[0],
          cliArgs: assignment.cliArgs ? [...assignment.cliArgs] : [...agent.defaultArgs],
          initialPrompt: assignment.initialPrompt,
          autoStart: true,
        };
      }
    });
    set({ paneAssignments: newAssignments });
  },

  scanInstalledAgents: async () => {
    set({ isScanning: true });
    try {
      const results = await discoverInstalledAgents();
      const resultMap = new Map(results.map((r) => [r.agentId, r]));

      const updated = get().agents.map((agent) => {
        const res = resultMap.get(agent.id);
        if (res) {
          return {
            ...agent,
            isInstalled: res.isInstalled,
            binaryPath: res.binaryPath || agent.binaryPath,
            detectedVersion: res.detectedVersion || agent.detectedVersion,
          };
        }
        if (agent.id === 'shell') {
          return { ...agent, isInstalled: true };
        }
        return agent;
      });

      set({ agents: updated, isScanning: false });
    } catch (e) {
      console.warn('[VibeGrid] Agent discovery failed, keeping defaults:', e);
      useUIStore.getState().addToast({
        type: 'error',
        title: 'Agent scan failed',
        description: 'Could not detect installed agents. Check terminal permissions.',
      });
      set({ isScanning: false });
    }
  },

  provisionActivePanes: async () => {
    const { paneAssignments } = get();
    const root = usePaneStore.getState().root;
    const terminals = getTerminalNodes(root);
    let launchedCount = 0;

    for (const term of terminals) {
      const config = paneAssignments[term.id];
      if (!config) continue;

      if (config.name) {
        usePaneStore.getState().setPaneTitle(term.id, config.name);
      }

      if (config.autoStart && config.agentId !== 'shell' && term.paneId) {
        const cmd = buildAgentCommand(config);
        if (cmd) {
          await writeToPty(term.paneId, `${cmd}\n`);
          launchedCount++;
        }
      }
    }

    return launchedCount;
  },
}));
