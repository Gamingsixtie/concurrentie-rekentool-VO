import type { PriceRecord } from '../models/pricing';
import type { ModuleCategory } from '../models/modules';
import { MODULE_CATALOG } from '../models/modules';

export type ProviderKey = 'cito' | 'dia' | 'jij' | 'saqi';

export const PROVIDERS = ['cito', 'dia', 'jij', 'saqi'] as const;

export const PROVIDER_LABELS: Record<ProviderKey, string> = {
  cito: 'Cito',
  dia: 'DIA',
  jij: 'JIJ',
  saqi: 'SAQI',
};

export interface ProviderCost {
  pricePerStudent: number;
  totalCost: number;
  studentCount: number;
  priceRecord: PriceRecord;
}

export interface ModuleComparison {
  moduleId: string;
  moduleName: string;
  moduleCategory: ModuleCategory;
  providers: Record<ProviderKey, ProviderCost | null>;
}

export interface ComparisonResult {
  modules: ModuleComparison[];
  totals: Record<ProviderKey, number>;
  differences: {
    citoVsDia: number | null;
    citoVsJij: number | null;
    citoVsSaqi: number | null;
  };
}

/**
 * Sum all student counts across all levels and years.
 */
export function getTotalStudents(
  studentCounts: Partial<Record<string, Record<number, number>>>,
): number {
  let total = 0;
  for (const levelCounts of Object.values(studentCounts)) {
    if (levelCounts) {
      for (const count of Object.values(levelCounts)) {
        total += count;
      }
    }
  }
  return total;
}

/**
 * Pure calculation function: given selected modules, student counts, and price records,
 * compute a full comparison result across all three providers.
 */
export function calculateComparison(
  selectedModules: string[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
  prices: PriceRecord[],
): ComparisonResult {
  const totalStudents = getTotalStudents(studentCounts);

  const modules: ModuleComparison[] = selectedModules.map((moduleId) => {
    const moduleDef = MODULE_CATALOG.find((m) => m.id === moduleId);
    const moduleName = moduleDef?.name ?? moduleId;
    const moduleCategory: ModuleCategory = moduleDef?.category ?? 'overige-instrumenten';

    const providers = {} as Record<ProviderKey, ProviderCost | null>;

    for (const provider of PROVIDERS) {
      const record = prices.find(
        (p) => p.moduleId === moduleId && p.provider === provider,
      );

      if (record) {
        providers[provider] = {
          pricePerStudent: record.amountPerStudent,
          totalCost: record.amountPerStudent * totalStudents,
          studentCount: totalStudents,
          priceRecord: record,
        };
      } else {
        providers[provider] = null;
      }
    }

    return { moduleId, moduleName, moduleCategory, providers };
  });

  // Compute totals per provider
  const totals: Record<ProviderKey, number> = { cito: 0, dia: 0, jij: 0, saqi: 0 };
  for (const mod of modules) {
    for (const provider of PROVIDERS) {
      const cost = mod.providers[provider];
      if (cost) {
        totals[provider] += cost.totalCost;
      }
    }
  }

  // Track whether a provider has ANY module with a price
  const hasAnyModule: Record<ProviderKey, boolean> = { cito: false, dia: false, jij: false, saqi: false };
  for (const mod of modules) {
    for (const provider of PROVIDERS) {
      if (mod.providers[provider] !== null) {
        hasAnyModule[provider] = true;
      }
    }
  }

  // Compute differences (null if the other provider has no modules at all)
  const differences = {
    citoVsDia: hasAnyModule.dia ? totals.cito - totals.dia : null,
    citoVsJij: hasAnyModule.jij ? totals.cito - totals.jij : null,
    citoVsSaqi: hasAnyModule.saqi ? totals.cito - totals.saqi : null,
  };

  return { modules, totals, differences };
}
