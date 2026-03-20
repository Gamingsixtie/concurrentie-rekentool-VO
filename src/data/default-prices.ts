import type { PriceRecord } from '../models/pricing';

/**
 * Placeholder pricing data for development and testing.
 * Real pricing data will be added in Phase 2.
 */
export const DEFAULT_PRICES: PriceRecord[] = [
  {
    moduleId: 'rekenwiskunde',
    provider: 'cito',
    amountPerStudent: 4.5,
    source: 'publication',
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },
  {
    moduleId: 'rekenwiskunde',
    provider: 'dia',
    amountPerStudent: 5.2,
    source: 'publication',
    sourceLabel: 'DIA prijslijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },
  {
    moduleId: 'nederlands',
    provider: 'cito',
    amountPerStudent: 4.5,
    source: 'publication',
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },
];
