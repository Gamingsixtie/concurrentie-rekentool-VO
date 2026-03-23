import { useMemo } from 'react';
import { useSchoolProfileStore } from '../store';
import { PriceComparisonPage } from '@/features/price-comparison/PriceComparisonPage';
import { CurrentVsProposedPage } from '@/features/price-comparison/CurrentVsProposedPage';
import { MigrationPage } from '@/features/price-comparison/MigrationPage';
import { detectScenario } from '@/engine/scenario-detection';

export default function ComparisonTab() {
  const scenario = useSchoolProfileStore((s) => s.scenario);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);

  // Fallback: auto-detect scenario from moduleSetups when not explicitly set
  const effectiveScenario = useMemo(() => {
    if (scenario) return scenario;
    if (moduleSetups.length === 0) return null;
    return detectScenario(moduleSetups).recommended;
  }, [scenario, moduleSetups]);

  // Check if there's anything to compare
  if (!effectiveScenario || selectedModules.length === 0) {
    return (
      <div className="p-8 max-sm:p-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
          <p className="text-[16px] text-neutral-500">
            Geen vergelijking beschikbaar. Vul eerst het schoolprofiel aan via de Overzicht-tab.
          </p>
        </div>
      </div>
    );
  }

  // Determine which existing page to render based on scenario and module setups
  const hasProviderSetups = moduleSetups.some(
    (setup) => setup.currentProvider !== 'geen',
  );

  if (effectiveScenario === 'B' && hasProviderSetups) {
    return <MigrationPage />;
  }

  if (effectiveScenario === 'A' && hasProviderSetups) {
    return <CurrentVsProposedPage />;
  }

  // Scenario A without provider setups: market comparison
  return <PriceComparisonPage />;
}
