import React, { useEffect, useState } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { OnboardingProgressBar } from './OnboardingProgressBar';
import { OnboardingFooter } from './OnboardingFooter';
import { CinematicSplashScreen } from '@/components/splash/CinematicSplashScreen';
import { LayoutStudio } from '@/components/studio/LayoutStudio';
import { AgentLauncher } from '@/components/agent/AgentLauncher';
import { WorkspaceCustomizer } from '@/components/customizer/WorkspaceCustomizer';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export const OnboardingWizard: React.FC = () => {
  const isOpen = useOnboardingStore((s) => s.isOpen);
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const setStep = useOnboardingStore((s) => s.setStep);
  const skipToDefault = useOnboardingStore((s) => s.skipToDefault);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const panelRef = useFocusTrap<HTMLDivElement>(isOpen && currentStep !== 'splash');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && currentStep !== 'splash') {
        e.preventDefault();
        setShowSkipConfirm(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, skipToDefault]);

  if (!isOpen) {
    return null;
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'splash':
        return <CinematicSplashScreen onComplete={() => setStep('layout')} />;
      case 'layout':
        return <LayoutStudio />;
      case 'agents':
        return <AgentLauncher />;
      case 'customizer':
        return <WorkspaceCustomizer />;
      default:
        return <CinematicSplashScreen onComplete={() => setStep('layout')} />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="VibeGrid Setup & Onboarding Wizard"
      className={
        currentStep === 'splash'
          ? 'fixed inset-0 z-50 overflow-hidden'
          : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#090a0c]/90 animate-fade-in font-sans select-none overflow-hidden text-white'
      }
    >
      {currentStep === 'splash' ? (
        renderStepContent()
      ) : (
        <div
          ref={panelRef}
          className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[850px] bg-[#111111] border border-[#4a4b50] rounded-2xl shadow-2xl overflow-hidden"
        >
          <OnboardingProgressBar />

          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 custom-scrollbar bg-[#111111]">
            {renderStepContent()}
          </div>

          <OnboardingFooter />
        </div>
      )}

      {showSkipConfirm && (
        <ConfirmModal
          title="Skip setup?"
          message="Your agent configuration won't be saved."
          confirmLabel="Skip Setup"
          isDanger={true}
          onConfirm={() => {
            setShowSkipConfirm(false);
            skipToDefault();
          }}
          onClose={() => setShowSkipConfirm(false)}
        />
      )}
    </div>
  );
};
