/**
 * Cito bundle pricing definitions.
 *
 * Three purchasing options for Cito modules:
 * 1. Individual — per module at published list price (default-prices.ts)
 * 2. Basis — kern modules bundled at a fixed per-student rate
 * 3. Plus — extended bundle including taalverzorging and sociaal-emotioneel
 *
 * Pricing derived from:
 * - Intel-rapport 2026-03-23, secties 0 en B4
 * - Cito-migration-prices.ts (Basis 1jr = €23,45 / 3 kern)
 * - Gap analysis: €17,95 bundel (3 kern bij meerjarig contract)
 *
 * Contract period multipliers apply to ALL providers (not just Cito).
 * Cito offers multi-year discounts; DIA and JIJ are assumed at face value (3x for 3yr).
 */

export type CitoBundleType = 'individual' | 'basis' | 'plus';

export interface CitoBundle {
  id: CitoBundleType;
  name: string;
  description: string;
  /** Module IDs included in this bundle. Empty = no bundle, use individual pricing. */
  includedModuleIds: string[];
  /** Total price per student per year for all included modules combined. null = use individual prices. */
  pricePerStudent: number | null;
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
    pricePerStudent: 17.95,
  },
  {
    id: 'plus',
    name: 'Plus',
    description: 'Kern + Taalverzorging en Sociaal-emotioneel',
    includedModuleIds: ['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging', 'sociaal-emotioneel'],
    pricePerStudent: 23.45,
  },
];

/**
 * Contract period configuration.
 *
 * The factor is the multiplier for the total cost over the contract period.
 * - Annual: 1x (one year)
 * - 3-year: 2.85x for Cito (5% annual discount), 3.00x for other providers
 * - 3-year + DUO: 2.70x for Cito (10% annual discount via DUO subsidy), 3.00x for others
 */
export type ContractPeriod = 'annual' | 'three-year' | 'three-year-duo';

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
    note: 'Cito 3-jarig contract: 5% korting per jaar (factor 2,85×). DIA/JIJ: 3× jaarprijs.',
  },
  {
    id: 'three-year-duo',
    label: '3-jarig + DUO-subsidie',
    shortLabel: '3 jr + DUO',
    years: 3,
    citoFactor: 2.70,
    otherFactor: 3,
    note: 'Cito 3-jarig + DUO: 10% korting per jaar (factor 2,70×). DIA/JIJ: 3× jaarprijs. DUO-subsidie onder voorbehoud van toekenning.',
  },
];

export function getContractPeriodConfig(period: ContractPeriod): ContractPeriodConfig {
  return CONTRACT_PERIODS.find((p) => p.id === period) ?? CONTRACT_PERIODS[0];
}

export function getCitoBundle(bundleType: CitoBundleType): CitoBundle {
  return CITO_BUNDLES.find((b) => b.id === bundleType) ?? CITO_BUNDLES[0];
}
