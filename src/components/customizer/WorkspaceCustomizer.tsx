import React from 'react';
import { IdentitySection } from './IdentitySection';
import { DirectorySelector } from './DirectorySelector';
import { AppearanceStaging } from './AppearanceStaging';
import { Palette } from 'lucide-react';

export const WorkspaceCustomizer: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 w-full max-w-4xl mx-auto py-1 select-none">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2 text-violet-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
          <Palette className="w-4 h-4" />
          <span className="px-2 py-0.5 rounded-md bg-violet-400/10 border border-violet-400/20 text-[11px] text-violet-400 font-mono">CUSTOMIZE</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white/90 tracking-tight font-sans">
          Workspace Studio & Styling
        </h2>
        <p className="text-xs text-white/70 mt-1 font-sans">
          Configure workspace metadata, project root CWD, and terminal theme.
        </p>
      </div>

      <IdentitySection />
      <DirectorySelector />
      <AppearanceStaging />
    </div>
  );
};
