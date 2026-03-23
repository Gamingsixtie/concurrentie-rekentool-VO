import { ENGAGEMENT_STATUSES, ENGAGEMENT_STATUS_LABELS } from '@/models/school';
import type { EngagementStatus } from '@/models/school';

type DmuFilterValue = EngagementStatus | 'all';

interface DmuStatusFilterProps {
  activeFilter: DmuFilterValue;
  onFilterChange: (filter: DmuFilterValue) => void;
  counts: Record<DmuFilterValue, number>;
}

export default function DmuStatusFilter({
  activeFilter,
  onFilterChange,
  counts,
}: DmuStatusFilterProps) {
  const filters: { value: DmuFilterValue; label: string }[] = [
    { value: 'all', label: 'Alle' },
    ...ENGAGEMENT_STATUSES.map((status) => ({
      value: status as DmuFilterValue,
      label: ENGAGEMENT_STATUS_LABELS[status],
    })),
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto flex-nowrap pb-1">
      <span className="text-[14px] font-semibold text-neutral-700 mr-2 flex-shrink-0">
        DMU:
      </span>
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value;
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onFilterChange(filter.value)}
            className={`min-h-[44px] px-4 rounded-lg text-[14px] font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
              isActive
                ? 'bg-cito-primary text-white'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {filter.label} ({counts[filter.value] ?? 0})
          </button>
        );
      })}
    </div>
  );
}

export type { DmuFilterValue };
