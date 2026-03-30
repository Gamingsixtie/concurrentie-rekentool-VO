import { describe, it, expect } from 'vitest';

// import { detectDiscountPatterns } from '@/engine/discount-patterns';

describe('discount pattern detection (3+ schools threshold)', () => {
  it.todo('detects when 3+ schools have same module at below-publication price');
  it.todo('returns discount percentage and affected module+provider');
  it.todo('does not flag patterns with fewer than 3 schools');
  it.todo('groups patterns by provider for summary view');
  it.todo('calculates average discount percentage across matched schools');
});
