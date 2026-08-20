'use client';

import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Zap,
  Cpu,
  Shield,
  Terminal,
  ArrowRight,
  X,
  Check,
  Play,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { DEMO_AGENTS, DemoAgent } from './demoAgents';
import { DemoTheme } from './demoThemes';

interface DemoAgentLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: DemoTheme;
  activePaneId: number;
  paneCount: number;
  onDeployAgent: (agent: DemoAgent, targetPaneId: number, model: string, prompt?: string) => void;
}

export function DemoAgentLauncherModal({
  isOpen,
  onClose,
  currentTheme,
  activePaneId,
  paneCount,
  onDeployAgent,
}: DemoAgentLauncherModalProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<DemoAgent['id']>('claude');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'cloud' | 'local' | 'hybrid'>('all');
  const [selectedPane, setSelectedPane] = useState<number>(activePaneId || 1);
  const [selectedModel, setSelectedModel] = useState<string>('claude-3-7-sonnet');
  const [starterPrompt, setStarterPrompt] = useState<string>('');
  const [selectedFlags, setSelectedFlags] = useState<string[]>(['--auto-commit']);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAgent = DEMO_AGENTS.find((a) => a.id === selectedAgentId) || DEMO_AGENTS[0];

  const filteredAgents = DEMO_AGENTS.filter(
    (a) => categoryFilter === 'all' || a.category === categoryFilter
  );

  const handleSelectAgent = (agent: DemoAgent) => {
    setSelectedAgentId(agent.id);
    setSelectedModel(agent.defaultModel);
  };

  const handleToggleFlag = (flag: string) => {
    if (selectedFlags.includes(flag)) {
      setSelectedFlags(selectedFlags.filter((f) => f !== flag));
    } else {
      setSelectedFlags([...selectedFlags, flag]);
    }
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      onDeployAgent(currentAgent, selectedPane, selectedModel, starterPrompt);
      setIsDeploying(false);
      onClose();
    }, 350);
  };

  const renderIcon = (type: DemoAgent['iconType']) => {
    switch (type) {
      case 'bot':
        return <Bot className="w-4 h-4" />;
      case 'sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'zap':
        return <Zap className="w-4 h-4" />;
      case 'cpu':
        return <Cpu className="w-4 h-4" />;
      case 'shield':
        return <Shield className="w-4 h-4" />;
      case 'terminal':
      default:
        return <Terminal className="w-4 h-4" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-agent-launcher-title"
      className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in select-none font-sans"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92%] rounded-[12px] border border-[#4a4b50] bg-[#090a0c] shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#4a4b50] bg-[#111111] px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#090a0c] border border-[#4a4b50] text-[#5683da]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="demo-agent-launcher-title" className="text-sm font-bold text-white tracking-tight">
                  AI Agent & CLI Launcher
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#090a0c] border border-[#4a4b50] text-[10px] font-mono text-[#5683da]">
                  Autonomous Fleet
                </span>
              </div>
              <p className="text-[11px] text-[#a9a9aa]">
                Deploy Claude Code, Codex, Antigravity, Aider, Ollama & DeepSeek to live terminal panes
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="hidden sm:flex items-center gap-1 bg-[#090a0c] p-1 rounded-lg border border-[#4a4b50]">
            {(['all', 'cloud', 'local', 'hybrid'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono capitalize transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#5683da] text-white font-semibold'
                    : 'text-[#a9a9aa] hover:text-white hover:bg-[#111111]'
                }`}
              >
                {cat === 'all' ? 'All Agents' : cat}
              </button>
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close launcher modal"
            className="p-1.5 rounded-lg hover:bg-[#111111] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-mono custom-scrollbar">
          {/* Agent Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAgents.map((agent) => {
              const isSelected = selectedAgentId === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#111111] border-[#5683da] ring-1 ring-[#5683da] shadow-[0_0_15px_rgba(86,131,218,0.2)]'
                      : 'bg-[#0e0e10] border-[#4a4b50] hover:border-[#6b6c6d] hover:bg-[#111111]/80'
                  }`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg border ${
                            isSelected
                              ? 'bg-[#5683da]/20 border-[#5683da] text-[#5683da]'
                              : 'bg-[#111111] border-[#4a4b50] text-[#a9a9aa]'
                          }`}
                        >
                          {renderIcon(agent.iconType)}
                        </div>
                        <div>
                          <div className="font-sans font-bold text-white text-xs leading-tight">
                            {agent.name}
                          </div>
                          <div className="text-[10px] text-[#6b6c6d] font-mono">
                            {agent.provider}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5683da] text-white">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-[#a9a9aa] font-sans leading-relaxed mb-3">
                      {agent.description}
                    </p>
                  </div>

                  {/* Bottom Model & CLI */}
                  <div className="pt-2 border-t border-[#4a4b50]/60 flex items-center justify-between text-[10px]">
                    <span className="text-[#6b6c6d] truncate mr-2">$ {agent.command.split(' ')[0]}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#111111] border border-[#4a4b50] text-[#5683da] font-mono font-medium">
                      {agent.defaultModel.split('-')[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Configuration Parameters Panel */}
          <div className="p-4 rounded-xl bg-[#111111] border border-[#4a4b50] space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-sans font-semibold text-white text-xs">
                <Zap className="w-3.5 h-3.5 text-[#5683da]" />
                <span>Launch Configuration: {currentAgent.name}</span>
              </div>

              {/* Target Pane Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#a9a9aa] uppercase font-mono">Target Pane:</span>
                <div className="flex items-center gap-1 bg-[#090a0c] p-0.5 rounded-lg border border-[#4a4b50]">
                  {Array.from({ length: Math.min(paneCount, 4) }, (_, i) => i + 1).map((pId) => (
                    <button
                      key={pId}
                      onClick={() => setSelectedPane(pId)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                        selectedPane === pId
                          ? 'bg-[#5683da] text-white font-bold'
                          : 'text-[#a9a9aa] hover:text-white'
                      }`}
                    >
                      #0{pId}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Model & Flags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-[#a9a9aa] uppercase font-mono">Inference Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#090a0c] border border-[#4a4b50] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#5683da]"
                >
                  {currentAgent.supportedModels.map((m) => (
                    <option key={m} value={m} className="bg-[#090a0c] text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#a9a9aa] uppercase font-mono">CLI Options</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['--auto-commit', '--verbose', '--air-gapped', '--mcp'].map((flag) => {
                    const active = selectedFlags.includes(flag);
                    return (
                      <button
                        key={flag}
                        type="button"
                        onClick={() => handleToggleFlag(flag)}
                        className={`px-2 py-1 rounded-md text-[10px] font-mono border transition-all cursor-pointer ${
                          active
                            ? 'bg-[#5683da]/20 border-[#5683da] text-[#5683da]'
                            : 'bg-[#090a0c] border-[#4a4b50] text-[#a9a9aa] hover:text-white'
                        }`}
                      >
                        {flag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Starter Prompt Input */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#a9a9aa] uppercase font-mono">
                Initial Prompt / Objective (Optional)
              </label>
              <input
                type="text"
                value={starterPrompt}
                onChange={(e) => setStarterPrompt(e.target.value)}
                placeholder="e.g. Inspect auth middleware, refactor async validation, and verify tests."
                className="w-full bg-[#090a0c] border border-[#4a4b50] rounded-lg px-3 py-2 text-xs text-white placeholder-[#6b6c6d] font-sans focus:outline-none focus:border-[#5683da]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#4a4b50] bg-[#111111] px-5 py-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-[#a9a9aa]">
            <span className="h-2 w-2 rounded-full bg-[#27c93f]" />
            <span>Targeting Pane #0{selectedPane} · Ready to stream</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full border border-[#4a4b50] bg-[#090a0c] text-xs text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="flex items-center gap-2 px-5 py-1.5 rounded-full bg-[#5683da] hover:bg-[#456ec2] text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <span>{isDeploying ? 'Deploying...' : `Deploy to Pane #0${selectedPane}`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
