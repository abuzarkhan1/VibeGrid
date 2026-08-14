import React, { useState } from 'react';
import { TerminalToolbar } from './TerminalToolbar';
import { TerminalPane } from './TerminalPane';
import { PaneErrorBoundary } from './PaneErrorBoundary';
import { usePaneStore } from '@/store/usePaneStore';
import { paneColorForIndex } from '@/lib/paneColors';

interface TerminalContainerProps {
  id: string; // Node ID
  title?: string;
}

/**
 * Perf: memoized + fine-grained store selectors so a layout change elsewhere
 * (e.g. dragging another divider, which only replaces the resized split's
 * node reference) never re-renders this pane. It re-renders only when its own
 * node (id/title) changes or focus state flips.
 */
export const TerminalContainer: React.FC<TerminalContainerProps> = React.memo(({ id, title }) => {
  const focusedPaneId = usePaneStore((s) => s.focusedPaneId);
  const maximizedPaneId = usePaneStore((s) => s.maximizedPaneId);
  const setFocusedPane = usePaneStore((s) => s.setFocusedPane);
  // Tree-order index → alternating background tint + colored identity rail.
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
      style={{ '--pane-accent': paneColorForIndex(paneIndex) } as React.CSSProperties}
      className={`vg-pane-frame h-full w-full flex flex-col overflow-hidden relative rounded-lg border bg-background ${
        isFocused
          ? 'border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.07)] vg-pane-focused'
          : 'border-white/[0.08]'
      } ${paneIndex % 2 === 1 ? 'vg-pane-alt' : ''}`}
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
    </div>
  );
});
