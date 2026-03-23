import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import type { SchoolRecord } from '@/db/types';
import { SCHOOL_LEVEL_LABELS } from '@/models/school';
import type { SchoolLevel } from '@/models/school';
import IncompleteIndicator from '@/components/ui/IncompleteIndicator';
import PipelineBadge from '@/components/ui/PipelineBadge';
import { OwnerBadge } from '@/components/ui/OwnerBadge';
import { UpsellBadge } from '@/components/ui/UpsellBadge';
import DmuProgressIndicator from './DmuProgressIndicator';
import { useAuth } from '@/features/auth/AuthProvider';
import { calculateComparison } from '@/engine/price-comparison';
import { calculateUpsell } from '@/engine/upsell';
import { DEFAULT_PRICES } from '@/data/default-prices';

interface SchoolCardProps {
  school: SchoolRecord;
  onDelete: (school: SchoolRecord) => void;
  mode: 'compact' | 'extended';
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

export default function SchoolCard({ school, onDelete, mode }: SchoolCardProps) {
  const { userProfile } = useAuth();
  const levelLabels = school.levels
    .map((l) => SCHOOL_LEVEL_LABELS[l as SchoolLevel] || l)
    .join('/');
  const studentCount = totalStudents(school.studentCounts);

  // Module summary for extended mode
  const moduleCount = school.selectedModules.length;
  const moduleText = moduleCount > 0
    ? moduleCount === 1
      ? '1 module'
      : `${moduleCount} modules`
    : 'Geen modules';

  // Count modules by DIA provider
  const diaModules = school.moduleSetups?.filter(m => m.currentProvider === 'dia').length ?? 0;
  const moduleSummary = diaModules > 0
    ? `${moduleText}, ${diaModules} bij DIA`
    : moduleText;

  // Primary contact for extended mode
  const primaryContact = school.contacts?.find(c => c.isPrimary);
  const primaryContactText = primaryContact
    ? `Contact: ${primaryContact.name}`
    : 'Geen primair contact';

  // Latest conversation date
  const latestConversation = school.conversations?.length
    ? school.conversations.reduce((latest, conv) =>
        new Date(conv.date) > new Date(latest.date) ? conv : latest,
      )
    : null;

  // Next action (first todo)
  const nextAction = school.actions?.find(a => a.status === 'todo');

  // Compute upsell opportunities for badge (publication prices only)
  const upsellData = useMemo(() => {
    if (!school.moduleSetups || school.moduleSetups.length === 0) {
      return { count: 0, hasGreenSignals: false };
    }
    try {
      const comparisonResult = calculateComparison(
        school.selectedModules,
        school.studentCounts,
        DEFAULT_PRICES,
      );
      const opportunities = calculateUpsell(school.moduleSetups, comparisonResult);
      return {
        count: opportunities.length,
        hasGreenSignals: opportunities.some((o) => o.signalStrength === 'green'),
      };
    } catch {
      return { count: 0, hasGreenSignals: false };
    }
  }, [school.selectedModules, school.studentCounts, school.moduleSetups]);

  const isCompact = mode === 'compact';

  return (
    <Link
      to="/scholen/$slug"
      params={{ slug: school.slug }}
      className={`block bg-white border border-neutral-200 rounded-lg hover:shadow-md hover:border-neutral-400 transition-all duration-150 focus:outline-2 focus:outline-cito-primary focus:outline-offset-2 relative group ${
        isCompact ? 'p-4 min-h-[80px]' : 'p-6 min-h-[160px]'
      }`}
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

      {/* School name + pipeline badge + owner badge + incomplete indicator */}
      <div className="flex items-center gap-2 mb-2 pr-8">
        <h3 className={`font-semibold text-cito-primary truncate ${isCompact ? 'text-lg' : 'text-xl'}`}>
          {school.name}
        </h3>
        <PipelineBadge status={school.pipelineStatus} size="sm" />
        <UpsellBadge count={upsellData.count} hasGreenSignals={upsellData.hasGreenSignals} />
        <DmuProgressIndicator contacts={school.contacts ?? []} />
        {school.ownerName && (
          <OwnerBadge
            ownerName={school.ownerName}
            isCurrentUser={school.ownerId === userProfile?.id}
          />
        )}
        {!school.isComplete && <IncompleteIndicator />}
      </div>

      {/* Last edited - shown in both modes */}
      <div className="text-sm text-neutral-400">
        Laatst bewerkt: {dateFormatter.format(new Date(school.updatedAt))}
      </div>

      {/* Extended mode: extra details */}
      {!isCompact && (
        <div className="mt-3 space-y-1">
          {/* Level labels + student count */}
          <div className="grid grid-cols-2 gap-x-4 text-[14px] text-neutral-500">
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

          {/* Primary contact */}
          <div className="text-[14px] text-neutral-500">
            {primaryContactText}
          </div>

          {/* Modules summary */}
          <div className="text-[14px] text-neutral-500 truncate">
            {moduleSummary}
          </div>

          {/* Latest conversation date */}
          {latestConversation && (
            <div className="text-[14px] text-neutral-400">
              Laatste gesprek: {dateFormatter.format(new Date(latestConversation.date))}
            </div>
          )}

          {/* Next action */}
          {nextAction && (
            <div className="text-[14px] text-neutral-400 truncate">
              Volgende actie: {nextAction.title}
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
