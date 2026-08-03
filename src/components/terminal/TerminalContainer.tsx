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
  const [hasActivity, setHasActivity] = useState(false);

  const isFocused = focusedPaneId === id;
  const isMaximized = maximizedPaneId === id;

  // Toolbar is visible if pane is focused or hovered (FR-011)
  const isToolbarVisible = isFocused || isHovered;

  const handleFocus = () => {
    setFocusedPane(id);
    setHasActivity(false);
  };

  return (
    <div
      onClick={handleFocus}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`h-full w-full flex flex-col overflow-hidden transition-all duration-150 relative rounded-lg bg-[#0b0d12] border ${
        isFocused
          ? 'border-forest-bright/60 shadow-[0_0_14px_rgba(84,169,103,0.14)] z-10'
          : 'border-white/[0.07] hover:border-forest/35'
      }`}
    >
      <div
        className={`absolute top-0 left-0 right-0 z-20 transition-opacity duration-200 ${
          isToolbarVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <TerminalToolbar nodeId={id} title={title} isFocused={isFocused} isMaximized={isMaximized} hasActivity={hasActivity} />
      </div>
      <div className="flex-1 w-full overflow-hidden relative">
        <div className="relative z-0 h-full w-full">
          <TerminalPane id={id} isFocused={isFocused} onActivity={() => setHasActivity(true)} />
        </div>
      </div>
    </div>
  );
};
