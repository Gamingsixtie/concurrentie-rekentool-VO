import { SCHOOL_LEVEL_LABELS } from '@/models/school';
import type { SchoolLevel } from '@/models/school';
import { db } from './database';
import type { SchoolRecord, PriceOverride } from './types';
import { uniqueSlug } from '@/lib/slugify';

export interface V1MigrationResult {
  success: boolean;
  schoolRecord?: Partial<SchoolRecord>;
  suggestedName?: string;
  error?: string;
}

export function detectV1Data(): boolean {
  return localStorage.getItem('rekentool-school-profile') !== null;
}

export function extractV1Data(): V1MigrationResult {
  try {
    const raw = localStorage.getItem('rekentool-school-profile');
    if (!raw) return { success: false, error: 'Geen gegevens gevonden' };

    const parsed = JSON.parse(raw);
    const state = parsed?.state;

    if (!state || !Array.isArray(state.levels)) {
      return { success: false, error: 'Corrupt data structure' };
    }

    const levels: SchoolLevel[] = state.levels;
    const levelLabels = levels.map((l) => SCHOOL_LEVEL_LABELS[l] || l);
    const suggestedName = levels.length > 0
      ? `${levelLabels.join('/')}-school`
      : 'Mijn school';

    return {
      success: true,
      schoolRecord: {
        levels: state.levels,
        studentCounts: state.studentCounts ?? {},
        selectedModules: state.selectedModules ?? [],
        moduleSetups: state.moduleSetups ?? [],
        scenario: state.scenario ?? null,
      },
      suggestedName,
    };
  } catch {
    return { success: false, error: 'Data kon niet worden gelezen' };
  }
}

export function extractV1PriceOverrides(): {
  appliedOverrides: PriceOverride[];
  migrationHourlyRate: number;
  migrationTimeSavingOverrides: Record<string, number>;
} | null {
  const raw = localStorage.getItem('rekentool-price-comparison');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const state = parsed?.state;
    if (!state) return null;

    return {
      appliedOverrides: state.appliedOverrides ?? [],
      migrationHourlyRate: state.migrationHourlyRate ?? 50,
      migrationTimeSavingOverrides: state.migrationTimeSavingOverrides ?? {},
    };
  } catch {
    return null;
  }
}

export async function migrateV1ToSchool(name: string): Promise<SchoolRecord> {
  const v1Data = extractV1Data();
  if (!v1Data.success || !v1Data.schoolRecord) {
    throw new Error(v1Data.error ?? 'Migration failed');
  }

  const priceData = extractV1PriceOverrides();
  const slug = await uniqueSlug(name);
  const now = new Date();

  const record: Omit<SchoolRecord, 'id'> = {
    slug,
    name,
    createdAt: now,
    updatedAt: now,
    isComplete: true,
    completedSteps: [0, 1, 2, 3, 4],
    levels: v1Data.schoolRecord.levels ?? [],
    studentCounts: v1Data.schoolRecord.studentCounts ?? {},
    selectedModules: v1Data.schoolRecord.selectedModules ?? [],
    moduleSetups: v1Data.schoolRecord.moduleSetups ?? [],
    scenario: v1Data.schoolRecord.scenario ?? null,
    appliedOverrides: priceData?.appliedOverrides ?? [],
    migrationHourlyRate: priceData?.migrationHourlyRate ?? 50,
    migrationTimeSavingOverrides: priceData?.migrationTimeSavingOverrides ?? {},
    // CRM-lite defaults
    contacts: [],
    conversations: [],
    actions: [],
    systemEvents: [{
      id: crypto.randomUUID(),
      timestamp: now.toISOString(),
      eventType: 'school_created',
      description: 'School gemigreerd vanuit v1',
    }],
    pipelineStatus: 'prospect',
    region: '',
    tags: [],
    viewPreference: 'compact',
  };

  const id = await db.schools.add(record as SchoolRecord);
  return { ...record, id } as SchoolRecord;
}

export function clearV1Data(): void {
  localStorage.removeItem('rekentool-school-profile');
  localStorage.removeItem('rekentool-price-comparison');
}
