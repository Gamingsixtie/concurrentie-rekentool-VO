import { describe, it, expect } from 'vitest';
import { selectOptimalDiaPackage, calculateDiaModuleCosts } from '../dia-packages';
import { DIA_PACKAGES } from '../../data/dia-packages';

describe('selectOptimalDiaPackage', () => {
  // Individual prices from default-prices.ts
  const perModulePrices = new Map<string, number>([
    ['rekenwiskunde', 5.20],
    ['nederlands', 5.20],
    ['engels', 5.20],
    ['sociaal-emotioneel', 4.00],
  ]);

  it('Test 1: 2 DIA modules -> no package applies, individual pricing', () => {
    const result = selectOptimalDiaPackage(
      ['rekenwiskunde', 'nederlands'],
      DIA_PACKAGES,
      perModulePrices,
    );

    expect(result.selectedPackage).toBeNull();
    expect(result.totalCost).toBe(5.20 + 5.20); // 10.40 per student
    expect(result.individualTotal).toBe(5.20 + 5.20);
    expect(result.savings).toBe(0);
    expect(result.coveredModuleIds).toEqual([]);
  });

  it('Test 2: 3 DIA modules -> lvs-basis selected, savings calculated', () => {
    const result = selectOptimalDiaPackage(
      ['rekenwiskunde', 'nederlands', 'engels'],
      DIA_PACKAGES,
      perModulePrices,
    );

    expect(result.selectedPackage).not.toBeNull();
    expect(result.selectedPackage!.id).toBe('lvs-basis');
    expect(result.totalCost).toBe(13.00); // package price per student
    expect(result.individualTotal).toBeCloseTo(15.60); // 3 x 5.20
    expect(result.savings).toBeCloseTo(2.60); // 15.60 - 13.00
    expect(result.coveredModuleIds).toEqual(['rekenwiskunde', 'nederlands', 'engels']);
  });

  it('Test 3: 4 DIA modules including sociaal-emotioneel -> lvs-compleet selected because cheaper', () => {
    const result = selectOptimalDiaPackage(
      ['rekenwiskunde', 'nederlands', 'engels', 'sociaal-emotioneel'],
      DIA_PACKAGES,
      perModulePrices,
    );

    // lvs-basis (13.00) + sociaal-emotioneel individual (4.00) = 17.00
    // lvs-compleet (15.50) = 15.50
    // lvs-compleet is cheaper
    expect(result.selectedPackage).not.toBeNull();
    expect(result.selectedPackage!.id).toBe('lvs-compleet');
    expect(result.totalCost).toBe(15.50);
    expect(result.individualTotal).toBeCloseTo(19.60); // 3 x 5.20 + 4.00
    expect(result.savings).toBeCloseTo(4.10); // 19.60 - 15.50
  });

  it('Test 4: User override -- when per-module price is overridden, individual total uses the override', () => {
    const overriddenPrices = new Map<string, number>([
      ['rekenwiskunde', 4.50], // overridden from 5.20
      ['nederlands', 5.20],
      ['engels', 5.20],
    ]);

    const result = selectOptimalDiaPackage(
      ['rekenwiskunde', 'nederlands', 'engels'],
      DIA_PACKAGES,
      overriddenPrices,
    );

    expect(result.individualTotal).toBe(4.50 + 5.20 + 5.20); // 14.90
    expect(result.selectedPackage!.id).toBe('lvs-basis');
    expect(result.totalCost).toBe(13.00);
    expect(result.savings).toBeCloseTo(1.90); // 14.90 - 13.00
  });

  it('Test 5: Empty DIA modules -> null package, 0 total', () => {
    const result = selectOptimalDiaPackage(
      [],
      DIA_PACKAGES,
      perModulePrices,
    );

    expect(result.selectedPackage).toBeNull();
    expect(result.totalCost).toBe(0);
    expect(result.individualTotal).toBe(0);
    expect(result.savings).toBe(0);
    expect(result.coveredModuleIds).toEqual([]);
  });

  it('Test 6: Modules not in any package -> individual pricing for uncovered modules', () => {
    const pricesWithExtra = new Map<string, number>([
      ['rekenwiskunde', 5.20],
      ['nederlands', 5.20],
      ['engels', 5.20],
      ['taalverzorging', 3.80], // not in any DIA package
    ]);

    const result = selectOptimalDiaPackage(
      ['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging'],
      DIA_PACKAGES,
      pricesWithExtra,
    );

    // lvs-basis covers 3 modules (13.00), taalverzorging individual (3.80) = 16.80
    // lvs-compleet doesn't cover taalverzorging, only covers 3 of 4 selected = 15.50 + 3.80 = 19.30
    // Wait: lvs-compleet includes sociaal-emotioneel which is NOT selected here
    // So lvs-compleet covers rekenwiskunde, nederlands, engels (3 of its 4), but taalverzorging is uncovered
    // Actually: lvs-compleet includedModuleIds are ['rekenwiskunde', 'nederlands', 'engels', 'sociaal-emotioneel']
    // Selected are ['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging']
    // Overlap for lvs-compleet: rekenwiskunde, nederlands, engels (3 modules) -- but minModules=3 so it qualifies
    // Cost: 15.50 + 3.80 (taalverzorging uncovered) = 19.30
    // lvs-basis: 13.00 + 3.80 = 16.80
    // lvs-basis is cheaper
    expect(result.selectedPackage!.id).toBe('lvs-basis');
    expect(result.totalCost).toBe(13.00 + 3.80); // 16.80
    expect(result.coveredModuleIds).toEqual(['rekenwiskunde', 'nederlands', 'engels']);
  });
});

describe('calculateDiaModuleCosts', () => {
  it('returns per-module cost map with package and individual prices', () => {
    const diaPerModulePrices = new Map<string, number>([
      ['rekenwiskunde', 5.20],
      ['nederlands', 5.20],
      ['engels', 5.20],
    ]);

    const result = calculateDiaModuleCosts(
      ['rekenwiskunde', 'nederlands', 'engels'],
      100,
      diaPerModulePrices,
      DIA_PACKAGES,
    );

    // lvs-basis should be selected
    expect(result.packageResult.selectedPackage!.id).toBe('lvs-basis');
    expect(result.total).toBe(13.00 * 100); // 1300

    // Each covered module should be marked as package price
    const rw = result.perModule.get('rekenwiskunde');
    expect(rw).toBeDefined();
    expect(rw!.isPackagePrice).toBe(true);
    expect(rw!.packageId).toBe('lvs-basis');
    expect(rw!.cost).toBeCloseTo(13.00 / 3 * 100); // allocated evenly
  });
});
