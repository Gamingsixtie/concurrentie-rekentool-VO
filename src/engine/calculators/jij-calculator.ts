import type { ProviderPriceCalculator, ModulePriceResult } from './types';
import type { JijProviderConfig } from '@/data/providers/jij';

/**
 * JIJ! calculator: tiered-license pricing varying with school size.
 *
 * JIJ! uses a fundamentally different model: fixed annual license fee + per-test fee.
 * The effective per-student cost changes based on school size (tier selection).
 *
 * Stateless: pure functions wrapped in a class for the interface.
 */
export class JijCalculator implements ProviderPriceCalculator {
  constructor(private readonly config: JijProviderConfig) {}

  calculateModule(
    moduleId: string,
    totalStudents: number,
    overridePrice?: number,
  ): ModulePriceResult | null {
    // Look up module in defaultPrices
    const defaultPrice = this.config.defaultPrices.find(
      (p) => p.moduleId === moduleId,
    );

    if (!defaultPrice) {
      return null;
    }

    // Override takes precedence
    if (overridePrice !== undefined) {
      return {
        pricePerStudent: overridePrice,
        totalCost: overridePrice * totalStudents,
        breakdown: [
          {
            label: `Schoolspecifieke prijs (overschrijving): EUR ${overridePrice.toFixed(2)}/lln`,
            amount: overridePrice * totalStudents,
          },
        ],
        isPackagePrice: false,
      };
    }

    // Modules included in the license at no extra cost (amountPerStudent === 0)
    if (defaultPrice.amountPerStudent === 0) {
      return {
        pricePerStudent: 0,
        totalCost: 0,
        breakdown: [
          {
            label: 'Onderdeel van JIJ! licentie (geen meerprijs)',
            amount: 0,
          },
        ],
        isPackagePrice: false,
      };
    }

    // Compute tier based on total administrations
    const { tiers, defaultTestsPerStudent } = this.config.pricingStrategy;
    const totalAdministrations = totalStudents * defaultTestsPerStudent;

    // Find matching tier
    const tier =
      tiers.find(
        (t) =>
          totalAdministrations >= t.minAdministrations &&
          totalAdministrations <= t.maxAdministrations,
      ) ?? tiers[tiers.length - 1]; // fallback to last (smallest) tier

    const licenseCostPerStudent = tier.annualFee / totalStudents;
    const testCostPerStudent = defaultTestsPerStudent * tier.pricePerTest;
    const pricePerStudent =
      Math.round((licenseCostPerStudent + testCostPerStudent) * 100) / 100;
    const totalCost = pricePerStudent * totalStudents;

    return {
      pricePerStudent,
      totalCost,
      breakdown: [
        {
          label: `${tier.label}`,
          amount: tier.annualFee,
        },
        {
          label: `Licentiekosten: EUR ${tier.annualFee.toFixed(2)} / ${totalStudents} leerlingen = EUR ${licenseCostPerStudent.toFixed(2)}/lln`,
          amount: licenseCostPerStudent,
        },
        {
          label: `Toetskosten: ${defaultTestsPerStudent} afnames x EUR ${tier.pricePerTest.toFixed(2)} = EUR ${testCostPerStudent.toFixed(2)}/lln`,
          amount: testCostPerStudent,
        },
        {
          label: `Totaal per leerling: EUR ${pricePerStudent.toFixed(2)}/lln`,
          amount: pricePerStudent,
        },
      ],
      isPackagePrice: false,
      tierId: tier.tier,
    };
  }

  calculateAll(
    selectedModuleIds: string[],
    totalStudents: number,
    overridePrices?: Map<string, number>,
  ): Map<string, ModulePriceResult> {
    const results = new Map<string, ModulePriceResult>();

    for (const moduleId of selectedModuleIds) {
      const override = overridePrices?.get(moduleId);
      const result = this.calculateModule(moduleId, totalStudents, override);
      if (result) {
        results.set(moduleId, result);
      }
    }

    return results;
  }
}
