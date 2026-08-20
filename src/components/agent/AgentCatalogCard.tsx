import React, { useState } from 'react';
import { DiscoveredAgent } from '@/types/agent';
import { getAgentLogo } from './AgentLogos';
import { CheckCircle2, Download, Check } from 'lucide-react';

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

  const handleCopyInstall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!agent.installCommand) return;
    navigator.clipboard.writeText(agent.installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      className={`group relative flex items-center justify-between p-3.5 rounded-xl transition-all duration-150 outline-none select-none cursor-pointer border ${
        isSelected
          ? 'bg-[#303236] border-[#5683da] shadow-[0_0_12px_rgba(86,131,218,0.15)] ring-1 ring-[#5683da]'
          : 'bg-[#111111] hover:bg-[#303236] border-[#4a4b50] hover:border-[#5683da]/60'
      }`}
    >
      {/* Left: Professional Logo & Title */}
      <div className="flex items-center gap-3 min-w-0 mr-2">
        <div
          className="w-8 h-8 rounded-xl border border-[#4a4b50] bg-[#090a0c] text-white flex items-center justify-center shrink-0 transition-colors group-hover:border-[#5683da]/40"
        >
          {getAgentLogo(agent.id, 'w-4 h-4')}
        </div>
        <div className="truncate">
          <h3 className="font-sans font-semibold text-xs text-white group-hover:text-[#5683da] transition-colors truncate">
            {agent.name}
          </h3>
        </div>
      </div>

      {/* Right: Status / Install Pill */}
      <div className="shrink-0">
        {agent.isInstalled ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111111] border border-[#4a4b50] text-[10px] font-mono font-medium text-[#27c93f]">
            <CheckCircle2 className="w-3 h-3" />
            <span>Ready</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleCopyInstall}
            title={agent.installCommand ? `Copy: ${agent.installCommand}` : 'Install guide'}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111111] hover:bg-[#303236] border border-[#ff8964]/40 hover:border-[#ff8964] text-[10px] font-mono font-medium text-[#ff8964] transition-all active:scale-95 cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-[#27c93f]" /> : <Download className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Install'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
