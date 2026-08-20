'use client';

import React, { useState, useEffect } from 'react';
import {
  Mic,
  Play,
  Check,
} from 'lucide-react';

export function MetaBrainCapabilitiesSection() {
  /* ─────────────────────────────────────────────────────────────
     NODE 1: WebGL 60 FPS GPU Engine State
     ───────────────────────────────────────────────────────────── */
  const [atlasTab, setAtlasTab] = useState<'atlas' | 'quads'>('atlas');
  const [selectedGlyph, setSelectedGlyph] = useState<{ char: string; hex: string; u: number; v: number }>({
    char: 'λ',
    hex: '0x03BB',
    u: 144,
    v: 96,
  });

  const glyphAtlas = [
    { char: 'A', hex: '0x0041', u: 0, v: 0 },
    { char: 'B', hex: '0x0042', u: 16, v: 0 },
    { char: 'C', hex: '0x0043', u: 32, v: 0 },
    { char: 'D', hex: '0x0044', u: 48, v: 0 },
    { char: '0', hex: '0x0030', u: 64, v: 0 },
    { char: '1', hex: '0x0031', u: 80, v: 0 },
    { char: '9', hex: '0x0039', u: 96, v: 0 },
    { char: 'λ', hex: '0x03BB', u: 144, v: 96 },
    { char: '⚡', hex: '0x26A1', u: 160, v: 96 },
    { char: '❯', hex: '0x276F', u: 176, v: 96 },
    { char: 'ƒ', hex: '0x0192', u: 192, v: 96 },
    { char: '⚙', hex: '0x2699', u: 208, v: 96 },
    { char: '⌘', hex: '0x2318', u: 224, v: 96 },
    { char: 'π', hex: '0x03C0', u: 240, v: 96 },
    { char: '█', hex: '0x2588', u: 256, v: 96 },
    { char: '░', hex: '0x2591', u: 272, v: 96 },
  ];

  /* ─────────────────────────────────────────────────────────────
     NODE 2: Whisper Voice-to-Terminal State
     ───────────────────────────────────────────────────────────── */
  const voicePresets = [
    {
      prompt: 'Split pane horizontally and run cargo test --workspace',
      exec: 'cargo test --workspace',
      latency: '38ms',
      confidence: '99.4%',
    },
    {
      prompt: 'Create 3-pane layout, tail kubernetes logs, and open vim',
      exec: 'kubectl logs -f pod/backend',
      latency: '42ms',
      confidence: '98.9%',
    },
    {
      prompt: 'Checkout feature/mcp-bridge and trigger cargo check',
      exec: 'git checkout feature/mcp-bridge && cargo check',
      latency: '34ms',
      confidence: '99.8%',
    },
  ];

  const [activeVoiceIndex, setActiveVoiceIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevelPhase, setAudioLevelPhase] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setAudioLevelPhase((prev) => (prev + 1) % 100);
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleTriggerVoice = (index?: number) => {
    const nextIdx = index !== undefined ? index : (activeVoiceIndex + 1) % voicePresets.length;
    setActiveVoiceIndex(nextIdx);
    setIsRecording(true);

    setTimeout(() => {
      setIsRecording(false);
    }, 1800);
  };

  /* ─────────────────────────────────────────────────────────────
     NODE 3: Retro CRT Shader State
     ───────────────────────────────────────────────────────────── */
  const [scanlines, setScanlines] = useState(true);
  const [phosphorColor, setPhosphorColor] = useState<'amber' | 'green' | 'blue'>('amber');

  const phosphorStyles = {
    amber: {
      text: 'text-[#ff8964]',
      border: 'border-[#ff8964]/40',
      bg: 'bg-[#ff8964]/10',
      caret: 'bg-[#ff8964]',
      name: 'P22-Amber (590nm)',
    },
    green: {
      text: 'text-[#10b981]',
      border: 'border-[#10b981]/40',
      bg: 'bg-[#10b981]/10',
      caret: 'bg-[#10b981]',
      name: 'P1-Green (525nm)',
    },
    blue: {
      text: 'text-[#5683da]',
      border: 'border-[#5683da]/40',
      bg: 'bg-[#5683da]/10',
      caret: 'bg-[#5683da]',
      name: 'P4-Cyan (465nm)',
    },
  };

  /* ─────────────────────────────────────────────────────────────
     NODE 4: Atomic SQLite Persistence State
     ───────────────────────────────────────────────────────────── */
  const [activePaneView, setActivePaneView] = useState<'pane_0' | 'pane_1' | 'pane_2'>('pane_0');
  const [schemaTab, setSchemaTab] = useState<'tree' | 'layout'>('tree');

  const paneDatabase = {
    pane_0: {
      id: 'pane_0',
      split: 'vertical',
      ratio: '0.50',
      cwd: '~/src/vibegrid/core',
      shell: 'zsh',
      pid: 49201,
      ptyFd: 12,
      scrollback: '12,480 lines',
    },
    pane_1: {
      id: 'pane_1',
      split: 'horizontal',
      ratio: '0.65',
      cwd: '~/src/vibegrid/ui',
      shell: 'fish',
      pid: 49208,
      ptyFd: 14,
      scrollback: '3,210 lines',
    },
    pane_2: {
      id: 'pane_2',
      split: 'horizontal',
      ratio: '0.35',
      cwd: '~/src/vibegrid/crates',
      shell: 'bash',
      pid: 49214,
      ptyFd: 17,
      scrollback: '45,800 lines',
    },
  };

  /* ─────────────────────────────────────────────────────────────
     NODE 5: MCP JSON-RPC Stdio Bridge State
     ───────────────────────────────────────────────────────────── */
  const [mcpMethod, setMcpMethod] = useState<'tools/list' | 'tools/call'>('tools/call');
  const [mcpStatus, setMcpStatus] = useState<'ready' | 'dispatching' | 'executed'>('ready');
  const [dispatchLatency, setDispatchLatency] = useState<number>(0.92);

  const handleDispatchMcp = () => {
    setMcpStatus('dispatching');
    setTimeout(() => {
      setDispatchLatency(Number((0.7 + Math.random() * 0.5).toFixed(2)));
      setMcpStatus('executed');
    }, 450);
  };

  const mcpPayloads = {
    'tools/list': {
      request: {
        jsonrpc: '2.0',
        id: 104,
        method: 'tools/list',
        params: {},
      },
      response: {
        jsonrpc: '2.0',
        id: 104,
        result: {
          tools: [
            {
              name: 'vibegrid_split_pane',
              description: 'Split an existing terminal pane vertically or horizontally',
            },
            {
              name: 'vibegrid_execute_cmd',
              description: 'Execute shell command in target pane PTY buffer',
            },
            {
              name: 'vibegrid_get_history',
              description: 'Read tail scrollback buffer up to 10,000 lines',
            },
          ],
        },
      },
    },
    'tools/call': {
      request: {
        jsonrpc: '2.0',
        id: 105,
        method: 'tools/call',
        params: {
          name: 'vibegrid_split_pane',
          arguments: {
            target_pane: 'pane_0',
            direction: 'vertical',
            ratio: 0.5,
          },
        },
      },
      response: {
        jsonrpc: '2.0',
        id: 105,
        result: {
          created_pane_id: 'pane_3',
          pty_fd: 19,
          status: 'ATTACHED',
          cwd: '~/src/vibegrid/core',
          latency_ms: dispatchLatency,
        },
      },
    },
  };

  return (
    <section
      id="powerhouse"
      className="relative bg-[#090a0c] py-24 sm:py-32 border-t border-[#4a4b50] text-white"
    >
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
            The Agnostic{' '}
            <span className="font-serif italic font-normal text-[#ff8964]">
              Terminal Powerhouse
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#a9a9aa] font-normal leading-relaxed">
            Built with Tauri 2, Rust, Tokio async runtime, and WebGL GPU rendering for peak developer ergonomics.
          </p>
        </div>

        {/* 5-Node Mosaic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {/* ─────────────────────────────────────────────────────────────
              NODE 1: WebGL 60 FPS GPU Rendering (6 Cols)
             ───────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 rounded-[12px] bg-[#111111] border border-[#4a4b50] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">WebGL 60 FPS GPU Engine</h3>
              <p className="text-sm text-[#a9a9aa] leading-relaxed mb-6">
                Hardware-accelerated glyph rasterization with zero dropped frames.
              </p>

              {/* Glyph Atlas & Telemetry Surface */}
              <div className="rounded-[8px] bg-[#090a0c] border border-[#4a4b50] p-4 font-mono text-xs mb-5">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#4a4b50] text-[11px]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAtlasTab('atlas')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        atlasTab === 'atlas'
                          ? 'bg-[#303236] text-white border border-[#4a4b50]'
                          : 'text-[#a9a9aa] hover:text-white'
                      }`}
                    >
                      Glyph Atlas
                    </button>
                    <button
                      onClick={() => setAtlasTab('quads')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        atlasTab === 'quads'
                          ? 'bg-[#303236] text-white border border-[#4a4b50]'
                          : 'text-[#a9a9aa] hover:text-white'
                      }`}
                    >
                      Quad Buffer
                    </button>
                  </div>
                </div>

                {atlasTab === 'atlas' ? (
                  <div>
                    <div className="grid grid-cols-8 gap-1 p-2 rounded bg-[#111111] border border-[#4a4b50] mb-3 text-center">
                      {glyphAtlas.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedGlyph(item)}
                          className={`h-7 flex items-center justify-center rounded text-xs transition-all cursor-pointer ${
                            selectedGlyph.char === item.char
                              ? 'bg-[#5683da] text-white font-bold border border-[#5683da]'
                              : 'bg-[#090a0c] text-[#a9a9aa] hover:bg-[#303236] hover:text-white border border-[#4a4b50]/60'
                          }`}
                          title={`Glyph: ${item.char} (${item.hex})`}
                        >
                          {item.char}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#a9a9aa] bg-[#111111] px-3 py-1.5 rounded border border-[#4a4b50]">
                      <span>
                        Selected: <strong className="text-white">{selectedGlyph.char}</strong> ({selectedGlyph.hex})
                      </span>
                      <span>
                        UV: <strong className="text-[#5683da]">[{selectedGlyph.u}, {selectedGlyph.v}]</strong> (16×32px)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded bg-[#111111] border border-[#4a4b50] text-[11px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#6b6c6d]">Instanced Quads:</span>
                      <span className="text-white font-semibold">1,920 visible cells</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b6c6d]">Vertex Pipeline:</span>
                      <span className="text-[#5683da] font-semibold">11,520 verts/frame</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b6c6d]">Subpixel AA:</span>
                      <span className="text-emerald-400 font-semibold">LCD-RGB Matrix</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Frame Rate Telemetry Bar */}
            <div className="rounded-[8px] bg-[#090a0c] border border-[#4a4b50] p-4 font-mono text-xs">
              <div className="flex items-center justify-between gap-4">
                {/* 60 FPS Solid Dial */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#111111] border-2 border-[#5683da] flex flex-col items-center justify-center text-center">
                    <span className="text-base font-bold text-white leading-none">60</span>
                    <span className="text-[8px] text-[#5683da] font-semibold">FPS</span>
                  </div>
                  <div className="text-[11px] text-[#a9a9aa] space-y-1">
                    <div>
                      Frame Time: <strong className="text-emerald-400">16.6ms</strong>
                    </div>
                    <div>
                      Draw Calls: <strong className="text-white">1 / frame</strong>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-[#6b6c6d]">WebGL GPU rendering</div>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              NODE 2: Whisper Voice-to-Terminal (6 Cols)
             ───────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 rounded-[12px] bg-[#111111] border border-[#4a4b50] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Whisper Voice-to-Terminal</h3>
              <p className="text-sm text-[#a9a9aa] leading-relaxed mb-6">
                Speak natural language commands directly to terminal panes. Real-time GGML quantization with zero audio data transmitted off-device.
              </p>

              {/* Natural Speech Presets */}
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {voicePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTriggerVoice(idx)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors whitespace-nowrap cursor-pointer ${
                      activeVoiceIndex === idx
                        ? 'bg-[#ff8964] text-black font-bold'
                        : 'bg-[#090a0c] text-[#a9a9aa] border border-[#4a4b50] hover:text-white'
                    }`}
                  >
                    Sample #{idx + 1}
                  </button>
                ))}
              </div>

              {/* Waveform & Speech Surface */}
              <div className="rounded-[8px] bg-[#090a0c] border border-[#4a4b50] p-4 font-mono text-xs mb-5">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#4a4b50] text-[11px]">
                  <span className="text-[#a9a9aa]">Model: ggml-tiny.en (39M params)</span>
                  <span className="text-[#ff8964] font-semibold">16kHz Mono PCM</span>
                </div>

                {/* Animated SVG Audio Waveform */}
                <div className="h-10 bg-[#111111] rounded border border-[#4a4b50] px-3 flex items-center justify-between gap-1 mb-3">
                  {[12, 24, 18, 32, 14, 28, 20, 36, 22, 30, 16, 26, 34, 18, 24, 12].map((baseHeight, i) => {
                    const dynamicHeight = isRecording
                      ? Math.max(6, (baseHeight * ((audioLevelPhase + i * 7) % 100)) / 45)
                      : baseHeight * 0.4;

                    return (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-75 ${
                          isRecording ? 'bg-[#ff8964]' : 'bg-[#4a4b50]'
                        }`}
                        style={{ height: `${dynamicHeight}px` }}
                      />
                    );
                  })}
                </div>

                <div className="text-[12px] text-white bg-[#111111] p-2.5 rounded border border-[#4a4b50] flex items-start gap-2">
                  <span className="text-[#ff8964] font-bold">❯</span>
                  <span className={isRecording ? 'text-[#ff8964] animate-pulse' : 'text-white'}>
                    &quot;{voicePresets[activeVoiceIndex].prompt}&quot;
                  </span>
                </div>
              </div>
            </div>

            {/* Voice Execution & Interactive Trigger */}
            <div className="rounded-[8px] bg-[#090a0c] border border-[#4a4b50] p-4 font-mono text-xs">
              <div className="flex items-center justify-between gap-3 mb-3">
                <button
                  onClick={() => handleTriggerVoice()}
                  disabled={isRecording}
                  className={`px-4 py-2 rounded text-xs font-sans font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-[#ff8964] text-black font-extrabold'
                      : 'bg-[#5683da] text-white hover:bg-[#4672c7]'
                  }`}
                >
                  <Mic size={14} />
                  <span>{isRecording ? 'Listening (16kHz)...' : 'Click to Speak Voice Prompt'}</span>
                </button>
                <span className="text-[10px] text-[#6b6c6d]">
                  Inference: <strong className="text-white">{voicePresets[activeVoiceIndex].latency}</strong>
                </span>
              </div>

              {/* Parsed Token Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#4a4b50] text-[10px]">
                <span className="px-2 py-0.5 rounded bg-[#303236] text-emerald-400 border border-[#4a4b50]">
                  Exec: {voicePresets[activeVoiceIndex].exec}
                </span>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              NODE 3: Retro CRT Shader Customizer (4 Cols)
             ───────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 rounded-[12px] bg-[#111111] border border-[#4a4b50] p-6 flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Retro CRT & Phosphor</h4>
              <p className="text-xs text-[#a9a9aa] leading-relaxed mb-4">
                Full-screen GLSL scanline rasterization, phosphor decay persistence, and curvature barrel distortion.
              </p>
            </div>

            {/* Visual Mini CRT Terminal Display */}
            <div
              className={`relative rounded-[8px] bg-[#090a0c] border ${phosphorStyles[phosphorColor].border} p-3 font-mono text-[11px] mb-4 overflow-hidden select-none`}
            >
              {/* Scanline Overlay */}
              {scanlines && (
                <div
                  className="pointer-events-none absolute inset-0 z-10 opacity-30"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, #000000 0px, #000000 1px, transparent 1px, transparent 2px)',
                  }}
                />
              )}

              <div className="relative z-0 space-y-1">
                <div className="text-[10px] text-[#6b6c6d] flex justify-between border-b border-[#4a4b50] pb-1 mb-2">
                  <span>GLSL CRT Pipeline</span>
                  <span className={phosphorStyles[phosphorColor].text}>
                    {phosphorStyles[phosphorColor].name}
                  </span>
                </div>
                <div className={phosphorStyles[phosphorColor].text}>
                  ❯ vibegrid --crt-mode
                </div>
                <div className="text-[#a9a9aa] text-[10px]">
                  [OK] V-Sync: 60Hz Raster
                </div>
                <div className="text-[#a9a9aa] text-[10px]">
                  [OK] Curvature: 2.4% Barrel
                </div>
                <div className="flex items-center gap-1">
                  <span className={phosphorStyles[phosphorColor].text}>❯ READY</span>
                  <span className={`w-1.5 h-3 ${phosphorStyles[phosphorColor].caret} animate-pulse`} />
                </div>
              </div>
            </div>

            {/* Interactive Shader Controls */}
            <div className="rounded-[6px] bg-[#090a0c] border border-[#4a4b50] p-3 font-mono text-[11px] space-y-2">
              <div className="flex justify-between items-center text-[#a9a9aa]">
                <span>Scanlines:</span>
                <button
                  onClick={() => setScanlines(!scanlines)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    scanlines
                      ? 'bg-emerald-500 text-black'
                      : 'bg-[#303236] text-[#a9a9aa] border border-[#4a4b50]'
                  }`}
                >
                  {scanlines ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="flex justify-between items-center text-[#a9a9aa]">
                <span>Phosphor:</span>
                <div className="flex gap-1">
                  {(['amber', 'green', 'blue'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setPhosphorColor(c)}
                      className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold cursor-pointer transition-colors ${
                        phosphorColor === c
                          ? 'bg-white text-black'
                          : 'bg-[#303236] text-[#a9a9aa] border border-[#4a4b50] hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              NODE 4: Atomic SQLite Persistence (4 Cols)
             ───────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 rounded-[12px] bg-[#111111] border border-[#4a4b50] p-6 flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Atomic State Persistence</h4>
              <p className="text-xs text-[#a9a9aa] leading-relaxed mb-4">
                Crash-proof session recovery via embedded SQLite in WAL mode. Layout splits, history buffers, and working directories recover instantaneously.
              </p>
            </div>

            {/* Live Workspace Schema Tree Inspector */}
            <div className="rounded-[8px] bg-[#090a0c] border border-[#4a4b50] p-3 font-mono text-[11px] mb-4">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#4a4b50] text-[10px]">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setSchemaTab('tree')}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      schemaTab === 'tree' ? 'bg-[#303236] text-white' : 'text-[#6b6c6d]'
                    }`}
                  >
                    Schema Tree
                  </button>
                  <button
                    onClick={() => setSchemaTab('layout')}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      schemaTab === 'layout' ? 'bg-[#303236] text-white' : 'text-[#6b6c6d]'
                    }`}
                  >
                    Split Visual
                  </button>
                </div>
                <span className="text-emerald-400 font-bold">WAL: 0-Lag</span>
              </div>

              {schemaTab === 'tree' ? (
                <div className="space-y-1 text-[10px]">
                  {(['pane_0', 'pane_1', 'pane_2'] as const).map((pKey) => {
                    const item = paneDatabase[pKey];
                    const isSelected = activePaneView === pKey;
                    return (
                      <button
                        key={pKey}
                        onClick={() => setActivePaneView(pKey)}
                        className={`w-full text-left p-1.5 rounded transition-colors block cursor-pointer ${
                          isSelected
                            ? 'bg-[#303236] text-white border border-[#4a4b50]'
                            : 'bg-[#111111] text-[#a9a9aa] hover:bg-[#18191c]'
                        }`}
                      >
                        <div className="flex justify-between font-semibold">
                          <span>
                            {item.id} ({item.shell})
                          </span>
                          <span className="text-[#5683da]">ratio: {item.ratio}</span>
                        </div>
                        <div className="text-[#6b6c6d] truncate">{item.cwd}</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Miniature Pane Split Representation */
                <div className="h-24 bg-[#111111] rounded border border-[#4a4b50] p-1 grid grid-cols-2 gap-1 text-[9px]">
                  <div className="bg-[#090a0c] border border-[#5683da] p-1.5 flex flex-col justify-between">
                    <span className="text-[#5683da] font-bold">pane_0 (50%)</span>
                    <span className="text-[#6b6c6d] text-[8px]">~/core</span>
                  </div>
                  <div className="grid grid-rows-2 gap-1">
                    <div className="bg-[#090a0c] border border-[#4a4b50] p-1 flex items-center justify-between">
                      <span className="text-white">pane_1 (65%)</span>
                      <span className="text-[#6b6c6d] text-[8px]">~/ui</span>
                    </div>
                    <div className="bg-[#090a0c] border border-[#4a4b50] p-1 flex items-center justify-between">
                      <span className="text-white">pane_2 (35%)</span>
                      <span className="text-[#6b6c6d] text-[8px]">~/crates</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cold Start Restore Metric Box */}
            <div className="rounded-[6px] bg-[#090a0c] border border-[#4a4b50] p-3 font-mono text-[11px] space-y-1">
              <div className="flex justify-between text-[#6b6c6d]">
                <span>Storage Engine:</span>
                <span className="text-white">Embedded SQLite WAL</span>
              </div>
              <div className="flex justify-between text-[#6b6c6d]">
                <span>Cold Start Restore:</span>
                <span className="text-emerald-400 font-bold">&lt; 0.8ms</span>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              NODE 5: MCP JSON-RPC Stdio Bridge (4 Cols)
             ───────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 rounded-[12px] bg-[#111111] border border-[#4a4b50] p-6 flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-bold text-white mb-1">MCP JSON-RPC Bridge</h4>
              <p className="text-xs text-[#a9a9aa] leading-relaxed mb-4">
                Standardized Model Context Protocol stdio server exposing active terminal panes and logs to external AI agents.
              </p>
            </div>

            {/* Interactive JSON-RPC 2.0 Packet Inspector */}
            <div className="rounded-[8px] bg-[#090a0c] border border-[#4a4b50] p-3 font-mono text-[11px] mb-4">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#4a4b50] text-[10px]">
                <div className="flex gap-1">
                  {(['tools/list', 'tools/call'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => {
                        setMcpMethod(method);
                        setMcpStatus('ready');
                      }}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                        mcpMethod === method
                          ? 'bg-[#5683da] text-white'
                          : 'bg-[#303236] text-[#a9a9aa] hover:text-white'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
                <span className="text-[#6b6c6d]">proto: 2.0</span>
              </div>

              {/* JSON Packet Preview */}
              <div className="bg-[#111111] p-2 rounded border border-[#4a4b50] text-[9.5px] leading-relaxed text-[#a9a9aa] h-28 overflow-y-auto">
                <div className="text-[#6b6c6d] mb-1">
                  // {mcpStatus === 'executed' ? 'Stdio Response Payload' : 'Stdio Request Packet'}
                </div>
                <pre className="text-white font-mono">
                  {JSON.stringify(
                    mcpStatus === 'executed'
                      ? mcpPayloads[mcpMethod].response
                      : mcpPayloads[mcpMethod].request,
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            {/* Interactive Dispatch Trigger */}
            <div className="rounded-[6px] bg-[#090a0c] border border-[#4a4b50] p-3 font-mono text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handleDispatchMcp}
                  disabled={mcpStatus === 'dispatching'}
                  className="px-3 py-1.5 rounded bg-[#5683da] text-white text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#4672c7] cursor-pointer transition-colors"
                >
                  {mcpStatus === 'executed' ? (
                    <Check size={12} className="text-white" />
                  ) : (
                    <Play size={12} className="text-white" />
                  )}
                  <span>
                    {mcpStatus === 'dispatching'
                      ? 'DISPATCHING...'
                      : mcpStatus === 'executed'
                      ? 'RE-DISPATCH RPC'
                      : 'DISPATCH RPC'}
                  </span>
                </button>
                <div className="text-right text-[10px]">
                  <span
                    className={`font-semibold ${
                      mcpStatus === 'executed' ? 'text-emerald-400' : 'text-[#a9a9aa]'
                    }`}
                  >
                    {mcpStatus === 'executed'
                      ? `200 OK (${dispatchLatency}ms)`
                      : 'stdio://ready'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
