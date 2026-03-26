import { useMemo } from 'react';
import { useSchoolProfileStore } from '../school-profile/store';
import { usePriceComparisonStore } from './store';
import { MODULE_DIFFERENTIATORS } from '@/data/differentiators';
import { MODULE_CATALOG } from '@/models/modules';
import { PROVIDER_LABELS } from '@/engine/price-comparison';
import type { ProviderKey } from '@/engine/price-comparison';
import { calculateMigration } from '@/engine/migration';
import { CITO_MIGRATION_PRICES } from '@/data/cito-migration-prices';
import { TimeSavingsSection } from '../school-profile/components/TimeSavingsSection';
import { updateSchoolData } from '@/db/operations';

// ─── Provider colors (reuse from page) ──────────────────────────────────────

const PROVIDER_COLORS: Record<ProviderKey, string> = {
  cito: 'text-[#003082]',
  dia: 'text-[#FF6600]',
  jij: 'text-[#22C55E]',
  saqi: 'text-[#8B5CF6]',
};

// ─── Differentiators per module ─────────────────────────────────────────────

function DifferentiatorsSection() {
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const visibleProviders = usePriceComparisonStore((s) => s.visibleProviders);

  const competitors = visibleProviders.filter((p) => p !== 'cito');

  const moduleDiffs = useMemo(
    () =>
      selectedModules
        .map((moduleId) => {
          const diff = MODULE_DIFFERENTIATORS.find((d) => d.moduleId === moduleId);
          const moduleDef = MODULE_CATALOG.find((m) => m.id === moduleId);
          if (!diff || !moduleDef) return null;

          // Only include if Cito has differentiators for this module
          if (diff.cito.length === 0) return null;

          return {
            moduleId,
            moduleName: moduleDef.name,
            citoAdvantages: diff.cito,
            competitorAdvantages: competitors
              .filter((p) => diff[p].length > 0)
              .map((p) => ({
                provider: p,
                advantages: diff[p],
              })),
          };
        })
        .filter(Boolean),
    [selectedModules, competitors],
  );

  if (moduleDiffs.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-900 mb-3">
        Cito voordelen per module
      </h3>
      <div className="space-y-3">
        {moduleDiffs.map((mod) => (
          <div
            key={mod!.moduleId}
            className="rounded-lg border border-neutral-200 p-4"
          >
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">
              {mod!.moduleName}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cito voordelen */}
              <div>
                <div className="text-xs font-semibold text-[#003082] mb-2 uppercase tracking-wide">
                  {PROVIDER_LABELS.cito}
                </div>
                <ul className="space-y-1.5">
                  {mod!.citoAdvantages.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-neutral-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="text-green-600 flex-shrink-0 mt-0.5"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Concurrent voordelen */}
              {mod!.competitorAdvantages.map((comp) => (
                <div key={comp.provider}>
                  <div
                    className={`text-xs font-semibold mb-2 uppercase tracking-wide ${PROVIDER_COLORS[comp.provider]}`}
                  >
                    {PROVIDER_LABELS[comp.provider]}
                  </div>
                  <ul className="space-y-1.5">
                    {comp.advantages.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-neutral-600"
                      >
                        <span className="text-neutral-300 flex-shrink-0 mt-0.5">
                          &bull;
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tijdwinst sectie (interactief) ─────────────────────────────────────────

function ComparisonTimeSavings() {
  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const migrationHourlyRate = usePriceComparisonStore(
    (s) => s.migrationHourlyRate,
  );
  const migrationTimeSavingOverrides = usePriceComparisonStore(
    (s) => s.migrationTimeSavingOverrides,
  );
  const customTimeSavingTasks = usePriceComparisonStore(
    (s) => s.customTimeSavingTasks,
  );
  const hiddenTimeSavingTaskIds = usePriceComparisonStore(
    (s) => s.hiddenTimeSavingTaskIds,
  );
  const setMigrationHourlyRate = usePriceComparisonStore(
    (s) => s.setMigrationHourlyRate,
  );
  const setMigrationTimeSavingOverride = usePriceComparisonStore(
    (s) => s.setMigrationTimeSavingOverride,
  );
  const addCustomTimeSavingTask = usePriceComparisonStore(
    (s) => s.addCustomTimeSavingTask,
  );
  const removeCustomTimeSavingTask = usePriceComparisonStore(
    (s) => s.removeCustomTimeSavingTask,
  );
  const updateCustomTimeSavingTask = usePriceComparisonStore(
    (s) => s.updateCustomTimeSavingTask,
  );
  const toggleHiddenTimeSavingTask = usePriceComparisonStore(
    (s) => s.toggleHiddenTimeSavingTask,
  );

  const migrationResult = useMemo(
    () =>
      calculateMigration(
        selectedModules,
        studentCounts,
        CITO_MIGRATION_PRICES,
        migrationTimeSavingOverrides,
        migrationHourlyRate,
        0,
        customTimeSavingTasks,
        hiddenTimeSavingTaskIds,
      ),
    [selectedModules, studentCounts, migrationTimeSavingOverrides, migrationHourlyRate, customTimeSavingTasks, hiddenTimeSavingTaskIds],
  );

  const handleHourlyRateChange = (rate: number | null) => {
    setMigrationHourlyRate(rate);
    if (activeSchoolId) {
      updateSchoolData(activeSchoolId, { migrationHourlyRate: rate ?? 0 });
    }
  };

  const handleHoursChange = (taskId: string, hours: number | null) => {
    setMigrationTimeSavingOverride(taskId, hours);
    if (activeSchoolId) {
      const updated = { ...migrationTimeSavingOverrides, [taskId]: hours };
      updateSchoolData(activeSchoolId, { migrationTimeSavingOverrides: updated });
    }
  };

  return (
    <TimeSavingsSection
      timeSavings={migrationResult.timeSavings}
      totalHours={migrationResult.totalTimeSavingsHours}
      totalValue={migrationResult.totalTimeSavingsValue}
      hourlyRate={migrationHourlyRate}
      hiddenTaskIds={hiddenTimeSavingTaskIds}
      customTasks={customTimeSavingTasks}
      onHoursChange={handleHoursChange}
      onHourlyRateChange={handleHourlyRateChange}
      onAddCustomTask={addCustomTimeSavingTask}
      onRemoveCustomTask={removeCustomTimeSavingTask}
      onUpdateCustomTask={updateCustomTimeSavingTask}
      onToggleHidden={toggleHiddenTimeSavingTask}
    />
  );
}

// ─── Main panel ─────────────────────────────────────────────────────────────

export function MeerwaardePanel() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-shrink-0 w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-600"
            aria-hidden="true"
          >
            <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-emerald-800">
            Meerwaarde — meer dan alleen prijs
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Kwalitatieve voordelen en tijdwinst
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* 1. Cito voordelen per module */}
        <DifferentiatorsSection />

        {/* 2. Invulbare tijdwinst */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">
            Tijdwinst Cito-platform
          </h3>
          <p className="text-xs text-neutral-500 mb-3">
            Vul samen met de klant de geschatte tijdwinst per taak in. Optioneel:
            voeg een uurtarief toe om de besparing in euro's te zien.
          </p>
          <ComparisonTimeSavings />
        </div>
      </div>
    </div>
  );
}
