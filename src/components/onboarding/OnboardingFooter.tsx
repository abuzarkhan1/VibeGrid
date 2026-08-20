import React from 'react';
import { OnboardingStep } from '@/types/onboarding';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { ArrowLeft, ArrowRight, Rocket, Loader2, FastForward } from 'lucide-react';

interface OnboardingFooterProps {
  currentStep?: OnboardingStep;
}

export const OnboardingFooter: React.FC<OnboardingFooterProps> = ({ currentStep: propCurrentStep }) => {
  const storeStep = useOnboardingStore((s) => s.currentStep);
  const currentStep = propCurrentStep || storeStep;

  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const skipToDefault = useOnboardingStore((s) => s.skipToDefault);
  const completeAndLaunch = useOnboardingStore((s) => s.completeAndLaunch);
  const isLaunching = useOnboardingStore((s) => s.isLaunching);

  if (currentStep === 'splash') {
    return null;
  }

  const isFinalStep = currentStep === 'customizer';

  return (
    <div className="w-full border-t border-[#4a4b50] bg-[#111111] mt-auto">
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto py-3.5 px-4 sm:px-6 font-sans select-none">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevStep}
            className="rounded-full bg-[#303236] hover:bg-[#303236]/80 border border-[#4a4b50] text-xs px-4 py-1.5 flex items-center gap-1.5 text-[#a9a9aa] hover:text-white font-medium cursor-pointer transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={skipToDefault}
            aria-label="Skip to Default"
            className="rounded-full bg-[#303236] hover:bg-[#303236]/80 border border-[#4a4b50] text-xs px-4 py-1.5 flex items-center gap-1.5 text-[#a9a9aa] hover:text-white font-medium cursor-pointer transition-all active:scale-95"
          >
            <FastForward className="w-3 h-3" />
            <span>Skip to Default</span>
          </button>
        </div>

        <div>
          {isFinalStep ? (
            <button
              type="button"
              onClick={completeAndLaunch}
              disabled={isLaunching}
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#5683da] hover:bg-[#5683da]/90 text-white font-medium text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Spawning Agents & Workspace...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>Launch Workspace</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#5683da] hover:bg-[#5683da]/90 text-white font-medium text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
