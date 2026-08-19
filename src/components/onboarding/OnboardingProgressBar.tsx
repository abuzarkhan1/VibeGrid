import React from 'react';
import { OnboardingStep } from '@/types/onboarding';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { Sparkles, LayoutGrid, Bot, Palette } from 'lucide-react';

interface OnboardingProgressBarProps {
  currentStep?: OnboardingStep;
  onStepClick?: (step: OnboardingStep) => void;
}

interface StepMeta {
  id: OnboardingStep;
  label: string;
  icon: React.ElementType;
}

const STEPS: StepMeta[] = [
  { id: 'splash', label: 'Welcome', icon: Sparkles },
  { id: 'layout', label: 'Layout Studio', icon: LayoutGrid },
  { id: 'agents', label: 'AI Agents', icon: Bot },
  { id: 'customizer', label: 'Customization', icon: Palette },
];

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
  currentStep: propCurrentStep,
  onStepClick: propOnStepClick,
}) => {
  const storeStep = useOnboardingStore((s) => s.currentStep);
  const setStep = useOnboardingStore((s) => s.setStep);
  const currentStep = propCurrentStep || storeStep;
  const onStepClick = propOnStepClick || setStep;

  const stepIdx = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto py-3 px-4 border-b border-white/10 bg-black/20 font-sans select-none">
      {STEPS.map((s, idx) => {
        const Icon = s.icon;
        const isActive = s.id === currentStep;
        const isPast = idx < stepIdx;

        return (
          <React.Fragment key={s.id}>
            {}
            <button
              type="button"
              disabled={(!isPast && !isActive) || s.id === 'splash'}
              onClick={() => onStepClick && onStepClick(s.id)}
              className={`flex items-center gap-2 group transition-all ${
                isActive
                  ? 'text-white/90'
                  : isPast && s.id !== 'splash'
                  ? 'text-violet-400 hover:text-white cursor-pointer'
                  : 'text-white/40 cursor-default'
              }`}
            >
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-violet-500 text-white border-violet-400/80 font-bold shadow-none'
                    : isPast
                    ? 'bg-violet-500/20 text-violet-400 border-violet-400/40'
                    : 'bg-white/[0.03] text-white/40 border border-white/[0.06]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
            </button>

            {/* Connector Line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-3 rounded transition-all ${
                  idx < stepIdx ? 'bg-violet-500' : 'bg-white/10'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
