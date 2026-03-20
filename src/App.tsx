import { useState, useCallback } from 'react';
import WizardShell from './components/wizard/WizardShell.tsx';
import { PriceComparisonPage } from './features/price-comparison/PriceComparisonPage.tsx';
import { useSchoolProfileStore } from './features/school-profile/store.ts';

export default function App() {
  const [view, setView] = useState<'wizard' | 'comparison'>('wizard');
  const scenario = useSchoolProfileStore((s) => s.scenario);

  const handleWizardComplete = useCallback(() => {
    if (scenario === 'A') {
      setView('comparison');
    }
  }, [scenario]);

  const handleBackToWizard = useCallback(() => {
    setView('wizard');
  }, []);

  if (view === 'comparison') {
    return (
      <div className="min-h-screen bg-cito-bg">
        <PriceComparisonPage onBack={handleBackToWizard} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cito-bg">
      <main className="mx-auto max-w-[720px] py-16 px-8">
        <h1 className="text-[28px] font-semibold leading-[1.2] text-cito-primary">
          Rekentool VO
        </h1>
        <p className="mt-2 text-base text-neutral-500 mb-8">
          Vergelijk toetsaanbieders voor uw school
        </p>

        <WizardShell onComplete={handleWizardComplete} />
      </main>
    </div>
  );
}
