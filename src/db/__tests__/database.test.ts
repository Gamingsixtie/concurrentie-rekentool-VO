import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../database';

describe('RekenToolDB', () => {
  beforeEach(async () => {
    await db.schools.clear();
  });

  it('has a schools table with correct indexes', () => {
    const schema = db.schools.schema;
    expect(schema.primKey.name).toBe('id');
    expect(schema.primKey.auto).toBe(true);
    const indexNames = schema.indexes.map((i) => i.name);
    expect(indexNames).toContain('slug');
    expect(indexNames).toContain('name');
    expect(indexNames).toContain('updatedAt');
  });

  it('can add and retrieve a record', async () => {
    const id = await db.schools.add({
      slug: 'test-school',
      name: 'Test School',
      createdAt: new Date(),
      updatedAt: new Date(),
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
    });
    const record = await db.schools.get(id);
    expect(record).toBeDefined();
    expect(record!.slug).toBe('test-school');
  });
});
