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
        return <Sparkles className="w-3.5 h-3.5 text-[#5683da]" />;
      case 'aider':
        return <Bot className="w-3.5 h-3.5 text-[#27c93f]" />;
      case 'ollama':
        return <Cpu className="w-3.5 h-3.5 text-[#5683da]" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-[#a9a9aa]" />;
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
        <div className="relative flex-1 h-full w-full p-2.5 flex flex-col justify-between rounded-lg bg-[#303236] hover:border-[#5683da] border border-[#4a4b50] transition-all overflow-hidden select-none min-w-0 min-h-0">
          {/* Header pill */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 bg-[#111111] border border-[#4a4b50] rounded-full px-2.5 py-0.5 text-xs text-white">
              {getAgentIcon(config?.agentId)}
              <span className="font-medium text-white truncate max-w-[120px]">{name}</span>
            </div>
            {isAgent && config?.model ? (
              <span className="px-2 py-0.5 rounded-full bg-[#111111] border border-[#5683da] text-[9px] font-mono text-[#5683da]">
                {config.model}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-[#111111] border border-[#4a4b50] text-[9px] font-mono text-[#a9a9aa]">
                #{currentPaneNumber}
              </span>
            )}
          </div>

          {/* Center Pane Role Blueprint Tag */}
          <div className="my-auto flex flex-col items-center justify-center gap-1 text-center py-2 min-w-0">
            <span className="font-mono text-xs font-semibold text-white truncate">
              {currentPaneNumber === 1 ? 'Primary Terminal' : `Worker Pane ${currentPaneNumber}`}
            </span>
            <span className="text-[10px] font-mono text-[#a9a9aa] truncate">
              {isAgent ? config.name : 'Interactive Shell (zsh/bash)'}
            </span>
          </div>

          {/* Bottom status */}
          <div className="flex items-center justify-between text-[10px] text-[#a9a9aa] font-mono border-t border-[#4a4b50] pt-1.5">
            <span>READY</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#27c93f]" />
              <span className="text-[#27c93f] font-medium">Active</span>
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
        } gap-1.5 p-1 bg-[#111111] rounded-lg border border-[#4a4b50]`}
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
          } rounded bg-[#4a4b50]`}
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
    <div className="w-full h-[260px] p-2 rounded-2xl bg-[#111111] border border-[#4a4b50] flex items-center justify-center">
      {renderNode(node)}
    </div>
  );
};
