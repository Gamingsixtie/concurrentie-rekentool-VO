import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useSchools } from '@/hooks/useSchools';
import { useAuth } from '@/features/auth/AuthProvider';
import { detectV1Data } from '@/db/migrations';
import type { SchoolRecord } from '@/db/types';
import type { PipelineStatus } from '@/models/school';
import { PIPELINE_STATUSES } from '@/models/school';
import SchoolCard from './SchoolCard';
import SchoolSearchBar from './SchoolSearchBar';
import SchoolCardSkeleton from './SchoolCardSkeleton';
import AddSchoolButton from './AddSchoolButton';
import EmptySchoolState from './EmptySchoolState';
import DeleteSchoolDialog from '@/components/ui/DeleteSchoolDialog';
import NotFoundRedirect from '@/components/routing/NotFoundRedirect';
import MigrationWizard from '@/features/migration/MigrationWizard';
import FilterBar from './FilterBar';
import ViewToggle from './ViewToggle';
import CardModeToggle from './CardModeToggle';
import PipelineKanbanView from './PipelineKanbanView';
import { SchoolOwnerFilter } from './SchoolOwnerFilter';

type FilterValue = PipelineStatus | 'all';

function getStoredPreference<T extends string>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return (stored as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function storePreference(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export default function SchoolOverviewPage() {
  const search = useSearch({ from: '/scholen' }) as { error?: string };
  const { data: schools, isLoading } = useSchools();
  const { userProfile } = useAuth();
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SchoolRecord | null>(null);
  const [showMigration, setShowMigration] = useState(() => detectV1Data());
  const [ownerFilter, setOwnerFilter] = useState<'mine' | 'all'>(() =>
    userProfile?.role === 'accountmanager' ? 'mine' : 'all',
  );

  // View preferences persisted in localStorage
  const [pipelineFilter, setPipelineFilter] = useState<FilterValue>('all');
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>(() =>
    getStoredPreference('school-overview-viewMode', 'list'),
  );
  const [cardMode, setCardMode] = useState<'compact' | 'extended'>(() =>
    getStoredPreference('school-overview-cardMode', 'extended'),
  );

  const handleViewModeChange = (mode: 'list' | 'pipeline') => {
    setViewMode(mode);
    storePreference('school-overview-viewMode', mode);
  };

  const handleCardModeChange = (mode: 'compact' | 'extended') => {
    setCardMode(mode);
    storePreference('school-overview-cardMode', mode);
  };

  // Loading
  if (isLoading || !schools) {
    return (
      <div className="min-h-screen bg-cito-bg">
        <div className="max-w-[1200px] mx-auto pt-12 px-8 sm:px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <SchoolCardSkeleton />
            <SchoolCardSkeleton />
            <SchoolCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Migration wizard
  if (showMigration) {
    return (
      <div className="min-h-screen bg-cito-bg">
        <MigrationWizard onDismiss={() => setShowMigration(false)} />
      </div>
    );
  }

  // Empty state
  if (schools.length === 0) {
    return (
      <div className="min-h-screen bg-cito-bg">
        <EmptySchoolState />
      </div>
    );
  }

  // Apply owner filter first
  const ownerFiltered = ownerFilter === 'mine'
    ? schools.filter(s => s.ownerId === userProfile?.id)
    : schools;

  // Calculate filter counts from owner-filtered schools (before text search)
  const filterCounts: Record<FilterValue, number> = { all: ownerFiltered.length } as Record<FilterValue, number>;
  for (const status of PIPELINE_STATUSES) {
    filterCounts[status] = ownerFiltered.filter(s => s.pipelineStatus === status).length;
  }

  // Apply text search filter
  let filtered = query
    ? ownerFiltered.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : ownerFiltered;

  // Apply pipeline filter
  if (pipelineFilter !== 'all') {
    filtered = filtered.filter(s => s.pipelineStatus === pipelineFilter);
  }

  return (
    <div className="min-h-screen bg-cito-bg">
      <div className="max-w-[1200px] mx-auto pt-12 px-8 sm:px-4">
        <NotFoundRedirect show={search.error === 'not-found'} />

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-[28px] font-semibold text-cito-primary">
            Schooloverzicht
          </h1>
          <AddSchoolButton />
        </div>

        {/* Search */}
        <div className="mb-4">
          <SchoolSearchBar value={query} onChange={setQuery} />
        </div>

        {/* Owner filter */}
        {userProfile && (
          <div className="mb-4">
            <SchoolOwnerFilter
              value={ownerFilter}
              onChange={setOwnerFilter}
              userRole={userProfile.role}
            />
          </div>
        )}

        {/* Controls row: FilterBar left, ViewToggle + CardModeToggle right */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <FilterBar
            activeFilter={pipelineFilter}
            onFilterChange={setPipelineFilter}
            counts={filterCounts}
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <ViewToggle activeView={viewMode} onViewChange={handleViewModeChange} />
            <CardModeToggle mode={cardMode} onModeChange={handleCardModeChange} />
          </div>
        </div>

        {/* Content: List view or Pipeline Kanban view */}
        {viewMode === 'list' ? (
          filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((school) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  onDelete={setDeleteTarget}
                  mode={cardMode}
                />
              ))}
            </div>
          ) : (
            <p className="text-base text-neutral-500 text-center py-12">
              Geen scholen gevonden{query ? ` voor \u2018${query}\u2019` : ''}
            </p>
          )
        ) : (
          <PipelineKanbanView
            schools={filtered}
            cardMode={cardMode}
            onDeleteSchool={setDeleteTarget}
          />
        )}
      </div>

      <DeleteSchoolDialog
        school={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => setDeleteTarget(null)}
      />
    </div>
  );
}
