import { describe, it, expect } from 'vitest';
import { calculateMigration } from '../migration';
import type { CitoMigrationPriceRecord } from '../../data/cito-migration-prices';

const mockMigrationPrices: CitoMigrationPriceRecord[] = [
  {
    moduleId: 'rekenwiskunde',
    oldPricePerStudent: 4.5,
    newPricePerStudent: 4.0,
    verifiedAt: new Date('2026-01-01'),
  },
  {
    moduleId: 'nederlands',
    oldPricePerStudent: 4.5,
    newPricePerStudent: 4.5,
    verifiedAt: new Date('2026-01-01'),
  },
];

const studentCounts = { havo: { 1: 100 } }; // 100 students

describe('calculateMigration', () => {
  it('returns empty result for empty selectedModules', () => {
    const result = calculateMigration([], studentCounts, mockMigrationPrices, {}, 50);
    expect(result.modules).toHaveLength(0);
    expect(result.totalOldCost).toBe(0);
    expect(result.totalNewCost).toBe(0);
    expect(result.financialDifference).toBe(0);
  });

  it('calculates module costs and difference correctly', () => {
    const result = calculateMigration(
      ['rekenwiskunde'],
      studentCounts,
      mockMigrationPrices,
      {},
      50,
    );
    const mod = result.modules[0];

    // old: 4.5 × 100 = 450, new: 4.0 × 100 = 400
    expect(mod.oldTotalCost).toBe(450);
    expect(mod.newTotalCost).toBe(400);
    expect(mod.annualDifference).toBe(50); // new is cheaper by €50
  });

  it('skips modules without migration price record', () => {
    const result = calculateMigration(
      ['cognitieve-capaciteiten'],
      studentCounts,
      mockMigrationPrices,
      {},
      50,
    );
    expect(result.modules).toHaveLength(0);
  });

  it('uses TIME_SAVING_TASKS defaults when no overrides', () => {
    const result = calculateMigration(
      ['rekenwiskunde'],
      studentCounts,
      mockMigrationPrices,
      {},
      50,
    );

    // Default hours: rechten=10, resetten=12, inloggen=8, planning=10, koppeling=8 → total=48
    expect(result.totalTimeSavingsHours).toBe(48);
    expect(result.totalTimeSavingsValue).toBe(48 * 50); // 2400
  });

  it('applies time saving overrides', () => {
    const result = calculateMigration(
      ['rekenwiskunde'],
      studentCounts,
      mockMigrationPrices,
      { rechten: 20, resetten: 5 },
      50,
    );

    // rechten=20 (override), resetten=5 (override), inloggen=8, planning=10, koppeling=8 → total=51
    expect(result.totalTimeSavingsHours).toBe(51);
  });

  it('calculates totalAnnualValue as financial + time savings', () => {
    const result = calculateMigration(
      ['rekenwiskunde'],
      studentCounts,
      mockMigrationPrices,
      {},
      50,
    );
    // financialDifference: 450 - 400 = 50
    // timeSavingsValue: 48 × 50 = 2400
    expect(result.totalAnnualValue).toBe(50 + 2400);
  });

  it('generates multi-year projection', () => {
    const result = calculateMigration(
      ['rekenwiskunde'],
      studentCounts,
      mockMigrationPrices,
      {},
      50,
    );

    const totalAnnual = result.totalAnnualValue;
    expect(result.multiYearProjection).toEqual([
      { year: 1, cumulativeSavings: totalAnnual },
      { year: 3, cumulativeSavings: totalAnnual * 3 },
      { year: 5, cumulativeSavings: totalAnnual * 5 },
    ]);
  });

  it('handles zero annualDifference when prices are equal', () => {
    const result = calculateMigration(
      ['nederlands'],
      studentCounts,
      mockMigrationPrices,
      {},
      50,
    );
    // old = new = 4.5 × 100 = 450
    expect(result.financialDifference).toBe(0);
    expect(result.modules[0].annualDifference).toBe(0);
  });
});
