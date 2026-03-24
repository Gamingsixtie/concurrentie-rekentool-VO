import { describe, it, expect } from 'vitest';
import {
  calculateComparison,
  calculateComparisonLegacy,
  getTotalStudents,
} from '../price-comparison';
import { DEFAULT_PRICES } from '../../data/default-prices';
import { applyCitoBundlePrices } from '../cito-bundles';
import { getCitoBundle } from '../../data/providers/cito';
import { getDiaVolumeDiscountPercent } from '../dia-packages';
import { estimateJijCostPerStudent } from '../../data/jij-license-tiers';
import type { PriceRecord } from '../../models/pricing';

/**
 * Replicate the old store pipeline: applyDynamicJijPrices -> applyDiaVolumeDiscount -> applyCitoBundlePrices -> calculateComparisonLegacy
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
    return { ...price, amountPerStudent: discounted };
  });
}

function applyDynamicJijPrices(
  basePrices: PriceRecord[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
): PriceRecord[] {
  const totalStudents = getTotalStudents(studentCounts);
  if (totalStudents === 0) return basePrices;
  const { costPerStudent } = estimateJijCostPerStudent(totalStudents);
  return basePrices.map((price) => {
    if (price.provider !== 'jij' || price.amountPerStudent === 0) return price;
    return { ...price, amountPerStudent: costPerStudent };
  });
}

function oldPipeline(
  modules: string[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
) {
  const bundle = getCitoBundle('individual');
  const dynamicPrices = applyCitoBundlePrices(
    applyDiaVolumeDiscount(
      applyDynamicJijPrices(DEFAULT_PRICES, studentCounts),
      studentCounts,
    ),
    bundle,
    modules,
  );
  return calculateComparisonLegacy(modules, studentCounts, dynamicPrices);
}

function newPipeline(
  modules: string[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
) {
  return calculateComparison(modules, studentCounts, {
    citoBundleType: 'individual',
  });
}

const MODULES = ['rekenwiskunde', 'nederlands', 'engels'];
const SCHOOL_SIZES = [100, 500, 800, 1200];

function makeStudentCounts(total: number): Partial<Record<string, Record<number, number>>> {
  if (total === 0) return {};
  return { havo: { 3: total } };
}

describe('Calculator parity: old pipeline vs new calculateComparison', () => {
  for (const size of SCHOOL_SIZES) {
    describe(`school size: ${size} students`, () => {
      it(`produces identical totals for ${MODULES.join(', ')}`, () => {
        const counts = makeStudentCounts(size);
        const oldResult = oldPipeline(MODULES, counts);
        const newResult = newPipeline(MODULES, counts);

        // Compare totals per provider
        for (const provider of ['cito', 'dia', 'jij'] as const) {
          expect(newResult.totals[provider]).toBeCloseTo(
            oldResult.totals[provider],
            2,
          );
        }
      });

      it(`produces identical per-module prices for ${MODULES.join(', ')}`, () => {
        const counts = makeStudentCounts(size);
        const oldResult = oldPipeline(MODULES, counts);
        const newResult = newPipeline(MODULES, counts);

        for (let i = 0; i < MODULES.length; i++) {
          const oldMod = oldResult.modules[i];
          const newMod = newResult.modules[i];

          for (const provider of ['cito', 'dia', 'jij'] as const) {
            const oldCost = oldMod.providers[provider];
            const newCost = newMod.providers[provider];

            if (oldCost === null) {
              expect(newCost).toBeNull();
            } else {
              expect(newCost).not.toBeNull();
              expect(newCost!.pricePerStudent).toBeCloseTo(
                oldCost!.pricePerStudent,
                2,
              );
              expect(newCost!.totalCost).toBeCloseTo(
                oldCost!.totalCost,
                2,
              );
            }
          }
        }
      });
    });
  }

  it('new result has breakdown field on each non-null ProviderCost', () => {
    const counts = makeStudentCounts(800);
    const result = newPipeline(MODULES, counts);

    for (const mod of result.modules) {
      for (const provider of ['cito', 'dia', 'jij'] as const) {
        const cost = mod.providers[provider];
        if (cost !== null) {
          expect(cost.breakdown).toBeDefined();
          expect(cost.breakdown.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('new result maintains all existing fields (pricePerStudent, totalCost, studentCount, priceRecord)', () => {
    const counts = makeStudentCounts(800);
    const result = newPipeline(MODULES, counts);

    for (const mod of result.modules) {
      for (const provider of ['cito', 'dia', 'jij'] as const) {
        const cost = mod.providers[provider];
        if (cost !== null) {
          expect(typeof cost.pricePerStudent).toBe('number');
          expect(typeof cost.totalCost).toBe('number');
          expect(typeof cost.studentCount).toBe('number');
          expect(cost.priceRecord).toBeDefined();
          expect(cost.priceRecord.moduleId).toBe(mod.moduleId);
          expect(cost.priceRecord.provider).toBe(provider);
        }
      }
    }
  });
});
