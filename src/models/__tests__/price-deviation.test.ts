import { describe, it, expect } from 'vitest';

// import { checkPriceDeviation, getSchoolPriceStatus } from '@/models/pricing';

describe('checkPriceDeviation', () => {
  it.todo('returns no deviation when amount matches publication price');
  it.todo('returns deviation when amount >50% above publication price');
  it.todo('returns no deviation and null publicationPrice when no pub price exists');
  it.todo('returns correct percentDiff for partial deviation under threshold');
});

describe('getSchoolPriceStatus', () => {
  it.todo('returns stale when verifiedAt is >6 months ago');
  it.todo('returns manual when priceType is agreed and recently verified');
  it.todo('returns verified when priceType is publication and recently verified');
  it.todo('returns unknown when source is empty or verifiedAt is null');
});
