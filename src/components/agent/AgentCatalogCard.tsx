import React, { useState } from 'react';
import { DiscoveredAgent } from '@/types/agent';
import {
  Bot,
  Sparkles,
  Zap,
  Globe,
  FileText,
  Code,
  Terminal,
  Cpu,
  Server,
  Layers,
  CheckCircle2,
  Download,
  Check,
  ExternalLink,
} from 'lucide-react';

interface AgentCatalogCardProps {
  agent: DiscoveredAgent;
  isSelected: boolean;
  onSelect: () => void;
}

export const AgentCatalogCard: React.FC<AgentCatalogCardProps> = ({
  agent,
  isSelected,
  onSelect,
}) => {
  const [copied, setCopied] = useState(false);

  const getIcon = () => {
    switch (agent.iconName) {
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'Globe': return <Globe className="w-4 h-4" />;
      case 'FileText': return <FileText className="w-4 h-4" />;
      case 'Code': return <Code className="w-4 h-4" />;
      case 'Terminal': return <Terminal className="w-4 h-4" />;
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      case 'Server': return <Server className="w-4 h-4" />;
      case 'Layers': return <Layers className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  const handleCopyInstall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!agent.installCommand) return;
    navigator.clipboard.writeText(agent.installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col justify-between text-left p-3.5 rounded-xl transition-all duration-200 outline-none select-none cursor-pointer backdrop-blur-md ${
        isSelected
          ? // Selected State: Stronger glass with pure white border and glow
            'bg-white/[0.06] border-2 border-white/80 ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-[1.01]'
          : // Unselected State: Subtle stealth glass
            'bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/30'
      }`}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between w-full mb-2">
          <div className="flex items-center gap-2.5">
            {/* Icon Container: Pure Black Glass */}
            <div
              className="p-2 rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm shadow-sm flex items-center justify-center shrink-0"
              style={{ color: agent.badgeColor || 'rgba(255,255,255,0.8)' }}
            >
              {getIcon()}
            </div>
            <div className="truncate">
              <h3 className="font-sans font-semibold text-[13px] text-white/80 group-hover:text-white transition-colors truncate">
                {agent.name}
              </h3>
              <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider block">
                {agent.category}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          {agent.isInstalled ? (
            // Installed Badge: Monochrome stealth style
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-mono font-medium text-white/80 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{agent.detectedVersion || 'Ready'}</span>
            </span>
          ) : (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyInstall}
                title={agent.installCommand ? `Copy: ${agent.installCommand}` : 'Install guide'}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono font-medium text-white/60 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white/80" /> : <Download className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : '1-Click Install'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-[12px] text-white/40 font-sans line-clamp-2 my-1 leading-relaxed">
          {agent.description}
        </p>
      </div>

      {/* Footer / Models Strip */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
        {agent.supportedModels.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            {agent.supportedModels.slice(0, 3).map((m) => (
              <span
                key={m}
                className="text-[11px] px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-white/40 font-mono"
              >
                {m}
              </span>
            ))}
            {agent.supportedModels.length > 3 && (
              <span className="text-[11px] text-white/20 font-mono">
                +{agent.supportedModels.length - 3}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] font-mono text-white/20">Native PTY Terminal</span>
        )}

        {agent.docUrl && (
          <a
            href={agent.docUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-white/20 hover:text-white/80 transition-colors p-1"
            title="Open Documentation"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};