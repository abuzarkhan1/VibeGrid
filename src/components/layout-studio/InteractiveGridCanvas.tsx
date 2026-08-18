import React from 'react';
import { PaneNode } from '@/types/layout';
import { Terminal, Bot, Sparkles, Cpu } from 'lucide-react';
import { useOnboardingStore } from '@/store/useOnboardingStore';

interface InteractiveGridCanvasProps {
  node: PaneNode;
}

export const InteractiveGridCanvas: React.FC<InteractiveGridCanvasProps> = ({ node }) => {
  const assignments = useOnboardingStore((s) => s.paneAgentAssignments);

  if (!node) return null;

  let paneIndexCounter = 0;

  const getAgentIcon = (agentId?: string) => {
    switch (agentId) {
      case 'claude-code':
        return <Sparkles className="w-3.5 h-3.5 text-violet-400" />;
      case 'aider':
        return <Bot className="w-3.5 h-3.5 text-emerald-400" />;
      case 'ollama':
        return <Cpu className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-white/70" />;
    }
  };

  const renderNode = (current: PaneNode): React.ReactNode => {
    if (!current) return null;

    if (current.type === 'terminal') {
      paneIndexCounter++;
      const currentPaneNumber = paneIndexCounter;
      const config = assignments[current.id];
      const name = config?.name || current.title || `Pane ${currentPaneNumber}`;
      const isAgent = config && config.agentId !== 'shell';

      return (
        <div className="relative flex-1 h-full w-full p-2.5 flex flex-col justify-between rounded-lg bg-white/[0.03] hover:border-violet-400/50 hover:bg-white/[0.06] border border-white/[0.06] transition-all overflow-hidden select-none min-w-0 min-h-0">
          {/* Header pill */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-md !px-2 !py-0.5 text-xs text-white/90 border-white/10">
              {getAgentIcon(config?.agentId)}
              <span className="font-medium text-white/90 truncate max-w-[120px]">{name}</span>
            </div>
            {isAgent && config?.model ? (
              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs !px-1.5 !py-0.5 text-[9px] font-mono !bg-accent/20 !text-violet-400 !border-violet-400/30">
                {config.model}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs !px-1.5 !py-0.5 text-[9px] font-mono text-white/70 border-white/10">
                #{currentPaneNumber}
              </span>
            )}
          </div>

          {/* Center Pane Role Blueprint Tag */}
          <div className="my-auto flex flex-col items-center justify-center gap-1 text-center py-2 min-w-0">
            <span className="font-mono text-xs font-semibold text-white/90 truncate">
              {currentPaneNumber === 1 ? 'Primary Terminal' : `Worker Pane ${currentPaneNumber}`}
            </span>
            <span className="text-[10px] font-mono text-white/40 truncate">
              {isAgent ? config.name : 'Interactive Shell (zsh/bash)'}
            </span>
          </div>

          {/* Bottom status */}
          <div className="flex items-center justify-between text-[10px] text-white/40 font-mono border-t border-white/10 pt-1.5">
            <span>READY</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-medium">Active</span>
            </span>
          </div>
        </div>
      );
    }

    // Split Node
    const isHorizontal = current.direction === 'horizontal';

    return (
      <div
        className={`flex-1 h-full w-full flex ${
          isHorizontal ? 'flex-row' : 'flex-col'
        } gap-1.5 p-1 bg-white/[0.02] rounded-lg border border-white/10`}
      >
        <div
          style={{ flex: current.ratio }}
          className="h-full w-full min-w-0 min-h-0"
        >
          {renderNode(current.children[0])}
        </div>

        {/* Split separator indicator */}
        <div
          className={`flex items-center justify-center select-none ${
            isHorizontal ? 'w-1 flex-col' : 'h-1 flex-row'
          } rounded bg-white/10`}
        />

        <div
          style={{ flex: 1 - current.ratio }}
          className="h-full w-full min-w-0 min-h-0"
        >
          {renderNode(current.children[1])}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[260px] p-2 rounded-xl bg-[#1A1B26] border border-white/[0.06] flex items-center justify-center">
      {renderNode(node)}
    </div>
  );
};
