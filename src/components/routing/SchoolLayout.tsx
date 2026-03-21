import { useEffect } from 'react';
import { Outlet, useParams, useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import { usePriceComparisonStore } from '@/features/price-comparison/store';

export default function SchoolLayout() {
  const { slug } = useParams({ from: '/scholen/$slug' });
  const navigate = useNavigate();

  const school = useLiveQuery(
    () => db.schools.where('slug').equals(slug).first(),
    [slug],
  );

  // Redirect if school not found (after loading)
  useEffect(() => {
    if (school === null) {
      navigate({ to: '/scholen', search: { error: 'not-found' } });
    }
  }, [school, navigate]);

  // Hydrate stores when school data changes
  useEffect(() => {
    if (school) {
      useSchoolProfileStore.getState().hydrate(school);
      usePriceComparisonStore.getState().hydrate(school);
    }
  }, [school?.id, school?.updatedAt?.getTime()]);

  // Loading state
  if (school === undefined) {
    return (
      <div className="min-h-screen bg-cito-bg flex items-center justify-center">
        <div className="animate-pulse text-neutral-400">Laden...</div>
      </div>
    );
  }

  if (!school) return null;

  return (
    <div className="min-h-screen bg-cito-bg">
      <Outlet />
    </div>
  );
}
