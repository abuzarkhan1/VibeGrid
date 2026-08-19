import { create } from 'zustand';
import { PaneNode, PresetCount } from '@/types/layout';
import { OnboardingStep, PaneSpawnSpec } from '@/types/onboarding';
import { PaneAgentConfig } from '@/types/agent';
import { buildPresetTree, buildAiPairTree, getTerminalNodesFromTree } from '@/lib/layoutUtils';
import { buildAgentCommand } from '@/lib/agentRegistry';
import { batchSpawnPanes, isTauri } from '@/lib/tauri';
import { useWorkspaceStore } from './useWorkspaceStore';
import { usePaneStore } from './usePaneStore';
import { useSettingsStore } from './useSettingsStore';
import { useCustomizationStore } from './useCustomizationStore';

export const ONBOARDING_COMPLETED_KEY = 'vibegrid_onboarding_completed_v1';

interface OnboardingState {
  isOpen: boolean;
  currentStep: OnboardingStep;
  draftLayout: PaneNode;
  presetSelected: PresetCount | 'ai-pair';
  paneAgentAssignments: Record<string, PaneAgentConfig>;
  workspaceName: string;
  workspaceEmoji: string;
  workspaceCwd: string;
  workspaceEnv: Record<string, string>;
  isLaunching: boolean;

  // Actions
  openOnboarding: (step?: OnboardingStep) => void;
  setStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipToDefault: () => Promise<void>;
  setPresetSelected: (preset: PresetCount | 'ai-pair') => void;
  assignAgentToPane: (paneNodeId: string, config: PaneAgentConfig) => void;
  setWorkspaceIdentity: (name: string, emoji: string, cwd: string) => void;
  setWorkspaceEnv: (env: Record<string, string>) => void;
  completeAndLaunch: () => Promise<void>;
}

const initialLayout = buildAiPairTree();
const initialTerms = getTerminalNodesFromTree(initialLayout);

// Default initial agent mappings
const defaultAssignments: Record<string, PaneAgentConfig> = {};
if (initialTerms[0]) {
  defaultAssignments[initialTerms[0].id] = {
    agentId: 'shell',
    binaryPath: '',
    name: 'Interactive Shell',
    cliArgs: [],
    autoStart: true,
  };
}
if (initialTerms[1]) {
  defaultAssignments[initialTerms[1].id] = {
    agentId: 'claude-code',
    binaryPath: 'claude',
    name: 'Claude Code',
    model: 'claude-3-7-sonnet',
    cliArgs: ['--dangerously-skip-permissions'],
    initialPrompt: 'Inspect this workspace and suggest next engineering tasks.',
    autoStart: true,
  };
}
if (initialTerms[2]) {
  defaultAssignments[initialTerms[2].id] = {
    agentId: 'aider',
    binaryPath: 'aider',
    name: 'Aider',
    model: 'claude-3-7-sonnet',
    cliArgs: ['--auto-commits'],
    autoStart: false,
  };
}

export const useOnboardingStore = create<OnboardingState>((set, get) => {
  let hasCompleted = false;
  try {
    hasCompleted = !!localStorage.getItem(ONBOARDING_COMPLETED_KEY);
  } catch (e) {
    // Ignore storage check in test or restricted environments
  }

  return {
    isOpen: !hasCompleted,
    currentStep: 'splash',
    draftLayout: initialLayout,
    presetSelected: 'ai-pair',
    paneAgentAssignments: defaultAssignments,
    workspaceName: 'AI Command Center',
    workspaceEmoji: '🚀',
    workspaceCwd: '',
    workspaceEnv: {},
    isLaunching: false,

    openOnboarding: (step = 'splash') => {
      set({ isOpen: true, currentStep: step });
    },

    setStep: (step: OnboardingStep) => {
      set({ currentStep: step });
    },

    nextStep: () => {
      const stepOrder: OnboardingStep[] = ['splash', 'layout', 'agents', 'customizer', 'launch'];
      const curIdx = stepOrder.indexOf(get().currentStep);
      if (curIdx >= 0 && curIdx < stepOrder.length - 1) {
        set({ currentStep: stepOrder[curIdx + 1] });
      }
    },

    prevStep: () => {
      const stepOrder: OnboardingStep[] = ['splash', 'layout', 'agents', 'customizer', 'launch'];
      const curIdx = stepOrder.indexOf(get().currentStep);
      if (curIdx > 1) {
        set({ currentStep: stepOrder[curIdx - 1] });
      }
    },

    setPresetSelected: (preset: PresetCount | 'ai-pair') => {
      let newLayout: PaneNode;
      if (preset === 'ai-pair') {
        newLayout = buildAiPairTree();
      } else {
        newLayout = buildPresetTree(preset);
      }
      const terms = getTerminalNodesFromTree(newLayout);
      const updatedAssignments = { ...get().paneAgentAssignments };

      // Ensure every new terminal has a default agent assignment
      terms.forEach((term, idx) => {
        if (!updatedAssignments[term.id]) {
          if (idx === 0) {
            updatedAssignments[term.id] = {
              agentId: 'shell',
              binaryPath: '',
              name: 'Interactive Shell',
              cliArgs: [],
              autoStart: true,
            };
          } else if (idx === 1) {
            updatedAssignments[term.id] = {
              agentId: 'claude-code',
              binaryPath: 'claude',
              name: 'Claude Code',
              model: 'claude-3-7-sonnet',
              cliArgs: ['--dangerously-skip-permissions'],
              autoStart: true,
            };
          } else {
            updatedAssignments[term.id] = {
              agentId: 'aider',
              binaryPath: 'aider',
              name: 'Aider',
              model: 'claude-3-7-sonnet',
              cliArgs: [],
              autoStart: false,
            };
          }
        }
      });

      set({
        presetSelected: preset,
        draftLayout: newLayout,
        paneAgentAssignments: updatedAssignments,
      });
    },

    assignAgentToPane: (paneNodeId: string, config: PaneAgentConfig) => {
      set((state) => ({
        paneAgentAssignments: {
          ...state.paneAgentAssignments,
          [paneNodeId]: config,
        },
      }));
    },

    setWorkspaceIdentity: (workspaceName: string, workspaceEmoji: string, workspaceCwd: string) => {
      set({ workspaceName, workspaceEmoji, workspaceCwd });
    },

    setWorkspaceEnv: (workspaceEnv: Record<string, string>) => {
      set({ workspaceEnv });
    },

    skipToDefault: async () => {
      try {
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, '1');
      } catch (_e) {
        // Ignore localStorage errors
      }
      set({ isOpen: false });
    },

    completeAndLaunch: async () => {
      const state = get();
      set({ isLaunching: true });

      const terms = getTerminalNodesFromTree(state.draftLayout);
      const customStore = useCustomizationStore.getState();

      // Apply appearance settings to global settings
      useSettingsStore.getState().setThemeName(customStore.themeName);
      useSettingsStore.getState().setFontFamily(customStore.fontFamily);
      useSettingsStore.getState().setFontSize(customStore.fontSize);
      useSettingsStore.getState().setTerminalOpacity(customStore.terminalOpacity);
      useSettingsStore.getState().setCursorStyle(customStore.cursorStyle);
      useSettingsStore.getState().setCursorBlink(customStore.cursorBlink);

      // Build spawn specs for each pane
      const spawnSpecs: PaneSpawnSpec[] = terms.map((term) => {
        const assignment = state.paneAgentAssignments[term.id];
        let initialCmd: string | undefined;

        if (assignment && assignment.agentId !== 'shell') {
          if (assignment.autoStart) {
            initialCmd = buildAgentCommand(assignment);
          }
        }

        return {
          nodeId: term.id,
          cols: 80,
          rows: 24,
          cwd: state.workspaceCwd || undefined,
          env: Object.keys(state.workspaceEnv).length > 0 ? state.workspaceEnv : undefined,
          initialCommand: initialCmd,
        };
      });

      // Spawn PTYs in batch if running in Tauri
      const nodeToPtyMap: Record<string, string> = {};
      if (isTauri()) {
        try {
          const results = await batchSpawnPanes(spawnSpecs);
          for (const res of results) {
            if (res.success && res.paneId) {
              nodeToPtyMap[res.nodeId] = res.paneId;
            }
          }
        } catch (err) {
          console.warn('[VibeGrid] Batch spawn error:', err);
        }
      }

      // Recursive helper to attach live paneIds to the draftLayout tree
      function attachPtyIds(node: PaneNode): PaneNode {
        if (node.type === 'terminal') {
          const livePaneId = nodeToPtyMap[node.id];
          return {
            ...node,
            paneId: livePaneId || node.paneId,
          };
        }
        return {
          children: [attachPtyIds(node.children[0]), attachPtyIds(node.children[1])],
          type: 'split',
          id: node.id,
          direction: node.direction,
          ratio: node.ratio,
        };
      }

      const finalLayout = attachPtyIds(state.draftLayout);

      // Create workspace
      const wsStore = useWorkspaceStore.getState();
      const newWsId = wsStore.createWorkspace(state.workspaceName);
      if (state.workspaceEmoji) {
        wsStore.setWorkspaceEmoji(newWsId, state.workspaceEmoji);
      }
      if (state.workspaceCwd) {
        wsStore.setWorkspaceOverrides(newWsId, { defaultCwd: state.workspaceCwd });
      }

      // Set pane store layout and active workspace
      usePaneStore.setState({
        root: finalLayout,
        focusedPaneId: terms[0]?.id || null,
        presetCount: typeof state.presetSelected === 'number' ? (state.presetSelected as PresetCount) : 3,
        paneCount: terms.length,
        gridVersion: Date.now(),
      });

      // Save workspace state
      wsStore.saveCurrentWorkspace();

      try {
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, '1');
      } catch (_err) {
        // Ignore localStorage write error
      }

      set({
        isLaunching: false,
        isOpen: false,
      });
    },
  };
});
