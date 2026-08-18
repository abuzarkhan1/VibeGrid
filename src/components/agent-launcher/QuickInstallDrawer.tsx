import React, { useState } from 'react';
import { useAgentCatalogStore } from '@/store/useAgentCatalogStore';
import { Copy, Check, DownloadCloud } from 'lucide-react';

export const QuickInstallDrawer: React.FC = () => {
  const agents = useAgentCatalogStore((s) => s.agents);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const missingAgents = Object.values(agents).filter(
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
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-white/90 font-mono uppercase tracking-wider">
        <DownloadCloud className="w-4 h-4 text-violet-400" />
        <span>1-Click Missing Agent Setup</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {missingAgents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#1A1B26] border border-white/10 text-xs font-mono"
          >
            <div className="truncate mr-2">
              <span className="text-white/70 mr-2">{agent.name}:</span>
              <span className="text-violet-400">{agent.installCommand}</span>
            </div>
            <button
              onClick={() => handleCopy(agent.id, agent.installCommand!)}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-white/70 hover:text-white/90 transition-colors shrink-0 cursor-pointer"
              aria-label={`Copy install command for ${agent.name}`}
              title="Copy install command"
            >
              {copiedId === agent.id ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
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
