import React, { useState } from 'react';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useAgentStore } from '@/store/useAgentStore';
import { PaneAgentConfig } from '@/types/agent';
import { getAgentLogo } from './AgentLogos';
import {
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Terminal,
} from 'lucide-react';

export const PaneAgentMatrix: React.FC = () => {
  const root = usePaneStore((s) => s.root);
  const focusedPaneId = usePaneStore((s) => s.focusedPaneId);
  const terminals = getTerminalNodes(root);
  const { agents, paneAssignments, assignAgentToPane } = useAgentStore();
  const [expandedPaneId, setExpandedPaneId] = useState<string | null>(null);

  const getAgent = (agentId: string) => agents.find((a) => a.id === agentId) || agents[0];

  const handleAgentChange = (nodeId: string, agentId: string) => {
    const current = paneAssignments[nodeId];
    const targetAgent = getAgent(agentId);
    const newConfig: PaneAgentConfig = {
      agentId: targetAgent.id,
      name: targetAgent.name,
      binaryPath:
        targetAgent.binaryPath ||
        (targetAgent.id === 'claude-code'
          ? 'claude'
          : targetAgent.id === 'antigravity'
          ? 'agy'
          : targetAgent.id),
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
    <div className="p-4 md:p-5 rounded-2xl bg-[#111111] border border-[#4a4b50] space-y-4 select-none">
      {/* Matrix Header */}
      <div className="flex items-center justify-between pb-1 border-b border-[#4a4b50]/60">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#5683da]" />
          <h3 className="font-sans font-bold text-xs text-white tracking-wide uppercase">
            Per-Pane Agent Matrix
          </h3>
        </div>
        <span className="text-[11px] font-mono font-medium text-[#a9a9aa] px-2.5 py-0.5 rounded-full bg-[#111111] border border-[#4a4b50]">
          {terminals.length} {terminals.length === 1 ? 'Pane' : 'Panes'}
        </span>
      </div>

      {terminals.length === 0 ? (
        <div className="p-8 rounded-xl bg-[#111111] border border-[#4a4b50] flex flex-col items-center justify-center text-center space-y-2 text-[#a9a9aa]">
          <Terminal className="w-6 h-6 text-[#5683da]" />
          <p className="text-xs font-sans text-white font-medium">No Active Terminal Panes</p>
          <p className="text-[11px] font-mono text-[#a9a9aa]">
            Create or split a pane to assign AI coding agents.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#4a4b50] pr-1">
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
            const isFocused = focusedPaneId === term.id;
            const isExpanded = expandedPaneId === term.id;
            const isShell = assignment.agentId === 'shell';
            const isActive = isFocused || isExpanded || assignment.agentId !== 'shell';

            return (
              <div
                key={term.id}
                className={`p-4 rounded-2xl bg-[#111111] border transition-all duration-150 flex flex-col justify-between space-y-3.5 text-white ${
                  isExpanded
                    ? 'border-[#5683da] ring-1 ring-[#5683da]/40 shadow-lg'
                    : isFocused
                    ? 'border-[#5683da]/80'
                    : 'border-[#4a4b50] hover:border-[#5683da]/50'
                }`}
              >
                {/* Pane Row Header */}
                <div className="flex items-center justify-between gap-2.5 min-w-0">
                  {/* Left: Pane Badge & Title */}
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <span
                      className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                        isActive
                          ? 'bg-[#5683da] text-white shadow-sm'
                          : 'bg-[#111111] border border-[#4a4b50] text-[#a9a9aa]'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <h4 className="font-sans font-semibold text-xs text-white truncate">
                      {term.title || `Pane ${index + 1}`}
                    </h4>
                  </div>

                  {/* Right: Agent Dropdown & Options Toggle */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111111] border border-[#4a4b50] hover:border-[#5683da]/60 focus-within:border-[#5683da] transition-colors">
                      <div className="shrink-0 flex items-center justify-center">
                        {getAgentLogo(assignment.agentId, 'w-4 h-4')}
                      </div>
                      <select
                        value={assignment.agentId}
                        onChange={(e) => handleAgentChange(term.id, e.target.value)}
                        className="bg-transparent border-0 text-xs font-sans text-white focus:outline-none appearance-none cursor-pointer pr-1"
                      >
                        {agents.map((a) => (
                          <option key={a.id} value={a.id} className="bg-[#111111] text-white">
                            {a.name} {a.isInstalled ? '✓' : '(Not installed)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedPaneId(isExpanded ? null : term.id)}
                      className={`px-2.5 py-1 rounded-full border text-xs font-mono flex items-center gap-1 transition-all cursor-pointer ${
                        isExpanded
                          ? 'bg-[#5683da] border-[#5683da] text-white shadow-sm'
                          : 'bg-[#111111] hover:bg-[#303236] border-[#4a4b50] text-[#a9a9aa] hover:text-white'
                      }`}
                      title={isExpanded ? 'Collapse detailed config' : 'Expand detailed config'}
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span className="hidden sm:inline">{isExpanded ? 'Done' : 'Config'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsed Status Summary */}
                {!isExpanded && (
                  <div className="flex items-center justify-between text-xs font-mono text-[#a9a9aa] px-3 py-2 rounded-xl bg-[#111111] border border-[#4a4b50] min-w-0 gap-2">
                    <span className="flex items-center gap-1.5 truncate min-w-0">
                      {getAgentLogo(assignment.agentId, 'w-3.5 h-3.5 shrink-0')}
                      <span className="truncate">
                        {isShell ? 'Terminal' : assignment.model || 'Default Model'}
                      </span>
                    </span>
                    <div className="shrink-0">
                      {assignment.autoStart && !isShell ? (
                        <span className="text-[#27c93f] flex items-center gap-1 text-[11px] font-medium font-sans px-2 py-0.5 rounded-full bg-[#111111] border border-[#4a4b50]">
                          <Sparkles className="w-3 h-3" />
                          <span>Auto-launch</span>
                        </span>
                      ) : (
                        <span className="text-[#a9a9aa] flex items-center gap-1 text-[11px] font-sans px-2 py-0.5 rounded-full bg-[#111111] border border-[#4a4b50]">
                          <Terminal className="w-3 h-3" />
                          <span>Manual start</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Expanded Detailed Configuration */}
                {isExpanded && (
                  <div className="space-y-2.5 pt-3 border-t border-[#4a4b50] animate-fade-in text-xs">
                    {/* Model Selection */}
                    {!isShell && activeAgent.supportedModels.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-[#a9a9aa]">Target Model</label>
                        <select
                          value={assignment.model || activeAgent.supportedModels[0]}
                          onChange={(e) => handleUpdateField(term.id, { model: e.target.value })}
                          className="w-full rounded-xl bg-[#111111] border border-[#4a4b50] px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#5683da] focus:ring-1 focus:ring-[#5683da] appearance-none cursor-pointer"
                        >
                          {activeAgent.supportedModels.map((m) => (
                            <option key={m} value={m} className="bg-[#111111] text-white">
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* CLI Flags */}
                    {!isShell && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-[#a9a9aa]">
                          CLI Flags & Arguments
                        </label>
                        <input
                          type="text"
                          value={assignment.cliArgs?.join(' ') || ''}
                          onChange={(e) =>
                            handleUpdateField(term.id, {
                              cliArgs: e.target.value
                                ? e.target.value.split(/\s+/).filter(Boolean)
                                : [],
                            })
                          }
                          placeholder="--dangerously-skip-permissions"
                          className="w-full rounded-xl bg-[#111111] border border-[#4a4b50] px-3 py-2 text-xs font-mono text-white placeholder:text-[#a9a9aa]/40 focus:outline-none focus:border-[#5683da] focus:ring-1 focus:ring-[#5683da]"
                        />
                      </div>
                    )}

                    {/* Starter Prompt */}
                    {!isShell && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-[#a9a9aa]">
                          Starter Prompt
                        </label>
                        <textarea
                          rows={2}
                          value={assignment.initialPrompt || ''}
                          onChange={(e) =>
                            handleUpdateField(term.id, { initialPrompt: e.target.value })
                          }
                          placeholder="e.g. Inspect the codebase and propose architectural improvements."
                          className="w-full rounded-xl bg-[#111111] border border-[#4a4b50] p-3 text-xs font-sans text-white placeholder:text-[#a9a9aa]/40 focus:outline-none focus:border-[#5683da] focus:ring-1 focus:ring-[#5683da] resize-none"
                        />
                      </div>
                    )}

                    {/* Auto-start Toggle */}
                    {!isShell && (
                      <label className="flex items-center justify-between p-3 rounded-xl bg-[#111111] border border-[#4a4b50] text-xs text-white cursor-pointer hover:border-[#5683da]/60 transition-colors">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-[#5683da]" />
                          <span className="font-mono text-xs font-medium">
                            Auto-execute on launch
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={assignment.autoStart}
                          onChange={(e) =>
                            handleUpdateField(term.id, { autoStart: e.target.checked })
                          }
                          className="w-4 h-4 rounded accent-[#5683da] cursor-pointer"
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
