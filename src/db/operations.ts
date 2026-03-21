import { db } from './database';
import type { SchoolRecord } from './types';
import { uniqueSlug } from '@/lib/slugify';

export async function createSchool(name: string): Promise<SchoolRecord> {
  const slug = await uniqueSlug(name);
  const now = new Date();
  const record: Omit<SchoolRecord, 'id'> = {
    slug,
    name,
    createdAt: now,
    updatedAt: now,
    isComplete: false,
    completedSteps: [],
    levels: [],
    studentCounts: {},
    selectedModules: [],
    moduleSetups: [],
    scenario: null,
    appliedOverrides: [],
    migrationHourlyRate: 50,
    migrationTimeSavingOverrides: {},
    // CRM-lite defaults
    contacts: [],
    conversations: [],
    actions: [],
    systemEvents: [{
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      eventType: 'school_created',
      description: 'School aangemaakt',
    }],
    pipelineStatus: 'prospect',
    region: '',
    tags: [],
    viewPreference: 'compact',
  };
  const id = await db.schools.add(record as SchoolRecord);
  return { ...record, id } as SchoolRecord;
}

export async function updateSchoolData(
  id: number,
  data: Partial<SchoolRecord>,
): Promise<void> {
  await db.schools.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteSchool(id: number): Promise<void> {
  await db.schools.delete(id);
}

export async function getSchoolBySlug(
  slug: string,
): Promise<SchoolRecord | undefined> {
  return db.schools.where('slug').equals(slug).first();
}

export async function getAllSchools(): Promise<SchoolRecord[]> {
  return db.schools.orderBy('updatedAt').reverse().toArray();
}
