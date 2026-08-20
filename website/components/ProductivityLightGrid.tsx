'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Zap,
  Check,
  CornerDownLeft,
  Sliders,
} from 'lucide-react';

interface CommandItem {
  key: string;
  title: string;
  category: 'Global' | 'Studio' | 'Layout' | 'Swarm' | 'Kernel';
  shortcut: string;
  pid: string;
  desc: string;
}

const COMMAND_LIST: CommandItem[] = [
  {
    key: 'cmd-k',
    title: 'Focus Command Dispatcher',
    category: 'Global',
    shortcut: '⌘K',
    pid: '01',
    desc: 'Instant fuzzy dispatcher with IPC kernel hot-reload',
  },
  {
    key: 'cmd-shift-p',
    title: 'Open Theme & Font Studio',
    category: 'Studio',
    shortcut: '⌘⇧P',
    pid: '02',
    desc: 'Direct GPU typography & solid palette customizer',
  },
  {
    key: 'cmd-d',
    title: 'Split Terminal Pane Right',
    category: 'Layout',
    shortcut: '⌘D',
    pid: '03',
    desc: 'Fork active PTY session into synchronous right split',
  },
  {
    key: 'cmd-shift-n',
    title: 'Spawn New Swarm Hive',
    category: 'Swarm',
    shortcut: '⌘⇧N',
    pid: '04',
    desc: 'Initialize autonomous multi-agent swarm matrix coordinator',
  },
  {
    key: 'cmd-j',
    title: 'Toggle Rust PTY Kernel Core',
    category: 'Kernel',
    shortcut: '⌘J',
    pid: '05',
    desc: 'Direct POSIX ioctl mode with 0 context switch overhead',
  },
  {
    key: 'opt-b',
    title: 'Flush Backpressure Buffer',
    category: 'Kernel',
    shortcut: '⌥B',
    pid: '06',
    desc: 'Force immediate 16.6ms batch drain without UI stall',
  },
];

export function ProductivityLightGrid() {
  /* =========================================================================
   * CARD 1 STATE: Fuzzy Command Palette & Shortcuts
   * ========================================================================= */
  const [activeShortcut, setActiveShortcut] = useState('cmd-k');
  const [paletteQuery, setPaletteQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [executionLog, setExecutionLog] = useState<{
    key: string;
    title: string;
    latency: string;
    pid: string;
    timestamp: string;
  }>({
    key: 'cmd-k',
    title: 'Focus Command Dispatcher',
    latency: '0.82ms',
    pid: '01',
    timestamp: '20:29:40.104',
  });

  const categories = ['ALL', 'GLOBAL', 'STUDIO', 'LAYOUT', 'SWARM', 'KERNEL'];

  const filteredCommands = useMemo(() => {
    return COMMAND_LIST.filter((cmd) => {
      const matchesQuery =
        cmd.title.toLowerCase().includes(paletteQuery.toLowerCase()) ||
        cmd.shortcut.toLowerCase().includes(paletteQuery.toLowerCase()) ||
        cmd.desc.toLowerCase().includes(paletteQuery.toLowerCase());
      const matchesCat =
        selectedCategory === 'ALL' ||
        cmd.category.toUpperCase() === selectedCategory;
      return matchesQuery && matchesCat;
    });
  }, [paletteQuery, selectedCategory]);

  const handleExecuteCommand = (cmd: CommandItem) => {
    setActiveShortcut(cmd.key);
    const simulatedLatency = (0.4 + Math.random() * 0.7).toFixed(2);
    const now = new Date();
    const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    setExecutionLog({
      key: cmd.key,
      title: cmd.title,
      latency: `${simulatedLatency}ms`,
      pid: cmd.pid,
      timestamp: timeStr,
    });
  };

  /* =========================================================================
   * CARD 2 STATE: Visual Layout Studio
   * ========================================================================= */
  const [activeLayout, setActiveLayout] = useState<'2x2' | 'hero' | '3x3' | 'matrix'>('2x2');
  const [focusedPane, setFocusedPane] = useState<string>('pane_01');

  const layoutStats = {
    '2x2': { name: '2x2 Quad Hive', panes: 4, memory: '24.2 MB', role: 'Balanced 4-Agent Cluster' },
    hero: { name: '1+3 Hero Studio', panes: 4, memory: '38.6 MB', role: 'Master Agent + 3 Aux Watchers' },
    '3x3': { name: '3x3 Swarm Grid', panes: 9, memory: '52.1 MB', role: 'High-Concurrency Micro-Workers' },
    matrix: { name: '4x4 Matrix Telemetry', panes: 16, memory: '78.4 MB', role: 'High-Density System Fleet' },
  };

  /* =========================================================================
   * CARD 3 STATE: Hardware-Level Rust PTY Engine
   * ========================================================================= */
  const [ptyMode, setPtyMode] = useState<'native' | 'legacy'>('native');
  const [burstCount, setBurstCount] = useState(1);
  const [burstLogs, setBurstLogs] = useState<
    Array<{ id: number; text: string; time: string; pass: boolean }>
  >([
    {
      id: 1,
      text: 'Parsed 10,000 ANSI escape sequences in 3.18ms • 0 frame drops',
      time: '0.0ms',
      pass: true,
    },
  ]);

  const handleTriggerBurst = () => {
    const nextCount = burstCount + 1;
    setBurstCount(nextCount);
    const isNative = ptyMode === 'native';
    const latency = isNative
      ? (3.1 + Math.random() * 0.3).toFixed(2)
      : (46.8 + Math.random() * 5.2).toFixed(2);
    const dropped = isNative ? '0 frame drops (60.0 FPS locked)' : '18 dropped frames (UI hiccup)';
    const newLog = {
      id: nextCount,
      text: `Burst #${nextCount}: 10,000 ANSI escape codes in ${latency}ms • ${dropped}`,
      time: `+${(nextCount * 14).toFixed(0)}ms`,
      pass: isNative,
    };
    setBurstLogs((prev) => [newLog, ...prev.slice(0, 2)]);
  };

  /* =========================================================================
   * CARD 4 STATE: Smart Backpressure & Batch Buffer
   * ========================================================================= */
  const [streamSpeed, setStreamSpeed] = useState(25); // MB/s

  const bufferFillPct = Math.min(100, Math.round((streamSpeed / 50) * 82) + 8);
  const allocatedMemMb = ((streamSpeed / 50) * 10.4 + 1.2).toFixed(1);
  const linesPerSec = (streamSpeed * 14.8).toFixed(1);

  return (
    <section
      id="productivity"
      className="relative bg-[#f6f6f6] text-[#090a0c] py-24 sm:py-32 border-t border-[#e5e5e7] overflow-hidden"
    >
      {/* Clean Solid Vector Background Grid (Zero Gradients) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="productivity-solid-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#000000"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#productivity-solid-grid)" />
      </svg>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-18">
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#050506] leading-[1.08]">
            Unmatched Multi-Agent{' '}
            <span className="font-serif italic font-normal text-[#303236]">Productivity.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#6b6c6d] font-normal leading-relaxed">
            Four specialized subsystems engineered to eliminate friction between human intent, autonomous AI agents, and kernel processes.
          </p>
        </div>

        {/* 2x2 Asymmetric Feature Grid (Zero Gradients, Crisp Solid Colors) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* =========================================================================
           * CARD 1: Keyboard Shortcuts & Fuzzy Command Palette (7 Cols)
           * ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-[12px] bg-[#111111] text-white p-6 sm:p-8 border border-[#4a4b50] relative shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                Fuzzy Command Palette & Shortcuts
              </h3>
              <p className="text-sm text-[#a9a9aa] leading-relaxed mb-6">
                Zero mouse dependency. Instant fuzzy search indexing all workspaces, active terminals, agent swarms, and custom themes.
              </p>
            </div>

            {/* Interactive Palette Container */}
            <div className="rounded-[8px] bg-[#090a0c] border border-[#4a4b50] p-4 font-mono text-xs shadow-inner">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 pb-3 mb-3 border-b border-[#4a4b50]/50 overflow-x-auto">
                <span className="text-[10px] text-[#6b6c6d] uppercase font-bold mr-1 tracking-wider">
                  FILTER:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold transition-colors cursor-pointer border ${
                      selectedCategory === cat
                        ? 'bg-[#5683da] text-white border-[#5683da]'
                        : 'bg-[#16171b] text-[#a9a9aa] border-[#4a4b50]/60 hover:text-white hover:border-[#4a4b50]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar Input */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded bg-[#16171b] border border-[#4a4b50] text-[#a9a9aa] mb-3">
                <Search size={14} className="text-[#5683da] shrink-0" />
                <input
                  type="text"
                  placeholder="Type a command or shortcut (e.g. split, font, swarm)..."
                  value={paletteQuery}
                  onChange={(e) => setPaletteQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredCommands.length > 0) {
                      const target =
                        filteredCommands.find((c) => c.key === activeShortcut) ||
                        filteredCommands[0];
                      handleExecuteCommand(target);
                    }
                  }}
                  className="bg-transparent border-none outline-none text-white w-full placeholder-[#6b6c6d] text-xs font-mono"
                />
                <span className="px-1.5 py-0.5 rounded bg-[#232428] border border-[#4a4b50] text-[10px] text-[#a9a9aa] shrink-0">
                  {filteredCommands.length} MATCHES
                </span>
                {paletteQuery && (
                  <button
                    onClick={() => setPaletteQuery('')}
                    className="text-[#a9a9aa] hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filtered Command List */}
              <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                {filteredCommands.length === 0 ? (
                  <div className="py-6 text-center text-[#6b6c6d] text-xs">
                    No matching commands found for &quot;{paletteQuery}&quot;
                  </div>
                ) : (
                  filteredCommands.map((cmd) => {
                    const isSelected = activeShortcut === cmd.key;
                    return (
                      <div
                        key={cmd.key}
                        onClick={() => handleExecuteCommand(cmd)}
                        className={`flex items-center justify-between px-3 py-2 rounded-[6px] cursor-pointer transition-colors border ${
                          isSelected
                            ? 'bg-[#1a202c] border-[#5683da] text-white'
                            : 'bg-[#111111] hover:bg-[#16171b] text-[#a9a9aa] border-[#303236]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isSelected ? 'bg-[#5683da]' : 'bg-[#4a4b50]'
                            }`}
                          />
                          <div className="truncate">
                            <span className="font-medium text-[12px] text-white block">
                              {cmd.title}
                            </span>
                            <span className="text-[10px] text-[#6b6c6d] truncate block">
                              {cmd.desc}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1c1d22] border border-[#4a4b50]/60 text-[#a9a9aa] uppercase font-bold">
                            {cmd.category}
                          </span>
                          <kbd className="px-2 py-0.5 rounded bg-[#232428] border border-[#4a4b50] text-white text-[11px] font-mono font-bold shadow-sm">
                            {cmd.shortcut}
                          </kbd>
                          {isSelected && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-[#5683da] font-bold">
                              <CornerDownLeft size={11} />
                              RUN
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Instant Action Execution Feedback HUD */}
              <div className="mt-3 pt-3 border-t border-[#4a4b50]/50 flex items-center justify-between gap-2 text-[11px] text-[#a9a9aa]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-black shrink-0 font-bold text-[9px]">
                    <Check size={10} />
                  </span>
                  <span className="truncate">
                    <strong className="text-white font-bold">EXEC:</strong> &quot;{executionLog.title}&quot; in{' '}
                    <span className="text-emerald-400 font-bold">{executionLog.latency}</span>{' '}
                    (IPC #pty-{executionLog.pid})
                  </span>
                </div>
                <span className="text-[10px] text-[#6b6c6d] shrink-0 font-mono">
                  {executionLog.timestamp}
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================================
           * CARD 2: Visual Layout Studio & Dynamic Split Canvas (5 Cols)
           * ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-[12px] bg-[#111111] text-white p-6 sm:p-8 border border-[#4a4b50] relative shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                Visual Layout Studio
              </h3>
              <p className="text-sm text-[#a9a9aa] leading-relaxed mb-6">
                Seamless drag-and-drop terminal tiling. Split horizontally, vertically, or into autonomous quad agent hives with 1-click presets.
              </p>
            </div>

            {/* Interactive Layout Switcher Container */}
            <div className="rounded-[8px] bg-[#090a0c] border border-[#4a4b50] p-4 font-mono text-xs">
              {/* 4 Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5 mb-3 p-1 bg-[#16171b] rounded border border-[#4a4b50]">
                {(
                  [
                    { key: '2x2', label: '2x2 Quad' },
                    { key: 'hero', label: '1+3 Hero' },
                    { key: '3x3', label: '3x3 Swarm' },
                    { key: 'matrix', label: '4x4 Matrix' },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => {
                      setActiveLayout(preset.key);
                      setFocusedPane(
                        preset.key === 'hero'
                          ? 'pane_hero'
                          : preset.key === 'matrix'
                          ? 'cell_0_0'
                          : 'pane_01'
                      );
                    }}
                    className={`py-1.5 px-1 text-[10px] font-mono uppercase font-bold rounded transition-colors text-center cursor-pointer ${
                      activeLayout === preset.key
                        ? 'bg-[#ff8964] text-black font-extrabold shadow-sm'
                        : 'text-[#a9a9aa] hover:text-white bg-transparent'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Split-Canvas Canvas Mockup */}
              <div className="h-44 w-full rounded border border-[#4a4b50] p-2 bg-[#111111]">
                {/* PRESET 1: 2x2 Quad */}
                {activeLayout === '2x2' && (
                  <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
                    {[
                      { id: 'pane_01', name: 'Agent 01: Claude Code', cmd: '$ claude-code --watch' },
                      { id: 'pane_02', name: 'Agent 02: Aider Hive', cmd: '$ aider --model r1' },
                      { id: 'pane_03', name: 'Agent 03: Rust Engine', cmd: '$ cargo check --release' },
                      { id: 'pane_04', name: 'Agent 04: Log Tail', cmd: '$ tail -f telemetry.log' },
                    ].map((p) => {
                      const isFocused = focusedPane === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setFocusedPane(p.id)}
                          className={`rounded p-2 flex flex-col justify-between cursor-pointer transition-colors border ${
                            isFocused
                              ? 'bg-[#1a1c23] border-[#ff8964]'
                              : 'bg-[#090a0c] border-[#303236] hover:border-[#4a4b50]'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[9px] font-mono">
                            <span
                              className={`font-bold ${
                                isFocused ? 'text-[#ff8964]' : 'text-[#a9a9aa]'
                              }`}
                            >
                              {p.name}
                            </span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isFocused ? 'bg-[#ff8964]' : 'bg-emerald-400'
                              }`}
                            />
                          </div>
                          <div className="text-[10px] font-mono text-[#6b6c6d] truncate">
                            {p.cmd}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* PRESET 2: 1+3 Hero Studio */}
                {activeLayout === 'hero' && (
                  <div className="grid grid-cols-3 gap-2 h-full">
                    <div
                      onClick={() => setFocusedPane('pane_hero')}
                      className={`col-span-2 rounded p-2.5 flex flex-col justify-between cursor-pointer border ${
                        focusedPane === 'pane_hero'
                          ? 'bg-[#1a1c23] border-[#ff8964]'
                          : 'bg-[#090a0c] border-[#303236] hover:border-[#4a4b50]'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-[#ff8964] font-bold">
                          ★ PRIMARY HERO (CLAUDE CODE 3.7)
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[#ff8964] text-black font-extrabold text-[8px]">
                          MASTER
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-[#a9a9aa]">
                        $ claude-code --autonomous --stream-pty
                      </div>
                      <div className="flex justify-between text-[9px] text-[#6b6c6d]">
                        <span>Tokens: 142.8k</span>
                        <span className="text-emerald-400 font-bold">ACTIVE STREAM</span>
                      </div>
                    </div>

                    <div className="grid grid-rows-3 gap-1.5">
                      {[
                        { id: 'pane_aux1', label: 'diff-watcher', status: '+142 -18' },
                        { id: 'pane_aux2', label: 'test-runner', status: 'PASS (42/42)' },
                        { id: 'pane_aux3', label: 'pty-telemetry', status: '3.2ms latency' },
                      ].map((aux) => {
                        const isFocused = focusedPane === aux.id;
                        return (
                          <div
                            key={aux.id}
                            onClick={() => setFocusedPane(aux.id)}
                            className={`rounded p-1.5 flex items-center justify-between text-[9px] font-mono cursor-pointer border ${
                              isFocused
                                ? 'bg-[#1a1c23] border-[#ff8964] text-white'
                                : 'bg-[#090a0c] border-[#303236] text-[#a9a9aa] hover:border-[#4a4b50]'
                            }`}
                          >
                            <span className="truncate">{aux.label}</span>
                            <span className="text-[8px] text-emerald-400 font-bold">
                              {aux.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PRESET 3: 3x3 Swarm Grid */}
                {activeLayout === '3x3' && (
                  <div className="grid grid-cols-3 grid-rows-3 gap-1.5 h-full">
                    {[
                      'Analyzer',
                      'Linter',
                      'TypeCheck',
                      'DocGen',
                      'Profiler',
                      'Security',
                      'UnitTests',
                      'Compiler',
                      'Deployer',
                    ].map((role, idx) => {
                      const paneId = `sw_${idx + 1}`;
                      const isFocused = focusedPane === paneId;
                      return (
                        <div
                          key={paneId}
                          onClick={() => setFocusedPane(paneId)}
                          className={`rounded p-1 flex items-center justify-between text-[9px] font-mono cursor-pointer border ${
                            isFocused
                              ? 'bg-[#1a1c23] border-[#ff8964] text-white'
                              : 'bg-[#090a0c] border-[#303236] text-[#a9a9aa] hover:border-[#4a4b50]'
                          }`}
                        >
                          <span className="truncate">w_{idx + 1}</span>
                          <span className="text-[7px] px-1 py-0.5 rounded bg-[#16171b] text-emerald-400 font-bold uppercase">
                            {role}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* PRESET 4: 4x4 Matrix */}
                {activeLayout === 'matrix' && (
                  <div className="grid grid-cols-4 grid-rows-4 gap-1 h-full">
                    {Array.from({ length: 16 }).map((_, idx) => {
                      const r = Math.floor(idx / 4);
                      const c = idx % 4;
                      const cellId = `cell_${r}_${c}`;
                      const isFocused = focusedPane === cellId;
                      return (
                        <div
                          key={cellId}
                          onClick={() => setFocusedPane(cellId)}
                          className={`rounded p-1 flex items-center justify-between text-[8px] font-mono cursor-pointer border ${
                            isFocused
                              ? 'bg-[#ff8964] text-black font-extrabold border-[#ff8964]'
                              : 'bg-[#090a0c] text-[#a9a9aa] border-[#303236] hover:border-[#4a4b50]'
                          }`}
                        >
                          <span>
                            [{r}:{c}]
                          </span>
                          <span
                            className={`w-1 h-1 rounded-full ${
                              isFocused ? 'bg-black' : 'bg-emerald-400'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Interactive Pane Focus Inspector HUD */}
              <div className="mt-3 pt-3 border-t border-[#4a4b50]/50 flex items-center justify-between text-[11px] text-[#a9a9aa]">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff8964]" />
                  <span className="truncate">
                    <strong className="text-white font-bold">FOCUS:</strong> {focusedPane} •{' '}
                    {layoutStats[activeLayout].role}
                  </span>
                </div>
                <span className="text-[10px] text-[#6b6c6d] shrink-0 font-mono">
                  {layoutStats[activeLayout].memory}
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================================
           * CARD 3: Real-Time Rust PTY Engine (5 Cols)
           * ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-[12px] bg-[#111111] text-white p-6 sm:p-8 border border-[#4a4b50] relative shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                Hardware-Level PTY Engine
              </h3>
              <p className="text-sm text-[#a9a9aa] leading-relaxed mb-6">
                Native OS pseudo-terminals managed directly in Rust with zero Electron middleware overhead and sub-millisecond input dispatch.
              </p>
            </div>

            {/* Interactive Latency Tester Container */}
            <div className="rounded-[8px] bg-[#090a0c] border border-[#4a4b50] p-4 font-mono text-xs">
              {/* Driver Switcher */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#4a4b50]/50">
                <span className="text-[#a9a9aa] text-[11px] font-bold">PTY Kernel Driver:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPtyMode('native')}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                      ptyMode === 'native'
                        ? 'bg-[#5683da] text-white border-[#5683da]'
                        : 'bg-[#16171b] text-[#a9a9aa] border-[#4a4b50] hover:text-white'
                    }`}
                  >
                    VibeGrid Rust (ioctl)
                  </button>
                  <button
                    onClick={() => setPtyMode('legacy')}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                      ptyMode === 'legacy'
                        ? 'bg-[#ff8964] text-black border-[#ff8964]'
                        : 'bg-[#16171b] text-[#a9a9aa] border-[#4a4b50] hover:text-white'
                    }`}
                  >
                    Legacy Electron
                  </button>
                </div>
              </div>

              {/* Latency Comparison Progress Bar */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6b6c6d]">Keystroke Dispatch Latency</span>
                  <span
                    className={`font-bold ${
                      ptyMode === 'native' ? 'text-emerald-400' : 'text-[#ff8964]'
                    }`}
                  >
                    {ptyMode === 'native' ? '3.2 ms (Sub-frame Direct)' : '48.0 ms (Event Loop Lag)'}
                  </span>
                </div>
                <div className="h-2 w-full bg-[#16171b] rounded-full overflow-hidden border border-[#4a4b50]">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      ptyMode === 'native' ? 'w-[7%] bg-[#5683da]' : 'w-[82%] bg-[#ff8964]'
                    }`}
                  />
                </div>
              </div>

              {/* Keystroke Jitter Meter & Ring Buffer Telemetry */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 rounded bg-[#16171b] border border-[#303236]">
                  <div className="text-[9px] text-[#6b6c6d] uppercase font-bold">Keystroke Jitter</div>
                  <div
                    className={`text-[12px] font-bold ${
                      ptyMode === 'native' ? 'text-emerald-400' : 'text-[#ff8964]'
                    }`}
                  >
                    {ptyMode === 'native' ? '±0.12 ms (Zero Jitter)' : '±14.80 ms (V8 GC Spike)'}
                  </div>
                </div>
                <div className="p-2 rounded bg-[#16171b] border border-[#303236]">
                  <div className="text-[9px] text-[#6b6c6d] uppercase font-bold">Context Switches</div>
                  <div className="text-[12px] font-bold text-white">
                    {ptyMode === 'native' ? '0 Userspace Bridges' : '18 Node IPC Hops'}
                  </div>
                </div>
              </div>

              {/* Interactive ANSI Burst Trigger */}
              <button
                onClick={handleTriggerBurst}
                className="w-full py-2.5 rounded bg-[#16171b] hover:bg-[#232428] border border-[#4a4b50] text-white text-[11px] font-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer mb-3"
              >
                <Zap size={13} className={ptyMode === 'native' ? 'text-[#5683da]' : 'text-[#ff8964]'} />
                Trigger 10,000 ANSI Sequence Burst (#{burstCount})
              </button>

              {/* Live Burst Terminal Output Stream */}
              <div className="p-2 rounded bg-[#111111] border border-[#303236] space-y-1 text-[10px]">
                {burstLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-[#a9a9aa]">
                    <span className="truncate pr-2">
                      <span className={log.pass ? 'text-emerald-400 font-bold' : 'text-[#ff8964] font-bold'}>
                        {log.pass ? '✓' : '⚠'}
                      </span>{' '}
                      {log.text}
                    </span>
                    <span className="text-[#6b6c6d] font-mono shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* =========================================================================
           * CARD 4: Smart Backpressure & Batch Buffer (7 Cols)
           * ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-[12px] bg-[#111111] text-white p-6 sm:p-8 border border-[#4a4b50] relative shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                Smart Backpressure & 16.6ms Batch Buffer
              </h3>
              <p className="text-sm text-[#a9a9aa] leading-relaxed mb-6">
                Prevent UI freezing during massive compiler outputs, AI swarm token streams, or multi-gigabyte logs with frame-synced chunk aggregation.
              </p>
            </div>

            {/* Interactive Backpressure Regulator Container */}
            <div className="rounded-[8px] bg-[#090a0c] border border-[#4a4b50] p-4 font-mono text-xs">
              {/* Slider Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sliders size={13} className="text-[#ff8964]" />
                  <span className="text-[#a9a9aa] font-bold">Simulated Influx Throughput:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#16171b] border border-[#4a4b50] text-[#ff8964] font-extrabold text-sm">
                    {streamSpeed} MB/s
                  </span>
                </div>
              </div>

              {/* Smooth Range Slider */}
              <div className="space-y-1 mb-3">
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={streamSpeed}
                  onChange={(e) => setStreamSpeed(Number(e.target.value))}
                  className="w-full accent-[#ff8964] cursor-pointer bg-[#16171b] h-2 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-[#6b6c6d]">
                  <span>5 MB/s (Low Influx)</span>
                  <span>25 MB/s (High Speed)</span>
                  <span>50 MB/s (Stress Load)</span>
                </div>
              </div>

              {/* Ring Buffer Fill Level Solid Meter */}
              <div className="p-2.5 rounded bg-[#16171b] border border-[#303236] mb-3 space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#a9a9aa]">
                    Ring Buffer Allocation ({allocatedMemMb} MB / 12.0 MB)
                  </span>
                  <span
                    className={`font-bold ${
                      bufferFillPct > 70 ? 'text-[#ff8964]' : 'text-[#5683da]'
                    }`}
                  >
                    {bufferFillPct}% Filled
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#111111] rounded-full overflow-hidden border border-[#4a4b50]/60">
                  <div
                    style={{ width: `${bufferFillPct}%` }}
                    className={`h-full transition-all duration-200 rounded-full ${
                      bufferFillPct > 70 ? 'bg-[#ff8964]' : 'bg-[#5683da]'
                    }`}
                  />
                </div>
              </div>

              {/* 4 Solid Telemetry Metrics Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#4a4b50]/50 text-center">
                <div className="p-2.5 rounded bg-[#16171b] border border-[#303236]">
                  <div className="text-[9px] text-[#6b6c6d] uppercase font-bold">FRAME LOCK</div>
                  <div className="text-white font-extrabold text-sm sm:text-base">60.0 FPS</div>
                  <div className="text-[8px] text-emerald-400 font-semibold">0ms V-Sync Lag</div>
                </div>
                <div className="p-2.5 rounded bg-[#16171b] border border-[#303236]">
                  <div className="text-[9px] text-[#6b6c6d] uppercase font-bold">BATCH WINDOW</div>
                  <div className="text-white font-extrabold text-sm sm:text-base">16.6 ms</div>
                  <div className="text-[8px] text-[#5683da] font-semibold">rAF Frame Sync</div>
                </div>
                <div className="p-2.5 rounded bg-[#16171b] border border-[#303236]">
                  <div className="text-[9px] text-[#6b6c6d] uppercase font-bold">DROPPED FRAMES</div>
                  <div className="text-emerald-400 font-extrabold text-sm sm:text-base">0.00%</div>
                  <div className="text-[8px] text-emerald-400 font-semibold">Zero UI Freeze</div>
                </div>
                <div className="p-2.5 rounded bg-[#16171b] border border-[#303236]">
                  <div className="text-[9px] text-[#6b6c6d] uppercase font-bold">DISPATCH RATE</div>
                  <div className="text-[#ff8964] font-extrabold text-sm sm:text-base">
                    {linesPerSec}k
                  </div>
                  <div className="text-[8px] text-[#a9a9aa] font-semibold">Lines / Second</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

