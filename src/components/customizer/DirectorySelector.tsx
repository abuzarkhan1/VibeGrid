import React from 'react';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useCustomizationStore } from '@/store/useCustomizationStore';
import { Folder, FolderOpen } from 'lucide-react';
import { isTauri } from '@/lib/tauri';

export const DirectorySelector: React.FC = () => {
  const workspaceName = useOnboardingStore((s) => s.workspaceName);
  const workspaceEmoji = useOnboardingStore((s) => s.workspaceEmoji);
  const workspaceCwd = useOnboardingStore((s) => s.workspaceCwd);
  const setWorkspaceIdentity = useOnboardingStore((s) => s.setWorkspaceIdentity);

  const handlePickFolder = async () => {
    if (isTauri()) {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          directory: true,
          multiple: false,
          title: 'Select Project Working Directory',
        });
        if (typeof selected === 'string') {
          let suggestedName = workspaceName;
          const folderName = selected.split(/[/\\]/).filter(Boolean).pop();
          if (folderName && (workspaceName === 'AI Command Center' || !workspaceName.trim())) {
            suggestedName = folderName;
          }
          setWorkspaceIdentity(suggestedName, workspaceEmoji, selected);
          useCustomizationStore.getState().setDefaultCwd(selected);
        }
      } catch (err) {
        console.warn('[VibeGrid] Folder pick dialog error:', err);
      }
    }
  };

  const handleCwdChange = (newCwd: string) => {
    setWorkspaceIdentity(workspaceName, workspaceEmoji, newCwd);
    useCustomizationStore.getState().setDefaultCwd(newCwd);
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center gap-2 text-xs font-semibold text-white/90 uppercase tracking-wider font-mono">
        <Folder className="w-4 h-4 text-violet-400" />
        <span>Working Directory (CWD)</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={workspaceCwd}
            onChange={(e) => handleCwdChange(e.target.value)}
            placeholder="Default to session directory (or browse project root)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1B26] border border-white/10 text-white/90 text-xs font-mono placeholder:text-white/40 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-accent-primary/40 transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={handlePickFolder}
          className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] flex items-center gap-1.5 text-white/70 hover:text-white/90 text-xs cursor-pointer"
        >
          <FolderOpen className="w-4 h-4 text-violet-400" />
          <span>Browse</span>
        </button>
      </div>
    </div>
  );
};
