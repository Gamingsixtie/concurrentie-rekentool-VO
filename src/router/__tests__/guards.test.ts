import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/database';
import { getSmartRedirect, checkSchoolExists } from '../guards';

describe('Router guards', () => {
  beforeEach(async () => {
    await db.schools.clear();
  });

  describe('getSmartRedirect', () => {
    it('redirects to /scholen when 0 schools', async () => {
      const result = await getSmartRedirect(0);
      expect(result.to).toBe('/scholen');
    });

    it('redirects to wizard when 1 school', async () => {
      const result = await getSmartRedirect(1, 'montessori-college');
      expect(result.to).toBe('/scholen/$slug/wizard/$step');
      expect(result.params).toEqual({ slug: 'montessori-college', step: '1' });
    });

    it('redirects to /scholen when 5 schools', async () => {
      const result = await getSmartRedirect(5);
      expect(result.to).toBe('/scholen');
    });
  });

  describe('checkSchoolExists', () => {
    it('returns school record when slug exists', async () => {
      await db.schools.add({
        slug: 'montessori-college',
        name: 'Montessori College',
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
        contacts: [],
        conversations: [],
        actions: [],
        systemEvents: [],
        pipelineStatus: 'prospect',
        region: '',
        tags: [],
        viewPreference: 'compact',
      });

      const result = await checkSchoolExists('montessori-college');
      expect(result).toBeDefined();
      expect(result!.name).toBe('Montessori College');
    });

    it('returns undefined for nonexistent slug', async () => {
      const result = await checkSchoolExists('nonexistent');
      expect(result).toBeUndefined();
    });
  });
});
