import { describe, it, expect } from 'vitest';
import {
  calculateComparison,
  getTotalStudents,
  PROVIDERS,
  PROVIDER_LABELS,
} from '../price-comparison';
import { formatCurrency, formatCurrencyCompact, formatNumber } from '../../lib/format';
import type { PriceRecord } from '../../models/pricing';

// Helper: build a price record quickly
function makePrice(
  moduleId: string,
  provider: 'cito' | 'dia' | 'jij',
  amount: number,
): PriceRecord {
  return {
    moduleId,
    provider,
    amountPerStudent: amount,
    source: 'publication',
    sourceLabel: 'Test',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  };
}

describe('getTotalStudents', () => {
  it('sums nested Record<SchoolLevel, Record<number, number>> correctly', () => {
    const counts: Record<string, Record<number, number>> = {
      'havo': { 1: 30, 2: 25, 3: 20 },
      'vwo': { 1: 15, 2: 10 },
    };
    expect(getTotalStudents(counts)).toBe(100);
  });
});

describe('calculateComparison', () => {
  const studentCounts: Record<string, Record<number, number>> = {
    'havo': { 1: 50, 2: 50 },
  };

  it('returns correct per-module and total costs for 2 modules, 3 providers, 100 students', () => {
    const prices: PriceRecord[] = [
      makePrice('rekenwiskunde', 'cito', 4.5),
      makePrice('rekenwiskunde', 'dia', 5.2),
      makePrice('rekenwiskunde', 'jij', 4.8),
      makePrice('nederlands', 'cito', 4.5),
      makePrice('nederlands', 'dia', 5.2),
      makePrice('nederlands', 'jij', 4.8),
    ];

    const result = calculateComparison(['rekenwiskunde', 'nederlands'], studentCounts, prices);

    expect(result.modules).toHaveLength(2);

    // Check rekenwiskunde
    const rw = result.modules[0];
    expect(rw.moduleId).toBe('rekenwiskunde');
    expect(rw.providers.cito).not.toBeNull();
    expect(rw.providers.cito!.pricePerStudent).toBe(4.5);
    expect(rw.providers.cito!.totalCost).toBe(450);
    expect(rw.providers.dia!.totalCost).toBe(520);
    expect(rw.providers.jij!.totalCost).toBe(480);

    // Check totals
    expect(result.totals.cito).toBe(900);   // 450 + 450
    expect(result.totals.dia).toBe(1040);    // 520 + 520
    expect(result.totals.jij).toBe(960);     // 480 + 480
  });

  it('returns null ProviderCost for missing provider price (JIJ for sociaal-emotioneel)', () => {
    const prices: PriceRecord[] = [
      makePrice('sociaal-emotioneel', 'cito', 3.5),
      makePrice('sociaal-emotioneel', 'dia', 4.0),
      // JIJ has no price for sociaal-emotioneel
    ];

    const result = calculateComparison(['sociaal-emotioneel'], studentCounts, prices);

    expect(result.modules[0].providers.jij).toBeNull();
    expect(result.modules[0].providers.cito).not.toBeNull();
    expect(result.modules[0].providers.dia).not.toBeNull();
  });

  it('returns empty modules array and zero totals for 0 selected modules', () => {
    const result = calculateComparison([], studentCounts, []);

    expect(result.modules).toHaveLength(0);
    expect(result.totals.cito).toBe(0);
    expect(result.totals.dia).toBe(0);
    expect(result.totals.jij).toBe(0);
  });

  it('correctly sums studentCounts across all levels and years', () => {
    const multiLevelCounts: Record<string, Record<number, number>> = {
      'vmbo-b': { 1: 20, 2: 15 },
      'havo': { 1: 30, 2: 25, 3: 10 },
    };

    const prices: PriceRecord[] = [
      makePrice('rekenwiskunde', 'cito', 10),
    ];

    const result = calculateComparison(['rekenwiskunde'], multiLevelCounts, prices);

    // 20+15+30+25+10 = 100 students
    expect(result.modules[0].providers.cito!.totalCost).toBe(1000);
    expect(result.modules[0].providers.cito!.studentCount).toBe(100);
  });

  it('uses manual price overrides instead of default amount', () => {
    const prices: PriceRecord[] = [
      makePrice('rekenwiskunde', 'cito', 3.0), // overridden lower price
    ];

    const result = calculateComparison(['rekenwiskunde'], studentCounts, prices);

    expect(result.modules[0].providers.cito!.pricePerStudent).toBe(3.0);
    expect(result.modules[0].providers.cito!.totalCost).toBe(300);
  });

  it('computes correct citoVsDia and citoVsJij differences', () => {
    const prices: PriceRecord[] = [
      makePrice('rekenwiskunde', 'cito', 4.5),
      makePrice('rekenwiskunde', 'dia', 5.2),
      makePrice('rekenwiskunde', 'jij', 4.8),
    ];

    const result = calculateComparison(['rekenwiskunde'], studentCounts, prices);

    // cito total = 450, dia total = 520, jij total = 480
    expect(result.differences.citoVsDia).toBe(450 - 520); // -70
    expect(result.differences.citoVsJij).toBe(450 - 480); // -30
  });

  it('returns null difference when provider has no modules at all', () => {
    const prices: PriceRecord[] = [
      makePrice('cognitieve-capaciteiten', 'cito', 6.5),
      // dia and jij have no records
    ];

    const result = calculateComparison(['cognitieve-capaciteiten'], studentCounts, prices);

    expect(result.differences.citoVsDia).toBeNull();
    expect(result.differences.citoVsJij).toBeNull();
  });
});

describe('formatCurrency', () => {
  it('formats 1234.50 as Dutch locale currency with 2 decimals', () => {
    const formatted = formatCurrency(1234.5);
    // nl-NL: "€ 1.234,50" (may have non-breaking space)
    expect(formatted).toMatch(/€\s*1\.234,50/);
  });
});

describe('formatCurrencyCompact', () => {
  it('formats 1234 as Dutch locale currency without decimals', () => {
    const formatted = formatCurrencyCompact(1234);
    expect(formatted).toMatch(/€\s*1\.234/);
    expect(formatted).not.toMatch(/,/); // no decimal separator
  });
});

describe('formatNumber', () => {
  it('formats numbers with nl-NL locale (dot as thousands separator)', () => {
    expect(formatNumber(1234567)).toMatch(/1\.234\.567/);
  });
});

describe('exports', () => {
  it('exports PROVIDERS array with all three provider keys', () => {
    expect(PROVIDERS).toEqual(['cito', 'dia', 'jij']);
  });

  it('exports PROVIDER_LABELS with Dutch display names', () => {
    expect(PROVIDER_LABELS.cito).toBe('Cito');
    expect(PROVIDER_LABELS.dia).toBe('DIA');
    expect(PROVIDER_LABELS.jij).toBe('JIJ');
  });
});
