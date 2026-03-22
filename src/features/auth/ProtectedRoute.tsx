import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { AuthLoadingScreen } from './AuthLoadingScreen';

/**
 * Route guard that redirects unauthenticated users to /login.
 * Shows AuthLoadingScreen while the session is being checked.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return <>{children}</>;
}
