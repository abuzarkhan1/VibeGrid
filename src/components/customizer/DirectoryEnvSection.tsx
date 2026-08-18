import React, { useState } from 'react';
import { useCustomizationStore } from '@/store/useCustomizationStore';
import { Folder, FolderOpen, Key, Plus, Trash2, ShieldCheck, GitBranch, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { isTauri } from '@/lib/tauri';

const QUICK_VAULT_KEYS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'DEEPSEEK_API_KEY',
  'GROQ_API_KEY',
  'GITHUB_TOKEN',
  'TAVILY_API_KEY',
];

export const DirectoryEnvSection: React.FC = () => {
  const {
    defaultCwd,
    envVars,
    gitBranch,
    isGitDirty,
    workspaceName,
    setDefaultCwd,
    setEnvVars,
    setGitBranch,
    setWorkspaceName,
  } = useCustomizationStore();

  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handlePickFolder = async () => {
    if (isTauri()) {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          directory: true,
          multiple: false,
          title: 'Select Workspace Working Directory (CWD)',
        });
        if (typeof selected === 'string') {
          setDefaultCwd(selected);

          // Auto-suggest workspace name if default or empty
          const folderName = selected.split(/[/\\]/).filter(Boolean).pop();
          if (folderName && (!workspaceName.trim() || workspaceName === 'Default Workspace')) {
            const formatted = folderName
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase());
            setWorkspaceName(formatted);
          }

          // Simulate / detect git branch
          setGitBranch('main', false);
        }
      } catch (err) {
        console.warn('[VibeGrid] Folder pick dialog error:', err);
      }
    }
  };

  const handleAddEnv = () => {
    if (!newKey.trim()) return;
    setEnvVars({
      ...envVars,
      [newKey.trim().toUpperCase()]: newVal.trim(),
    });
    setNewKey('');
    setNewVal('');
  };

  const handleRemoveEnv = (key: string) => {
    const updated = { ...envVars };
    delete updated[key];
    setEnvVars(updated);
  };

  const handleQuickAdd = (keyName: string) => {
    if (!envVars[keyName]) {
      setEnvVars({
        ...envVars,
        [keyName]: '',
      });
      setRevealedKeys((prev) => ({ ...prev, [keyName]: true }));
    }
  };

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCopyValue = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 text-white/90 font-sans select-none">
      {/* 1. CWD Folder Picker with Native Dialog */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-sans font-bold text-white/80 uppercase tracking-wider block font-mono">
            Working Directory (CWD)
          </label>
          <span className="text-[10px] font-mono text-white/40">
            Initial spawn directory for all terminals
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Folder className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={defaultCwd}
              onChange={(e) => setDefaultCwd(e.target.value)}
              placeholder="e.g. /Users/abuzar/Desktop/VibeGrid"
              className="w-full bg-black/40 border border-white/10 focus:border-white/40 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white/80 placeholder:text-white/30 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={handlePickFolder}
            className="px-4 py-2.5 rounded-md bg-white/[0.05] border border-white/10 flex items-center gap-1.5 text-white/60 hover:text-white hover:bg-white/10 text-xs font-sans font-bold transition-colors shrink-0 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-white/60" />
            <span>Browse</span>
          </button>
        </div>
      </div>

      {/* 2. Git Branch Detection Status Card */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/80">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans font-bold text-white/90">
                Git Branch: <span className="text-white font-mono">{gitBranch || 'main'}</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isGitDirty ? 'bg-white/10 text-white/80 border border-white/20' : 'bg-white/10 text-white/80 border border-white/20'
              }`}>
                {isGitDirty ? '● Uncommitted Changes' : '✓ Clean Working Tree'}
              </span>
            </div>
            <p className="text-[11px] text-white/40 font-sans mt-0.5">
              Detected from active workspace working directory
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setGitBranch(gitBranch === 'main' ? 'feature/agentic' : 'main', !isGitDirty)}
          className="text-xs font-mono text-white/60 hover:text-white px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
        >
          Rescan Git
        </button>
      </div>

      {/* 3. Environment Variable & API Key Vault */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-sans font-bold text-white/80 uppercase tracking-wider font-mono">
              Environment Variable & Secret Vault
            </label>
            <span className="flex items-center gap-1 text-[10px] font-mono text-white/60">
              <ShieldCheck className="w-3 h-3" />
              <span>In-Memory Injection</span>
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/40">Injected into all PTY spawns</span>
        </div>

        {/* Quick Add Chips */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3 p-2.5 bg-white/[0.02] border border-white/10 rounded-xl backdrop-blur-md">
          <span className="text-[11px] text-white/40 font-mono">Quick add:</span>
          {QUICK_VAULT_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleQuickAdd(k)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-[10px] font-mono transition-colors cursor-pointer"
            >
              + {k}
            </button>
          ))}
        </div>

        {/* Existing keys list */}
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {Object.keys(envVars).length === 0 ? (
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center text-xs text-white/40 font-mono">
              No custom environment variables stored. Add API keys or secrets below.
            </div>
          ) : (
            Object.entries(envVars).map(([k, v]) => {
              const isRevealed = revealedKeys[k];
              const isSecret = k.includes('KEY') || k.includes('SECRET') || k.includes('TOKEN');
              return (
                <div
                  key={k}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10"
                >
                  <Key className="w-3.5 h-3.5 text-white/60 shrink-0" />
                  <span className="text-xs font-mono font-bold text-white/80 shrink-0 min-w-[140px] truncate">
                    {k}
                  </span>

                  <input
                    type={isSecret && !isRevealed ? 'password' : 'text'}
                    value={v}
                    onChange={(e) =>
                      setEnvVars({
                        ...envVars,
                        [k]: e.target.value,
                      })
                    }
                    placeholder="Enter secret value..."
                    className="flex-1 bg-transparent border-0 text-xs font-mono text-white/90 focus:outline-none focus:text-white"
                  />

                  {isSecret && (
                    <button
                      type="button"
                      onClick={() => toggleReveal(k)}
                      title={isRevealed ? 'Hide secret' : 'Reveal secret'}
                      className="p-1 rounded text-white/40 hover:text-white transition-colors"
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopyValue(k, v)}
                    title="Copy value"
                    className="p-1 rounded text-white/40 hover:text-white transition-colors"
                  >
                    {copiedKey === k ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveEnv(k)}
                    className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Add Key/Value Input Row */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="VARIABLE_NAME (e.g. ANTHROPIC_API_KEY)"
            className="flex-1 bg-black/40 border border-white/10 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white/80 placeholder:text-white/30 focus:outline-none"
          />
          <input
            type="password"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            placeholder="Value / Secret"
            className="flex-1 bg-black/40 border border-white/10 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white/80 placeholder:text-white/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddEnv}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white hover:bg-white/90 text-black text-xs font-sans font-bold shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Secret</span>
          </button>
        </div>
      </div>
    </div>
  );
};