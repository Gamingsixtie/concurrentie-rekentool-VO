import { describe, it, expect } from 'vitest';

// import { getProviderPrices } from '@/engine/price-provider';

describe('async price provider with TS fallback', () => {
  it.todo('returns prices from Supabase when available');
  it.todo('falls back to TS-based DEFAULT_PRICES when Supabase is unreachable');
  it.todo('merges school-specific overrides with publication prices');
  it.todo('marks stale prices with correct status');
});
