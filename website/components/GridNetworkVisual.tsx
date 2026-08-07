'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Grid, Shield, Bot } from 'lucide-react';

interface NodeData {
  id: string;
  title: string;
  sub: string;
  x: number;
  y: number;
  icon: React.ElementType;
  color: string;
  glow: string;
  metric: string;
}

const NODES: NodeData[] = [
  {
    id: 'webgl',
    title: 'WebGL GPU Renderer',
    sub: 'xterm.js GPU pipeline',
    x: 140,
    y: 90,
    icon: Zap,
    color: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.8)',
    metric: '60 FPS · 5000 lines',
  },
  {
    id: 'agent',
    title: 'Agnostic AI Agent Hub',
    sub: 'Local & Cloud AI IPC',
    x: 660,
    y: 90,
    icon: Bot,
    color: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.8)',
    metric: 'Zero lock-in',
  },
  {
    id: 'grid',
    title: '1–16 Multi-Pane Grid',
    sub: 'Dynamic split layout',
    x: 140,
    y: 310,
    icon: Grid,
    color: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.8)',
    metric: 'Instant workspace switch',
  },
  {
    id: 'security',
    title: 'OS Keychain Vault',
    sub: 'Hardware AES-256 Secrets',
    x: 660,
    y: 310,
    icon: Shield,
    color: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.8)',
    metric: 'Local Enclave',
  },
];

const MASTER_NODE = {
  x: 400,
  y: 200,
  title: 'VibeGrid Rust PTY Core',
  sub: '<10ms Keystroke Latency',
};

export function GridNetworkVisual() {
  const [activeNode, setActiveNode] = useState<string | null>('webgl');

  return (
    <div className="relative w-full rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-4 sm:p-6 shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Background Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            Live Node Topology
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold text-white mt-1">
            Animated Signal Network & Data Flow
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap max-w-full overflow-x-auto no-scrollbar">
          {NODES.map((node) => (
            <button
              key={node.id}
              onClick={() => setActiveNode(node.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                activeNode === node.id
                  ? 'bg-zinc-800 border border-white/[0.16] text-white shadow-lg'
                  : 'bg-zinc-900/50 border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/30'
              }`}
            >
              {node.title.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas for Topology */}
      <div className="relative w-full aspect-[2/1] min-h-[320px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#08080a]/80">
        <svg
          viewBox="0 0 800 400"
          preserveAspectRatio="none"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <style>{`
              .animate-master-pulse,
              .animate-node-signal {
                transform-box: fill-box;
                transform-origin: center;
              }
              @keyframes master-pulse {
                0%, 100% { transform: scale(0.615); opacity: 0.3; stroke-width: 1px; }
                50% { transform: scale(1); opacity: 0.8; stroke-width: 2px; }
              }
              @keyframes node-signal-ring {
                0% { transform: scale(0.428); opacity: 0.9; stroke-width: 2px; }
                100% { transform: scale(1); opacity: 0; stroke-width: 0.5px; }
              }
              .animate-master-pulse {
                animation: master-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              }
              .animate-node-signal {
                animation: node-signal-ring 2.5s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
              }
            `}</style>
          </defs>

          {/* Connection Lines and Flow Particles */}
          {NODES.map((node, idx) => {
            const isSelected = activeNode === node.id;
            const isLeft = node.x < MASTER_NODE.x;
            const isTop = node.y < MASTER_NODE.y;
            const cpx1 = MASTER_NODE.x + (isLeft ? -80 : 80);
            const cpy1 = MASTER_NODE.y + (isTop ? -40 : 40);
            const cpx2 = node.x + (isLeft ? 80 : -80);
            const cpy2 = node.y + (isTop ? 40 : -40);

            const pathD = `M ${MASTER_NODE.x},${MASTER_NODE.y} C ${cpx1},${cpy1} ${cpx2},${cpy2} ${node.x},${node.y}`;
            const pathReverseD = `M ${node.x},${node.y} C ${cpx2},${cpy2} ${cpx1},${cpy1} ${MASTER_NODE.x},${MASTER_NODE.y}`;
            const dur = 2.4 + idx * 0.4;

            return (
              <g key={`connection-${node.id}`}>
                {/* Background Line */}
                <path
                  d={pathD}
                  stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.12)'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  strokeDasharray={isSelected ? 'none' : '4 4'}
                  fill="none"
                  className="transition-all duration-300"
                />

                {/* Animated Data Packets (Forward) */}
                <circle r={isSelected ? '3.5' : '2.5'} fill="#ffffff" style={{ filter: 'drop-shadow(0 0 6px #ffffff)' }}>
                  <animateMotion
                    dur={`${dur}s`}
                    repeatCount="indefinite"
                    path={pathD}
                    begin={`${idx * 0.3}s`}
                  />
                </circle>

                {/* Animated Data Packets (Reverse) */}
                <circle r="2" fill="#ffffff" opacity="0.6">
                  <animateMotion
                    dur={`${dur * 1.2}s`}
                    repeatCount="indefinite"
                    path={pathReverseD}
                    begin={`${idx * 0.4 + 0.5}s`}
                  />
                </circle>
              </g>
            );
          })}

          {/* Master Node Central Pulse */}
          <circle
            className="animate-master-pulse"
            cx={MASTER_NODE.x}
            cy={MASTER_NODE.y}
            r={52}
            fill="none"
            stroke="rgba(255,255,255,0.4)"
          />

          {/* Master Node Outer Ring */}
          <circle
            cx={MASTER_NODE.x}
            cy={MASTER_NODE.y}
            r={24}
            fill="#08080a"
            stroke="#ffffff"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.6))' }}
          />

          {/* Master Node Core Dot */}
          <circle
            cx={MASTER_NODE.x}
            cy={MASTER_NODE.y}
            r={8}
            fill="#FFFFFF"
          />

          {/* Leaf Nodes */}
          {NODES.map((node) => {
            const isSelected = activeNode === node.id;
            return (
              <g
                key={`node-grp-${node.id}`}
                className="cursor-pointer"
                onClick={() => setActiveNode(node.id)}
              >
                {/* Node Signal Ring */}
                <circle
                  className="animate-node-signal"
                  cx={node.x}
                  cy={node.y}
                  r={42}
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                />

                {/* Node Base Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? '18' : '14'}
                  fill="#08080a"
                  stroke={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  className="transition-all duration-300"
                  style={{ filter: `drop-shadow(0 0 12px ${isSelected ? node.glow : 'transparent'})` }}
                />

                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? '6' : '4'}
                  fill="#ffffff"
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
        </svg>

        {/* Overlay Node Cards */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
          style={{ left: `${(MASTER_NODE.x / 800) * 100}%`, top: `${(MASTER_NODE.y / 400) * 100}%` }}
        >
          <div className="mt-12 bg-zinc-900/90 border border-white/[0.16] rounded-xl px-3 py-1.5 text-center backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-center gap-1.5 font-mono text-xs font-bold text-white">
              <Cpu className="w-3.5 h-3.5 text-white" />
              {MASTER_NODE.title}
            </div>
            <div className="text-[10px] text-zinc-400">{MASTER_NODE.sub}</div>
          </div>
        </div>

        {NODES.map((node) => {
          const isSelected = activeNode === node.id;
          const Icon = node.icon;
          return (
            <motion.div
              key={`card-${node.id}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: `${(node.x / 800) * 100}%`,
                top: `${(node.y / 400) * 100}%`,
              }}
              onClick={() => setActiveNode(node.id)}
              whileHover={{ scale: 1.05 }}
            >
              <div
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all backdrop-blur-md ${
                  isSelected
                    ? 'bg-zinc-900/90 border-white/40 text-white shadow-xl'
                    : 'bg-zinc-900/60 border-white/[0.08] text-zinc-400 hover:border-white/20 hover:text-white'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/10"
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-medium leading-tight">{node.title}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">{node.metric}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

