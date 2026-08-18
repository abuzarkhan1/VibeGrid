import React, { useState } from 'react';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useAgentStore } from '@/store/useAgentStore';
import { PaneAgentConfig } from '@/types/agent';
import { Bot, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

export const PaneAgentMatrix: React.FC = () => {
  const root = usePaneStore((s) => s.root);
  const terminals = getTerminalNodes(root);
  const { agents, paneAssignments, assignAgentToPane } = useAgentStore();
  const [expandedPaneId, setExpandedPaneId] = useState<string | null>(null);

  const getAgent = (agentId: string) => agents.find((a) => a.id === agentId) || agents[0];

  const handleAgentChange = (nodeId: string, agentId: string) => {
    const current = paneAssignments[nodeId];
    const targetAgent = getAgent(agentId);
    const newConfig: PaneAgentConfig = {
      agentId: targetAgent.id,
      name: current?.name || targetAgent.name,
      binaryPath: targetAgent.binaryPath || (targetAgent.id === 'claude-code' ? 'claude' : targetAgent.id === 'antigravity' ? 'agy' : targetAgent.id),
      model: targetAgent.supportedModels[0] || undefined,
      cliArgs: [...targetAgent.defaultArgs],
      initialPrompt: current?.initialPrompt || '',
      autoStart: current?.autoStart ?? true,
    };
    assignAgentToPane(nodeId, newConfig);
  };

  const handleUpdateField = (nodeId: string, updates: Partial<PaneAgentConfig>) => {
    const current = paneAssignments[nodeId] || {
      agentId: 'claude-code',
      name: 'Claude Code',
      binaryPath: 'claude',
      model: 'claude-3-7-sonnet',
      cliArgs: ['--dangerously-skip-permissions'],
      initialPrompt: '',
      autoStart: true,
    };
    assignAgentToPane(nodeId, { ...current, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-sans font-bold text-[13px] text-[#e8e8ea] flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#818cf8]" />
            <span>Pane-to-Agent Assignment Matrix</span>
          </h3>
          <p className="text-[12px] text-[#a3a3ab] mt-0.5">
            Map each pane in your active layout to a specific AI coding agent, model, CLI arguments, or initial starter prompt.
          </p>
        </div>
        <span className="text-[11px] font-mono text-[#a3a3ab]">
          {terminals.length} {terminals.length === 1 ? 'Terminal' : 'Terminals'} Configured
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {terminals.map((term, index) => {
          const assignment = paneAssignments[term.id] || {
            agentId: 'claude-code',
            name: term.title || 'Claude Code',
            binaryPath: 'claude',
            model: 'claude-3-7-sonnet',
            cliArgs: ['--dangerously-skip-permissions'],
            initialPrompt: '',
            autoStart: true,
          };

          const activeAgent = getAgent(assignment.agentId);
          const isExpanded = expandedPaneId === term.id;
          const isShell = assignment.agentId === 'shell';

          return (
            <div
              key={term.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                isExpanded
                  ? 'bg-[#202024] border-[#6366f1]/60 shadow-[0_0_16px_rgba(99,102,241,0.12)]'
                  : 'bg-[#232327] border-[#333338] hover:border-[#6366f1]/40 hover:bg-[#2a2a2f]'
              }`}
            >
              {/* Header Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 shrink-0 rounded-lg bg-[#6366f1]/15 border border-[#6366f1]/30 flex items-center justify-center text-xs font-mono font-bold text-[#818cf8]">
                    {index + 1}
                  </span>
                  <div className="truncate">
                    <h4 className="font-sans font-semibold text-[13px] text-[#e8e8ea] truncate">
                      {term.title || `Pane ${index + 1}`}
                    </h4>
                    <span className="text-[11px] font-mono text-[#6f6f78]">{term.id.slice(-8)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={assignment.agentId}
                    onChange={(e) => handleAgentChange(term.id, e.target.value)}
                    className="bg-[#1a1a1e] border border-[#333338] rounded-lg px-2.5 py-1 text-xs font-sans text-[#e8e8ea] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} {a.isInstalled ? '✓' : '(Not installed)'}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setExpandedPaneId(isExpanded ? null : term.id)}
                    className="p-1.5 rounded-lg bg-[#1a1a1e] hover:bg-[#303036] border border-[#333338] text-[#a3a3ab] hover:text-[#e8e8ea] transition-colors"
                    title={isExpanded ? 'Collapse config' : 'Expand detailed config'}
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Model & Basic Status */}
              {!isExpanded && (
                <div className="flex items-center justify-between text-[11px] font-mono text-[#a3a3ab] pt-2 border-t border-[#333338]">
                  <span className="flex items-center gap-1.5 truncate mr-2">
                    <Bot className="w-3.5 h-3.5 text-[#818cf8] shrink-0" />
                    <span className="truncate">Model: {assignment.model || (isShell ? 'N/A (Shell)' : 'Default')}</span>
                  </span>
                  {assignment.autoStart && !isShell ? (
                    <span className="text-[#3fb950] flex items-center gap-1 shrink-0">
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-launch</span>
                    </span>
                  ) : (
                    <span className="text-[#6f6f78] flex items-center gap-1 shrink-0">
                      <Terminal className="w-3 h-3" />
                      <span>Manual start</span>
                    </span>
                  )}
                </div>
              )}

              {/* Expanded Detailed Configuration */}
              {isExpanded && (
                <div className="space-y-3 pt-3 border-t border-[#333338] animate-fade-in text-xs">
                  {/* Model Selection */}
                  {!isShell && activeAgent.supportedModels.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-[#a3a3ab]">Target Model:</label>
                      <select
                        value={assignment.model || activeAgent.supportedModels[0]}
                        onChange={(e) => handleUpdateField(term.id, { model: e.target.value })}
                        className="w-full bg-[#1a1a1e] border border-[#333338] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#e8e8ea] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
                      >
                        {activeAgent.supportedModels.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* CLI Flags */}
                  {!isShell && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-[#a3a3ab]">CLI Flags & Arguments:</label>
                      <input
                        type="text"
                        value={assignment.cliArgs?.join(' ') || ''}
                        onChange={(e) =>
                          handleUpdateField(term.id, {
                            cliArgs: e.target.value ? e.target.value.split(/\s+/).filter(Boolean) : [],
                          })
                        }
                        placeholder="--dangerously-skip-permissions"
                        className="w-full bg-[#1a1a1e] border border-[#333338] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#e8e8ea] placeholder:text-[#6f6f78] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
                      />
                    </div>
                  )}

                  {/* Starter Prompt */}
                  {!isShell && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-[#a3a3ab]">Initial Agent Starter Prompt:</label>
                      <textarea
                        rows={2}
                        value={assignment.initialPrompt || ''}
                        onChange={(e) => handleUpdateField(term.id, { initialPrompt: e.target.value })}
                        placeholder="e.g. Inspect the codebase and propose architectural improvements."
                        className="w-full bg-[#1a1a1e] border border-[#333338] rounded-lg p-2.5 text-xs font-sans text-[#e8e8ea] placeholder:text-[#6f6f78] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] resize-none"
                      />
                    </div>
                  )}

                  {/* Auto-start Toggle */}
                  {!isShell && (
                    <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1a1e] border border-[#333338] cursor-pointer">
                      <span className="text-[11px] font-mono text-[#e8e8ea]">Auto-execute on launch</span>
                      <input
                        type="checkbox"
                        checked={assignment.autoStart}
                        onChange={(e) => handleUpdateField(term.id, { autoStart: e.target.checked })}
                        className="w-4 h-4 rounded text-[#6366f1] accent-[#6366f1] focus:ring-[#6366f1]"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
