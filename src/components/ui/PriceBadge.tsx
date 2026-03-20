import { getPriceStatus, getPriceStalenessLabel } from '../../models/pricing';
import type { PriceRecord, PriceStatus } from '../../models/pricing';

const statusClasses: Record<PriceStatus, string> = {
  verified: 'bg-status-verified-bg text-status-verified-text border-status-verified',
  manual: 'bg-status-manual-bg text-status-manual-text border-status-manual',
  stale: 'bg-status-stale-bg text-status-stale-text border-status-stale',
};

interface PriceBadgeProps {
  record: PriceRecord;
  now?: Date;
}

export function PriceBadge({ record, now }: PriceBadgeProps) {
  const status = getPriceStatus(record, now);
  const label = getPriceStalenessLabel(record, now);
  const classes = statusClasses[status];

  const tooltip =
    status === 'stale'
      ? `Laatst geverifieerd: ${record.verifiedAt.toLocaleDateString('nl-NL')}. Controleer of deze prijs nog actueel is.`
      : undefined;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-semibold border ${classes}`}
      title={tooltip}
    >
      {label}
    </span>
  );
}
