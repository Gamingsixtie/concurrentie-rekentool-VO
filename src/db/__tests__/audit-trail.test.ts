import { describe, it, expect } from 'vitest';

// import { fetchAuditLog } from '@/db/pricing-operations';

describe('audit log entries on price changes', () => {
  it.todo('creates audit entry when publication price is updated');
  it.todo('creates audit entry when proposal is approved');
  it.todo('creates audit entry when proposal is rejected');
  it.todo('creates audit entry when pricing config is updated');
  it.todo('stores old_value and new_value as JSONB snapshots');
  it.todo('links proposal_id when change originates from proposal');
});
