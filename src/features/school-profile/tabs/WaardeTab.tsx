import { useEffect, useMemo, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useSchoolProfileStore } from '../store';
import { usePriceComparisonStore } from '@/features/price-comparison/store';
import { useSchoolPrices } from '@/hooks/useSchoolPrices';
import { useSchool } from '@/hooks/useSchools';
import { calculateMigration } from '@/engine/migration';
import { calculateComparison } from '@/engine/price-comparison';
import { CITO_MIGRATION_PRICES } from '@/data/cito-migration-prices';
import { updateSchoolData } from '@/db/operations';
import { DEFAULT_PRICES } from '@/data/default-prices';
import { ValueHeroCard } from '../components/ValueHeroCard';
import { TimeSavingsSection } from '../components/TimeSavingsSection';
import { MigrationSection } from '../components/MigrationSection';
import { MultiYearSection } from '../components/MultiYearSection';
import { DisclaimerFooter } from '@/components/ui/DisclaimerFooter';

export default function WaardeTab() {
  const { slug } = useParams({ from: '/scholen/$slug' });

  // School data from profile store
  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);

  // Migration-specific data from price comparison store
  const migrationHourlyRate = usePriceComparisonStore((s) => s.migrationHourlyRate);
  const migrationTimeSavingOverrides = usePriceComparisonStore((s) => s.migrationTimeSavingOverrides);
  const setMigrationHourlyRate = usePriceComparisonStore((s) => s.setMigrationHourlyRate);
  const setMigrationTimeSavingOverride = usePriceComparisonStore((s) => s.setMigrationTimeSavingOverride);

  // Load switching costs from school record (cached by react-query from SchoolLayout)
  const { data: school } = useSchool(slug);
  const [switchingCosts, setSwitchingCosts] = useState(0);

  useEffect(() => {
    if (school) {
      setSwitchingCosts(school.switchingCosts ?? 0);
    }
  }, [school?.id]);

  // School-specific prices for comparison
  const { data: schoolPrices } = useSchoolPrices(activeSchoolId ?? '');

  // Compute comparison result for hero price difference
  const priceDifference = useMemo(() => {
    if (selectedModules.length === 0) return null;

    // Build prices array: active school prices override defaults
    const activePrices = (schoolPrices ?? []).filter((p) => p.isActive);
    const prices = DEFAULT_PRICES.map((dp) => {
      const schoolPrice = activePrices.find(
        (sp) => sp.moduleId === dp.moduleId && sp.provider === dp.provider,
      );
      if (schoolPrice) {
        return { ...dp, amountPerStudent: schoolPrice.amount };
      }
      return dp;
    });

    try {
      const comparison = calculateComparison(selectedModules, studentCounts, prices);
      // Price difference: how much cheaper Cito is vs cheapest competitor
      const citoTotal = comparison.totals.cito;
      const diaTotal = comparison.totals.dia;
      const jijTotal = comparison.totals.jij;

      // Find best competitor total (only if they have prices)
      const competitorTotals = [
        comparison.differences.citoVsDia !== null ? diaTotal : null,
        comparison.differences.citoVsJij !== null ? jijTotal : null,
      ].filter((t): t is number => t !== null);

      if (competitorTotals.length === 0) return null;

      const bestCompetitor = Math.min(...competitorTotals);
      // Positive = Cito is cheaper (savings)
      return bestCompetitor - citoTotal;
    } catch {
      return null;
    }
  }, [selectedModules, studentCounts, schoolPrices]);

  // Compute migration result
  const migrationResult = useMemo(
    () =>
      calculateMigration(
        selectedModules,
        studentCounts,
        CITO_MIGRATION_PRICES,
        migrationTimeSavingOverrides,
        migrationHourlyRate,
        switchingCosts,
      ),
    [selectedModules, studentCounts, migrationTimeSavingOverrides, migrationHourlyRate, switchingCosts],
  );

  // Detect placeholder prices
  const hasPlaceholderPrices = CITO_MIGRATION_PRICES.every(
    (p) => p.oldPricePerStudent === p.newPricePerStudent,
  );

  // Handlers that persist to Supabase
  const handleHourlyRateChange = (rate: number) => {
    setMigrationHourlyRate(rate);
    if (activeSchoolId) {
      updateSchoolData(activeSchoolId, { migrationHourlyRate: rate });
    }
  };

  const handleHoursChange = (taskId: string, hours: number) => {
    setMigrationTimeSavingOverride(taskId, hours);
    if (activeSchoolId) {
      const updated = { ...migrationTimeSavingOverrides, [taskId]: hours };
      updateSchoolData(activeSchoolId, { migrationTimeSavingOverrides: updated });
    }
  };

  const handleSwitchingCostsChange = (costs: number) => {
    setSwitchingCosts(costs);
    if (activeSchoolId) {
      updateSchoolData(activeSchoolId, { switchingCosts: costs });
    }
  };

  return (
    <div className="space-y-12 pb-8 p-8 max-sm:p-4">
      <ValueHeroCard
        priceDifference={priceDifference}
        timeSavingsValue={migrationResult.totalTimeSavingsValue}
        migrationDifference={migrationResult.financialDifference}
      />
      <TimeSavingsSection
        timeSavings={migrationResult.timeSavings}
        totalHours={migrationResult.totalTimeSavingsHours}
        totalValue={migrationResult.totalTimeSavingsValue}
        hourlyRate={migrationHourlyRate}
        onHoursChange={handleHoursChange}
        onHourlyRateChange={handleHourlyRateChange}
      />
      <MigrationSection
        modules={migrationResult.modules}
        totalOldCost={migrationResult.totalOldCost}
        totalNewCost={migrationResult.totalNewCost}
        financialDifference={migrationResult.financialDifference}
        hasPlaceholderPrices={hasPlaceholderPrices}
      />
      <MultiYearSection
        projection={migrationResult.multiYearProjection}
        totalAnnualValue={migrationResult.totalAnnualValue}
        switchingCosts={switchingCosts}
        breakEvenMonth={migrationResult.breakEvenMonth}
        onSwitchingCostsChange={handleSwitchingCostsChange}
      />
      <DisclaimerFooter showDisclaimer={true} />
    </div>
  );
}
