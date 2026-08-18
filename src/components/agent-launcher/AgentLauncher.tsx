import React, { useEffect } from 'react';
import { useAgentCatalogStore } from '@/store/useAgentCatalogStore';
import { AgentCatalogCard } from './AgentCatalogCard';
import { PaneAgentMatrix } from './PaneAgentMatrix';
import { QuickInstallDrawer } from './QuickInstallDrawer';
import { Bot, RefreshCw } from 'lucide-react';

export const AgentLauncher: React.FC = () => {
  const agents = useAgentCatalogStore((s) => s.agents);
  const isScanning = useAgentCatalogStore((s) => s.isScanning);
  const scanInstalledAgents = useAgentCatalogStore((s) => s.scanInstalledAgents);

  useEffect(() => {
    scanInstalledAgents();
  }, [scanInstalledAgents]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-2 select-none">
      {/* Step Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-violet-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4" />
            <span className="px-2 py-0.5 rounded-md bg-violet-400/10 border border-violet-400/20 text-[11px] text-violet-400 font-mono">AGENTS</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white/90 tracking-tight font-sans">
            Agent & Provider Engine
          </h2>
          <p className="text-xs text-white/70 mt-1 font-sans">
            Discovered CLI and API agent providers ready for pane assignment.
          </p>
        </div>

        <button
          onClick={() => scanInstalledAgents()}
          disabled={isScanning}
          className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs px-3 py-1.5 flex items-center gap-1.5 text-xs text-white/70 hover:text-white/90 disabled:opacity-50 active:scale-95 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-violet-400' : ''}`} />
          <span className="font-mono">{isScanning ? 'Scanning...' : 'Rescan System'}</span>
        </button>
      </div>

      {/* Discovered Agent Catalog Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {Object.values(agents)
          .filter((a) => a.id !== 'shell')
          .map((agent) => (
            <AgentCatalogCard key={agent.id} agent={agent} />
          ))}
      </div>

      {/* Missing Agents Helper */}
      <QuickInstallDrawer />

      {/* Pane to Agent Matrix */}
      <div>
        <div className="mb-2">
          <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider font-mono">
            Pane Assignment Matrix
          </h3>
          <p className="text-xs text-white/40">
            Map layout panes to agent runtimes, model parameters, and execution flags.
          </p>
        </div>

        <PaneAgentMatrix />
      </div>
    </div>
  );
};
