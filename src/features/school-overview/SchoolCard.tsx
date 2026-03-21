import { Link } from '@tanstack/react-router';
import type { SchoolRecord } from '@/db/types';
import { SCHOOL_LEVEL_LABELS } from '@/models/school';
import type { SchoolLevel } from '@/models/school';
import IncompleteIndicator from '@/components/ui/IncompleteIndicator';

interface SchoolCardProps {
  school: SchoolRecord;
  onDelete: (school: SchoolRecord) => void;
}

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function totalStudents(studentCounts: SchoolRecord['studentCounts']): number {
  let total = 0;
  for (const level of Object.values(studentCounts)) {
    if (level) {
      for (const count of Object.values(level)) {
        total += count;
      }
    }
  }
  return total;
}

export default function SchoolCard({ school, onDelete }: SchoolCardProps) {
  const levelLabels = school.levels
    .map((l) => SCHOOL_LEVEL_LABELS[l as SchoolLevel] || l)
    .join('/');
  const studentCount = totalStudents(school.studentCounts);
  const moduleText = school.selectedModules.length > 0
    ? school.selectedModules.length === 1
      ? '1 module'
      : `${school.selectedModules.length} modules`
    : 'Geen modules';

  return (
    <Link
      to="/scholen/$slug/wizard/$step"
      params={{ slug: school.slug, step: '1' }}
      className="block bg-white border border-neutral-200 rounded-lg p-6 min-h-[160px] hover:shadow-md hover:border-neutral-400 transition-all duration-150 focus:outline-2 focus:outline-cito-primary focus:outline-offset-2 relative group"
    >
      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(school);
        }}
        className="absolute top-3 right-3 p-2 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`${school.name} verwijderen`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>

      {/* School name + incomplete badge */}
      <div className="flex items-start gap-2 mb-3 pr-8">
        <h3 className="text-xl font-semibold text-cito-primary truncate">
          {school.name}
        </h3>
        {!school.isComplete && <IncompleteIndicator />}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[14px] text-neutral-500 mb-3">
        {levelLabels && (
          <div>
            <span className="text-neutral-700">Schooltype:</span>{' '}
            {levelLabels}
          </div>
        )}
        {studentCount > 0 && (
          <div>
            <span className="text-neutral-700">Leerlingen:</span>{' '}
            {studentCount.toLocaleString('nl-NL')}
          </div>
        )}
      </div>

      {/* Modules */}
      <div className="text-[14px] text-neutral-500 mb-3 truncate">
        {moduleText}
      </div>

      {/* Last edited */}
      <div className="text-sm text-neutral-400">
        Laatst bewerkt: {dateFormatter.format(school.updatedAt)}
      </div>
    </Link>
  );
}
