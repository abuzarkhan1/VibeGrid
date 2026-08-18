import React, { useEffect } from 'react';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { OnboardingProgressBar } from './OnboardingProgressBar';
import { OnboardingFooter } from './OnboardingFooter';
import { CinematicSplashScreen } from '@/components/splash/CinematicSplashScreen';
import { LayoutStudio } from '@/components/layout-studio/LayoutStudio';
import { AgentLauncher } from '@/components/agent-launcher/AgentLauncher';
import { WorkspaceCustomizer } from '@/components/customizer/WorkspaceCustomizer';

export const OnboardingWizard: React.FC = () => {
  const isOpen = useOnboardingStore((s) => s.isOpen);
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const setStep = useOnboardingStore((s) => s.setStep);
  const skipToDefault = useOnboardingStore((s) => s.skipToDefault);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && currentStep !== 'splash') {
        e.preventDefault();
        skipToDefault();
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
      aria-label="Codex Grid Setup & Onboarding Wizard"
      className={
        currentStep === 'splash'
          ? 'fixed inset-0 z-50 overflow-hidden'
          : // Pure Black overlay with heavy blur for the background
            'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-fade-in font-sans select-none overflow-hidden'
      }
    >
      {currentStep === 'splash' ? (
        renderStepContent()
      ) : (
        // Main Onboarding Glass Panel (Pure Black Stealth Glass)
        <div className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[850px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Step Progress Bar Top Header */}
          <OnboardingProgressBar />

          {/* Dynamic Wizard Body Content */}
          {/* Removed bg-black/20 so the main container's glass blur shows through seamlessly */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 custom-scrollbar">
            {renderStepContent()}
          </div>

          {/* Wizard Navigation Footer */}
          <OnboardingFooter />
        </div>
      )}
    </div>
  );
};