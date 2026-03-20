import { useRef, useState, useCallback, useEffect } from 'react';
import { useSchoolProfileStore } from '../../features/school-profile/store.ts';
import ProgressBar from './ProgressBar.tsx';
import NavigationButtons from './NavigationButtons.tsx';
import WizardStep1, { type WizardStepRef } from '../../features/school-profile/components/WizardStep1.tsx';
import WizardStep2 from '../../features/school-profile/components/WizardStep2.tsx';
import WizardStep3 from '../../features/school-profile/components/WizardStep3.tsx';
import WizardStep4 from '../../features/school-profile/components/WizardStep4.tsx';

const TOTAL_STEPS = 4;

export default function WizardShell() {
  const { currentStep, setCurrentStep } = useSchoolProfileStore();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const stepRef = useRef<WizardStepRef>(null);
  const wizardRef = useRef<HTMLDivElement>(null);

  // Scroll to top of wizard on step change
  useEffect(() => {
    wizardRef.current?.scrollIntoView?.({ behavior: 'instant', block: 'start' });
  }, [currentStep]);

  const handleNext = useCallback(async () => {
    if (!stepRef.current) return;

    const isValid = await stepRef.current.submit();
    if (!isValid) return;

    // Mark current step as completed
    setCompletedSteps((prev) =>
      prev.includes(currentStep) ? prev : [...prev, currentStep],
    );

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
    // If last step, "Bekijk resultaten" - Phase 2 will handle this
  }, [currentStep, setCurrentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, setCurrentStep]);

  const handleStepClick = useCallback(
    (step: number) => {
      if (completedSteps.includes(step)) {
        setCurrentStep(step);
      }
    },
    [completedSteps, setCurrentStep],
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WizardStep1 ref={stepRef} />;
      case 1:
        return <WizardStep2 ref={stepRef} />;
      case 2:
        return <WizardStep3 ref={stepRef} />;
      case 3:
        return <WizardStep4 ref={stepRef} />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={wizardRef}
      className="bg-white rounded-xl shadow-sm max-w-[720px] mx-auto py-12 px-8"
    >
      <ProgressBar
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {renderStep()}

      <NavigationButtons
        currentStep={currentStep}
        onBack={handleBack}
        onNext={handleNext}
        nextDisabled={false}
        isLastStep={currentStep === TOTAL_STEPS - 1}
      />
    </div>
  );
}
