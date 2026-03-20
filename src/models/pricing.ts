import { isPriceStale } from '../lib/date-utils';

export type PriceSource = 'publication' | 'manual' | 'ai-lookup';

export interface PriceRecord {
  moduleId: string;
  provider: 'cito' | 'dia' | 'jij';
  amountPerStudent: number;
  source: PriceSource;
  sourceLabel: string;
  verifiedAt: Date;
  isPublicationPrice: boolean;
}

export type PriceStatus = 'verified' | 'manual' | 'stale';

/**
 * Determine the status of a price record.
 * Returns 'stale' if verified more than 6 months ago,
 * 'manual' if source is manual, otherwise 'verified'.
 */
export function getPriceStatus(record: PriceRecord, now: Date = new Date()): PriceStatus {
  if (isPriceStale(record.verifiedAt, 6, now)) return 'stale';
  if (record.source === 'manual') return 'manual';
  return 'verified';
}

/**
 * Get the Dutch display label for a price record's staleness status.
 */
export function getPriceStalenessLabel(record: PriceRecord, now: Date = new Date()): string {
  const status = getPriceStatus(record, now);
  switch (status) {
    case 'verified': return 'Geverifieerd';
    case 'manual': return 'Handmatig';
    case 'stale': return 'Mogelijk verouderd';
  }
}
