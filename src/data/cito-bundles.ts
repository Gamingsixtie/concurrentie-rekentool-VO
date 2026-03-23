/**
 * Cito bundle pricing definitions.
 *
 * Three purchasing options for Cito modules:
 * 1. Individual — per module at published list price (default-prices.ts)
 * 2. Basis — kern modules bundled at a fixed per-student rate
 * 3. Plus — extended bundle including taalverzorging and sociaal-emotioneel
 *
 * Pricing derived from:
 * - Intel-rapport 2026-03-23, secties 0 en B2/B4
 * - Cito nieuw platform prijslijst 2026-2027
 *
 * Contract period multipliers apply to ALL providers (not just Cito).
 * Cito offers multi-year discounts; DIA, JIJ and SAQI are assumed at face value (3x for 3yr).
 */

export type CitoBundleType = 'individual' | 'basis' | 'plus';

export type ContractPeriod = 'annual' | 'three-year' | 'three-year-duo';

export interface CitoBundle {
  id: CitoBundleType;
  name: string;
  description: string;
  /** Module IDs included in this bundle. Empty = no bundle, use individual pricing. */
  includedModuleIds: string[];
  /** Total price per student per year for all included modules combined. null = use individual prices. */
  pricePerStudent: number | null;
  /**
   * Per-period annual price per student. When a contract period is selected,
   * this overrides the generic citoFactor from CONTRACT_PERIODS.
   * null entries fall back to factor-based calculation.
   */
  contractPrices?: Partial<Record<ContractPeriod, number>>;
}

export const CITO_BUNDLES: CitoBundle[] = [
  {
    id: 'individual',
    name: 'Per module',
    description: 'Standaard publicatieprijzen per module',
    includedModuleIds: [],
    pricePerStudent: null,
  },
  {
    id: 'basis',
    name: 'Basis',
    description: 'Kernpakket: Rekenwiskunde, Nederlands en Engels',
    includedModuleIds: ['rekenwiskunde', 'nederlands', 'engels'],
    pricePerStudent: 23.45,
    contractPrices: {
      annual: 23.45,
      'three-year': 22.05,
      'three-year-duo': 21.05,
    },
  },
  {
    id: 'plus',
    name: 'Plus',
    description: 'Kern + Taalverzorging en Sociaal-emotioneel',
    includedModuleIds: ['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging', 'sociaal-emotioneel'],
    pricePerStudent: 31.44,
    contractPrices: {
      annual: 31.44,
      'three-year': 28.30,
      'three-year-duo': 27.30,
    },
  },
];

/**
 * Contract period configuration.
 *
 * The factor is a fallback multiplier for individual (non-bundle) pricing.
 * When a bundle is selected with contractPrices, those take precedence.
 * - Annual: 1x (one year)
 * - 3-year: 2.85x for Cito (5% annual discount), 3.00x for other providers
 * - 3-year + DUO: 2.70x for Cito (10% annual discount via DUO subsidy), 3.00x for others
 */
export interface ContractPeriodConfig {
  id: ContractPeriod;
  label: string;
  shortLabel: string;
  years: number;
  citoFactor: number;
  otherFactor: number;
  note: string | null;
}

export const CONTRACT_PERIODS: ContractPeriodConfig[] = [
  {
    id: 'annual',
    label: 'Per jaar',
    shortLabel: '1 jr',
    years: 1,
    citoFactor: 1,
    otherFactor: 1,
    note: null,
  },
  {
    id: 'three-year',
    label: '3-jarig contract',
    shortLabel: '3 jr',
    years: 3,
    citoFactor: 2.85,
    otherFactor: 3,
    note: 'Cito 3-jarig contract: ~6% korting per jaar. DIA/JIJ/SAQI: 3× jaarprijs.',
  },
  {
    id: 'three-year-duo',
    label: '3-jarig + DUO-subsidie',
    shortLabel: '3 jr + DUO',
    years: 3,
    citoFactor: 2.70,
    otherFactor: 3,
    note: 'Cito 3-jarig + DUO: ~10% korting per jaar. DIA/JIJ/SAQI: 3× jaarprijs. DUO-subsidie onder voorbehoud van toekenning.',
  },
];

export function getContractPeriodConfig(period: ContractPeriod): ContractPeriodConfig {
  return CONTRACT_PERIODS.find((p) => p.id === period) ?? CONTRACT_PERIODS[0];
}

export function getCitoBundle(bundleType: CitoBundleType): CitoBundle {
  return CITO_BUNDLES.find((b) => b.id === bundleType) ?? CITO_BUNDLES[0];
}

/**
 * Get the effective Cito factor for a bundle + contract period combo.
 * When the bundle has explicit contractPrices, compute the factor from those.
 * Otherwise fall back to the generic citoFactor.
 */
export function getCitoFactorForBundle(
  bundle: CitoBundle,
  period: ContractPeriod,
): number {
  const config = getContractPeriodConfig(period);
  if (config.years === 1) return 1;

  const annualPrice = bundle.pricePerStudent;
  const periodPrice = bundle.contractPrices?.[period];

  if (annualPrice && periodPrice) {
    // factor = (discounted annual price × years) / annual price
    return (periodPrice * config.years) / annualPrice;
  }

  return config.citoFactor;
}
