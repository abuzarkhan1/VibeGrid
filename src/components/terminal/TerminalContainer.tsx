import React, { useState } from 'react';
import { TerminalToolbar } from './TerminalToolbar';
import { TerminalPane } from './TerminalPane';
import { PaneErrorBoundary } from './PaneErrorBoundary';
import { usePaneStore } from '@/store/usePaneStore';

interface TerminalContainerProps {
  id: string;
  title?: string;
}

export const TerminalContainer: React.FC<TerminalContainerProps> = React.memo(({ id, title }) => {
  const focusedPaneId = usePaneStore((s) => s.focusedPaneId);
  const maximizedPaneId = usePaneStore((s) => s.maximizedPaneId);
  const setFocusedPane = usePaneStore((s) => s.setFocusedPane);
  const paneIndex = usePaneStore((s) => s.getPaneIndex(id));
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
      className={`vg-pane-frame h-full w-full flex flex-col overflow-hidden relative rounded-xl border bg-black transition-all duration-150 ${
        isFocused
          ? 'border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.12)] vg-pane-focused'
          : 'border-white/10 hover:border-white/20'
      } ${paneIndex % 2 === 1 ? 'vg-pane-alt' : ''}`}
    >
      <div className="relative z-20 shrink-0">
        <TerminalToolbar nodeId={id} title={title} isFocused={isFocused} isMaximized={isMaximized} hasActivity={hasActivity} />
      </div>
      <div className="flex-1 w-full overflow-hidden relative">
        <div className="relative z-0 h-full w-full">
          <PaneErrorBoundary id={id}>
            <TerminalPane id={id} isFocused={isFocused} onActivity={() => setHasActivity(true)} />
          </PaneErrorBoundary>
        </div>
      </div>
    </div>
  );
});