import React, { useState } from 'react';
import { TerminalToolbar } from './TerminalToolbar';
import { TerminalPane } from './TerminalPane';
import { PaneErrorBoundary } from './PaneErrorBoundary';
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

  const handleFocus = () => {
    setFocusedPane(id);
    setHasActivity(false);
  };

  return (
    <div
      onClick={handleFocus}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`h-full w-full flex flex-col overflow-hidden transition-all duration-150 relative rounded-lg bg-pane-bg border ${
        isFocused
          ? 'border-forest-bright/60 shadow-[0_0_14px_rgba(84,169,103,0.14)] z-10'
          : 'border-white/[0.07] hover:border-forest/35'
      }`}
    >
      {/* UX audit P1 #6/#7: the title bar is ALWAYS visible so every pane is
          identifiable at a glance (and background activity dots are visible);
          the toolbar controls still only act on focus/hover via CSS. */}
      <div className="relative z-20 shrink-0">
        <TerminalToolbar nodeId={id} title={title} isFocused={isFocused} isMaximized={isMaximized} hasActivity={hasActivity} />
      </div>
      <div className="flex-1 w-full overflow-hidden relative">
        <div className="relative z-0 h-full w-full">
          {/* UX audit P3 #33: a crash in this pane must not take down the grid. */}
          <PaneErrorBoundary id={id}>
            <TerminalPane id={id} isFocused={isFocused} onActivity={() => setHasActivity(true)} />
          </PaneErrorBoundary>
        </div>
      </div>
      {isHovered && !isFocused && (
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-forest/25 z-10" />
      )}
    </div>
  );
};
