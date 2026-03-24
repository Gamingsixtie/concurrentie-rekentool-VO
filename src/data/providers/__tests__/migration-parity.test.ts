import { describe, it, expect } from 'vitest';
import { DEFAULT_PRICES } from '../../default-prices';

/**
 * Migration parity test: snapshot of all 16 current DEFAULT_PRICES records.
 * This must PASS before Plan 02 restructuring and continue to pass after.
 * Guards against accidental price data corruption during refactoring.
 */
describe('DEFAULT_PRICES migration parity', () => {
  const expectedPrices: Array<{ moduleId: string; provider: string; amountPerStudent: number }> = [
    // Rekenwiskunde
    { moduleId: 'rekenwiskunde', provider: 'cito', amountPerStudent: 7.82 },
    { moduleId: 'rekenwiskunde', provider: 'dia', amountPerStudent: 3.36 },
    { moduleId: 'rekenwiskunde', provider: 'jij', amountPerStudent: 9.34 },
    // Nederlands
    { moduleId: 'nederlands', provider: 'cito', amountPerStudent: 7.82 },
    { moduleId: 'nederlands', provider: 'dia', amountPerStudent: 3.36 },
    { moduleId: 'nederlands', provider: 'jij', amountPerStudent: 9.34 },
    // Engels
    { moduleId: 'engels', provider: 'cito', amountPerStudent: 7.82 },
    { moduleId: 'engels', provider: 'dia', amountPerStudent: 5.84 },
    { moduleId: 'engels', provider: 'jij', amountPerStudent: 9.34 },
    // Taalverzorging
    { moduleId: 'taalverzorging', provider: 'cito', amountPerStudent: 3.75 },
    { moduleId: 'taalverzorging', provider: 'dia', amountPerStudent: 3.36 },
    // Sociaal-emotioneel
    { moduleId: 'sociaal-emotioneel', provider: 'cito', amountPerStudent: 3.00 },
    { moduleId: 'sociaal-emotioneel', provider: 'saqi', amountPerStudent: 3.50 },
    { moduleId: 'sociaal-emotioneel', provider: 'jij', amountPerStudent: 0 },
    // Cognitieve capaciteiten
    { moduleId: 'cognitieve-capaciteiten', provider: 'cito', amountPerStudent: 6.50 },
    { moduleId: 'cognitieve-capaciteiten', provider: 'dia', amountPerStudent: 9.75 },
  ];

  it('has exactly 16 price records', () => {
    expect(DEFAULT_PRICES).toHaveLength(16);
  });

  for (const expected of expectedPrices) {
    it(`${expected.moduleId}/${expected.provider} = ${expected.amountPerStudent}`, () => {
      const actual = DEFAULT_PRICES.find(
        (p) => p.moduleId === expected.moduleId && p.provider === expected.provider,
      );
      expect(actual, `Missing price record: ${expected.moduleId}/${expected.provider}`).toBeDefined();
      expect(actual!.amountPerStudent).toBe(expected.amountPerStudent);
    });
  }
});
