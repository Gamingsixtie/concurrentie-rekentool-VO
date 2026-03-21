import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { detectV1Data } from '@/db/migrations';
import type { SchoolRecord } from '@/db/types';
import SchoolCard from './SchoolCard';
import SchoolSearchBar from './SchoolSearchBar';
import SchoolCardSkeleton from './SchoolCardSkeleton';
import AddSchoolButton from './AddSchoolButton';
import EmptySchoolState from './EmptySchoolState';
import DeleteSchoolDialog from '@/components/ui/DeleteSchoolDialog';
import NotFoundRedirect from '@/components/routing/NotFoundRedirect';
import MigrationWizard from '@/features/migration/MigrationWizard';

export default function SchoolOverviewPage() {
  const search = useSearch({ from: '/scholen' }) as { error?: string };
  const schools = useLiveQuery(() => db.schools.orderBy('updatedAt').reverse().toArray());
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SchoolRecord | null>(null);
  const [showMigration, setShowMigration] = useState(() => detectV1Data());

  // Loading
  if (schools === undefined) {
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

  const filtered = query
    ? schools.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : schools;

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
        <div className="mb-6">
          <SchoolSearchBar value={query} onChange={setQuery} />
        </div>

        {/* Cards grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                onDelete={setDeleteTarget}
                mode="extended"
              />
            ))}
          </div>
        ) : (
          <p className="text-base text-neutral-500 text-center py-12">
            Geen scholen gevonden voor &lsquo;{query}&rsquo;
          </p>
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
