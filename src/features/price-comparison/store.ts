import { create } from 'zustand';
import { calculateComparison } from '../../engine/price-comparison';
import type { ComparisonResult, ProviderKey } from '../../engine/price-comparison';
import { useSchoolProfileStore } from '../school-profile/store';
import type { SchoolRecord } from '@/db/types';
import { calculateHybridScenario } from '../../engine/hybrid-scenario';
import type { HybridScenarioResult } from '../../engine/hybrid-scenario';
import { calculateSensitivity } from '../../engine/sensitivity';
import type { SensitivityResult } from '../../engine/sensitivity';
import type { DiaPackageResult } from '../../models/dia-packages';
import type { CitoBundleType, ContractPeriod } from '../../data/cito-bundles';
import { getCitoBundle, getCitoFactorForBundle } from '../../data/cito-bundles';
import { applyContractPeriodToResult } from '../../engine/cito-bundles';

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
  migrationHourlyRate: number | null;
  migrationTimeSavingOverrides: Record<string, number | null>;

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
  setMigrationHourlyRate: (rate: number | null) => void;
  setMigrationTimeSavingOverride: (taskId: string, hours: number | null) => void;
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
 * Compute extended results (hybrid, sensitivity) from a base comparison result.
 * DIA package result now comes from ComparisonResult.diaPackageResult directly.
 */
function computeExtendedResults(result: ComparisonResult) {
  const { moduleSetups } = useSchoolProfileStore.getState();

  // Determine active competitor deterministically
  const activeCompetitor = determineActiveCompetitor(moduleSetups);

  // Hybrid scenario
  const hybridResult = calculateHybridScenario(result, moduleSetups);

  // Sensitivity analysis
  let sensitivityResult: SensitivityResult | null = null;
  if (activeCompetitor !== null) {
    sensitivityResult = calculateSensitivity(result, activeCompetitor, [0, 10, 20]);
  }

  return {
    activeCompetitor,
    hybridResult,
    sensitivityResult,
  };
}

export const usePriceComparisonStore = create<PriceComparisonState>()(
  (set, get) => ({
    result: null,
    draftOverrides: [],
    appliedOverrides: [],
    hasPendingChanges: false,
    migrationHourlyRate: null,
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

      // Step 1: Engine computes everything (provider calculators + breakdown + DIA packages)
      const annualResult = calculateComparison(selectedModules, studentCounts, {
        citoBundleType: state.citoBundleType,
      });

      // Step 2: Contract period multipliers (post-processing, stays in store)
      const bundle = getCitoBundle(state.citoBundleType);
      const citoFactor = getCitoFactorForBundle(bundle, state.contractPeriod);
      const result = applyContractPeriodToResult(annualResult, state.contractPeriod, citoFactor);

      // Preserve diaPackageResult from annual result (applyContractPeriodToResult doesn't carry it)
      const diaPackageResult = annualResult.diaPackageResult ?? null;

      // Step 3: Extended results (hybrid + sensitivity only)
      const extended = computeExtendedResults(result);

      set({
        result,
        diaPackageResult,
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

      // Merge overrides into a Map for the engine
      const allOverrides = [...state.appliedOverrides, ...state.draftOverrides];
      const deduped = new Map<string, PriceOverride>();
      for (const o of allOverrides) {
        deduped.set(`${o.moduleId}:${o.provider}`, o);
      }
      const overridePrices = new Map<string, number>();
      for (const [key, o] of deduped) {
        overridePrices.set(key, o.amount);
      }

      // Step 1: Engine with overrides
      const annualResult = calculateComparison(selectedModules, studentCounts, {
        citoBundleType: state.citoBundleType,
        overridePrices,
      });

      // Step 2: Contract period
      const bundle = getCitoBundle(state.citoBundleType);
      const citoFactor = getCitoFactorForBundle(bundle, state.contractPeriod);
      const result = applyContractPeriodToResult(annualResult, state.contractPeriod, citoFactor);

      // Preserve diaPackageResult from annual result
      const diaPackageResult = annualResult.diaPackageResult ?? null;

      // Step 3: Extended
      const extended = computeExtendedResults(result);

      set({
        result,
        appliedOverrides: Array.from(deduped.values()),
        draftOverrides: [],
        hasPendingChanges: false,
        diaPackageResult,
        ...extended,
      });
    },

    hydrate: (record: SchoolRecord) => {
      set({
        appliedOverrides: record.appliedOverrides,
        migrationHourlyRate: record.migrationHourlyRate ?? null,
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
