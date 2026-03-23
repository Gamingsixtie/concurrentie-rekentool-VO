import { create } from 'zustand';
import { calculateComparison, getTotalStudents } from '../../engine/price-comparison';
import type { ComparisonResult, ProviderKey } from '../../engine/price-comparison';
import type { PriceRecord } from '../../models/pricing';
import { DEFAULT_PRICES } from '../../data/default-prices';
import { useSchoolProfileStore } from '../school-profile/store';
import type { SchoolRecord } from '@/db/types';
import { calculateHybridScenario } from '../../engine/hybrid-scenario';
import type { HybridScenarioResult } from '../../engine/hybrid-scenario';
import { calculateSensitivity } from '../../engine/sensitivity';
import type { SensitivityResult } from '../../engine/sensitivity';
import { calculateDiaModuleCosts, getDiaVolumeDiscountPercent } from '../../engine/dia-packages';
import type { DiaPackageResult } from '../../models/dia-packages';
import { DIA_PACKAGES } from '../../data/dia-packages';
import { estimateJijCostPerStudent } from '../../data/jij-license-tiers';
import type { CitoBundleType, ContractPeriod } from '../../data/cito-bundles';
import { getCitoBundle, getCitoFactorForBundle } from '../../data/cito-bundles';
import { applyCitoBundlePrices, applyContractPeriodToResult } from '../../engine/cito-bundles';

/**
 * Apply DIA volume discount (staffelkorting) based on school size.
 * 500+ students = 5%, 1000+ students = 10%.
 */
function applyDiaVolumeDiscount(
  basePrices: PriceRecord[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
): PriceRecord[] {
  const totalStudents = getTotalStudents(studentCounts);
  const discountPercent = getDiaVolumeDiscountPercent(totalStudents);
  if (discountPercent === 0) return basePrices;

  const factor = 1 - discountPercent / 100;
  return basePrices.map((price) => {
    if (price.provider !== 'dia') return price;
    const discounted = Math.round(price.amountPerStudent * factor * 100) / 100;
    return {
      ...price,
      amountPerStudent: discounted,
      sourceLabel: `${price.sourceLabel} (staffelkorting -${discountPercent}% bij ${totalStudents} lln)`,
    };
  });
}

/**
 * Replace static JIJ! prices with dynamically calculated prices
 * based on actual school size and the tiered license model.
 */
function applyDynamicJijPrices(
  basePrices: PriceRecord[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
): PriceRecord[] {
  const totalStudents = getTotalStudents(studentCounts);
  if (totalStudents === 0) return basePrices;

  const { costPerStudent, tier } = estimateJijCostPerStudent(totalStudents);

  return basePrices.map((price) => {
    if (price.provider !== 'jij' || price.amountPerStudent === 0) return price;
    return {
      ...price,
      amountPerStudent: costPerStudent,
      sourceLabel: `Berekend: ${tier.label}, ${totalStudents} lln, 2 afnames/lln — €${costPerStudent}/lln`,
      verifiedAt: price.verifiedAt,
    };
  });
}

export interface PriceOverride {
  moduleId: string;
  provider: 'cito' | 'dia' | 'jij' | 'saqi';
  amount: number;
}

interface PriceComparisonState {
  result: ComparisonResult | null;
  draftOverrides: PriceOverride[];
  appliedOverrides: PriceOverride[];
  hasPendingChanges: boolean;

  // Migration (Scenario B)
  migrationHourlyRate: number;
  migrationTimeSavingOverrides: Record<string, number>;

  // Mode toggle (per D-19, D-20)
  isInternalMode: boolean;
  setInternalMode: (mode: boolean) => void;
  // Contract period toggle (per D-10)
  contractPeriod: ContractPeriod;
  setContractPeriod: (period: ContractPeriod) => void;
  // Cito bundle selector
  citoBundleType: CitoBundleType;
  setCitoBundleType: (bundleType: CitoBundleType) => void;
  // Computed results from new engines
  hybridResult: HybridScenarioResult | null;
  sensitivityResult: SensitivityResult | null;
  diaPackageResult: DiaPackageResult | null;
  // Active competitor for sensitivity (per D-14)
  activeCompetitor: ProviderKey | null;

  initialize: () => void;
  setDraftOverride: (override: PriceOverride) => void;
  resetOverride: (moduleId: string, provider: string) => void;
  resetAllOverrides: () => void;
  recalculate: () => void;
  hydrate: (record: SchoolRecord) => void;
  setMigrationHourlyRate: (rate: number) => void;
  setMigrationTimeSavingOverride: (taskId: string, hours: number) => void;
}

/**
 * Merge overrides into the default price array.
 * For each override, find the matching PriceRecord (by moduleId + provider)
 * and replace amountPerStudent, setting source to 'manual'.
 */
function mergeOverrides(
  basePrices: PriceRecord[],
  overrides: PriceOverride[],
): PriceRecord[] {
  if (overrides.length === 0) return basePrices;

  return basePrices.map((price) => {
    const override = overrides.find(
      (o) => o.moduleId === price.moduleId && o.provider === price.provider,
    );
    if (override) {
      return {
        ...price,
        amountPerStudent: override.amount,
        source: 'manual' as const,
        sourceLabel: 'Handmatig ingevoerd',
        isPublicationPrice: false,
      };
    }
    return price;
  });
}

/**
 * Determine the active competitor from moduleSetups using DETERMINISTIC ordering:
 * iterate moduleSetups sorted alphabetically by moduleId, find the first entry
 * where currentProvider is 'dia' or 'jij'.
 */
function determineActiveCompetitor(
  moduleSetups: { moduleId: string; currentProvider: string }[],
): ProviderKey | null {
  const sortedSetups = [...moduleSetups].sort((a, b) =>
    a.moduleId.localeCompare(b.moduleId),
  );
  for (const setup of sortedSetups) {
    if (setup.currentProvider === 'dia') return 'dia';
    if (setup.currentProvider === 'jij') return 'jij';
  }
  return null;
}

/**
 * Compute extended results (hybrid, sensitivity, DIA packages)
 * from a base comparison result.
 */
function computeExtendedResults(
  result: ComparisonResult,
  selectedModules: string[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
  mergedPrices: PriceRecord[],
) {
  const { moduleSetups } = useSchoolProfileStore.getState();
  const totalStudents = getTotalStudents(studentCounts);

  // Determine active competitor deterministically
  const activeCompetitor = determineActiveCompetitor(moduleSetups);

  // Hybrid scenario
  const hybridResult = calculateHybridScenario(result, moduleSetups);

  // Sensitivity analysis
  let sensitivityResult: SensitivityResult | null = null;
  if (activeCompetitor !== null) {
    sensitivityResult = calculateSensitivity(result, activeCompetitor, [0, 10, 20]);
  }

  // DIA package calculation
  const diaModuleIds = selectedModules.filter((modId) => {
    const price = mergedPrices.find(
      (p) => p.moduleId === modId && p.provider === 'dia',
    );
    return price !== undefined;
  });
  const diaMap = new Map<string, number>();
  for (const modId of diaModuleIds) {
    const price = mergedPrices.find(
      (p) => p.moduleId === modId && p.provider === 'dia',
    );
    if (price) {
      diaMap.set(modId, price.amountPerStudent);
    }
  }
  const diaResult = calculateDiaModuleCosts(
    diaModuleIds,
    totalStudents,
    diaMap,
    DIA_PACKAGES,
  );

  return {
    activeCompetitor,
    hybridResult,
    sensitivityResult,
    diaPackageResult: diaResult.packageResult,
  };
}

/**
 * Adjust DIA total in result to reflect package discount.
 * The comparison engine sums individual module prices, but the DIA package
 * may be cheaper. Mutates result in place.
 */
function applyDiaPackageToResult(
  result: ComparisonResult,
  diaPackageResult: DiaPackageResult | null,
  studentCounts: Partial<Record<string, Record<number, number>>>,
): void {
  if (!diaPackageResult?.selectedPackage || diaPackageResult.savings <= 0) return;
  const totalStudents = getTotalStudents(studentCounts);
  result.totals.dia = diaPackageResult.totalCost * totalStudents;
  const hasAnyDia = result.modules.some((m) => m.providers.dia !== null);
  result.differences.citoVsDia = hasAnyDia ? result.totals.cito - result.totals.dia : null;
}

export const usePriceComparisonStore = create<PriceComparisonState>()(
  (set, get) => ({
    result: null,
    draftOverrides: [],
    appliedOverrides: [],
    hasPendingChanges: false,
    migrationHourlyRate: 50,
    migrationTimeSavingOverrides: {},

    // New state defaults
    isInternalMode: true,
    contractPeriod: 'annual' as ContractPeriod,
    citoBundleType: 'individual' as CitoBundleType,
    hybridResult: null,
    sensitivityResult: null,
    diaPackageResult: null,
    activeCompetitor: null,

    setInternalMode: (mode) => set({ isInternalMode: mode }),
    setContractPeriod: (period) => {
      set({ contractPeriod: period });
      get().initialize();
    },
    setCitoBundleType: (bundleType) => {
      set({ citoBundleType: bundleType });
      get().initialize();
    },

    initialize: () => {
      const { selectedModules, studentCounts } =
        useSchoolProfileStore.getState();
      const state = get();
      const bundle = getCitoBundle(state.citoBundleType);

      // Price pipeline: JIJ dynamic → DIA staffel → Cito bundel
      const dynamicPrices = applyCitoBundlePrices(
        applyDiaVolumeDiscount(
          applyDynamicJijPrices(DEFAULT_PRICES, studentCounts),
          studentCounts,
        ),
        bundle,
        selectedModules,
      );
      const annualResult = calculateComparison(
        selectedModules,
        studentCounts,
        dynamicPrices,
      );

      // Apply contract period multipliers (bundle-aware factor)
      const citoFactor = getCitoFactorForBundle(bundle, state.contractPeriod);
      const result = applyContractPeriodToResult(annualResult, state.contractPeriod, citoFactor);

      const extended = computeExtendedResults(
        result,
        selectedModules,
        studentCounts,
        dynamicPrices,
      );

      // Correct DIA total to reflect package discount
      applyDiaPackageToResult(result, extended.diaPackageResult, studentCounts);

      set({
        result,
        ...extended,
      });
    },

    setDraftOverride: (override) => {
      set((state) => {
        const existing = state.draftOverrides.findIndex(
          (o) =>
            o.moduleId === override.moduleId &&
            o.provider === override.provider,
        );
        const updated =
          existing >= 0
            ? state.draftOverrides.map((o, i) =>
                i === existing ? override : o,
              )
            : [...state.draftOverrides, override];
        return { draftOverrides: updated, hasPendingChanges: true };
      });
    },

    resetOverride: (moduleId, provider) => {
      set((state) => ({
        draftOverrides: state.draftOverrides.filter(
          (o) => !(o.moduleId === moduleId && o.provider === provider),
        ),
        hasPendingChanges: true,
      }));
    },

    resetAllOverrides: () => {
      set({ draftOverrides: [], hasPendingChanges: true });
    },

    recalculate: () => {
      const { selectedModules, studentCounts } =
        useSchoolProfileStore.getState();
      const state = get();
      const bundle = getCitoBundle(state.citoBundleType);

      // Merge: applied overrides first, then draft overrides on top
      const allOverrides = [...state.appliedOverrides, ...state.draftOverrides];
      // Deduplicate: later entries (draft) win over earlier (applied)
      const deduped = new Map<string, PriceOverride>();
      for (const o of allOverrides) {
        deduped.set(`${o.moduleId}:${o.provider}`, o);
      }
      const mergedOverrides = Array.from(deduped.values());

      // Price pipeline: JIJ dynamic → DIA staffel → Cito bundel → overrides
      const dynamicPrices = applyCitoBundlePrices(
        applyDiaVolumeDiscount(
          applyDynamicJijPrices(DEFAULT_PRICES, studentCounts),
          studentCounts,
        ),
        bundle,
        selectedModules,
      );
      const mergedPrices = mergeOverrides(dynamicPrices, mergedOverrides);
      const annualResult = calculateComparison(
        selectedModules,
        studentCounts,
        mergedPrices,
      );

      // Apply contract period multipliers (bundle-aware factor)
      const citoFactor = getCitoFactorForBundle(bundle, state.contractPeriod);
      const result = applyContractPeriodToResult(annualResult, state.contractPeriod, citoFactor);

      const extended = computeExtendedResults(
        result,
        selectedModules,
        studentCounts,
        mergedPrices,
      );

      // Correct DIA total to reflect package discount
      applyDiaPackageToResult(result, extended.diaPackageResult, studentCounts);

      set({
        result,
        appliedOverrides: mergedOverrides,
        draftOverrides: [],
        hasPendingChanges: false,
        ...extended,
      });
    },

    hydrate: (record: SchoolRecord) => {
      set({
        appliedOverrides: record.appliedOverrides,
        migrationHourlyRate: record.migrationHourlyRate,
        migrationTimeSavingOverrides: record.migrationTimeSavingOverrides,
        draftOverrides: [],
        hasPendingChanges: false,
      });
      // Recalculate after hydrating to get fresh result
      get().initialize();
    },

    setMigrationHourlyRate: (rate) => set({ migrationHourlyRate: rate }),

    setMigrationTimeSavingOverride: (taskId, hours) =>
      set((state) => ({
        migrationTimeSavingOverrides: {
          ...state.migrationTimeSavingOverrides,
          [taskId]: hours,
        },
      })),
  }),
);
