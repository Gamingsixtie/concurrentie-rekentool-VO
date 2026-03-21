import type { SchoolLevel, Scenario, ModuleCurrentSetup } from '@/models/school';

export interface PriceOverride {
  moduleId: string;
  provider: 'cito' | 'dia' | 'jij';
  amount: number;
}

export interface SchoolRecord {
  id?: number;
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  isComplete: boolean;
  completedSteps: number[];

  // Wizard data
  levels: SchoolLevel[];
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>;
  selectedModules: string[];
  moduleSetups: ModuleCurrentSetup[];
  scenario: Scenario | null;

  // Price comparison data
  appliedOverrides: PriceOverride[];
  migrationHourlyRate: number;
  migrationTimeSavingOverrides: Record<string, number>;
}
