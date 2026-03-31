import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePriceProposals } from '@/hooks/usePriceProposals';
import ReviewFilterBar from './ReviewFilterBar';
import ReviewQueueItem from './ReviewQueueItem';
import type { ReviewFilters } from './ReviewFilterBar';

export default function ReviewQueuePage() {
  const { userProfile } = useAuth();
  const [filters, setFilters] = useState<ReviewFilters>({});

  const { data: proposals, isLoading, error } = usePriceProposals(filters);

  // Access control: manager only
  if (userProfile?.role !== 'manager' && userProfile?.role !== 'accountmanager') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">Geen toegang</h2>
        <p className="text-sm text-neutral-500">
          Deze pagina is alleen toegankelijk voor managers.
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-8">
        <h1 className="text-xl font-semibold text-neutral-900 mb-6">Prijsvoorstellen</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">
            Prijsvoorstellen konden niet worden geladen. Controleer uw internetverbinding en probeer het opnieuw.
          </p>
        </div>
      </div>
    );
  }

  // Sort proposals: newest first
  const sortedProposals = [...(proposals ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const hasFiltersActive = filters.status !== undefined || filters.provider !== undefined;

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <h1 className="text-xl font-semibold text-neutral-900 mb-2">Prijsvoorstellen</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Beoordeel en verwerk ingediende prijswijzigingen van uw team.
      </p>

      {/* Filter bar */}
      <ReviewFilterBar filters={filters} onFilterChange={setFilters} />

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2 mt-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-neutral-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {sortedProposals.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center mt-4">
              <h2 className="text-base font-semibold text-neutral-900 mb-2">
                {hasFiltersActive ? 'Geen resultaten' : 'Geen openstaande voorstellen'}
              </h2>
              <p className="text-sm text-neutral-500">
                {hasFiltersActive
                  ? 'Er zijn geen voorstellen die aan deze filters voldoen. Pas de filters aan of bekijk alle voorstellen.'
                  : 'Er zijn momenteel geen prijsvoorstellen ter beoordeling. Voorstellen verschijnen hier zodra een teamlid een prijswijziging indient.'}
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-0">
              {sortedProposals.map((proposal) => (
                <ReviewQueueItem key={proposal.id} proposal={proposal} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
