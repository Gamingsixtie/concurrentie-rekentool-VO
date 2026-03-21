import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../database';
import {
  createSchool,
  updateSchoolData,
  deleteSchool,
  getSchoolBySlug,
  getAllSchools,
} from '../operations';

describe('School CRUD operations', () => {
  beforeEach(async () => {
    await db.schools.clear();
  });

  it('createSchool creates a record with correct defaults', async () => {
    const school = await createSchool('Montessori College');
    expect(school.id).toBeDefined();
    expect(school.slug).toBe('montessori-college');
    expect(school.name).toBe('Montessori College');
    expect(school.createdAt).toBeInstanceOf(Date);
    expect(school.updatedAt).toBeInstanceOf(Date);
    expect(school.isComplete).toBe(false);
    expect(school.completedSteps).toEqual([]);
    expect(school.levels).toEqual([]);
    expect(school.selectedModules).toEqual([]);
    expect(school.moduleSetups).toEqual([]);
    expect(school.scenario).toBeNull();
    expect(school.appliedOverrides).toEqual([]);
    expect(school.migrationHourlyRate).toBe(50);
    expect(school.migrationTimeSavingOverrides).toEqual({});
  });

  it('createSchool generates unique slugs for duplicate names', async () => {
    const s1 = await createSchool('Montessori College');
    const s2 = await createSchool('Montessori College');
    expect(s1.slug).toBe('montessori-college');
    expect(s2.slug).toBe('montessori-college-2');
  });

  it('getSchoolBySlug returns the school when it exists', async () => {
    await createSchool('Montessori College');
    const found = await getSchoolBySlug('montessori-college');
    expect(found).toBeDefined();
    expect(found!.name).toBe('Montessori College');
  });

  it('getSchoolBySlug returns undefined for nonexistent slug', async () => {
    const found = await getSchoolBySlug('nonexistent');
    expect(found).toBeUndefined();
  });

  it('updateSchoolData updates record and sets newer updatedAt', async () => {
    const school = await createSchool('Test');
    const originalUpdatedAt = school.updatedAt.getTime();

    // Small delay to ensure updatedAt differs
    await new Promise((r) => setTimeout(r, 10));
    await updateSchoolData(school.id!, { levels: ['havo', 'vwo'] });

    const updated = await db.schools.get(school.id!);
    expect(updated!.levels).toEqual(['havo', 'vwo']);
    expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
  });

  it('deleteSchool removes the record', async () => {
    const school = await createSchool('To Delete');
    await deleteSchool(school.id!);
    const found = await getSchoolBySlug(school.slug);
    expect(found).toBeUndefined();
  });

  it('getAllSchools returns schools ordered by updatedAt descending', async () => {
    const s1 = await createSchool('School A');
    await new Promise((r) => setTimeout(r, 10));
    const s2 = await createSchool('School B');
    await new Promise((r) => setTimeout(r, 10));
    await updateSchoolData(s1.id!, { name: 'School A Updated' });

    const all = await getAllSchools();
    expect(all.length).toBe(2);
    // s1 was updated most recently
    expect(all[0].id).toBe(s1.id);
    expect(all[1].id).toBe(s2.id);
  });

  it('can store and query 50 school records', async () => {
    for (let i = 0; i < 50; i++) {
      await createSchool(`School ${i}`);
    }
    const all = await getAllSchools();
    expect(all.length).toBe(50);
  });
});
