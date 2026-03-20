import type { PriceRecord } from '../models/pricing';
import type { Assumption } from '../models/assumptions';
import type { SchoolLevel, Scenario } from '../models/school';

export interface SchoolProfile {
  levels: SchoolLevel[];
  studentCounts: Record<string, Record<number, number>>;
  selectedModules: string[];
  scenario: Scenario | null;
}

export interface CalculationInput {
  schoolProfile: SchoolProfile;
  selectedModules: string[];
  prices: PriceRecord[];
  assumptions: Assumption[];
}

/** Placeholder for Phase 2 calculation results */
export interface CalculationResult {
  // Will be defined in Phase 2
}
