import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Circle, Folder, Sparkles, Terminal, Layers } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useAgentStore } from '@/store/useAgentStore';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { PresetCount } from '@/types/layout';
import { BUILTIN_AGENTS } from '@/lib/agentRegistry';
import { getAgentLogo } from '@/components/agent/AgentLogos';

type FlowStep = 'select-harness' | 'select-layout' | 'deploy-fleet';

const POPULAR_AGENTS = [
  'claude-code',
  'codex',
  'antigravity',
  'grok',
  'gemini',
  'deepseek',
  'aider',
  'shell',
];

const LAYOUT_PRESETS: {
  id: PresetCount;
  label: string;
  tag: string;
  panes: number;
  grid: number[][];
}[] = [
  { id: 1,  label: 'Solo',   tag: '1×1', panes: 1,  grid: [[1]] },
  { id: 2,  label: 'Dual',   tag: '1×2', panes: 2,  grid: [[1, 2]] },
  { id: 4,  label: 'Quad',   tag: '2×2', panes: 4,  grid: [[1, 2], [3, 4]] },
  { id: 6,  label: 'Hex',    tag: '3×2', panes: 6,  grid: [[1, 2, 3], [4, 5, 6]] },
  { id: 9,  label: 'Hive',   tag: '3×3', panes: 9,  grid: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
  { id: 16, label: 'Matrix', tag: '4×4', panes: 16, grid: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]] },
];

const LayoutBlueprint: React.FC<{ grid: number[][] }> = ({ grid }) => {
  const rows = grid.length;
  const cols = grid[0].length;
  const gap = 3;
  const svgW = 64;
  const svgH = 40;
  const cellW = (svgW - gap * (cols - 1)) / cols;
  const cellH = (svgH - gap * (rows - 1)) / rows;

  return (
    <div className="w-full h-18 rounded-xl bg-[#090a0c] border border-[#4a4b50] group-hover:border-[#5683da] flex items-center justify-center p-2.5 transition-colors duration-150">
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="shrink-0 transition-transform duration-150 group-hover:scale-105"
      >
        {grid.map((row, r) =>
          row.map((_, c) => (
            <rect
              key={`${r}-${c}`}
              x={c * (cellW + gap) + 0.5}
              y={r * (cellH + gap) + 0.5}
              width={Math.max(1, cellW - 1)}
              height={Math.max(1, cellH - 1)}
              rx={2}
              fill="currentColor"
              className="text-[#303236] group-hover:text-[#5683da] transition-colors duration-150"
            />
          ))
        )}
      </svg>
    </div>
  );
};

export const CentralPromptCard: React.FC = () => {
  const [step, setStep] = useState<FlowStep>('select-harness');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('claude-code');
  const [selectedPresetCount, setSelectedPresetCount] = useState<PresetCount>(2);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  const { setActiveViewMode, requestSetLayoutPreset, addToast } = useUIStore();
  const { workspaces, activeWorkspaceId } = useWorkspaceStore();
  const { batchAssignAgentToAll, provisionActivePanes } = useAgentStore();

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const selectedAgent = BUILTIN_AGENTS.find((a) => a.id === selectedAgentId) || BUILTIN_AGENTS[0];
  const selectedLayout = LAYOUT_PRESETS.find((l) => l.id === selectedPresetCount) || LAYOUT_PRESETS[1];

  const popularAgents = BUILTIN_AGENTS.filter((a) => POPULAR_AGENTS.includes(a.id));

  const handleSelectHarness = (agentId: string) => {
    setSelectedAgentId(agentId);
    setStep('select-layout');
  };

  const handleSelectLayout = (count: PresetCount) => {
    setSelectedPresetCount(count);
    setStep('deploy-fleet');
  };

  const handleDeployFleet = async (asBlank = false) => {
    setIsDeploying(true);
    try {
      requestSetLayoutPreset(selectedPresetCount);

      if (!asBlank && selectedAgentId !== 'shell') {
        const root = usePaneStore.getState().root;
        const terminalNodes = getTerminalNodes(root);
        const terminalIds = terminalNodes.map((t) => t.id);

        if (terminalIds.length > 0) {
          batchAssignAgentToAll(
            terminalIds,
            selectedAgent.id,
            selectedAgent.supportedModels[0],
            selectedAgent.defaultArgs,
            '',
            true
          );
          provisionActivePanes().catch((err) => {
            console.error('[CentralPromptCard] Fleet provisioning error:', err);
          });
        }
      }

      setActiveViewMode('grid');
      addToast({
        type: 'success',
        title: asBlank ? 'Layout Matrix Deployed' : `${selectedLayout.panes}× ${selectedAgent.name} Fleet Deployed`,
        description: asBlank
          ? `Initialized ${selectedLayout.panes} terminal panes.`
          : `Provisioned ${selectedLayout.panes} parallel ${selectedAgent.name} instances.`,
      });
    } catch (err) {
      console.error('[CentralPromptCard] Deployment failed:', err);
      addToast({
        type: 'error',
        title: 'Deployment Failed',
        description: 'Could not initialize layout grid.',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-full px-6 py-8 select-none font-sans">
      <div className="relative w-full max-w-4xl rounded-2xl border border-[#4a4b50] bg-[#111111] shadow-2xl overflow-hidden p-6 sm:p-8 transition-all duration-200">
        
        {/* Workspace Identity & Global Stepper Header */}
        <div className="flex items-center justify-between border-b border-[#4a4b50] pb-5 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#303236] border border-[#4a4b50] flex items-center justify-center shrink-0 text-[#5683da] shadow-sm">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-tight">
                {activeWs?.name || 'Default Workspace'}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Circle className="w-2 h-2 fill-[#27c93f] text-[#27c93f]" />
                <div className="text-xs text-[#a9a9aa] font-mono">Workspace Ready</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#a9a9aa] px-3 py-1 rounded-full bg-[#303236] border border-[#4a4b50]">
              {step === 'select-harness' && 'Step 1 of 3 · Select Harness'}
              {step === 'select-layout' && 'Step 2 of 3 · Select Matrix'}
              {step === 'deploy-fleet' && 'Step 3 of 3 · Fleet Provisioning'}
            </span>
          </div>
        </div>

        {/* STEP 1: Select AI Agent Harness */}
        {step === 'select-harness' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Select AI Agent Harness
                </h2>
                <p className="text-xs text-[#a9a9aa] mt-0.5">
                  Choose an AI coding agent or native terminal to deploy across your workstation
                </p>
              </div>
              <span className="text-xs font-mono text-[#a9a9aa] px-2.5 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50]">
                {popularAgents.length} Harnesses
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {popularAgents.map((agent) => {
                const isSelected = selectedAgentId === agent.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => handleSelectHarness(agent.id)}
                    className={`group relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-150 cursor-pointer outline-none active:scale-[0.98] ${
                      isSelected
                        ? 'bg-[#303236] border-[#5683da] ring-1 ring-[#5683da]'
                        : 'bg-[#111111] hover:bg-[#303236] border-[#4a4b50] hover:border-[#5683da]'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#090a0c] border border-[#4a4b50] flex items-center justify-center mb-3 group-hover:border-[#5683da] transition-colors shrink-0">
                      {getAgentLogo(agent.id, 'w-6 h-6')}
                    </div>

                    <span className="text-sm font-semibold text-white group-hover:text-[#5683da] transition-colors truncate max-w-full">
                      {agent.name}
                    </span>

                    <span className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[#a9a9aa] group-hover:text-[#5683da] group-hover:border-[#5683da] transition-colors">
                      {agent.id === 'shell' ? 'Native PTY' : agent.supportedModels[0] || 'Agent'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Select Layout Matrix */}
        {step === 'select-layout' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('select-harness')}
                  className="px-3 py-1 rounded-full bg-[#303236] hover:bg-[#4a4b50] border border-[#4a4b50] text-xs text-[#a9a9aa] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Agent</span>
                </button>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#090a0c] border border-[#4a4b50]">
                  {getAgentLogo(selectedAgent.id, 'w-4 h-4')}
                  <span className="text-xs font-semibold text-white">{selectedAgent.name}</span>
                </div>
              </div>
              <span className="text-xs font-mono text-[#a9a9aa]">
                6 Presets Available
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Select Terminal Matrix
              </h2>
              <p className="text-xs text-[#a9a9aa] mt-0.5">
                Choose how many parallel terminal panes to allocate for {selectedAgent.name}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {LAYOUT_PRESETS.map((preset) => {
                const isSelected = selectedPresetCount === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectLayout(preset.id)}
                    className={`group relative flex flex-col items-start gap-3 p-4 rounded-2xl border transition-all duration-150 cursor-pointer text-left outline-none active:scale-[0.98] ${
                      isSelected
                        ? 'bg-[#303236] border-[#5683da] ring-1 ring-[#5683da]'
                        : 'bg-[#111111] hover:bg-[#303236] border-[#4a4b50] hover:border-[#5683da]'
                    }`}
                  >
                    <LayoutBlueprint grid={preset.grid} />
                    <div className="w-full flex items-center justify-between mt-1">
                      <span className="text-sm text-white font-semibold group-hover:text-[#5683da] transition-colors">
                        {preset.label}
                      </span>
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[#a9a9aa] group-hover:text-[#5683da] group-hover:border-[#5683da] transition-colors">
                        {preset.panes} {preset.panes === 1 ? 'Pane' : 'Panes'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Fleet Provisioning Preview & Deployment */}
        {step === 'deploy-fleet' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('select-layout')}
                  className="px-3 py-1 rounded-full bg-[#303236] hover:bg-[#4a4b50] border border-[#4a4b50] text-xs text-[#a9a9aa] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Layout</span>
                </button>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#090a0c] border border-[#4a4b50]">
                  {getAgentLogo(selectedAgent.id, 'w-4 h-4')}
                  <span className="text-xs font-semibold text-white">{selectedAgent.name}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#090a0c] border border-[#4a4b50]">
                  <Layers className="w-3.5 h-3.5 text-[#5683da]" />
                  <span className="text-xs font-mono text-[#a9a9aa]">
                    {selectedLayout.label} ({selectedLayout.panes} Panes)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Fleet Provisioning Preview
              </h2>
              <p className="text-xs text-[#a9a9aa] mt-0.5">
                The following {selectedLayout.panes} parallel {selectedAgent.name} instances will be initialized and launched
              </p>
            </div>

            {/* Render exact button/chip instances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {Array.from({ length: selectedLayout.panes }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#303236] border border-[#4a4b50] hover:border-[#5683da]/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[11px] font-mono font-medium text-[#5683da] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="w-6 h-6 rounded-lg bg-[#090a0c] border border-[#4a4b50] flex items-center justify-center shrink-0">
                      {getAgentLogo(selectedAgent.id, 'w-3.5 h-3.5')}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {selectedAgent.name}
                      </div>
                      <div className="text-[10px] font-mono text-[#a9a9aa] truncate">
                        {selectedAgent.id === 'shell' ? 'zsh / pty' : selectedAgent.supportedModels[0]}
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-[#27c93f] flex items-center gap-1 shrink-0">
                    <Check className="w-2.5 h-2.5" />
                    <span>Ready</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Launch Actions */}
            <div className="pt-3 border-t border-[#4a4b50] flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDeployFleet(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#303236] hover:bg-[#4a4b50] border border-[#4a4b50] text-xs font-medium text-[#a9a9aa] hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Launch as Blank Shells</span>
              </button>

              <button
                type="button"
                disabled={isDeploying}
                onClick={() => handleDeployFleet(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#5683da] hover:bg-[#5683da]/90 text-xs font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>Deploy {selectedLayout.panes}× {selectedAgent.name} Fleet</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

