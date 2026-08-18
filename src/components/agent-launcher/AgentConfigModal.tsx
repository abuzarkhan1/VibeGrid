import React, { useState } from 'react';
import { PaneAgentConfig, DiscoveredAgent } from '@/types/onboarding';
import { X, Settings } from 'lucide-react';
import { useAgentCatalogStore } from '@/store/useAgentCatalogStore';

interface AgentConfigModalProps {
  paneId: string;
  paneIndex: number;
  currentConfig?: PaneAgentConfig;
  onSave: (config: PaneAgentConfig) => void;
  onClose: () => void;
}

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({
  paneId,
  paneIndex,
  currentConfig,
  onSave,
  onClose,
}) => {
  const agents = useAgentCatalogStore((s) => s.agents);

  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    currentConfig?.agentId || 'claude-code'
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    currentConfig?.model || 'claude-3-7-sonnet'
  );
  const [cliArgs, setCliArgs] = useState<string>(
    currentConfig?.cliArgs?.join(' ') || '--dangerously-skip-permissions'
  );
  const [initialPrompt, setInitialPrompt] = useState<string>(
    currentConfig?.initialPrompt || ''
  );
  const [autoStart, setAutoStart] = useState<boolean>(
    currentConfig?.autoStart ?? true
  );

  const activeAgent: DiscoveredAgent | undefined = agents[selectedAgentId];

  const handleAgentChange = (newAgentId: string) => {
    setSelectedAgentId(newAgentId);
    const agent = agents[newAgentId];
    if (agent) {
      setSelectedModel(agent.supportedModels[0] || '');
      setCliArgs(agent.defaultArgs.join(' '));
    }
  };

  const handleSave = () => {
    const config: PaneAgentConfig = {
      agentId: selectedAgentId,
      binaryPath: activeAgent?.binaryPath || selectedAgentId,
      name: activeAgent?.name || 'Terminal',
      model: selectedModel || undefined,
      cliArgs: cliArgs ? cliArgs.split(' ').filter(Boolean) : [],
      initialPrompt: initialPrompt.trim() || undefined,
      autoStart,
    };
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      {/* Main Transparent Black Glass Panel */}
      <div className="relative w-full max-w-lg rounded-xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-5 md:p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-black/40 border border-white/10 text-white/80">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-semibold text-white/90">
                Configure Pane {paneIndex + 1}
              </h3>
              <p className="text-[11px] font-mono text-white/30">ID: {paneId.slice(-6)}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Agent Provider Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono text-white/40">Agent Provider / Shell</label>
          <select
            value={selectedAgentId}
            onChange={(e) => handleAgentChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white/80 text-xs font-sans focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors"
          >
            {Object.values(agents).map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} {agent.isInstalled ? '✓' : '(Not installed)'}
              </option>
            ))}
          </select>
        </div>

        {/* Model Selection (if applicable) */}
        {activeAgent && activeAgent.supportedModels.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-white/40">Default Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white/80 text-xs font-mono focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors"
            >
              {activeAgent.supportedModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* CLI Arguments */}
        {selectedAgentId !== 'shell' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-white/40">CLI Flags & Arguments</label>
            <input
              type="text"
              value={cliArgs}
              onChange={(e) => setCliArgs(e.target.value)}
              placeholder="--dangerously-skip-permissions --watch"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white/80 text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors"
            />
          </div>
        )}

        {/* Initial Prompt */}
        {selectedAgentId !== 'shell' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-white/40">
              Initial Agent Starter Prompt (Optional)
            </label>
            <textarea
              rows={2}
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              placeholder="e.g. Inspect the project directory and explain architecture."
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white/80 text-xs font-sans placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors resize-none"
            />
          </div>
        )}

        {/* Auto start toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/10">
          <div>
            <p className="text-[12px] font-medium text-white/80">Auto-Execute on Launch</p>
            <p className="text-[11px] text-white/40">Launch command immediately when workspace loads.</p>
          </div>
          <input
            type="checkbox"
            checked={autoStart}
            onChange={(e) => setAutoStart(e.target.checked)}
            className="w-4 h-4 rounded accent-white focus:ring-white/20"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 mt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-white hover:bg-white/90 text-black text-xs font-semibold shadow-sm transition-all"
          >
            Save Pane Config
          </button>
        </div>
      </div>
    </div>
  );
};