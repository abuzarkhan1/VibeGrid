'use client';

import React from 'react';

/** 1. WebGL Pulse Ring Visual for 60 FPS WebGL card */
export function WebGLPulseRing() {
  return (
    <div className="relative w-full h-36 overflow-hidden rounded-xl bg-[#08080a] border border-white/[0.08] flex items-center justify-center">
      <svg
        viewBox="0 0 300 140"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full pointer-events-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{`
            .webgl-ring-pulse,
            .scan-line-rot {
              transform-box: fill-box;
              transform-origin: center;
            }
            @keyframes webgl-pulse {
              0% { transform: scale(0.2); opacity: 0.8; stroke-width: 2px; }
              100% { transform: scale(1); opacity: 0; stroke-width: 0.5px; }
            }
            @keyframes scan-rotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .webgl-ring-pulse {
              animation: webgl-pulse 3s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
            }
            .scan-line-rot {
              animation: scan-rotate 6s linear infinite;
            }
          `}</style>
          <linearGradient id="scanGrad" x1="150" y1="70" x2="220" y2="70">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Concentric rings */}
        {[20, 40, 60].map((r) => (
          <circle
            key={r}
            cx="150"
            cy="70"
            r={r}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ))}

        {/* Pulsing Signal Rings */}
        <circle
          className="webgl-ring-pulse"
          cx="150"
          cy="70"
          r="60"
          stroke="#FFFFFF"
          fill="none"
        />

        {/* Rotating Radar Sweep Line */}
        <g className="scan-line-rot">
          <line
            x1="150"
            y1="70"
            x2="220"
            y2="70"
            stroke="url(#scanGrad)"
            strokeWidth="2"
          />
        </g>

        {/* Center Node */}
        <circle cx="150" cy="70" r="4" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }} />
      </svg>
      <div className="absolute bottom-2 left-3 text-[10px] font-mono text-zinc-400">
        60 FPS WebGL Renderer · GPU Active
      </div>
    </div>
  );
}

/** 2. Rust PTY Data Flow Pipeline Visual */
export function RustPtyDataFlow() {
  const PATH_1 = "M 20,40 L 280,40";
  const PATH_2 = "M 20,70 L 280,70";
  const PATH_3 = "M 20,100 L 280,100";

  return (
    <div className="relative w-full h-36 overflow-hidden rounded-xl bg-[#08080a] border border-white/[0.08] flex items-center justify-center">
      <svg
        viewBox="0 0 300 140"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full pointer-events-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{`
            @keyframes pty-pulse {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 1; }
            }
            .pty-node-dot {
              animation: pty-pulse 2s ease-in-out infinite;
            }
          `}</style>
        </defs>

        {/* Parallel Channels */}
        <line x1="20" y1="40" x2="280" y2="40" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
        <line x1="20" y1="70" x2="280" y2="70" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        <line x1="20" y1="100" x2="280" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />

        {/* Flowing Packets */}
        <circle r="3" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 6px #ffffff)' }}>
          <animateMotion dur="1.8s" repeatCount="indefinite" path={PATH_2} />
        </circle>
        <circle r="2.5" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 4px #ffffff)' }}>
          <animateMotion dur="2.4s" repeatCount="indefinite" path={PATH_1} begin="0.4s" />
        </circle>
        <circle r="2.5" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 4px #ffffff)' }}>
          <animateMotion dur="2.1s" repeatCount="indefinite" path={PATH_3} begin="0.8s" />
        </circle>

        {/* Node Status Markers */}
        <circle className="pty-node-dot" cx="30" cy="70" r="5" fill="#FFFFFF" />
        <circle className="pty-node-dot" cx="150" cy="70" r="5" fill="#FFFFFF" style={{ animationDelay: '0.5s' }} />
        <circle className="pty-node-dot" cx="270" cy="70" r="5" fill="#FFFFFF" style={{ animationDelay: '1s' }} />
      </svg>
      <div className="absolute bottom-2 left-3 text-[10px] font-mono text-zinc-400">
        Rust PTY RingBuffer · &lt;10ms Latency
      </div>
    </div>
  );
}

/** 3. Multi-Pane Grid Topology Visual */
export function MultiPaneGridVisual() {
  return (
    <div className="relative w-full h-36 overflow-hidden rounded-xl bg-[#08080a] border border-white/[0.08] p-3 grid grid-cols-2 gap-2">
      {[1, 2, 3, 4].map((pane) => (
        <div
          key={pane}
          className={`relative rounded-lg border p-2 flex flex-col justify-between transition-all ${
            pane === 1
              ? 'border-white/40 bg-zinc-900/80 shadow-lg'
              : 'border-white/[0.08] bg-zinc-900/30'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className={pane === 1 ? 'text-white font-bold' : 'text-zinc-500'}>
              Pane 0{pane}
            </span>
            {pane === 1 && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            )}
          </div>
          <div className="text-[9px] font-mono text-zinc-400 truncate">
            {pane === 1 ? 'zsh · active agent' : 'zsh · idle'}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 4. Agent Agnostic Connection Hub Visual */
export function AgentAgnosticHubVisual() {
  return (
    <div className="relative w-full h-36 overflow-hidden rounded-xl bg-[#08080a] border border-white/[0.08] flex items-center justify-center">
      <svg
        viewBox="0 0 300 140"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full pointer-events-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{`
            .hub-signal-ring {
              transform-box: fill-box;
              transform-origin: center;
            }
            @keyframes hub-signal {
              0% { transform: scale(0.263); opacity: 0.9; stroke-width: 1.5px; }
              100% { transform: scale(1); opacity: 0; stroke-width: 0.5px; }
            }
            .hub-signal-ring {
              animation: hub-signal 2.2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
            }
          `}</style>
        </defs>

        {/* Center Hub */}
        <circle className="hub-signal-ring" cx="150" cy="70" r="38" stroke="#FFFFFF" fill="none" />
        <circle cx="150" cy="70" r="12" fill="#08080a" stroke="#FFFFFF" strokeWidth="2" />
        <circle cx="150" cy="70" r="4" fill="#FFFFFF" />

        {/* 4 Agent Nodes */}
        {[
          { x: 50, y: 35, label: 'Claude' },
          { x: 250, y: 35, label: 'Codex' },
          { x: 50, y: 105, label: 'Ollama' },
          { x: 250, y: 105, label: 'DeepSeek' },
        ].map((node, i) => {
          const pathD = `M 150,70 L ${node.x},${node.y}`;
          return (
            <g key={i}>
              <line x1="150" y1="70" x2={node.x} y2={node.y} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle r="2.5" fill="#FFFFFF">
                <animateMotion dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" path={pathD} />
              </circle>
              <circle cx={node.x} cy={node.y} r="8" fill="#08080a" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <text x={node.x} y={node.y + 18} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="monospace">
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
