import { useState, useEffect } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { UserMenu } from '@/features/auth/UserMenu';
import { CloudMigrationWizard } from '@/features/migration/CloudMigrationWizard';
import { hasLocalData, isMigrationComplete } from '@/db/migrations';

/**
 * Root layout providing:
 * - Auth guard on all routes except /login
 * - UserMenu in the header
 * - Cloud migration wizard on first login with local data
 */
export default function RootLayout() {
  const { user, loading } = useAuth();
  const routerState = useRouterState();
  const isLoginPage = routerState.location.pathname === '/login';

  const [needsMigration, setNeedsMigration] = useState<boolean | null>(null);

  // Check for local data migration after auth completes
  useEffect(() => {
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

  // All other routes require auth
  return (
    <ProtectedRoute>
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
