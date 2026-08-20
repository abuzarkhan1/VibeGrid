'use client';

import React, { useRef, useEffect } from 'react';
import { AgentPaneConfig, SimulationLogLine } from './simulation-types';
import { Terminal, CheckCircle2, Zap, HardDrive, ShieldCheck, Activity } from 'lucide-react';

interface TerminalPaneViewProps {
  config: AgentPaneConfig;
  logs: SimulationLogLine[];
  currentStatus: string;
  isActive: boolean;
  onSelect: () => void;
  isFocusedMode?: boolean;
}

export function TerminalPaneView({
  config,
  logs,
  currentStatus,
  isActive,
  onSelect,
  isFocusedMode = false,
}: TerminalPaneViewProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new log entries smoothly
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      onClick={onSelect}
      className={`p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between select-text ${
        isFocusedMode ? 'min-h-[380px]' : 'min-h-[220px]'
      } ${
        isActive
          ? 'bg-[#111111] ring-1 ring-inset ring-[#5683da] shadow-inner'
          : 'bg-[#090a0c] hover:bg-[#111111]/70'
      }`}
    >
      <div>
        {/* Pane Header */}
        <div className="flex items-center justify-between mb-3 border-b border-[#4a4b50]/40 pb-2.5">
          <div className="text-[#e5e5e7] font-semibold flex items-center gap-2 font-mono text-xs truncate">
            <span
              className="font-bold shrink-0"
              style={{ color: config.accentColor }}
            >
              #0{config.paneNumber}
            </span>
            <span className="text-white font-medium truncate">{config.title}</span>
            <span className="text-[#6b6c6d] hidden sm:inline truncate">({config.cwd})</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2 py-0.5 rounded-full border text-[10px] font-mono tracking-wider uppercase ${config.badgeColor}`}
            >
              {config.badge}
            </span>
          </div>
        </div>

        {/* Pane Command Line */}
        <div className="text-[#6b6c6d] font-mono text-xs mb-3 flex items-center gap-2">
          <span className="text-[#5683da] font-bold">$</span>
          <span className="text-white font-medium bg-[#1a1b1e] px-2 py-0.5 rounded border border-[#4a4b50]/40 truncate">
            {config.cmd}
          </span>
          <span className="text-[10px] text-[#a9a9aa] ml-auto hidden md:inline font-mono">
            {config.telemetryMetric}: <strong className="text-white">{config.telemetryValue}</strong>
          </span>
        </div>

        {/* Live Output Stream */}
        <div
          ref={logContainerRef}
          className={`space-y-1 font-mono text-[11px] text-[#a9a9aa] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#4a4b50] scrollbar-track-transparent ${
            isFocusedMode ? 'max-h-[240px]' : 'max-h-[120px]'
          }`}
        >
          {logs.length === 0 ? (
            <div className="text-[#6b6c6d] italic py-2">Buffer cleared. Standing by...</div>
          ) : (
            logs.map((log) => {
              let textStyle = 'text-[#a9a9aa]';
              if (log.type === 'success') textStyle = 'text-[#e5e5e7] font-medium';
              if (log.type === 'warn') textStyle = 'text-[#ffbd2e]';
              if (log.type === 'error') textStyle = 'text-[#ff5f56]';
              if (log.type === 'accent') textStyle = 'text-[#5683da] font-medium';
              if (log.type === 'cmd') textStyle = 'text-white font-bold bg-[#1a1b1e] px-1 rounded';
              if (log.type === 'diff') textStyle = log.bullet === '+' ? 'text-[#27c93f]' : 'text-[#ff5f56]';

              return (
                <div
                  key={log.id}
                  className="leading-relaxed flex items-start gap-2 group hover:bg-[#1a1b1e]/50 px-1 rounded transition-colors"
                >
                  <span className={`${log.bulletColor} font-bold shrink-0 mt-0.5`}>
                    {log.bullet}
                  </span>
                  <span className={`break-all ${textStyle}`}>{log.text}</span>
                  <span className="text-[9px] text-[#4a4b50] ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                    {log.timestamp.split('.')[0]}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Active Status Caret */}
      <div className="mt-3 pt-2.5 border-t border-[#4a4b50]/50 flex items-center justify-between text-[11px] font-mono">
        <span className="text-[#e5e5e7] flex items-center gap-2 truncate">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0 animate-pulse"
            style={{ backgroundColor: config.accentColor }}
          />
          <span className="truncate text-[#a9a9aa]">{currentStatus}</span>
        </span>
        <span className="text-white font-bold ml-2 animate-pulse select-none">▌</span>
      </div>
    </div>
  );
}
