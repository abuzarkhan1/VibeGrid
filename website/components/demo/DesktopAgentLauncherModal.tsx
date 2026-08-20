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
  Users,
  RefreshCw,
  SlidersHorizontal,
  Key,
  DownloadCloud,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Globe,
  FileText,
  Code,
  Server,
} from 'lucide-react';
import {
  DEMO_AGENTS,
  HETEROGENEOUS_ROLE_PODS,
  DemoAgent,
  DemoRolePod,
} from './demoAgents';
import { DemoTheme } from './demoThemes';

interface DesktopAgentLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: DemoTheme;
  activePaneId?: number;
  paneCount?: number;
  onDeployAgent?: (
    agent: DemoAgent,
    targetPaneId: number,
    model: string,
    prompt?: string,
    cliArgs?: string[]
  ) => void;
  onDeployPod?: (pod: DemoRolePod) => void;
}

const DEFAULT_VAULT_KEYS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'DEEPSEEK_API_KEY',
  'GEMINI_API_KEY',
  'XAI_API_KEY',
  'MOONSHOT_API_KEY',
  'GITHUB_TOKEN',
  'OLLAMA_HOST',
];

const QUICK_FLAGS = [
  { flag: '--dangerously-skip-permissions', label: 'Skip Permissions' },
  { flag: '--auto-commits', label: 'Auto Git Commits' },
  { flag: '--yes', label: 'Auto-Confirm (-y)' },
  { flag: '--verbose', label: 'Verbose Debug' },
  { flag: '--mcp', label: 'Enable MCP' },
  { flag: '--air-gapped', label: '100% Air-Gapped' },
];

export function DesktopAgentLauncherModal({
  isOpen,
  onClose,
  activePaneId = 1,
  paneCount = 4,
  onDeployAgent,
  onDeployPod,
}: DesktopAgentLauncherModalProps) {
  const [activeTab, setActiveTab] = useState<'batch' | 'pods' | 'matrix' | 'vault'>('batch');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('claude-code');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPane, setSelectedPane] = useState<number>(activePaneId || 1);
  const [selectedModel, setSelectedModel] = useState<string>('claude-3-7-sonnet');
  const [selectedCliArgs, setSelectedCliArgs] = useState<string[]>(['--dangerously-skip-permissions']);
  const [starterPrompt, setStarterPrompt] = useState<string>('');
  const [autoStart, setAutoStart] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [copiedInstallId, setCopiedInstallId] = useState<string | null>(null);

  // Vault state
  const [vaultEnv, setVaultEnv] = useState<Record<string, string>>({
    ANTHROPIC_API_KEY: 'sk-ant-api03-••••••••••••••••',
    OPENAI_API_KEY: 'sk-proj-••••••••••••••••',
    DEEPSEEK_API_KEY: 'sk-deepseek-••••••••••••',
  });
  const [newVaultKey, setNewVaultKey] = useState<string>('');
  const [newVaultVal, setNewVaultVal] = useState<string>('');

  // Per-pane matrix state
  const [paneMatrixAssignments, setPaneMatrixAssignments] = useState<
    Record<number, { agentId: string; model: string }>
  >({
    1: { agentId: 'claude-code', model: 'claude-3-7-sonnet' },
    2: { agentId: 'aider', model: 'claude-3-7-sonnet' },
    3: { agentId: 'ollama', model: 'deepseek-r1:32b' },
    4: { agentId: 'shell', model: 'zsh' },
  });

  if (!isOpen) return null;

  const currentAgent = DEMO_AGENTS.find((a) => a.id === selectedAgentId) || DEMO_AGENTS[0];
  const missingAgents = DEMO_AGENTS.filter((a) => !a.isInstalled && a.installCommand && a.id !== 'shell');

  const filteredAgents = DEMO_AGENTS.filter((a) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'coding') return a.category === 'cloud' || a.category === 'hybrid';
    if (selectedCategory === 'orchestrator') return a.category === 'orchestrator';
    if (selectedCategory === 'local') return a.category === 'local';
    if (selectedCategory === 'shell') return a.category === 'shell';
    return true;
  });

  const handleSelectAgent = (agent: DemoAgent) => {
    setSelectedAgentId(agent.id);
    setSelectedModel(agent.defaultModel);
  };

  const handleToggleFlag = (flag: string) => {
    if (selectedCliArgs.includes(flag)) {
      setSelectedCliArgs(selectedCliArgs.filter((f) => f !== flag));
    } else {
      setSelectedCliArgs([...selectedCliArgs, flag]);
    }
  };

  const handleRescan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 600);
  };

  const handleCopyInstall = (id: string, cmd: string) => {
    navigator.clipboard?.writeText(cmd);
    setCopiedInstallId(id);
    setTimeout(() => setCopiedInstallId(null), 2000);
  };

  const handleAddVaultEntry = () => {
    if (!newVaultKey.trim()) return;
    setVaultEnv((prev) => ({
      ...prev,
      [newVaultKey.trim()]: newVaultVal.trim() || '••••••••••••••••',
    }));
    setNewVaultKey('');
    setNewVaultVal('');
  };

  const handleRemoveVaultEntry = (key: string) => {
    setVaultEnv((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleDeploySingle = () => {
    if (onDeployAgent) {
      onDeployAgent(currentAgent, selectedPane, selectedModel, starterPrompt, selectedCliArgs);
    }
    onClose();
  };

  const handleDeployPod = (pod: DemoRolePod) => {
    if (onDeployPod) {
      onDeployPod(pod);
    } else if (onDeployAgent) {
      // Deploy each assignment
      pod.assignments.forEach((as) => {
        const foundAgent = DEMO_AGENTS.find((a) => a.id === as.agentId) || DEMO_AGENTS[0];
        onDeployAgent(foundAgent, as.paneIndex + 1, as.model || foundAgent.defaultModel, as.initialPrompt, as.cliArgs);
      });
    }
    onClose();
  };

  const renderIcon = (type: DemoAgent['iconType']) => {
    switch (type) {
      case 'bot':
        return <Bot className="w-4 h-4" />;
      case 'sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'zap':
        return <Zap className="w-4 h-4" />;
      case 'globe':
        return <Globe className="w-4 h-4" />;
      case 'file-text':
        return <FileText className="w-4 h-4" />;
      case 'code':
        return <Code className="w-4 h-4" />;
      case 'cpu':
        return <Cpu className="w-4 h-4" />;
      case 'server':
        return <Server className="w-4 h-4" />;
      case 'layers':
        return <Layers className="w-4 h-4" />;
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
      aria-labelledby="desktop-agent-launcher-title"
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in select-none font-sans"
      onClick={onClose}
    >
      {/* Main Glass Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] bg-[#090a0c]/95 border border-[#4a4b50] rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-left"
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-[#4a4b50] flex items-center justify-between bg-[#111111]/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[#5683da]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="desktop-agent-launcher-title"
                  className="font-sans font-bold text-sm sm:text-base text-white tracking-tight"
                >
                  AI Agent & CLI Fleet Launcher
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#090a0c] text-[#5683da] border border-[#4a4b50] font-mono font-medium">
                  14 Agents Ready
                </span>
              </div>
              <p className="text-[11px] text-[#a9a9aa] font-sans">
                Deploy Claude, Codex, Antigravity, Grok, Kimi, Qwen, Aider, Ollama, DeepSeek & heterogeneous role pods
              </p>
            </div>
          </div>

          {/* Desktop Mode Switcher Tabs */}
          <div className="hidden sm:flex items-center gap-1 bg-[#090a0c] p-1 rounded-xl border border-[#4a4b50]">
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'batch'
                  ? 'bg-[#5683da] text-white font-semibold shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#111111]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Batch Launch</span>
            </button>
            <button
              onClick={() => setActiveTab('pods')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'pods'
                  ? 'bg-[#5683da] text-white font-semibold shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#111111]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Role Pods</span>
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-[#5683da] text-white font-semibold shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#111111]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Per-Pane Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'vault'
                  ? 'bg-[#5683da] text-white font-semibold shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#111111]'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Vault / 1-Click Install</span>
            </button>
          </div>

          {/* Close affordance */}
          <button
            onClick={onClose}
            aria-label="Close launcher modal"
            className="p-1.5 rounded-lg hover:bg-[#111111] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          {/* Mobile Tab Switcher */}
          <div className="flex sm:hidden items-center gap-1 bg-[#090a0c] p-1 rounded-xl border border-[#4a4b50] overflow-x-auto">
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'batch' ? 'bg-[#5683da] text-white' : 'text-[#a9a9aa]'
              }`}
            >
              Batch
            </button>
            <button
              onClick={() => setActiveTab('pods')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'pods' ? 'bg-[#5683da] text-white' : 'text-[#a9a9aa]'
              }`}
            >
              Pods
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'matrix' ? 'bg-[#5683da] text-white' : 'text-[#a9a9aa]'
              }`}
            >
              Matrix
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'vault' ? 'bg-[#5683da] text-white' : 'text-[#a9a9aa]'
              }`}
            >
              Vault
            </button>
          </div>

          {/* ═══════════ TAB 1: BATCH LAUNCH ═══════════ */}
          {activeTab === 'batch' && (
            <div className="space-y-4">
              {/* Category Filter Pills & Rescan */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-[#090a0c] p-1 rounded-lg border border-[#4a4b50]">
                  {[
                    { id: 'all', label: 'All 14 Agents' },
                    { id: 'coding', label: 'Coding CLI' },
                    { id: 'orchestrator', label: 'Orchestrators' },
                    { id: 'local', label: 'Local / Air-Gapped' },
                    { id: 'shell', label: 'Native Shell' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-[#111111] text-white border border-[#5683da] font-semibold'
                          : 'text-[#a9a9aa] hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleRescan}
                  className="flex items-center gap-1.5 text-xs font-mono text-[#a9a9aa] hover:text-white transition-colors cursor-pointer px-2.5 py-1 rounded-lg border border-[#4a4b50] bg-[#090a0c]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-[#5683da]' : ''}`} />
                  <span>Rescan System Binaries</span>
                </button>
              </div>

              {/* Agent Grid Catalog */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredAgents.map((agent) => {
                  const isSelected = selectedAgentId === agent.id;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => handleSelectAgent(agent)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#111111] border-[#5683da] ring-1 ring-[#5683da] shadow-[0_0_20px_rgba(86,131,218,0.2)]'
                          : 'bg-[#0e0e10] border-[#4a4b50] hover:border-[#6b6c6d] hover:bg-[#111111]/80'
                      }`}
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1.5 rounded-lg border ${
                                isSelected
                                  ? 'bg-[#5683da]/20 border-[#5683da] text-[#5683da]'
                                  : 'bg-[#090a0c] border-[#4a4b50] text-[#a9a9aa]'
                              }`}
                            >
                              {renderIcon(agent.iconType)}
                            </div>
                            <div className="truncate">
                              <h3 className="font-sans font-bold text-white text-xs leading-tight truncate">
                                {agent.name}
                              </h3>
                              <span className="text-[10px] text-[#6b6c6d] font-mono">
                                {agent.provider}
                              </span>
                            </div>
                          </div>

                          {isSelected ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5683da] text-white">
                              <Check className="w-3 h-3" />
                            </span>
                          ) : agent.isInstalled ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-emerald-400 font-mono">
                              Ready
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-[#a9a9aa] font-mono">
                              CLI
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-[#a9a9aa] font-sans leading-relaxed line-clamp-2 mb-2.5">
                          {agent.description}
                        </p>
                      </div>

                      {/* Models Strip */}
                      <div className="pt-2 border-t border-[#4a4b50]/60 flex items-center justify-between text-[10px]">
                        <span className="text-[#6b6c6d] truncate mr-2 font-mono">
                          $ {agent.command.split(' ')[0]}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#090a0c] border border-[#4a4b50] text-[#5683da] font-mono font-medium">
                          {agent.defaultModel.split('-')[0]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Batch Configuration Parameters */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#111111] border border-[#4a4b50] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-sans font-semibold text-xs sm:text-[13px] text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#5683da]" />
                    <span>Launch Parameters for {currentAgent.name}</span>
                  </h4>

                  {/* Target Pane Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#a9a9aa] font-mono">Target Pane:</span>
                    <div className="flex items-center gap-1 bg-[#090a0c] p-0.5 rounded-lg border border-[#4a4b50]">
                      {Array.from({ length: Math.min(paneCount, 4) }, (_, i) => i + 1).map((pId) => (
                        <button
                          key={pId}
                          onClick={() => setSelectedPane(pId)}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Model Dropdown */}
                  {currentAgent.supportedModels.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-[#a9a9aa]">Target Inference Model</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-[#090a0c] border border-[#4a4b50] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#5683da]"
                      >
                        {currentAgent.supportedModels.map((m) => (
                          <option key={m} value={m} className="bg-[#090a0c] text-white">
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quick Flags */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-[#a9a9aa]">CLI Flags & Arguments</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {QUICK_FLAGS.map((f) => {
                        const active = selectedCliArgs.includes(f.flag);
                        return (
                          <button
                            key={f.flag}
                            type="button"
                            onClick={() => handleToggleFlag(f.flag)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border cursor-pointer ${
                              active
                                ? 'bg-[#5683da]/20 border-[#5683da] text-[#5683da] font-semibold'
                                : 'bg-[#090a0c] border-[#4a4b50] text-[#a9a9aa] hover:text-white'
                            }`}
                          >
                            {f.flag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Starter Prompt */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-[#a9a9aa]">
                    Initial Starter Prompt / Task Objective (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={starterPrompt}
                    onChange={(e) => setStarterPrompt(e.target.value)}
                    placeholder="e.g. Inspect the project dependencies, check tests, and summarize the architecture."
                    className="w-full bg-[#090a0c] border border-[#4a4b50] rounded-lg p-3 text-xs font-sans text-white placeholder-[#6b6c6d] focus:outline-none focus:border-[#5683da] resize-none"
                  />
                </div>

                {/* Auto Start Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#090a0c] border border-[#4a4b50]">
                  <div>
                    <p className="text-xs font-medium text-white">Auto-execute on launch</p>
                    <p className="text-[11px] text-[#a9a9aa]">
                      Automatically invoke CLI command across target terminal session immediately.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoStart}
                    onChange={(e) => setAutoStart(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#5683da] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 2: ROLE PODS ═══════════ */}
          {activeTab === 'pods' && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-mono font-semibold text-[#a9a9aa] uppercase tracking-wider">
                  Pre-Configured Multi-Agent Team Blueprints
                </span>
                <p className="text-xs text-[#6b6c6d] mt-0.5">
                  Deploy coordinated heterogeneous teams of architects, refactorers, local reasoning models, and shell monitors.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {HETEROGENEOUS_ROLE_PODS.map((pod) => (
                  <div
                    key={pod.id}
                    className="p-5 rounded-xl bg-[#111111] border border-[#4a4b50] hover:border-[#5683da]/60 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-sans font-bold text-sm text-white">{pod.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-[#090a0c] text-[#5683da] border border-[#4a4b50] text-[11px] font-mono">
                          {pod.paneCount} Panes
                        </span>
                      </div>
                      <p className="text-xs text-[#a9a9aa] font-sans leading-relaxed">{pod.description}</p>
                    </div>

                    <div className="space-y-1.5 pt-2.5 border-t border-[#4a4b50]/60">
                      {pod.assignments.map((a) => (
                        <div key={a.paneIndex} className="flex items-center justify-between text-xs font-mono">
                          <span className="text-white">
                            Pane #{a.paneIndex + 1}: {a.title}
                          </span>
                          <span className="text-[#6b6c6d]">{a.model || 'Default'}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleDeployPod(pod)}
                      className="w-full py-2 rounded-lg bg-[#5683da] hover:bg-[#456ec2] text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Deploy Pod Across Grid</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════ TAB 3: PER-PANE MATRIX ═══════════ */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-mono font-semibold text-[#a9a9aa] uppercase tracking-wider">
                  Individual Grid Pane Assignments
                </span>
                <p className="text-xs text-[#6b6c6d] mt-0.5">
                  Configure distinct agent binaries, models, and starter prompts for each terminal in your layout.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {Array.from({ length: Math.min(paneCount, 4) }, (_, i) => i + 1).map((pId) => {
                  const assignment = paneMatrixAssignments[pId] || {
                    agentId: 'claude-code',
                    model: 'claude-3-7-sonnet',
                  };
                  const currentPaneAgent =
                    DEMO_AGENTS.find((a) => a.id === assignment.agentId) || DEMO_AGENTS[0];

                  return (
                    <div
                      key={pId}
                      className="p-4 rounded-xl bg-[#111111] border border-[#4a4b50] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-[#5683da]">Pane #{pId}</span>
                          <span className="text-[11px] text-[#a9a9aa]">
                            ({currentPaneAgent.name})
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#090a0c] border border-[#4a4b50] text-[#27c93f]">
                          Active PTY
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#a9a9aa]">Select Agent</label>
                        <select
                          value={assignment.agentId}
                          onChange={(e) => {
                            const newAgent = DEMO_AGENTS.find((a) => a.id === e.target.value);
                            setPaneMatrixAssignments((prev) => ({
                              ...prev,
                              [pId]: {
                                agentId: e.target.value,
                                model: newAgent?.defaultModel || 'default',
                              },
                            }));
                          }}
                          className="w-full bg-[#090a0c] border border-[#4a4b50] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        >
                          {DEMO_AGENTS.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.provider})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          if (onDeployAgent) {
                            onDeployAgent(
                              currentPaneAgent,
                              pId,
                              assignment.model,
                              `Deploying ${currentPaneAgent.name} to pane #${pId}`
                            );
                          }
                          onClose();
                        }}
                        className="w-full py-1.5 rounded-lg bg-[#090a0c] hover:bg-[#1c1d22] border border-[#4a4b50] hover:border-[#5683da] text-xs font-medium text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3 h-3 text-[#5683da]" />
                        <span>Deploy to Pane #{pId}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════ TAB 4: VAULT & INSTALL ═══════════ */}
          {activeTab === 'vault' && (
            <div className="space-y-4">
              {/* 1-Click Install Drawer */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#111111] border border-[#4a4b50] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <DownloadCloud className="w-4 h-4 text-[#5683da]" />
                    <span>1-Click Binary Install Assistant</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#a9a9aa]">
                    {missingAgents.length} CLI Tools Ready to Install
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {missingAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#090a0c] border border-[#4a4b50] text-xs font-mono"
                    >
                      <div className="truncate mr-2">
                        <span className="text-white font-semibold mr-2">{agent.name}:</span>
                        <span className="text-[#a9a9aa]">{agent.installCommand}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyInstall(agent.id, agent.installCommand!)}
                          className="p-1.5 rounded-lg hover:bg-[#111111] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
                          title="Copy install command"
                        >
                          {copiedInstallId === agent.id ? (
                            <Check className="w-3.5 h-3.5 text-[#27c93f]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {agent.docUrl && (
                          <a
                            href={agent.docUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg hover:bg-[#111111] text-[#a9a9aa] hover:text-white transition-colors"
                            title="Documentation"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent Configuration & API Key Vault */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#111111] border border-[#4a4b50] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Key className="w-4 h-4 text-[#5683da]" />
                    <span>Agent Configuration Vault (API Keys & Secrets)</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-[#a9a9aa]">
                    <Shield className="w-3.5 h-3.5 text-[#27c93f]" />
                    <span>Injected securely into spawned PTY environments</span>
                  </span>
                </div>

                {/* Quick Add Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-[#a9a9aa] font-mono">Quick Add:</span>
                  {DEFAULT_VAULT_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (!vaultEnv[k]) {
                          setVaultEnv((prev) => ({ ...prev, [k]: '••••••••••••••••' }));
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-[#090a0c] hover:bg-[#1c1d22] text-[#a9a9aa] hover:text-white text-[11px] font-mono border border-[#4a4b50] transition-colors cursor-pointer"
                    >
                      + {k}
                    </button>
                  ))}
                </div>

                {/* Active Key-Value List */}
                <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                  {Object.entries(vaultEnv).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={k}
                        className="w-1/2 px-3 py-1.5 rounded-lg bg-[#090a0c] border border-[#4a4b50] text-xs font-mono text-white"
                      />
                      <input
                        type="password"
                        value={v}
                        onChange={(e) =>
                          setVaultEnv((prev) => ({ ...prev, [k]: e.target.value }))
                        }
                        placeholder="Key value..."
                        className="w-1/2 px-3 py-1.5 rounded-lg bg-[#090a0c] border border-[#4a4b50] text-xs font-mono text-white placeholder-[#6b6c6d] focus:outline-none focus:border-[#5683da]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVaultEntry(k)}
                        className="p-1.5 rounded-lg hover:bg-[#111111] text-[#a9a9aa] hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Key Row */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#4a4b50]">
                  <input
                    type="text"
                    value={newVaultKey}
                    onChange={(e) => setNewVaultKey(e.target.value)}
                    placeholder="VARIABLE_NAME"
                    className="w-1/2 px-3 py-1.5 rounded-lg bg-[#090a0c] border border-[#4a4b50] text-xs font-mono text-white placeholder-[#6b6c6d] focus:outline-none focus:border-[#5683da]"
                  />
                  <input
                    type="password"
                    value={newVaultVal}
                    onChange={(e) => setNewVaultVal(e.target.value)}
                    placeholder="Secret value..."
                    className="w-1/2 px-3 py-1.5 rounded-lg bg-[#090a0c] border border-[#4a4b50] text-xs font-mono text-white placeholder-[#6b6c6d] focus:outline-none focus:border-[#5683da]"
                  />
                  <button
                    type="button"
                    onClick={handleAddVaultEntry}
                    className="p-2 rounded-lg bg-[#5683da] text-white hover:bg-[#456ec2] transition-colors cursor-pointer"
                    title="Add key"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-5 py-3.5 border-t border-[#4a4b50] bg-[#111111]/90 flex items-center justify-between shrink-0">
          <div className="text-xs text-[#a9a9aa] font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#27c93f] inline-block" />
            <span>Targeting Pane #0{selectedPane} · Automatic PATH resolution</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#a9a9aa] hover:text-white hover:bg-[#090a0c] border border-[#4a4b50] transition-colors cursor-pointer"
            >
              Skip / Raw Shells
            </button>
            <button
              onClick={handleDeploySingle}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#5683da] hover:bg-[#456ec2] text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
            >
              <span>Deploy to Pane #0{selectedPane}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
