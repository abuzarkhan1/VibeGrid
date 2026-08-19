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
          <h3 className="font-sans font-bold text-[13px] text-white/90 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-white/60" />
            <span>Pane-to-Agent Assignment Matrix</span>
          </h3>
          <p className="text-[12px] text-white/40 mt-0.5">
            Map each pane in your active layout to a specific AI coding agent, model, CLI arguments, or initial starter prompt.
          </p>
        </div>
        <span className="text-[11px] font-mono text-white/40">
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
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 backdrop-blur-md ${
                isExpanded
                  ? 'bg-white/[0.06] border-white/30 shadow-[0_0_16px_rgba(255,255,255,0.05)]'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              {/* Header Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 shrink-0 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-xs font-mono font-bold text-white/80">
                    {index + 1}
                  </span>
                  <div className="truncate">
                    <h4 className="font-sans font-semibold text-[13px] text-white/90 truncate">
                      {term.title || `Pane ${index + 1}`}
                    </h4>
                    <span className="text-[11px] font-mono text-white/30">{term.id.slice(-8)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={assignment.agentId}
                    onChange={(e) => handleAgentChange(term.id, e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-sans text-white/80 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
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
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white transition-colors"
                    title={isExpanded ? 'Collapse config' : 'Expand detailed config'}
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Model & Basic Status */}
              {!isExpanded && (
                <div className="flex items-center justify-between text-[11px] font-mono text-white/40 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1.5 truncate mr-2">
                    <Bot className="w-3.5 h-3.5 text-white/60 shrink-0" />
                    <span className="truncate">Model: {assignment.model || (isShell ? 'N/A (Shell)' : 'Default')}</span>
                  </span>
                  {assignment.autoStart && !isShell ? (
                    <span className="text-white/80 flex items-center gap-1 shrink-0">
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-launch</span>
                    </span>
                  ) : (
                    <span className="text-white/30 flex items-center gap-1 shrink-0">
                      <Terminal className="w-3 h-3" />
                      <span>Manual start</span>
                    </span>
                  )}
                </div>
              )}

              {/* Expanded Detailed Configuration */}
              {isExpanded && (
                <div className="space-y-3 pt-3 border-t border-white/5 animate-fade-in text-xs">
                  {/* Model Selection */}
                  {!isShell && activeAgent.supportedModels.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-white/40">Target Model:</label>
                      <select
                        value={assignment.model || activeAgent.supportedModels[0]}
                        onChange={(e) => handleUpdateField(term.id, { model: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white/80 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
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
                      <label className="text-[11px] font-mono text-white/40">CLI Flags & Arguments:</label>
                      <input
                        type="text"
                        value={assignment.cliArgs?.join(' ') || ''}
                        onChange={(e) =>
                          handleUpdateField(term.id, {
                            cliArgs: e.target.value ? e.target.value.split(/\s+/).filter(Boolean) : [],
                          })
                        }
                        placeholder="--dangerously-skip-permissions"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
                      />
                    </div>
                  )}

                  {/* Starter Prompt */}
                  {!isShell && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-white/40">Initial Agent Starter Prompt:</label>
                      <textarea
                        rows={2}
                        value={assignment.initialPrompt || ''}
                        onChange={(e) => handleUpdateField(term.id, { initialPrompt: e.target.value })}
                        placeholder="e.g. Inspect the codebase and propose architectural improvements."
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs font-sans text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 resize-none"
                      />
                    </div>
                  )}

                  {/* Auto-start Toggle */}
                  {!isShell && (
                    <label className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/10 cursor-pointer">
                      <span className="text-[11px] font-mono text-white/80">Auto-execute on launch</span>
                      <input
                        type="checkbox"
                        checked={assignment.autoStart}
                        onChange={(e) => handleUpdateField(term.id, { autoStart: e.target.checked })}
                        className="w-4 h-4 rounded accent-white focus:ring-white/20"
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
