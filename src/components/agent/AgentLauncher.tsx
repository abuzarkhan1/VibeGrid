import React, { useEffect } from 'react';
import { useAgentStore } from '@/store/useAgentStore';
import { AgentCatalogCard } from './AgentCatalogCard';
import { PaneAgentMatrix } from './PaneAgentMatrix';
import { QuickInstallDrawer } from './QuickInstallDrawer';
import { Bot, RefreshCw } from 'lucide-react';

export const AgentLauncher: React.FC = () => {
  const agents = useAgentStore((s) => s.agents);
  const isScanning = useAgentStore((s) => s.isScanning);
  const scanInstalledAgents = useAgentStore((s) => s.scanInstalledAgents);
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);
  const setSelectedAgent = useAgentStore((s) => s.setSelectedAgent);

  useEffect(() => {
    scanInstalledAgents();
  }, [scanInstalledAgents]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-2 select-none">
      {}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#a9a9aa] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4 text-[#5683da]" />
            <span className="px-2.5 py-0.5 rounded-full bg-[#303236] border border-[#4a4b50] text-[11px] text-[#5683da] font-mono font-medium">AGENTS</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">
            Agent Providers
          </h2>
          <p className="text-xs text-[#a9a9aa] mt-1 font-sans">
            Assign AI coding agents to terminal panes.
          </p>
        </div>

        <button
          onClick={() => scanInstalledAgents()}
          disabled={isScanning}
          className="px-3.5 py-1.5 rounded-full bg-[#303236] hover:bg-[#303236]/80 border border-[#4a4b50] text-xs flex items-center gap-1.5 text-[#a9a9aa] hover:text-white disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed active:scale-95 cursor-pointer transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-[#5683da]' : ''}`} />
          <span className="font-mono">{isScanning ? 'Scanning...' : 'Rescan'}</span>
        </button>
      </div>

      {/* Agents Overview */}
      <div className="relative">
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 transition-opacity duration-200 ${isScanning ? 'opacity-40 pointer-events-none' : ''}`}>
          {agents
            .filter((a) => a.id !== 'shell')
            .map((agent) => (
              <AgentCatalogCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgentId === agent.id}
                onSelect={() => setSelectedAgent(agent.id)}
              />
            ))}
        </div>
        {isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#090a0c]/90 rounded-2xl border border-[#4a4b50] gap-2.5 z-10 animate-fade-in">
            <RefreshCw className="w-5 h-5 text-[#5683da] animate-spin" />
            <span className="text-xs font-mono text-white">Scanning environment for CLI agents…</span>
          </div>
        )}
      </div>

      {/* Missing Agents Helper */}
      <QuickInstallDrawer />

      {/* Pane to Agent Matrix */}
      <div>
        <div className="mb-2">
          <h3 className="text-xs font-semibold text-[#a9a9aa] uppercase tracking-wider font-mono">
            Pane Assignment Matrix
          </h3>
        </div>

        <PaneAgentMatrix />
      </div>
    </div>
  );
};
