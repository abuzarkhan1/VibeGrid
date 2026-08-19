import React, { useEffect, useState } from 'react';
import { useAgentStore } from '@/store/useAgentStore';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { AgentCatalogCard } from './AgentCatalogCard';
import { PaneAgentMatrix } from './PaneAgentMatrix';
import {
  HETEROGENEOUS_ROLE_PODS,
  COMMON_VAULT_KEYS,
  DEFAULT_VAULT_FLAGS,
} from '@/lib/agentRegistry';
import {
  Bot,
  Sparkles,
  Zap,
  ArrowRight,
  X,
  Users,
  RefreshCw,
  SlidersHorizontal,
  Shield,
  Key,
  DownloadCloud,
  Check,
  Copy,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface AgentLauncherModalProps {
  onProceedToCustomizer?: () => void;
}

export const AgentLauncherModal: React.FC<AgentLauncherModalProps> = ({
  onProceedToCustomizer,
}) => {
  const {
    isOpen,
    agents,
    selectedAgentId,
    selectedModel,
    selectedCliArgs,
    selectedInitialPrompt,
    selectedAutoStart,
    isScanning,
    closeLauncher,
    setSelectedAgent,
    setSelectedModel,
    setSelectedCliArgs,
    setSelectedInitialPrompt,
    setSelectedAutoStart,
    batchAssignAgentToAll,
    applyRolePod,
    scanInstalledAgents,
    provisionActivePanes,
  } = useAgentStore();

  const root = usePaneStore((s) => s.root);
  const terminals = getTerminalNodes(root);
  const terminalIds = terminals.map((t) => t.id);
  const addToast = useUIStore((s) => s.addToast);

  const workspaceEnv = useOnboardingStore((s) => s.workspaceEnv);
  const setWorkspaceEnv = useOnboardingStore((s) => s.setWorkspaceEnv);

  const [activeTab, setActiveTab] = useState<'batch' | 'pods' | 'matrix' | 'vault'>('batch');
  const [selectedPaneIds, setSelectedPaneIds] = useState<string[]>([]);
  const [newVaultKey, setNewVaultKey] = useState('');
  const [newVaultVal, setNewVaultVal] = useState('');
  const [copiedInstallId, setCopiedInstallId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      scanInstalledAgents();
      setSelectedPaneIds(terminalIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSelectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const missingAgents = agents.filter((a) => !a.isInstalled && a.installCommand && a.id !== 'shell');

  const handleApplyAndLaunch = () => {
    if (activeTab === 'batch') {
      const targetPanes = selectedPaneIds.length > 0 ? selectedPaneIds : terminalIds;
      batchAssignAgentToAll(
        targetPanes,
        selectedAgentId,
        selectedModel || undefined,
        selectedCliArgs,
        selectedInitialPrompt || undefined,
        selectedAutoStart
      );
    }

    closeLauncher();

    if (onProceedToCustomizer) {
      onProceedToCustomizer();
    }

    provisionActivePanes().then((launchedCount) => {
      addToast({
        type: 'success',
        title: 'AI Agents Provisioned',
        description: launchedCount > 0
          ? `Successfully launched AI agents across ${launchedCount} terminal panes.`
          : `Assigned AI coding agents across ${terminals.length} terminal panes.`,
      });
    }).catch(console.error);
  };

  const handleToggleFlag = (flag: string) => {
    if (selectedCliArgs.includes(flag)) {
      setSelectedCliArgs(selectedCliArgs.filter((f) => f !== flag));
    } else {
      setSelectedCliArgs([...selectedCliArgs, flag]);
    }
  };

  const handleCopyInstall = (id: string, cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedInstallId(id);
    setTimeout(() => setCopiedInstallId(null), 2000);
  };

  const handleAddVaultEntry = () => {
    if (!newVaultKey.trim()) return;
    setWorkspaceEnv({
      ...workspaceEnv,
      [newVaultKey.trim()]: newVaultVal.trim(),
    });
    setNewVaultKey('');
    setNewVaultVal('');
  };

  const handleRemoveVaultEntry = (k: string) => {
    const updated = { ...workspaceEnv };
    delete updated[k];
    setWorkspaceEnv(updated);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-launcher-title"
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-xl animate-fade-in select-none"
    >
      {/* Main Transparent Black Glass Panel */}
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 md:py-4.5 border-b border-white/5 flex items-center justify-between bg-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/40 border border-white/10 text-white/80">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="agent-launcher-title"
                className="font-sans font-bold text-base md:text-lg text-white/90 tracking-tight flex items-center gap-2"
              >
                AI Agent & CLI Launcher
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10 font-mono font-medium">
                  Autonomous Fleet
                </span>
              </h2>
              <p className="text-[12px] text-white/40 font-sans">
                Deploy Claude, Codex, Antigravity, Grok, Kimi, Qwen, Aider, Ollama, DeepSeek & specialized role pods
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'batch'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Batch Launch</span>
            </button>
            <button
              onClick={() => setActiveTab('pods')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'pods'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Role Pods</span>
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'matrix'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Per-Pane Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'vault'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Vault / 1-Click Install</span>
            </button>
          </div>

          {/* Close */}
          <button
            onClick={closeLauncher}
            aria-label="Close launcher modal"
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar">
          {/* Mobile Mode Switcher */}
          <div className="flex sm:hidden items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'batch' ? 'bg-white/15 text-white' : 'text-white/40'
              }`}
            >
              Batch
            </button>
            <button
              onClick={() => setActiveTab('pods')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'pods' ? 'bg-white/15 text-white' : 'text-white/40'
              }`}
            >
              Pods
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'matrix' ? 'bg-white/15 text-white' : 'text-white/40'
              }`}
            >
              Matrix
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'vault' ? 'bg-white/15 text-white' : 'text-white/40'
              }`}
            >
              Vault
            </button>
          </div>

          {/* Tab 1: Batch Launch */}
          {activeTab === 'batch' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono font-semibold text-white/40 uppercase tracking-wider">
                    Select Agent Provider for Batch Assignment
                  </span>
                  <p className="text-[12px] text-white/30 mt-0.5">
                    Choose an AI CLI tool or local LLM to deploy across all {terminals.length} grid terminals simultaneously.
                  </p>
                </div>
                <button
                  onClick={() => scanInstalledAgents()}
                  className="flex items-center gap-1.5 text-xs font-mono text-white/60 hover:text-white transition-colors shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>Rescan System</span>
                </button>
              </div>

              {/* Agent Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {agents.map((agent) => (
                  <AgentCatalogCard
                    key={agent.id}
                    agent={agent}
                    isSelected={selectedAgentId === agent.id}
                    onSelect={() => setSelectedAgent(agent.id)}
                  />
                ))}
              </div>

              {/* Batch Configuration Strip */}
              {selectedAgentId !== 'shell' && (
                <div className="p-4 md:p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-sans font-semibold text-[13px] text-white/80 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-white/60" />
                      <span>Batch Launch Parameters for {currentSelectedAgent.name}</span>
                    </h4>
                    <span className="text-[11px] font-mono text-white/40">
                      Target: {selectedPaneIds.length} of {terminals.length} Panes Selected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Model Dropdown */}
                    {currentSelectedAgent.supportedModels.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-white/40">Target Model</label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white/80 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
                        >
                          {currentSelectedAgent.supportedModels.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Quick Flags Chips */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-white/40">Quick Flags & Toggles</label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {DEFAULT_VAULT_FLAGS.map((f) => {
                          const active = selectedCliArgs.includes(f.flag);
                          return (
                            <button
                              key={f.flag}
                              type="button"
                              onClick={() => handleToggleFlag(f.flag)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                                active
                              ? 'bg-white/10 border-white/40 text-white'
                              : 'bg-black/40 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
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
                    <label className="text-[11px] font-mono text-white/40">
                      Initial Starter Prompt / Task Objective (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={selectedInitialPrompt}
                      onChange={(e) => setSelectedInitialPrompt(e.target.value)}
                      placeholder="e.g. Inspect the project dependencies, check tests, and summarize the architecture."
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs font-sans text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 resize-none"
                    />
                  </div>

                  {/* Auto Start Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/10">
                    <div>
                      <p className="text-[12px] font-medium text-white/80">Auto-execute on launch</p>
                      <p className="text-[11px] text-white/40">
                        Automatically invoke CLI command across all targeted terminal sessions immediately.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedAutoStart}
                      onChange={(e) => setSelectedAutoStart(e.target.checked)}
                      className="w-4 h-4 rounded accent-white focus:ring-white/20"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Heterogeneous Role Pods */}
          {activeTab === 'pods' && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-mono font-semibold text-white/40 uppercase tracking-wider">
                  Pre-Configured Multi-Agent Team Blueprints
                </span>
                <p className="text-[12px] text-white/30 mt-0.5">
                  Deploy coordinated heterogeneous teams of architects, refactorers, local reasoning models, and shell monitors.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {HETEROGENEOUS_ROLE_PODS.map((pod) => (
                  <div
                    key={pod.id}
                    className="p-4 md:p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/30 hover:bg-white/[0.05] transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-sans font-bold text-[13px] text-white/80">
                          {pod.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10 text-[11px] font-mono">
                          {pod.paneCount} Panes
                        </span>
                      </div>
                      <p className="text-[12px] text-white/40 font-sans">{pod.description}</p>
                    </div>

                    <div className="space-y-1.5 pt-2.5 border-t border-white/10">
                      {pod.assignments.map((a) => (
                        <div key={a.paneIndex} className="flex items-center justify-between text-xs font-mono">
                          <span className="text-white/80">
                            Pane {a.paneIndex + 1}: {a.title}
                          </span>
                          <span className="text-white/30">{a.model || 'Default'}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        applyRolePod(pod, terminalIds);
                        handleApplyAndLaunch();
                      }}
                      className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Deploy Pod Across Grid</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Per-Pane Matrix */}
          {activeTab === 'matrix' && <PaneAgentMatrix />}

          {/* Tab 4: Agent Vault & Missing Binaries */}
          {activeTab === 'vault' && (
            <div className="space-y-5">
              {/* 1-Click Install Drawer */}
              <div className="p-4 md:p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-white/80">
                    <DownloadCloud className="w-4 h-4 text-white/60" />
                    <span>1-Click Binary Install Assistant</span>
                  </div>
                  <span className="text-[11px] font-mono text-white/40">
                    {missingAgents.length} Missing AI Tools
                  </span>
                </div>

                {missingAgents.length === 0 ? (
                  <p className="text-xs text-white/60 font-mono">
                    All AI agent CLI binaries are detected and ready on your system.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {missingAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono"
                      >
                        <div className="truncate mr-2">
                          <span className="text-white/80 font-semibold mr-2">{agent.name}:</span>
                          <span className="text-white/60">{agent.installCommand}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyInstall(agent.id, agent.installCommand!)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                            title="Copy install command"
                          >
                            {copiedInstallId === agent.id ? (
                              <Check className="w-3.5 h-3.5 text-white/80" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {agent.docUrl && (
                            <a
                              href={agent.docUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                              title="Documentation"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Agent Configuration & API Key Vault */}
              <div className="p-4 md:p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-white/80">
                    <Key className="w-4 h-4 text-white/60" />
                    <span>Agent Configuration Vault (API Keys & Secrets)</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-white/40">
                    <Shield className="w-3.5 h-3.5 text-white/60" />
                    <span>Injected securely into spawned PTY environments</span>
                  </span>
                </div>

                {/* Quick Add Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-white/40 font-mono">Quick Add:</span>
                  {COMMON_VAULT_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (!workspaceEnv[k]) {
                          setWorkspaceEnv({ ...workspaceEnv, [k]: '' });
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-black/40 hover:bg-white/10 text-white/40 hover:text-white text-[11px] font-mono border border-white/10 transition-colors"
                    >
                      + {k}
                    </button>
                  ))}
                </div>

                {/* Active Key-Value List */}
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {Object.entries(workspaceEnv).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={k}
                        className="w-1/2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white/80"
                      />
                      <input
                        type="password"
                        value={v}
                        onChange={(e) =>
                          setWorkspaceEnv({
                            ...workspaceEnv,
                            [k]: e.target.value,
                          })
                        }
                        placeholder="Key value..."
                        className="w-1/2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVaultEntry(k)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                        title="Remove key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Key Row */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <input
                    type="text"
                    value={newVaultKey}
                    onChange={(e) => setNewVaultKey(e.target.value)}
                    placeholder="VARIABLE_NAME"
                    className="w-1/2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
                  />
                  <input
                    type="password"
                    value={newVaultVal}
                    onChange={(e) => setNewVaultVal(e.target.value)}
                    placeholder="Secret value..."
                    className="w-1/2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddVaultEntry}
                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-colors"
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
        <div className="px-6 py-4 border-t border-white/5 bg-transparent flex items-center justify-between">
          <div className="text-xs text-white/40 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white/60 inline-block" />
            <span>Automatic PATH resolution enabled</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={closeLauncher}
              className="px-4 py-2 rounded-lg text-xs font-medium text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              Skip / Raw Shells
            </button>
            <button
              onClick={handleApplyAndLaunch}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white hover:bg-white/90 text-black text-xs font-semibold shadow-sm transition-all hover:scale-[1.01]"
            >
              <span>Provision Agents</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
