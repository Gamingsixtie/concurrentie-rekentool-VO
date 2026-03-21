import { describe, it, expect } from 'vitest';
import {
  PIPELINE_STATUSES,
  PIPELINE_STATUS_LABELS,
  PIPELINE_STATUS_ORDER,
  DMU_POSITIONS,
  DMU_POSITION_LABELS,
  PREFERRED_CHANNELS,
  AUTHORITY_LEVELS,
} from '@/models/school';
import type { PipelineStatus, DMUPosition, PreferredChannel, AuthorityLevel } from '@/models/school';

describe('PipelineStatus', () => {
  it('has all 6 values', () => {
    expect(PIPELINE_STATUSES).toEqual([
      'prospect',
      'contact-gelegd',
      'demo-presentatie',
      'offerte',
      'gewonnen',
      'verloren',
    ]);
  });

  it('has labels for all statuses', () => {
    for (const status of PIPELINE_STATUSES) {
      expect(PIPELINE_STATUS_LABELS[status]).toBeDefined();
      expect(typeof PIPELINE_STATUS_LABELS[status]).toBe('string');
    }
  });

  it('has ordered values for all statuses', () => {
    for (const status of PIPELINE_STATUSES) {
      expect(typeof PIPELINE_STATUS_ORDER[status]).toBe('number');
    }
    expect(PIPELINE_STATUS_ORDER['prospect']).toBe(0);
    expect(PIPELINE_STATUS_ORDER['verloren']).toBe(5);
  });

  it('type-checks PipelineStatus assignment', () => {
    const status: PipelineStatus = 'prospect';
    expect(PIPELINE_STATUSES).toContain(status);
  });
});

describe('DMUPosition', () => {
  it('has all 4 values', () => {
    expect(DMU_POSITIONS).toEqual(['coordinator', 'mt', 'finance', 'overig']);
  });

  it('has labels for all positions', () => {
    for (const pos of DMU_POSITIONS) {
      expect(DMU_POSITION_LABELS[pos]).toBeDefined();
    }
  });

  it('type-checks DMUPosition assignment', () => {
    const pos: DMUPosition = 'coordinator';
    expect(DMU_POSITIONS).toContain(pos);
  });
});

describe('PreferredChannel', () => {
  it('has all 4 values', () => {
    expect(PREFERRED_CHANNELS).toEqual(['email', 'telefoon', 'teams', 'overig']);
  });

  it('type-checks PreferredChannel assignment', () => {
    const channel: PreferredChannel = 'email';
    expect(PREFERRED_CHANNELS).toContain(channel);
  });
});

describe('AuthorityLevel', () => {
  it('has all 3 values', () => {
    expect(AUTHORITY_LEVELS).toEqual(['adviserend', 'beslissend', 'budgethouder']);
  });

  it('type-checks AuthorityLevel assignment', () => {
    const level: AuthorityLevel = 'beslissend';
    expect(AUTHORITY_LEVELS).toContain(level);
  });
});
