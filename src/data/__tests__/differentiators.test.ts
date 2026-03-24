import { describe, it, expect } from 'vitest';
import { MODULE_CATALOG } from '../../models/modules';
import { MODULE_DIFFERENTIATORS } from '../differentiators';

describe('MODULE_DIFFERENTIATORS', () => {
  it('every MODULE_CATALOG entry has a matching MODULE_DIFFERENTIATORS entry', () => {
    for (const mod of MODULE_CATALOG) {
      const diff = MODULE_DIFFERENTIATORS.find((d) => d.moduleId === mod.id);
      expect(diff, `Missing differentiator for module: ${mod.id}`).toBeDefined();
    }
  });

  it('every differentiator entry has cito, dia, jij, saqi arrays', () => {
    for (const diff of MODULE_DIFFERENTIATORS) {
      expect(Array.isArray(diff.cito), `${diff.moduleId}.cito should be array`).toBe(true);
      expect(Array.isArray(diff.dia), `${diff.moduleId}.dia should be array`).toBe(true);
      expect(Array.isArray(diff.jij), `${diff.moduleId}.jij should be array`).toBe(true);
      expect(Array.isArray(diff.saqi), `${diff.moduleId}.saqi should be array`).toBe(true);
    }
  });
});
