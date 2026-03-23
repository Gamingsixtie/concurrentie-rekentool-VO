import type { PriceRecord } from '../models/pricing';

/**
 * Default publication pricing data for all providers and modules.
 * Only modules actually offered by a provider have a record.
 * Prices are per student per year based on the most recent verified source.
 *
 * DIA (2025-2026):
 * Bron: DIA Webshop (shop.dia.nl), geverifieerd maart 2026.
 * Per leerling per schooljaar (excl. btw), inclusief nul- en volgmeting.
 * Staffelkorting: 500+ = 5%, 1000+ = 10% (niet meegenomen in basisprijzen).
 *
 * JIJ! (Bureau ICE):
 * Bron: Deskresearch MediaTest juni 2024 (R-5043), in opdracht van Cito.
 * JIJ! uses a license + per-test model, not a flat per-student rate.
 * The amountPerStudent values are calculated for a mid-size school
 * (800 students, Licentie 3, 2 administrations/student/year).
 * See src/data/jij-license-tiers.ts for the full tiered pricing model.
 */

const JIJ_NOTE =
  'JIJ! hanteert een licentie + toetsprijs-model. Prijs berekend als ' +
  '(€975 jaarfee + 1.600×€3,75 toetskosten + €500 Magister-koppeling) / 800 leerlingen = €9,34. ' +
  'Werkelijke kosten variëren sterk met schoolgrootte. ' +
  'Bron: deskresearch MediaTest 2024 (R-5043). Neem contact op met Bureau ICE voor actuele tarieven.';

export const DEFAULT_PRICES: PriceRecord[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // REKENWISKUNDE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    moduleId: 'rekenwiskunde',
    provider: 'cito',
    amountPerStudent: 7.82,
    source: 'publication',
    sourceLabel: 'Nieuw platform — Basis bundel €23,45 ÷ 3 kern = €7,82/module',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: true,
    note: 'Op het nieuwe Cito-platform zijn kernvaardigheden (NL/RE/EN) alleen als bundel beschikbaar. Individuele prijs is €23,45 ÷ 3.',
  },
  {
    moduleId: 'rekenwiskunde',
    provider: 'dia',
    amountPerStudent: 3.36,
    source: 'publication',
    sourceLabel: 'DIA Webshop — VO Diacijfer 2025-2026',
    verifiedAt: new Date('2026-03-21'),
    isPublicationPrice: true,
    note: 'Diacijfer (rekenniveau) los. Diawisk (wiskundig redeneren) apart beschikbaar voor €3,36.',
  },
  {
    moduleId: 'rekenwiskunde',
    provider: 'jij',
    amountPerStudent: 9.34,
    source: 'manual',
    sourceLabel: 'Berekend o.b.v. deskresearch MediaTest 2024 (R-5043) — Licentie 3, 800 lln, 2 afnames/lln',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: false,
    note: JIJ_NOTE,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEDERLANDS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    moduleId: 'nederlands',
    provider: 'cito',
    amountPerStudent: 7.82,
    source: 'publication',
    sourceLabel: 'Nieuw platform — Basis bundel €23,45 ÷ 3 kern = €7,82/module',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: true,
    note: 'Op het nieuwe Cito-platform zijn kernvaardigheden (NL/RE/EN) alleen als bundel beschikbaar. Individuele prijs is €23,45 ÷ 3.',
  },
  {
    moduleId: 'nederlands',
    provider: 'dia',
    amountPerStudent: 3.36,
    source: 'publication',
    sourceLabel: 'DIA Webshop — VO Diatekst NE 2025-2026',
    verifiedAt: new Date('2026-03-21'),
    isPublicationPrice: true,
    note: 'Diatekst NE (begrijpend lezen) los. Diawoord NE (woordenschat) apart €3,36. Pakket NE (beide): €5,84.',
  },
  {
    moduleId: 'nederlands',
    provider: 'jij',
    amountPerStudent: 9.34,
    source: 'manual',
    sourceLabel: 'Berekend o.b.v. deskresearch MediaTest 2024 (R-5043) — Licentie 3, 800 lln, 2 afnames/lln',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: false,
    note: JIJ_NOTE,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGELS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    moduleId: 'engels',
    provider: 'cito',
    amountPerStudent: 7.82,
    source: 'publication',
    sourceLabel: 'Nieuw platform — Basis bundel €23,45 ÷ 3 kern = €7,82/module',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: true,
    note: 'Op het nieuwe Cito-platform zijn kernvaardigheden (NL/RE/EN) alleen als bundel beschikbaar. Individuele prijs is €23,45 ÷ 3.',
  },
  {
    moduleId: 'engels',
    provider: 'dia',
    amountPerStudent: 5.84,
    source: 'publication',
    sourceLabel: 'DIA Webshop — VO pakket EN compleet 2025-2026',
    verifiedAt: new Date('2026-03-21'),
    isPublicationPrice: true,
    note: 'Pakket EN compleet (Diatekst EN + Diawoord EN). Individueel: Diatekst EN €3,36, Diawoord EN €3,36.',
  },
  {
    moduleId: 'engels',
    provider: 'jij',
    amountPerStudent: 9.34,
    source: 'manual',
    sourceLabel: 'Berekend o.b.v. deskresearch MediaTest 2024 (R-5043) — Licentie 3, 800 lln, 2 afnames/lln',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: false,
    note: JIJ_NOTE + ' JIJ! biedt Engels aan op ERK-niveaus A1-B2/C1 (lezen + luisteren).',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TAALVERZORGING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    moduleId: 'taalverzorging',
    provider: 'cito',
    amountPerStudent: 3.75,
    source: 'publication',
    sourceLabel: 'Nieuw platform — Taalverzorging los €3,75/lln (of in Plus-bundel)',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: true,
    note: 'Taalverzorging is op het nieuwe platform apart beschikbaar voor €3,75, of onderdeel van de Plus-bundel (€31,44 incl. SEF + LWH).',
  },
  {
    moduleId: 'taalverzorging',
    provider: 'dia',
    amountPerStudent: 3.36,
    source: 'publication',
    sourceLabel: 'DIA Webshop — VO Diaspel 2025-2026 (individuele prijs)',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: true,
    note: 'Diaspel (digitaal dictee voor spelling). Ook in Pakket NE compleet (Diatekst + Diawoord + Diaspel): €8,58.',
  },
  // JIJ! biedt geen apart taalverzorgingsproduct aan

  // ═══════════════════════════════════════════════════════════════════════════
  // SOCIAAL-EMOTIONEEL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    moduleId: 'sociaal-emotioneel',
    provider: 'cito',
    amountPerStudent: 3.0,
    source: 'publication',
    sourceLabel: 'Nieuw platform — SEF los (excl. Leer-werkhouding), o.b.v. PowerPoint/Excel uitsplitsing',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: true,
  },
  // DIA biedt geen eigen sociaal-emotioneel instrument aan
  {
    moduleId: 'sociaal-emotioneel',
    provider: 'saqi',
    amountPerStudent: 3.5,
    source: 'publication',
    sourceLabel: 'SAQI website — €3,50/lln/jaar, maart 2026',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: true,
    note: 'SAQI: School Attitude Questionnaire Internet. COTAN-gecertificeerd, adaptief. Directe concurrent van Cito SEF voor sociaal-emotioneel functioneren.',
  },
  {
    moduleId: 'sociaal-emotioneel',
    provider: 'jij',
    amountPerStudent: 0,
    source: 'manual',
    sourceLabel: 'Bureau ICE — onderdeel van JIJ! LVS licentie (geen meerprijs)',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: false,
    note: 'JIJ! Hart & Handen zelfevaluaties (leerbenadering, creatief vermogen, sociale context) zitten in de basislicentie. Geen aparte kosten per leerling.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COGNITIEVE CAPACITEITEN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    moduleId: 'cognitieve-capaciteiten',
    provider: 'cito',
    amountPerStudent: 6.5,
    source: 'publication',
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  },
  {
    moduleId: 'cognitieve-capaciteiten',
    provider: 'dia',
    amountPerStudent: 9.75,
    source: 'manual',
    sourceLabel: 'Deskresearch MediaTest juni 2024 (R-5043) — Dia NSCCT digitaal',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: false,
    note: 'Dia NSCCT (Niet-Schoolse Cognitieve Capaciteitentoets). Digitaal: €9,75/leerling. Papier: €4,50/leerling. Prijs uit 2024.',
  },
  // JIJ! biedt geen cognitieve capaciteitentoets aan
];
