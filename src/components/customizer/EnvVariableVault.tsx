import React, { useState } from 'react';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { Key, Plus, Trash2, ShieldCheck } from 'lucide-react';

const COMMON_KEYS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'DEEPSEEK_API_KEY',
  'GEMINI_API_KEY',
  'GITHUB_TOKEN',
];

export const EnvVariableVault: React.FC = () => {
  const workspaceEnv = useOnboardingStore((s) => s.workspaceEnv);
  const setWorkspaceEnv = useOnboardingStore((s) => s.setWorkspaceEnv);

  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  const handleAdd = () => {
    if (!newKey.trim()) return;
    setWorkspaceEnv({
      ...workspaceEnv,
      [newKey.trim()]: newVal.trim(),
    });
    setNewKey('');
    setNewVal('');
  };

  const handleRemove = (keyToRemove: string) => {
    const updated = { ...workspaceEnv };
    delete updated[keyToRemove];
    setWorkspaceEnv(updated);
  };

  const handleQuickAdd = (keyName: string) => {
    if (!workspaceEnv[keyName]) {
      setWorkspaceEnv({
        ...workspaceEnv,
        [keyName]: '',
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-zinc-900/60 border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
          <Key className="w-4 h-4 text-emerald-400" />
          <span>Environment & API Keys Vault</span>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Injected to spawned PTYs</span>
        </span>
      </div>

      {/* Quick Add Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-zinc-400">Quick add:</span>
        {COMMON_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => handleQuickAdd(k)}
            className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px] font-mono border border-white/5 transition-colors"
          >
            + {k}
          </button>
        ))}
      </div>

      {/* Existing entries */}
      <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
        {Object.entries(workspaceEnv).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={k}
              className="w-1/2 px-2.5 py-1.5 rounded-lg bg-zinc-950/80 border border-white/10 text-xs font-mono text-zinc-300"
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
              placeholder="Value / Secret..."
              className="w-1/2 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => handleRemove(k)}
              className="p-1.5 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Key-Value Row */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="VARIABLE_NAME"
          className="w-1/2 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
        />
        <input
          type="password"
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          placeholder="Secret value..."
          className="w-1/2 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-colors"
          title="Add environment variable"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
