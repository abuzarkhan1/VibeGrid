'use client';

import React, { useState, KeyboardEvent } from 'react';
import { Terminal, Send, CornerDownLeft, Sparkles } from 'lucide-react';
import { AgentPaneId } from './simulation-types';
import { PRESET_COMMAND_PILLS, PANE_CONFIGS } from './simulation-data';

interface CommandExecutorBarProps {
  onExecute: (cmd: string) => void;
  activePaneId: AgentPaneId;
}

export function CommandExecutorBar({ onExecute, activePaneId }: CommandExecutorBarProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const handleSubmit = (cmdToRun?: string) => {
    const cmd = (cmdToRun !== undefined ? cmdToRun : inputValue).trim();
    if (!cmd) return;

    setIsExecuting(true);
    onExecute(cmd);
    setInputValue('');

    setTimeout(() => {
      setIsExecuting(false);
    }, 300);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const activePaneConfig = PANE_CONFIGS[activePaneId];

  return (
    <div className="rounded-[10px] bg-[#090a0c] border border-[#4a4b50] p-3 space-y-2.5">
      {/* Quick Suggestion Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
        <span className="text-[#6b6c6d] text-[11px] shrink-0 mr-1 flex items-center gap-1">
          <Sparkles size={11} className="text-[#5683da]" />
          Quick Exec:
        </span>
        {PRESET_COMMAND_PILLS.map((pill) => (
          <button
            key={pill.cmd}
            onClick={() => handleSubmit(pill.cmd)}
            className="shrink-0 px-2.5 py-1 rounded-[5px] bg-[#111111] hover:bg-[#1f2024] text-[#a9a9aa] hover:text-white border border-[#4a4b50]/60 transition-colors text-[11px] flex items-center gap-1.5 cursor-pointer"
          >
            <span className="text-[#5683da] font-bold">$</span>
            <span>{pill.label}</span>
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="flex items-center gap-2 bg-[#111111] rounded-[8px] border border-[#4a4b50] px-3 py-2 text-xs font-mono shadow-inner focus-within:border-[#5683da] focus-within:ring-1 focus-within:ring-[#5683da] transition-all">
        {/* Active Target Breadcrumb Pill */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50]/60 text-[10px] text-[#e5e5e7] shrink-0">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: activePaneConfig.accentColor }}
          />
          <span>{activePaneConfig.title.split(':')[1] || activePaneConfig.title}</span>
        </div>

        <span className="text-[#5683da] font-bold select-none">$</span>

        {/* Text Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command (e.g. cargo test, git diff, claude --fix, ollama run)..."
          className="flex-1 bg-transparent text-white placeholder-[#6b6c6d] focus:outline-none font-mono text-xs"
        />

        {/* Submit Action Button */}
        <button
          onClick={() => handleSubmit()}
          disabled={!inputValue.trim() || isExecuting}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-[5px] font-mono text-xs font-medium transition-all cursor-pointer ${
            inputValue.trim()
              ? 'bg-[#5683da] text-white hover:bg-[#456ec2]'
              : 'bg-[#1a1b1e] text-[#6b6c6d] cursor-not-allowed'
          }`}
        >
          <span>Run</span>
          <CornerDownLeft size={12} />
        </button>
      </div>
    </div>
  );
}
