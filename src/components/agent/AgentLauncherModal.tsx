import React, { useEffect, useState } from 'react';
import { useAgentStore } from '@/store/useAgentStore';
import { usePaneStore, getTerminalNodes } from '@/store/usePaneStore';
import { useUIStore } from '@/store/useUIStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { AgentCatalogCard } from './AgentCatalogCard';
import { PaneAgentMatrix } from './PaneAgentMatrix';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getAgentLogo } from './AgentLogos';
import {
  HETEROGENEOUS_ROLE_PODS,
  COMMON_VAULT_KEYS,
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
  Key,
  DownloadCloud,
  Check,
  Copy,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
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
  const [copiedVaultKey, setCopiedVaultKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [pendingDeleteVaultKey, setPendingDeleteVaultKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      scanInstalledAgents();
      setSelectedPaneIds(terminalIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

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

    provisionActivePanes()
      .then((launchedCount) => {
        addToast({
          type: 'success',
          title: 'AI Agents Provisioned',
          description: launchedCount > 0
            ? `Successfully launched AI agents across ${launchedCount} terminal panes.`
            : `Assigned AI coding agents across ${terminals.length} terminal panes.`,
        });
      })
      .catch((err) => {
        console.error('[AgentLauncherModal] Provisioning error:', err);
        addToast({
          type: 'error',
          title: 'Launch failed',
          description: 'Could not provision panes.',
        });
      });
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

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCopyVaultValue = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedVaultKey(key);
    setTimeout(() => setCopiedVaultKey(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-launcher-title"
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-6 bg-[#090a0c]/80 animate-fade-in select-none"
    >
      {/* Main Solid Charcoal Panel */}
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#111111] border border-[#4a4b50] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#4a4b50] flex items-center justify-between bg-[#111111]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111111] border border-[#4a4b50] text-[#5683da] shadow-sm shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="agent-launcher-title"
                className="font-sans font-bold text-base md:text-lg text-white tracking-tight flex items-center gap-2"
              >
                Agent Launcher
              </h2>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-[#111111] p-1 rounded-full border border-[#4a4b50]">
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                activeTab === 'batch'
                  ? 'bg-[#5683da] text-white shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Batch Launch</span>
            </button>
            <button
              onClick={() => setActiveTab('pods')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                activeTab === 'pods'
                  ? 'bg-[#5683da] text-white shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Role Pods</span>
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-[#5683da] text-white shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Per-Pane Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                activeTab === 'vault'
                  ? 'bg-[#5683da] text-white shadow-sm'
                  : 'text-[#a9a9aa] hover:text-white hover:bg-[#303236]'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Vault</span>
            </button>
          </div>

          {/* Close */}
          <button
            onClick={closeLauncher}
            aria-label="Close launcher modal"
            className="p-1.5 rounded-full hover:bg-[#303236] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar">
          {/* Mobile Mode Switcher */}
          <div className="flex sm:hidden items-center gap-1 bg-[#111111] p-1 rounded-full border border-[#4a4b50] overflow-x-auto">
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                activeTab === 'batch' ? 'bg-[#5683da] text-white' : 'text-[#a9a9aa] hover:bg-[#303236]'
              }`}
            >
              Batch
            </button>
            <button
              onClick={() => setActiveTab('pods')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                activeTab === 'pods' ? 'bg-[#5683da] text-white' : 'text-[#a9a9aa] hover:bg-[#303236]'
              }`}
            >
              Pods
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                activeTab === 'matrix' ? 'bg-[#5683da] text-white' : 'text-[#a9a9aa] hover:bg-[#303236]'
              }`}
            >
              Matrix
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                activeTab === 'vault' ? 'bg-[#5683da] text-white' : 'text-[#a9a9aa] hover:bg-[#303236]'
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
                  <span className="text-[11px] font-mono font-semibold text-[#a9a9aa] uppercase tracking-wider">
                    Select Agent Provider
                  </span>
                </div>
                <button
                  onClick={() => scanInstalledAgents()}
                  className="flex items-center gap-1.5 text-xs font-mono text-[#a9a9aa] hover:text-white transition-colors shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-[#5683da]' : ''}`} />
                  <span>Rescan</span>
                </button>
              </div>

              {/* Agent Grid */}
              <div className="relative">
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 transition-opacity duration-200 ${isScanning ? 'opacity-40 pointer-events-none' : ''}`}>
                  {agents.map((agent) => (
                    <AgentCatalogCard
                      key={agent.id}
                      agent={agent}
                      isSelected={selectedAgentId === agent.id}
                      onSelect={() => setSelectedAgent(agent.id)}
                    />
                  ))}
                </div>
                {isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111111]/90 rounded-2xl border border-[#4a4b50] gap-2.5 z-10 animate-fade-in">
                    <RefreshCw className="w-5 h-5 text-[#5683da] animate-spin" />
                    <span className="text-xs font-mono text-white">Scanning environment for CLI agents…</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Heterogeneous Role Pods */}
          {activeTab === 'pods' && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-mono font-semibold text-[#a9a9aa] uppercase tracking-wider">
                  Multi-Agent Team Pods
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {HETEROGENEOUS_ROLE_PODS.map((pod) => (
                  <div
                    key={pod.id}
                    className="bg-[#111111] hover:bg-[#303236] border border-[#4a4b50] hover:border-[#5683da]/60 rounded-2xl p-5 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-sans font-bold text-sm text-white">
                          {pod.name}
                        </h4>
                        <span className="bg-[#111111] border border-[#4a4b50] text-[#5683da] text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full">
                          {pod.paneCount} Panes
                        </span>
                      </div>
                      <p className="text-xs text-[#a9a9aa] leading-relaxed">{pod.description}</p>
                    </div>

                    <div className="space-y-2 pt-2.5 border-t border-[#4a4b50]">
                      {pod.assignments.map((a) => (
                        <div key={a.paneIndex} className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            {getAgentLogo(a.agentId, 'w-3.5 h-3.5')}
                            <span className="text-xs font-sans text-white font-medium truncate">
                              Pane {a.paneIndex + 1}: {a.title}
                            </span>
                          </div>
                          {a.model && (
                            <span className="px-2 py-0.5 rounded-full bg-[#111111] border border-[#4a4b50] text-[10px] font-mono text-[#a9a9aa] shrink-0">
                              {a.model}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        if (terminalIds.length < pod.paneCount) {
                          addToast({
                            type: 'warning',
                            title: 'Insufficient Panes',
                            description: `Pod "${pod.name}" requires ${pod.paneCount} panes, but only ${terminalIds.length} ${terminalIds.length === 1 ? 'pane is' : 'panes are'} available. Please split your workspace first.`,
                          });
                          return;
                        }
                        applyRolePod(pod, terminalIds);
                        handleApplyAndLaunch();
                      }}
                      className="w-full h-9 rounded-full bg-[#5683da] hover:bg-[#5683da]/90 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Deploy Pod</span>
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
              <div className="p-5 rounded-2xl bg-[#111111] border border-[#4a4b50] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
                    <DownloadCloud className="w-4 h-4 text-[#5683da]" />
                    <span>Install Missing Agents</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#a9a9aa]">
                    {missingAgents.length} Tools
                  </span>
                </div>

                {missingAgents.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#111111] border border-[#4a4b50] text-center text-xs font-mono text-[#27c93f] flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>All supported CLI agents are installed on your PATH</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {missingAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#111111] border border-[#4a4b50] text-xs font-mono"
                      >
                        <div className="truncate mr-2">
                          <span className="text-white font-semibold mr-2">{agent.name}:</span>
                          <span className="text-[#a9a9aa]">{agent.installCommand}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyInstall(agent.id, agent.installCommand!)}
                            className="p-1.5 rounded-full bg-[#111111] hover:bg-[#303236] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                            title="Copy install command"
                            aria-label={`Copy install command for ${agent.name}`}
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
                              className="p-1.5 rounded-full bg-[#111111] hover:bg-[#303236] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-colors flex items-center justify-center"
                              title="Documentation"
                              aria-label={`Documentation for ${agent.name}`}
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
              <div className="p-5 rounded-2xl bg-[#111111] border border-[#4a4b50] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
                    <Key className="w-4 h-4 text-[#5683da]" />
                    <span>Agent Secrets & API Keys</span>
                  </div>
                </div>

                {/* Quick Add Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-[#a9a9aa] font-mono">Quick Add:</span>
                  {COMMON_VAULT_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (workspaceEnv[k] === undefined) {
                          setWorkspaceEnv({ ...workspaceEnv, [k]: '' });
                        }
                      }}
                      className="px-2.5 py-1 rounded-full bg-[#111111] hover:bg-[#303236] text-[#5683da] text-[11px] font-mono border border-[#4a4b50] transition-colors cursor-pointer active:scale-95"
                    >
                      + {k}
                    </button>
                  ))}
                </div>

                {/* Active Key-Value List */}
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {Object.keys(workspaceEnv).length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#111111] border border-[#4a4b50] text-center text-xs font-mono text-[#a9a9aa]">
                      No secrets stored in vault.
                    </div>
                  ) : (
                    Object.entries(workspaceEnv).map(([k, v]) => {
                      const isRevealed = revealedKeys[k];
                      return (
                        <div
                          key={k}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#111111] border border-[#4a4b50]"
                        >
                          <div className="flex items-center gap-2 min-w-[150px] max-w-[200px] truncate shrink-0">
                            <Key className="w-3.5 h-3.5 text-[#5683da] shrink-0" />
                            <span className="text-xs font-mono font-semibold text-white truncate" title={k}>
                              {k}
                            </span>
                          </div>

                          <input
                            type={isRevealed ? 'text' : 'password'}
                            value={v}
                            onChange={(e) =>
                              setWorkspaceEnv({
                                ...workspaceEnv,
                                [k]: e.target.value,
                              })
                            }
                            placeholder="Enter secret value..."
                            className="flex-1 px-3 py-1.5 rounded-xl bg-[#111111] border border-[#4a4b50] text-xs font-mono text-white placeholder:text-[#a9a9aa]/40 focus:outline-none focus:border-[#5683da] focus:ring-1 focus:ring-[#5683da]"
                          />

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleReveal(k)}
                              title={isRevealed ? 'Hide secret' : 'Reveal secret'}
                              aria-label={isRevealed ? `Hide ${k}` : `Reveal ${k}`}
                              className="p-1.5 rounded-full bg-[#111111] hover:bg-[#303236] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyVaultValue(k, v)}
                              title="Copy secret"
                              aria-label={`Copy value for ${k}`}
                              className="p-1.5 rounded-full bg-[#111111] hover:bg-[#303236] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                            >
                              {copiedVaultKey === k ? (
                                <Check className="w-3.5 h-3.5 text-[#27c93f]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setPendingDeleteVaultKey(k)}
                              title="Remove key"
                              aria-label={`Remove ${k}`}
                              className="p-1.5 rounded-full bg-[#111111] hover:bg-[#303236] border border-[#4a4b50] text-[#a9a9aa] hover:text-[#ff8964] transition-colors cursor-pointer flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add New Key Row */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#4a4b50]">
                  <input
                    type="text"
                    value={newVaultKey}
                    onChange={(e) => setNewVaultKey(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddVaultEntry()}
                    placeholder="VARIABLE_NAME"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#111111] border border-[#4a4b50] text-xs font-mono text-white placeholder:text-[#a9a9aa]/40 focus:outline-none focus:border-[#5683da] focus:ring-1 focus:ring-[#5683da]"
                  />
                  <input
                    type="password"
                    value={newVaultVal}
                    onChange={(e) => setNewVaultVal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddVaultEntry()}
                    placeholder="Secret value..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#111111] border border-[#4a4b50] text-xs font-mono text-white placeholder:text-[#a9a9aa]/40 focus:outline-none focus:border-[#5683da] focus:ring-1 focus:ring-[#5683da]"
                  />
                  <button
                    type="button"
                    onClick={handleAddVaultEntry}
                    className="p-2 rounded-full bg-[#5683da] hover:bg-[#5683da]/90 text-white transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                    title="Add key"
                    aria-label="Add key"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-3.5 border-t border-[#4a4b50] bg-[#111111] flex items-center justify-end gap-2.5">
          <button
            onClick={closeLauncher}
            className="bg-[#303236] hover:bg-[#303236]/80 border border-[#4a4b50] text-[#a9a9aa] hover:text-white rounded-full px-4 h-9 text-xs font-medium transition-all active:scale-95 cursor-pointer flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyAndLaunch}
            className="rounded-full h-9 px-5 bg-[#5683da] hover:bg-[#5683da]/90 text-white text-xs font-medium shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>Deploy Agents</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {pendingDeleteVaultKey && (
        <ConfirmModal
          title="Remove API Key?"
          message={`Are you sure you want to remove "${pendingDeleteVaultKey}" from your vault?`}
          confirmLabel="Remove Key"
          isDanger={true}
          onConfirm={() => {
            handleRemoveVaultEntry(pendingDeleteVaultKey);
            setPendingDeleteVaultKey(null);
          }}
          onClose={() => setPendingDeleteVaultKey(null)}
        />
      )}
    </div>
  );
};
