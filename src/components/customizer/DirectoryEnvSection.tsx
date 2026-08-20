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

          const folderName = selected.split(/[/\\]/).filter(Boolean).pop();
          if (folderName && (!workspaceName.trim() || workspaceName === 'Default Workspace')) {
            const formatted = folderName
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase());
            setWorkspaceName(formatted);
          }

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
    <div className="space-y-6 text-white font-sans select-none">
      {/* 1. Working Directory */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-sans font-bold text-white uppercase tracking-wider block font-mono">
            Working Directory (CWD)
          </label>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Folder className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5683da]" />
            <input
              type="text"
              value={defaultCwd}
              onChange={(e) => setDefaultCwd(e.target.value)}
              placeholder="e.g. /Users/abuzar/Desktop/VibeGrid"
              className="w-full bg-[#090a0c] border border-[#4a4b50] focus:border-[#5683da] focus:ring-1 focus:ring-[#5683da] rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white placeholder:text-[#a9a9aa]/40 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={handlePickFolder}
            className="px-4 py-2.5 rounded-full bg-[#303236] hover:bg-[#303236]/80 border border-[#4a4b50] flex items-center gap-1.5 text-[#a9a9aa] hover:text-white text-xs font-sans font-medium transition-colors shrink-0 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-[#5683da]" />
            <span>Browse</span>
          </button>
        </div>
      </div>

      {/* 2. Git Branch Status */}
      <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#090a0c] border border-[#4a4b50] text-[#5683da]">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans font-bold text-white">
                Git Branch: <span className="text-white font-mono">{gitBranch || 'main'}</span>
              </span>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-[#4a4b50] font-medium ${
                isGitDirty ? 'bg-[#090a0c] text-[#ff8964]' : 'bg-[#090a0c] text-[#27c93f]'
              }`}>
                {isGitDirty ? '● Uncommitted Changes' : '✓ Clean Working Tree'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setGitBranch(gitBranch === 'main' ? 'feature/agentic' : 'main', !isGitDirty)}
          className="text-xs font-mono text-[#a9a9aa] hover:text-white px-3.5 py-1.5 rounded-full bg-[#090a0c] hover:bg-[#090a0c]/80 border border-[#4a4b50] transition-colors cursor-pointer"
        >
          Rescan Git
        </button>
      </div>

      {/* 3. Environment Variable & API Key Vault */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-sans font-bold text-white uppercase tracking-wider font-mono">
              Environment Variables &amp; Secrets
            </label>
            <span className="flex items-center gap-1 text-[10px] font-mono text-[#5683da]">
              <ShieldCheck className="w-3 h-3" />
              <span>In-Memory Injection</span>
            </span>
          </div>
        </div>

        {/* Quick Add Chips */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3 p-3 bg-[#303236] border border-[#4a4b50] rounded-2xl">
          <span className="text-[11px] text-[#a9a9aa] font-mono">Quick add:</span>
          {QUICK_VAULT_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleQuickAdd(k)}
              className="px-2.5 py-1 rounded-full bg-[#090a0c] hover:bg-[#303236] border border-[#4a4b50] text-[#a9a9aa] hover:text-white text-[10px] font-mono transition-colors cursor-pointer"
            >
              + {k}
            </button>
          ))}
        </div>

        {/* Existing keys list */}
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {Object.keys(envVars).length === 0 ? (
            <div className="p-5 rounded-2xl bg-[#303236] border border-[#4a4b50] text-center text-xs text-[#a9a9aa] font-mono">
              No environment variables stored.
            </div>
          ) : (
            Object.entries(envVars).map(([k, v]) => {
              const isRevealed = revealedKeys[k];
              const isSecret = k.includes('KEY') || k.includes('SECRET') || k.includes('TOKEN');
              return (
                <div
                  key={k}
                  className="flex items-center gap-2 p-3 rounded-2xl bg-[#303236] border border-[#4a4b50]"
                >
                  <Key className="w-3.5 h-3.5 text-[#5683da] shrink-0" />
                  <span className="text-xs font-mono font-bold text-white shrink-0 min-w-[140px] truncate">
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
                    className="flex-1 bg-transparent border-0 text-xs font-mono text-white focus:outline-none focus:text-white placeholder:text-[#a9a9aa]/40"
                  />

                  {isSecret && (
                    <button
                      type="button"
                      onClick={() => toggleReveal(k)}
                      title={isRevealed ? 'Hide secret' : 'Reveal secret'}
                      className="p-1.5 rounded-full hover:bg-[#090a0c] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopyValue(k, v)}
                    title="Copy value"
                    className="p-1.5 rounded-full hover:bg-[#090a0c] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedKey === k ? (
                      <Check className="w-3.5 h-3.5 text-[#27c93f]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveEnv(k)}
                    className="p-1.5 rounded-full hover:bg-[#090a0c] text-[#a9a9aa] hover:text-[#e06c75] transition-colors cursor-pointer"
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
            className="flex-1 bg-[#090a0c] border border-[#4a4b50] focus:border-[#5683da] focus:ring-1 focus:ring-[#5683da] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-[#a9a9aa]/40 focus:outline-none"
          />
          <input
            type="password"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            placeholder="Value / Secret"
            className="flex-1 bg-[#090a0c] border border-[#4a4b50] focus:border-[#5683da] focus:ring-1 focus:ring-[#5683da] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-[#a9a9aa]/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddEnv}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#5683da] hover:bg-[#5683da]/90 text-white text-xs font-sans font-medium shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
