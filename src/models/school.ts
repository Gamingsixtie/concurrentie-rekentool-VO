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

export type Scenario = 'A' | 'B';

export type CurrentProvider =
  | 'cito-oud'   // huidig Cito platform
  | 'cito-nieuw' // nieuw Cito platform (al klant)
  | 'dia'
  | 'jij'
  | 'overig'     // andere aanbieder (naam invulbaar)
  | 'geen';      // module niet in gebruik

export const CURRENT_PROVIDER_LABELS: Record<CurrentProvider, string> = {
  'cito-oud':   'Cito (huidig platform)',
  'cito-nieuw': 'Cito (nieuw platform)',
  'dia':        'DIA',
  'jij':        'JIJ (IEP)',
  'overig':     'Andere aanbieder',
  'geen':       'Geen / nog niet bepaald',
};

export interface ModuleCurrentSetup {
  moduleId: string;
  currentProvider: CurrentProvider;
  pricePerStudent: number | null; // null = gebruik publicatieprijs van die aanbieder
  customProviderName?: string;    // alleen bij currentProvider === 'overig'
}

export const SCENARIO_LABELS: Record<Scenario, { title: string; description: string }> = {
  A: {
    title: 'Cito vs. concurrentie',
    description: 'Vergelijk de kosten van Cito met DIA en JIJ (IEP) op basis van publicatieprijzen',
  },
  B: {
    title: 'Huidig naar nieuw Cito-platform',
    description: 'Bereken de business case voor de overstap naar het nieuwe Cito-platform',
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

export const DMU_POSITIONS = ['coordinator', 'mt', 'finance', 'overig'] as const;
export type DMUPosition = typeof DMU_POSITIONS[number];

export const DMU_POSITION_LABELS: Record<DMUPosition, string> = {
  coordinator: 'Coordinator',
  mt: 'MT',
  finance: 'Finance',
  overig: 'Overig',
};

export const PREFERRED_CHANNELS = ['email', 'telefoon', 'teams', 'overig'] as const;
export type PreferredChannel = typeof PREFERRED_CHANNELS[number];

export const AUTHORITY_LEVELS = ['adviserend', 'beslissend', 'budgethouder'] as const;
export type AuthorityLevel = typeof AUTHORITY_LEVELS[number];
