import type { PriceRecord } from '../models/pricing';

/**
 * Default publication pricing data for all providers and modules.
 * Only modules actually offered by a provider have a record.
 * Prices are per student per year based on publication lists 2025-2026.
 */
export const DEFAULT_PRICES: PriceRecord[] = [
  // --- Rekenwiskunde ---
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
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },
  {
    moduleId: 'rekenwiskunde',
    provider: 'jij',
    amountPerStudent: 4.8,
    source: 'publication',
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },

  // --- Nederlands ---
  {
    moduleId: 'nederlands',
    provider: 'cito',
    amountPerStudent: 4.5,
    source: 'publication',
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },
  {
    moduleId: 'nederlands',
    provider: 'dia',
    amountPerStudent: 5.2,
    source: 'publication',
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },
  {
    moduleId: 'nederlands',
    provider: 'jij',
    amountPerStudent: 4.8,
    source: 'publication',
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },

  // --- Engels ---
  {
    moduleId: 'engels',
    provider: 'cito',
    amountPerStudent: 4.5,
    source: 'publication',
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },
  {
    moduleId: 'engels',
    provider: 'dia',
    amountPerStudent: 5.2,
    source: 'publication',
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },
  // JIJ does not offer Engels

  // --- Taalverzorging ---
  {
    moduleId: 'taalverzorging',
    provider: 'cito',
    amountPerStudent: 3.8,
    source: 'publication',
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },
  // DIA does not offer Taalverzorging separately
  // JIJ does not offer Taalverzorging

  // --- Sociaal-emotioneel ---
  {
    moduleId: 'sociaal-emotioneel',
    provider: 'cito',
    amountPerStudent: 3.5,
    source: 'publication',
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },
  {
    moduleId: 'sociaal-emotioneel',
    provider: 'dia',
    amountPerStudent: 4.0,
    source: 'publication',
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },
  // JIJ does not offer Sociaal-emotioneel

  // --- Cognitieve capaciteiten ---
  {
    moduleId: 'cognitieve-capaciteiten',
    provider: 'cito',
    amountPerStudent: 6.5,
    source: 'publication',
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },
  // DIA does not offer Cognitieve capaciteiten
  // JIJ does not offer Cognitieve capaciteiten
];
