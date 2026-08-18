import React, { useState } from 'react';
import {
  Terminal,
  Cpu,
  Loader2,
  GitBranch,
  Bot,
  Coins,
  Activity,
  Radio,
  Mic,
  Layers,
} from 'lucide-react';
import { usePaneStore } from '@/store/usePaneStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useCustomizationStore } from '@/store/useCustomizationStore';
import { useAgentStore } from '@/store/useAgentStore';
import { useVoiceStore } from '@/store/useVoiceStore';
import { PaneNode, TerminalNode } from '@/types/layout';
import { StatusBarWidgetConfig } from '@/types/customization';

// Helper to find focused terminal node details
const findTerminalNode = (
  node: PaneNode | null,
  targetId: string | null
): TerminalNode | null => {
  if (!targetId || !node) return null;
  if (node.type === 'terminal') {
    return node.id === targetId ? node : null;
  }
  return (
    findTerminalNode(node.children[0], targetId) ||
    findTerminalNode(node.children[1], targetId)
  );
};

// Shared pill style — slim, dark, no heavy glass
const PILL = 'flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-[11px] font-mono';

export const StatusBar: React.FC = () => {
  const { paneCount, maxPanes, focusedPaneId, root } = usePaneStore();
  const { workspaces, activeWorkspaceId, isLoading } = useWorkspaceStore();
  const { activeWebglPanes } = useUIStore();
  const hideStatusBar = useSettingsStore((s) => s.hideStatusBar);

  const {
    statusBarWidgets,
    colorRingHex,
    gitBranch,
    isGitDirty,
  } = useCustomizationStore();

  const activeAgents = useAgentStore((s) => s.paneAssignments || {});
  const isRecordingVoice = useVoiceStore((s) => s.isListening);
  const audioLevel = useVoiceStore((s) => s.level || 0);

  // Telemetry for CPU / RAM and Token Cost
  const [tokens] = useState(24680);
  const [cost] = useState(0.08);

  if (hideStatusBar) return null;

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const focusedNode = findTerminalNode(root, focusedPaneId);
  const isWebglActive = focusedPaneId
    ? activeWebglPanes.includes(focusedPaneId)
    : true;
  const activeAgentCount = Object.keys(activeAgents).length;

  const renderWidget = (widget: StatusBarWidgetConfig) => {
    if (!widget.enabled) return null;

    switch (widget.id) {
      case 'workspace_identity':
        return (
          <div key={widget.id} className="flex items-center gap-2.5 text-white/90">
            {/* Live pulse dot */}
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                style={{ backgroundColor: colorRingHex || '#8B5CF6' }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: colorRingHex || '#8B5CF6' }}
              />
            </span>

            <span className="text-[11px] font-semibold text-white/90 tracking-tight">
              {activeWs?.emoji || '⚡'} {activeWs?.name || 'workspace'}
            </span>

            {focusedPaneId && (
              <div className="flex items-center gap-1 text-white/40 text-[11px] border-l border-white/[0.08] pl-2.5">
                <Terminal className="w-3 h-3" />
                <span className="truncate max-w-[140px]">
                  {focusedNode?.title || 'Terminal 1'}
                  {focusedNode?.cwd ? ` — ${focusedNode.cwd.split(/[/\\]/).pop()}` : ''}
                </span>
              </div>
            )}
          </div>
        );

      case 'git_branch':
        return (
          <div
            key={widget.id}
            className={`${PILL} text-emerald-400`}
            title={`Git: ${gitBranch || 'main'} (${isGitDirty ? 'dirty' : 'clean'})`}
          >
            <GitBranch className="w-3 h-3" />
            <span>{gitBranch || 'main'}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${isGitDirty ? 'bg-amber-400' : 'bg-emerald-400'}`}
            />
          </div>
        );

      case 'active_agents':
        return (
          <div
            key={widget.id}
            className={`${PILL} text-violet-400`}
            title="AI Agent Fleet"
          >
            <Bot className="w-3 h-3" />
            <span>
              {activeAgentCount > 0
                ? `${activeAgentCount} Agent${activeAgentCount > 1 ? 's' : ''}`
                : 'Agents Fleet Ready'}
            </span>
          </div>
        );

      case 'token_cost_meter':
        return (
          <div
            key={widget.id}
            className={`${PILL} text-white/50`}
            title="Session token usage & estimated cost"
          >
            <Coins className="w-3 h-3 text-amber-400" />
            <span>{(tokens / 1000).toFixed(1)}k tok · ${cost.toFixed(2)}</span>
          </div>
        );

      case 'webgl_slots':
        return (
          <div
            key={widget.id}
            className="flex items-center gap-1.5 text-[11px] font-mono text-white/50"
            title="Renderer mode"
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${
                  isWebglActive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                  isWebglActive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </span>
            <Cpu className={`w-3 h-3 ${isWebglActive ? 'text-violet-400' : 'text-amber-400'}`} />
            <span>{isWebglActive ? 'GPU (WebGL)' : 'CPU (Canvas)'}</span>
          </div>
        );

      case 'system_resources':
        return (
          <div
            key={widget.id}
            className="flex items-center gap-1.5 text-[11px] font-mono text-white/40"
            title="Host resource usage"
          >
            <Activity className="w-3 h-3 text-violet-400" />
            <span>CPU 14% · RAM 2.1GB</span>
          </div>
        );

      case 'active_ports':
        return (
          <div
            key={widget.id}
            className="flex items-center gap-1 text-[11px] font-mono text-emerald-400"
            title="Listening dev ports"
          >
            <Radio className="w-3 h-3" />
            <span>:3000, :5173</span>
          </div>
        );

      case 'audio_vu_meter':
        return (
          <div
            key={widget.id}
            className={`${PILL} ${
              isRecordingVoice
                ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                : 'text-white/40'
            }`}
            title="Voice input"
          >
            <Mic className={`w-3 h-3 ${isRecordingVoice ? 'text-red-400' : 'text-white/30'}`} />
            <div className="flex items-center gap-0.5 h-2.5">
              {[0.2, 0.5, 0.8, 0.4].map((h, i) => (
                <span
                  key={i}
                  className={`w-0.5 rounded-full transition-all ${
                    isRecordingVoice ? 'bg-red-400' : 'bg-white/20'
                  }`}
                  style={{
                    height: isRecordingVoice
                      ? `${Math.max(2, Math.min(10, (audioLevel || h) * 10))}px`
                      : `${h * 8}px`,
                  }}
                />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const leftWidgets = statusBarWidgets.filter((w) => w.enabled && w.zone === 'left');
  const centerWidgets = statusBarWidgets.filter((w) => w.enabled && w.zone === 'center');
  const rightWidgets = statusBarWidgets.filter((w) => w.enabled && w.zone === 'right');

  return (
    <footer className="h-7 w-full bg-[#1A1B26] border-t border-white/[0.06] px-4 flex items-center justify-between font-mono text-xs text-white/40 select-none z-30 shrink-0">
      {/* Left Zone */}
      <div className="flex items-center gap-4">
        {leftWidgets.map(renderWidget)}
      </div>

      {/* Center Zone */}
      <div className="hidden md:flex items-center gap-4">
        {centerWidgets.map(renderWidget)}
      </div>

      {/* Right Zone */}
      <div className="flex items-center gap-3">
        {isLoading && (
          <div className="flex items-center gap-1.5 text-violet-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[11px]">Restoring…</span>
          </div>
        )}

        {rightWidgets.map(renderWidget)}

        {/* Pane Count Badge */}
        <div className={`${PILL} text-white/50`}>
          <Layers className="w-3 h-3 text-white/30" />
          <span>{paneCount}/{maxPanes} Panes</span>
        </div>
      </div>
    </footer>
  );
};


