'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { DEMO_THEMES, DemoTheme } from './demo/demoThemes';
import { DEMO_AGENTS, DemoAgent } from './demo/demoAgents';
import { DEMO_LAYOUT_PRESETS, DemoLayoutPreset } from './demo/demoLayouts';
import {
  DesktopAgentLauncherModal,
  DesktopLayoutStudioModal,
  DesktopCommandPalette,
  DesktopDiffViewerDrawer,
  DesktopShortcutsModal,
} from './demo/DesktopModals';
import { DemoThemeSelectorModal } from './demo/DemoThemeSelectorModal';

interface PaneState {
  id: number;
  title: string;
  agentId: string;
  cwd: string;
  cmd: string;
  status: string;
  badge: string;
  badgeColor: string;
  logs: { bullet: string; bulletColor: string; text: string }[];
}

const INITIAL_PANES: PaneState[] = [
  {
    id: 1,
    title: 'agent-1: claude-code',
    agentId: 'claude',
    cwd: '~/vibegrid/core',
    cmd: 'claude --auto-commit',
    status: 'Generating Rust PTY batching pipeline...',
    badge: 'CLAUDE ACTIVE',
    badgeColor: 'bg-[#111111] text-[#5683da] border-[#5683da]/50',
    logs: [
      { bullet: '●', bulletColor: 'text-[#5683da]', text: 'Spawning Rust PTY subprocess (PID 49102)...' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'WebGL 2.0 context initialized at 60.0 FPS' },
      { bullet: '⚡', bulletColor: 'text-[#ffbd2e]', text: 'IPC buffer latency: 1.2ms [optimal]' },
      { bullet: '→', bulletColor: 'text-[#5683da]', text: 'Orchestrating 16-pane terminal grid loop...' },
    ],
  },
  {
    id: 2,
    title: 'agent-2: aider-gpt4o',
    agentId: 'aider',
    cwd: '~/vibegrid/website',
    cmd: 'aider --model gpt-4o app/page.tsx',
    status: 'Compiling architectural dark surface tokens...',
    badge: 'AIDER ACTIVE',
    badgeColor: 'bg-[#111111] text-[#ff8964] border-[#ff8964]/50',
    logs: [
      { bullet: '●', bulletColor: 'text-[#ff8964]', text: 'AST parser analyzed 14 source files' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'Refactored architectural dark surface tokens' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'Ticker continuous marquee sync confirmed' },
      { bullet: '⚡', bulletColor: 'text-[#ffbd2e]', text: 'Staging git commit: feat(hero): architectural grid' },
    ],
  },
  {
    id: 3,
    title: 'agent-3: ollama-local',
    agentId: 'ollama',
    cwd: '~/vibegrid/mcp',
    cmd: 'ollama run qwen2.5-coder:32b',
    status: 'Executing offline MCP tool lookup...',
    badge: 'OFFLINE MCP',
    badgeColor: 'bg-[#111111] text-emerald-400 border-emerald-500/50',
    logs: [
      { bullet: '●', bulletColor: 'text-emerald-400', text: 'Qwen 2.5 Coder 32B loaded in VRAM (18.4 GB unified)' },
      { bullet: '⚡', bulletColor: 'text-[#ffbd2e]', text: 'Tool call: kanban_get_workspace_context()' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: '0ms network egress · 100% air-gapped privacy' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'AST symbols mapped into local state cache' },
    ],
  },
  {
    id: 4,
    title: 'agent-4: sys-dev-server',
    agentId: 'deepseek',
    cwd: '~/vibegrid',
    cmd: 'npm run dev',
    status: 'Vite desktop runtime ready on port :1420',
    badge: 'READY :1420',
    badgeColor: 'bg-[#111111] text-[#a9a9aa] border-[#4a4b50]',
    logs: [
      { bullet: '➜', bulletColor: 'text-[#5683da]', text: 'Local:   http://localhost:1420/' },
      { bullet: '➜', bulletColor: 'text-[#5683da]', text: 'Network: use --host to expose' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: '[HMR] Connected to WebGL grid canvas' },
      { bullet: '⚡', bulletColor: 'text-[#ffbd2e]', text: '0 dropped frames · 60.0 FPS locked' },
    ],
  },
  {
    id: 5,
    title: 'agent-5: codex-verifier',
    agentId: 'codex',
    cwd: '~/vibegrid/tests',
    cmd: 'codex --exec --turbo',
    status: 'Running background memory audit...',
    badge: 'CODEX ACTIVE',
    badgeColor: 'bg-[#111111] text-emerald-400 border-emerald-500/50',
    logs: [
      { bullet: '●', bulletColor: 'text-emerald-400', text: 'OpenAI Codex o3-mini-high connected' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'All 142 unit tests passed in 4.2ms' },
      { bullet: '⚡', bulletColor: 'text-[#ffbd2e]', text: 'Zero memory leaks in PTY buffer pipeline' },
    ],
  },
  {
    id: 6,
    title: 'agent-6: antigravity-supervisor',
    agentId: 'antigravity',
    cwd: '~/vibegrid/skills',
    cmd: 'agy run --swarm-mode',
    status: 'Supervising 6-node agent fleet...',
    badge: 'ANTIGRAVITY',
    badgeColor: 'bg-[#111111] text-[#ff8964] border-[#ff8964]/50',
    logs: [
      { bullet: '●', bulletColor: 'text-[#ff8964]', text: 'Supervisor synchronized with terminal matrix' },
      { bullet: '⚡', bulletColor: 'text-[#ffbd2e]', text: 'Active skills: [modern-web, devtools, memory]' },
      { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'All agent nodes operating at peak throughput' },
    ],
  },
];

type ActiveModalType =
  | 'none'
  | 'agent-launcher'
  | 'layout-studio'
  | 'theme-selector'
  | 'command-palette'
  | 'diff-viewer'
  | 'shortcuts';

export function FloatingProductFrame() {
  const [activePane, setActivePane] = useState<number>(1);
  const [currentTheme, setCurrentTheme] = useState<DemoTheme>(DEMO_THEMES.vibedark);
  const [currentLayout, setCurrentLayout] = useState<DemoLayoutPreset['id']>('2x2');
  const [cornerRadius, setCornerRadius] = useState<number>(12);
  const [gutterSize, setGutterSize] = useState<number>(1);
  const [activeModal, setActiveModal] = useState<ActiveModalType>('none');
  const [panes, setPanes] = useState<PaneState[]>(INITIAL_PANES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveModal((prev) => (prev === 'command-palette' ? 'none' : 'command-palette'));
        return;
      }

      // Escape -> close any open modal
      if (e.key === 'Escape') {
        if (activeModal !== 'none') {
          e.preventDefault();
          setActiveModal('none');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  // Determine active panes based on layout
  const visiblePanes = React.useMemo(() => {
    if (currentLayout === '1x2') {
      return panes.slice(0, 2);
    }
    if (currentLayout === '3x3') {
      return panes.slice(0, 6);
    }
    // 2x2 or hero-1-3
    return panes.slice(0, 4);
  }, [currentLayout, panes]);

  // Deploy an agent to a specific pane
  const handleDeployAgent = (
    agent: DemoAgent,
    targetPaneId: number = activePane,
    model?: string,
    prompt?: string
  ) => {
    setPanes((prevPanes) =>
      prevPanes.map((p) => {
        if (p.id === targetPaneId) {
          const updatedLogs = [
            ...agent.simulatedLogs,
            ...(prompt
              ? [{ bullet: '→', bulletColor: 'text-[#5683da]', text: `Task Objective: "${prompt}"` }]
              : []),
            { bullet: '⚡', bulletColor: 'text-[#27c93f]', text: `Active inference on ${model || agent.defaultModel}` },
          ];
          return {
            ...p,
            title: `agent-${targetPaneId}: ${agent.id}`,
            agentId: agent.id,
            cmd: `${agent.command} --model ${model || agent.defaultModel}`,
            status: agent.statusText,
            badge: agent.badge,
            badgeColor: agent.badgeColor,
            logs: updatedLogs,
          };
        }
        return p;
      })
    );
    showToast(`Deployed ${agent.name} to Pane #0${targetPaneId}`);
  };

  // Switch layout
  const handleApplyLayout = (
    layoutId: DemoLayoutPreset['id'],
    radius: number = cornerRadius,
    gutter: number = gutterSize
  ) => {
    setCurrentLayout(layoutId);
    setCornerRadius(radius);
    setGutterSize(gutter);
    const preset = DEMO_LAYOUT_PRESETS.find((p) => p.id === layoutId);
    showToast(`Layout switched to ${preset?.name || layoutId}`);
  };

  // Switch theme
  const handleSelectTheme = (theme: DemoTheme) => {
    setCurrentTheme(theme);
    showToast(`Theme switched to ${theme.name}`);
  };

  // Run simulated cargo test
  const handleRunTest = () => {
    setPanes((prev) =>
      prev.map((p) => {
        if (p.id === activePane) {
          return {
            ...p,
            cmd: 'cargo test --workspace',
            status: 'Test execution completed in 3.8ms',
            logs: [
              { bullet: '●', bulletColor: 'text-[#5683da]', text: 'Running 142 tests across 8 crates...' },
              { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'test pty::test_raw_mode ... ok' },
              { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'test webgl::test_shader_pipeline ... ok' },
              { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'test agent::test_ipc_batching ... ok' },
              { bullet: '⚡', bulletColor: 'text-[#27c93f]', text: 'test result: ok. 142 passed; 0 failed; 0 ignored (3.8ms)' },
            ],
          };
        }
        return p;
      })
    );
    showToast('Executed cargo test across workspace (142 passed)');
  };

  // Clear panes
  const handleClearPanes = () => {
    setPanes((prev) =>
      prev.map((p) => ({
        ...p,
        logs: [
          { bullet: '●', bulletColor: 'text-[#5683da]', text: 'Terminal buffer cleared' },
          { bullet: '➜', bulletColor: 'text-[#27c93f]', text: 'Ready for next agent command' },
        ],
      }))
    );
    showToast('Terminal buffer cleared');
  };

  // Reset panes
  const handleResetPanes = () => {
    setPanes(INITIAL_PANES);
    setCurrentLayout('2x2');
    setCurrentTheme(DEMO_THEMES.vibedark);
    showToast('Reset all panes to default fleet');
  };

  // Staging diff commit
  const handleStageCommit = () => {
    setPanes((prev) =>
      prev.map((p) => {
        if (p.id === 1) {
          return {
            ...p,
            logs: [
              ...p.logs,
              { bullet: '✔', bulletColor: 'text-[#27c93f]', text: 'Staged src/middleware/auth.rs' },
              { bullet: '⚡', bulletColor: 'text-[#27c93f]', text: 'commit 8f9b1c2: feat(auth): zero-copy Ed25519 token verification' },
            ],
          };
        }
        return p;
      })
    );
    showToast('Diff staged & committed: src/middleware/auth.rs (+18 / -6)');
  };

  return (
    <div id="product-frame" className="relative mx-auto max-w-[1140px] px-4 sm:px-6">
      {/* 12px Rounded Dark Window Frame Container */}
      <div
        style={{
          backgroundColor: currentTheme.bgCard,
          borderColor: currentTheme.border,
          borderRadius: `${cornerRadius}px`,
        }}
        className="relative overflow-hidden border shadow-[0_20px_60px_rgba(0,0,0,0.85)] select-none transition-all duration-300"
      >
        {/* Window Chrome Titlebar */}
        <div
          style={{
            backgroundColor: currentTheme.bgHeader,
            borderColor: currentTheme.border,
          }}
          className="flex items-center justify-between border-b px-4 py-2.5 flex-wrap gap-2 transition-colors"
        >
          {/* Left: macOS Traffic Lights + Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56] inline-block border border-black/30" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e] inline-block border border-black/30" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f] inline-block border border-black/30" />
            </div>
            <div className="ml-1 font-mono text-xs text-[#a9a9aa] font-medium flex items-center gap-1.5">
              <span style={{ color: currentTheme.accentPrimary }} className="font-bold">
                vibegrid
              </span>
              <span className="text-[#4a4b50]">—</span>
              <span className="text-white">workspace: multi-agent-prod</span>
            </div>
          </div>

          {/* Right: Status Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 font-mono text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              4 Panes Synchronized
            </span>
          </div>
        </div>

        {/* Active Pane Switcher Tab Bar */}
        <div
          style={{
            backgroundColor: currentTheme.bgHeader,
            borderColor: currentTheme.border,
          }}
          className="flex items-center border-b overflow-x-auto text-xs font-mono custom-scrollbar"
        >
          {visiblePanes.map((pane) => {
            const isActive = activePane === pane.id;
            return (
              <button
                key={pane.id}
                onClick={() => setActivePane(pane.id)}
                style={{
                  borderColor: currentTheme.border,
                  backgroundColor: isActive ? currentTheme.bgCard : 'transparent',
                  borderBottomColor: isActive ? currentTheme.accentPrimary : 'transparent',
                }}
                className={`flex items-center gap-2 px-4 py-2 border-r transition-colors whitespace-nowrap cursor-pointer ${
                  isActive ? 'text-white border-b-2' : 'text-[#a9a9aa] hover:text-white hover:bg-white/5'
                }`}
              >
                <span
                  style={{
                    backgroundColor:
                      pane.id === 1
                        ? currentTheme.accentPrimary
                        : pane.id === 2
                        ? currentTheme.accentSecondary
                        : pane.id === 3
                        ? currentTheme.accentSuccess
                        : currentTheme.textSecondary,
                  }}
                  className="h-1.5 w-1.5 rounded-full"
                />
                <span>#0{pane.id}</span>
                <span className="text-[#6b6c6d]">{pane.title.split(':')[1] || pane.title}</span>
              </button>
            );
          })}

          {/* Quick Add / Action inside Tab Bar */}
          <div className="ml-auto pr-3 hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#6b6c6d]">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {visiblePanes.length} Panes Active
            </span>
          </div>
        </div>

        {/* Interactive Dynamic Grid Layout */}
        <div
          style={{
            backgroundColor: currentTheme.bgCanvas,
            gap: `${gutterSize}px`,
          }}
          className={`grid font-mono text-xs transition-all ${
            currentLayout === '1x2'
              ? 'grid-cols-1 md:grid-cols-2'
              : currentLayout === '3x3'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : currentLayout === 'hero-1-3'
              ? 'grid-cols-1 lg:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2'
          }`}
        >
          {visiblePanes.map((pane, idx) => {
            const isHeroPane = currentLayout === 'hero-1-3' && idx === 0;
            const isActive = activePane === pane.id;

            return (
              <div
                key={pane.id}
                onClick={() => setActivePane(pane.id)}
                style={{
                  backgroundColor: currentTheme.bgCard,
                  borderColor: isActive ? currentTheme.borderActive : currentTheme.border,
                }}
                className={`p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between border ${
                  isHeroPane ? 'lg:col-span-2 lg:row-span-3 min-h-[360px]' : 'min-h-[190px]'
                } ${
                  isActive
                    ? 'ring-1 ring-inset ring-[#5683da] shadow-inner'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                <div>
                  {/* Pane Header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="text-[#e5e5e7] font-semibold flex items-center gap-2">
                      <span
                        style={{
                          color:
                            pane.id === 1
                              ? currentTheme.accentPrimary
                              : pane.id === 2
                              ? currentTheme.accentSecondary
                              : pane.id === 3
                              ? currentTheme.accentSuccess
                              : currentTheme.textSecondary,
                        }}
                        className="font-mono"
                      >
                        #0{pane.id}
                      </span>
                      <span className="text-[#a9a9aa] font-normal">{pane.cwd}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-mono tracking-wider uppercase ${pane.badgeColor}`}
                    >
                      {pane.badge}
                    </span>
                  </div>

                  {/* Pane Command Line */}
                  <div className="text-[#6b6c6d] mb-2.5">
                    $ <span className="text-white font-medium">{pane.cmd}</span>
                  </div>

                  {/* Live Output Stream */}
                  <div className="space-y-1 text-[11px] text-[#a9a9aa]">
                    {pane.logs.map((log, lIdx) => (
                      <div key={lIdx} className="leading-relaxed truncate flex items-center gap-2">
                        <span className={`${log.bulletColor} font-bold shrink-0`}>{log.bullet}</span>
                        <span className="truncate">{log.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Active Status Caret */}
                <div
                  style={{ borderColor: `${currentTheme.border}80` }}
                  className="mt-3 pt-2.5 border-t flex items-center justify-between text-[11px]"
                >
                  <span className="text-[#e5e5e7] flex items-center gap-2 truncate">
                    <span
                      style={{
                        backgroundColor:
                          pane.id === 1
                            ? currentTheme.accentPrimary
                            : pane.id === 2
                            ? currentTheme.accentSecondary
                            : pane.id === 3
                            ? currentTheme.accentSuccess
                            : currentTheme.textSecondary,
                      }}
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                    />
                    <span className="truncate text-[#a9a9aa]">{pane.status}</span>
                  </span>
                  <span className="text-white font-bold ml-2 animate-pulse">▌</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Bar Footer */}
        <div
          style={{
            backgroundColor: currentTheme.bgFooter,
            borderColor: currentTheme.border,
          }}
          className="flex items-center justify-between border-t px-4 py-2.5 text-[11px] font-mono text-[#a9a9aa] flex-wrap gap-2 transition-colors"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#27c93f]" />
              WebGL 2.0: 60.0 FPS
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5683da]" />
              PTY Latency: 1.2ms
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff8964]" />
              Zero Egress: 100% Local
            </span>
          </div>

          <div className="flex items-center gap-3 text-[#6b6c6d]">
            <span
              onClick={() => setActiveModal('command-palette')}
              className="hover:text-white cursor-pointer transition-colors"
            >
              ⌘K Command
            </span>
            <span>•</span>
            <span
              onClick={() => setActiveModal('agent-launcher')}
              className="hover:text-white cursor-pointer transition-colors"
            >
              Deploy Agent
            </span>
            <span>•</span>
            <span
              onClick={() => setActiveModal('layout-studio')}
              className="hover:text-white cursor-pointer transition-colors"
            >
              Layouts
            </span>
            <span>•</span>
            <span
              onClick={() => setActiveModal('diff-viewer')}
              className="hover:text-white cursor-pointer transition-colors"
            >
              Diff
            </span>
          </div>
        </div>

        {/* Floating Notification Toast */}
        {toastMessage && (
          <div className="absolute bottom-12 right-4 z-40 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111111]/95 border border-[#5683da] text-white text-xs font-mono shadow-2xl backdrop-blur-md animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#27c93f] shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}

        {/* ══════════════════════ MODAL OVERLAYS ══════════════════════ */}

        {/* 1. Agent Launcher Modal */}
        <DesktopAgentLauncherModal
          isOpen={activeModal === 'agent-launcher'}
          onClose={() => setActiveModal('none')}
          currentTheme={currentTheme}
          activePaneId={activePane}
          paneCount={visiblePanes.length}
          onDeployAgent={handleDeployAgent}
        />

        {/* 2. Layout Studio Modal */}
        <DesktopLayoutStudioModal
          isOpen={activeModal === 'layout-studio'}
          onClose={() => setActiveModal('none')}
          currentTheme={currentTheme}
          activeLayoutId={currentLayout}
          onApplyLayout={handleApplyLayout}
        />

        {/* 3. Theme Selector Modal */}
        <DemoThemeSelectorModal
          isOpen={activeModal === 'theme-selector'}
          onClose={() => setActiveModal('none')}
          currentTheme={currentTheme}
          onSelectTheme={handleSelectTheme}
        />

        {/* 4. Command Palette (⌘K) Modal */}
        <DesktopCommandPalette
          isOpen={activeModal === 'command-palette'}
          onClose={() => setActiveModal('none')}
          currentTheme={currentTheme}
          onSelectLayout={handleApplyLayout}
          onDeployAgent={(agent) => handleDeployAgent(agent, activePane)}
          onSelectTheme={handleSelectTheme}
          onOpenAgentLauncher={() => setActiveModal('agent-launcher')}
          onOpenLayoutStudio={() => setActiveModal('layout-studio')}
          onOpenThemeStudio={() => setActiveModal('theme-selector')}
          onOpenDiffViewer={() => setActiveModal('diff-viewer')}
          onOpenShortcuts={() => setActiveModal('shortcuts')}
          onRunTest={handleRunTest}
          onClearPanes={handleClearPanes}
          onResetPanes={handleResetPanes}
        />

        {/* 5. Content-Aware Diff Drawer */}
        <DesktopDiffViewerDrawer
          isOpen={activeModal === 'diff-viewer'}
          onClose={() => setActiveModal('none')}
          currentTheme={currentTheme}
          onStageCommit={handleStageCommit}
        />

        {/* 6. Shortcuts Modal */}
        <DesktopShortcutsModal
          isOpen={activeModal === 'shortcuts'}
          onClose={() => setActiveModal('none')}
          currentTheme={currentTheme}
        />
      </div>
    </div>
  );
}
