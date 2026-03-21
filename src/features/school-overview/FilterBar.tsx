import { PIPELINE_STATUSES, PIPELINE_STATUS_LABELS } from '@/models/school';
import type { PipelineStatus } from '@/models/school';

type FilterValue = PipelineStatus | 'all';

interface FilterBarProps {
  activeFilter: FilterValue;
  onFilterChange: (filter: FilterValue) => void;
  counts: Record<FilterValue, number>;
}

export default function FilterBar({
  activeFilter,
  onFilterChange,
  counts,
}: FilterBarProps) {
  const filters: { value: FilterValue; label: string }[] = [
    { value: 'all', label: 'Alle' },
    ...PIPELINE_STATUSES.map((status) => ({
      value: status as FilterValue,
      label: PIPELINE_STATUS_LABELS[status],
    })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto flex-nowrap pb-1">
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
