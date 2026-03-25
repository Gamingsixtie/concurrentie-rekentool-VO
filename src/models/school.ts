export const SCHOOL_LEVELS = ['vmbo-b', 'vmbo-k', 'vmbo-gt', 'havo', 'vwo'] as const;
export type SchoolLevel = typeof SCHOOL_LEVELS[number];

export const SCHOOL_LEVEL_LABELS: Record<SchoolLevel, string> = {
  'vmbo-b': 'VMBO Basis',
  'vmbo-k': 'VMBO Kader',
  'vmbo-gt': 'VMBO GT',
  'havo': 'HAVO',
  'vwo': 'VWO',
};

/** Leerjaren per niveau */
export const YEARS_PER_LEVEL: Record<SchoolLevel, number[]> = {
  'vmbo-b': [1, 2, 3, 4],
  'vmbo-k': [1, 2, 3, 4],
  'vmbo-gt': [1, 2, 3, 4],
  'havo': [1, 2, 3, 4, 5],
  'vwo': [1, 2, 3, 4, 5, 6],
};

export type CurrentProvider =
  | 'cito-oud'   // huidig Cito platform
  | 'cito-nieuw' // nieuw Cito platform (al klant)
  | 'dia'
  | 'jij'
  | 'saqi'       // SAQI — alleen sociaal-emotioneel instrument
  | 'overig'     // andere aanbieder (naam invulbaar)
  | 'geen';      // module niet in gebruik

export interface ModuleCurrentSetup {
  moduleId: string;
  currentProvider: CurrentProvider;
  pricePerStudent: number | null; // null = gebruik publicatieprijs van die aanbieder
  customProviderName?: string;    // alleen bij currentProvider === 'overig'
}

export type Scenario = 'A' | 'B' | 'C';

/**
 * Maps a CurrentProvider value to the provider key used in DEFAULT_PRICES.
 * Returns null for providers without publication pricing ('geen', 'overig').
 */
export function toPriceProvider(provider: CurrentProvider): string | null {
  switch (provider) {
    case 'cito-oud':
    case 'cito-nieuw':
      return 'cito';
    case 'dia':
      return 'dia';
    case 'jij':
      return 'jij';
    case 'saqi':
      return 'saqi';
    case 'geen':
    case 'overig':
      return null;
  }
}

export const CURRENT_PROVIDER_LABELS: Record<CurrentProvider, string> = {
  'cito-oud':   'Cito (huidig platform)',
  'cito-nieuw': 'Cito (nieuw platform)',
  'dia':        'DIA',
  'jij':        'JIJ (IEP)',
  'saqi':       'SAQI',
  'overig':     'Andere aanbieder',
  'geen':       'Geen / nog niet bepaald',
};

export const SCENARIO_LABELS: Record<Scenario, { title: string; description: string }> = {
  A: {
    title: 'Cito vs. concurrentie',
    description: 'Vergelijk de kosten van Cito met DIA en JIJ (IEP) op basis van publicatieprijzen',
  },
  B: {
    title: 'Huidig naar nieuw Cito-platform',
    description: 'Bereken de business case voor de overstap naar het nieuwe Cito-platform',
  },
  C: {
    title: 'Huidig Cito vs. concurrentie',
    description: 'Vergelijk de huidige Cito-kosten met een concurrent (retentie-perspectief)',
  },
};

// --- CRM-lite types ---

export const PIPELINE_STATUSES = ['prospect', 'contact-gelegd', 'demo-presentatie', 'offerte', 'gewonnen', 'verloren'] as const;
export type PipelineStatus = typeof PIPELINE_STATUSES[number];

export const PIPELINE_STATUS_LABELS: Record<PipelineStatus, string> = {
  'prospect': 'Prospect',
  'contact-gelegd': 'Contact gelegd',
  'demo-presentatie': 'Demo/Presentatie',
  'offerte': 'Offerte',
  'gewonnen': 'Gewonnen',
  'verloren': 'Verloren',
};

export const PIPELINE_STATUS_ORDER: Record<PipelineStatus, number> = {
  'prospect': 0,
  'contact-gelegd': 1,
  'demo-presentatie': 2,
  'offerte': 3,
  'gewonnen': 4,
  'verloren': 5,
};

export const DMU_POSITIONS = ['beslisser', 'inkoper', 'adviseur', 'gebruiker', 'beinvloeder', 'overig'] as const;
export type DMUPosition = typeof DMU_POSITIONS[number];

export const DMU_POSITION_LABELS: Record<DMUPosition, string> = {
  beslisser: 'Beslisser',
  inkoper: 'Inkoper',
  adviseur: 'Adviseur',
  gebruiker: 'Gebruiker',
  beinvloeder: 'Beinvloeder',
  overig: 'Overig',
};

/** Hierarchy order for display sorting (beslisser first) */
export const DMU_POSITION_ORDER: Record<DMUPosition, number> = {
  beslisser: 0,
  inkoper: 1,
  adviseur: 2,
  gebruiker: 3,
  beinvloeder: 4,
  overig: 5,
};

/** Migration mapping from old DMU positions to new ones */
export const DMU_MIGRATION_MAP: Record<string, DMUPosition> = {
  coordinator: 'gebruiker',
  mt: 'beslisser',
  finance: 'inkoper',
  overig: 'overig',
};

export const PREFERRED_CHANNELS = ['email', 'telefoon', 'teams', 'overig'] as const;
export type PreferredChannel = typeof PREFERRED_CHANNELS[number];

export const AUTHORITY_LEVELS = ['adviserend', 'beslissend', 'budgethouder'] as const;
export type AuthorityLevel = typeof AUTHORITY_LEVELS[number];

// --- Engagement status (DMU klantreis) ---

export const ENGAGEMENT_STATUSES = [
  'nog-niet-benaderd',
  'in-gesprek',
  'positief',
  'wacht-op-intern',
  'akkoord',
  'afgehaakt',
] as const;
export type EngagementStatus = typeof ENGAGEMENT_STATUSES[number];

export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, string> = {
  'nog-niet-benaderd': 'Nog niet benaderd',
  'in-gesprek': 'In gesprek',
  'positief': 'Positief',
  'wacht-op-intern': 'Wacht op intern',
  'akkoord': 'Akkoord',
  'afgehaakt': 'Afgehaakt',
};

/** Stagnation threshold in days */
export const STAGNATION_THRESHOLD_DAYS = 30;
