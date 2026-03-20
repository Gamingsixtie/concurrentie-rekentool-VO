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
