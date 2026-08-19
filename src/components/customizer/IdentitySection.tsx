import React from 'react';
import { useCustomizationStore } from '@/store/useCustomizationStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import {
  Wand2,
  Folder,
  Check,
  Bot,
  BrainCircuit,
  Terminal,
  Cpu,
  Code,
  Sparkles,
  Zap,
  Layers,
  Globe,
  Activity,
  Server,
  Shield,
  Workflow,
  Rocket,
  Coffee,
  Compass,
  Boxes,
  Database,
  Flame,
  Layout,
  FileCode,
} from 'lucide-react';
import { WorkspaceIconConfig } from '@/types/customization';

const VECTOR_ICON_CATEGORIES = [
  {
    name: 'AI & Intelligence',
    items: [
      { id: 'Bot', icon: Bot, label: 'Agent Bot' },
      { id: 'BrainCircuit', icon: BrainCircuit, label: 'Neural / Reasoning' },
      { id: 'Sparkles', icon: Sparkles, label: 'AI Magic' },
      { id: 'Zap', icon: Zap, label: 'Fast Inference' },
      { id: 'Cpu', icon: Cpu, label: 'Compute Unit' },
      { id: 'Activity', icon: Activity, label: 'Monitor' },
    ],
  },
  {
    name: 'Development & Terminal',
    items: [
      { id: 'Terminal', icon: Terminal, label: 'Terminal' },
      { id: 'Code', icon: Code, label: 'Codebase' },
      { id: 'FileCode', icon: FileCode, label: 'Source File' },
      { id: 'Rocket', icon: Rocket, label: 'Deployment' },
      { id: 'Flame', icon: Flame, label: 'Hot Reload' },
      { id: 'Workflow', icon: Workflow, label: 'Workflow Pipeline' },
    ],
  },
  {
    name: 'Infrastructure & Cloud',
    items: [
      { id: 'Globe', icon: Globe, label: 'Web Server' },
      { id: 'Server', icon: Server, label: 'Backend Host' },
      { id: 'Database', icon: Database, label: 'Database' },
      { id: 'Shield', icon: Shield, label: 'Security Vault' },
      { id: 'Boxes', icon: Boxes, label: 'Microservices' },
      { id: 'Layers', icon: Layers, label: 'Full Stack' },
    ],
  },
  {
    name: 'Workspace & Vibe',
    items: [
      { id: 'Folder', icon: Folder, label: 'Project Root' },
      { id: 'Layout', icon: Layout, label: 'Grid Matrix' },
      { id: 'Compass', icon: Compass, label: 'Navigator' },
      { id: 'Coffee', icon: Coffee, label: 'Vibe Dev' },
    ],
  },
];

const renderVectorIcon = (val: string, className = 'w-6 h-6') => {
  switch (val) {
    case 'Bot': return <Bot className={className} />;
    case 'BrainCircuit': return <BrainCircuit className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Cpu': return <Cpu className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'Terminal': return <Terminal className={className} />;
    case 'Code': return <Code className={className} />;
    case 'FileCode': return <FileCode className={className} />;
    case 'Rocket': return <Rocket className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Workflow': return <Workflow className={className} />;
    case 'Globe': return <Globe className={className} />;
    case 'Server': return <Server className={className} />;
    case 'Database': return <Database className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Boxes': return <Boxes className={className} />;
    case 'Layers': return <Layers className={className} />;
    case 'Layout': return <Layout className={className} />;
    case 'Compass': return <Compass className={className} />;
    case 'Coffee': return <Coffee className={className} />;
    case 'Folder': return <Folder className={className} />;
    default:
      return <Bot className={className} />;
  }
};

const COLOR_RINGS = [
  { hex: '#8B5CF6', label: 'VibeGrid Violet' },
  { hex: '#3c95f0', label: 'Electric Azure' },
  { hex: '#06b6d4', label: 'Cyber Cyan' },
  { hex: '#4ADE80', label: 'Matrix Emerald' },
  { hex: '#a855f7', label: 'Synthwave Purple' },
  { hex: '#ec4899', label: 'Neon Pink' },
  { hex: '#f59e0b', label: 'Solar Amber' },
  { hex: '#F87171', label: 'Laser Rose' },
  { hex: '#84cc16', label: 'Acid Lime' },
  { hex: '#ffffff', label: 'Pure White' },
];

export const IdentitySection: React.FC = () => {
  const onboardingIsOpen = useOnboardingStore((s) => s.isOpen);
  const onboardingWorkspaceName = useOnboardingStore((s) => s.workspaceName);
  const onboardingWorkspaceEmoji = useOnboardingStore((s) => s.workspaceEmoji);
  const onboardingWorkspaceCwd = useOnboardingStore((s) => s.workspaceCwd);

  const customizerWorkspaceName = useCustomizationStore((s) => s.workspaceName);
  const customizerWorkspaceIcon = useCustomizationStore((s) => s.workspaceIcon);
  const colorRingHex = useCustomizationStore((s) => s.colorRingHex);
  const defaultCwd = useCustomizationStore((s) => s.defaultCwd);
  const setCustomizerWorkspaceName = useCustomizationStore((s) => s.setWorkspaceName);
  const setCustomizerWorkspaceIcon = useCustomizationStore((s) => s.setWorkspaceIcon);
  const setColorRingHex = useCustomizationStore((s) => s.setColorRingHex);

  const effectiveWorkspaceName = onboardingIsOpen ? onboardingWorkspaceName : customizerWorkspaceName;
  const effectiveWorkspaceIcon = onboardingIsOpen
    ? { type: 'emoji' as const, value: onboardingWorkspaceEmoji || '⚡' }
    : customizerWorkspaceIcon;
  const effectiveCwd = defaultCwd || (onboardingIsOpen ? onboardingWorkspaceCwd : '');

  const handleNameChange = (newName: string) => {
    setCustomizerWorkspaceName(newName);
    useOnboardingStore.getState().setWorkspaceIdentity(newName, effectiveWorkspaceIcon.value, effectiveCwd);
  };

  const handleIconChange = (icon: WorkspaceIconConfig) => {
    setCustomizerWorkspaceIcon(icon);
    useOnboardingStore.getState().setWorkspaceIdentity(effectiveWorkspaceName, icon.value, effectiveCwd);
  };

  const handleAutoDetectName = () => {
    if (effectiveCwd) {
      const parts = effectiveCwd.split(/[/\\]/).filter(Boolean);
      const folderName = parts.pop();
      if (folderName) {
        const formatted = folderName
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        handleNameChange(formatted);
        return;
      }
    }
    const suggestions = [
      'Autonomous Agent Hub',
      'Fullstack AI Studio',
      'Deep Reasoning Matrix',
      'Production CLI Grid',
      'Vibe Engineering Lab',
    ];
    const pick = suggestions[Math.floor(Math.random() * suggestions.length)];
    handleNameChange(pick);
  };

  return (
    <div className="space-y-6 text-white/90 font-sans">
      {}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-black/40 border-2 transition-all duration-300 shadow-lg text-white/90"
            style={{
              borderColor: colorRingHex,
              boxShadow: `0 0 20px ${colorRingHex}30`,
            }}
          >
            {renderVectorIcon(effectiveWorkspaceIcon.value, 'w-6 h-6')}
            <span
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black"
              style={{ backgroundColor: colorRingHex }}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans font-bold text-base text-white/90">
                {effectiveWorkspaceName || 'Untitled Workspace'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
                Active Identity
              </span>
            </div>
            <p className="text-xs text-white/40 font-sans mt-0.5 flex items-center gap-1.5">
              <Folder className="w-3 h-3 text-white/40" />
              <span className="font-mono truncate max-w-sm">
                {effectiveCwd || 'Default Session Root'}
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAutoDetectName}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-all cursor-pointer"
          title="Auto-detect workspace name from project folder"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Auto-Detect Name</span>
        </button>
      </div>

      {/* Workspace Name Input */}
      <div>
        <label className="text-xs font-sans font-bold text-white/80 uppercase tracking-wider block mb-2 font-mono">
          Workspace Name
        </label>
        <div className="relative">
          <input
            type="text"
            value={effectiveWorkspaceName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Fullstack AI Agent Lab"
            className="w-full bg-black/40 border border-white/10 focus:border-white/40 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Vector Emblem Badge Picker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-sans font-bold text-white/80 uppercase tracking-wider block font-mono">
            Workspace Emblem / Badge
          </label>
          <span className="text-[10px] font-mono text-white/40">
            Professional vector icons rendered in sidebar & status bar
          </span>
        </div>

        <div className="space-y-4 p-4 bg-white/[0.02] border border-white/10 rounded-xl backdrop-blur-md">
          {VECTOR_ICON_CATEGORIES.map((category) => (
            <div key={category.name}>
              <div className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-wider mb-2">
                {category.name}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isSelected = effectiveWorkspaceIcon.value === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleIconChange({ type: 'lucide', value: item.id })}
                      title={item.label}
                      aria-label={item.label}
                      className={`h-11 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white/15 border-2 border-white/80 scale-105 text-white shadow-sm'
                          : 'bg-white/[0.02] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[9px] font-mono truncate max-w-[50px]">{item.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Color Identity Ring Swatches */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-sans font-bold text-white/80 uppercase tracking-wider block font-mono">
            Color Identity Ring
          </label>
          <span className="text-xs font-mono text-white/60">{colorRingHex}</span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap p-3 bg-white/[0.02] border border-white/10 rounded-xl backdrop-blur-md">
          {COLOR_RINGS.map((ring) => (
            <button
              key={ring.hex}
              type="button"
              onClick={() => setColorRingHex(ring.hex)}
              title={ring.label}
              className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                colorRingHex.toLowerCase() === ring.hex.toLowerCase()
                  ? 'scale-110 border-white shadow-[0_0_12px_rgba(255,255,255,0.5)]'
                  : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: ring.hex }}
            >
              {colorRingHex.toLowerCase() === ring.hex.toLowerCase() && (
                <Check className="w-4 h-4 text-black drop-shadow" />
              )}
            </button>
          ))}

          {/* Custom Color Input */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
            <input
              type="color"
              value={colorRingHex.startsWith('#') ? colorRingHex : '#8B5CF6'}
              onChange={(e) => setColorRingHex(e.target.value)}
              className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-0"
              title="Custom Hex Color"
            />
            <span className="text-[10px] font-mono text-white/60 uppercase">Custom</span>
          </div>
        </div>
      </div>
    </div>
  );
};
