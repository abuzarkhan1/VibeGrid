import React from 'react';
import { DiscoveredAgent } from '@/types/onboarding';
import { CheckCircle2, AlertCircle, Sparkles, Bot, Layers, Cpu, Terminal, Zap, TerminalSquare } from 'lucide-react';

interface AgentCatalogCardProps {
  agent: DiscoveredAgent;
  onSelect?: () => void;
  selected?: boolean;
}

export const AgentCatalogCard: React.FC<AgentCatalogCardProps> = ({
  agent,
  onSelect,
  selected = false,
}) => {
  const getIcon = () => {
    switch (agent.id) {
      case 'claude-code':
      case 'antigravity':
        return <Sparkles className="w-4 h-4 text-violet-400" />;
      case 'codex':
        return <Terminal className="w-4 h-4 text-emerald-400" />;
      case 'aider':
        return <Bot className="w-4 h-4 text-emerald-400" />;
      case 'openhands':
        return <Layers className="w-4 h-4 text-pink-400" />;
      case 'ollama':
      case 'deepseek':
        return <Cpu className="w-4 h-4 text-sky-400" />;
      case 'gemini':
      case 'goose':
        return <Zap className="w-4 h-4 text-amber-400" />;
      default:
        return <TerminalSquare className="w-4 h-4 text-white/70" />;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={`relative flex flex-col p-3.5 rounded-xl transition-all duration-200 cursor-pointer select-none outline-none ${
        selected
          ? 'bg-[#1A1B26] border-violet-400 ring-1 ring-accent-primary/40 shadow-none'
          : 'bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.06]'
      }`}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#1A1B26] border border-white/10 flex items-center justify-center shrink-0">
            {getIcon()}
          </div>
          <div>
            <h4 className="font-semibold text-[13px] text-white/90">{agent.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              {agent.isInstalled ? (
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{agent.detectedVersion || 'Installed'}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                  <AlertCircle className="w-3 h-3" />
                  <span>Not Installed</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[12px] text-white/70 line-clamp-2 mt-1 leading-relaxed font-sans">{agent.description}</p>
    </div>
  );
};
