import type { PriceRecord } from '../models/pricing';

/**
 * Default publication pricing data for all providers and modules.
 * Only modules actually offered by a provider have a record.
 * Prices are per student per year based on publication lists 2025-2026.
 *
 * JIJ! (Bureau ICE) note:
 * JIJ! uses a license + per-test model, not a flat per-student rate.
 * The amountPerStudent values below are estimates based on a mid-size school
 * (800 students, Licentie 2, 2 administrations/student/year).
 * Base data: schooljaar 2022-2023, inflation-corrected with CBS CPI (+10,8%).
 * Actual 2025-2026 prices may differ — contact Bureau ICE for current rates.
 * See src/data/jij-license-tiers.ts for the full tiered pricing model.
 */

const JIJ_NOTE =
  'Schatting o.b.v. prijslijst 22-23 + CBS-inflatiecorrectie (+10,8%). ' +
  'JIJ! hanteert een licentie + toetsprijs-model; werkelijke kosten hangen af van schoolgrootte en afnameaantal. ' +
  'Neem contact op met Bureau ICE voor actuele tarieven.';

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
    amountPerStudent: 9.0,
    source: 'manual',
    sourceLabel: 'Inflatiecorrectie prijslijst 22-23 (CBS CPI +10,8%) — Licentie 2, 800 lln, 2 afnames/lln',
    verifiedAt: new Date('2026-03-21'),
    isPublicationPrice: false,
    note: JIJ_NOTE,
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
    amountPerStudent: 9.0,
    source: 'manual',
    sourceLabel: 'Inflatiecorrectie prijslijst 22-23 (CBS CPI +10,8%) — Licentie 2, 800 lln, 2 afnames/lln',
    verifiedAt: new Date('2026-03-21'),
    isPublicationPrice: false,
    note: JIJ_NOTE,
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
  // JIJ biedt Engels aan (ERK A1-B2/C1) maar exacte prijs onbekend — niet opgenomen

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
  // JIJ biedt zelfevaluaties aan (leerbenadering, creatief vermogen, sociale context)
  // maar exacte prijs onbekend — niet opgenomen

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
