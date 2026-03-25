import { useMemo, useCallback } from 'react';
import { useSchoolProfileStore } from '../store';
import { PriceComparisonPage } from '@/features/price-comparison/PriceComparisonPage';
import { CurrentVsProposedPage } from '@/features/price-comparison/CurrentVsProposedPage';
import { MigrationPage } from '@/features/price-comparison/MigrationPage';
import { detectScenario } from '@/engine/scenario-detection';
import { updateSchoolData } from '@/db/operations';
import { SCENARIO_LABELS, type Scenario } from '@/models/school';

export default function ComparisonTab() {
  const scenario = useSchoolProfileStore((s) => s.scenario);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);
  const setScenario = useSchoolProfileStore((s) => s.setScenario);

  // Fallback: auto-detect scenario from moduleSetups when not explicitly set
  const effectiveScenario = useMemo(() => {
    if (scenario) return scenario;
    if (moduleSetups.length === 0) return null;
    return detectScenario(moduleSetups).recommended;
  }, [scenario, moduleSetups]);

  // Detect what scenario would be recommended
  const detection = useMemo(
    () => moduleSetups.length > 0 ? detectScenario(moduleSetups) : null,
    [moduleSetups],
  );

  // Apply detected scenario to store + database
  const handleApplyScenario = useCallback(async (chosen: Scenario) => {
    setScenario(chosen);
    if (activeSchoolId) {
      await updateSchoolData(activeSchoolId, { scenario: chosen });
    }
  }, [setScenario, activeSchoolId]);

  // No modules selected at all
  if (selectedModules.length === 0) {
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

  // Modules exist but no scenario set — show detection prompt
  if (!effectiveScenario && detection) {
    return (
      <div className="p-8 max-sm:p-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center max-w-lg mx-auto">
          <h3 className="text-[18px] font-semibold text-neutral-900 mb-2">
            Welk type vergelijking?
          </h3>
          <p className="text-sm text-neutral-500 mb-6">
            Kies het scenario dat bij deze school past.
          </p>
          <div className="flex flex-col gap-3">
            {(['A', 'B', 'C'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleApplyScenario(s)}
                className={`text-left rounded-lg border p-4 transition-colors ${
                  detection.recommended === s
                    ? 'border-cito-primary bg-cito-primary/5 ring-2 ring-cito-primary/20'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-neutral-900">
                    {SCENARIO_LABELS[s].title}
                  </span>
                  {detection.recommended === s && (
                    <span className="text-xs bg-cito-primary/10 text-cito-primary font-semibold px-2 py-0.5 rounded-full">
                      Aanbevolen
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500 mt-1">
                  {SCENARIO_LABELS[s].description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Scenario set but no moduleSetups — fallback empty state
  if (!effectiveScenario) {
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

  // Scenario C: current Cito vs. competitor — uses the comparison page
  if (effectiveScenario === 'C' && hasProviderSetups) {
    return <PriceComparisonPage />;
  }

  if (effectiveScenario === 'B' && hasProviderSetups) {
    return <MigrationPage />;
  }

  if (effectiveScenario === 'A' && hasProviderSetups) {
    return <CurrentVsProposedPage />;
  }

  // Scenario A without provider setups: market comparison
  return <PriceComparisonPage />;
}
