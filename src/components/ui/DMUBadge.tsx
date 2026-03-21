import type { DMUPosition } from '@/models/school';
import { DMU_POSITION_LABELS } from '@/models/school';

const DMU_BADGE_STYLES: Record<DMUPosition, string> = {
  coordinator: 'bg-blue-100 text-blue-800',
  mt: 'bg-purple-100 text-purple-800',
  finance: 'bg-green-100 text-green-800',
  overig: 'bg-neutral-100 text-neutral-700',
};

interface DMUBadgeProps {
  position: DMUPosition;
}

export default function DMUBadge({ position }: DMUBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[14px] ${DMU_BADGE_STYLES[position]}`}
    >
      {DMU_POSITION_LABELS[position]}
    </span>
  );
}
