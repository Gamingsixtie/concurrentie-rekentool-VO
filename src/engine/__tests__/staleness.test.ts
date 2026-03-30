import { describe, it, expect } from 'vitest';

// import { detectStalePrices } from '@/engine/staleness';

describe('staleness detection for >6 month old prices', () => {
  it.todo('marks prices verified more than 6 months ago as stale');
  it.todo('does not mark recently verified prices as stale');
  it.todo('returns stale price count per provider');
  it.todo('generates staleness warning message in Dutch');
});
