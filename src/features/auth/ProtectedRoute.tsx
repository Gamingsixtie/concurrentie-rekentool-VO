import { useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { AuthLoadingScreen } from './AuthLoadingScreen';

/**
 * Route guard that redirects unauthenticated users to /login.
 * Shows AuthLoadingScreen while the session is being checked.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  if (loading || !user) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}
