import React from 'react';
import { IdentitySection } from './IdentitySection';
import { DirectoryEnvSection } from './DirectoryEnvSection';
import { ThemeStudioSection } from './ThemeStudioSection';
import { Palette } from 'lucide-react';

export const WorkspaceCustomizer: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 w-full max-w-4xl mx-auto py-1 select-none">
      {}
      <div>
        <div className="flex items-center gap-2 text-[#a9a9aa] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
          <Palette className="w-4 h-4 text-[#5683da]" />
          <span className="px-2.5 py-0.5 rounded-full bg-[#303236] border border-[#4a4b50] text-[11px] text-[#5683da] font-mono font-medium">CUSTOMIZE</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">
          Workspace Studio & Styling
        </h2>
        <p className="text-xs text-[#a9a9aa] mt-1 font-sans">
          Configure workspace identity, directory, and theme.
        </p>
      </div>

      <IdentitySection />
      <DirectoryEnvSection />
      <ThemeStudioSection />
    </div>
  );
};
