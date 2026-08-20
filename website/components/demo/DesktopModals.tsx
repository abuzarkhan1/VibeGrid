'use client';

import React from 'react';
import { DesktopAgentLauncherModal } from './DesktopAgentLauncherModal';
import { DesktopLayoutStudioModal } from './DesktopLayoutStudioModal';
import { DesktopCommandPalette } from './DesktopCommandPalette';
import { DesktopDiffViewerDrawer } from './DesktopDiffViewerDrawer';
import { DesktopShortcutsModal } from './DesktopShortcutsModal';
import { DemoThemeSelectorModal } from './DemoThemeSelectorModal';
import { DemoTheme, DEMO_THEMES } from './demoThemes';
import { DemoAgent, DemoRolePod, DEMO_AGENTS, HETEROGENEOUS_ROLE_PODS } from './demoAgents';
import { DemoLayoutPreset, DEMO_LAYOUT_PRESETS } from './demoLayouts';

export type ActiveDesktopModal =
  | 'none'
  | 'launcher'
  | 'studio'
  | 'theme'
  | 'palette'
  | 'diff'
  | 'shortcuts'
  | 'agent-launcher'
  | 'layout-studio'
  | 'theme-selector'
  | 'command-palette'
  | 'diff-viewer';

export interface DesktopModalsProps {
  activeModal: ActiveDesktopModal | string;
  onClose: () => void;
  currentTheme?: DemoTheme;
  activeLayoutId?: string;
  activePaneId?: number;
  paneCount?: number;
  onDeployAgent?: (
    agent: DemoAgent,
    targetPaneId?: number,
    model?: string,
    prompt?: string,
    cliArgs?: string[]
  ) => void;
  onDeployPod?: (pod: DemoRolePod) => void;
  onSelectLayout?: (layoutId: string, cornerRadius?: number, gutterSize?: number) => void;
  onSelectTheme?: (theme: DemoTheme) => void;
  onOpenAgentLauncher?: () => void;
  onOpenLayoutStudio?: () => void;
  onOpenThemeStudio?: () => void;
  onOpenDiffViewer?: () => void;
  onOpenShortcuts?: () => void;
  onRunTest?: () => void;
  onClearPanes?: () => void;
  onResetPanes?: () => void;
  onStageCommit?: () => void;
  onSplitPane?: (direction: 'horizontal' | 'vertical') => void;
  onToggleMaximize?: () => void;
}

export function DesktopModals({
  activeModal,
  onClose,
  currentTheme = DEMO_THEMES.vibedark,
  activeLayoutId = '2x2',
  activePaneId = 1,
  paneCount = 4,
  onDeployAgent,
  onDeployPod,
  onSelectLayout,
  onSelectTheme,
  onOpenAgentLauncher,
  onOpenLayoutStudio,
  onOpenThemeStudio,
  onOpenDiffViewer,
  onOpenShortcuts,
  onRunTest,
  onClearPanes,
  onResetPanes,
  onStageCommit,
  onSplitPane,
  onToggleMaximize,
}: DesktopModalsProps) {
  if (activeModal === 'none') return null;

  return (
    <>
      {/* 1. Agent Launcher Modal */}
      <DesktopAgentLauncherModal
        isOpen={activeModal === 'launcher' || activeModal === 'agent-launcher'}
        onClose={onClose}
        currentTheme={currentTheme}
        activePaneId={activePaneId}
        paneCount={paneCount}
        onDeployAgent={onDeployAgent}
        onDeployPod={onDeployPod}
      />

      {/* 2. Layout Studio Modal */}
      <DesktopLayoutStudioModal
        isOpen={activeModal === 'studio' || activeModal === 'layout-studio'}
        onClose={onClose}
        currentTheme={currentTheme}
        activeLayoutId={activeLayoutId}
        onApplyLayout={onSelectLayout}
      />

      {/* 3. Theme Selector Modal */}
      <DemoThemeSelectorModal
        isOpen={activeModal === 'theme' || activeModal === 'theme-selector'}
        onClose={onClose}
        currentTheme={currentTheme}
        onSelectTheme={(t) => {
          onSelectTheme?.(t);
          onClose();
        }}
      />

      {/* 4. Command Palette (⌘K) Modal */}
      <DesktopCommandPalette
        isOpen={activeModal === 'palette' || activeModal === 'command-palette'}
        onClose={onClose}
        currentTheme={currentTheme}
        onSelectLayout={onSelectLayout}
        onDeployAgent={onDeployAgent}
        onSelectTheme={onSelectTheme}
        onOpenAgentLauncher={onOpenAgentLauncher}
        onOpenLayoutStudio={onOpenLayoutStudio}
        onOpenThemeStudio={onOpenThemeStudio}
        onOpenDiffViewer={onOpenDiffViewer}
        onOpenShortcuts={onOpenShortcuts}
        onRunTest={onRunTest}
        onClearPanes={onClearPanes}
        onResetPanes={onResetPanes}
        onSplitPane={onSplitPane}
        onToggleMaximize={onToggleMaximize}
      />

      {/* 5. Content-Aware Diff Drawer */}
      <DesktopDiffViewerDrawer
        isOpen={activeModal === 'diff' || activeModal === 'diff-viewer'}
        onClose={onClose}
        currentTheme={currentTheme}
        onStageCommit={onStageCommit}
      />

      {/* 6. Shortcuts Modal */}
      <DesktopShortcutsModal
        isOpen={activeModal === 'shortcuts'}
        onClose={onClose}
        currentTheme={currentTheme}
      />
    </>
  );
}

// Re-export individual components
export {
  DesktopAgentLauncherModal,
  DesktopLayoutStudioModal,
  DesktopCommandPalette,
  DesktopDiffViewerDrawer,
  DesktopShortcutsModal,
};

// Re-export supporting data and types
export { DEMO_AGENTS, HETEROGENEOUS_ROLE_PODS } from './demoAgents';
export type { DemoAgent, DemoRolePod } from './demoAgents';
export { DEMO_LAYOUT_PRESETS } from './demoLayouts';
export type { DemoLayoutPreset } from './demoLayouts';
export { DEMO_THEMES } from './demoThemes';
export type { DemoTheme } from './demoThemes';
