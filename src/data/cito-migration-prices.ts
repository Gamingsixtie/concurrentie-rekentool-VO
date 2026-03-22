/**
 * Migratieprijzen: huidig Cito-platform vs. nieuw Cito-platform.
 *
 * Pas de waarden in CITO_MIGRATION_PRICES aan met de actuele tarieven.
 * Verander de structuur niet — alleen de getallen en verifiedAt.
 *
 * oldPricePerStudent = prijs huidig platform, per leerling per jaar (€)
 * newPricePerStudent = prijs nieuw platform, per leerling per jaar (€)
 * verifiedAt        = datum van laatste verificatie
 */

export interface CitoMigrationPriceRecord {
  moduleId: string;
  oldPricePerStudent: number;
  newPricePerStudent: number;
  verifiedAt: Date;
}

export const CITO_MIGRATION_PRICES: CitoMigrationPriceRecord[] = [
  // TODO: Vervang de onderstaande placeholder-tarieven door de werkelijke tarieven.
  {
    moduleId: 'rekenwiskunde',
    oldPricePerStudent: 4.50,
    newPricePerStudent: 4.50,
    verifiedAt: new Date('2026-01-01'),
  },
  {
    moduleId: 'nederlands',
    oldPricePerStudent: 4.50,
    newPricePerStudent: 4.50,
    verifiedAt: new Date('2026-01-01'),
  },
  {
    moduleId: 'engels',
    oldPricePerStudent: 4.50,
    newPricePerStudent: 4.50,
    verifiedAt: new Date('2026-01-01'),
  },
  {
    moduleId: 'taalverzorging',
    oldPricePerStudent: 3.80,
    newPricePerStudent: 3.80,
    verifiedAt: new Date('2026-01-01'),
  },
  {
    moduleId: 'sociaal-emotioneel',
    oldPricePerStudent: 3.50,
    newPricePerStudent: 3.50,
    verifiedAt: new Date('2026-01-01'),
  },
  {
    moduleId: 'cognitieve-capaciteiten',
    oldPricePerStudent: 6.50,
    newPricePerStudent: 6.50,
    verifiedAt: new Date('2026-01-01'),
  },
];
