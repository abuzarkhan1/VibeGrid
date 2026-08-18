import React, { useState } from 'react';
import { TerminalNode } from '@/types/layout';
import { PaneAgentConfig } from '@/types/onboarding';
import { getTerminalNodesFromTree } from '@/lib/layoutUtils';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { AgentConfigModal } from './AgentConfigModal';
import { Settings, Sparkles, Bot, Cpu, Layers, Terminal, Zap, TerminalSquare } from 'lucide-react';

export const PaneAgentMatrix: React.FC = () => {
  const draftLayout = useOnboardingStore((s) => s.draftLayout);
  const assignments = useOnboardingStore((s) => s.paneAgentAssignments);
  const assignAgentToPane = useOnboardingStore((s) => s.assignAgentToPane);

  const [configuringPane, setConfiguringPane] = useState<{
    paneId: string;
    index: number;
  } | null>(null);

  const terminalNodes: TerminalNode[] = getTerminalNodesFromTree(draftLayout);

  const getAgentIcon = (agentId?: string) => {
    // All icons now strictly use white with varying opacities for the B&W stealth theme
    switch (agentId) {
      case 'claude-code':
      case 'antigravity':
        return <Sparkles className="w-4 h-4 text-white/80" />;
      case 'codex':
        return <Terminal className="w-4 h-4 text-white/80" />;
      case 'gemini':
      case 'goose':
        return <Zap className="w-4 h-4 text-white/80" />;
      case 'aider':
      case 'grok':
      case 'kimi':
      case 'qwen':
      case 'cline':
        return <Bot className="w-4 h-4 text-white/80" />;
      case 'openhands':
        return <Layers className="w-4 h-4 text-white/80" />;
      case 'ollama':
      case 'deepseek':
        return <Cpu className="w-4 h-4 text-white/80" />;
      default:
        return <TerminalSquare className="w-4 h-4 text-white/80" />;
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {terminalNodes.map((term, idx) => {
          const config: PaneAgentConfig | undefined = assignments[term.id];
          const isAgent = config && config.agentId !== 'shell';

          return (
            <div
              key={term.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/30 hover:bg-white/[0.06] transition-all backdrop-blur-md"
            >
              <div className="flex items-center gap-3 min-w-0 mr-2">
                {/* Pure Black Glass for Number Indicator */}
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/40 border border-white/10 font-mono text-xs font-bold text-white/80 shrink-0">
                  {idx + 1}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    {getAgentIcon(config?.agentId)}
                    <h4 className="text-[13px] font-semibold text-white/90 truncate">
                      {config?.name || term.title || `Terminal ${idx + 1}`}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-white/40 font-mono">
                    {isAgent && config?.model && (
                      <span className="text-white/80 font-mono font-medium">[{config.model}]</span>
                    )}
                    <span className="truncate max-w-[180px] text-white/40">
                      {isAgent
                        ? config.cliArgs.join(' ') || 'Standard args'
                        : 'Default Shell'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setConfiguringPane({ paneId: term.id, index: idx })}
                className="px-3 py-1 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 flex items-center gap-1.5 text-xs text-white/60 hover:text-white shrink-0 cursor-pointer transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configure</span>
              </button>
            </div>
          );
        })}
      </div>

      {configuringPane && (
        <AgentConfigModal
          paneId={configuringPane.paneId}
          paneIndex={configuringPane.index}
          currentConfig={assignments[configuringPane.paneId]}
          onSave={(cfg) => assignAgentToPane(configuringPane.paneId, cfg)}
          onClose={() => setConfiguringPane(null)}
        />
      )}
    </div>
  );
};