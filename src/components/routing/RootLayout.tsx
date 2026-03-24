import { useState, useEffect } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { UserMenu } from '@/features/auth/UserMenu';
import { CloudMigrationWizard } from '@/features/migration/CloudMigrationWizard';
import { hasLocalData, isMigrationComplete } from '@/db/migrations';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useOfflineQueue } from '@/lib/offline-queue';

// Skip auth in development when VITE_SKIP_AUTH is set
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';

/**
 * Root layout providing:
 * - Auth guard on all routes except /login (skippable via VITE_SKIP_AUTH)
 * - UserMenu in the header
 * - Cloud migration wizard on first login with local data
 */
export default function RootLayout() {
  const { user, loading } = useAuth();
  const routerState = useRouterState();
  const isLoginPage = routerState.location.pathname === '/login';

  const [needsMigration, setNeedsMigration] = useState<boolean | null>(null);

  // Sync offline mutation queue when coming back online
  useEffect(() => {
    const handleOnline = async () => {
      const { mutations, syncAll } = useOfflineQueue.getState();
      if (mutations.length > 0) {
        const result = await syncAll();
        if (result.conflicts > 0) {
          console.warn(`${result.conflicts} wijziging(en) hadden een conflict (server-versie behouden)`);
        }
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Check for local data migration after auth completes
  useEffect(() => {
    if (SKIP_AUTH) {
      setNeedsMigration(false);
      return;
    }
    if (!user || loading) {
      setNeedsMigration(null);
      return;
    }

    (async () => {
      if (!isMigrationComplete() && (await hasLocalData())) {
        setNeedsMigration(true);
      } else {
        setNeedsMigration(false);
      }
    })();
  }, [user, loading]);

  // Login page is not protected
  if (isLoginPage) {
    return <Outlet />;
  }

  // Skip auth guard in dev mode
  if (SKIP_AUTH) {
    return (
      <>
        <OfflineBanner />
        <header className="bg-white border-b border-neutral-200 px-8 max-sm:px-4 h-12 flex items-center justify-between">
          <span className="text-sm font-medium text-cito-primary">Cito Rekentool</span>
          <span className="text-xs text-orange-500 font-medium">DEV MODE — auth uitgeschakeld</span>
        </header>
        <Outlet />
      </>
    );
  }

  // All other routes require auth
  return (
    <ProtectedRoute>
      <OfflineBanner />
      {/* Header with UserMenu */}
      <header className="bg-white border-b border-neutral-200 px-8 max-sm:px-4 h-12 flex items-center justify-between">
        <span className="text-sm font-medium text-cito-primary">Cito Rekentool</span>
        <UserMenu />
      </header>

      {/* Migration wizard gate */}
      {needsMigration === true ? (
        <CloudMigrationWizard onComplete={() => setNeedsMigration(false)} />
      ) : (
        <Outlet />
      )}
    </ProtectedRoute>
  );
}
