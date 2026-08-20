import React, { useState } from 'react';
import { useAgentStore } from '@/store/useAgentStore';
import { Copy, Check, DownloadCloud } from 'lucide-react';

export const QuickInstallDrawer: React.FC = () => {
  const agents = useAgentStore((s) => s.agents);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const missingAgents = agents.filter(
    (a) => !a.isInstalled && a.installCommand
  );

  if (missingAgents.length === 0) {
    return null;
  }

  const handleCopy = (id: string, cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 md:p-5 rounded-2xl bg-[#111111] border border-[#4a4b50] flex flex-col gap-3 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-white font-mono uppercase tracking-wider">
          <DownloadCloud className="w-4 h-4 text-[#5683da]" />
          <span>Install Missing Agents</span>
        </div>
        <span className="text-[11px] font-mono text-[#a9a9aa]">
          {missingAgents.length} Tools
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {missingAgents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#111111] border border-[#4a4b50] text-xs font-mono"
          >
            <div className="truncate mr-2">
              <span className="text-white font-semibold mr-2">{agent.name}:</span>
              <span className="text-[#a9a9aa]">{agent.installCommand}</span>
            </div>
            <button
              onClick={() => handleCopy(agent.id, agent.installCommand!)}
              className="p-1.5 rounded-full bg-[#303236] hover:bg-[#303236]/80 border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-all active:scale-95 shrink-0 cursor-pointer flex items-center justify-center"
              aria-label={`Copy install command for ${agent.name}`}
              title="Copy install command"
            >
              {copiedId === agent.id ? (
                <Check className="w-3.5 h-3.5 text-[#27c93f]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
