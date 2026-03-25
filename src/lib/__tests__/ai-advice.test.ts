import { describe, it, expect } from 'vitest';

// buildRetentionAdvicePayload will be exported from src/lib/ai-advice.ts by Plan 17-03
// For now, these tests document the expected contract and will fail until implemented.

describe('buildRetentionAdvicePayload', () => {
  it.skip('returns payload with scenarioType C', () => {
    // Will be unskipped when buildRetentionAdvicePayload is exported in Plan 17-03
    // Expected: payload.scenarioType === 'C'
  });

  it.skip('includes schoolplanOpportunities array', () => {
    // Will be unskipped when buildRetentionAdvicePayload is exported in Plan 17-03
    // Expected: payload.schoolplanOpportunities is an array
  });

  it.skip('includes migrationContext with platformUpgradeNextYear true', () => {
    // Will be unskipped when buildRetentionAdvicePayload is exported in Plan 17-03
    // Expected: payload.migrationContext.platformUpgradeNextYear === true
  });
});
