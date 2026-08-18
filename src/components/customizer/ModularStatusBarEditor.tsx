import React from 'react';
import { useCustomizationStore } from '@/store/useCustomizationStore';
import {
  Layout,
  GitBranch,
  Bot,
  Coins,
  Cpu,
  Activity,
  Radio,
  Mic,
  CheckSquare,
  Square,
  ArrowUp,
  ArrowDown,
  Sliders,
} from 'lucide-react';

const WIDGET_METADATA: Record<
  string,
  { label: string; desc: string; icon: React.FC<{ className?: string }> }
> = {
  workspace_identity: {
    label: 'Workspace Identity',
    desc: 'Displays workspace icon, name and active pane CWD',
    icon: Layout,
  },
  git_branch: {
    label: 'Git Branch & Status',
    desc: 'Real-time repository branch with dirty status indicator',
    icon: GitBranch,
  },
  active_agents: {
    label: 'Active Agents HUD',
    desc: 'Multi-agent supervisor state indicators and fleet count',
    icon: Bot,
  },
  token_cost_meter: {
    label: 'Token & Cost Meter',
    desc: 'Session LLM token count and estimated spend ticker',
    icon: Coins,
  },
  webgl_slots: {
    label: 'GPU WebGL Telemetry',
    desc: 'Active GPU context slots and 60 FPS performance counter',
    icon: Cpu,
  },
  system_resources: {
    label: 'CPU & RAM Monitor',
    desc: 'Host CPU percentage and memory footprint monitor',
    icon: Activity,
  },
  active_ports: {
    label: 'Listening Ports',
    desc: 'Auto-detected dev server ports (3000, 5173, 8080)',
    icon: Radio,
  },
  audio_vu_meter: {
    label: 'Audio VU Meter',
    desc: 'Whisper voice input amplitude waveform meter',
    icon: Mic,
  },
};

export const ModularStatusBarEditor: React.FC = () => {
  const { statusBarWidgets, toggleWidget, setWidgetZone, reorderWidgets } =
    useCustomizationStore();

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= statusBarWidgets.length) return;
    const next = [...statusBarWidgets];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    // update orders
    next.forEach((w, i) => {
      w.order = i;
    });
    reorderWidgets(next);
  };

  return (
    <div className="space-y-6 text-[#e8e8ea]">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-sans font-bold text-[#e8e8ea] uppercase tracking-wider block">
            Modular Status Bar Telemetry
          </label>
          <span className="text-[10px] font-sans text-[#a3a3ab]">
            Configure, reorder, and position telemetry widgets across Left, Center, and Right zones
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            reorderWidgets(
              statusBarWidgets.map((w) => ({ ...w, enabled: true }))
            );
          }}
          className="text-xs font-mono text-[#818cf8] hover:underline"
        >
          Enable All
        </button>
      </div>

      {/* Widget Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {statusBarWidgets.map((widget, index) => {
          const meta = WIDGET_METADATA[widget.id] || {
            label: widget.id,
            desc: 'Telemetry module',
            icon: Sliders,
          };
          const Icon = meta.icon;

          return (
            <div
              key={widget.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                widget.enabled
                  ? 'bg-[#232327] border-[#333338] shadow-sm'
                  : 'bg-[#1a1a1e] border-[#2a2a2e] opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg border shrink-0 ${
                      widget.enabled
                        ? 'bg-[#6366f1]/15 border-[#6366f1]/30 text-[#818cf8]'
                        : 'bg-[#1a1a1e] border-[#333338] text-[#6f6f78]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    <h4 className="text-xs font-sans font-bold text-white mb-0.5">
                      {meta.label}
                    </h4>
                    <p className="text-[11px] font-sans text-[#a3a3ab] leading-snug">
                      {meta.desc}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleWidget(widget.id)}
                  className="p-1 text-[#818cf8] hover:text-white transition-colors shrink-0"
                  title={widget.enabled ? 'Disable widget' : 'Enable widget'}
                >
                  {widget.enabled ? (
                    <CheckSquare className="w-5 h-5 text-[#6366f1]" />
                  ) : (
                    <Square className="w-5 h-5 text-[#6f6f78]" />
                  )}
                </button>
              </div>

              {/* Zone Selector & Reorder Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-[#333338] text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-[#a3a3ab] mr-1">Zone:</span>
                  {(['left', 'center', 'right'] as const).map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setWidgetZone(widget.id, z)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono capitalize transition-all ${
                        widget.zone === z
                          ? 'bg-[#6366f1] text-white font-bold'
                          : 'bg-[#1a1a1e] text-[#a3a3ab] hover:text-white border border-[#333338]'
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    title="Move earlier"
                    className="p-1 rounded bg-[#1a1a1e] hover:bg-[#2a2a2f] text-[#a3a3ab] hover:text-white border border-[#333338] disabled:opacity-30"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === statusBarWidgets.length - 1}
                    title="Move later"
                    className="p-1 rounded bg-[#1a1a1e] hover:bg-[#2a2a2f] text-[#a3a3ab] hover:text-white border border-[#333338] disabled:opacity-30"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Status Bar Preview */}
      <div className="p-3.5 rounded-xl bg-[#232327] border border-[#333338] space-y-2">
        <span className="text-[10px] font-mono font-bold text-[#a3a3ab] uppercase tracking-wider block">
          Live Status Bar Preview (40px Shell Chrome)
        </span>

        <div className="h-10 w-full bg-[#1a1a1e] border border-[#333338] rounded-xl px-3 flex items-center justify-between font-mono text-[11px] text-[#e8e8ea] select-none shadow-inner">
          {/* Left zone */}
          <div className="flex items-center gap-3">
            {statusBarWidgets
              .filter((w) => w.enabled && w.zone === 'left')
              .map((w) => (
                <span key={w.id} className="flex items-center gap-1.5 text-[#e8e8ea]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]" />
                  <span>{WIDGET_METADATA[w.id]?.label || w.id}</span>
                </span>
              ))}
          </div>

          {/* Center zone */}
          <div className="flex items-center gap-3">
            {statusBarWidgets
              .filter((w) => w.enabled && w.zone === 'center')
              .map((w) => (
                <span key={w.id} className="flex items-center gap-1 text-[#a3a3ab]">
                  <span>{WIDGET_METADATA[w.id]?.label || w.id}</span>
                </span>
              ))}
          </div>

          {/* Right zone */}
          <div className="flex items-center gap-3">
            {statusBarWidgets
              .filter((w) => w.enabled && w.zone === 'right')
              .map((w) => (
                <span key={w.id} className="flex items-center gap-1 text-[#a3a3ab]">
                  <span>{WIDGET_METADATA[w.id]?.label || w.id}</span>
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
