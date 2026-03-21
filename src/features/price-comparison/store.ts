import { create } from 'zustand';
import { calculateComparison } from '../../engine/price-comparison';
import type { ComparisonResult } from '../../engine/price-comparison';
import type { PriceRecord } from '../../models/pricing';
import { DEFAULT_PRICES } from '../../data/default-prices';
import { useSchoolProfileStore } from '../school-profile/store';
import type { SchoolRecord } from '@/db/types';

export interface PriceOverride {
  moduleId: string;
  provider: 'cito' | 'dia' | 'jij';
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

export const usePriceComparisonStore = create<PriceComparisonState>()(
  (set, get) => ({
    result: null,
    draftOverrides: [],
    appliedOverrides: [],
    hasPendingChanges: false,
    migrationHourlyRate: 50,
    migrationTimeSavingOverrides: {},

    initialize: () => {
      const { selectedModules, studentCounts } =
        useSchoolProfileStore.getState();
      const result = calculateComparison(
        selectedModules,
        studentCounts,
        DEFAULT_PRICES,
      );
      set({ result });
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

      // Merge: applied overrides first, then draft overrides on top
      const allOverrides = [...state.appliedOverrides, ...state.draftOverrides];
      // Deduplicate: later entries (draft) win over earlier (applied)
      const deduped = new Map<string, PriceOverride>();
      for (const o of allOverrides) {
        deduped.set(`${o.moduleId}:${o.provider}`, o);
      }
      const mergedOverrides = Array.from(deduped.values());

      const mergedPrices = mergeOverrides(DEFAULT_PRICES, mergedOverrides);
      const result = calculateComparison(
        selectedModules,
        studentCounts,
        mergedPrices,
      );

      set({
        result,
        appliedOverrides: mergedOverrides,
        draftOverrides: [],
        hasPendingChanges: false,
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
