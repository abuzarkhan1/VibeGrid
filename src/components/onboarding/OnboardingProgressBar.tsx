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
    <div className="w-full border-b border-[#4a4b50] bg-[#111111] py-3.5 px-4 sm:px-6 select-none font-sans">
      <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = s.id === currentStep;
          const isPast = idx < stepIdx;

          return (
            <React.Fragment key={s.id}>
              <button
                type="button"
                disabled={(!isPast && !isActive) || s.id === 'splash'}
                onClick={() => onStepClick && onStepClick(s.id)}
                className={`flex items-center gap-2 group transition-all ${
                  isActive
                    ? 'text-white font-semibold'
                    : isPast && s.id !== 'splash'
                    ? 'text-[#5683da] hover:text-white cursor-pointer active:scale-95'
                    : 'text-[#a9a9aa] cursor-default'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all ${
                    isActive || isPast
                      ? 'bg-[#5683da] text-white border-[#5683da] font-bold shadow-sm'
                      : 'bg-[#303236] text-[#a9a9aa] border-[#4a4b50]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs hidden sm:inline">{s.label}</span>
              </button>

              {/* Connector Line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-3 rounded-full transition-all ${
                    idx < stepIdx ? 'bg-[#5683da]' : 'bg-[#303236]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
