import React, { useState } from 'react';
import { TerminalToolbar } from './TerminalToolbar';
import { TerminalPane } from './TerminalPane';
import { usePaneStore } from '@/store/usePaneStore';

interface TerminalContainerProps {
  id: string; // Node ID
  title?: string;
}

export const TerminalContainer: React.FC<TerminalContainerProps> = ({ id, title }) => {
  const { focusedPaneId, maximizedPaneId, setFocusedPane } = usePaneStore();
  const [isHovered, setIsHovered] = useState(false);

  const isFocused = focusedPaneId === id;
  const isMaximized = maximizedPaneId === id;

  // Toolbar is visible if pane is focused or hovered (FR-011)
  const isToolbarVisible = isFocused || isHovered;

  return (
    <div
      onClick={() => setFocusedPane(id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`h-full w-full flex flex-col overflow-hidden transition-all duration-150 relative bg-[#0a0b0d] border-2 ${
        isFocused
          ? 'border-forest-bright shadow-[0_0_18px_rgba(84,169,103,0.35)] z-10'
          : 'border-white/[0.06] hover:border-forest/40'
      }`}
    >
      <div
        className={`absolute top-0 left-0 right-0 z-20 transition-opacity duration-200 ${
          isToolbarVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <TerminalToolbar nodeId={id} title={title} isFocused={isFocused} isMaximized={isMaximized} />
      </div>
      <div className="flex-1 w-full overflow-hidden relative">
        {isFocused && (
          <div className="animate-scan-line pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-forest-bright/25 to-transparent" />
        )}
        <div className="relative z-0 h-full w-full">
          <TerminalPane id={id} isFocused={isFocused} />
        </div>
      </div>
    </div>
  );
};
