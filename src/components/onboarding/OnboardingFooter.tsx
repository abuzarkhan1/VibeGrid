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
    <div className="flex items-center justify-between w-full max-w-4xl mx-auto py-3.5 px-6 border-t border-white/10 mt-auto font-sans select-none bg-black/20">
      {/* Left: Back & Skip */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={prevStep}
          className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs px-3.5 py-1.5 flex items-center gap-1.5 text-white/70 hover:text-white/90 text-xs font-medium cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={skipToDefault}
          aria-label="Skip to Default"
          className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-xs px-3.5 py-1.5 flex items-center gap-1.5 text-white/40 hover:text-white/90 text-xs font-medium cursor-pointer"
        >
          <FastForward className="w-3 h-3" />
          <span>Skip to Default</span>
        </button>
      </div>

      {/* Right: Next or Launch */}
      <div>
        {isFinalStep ? (
          <button
            type="button"
            onClick={completeAndLaunch}
            disabled={isLaunching}
            className="flex items-center gap-2 px-6 py-2 rounded-full bg-violet-500 hover:bg-violet-500/90 text-white font-semibold text-xs shadow-none transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 cursor-pointer"
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
            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-violet-500 hover:bg-violet-500/90 text-white font-semibold text-xs shadow-none transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
