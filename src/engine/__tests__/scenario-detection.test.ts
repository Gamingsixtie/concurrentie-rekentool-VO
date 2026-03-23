import { describe, it, expect } from 'vitest';
import { detectScenario } from '../scenario-detection';
import type { ModuleCurrentSetup } from '../../models/school';

describe('detectScenario', () => {
  it('returns scenario B when all modules are on cito-oud', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
      { moduleId: 'nederlands', currentProvider: 'cito-oud', pricePerStudent: null },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('B');
    expect(result.hasMigrationModules).toBe(true);
    expect(result.hasCompetitorModules).toBe(false);
    expect(result.hasUpsellModules).toBe(false);
    expect(result.isMixed).toBe(false);
    expect(result.migrationModuleIds).toEqual(['rekenwiskunde', 'nederlands']);
  });

  it('returns scenario A when modules are on competitors', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 5.2 },
      { moduleId: 'nederlands', currentProvider: 'jij', pricePerStudent: 4.8 },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('A');
    expect(result.hasMigrationModules).toBe(false);
    expect(result.hasCompetitorModules).toBe(true);
    expect(result.competitorModuleIds).toEqual(['rekenwiskunde', 'nederlands']);
  });

  it('returns scenario A with isMixed when both cito-oud and competitor modules exist', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
      { moduleId: 'sociaal-emotioneel', currentProvider: 'dia', pricePerStudent: 3.5 },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('A');
    expect(result.isMixed).toBe(true);
    expect(result.hasMigrationModules).toBe(true);
    expect(result.hasCompetitorModules).toBe(true);
    expect(result.migrationModuleIds).toEqual(['rekenwiskunde']);
    expect(result.competitorModuleIds).toEqual(['sociaal-emotioneel']);
  });

  it('returns scenario A with upsell when modules have geen provider', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 5.2 },
      { moduleId: 'sociaal-emotioneel', currentProvider: 'geen', pricePerStudent: null },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('A');
    expect(result.hasUpsellModules).toBe(true);
    expect(result.upsellModuleIds).toEqual(['sociaal-emotioneel']);
  });

  it('returns scenario A when cito-oud mixed with upsell (geen)', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
      { moduleId: 'sociaal-emotioneel', currentProvider: 'geen', pricePerStudent: null },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('A');
    expect(result.isMixed).toBe(true);
    expect(result.hasMigrationModules).toBe(true);
    expect(result.hasUpsellModules).toBe(true);
  });

  it('ignores cito-nieuw modules (already on new platform)', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-nieuw', pricePerStudent: null },
      { moduleId: 'nederlands', currentProvider: 'dia', pricePerStudent: 5.2 },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('A');
    expect(result.hasMigrationModules).toBe(false);
    expect(result.hasCompetitorModules).toBe(true);
    expect(result.migrationModuleIds).toEqual([]);
  });

  it('handles empty module setups', () => {
    const result = detectScenario([]);

    expect(result.recommended).toBe('A');
    expect(result.hasMigrationModules).toBe(false);
    expect(result.hasCompetitorModules).toBe(false);
    expect(result.hasUpsellModules).toBe(false);
    expect(result.isMixed).toBe(false);
  });

  it('classifies saqi and overig as competitor providers', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'sociaal-emotioneel', currentProvider: 'saqi', pricePerStudent: 3.0 },
      { moduleId: 'rekenwiskunde', currentProvider: 'overig', pricePerStudent: 4.0, customProviderName: 'Andere' },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('A');
    expect(result.hasCompetitorModules).toBe(true);
    expect(result.competitorModuleIds).toEqual(['sociaal-emotioneel', 'rekenwiskunde']);
  });
});
