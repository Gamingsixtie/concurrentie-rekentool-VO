import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { UserProfile } from './hooks';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Fetches the user profile (name, role, region, team) from the custom users table.
 * Maps snake_case DB columns to camelCase for the UserProfile interface.
 */
async function fetchUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single() as { data: { id: string; email: string; name: string; role: 'accountmanager' | 'manager' | 'viewer'; region: string; team_id: string } | null; error: unknown };

  if (error || !data) {
    console.error('Failed to fetch user profile:', (error as { message?: string })?.message);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    region: data.region,
    teamId: data.team_id,
  };
}

/**
 * Maps Supabase auth errors to user-friendly Dutch error messages.
 */
function mapAuthError(error: AuthError): string {
  // Rate limit detection
  if (error.status === 429) {
    return 'Te veel inlogpogingen. Probeer het over een paar minuten opnieuw.';
  }

  // Invalid credentials
  if (
    error.message.toLowerCase().includes('invalid login credentials') ||
    error.message.toLowerCase().includes('invalid email or password')
  ) {
    return 'Onjuist e-mailadres of wachtwoord. Probeer het opnieuw.';
  }

  // Generic fallback
  return 'Er is iets misgegaan. Probeer het later opnieuw.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Suppress Supabase auth lock errors (non-fatal)
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const msg = String(e.reason?.message ?? e.reason ?? '');
      if (msg.includes('Lock') || msg.includes('lock')) {
        e.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  useEffect(() => {
    // Hard maximum — never show spinner longer than 3 seconds
    const timeout = setTimeout(() => setLoading(false), 3000);

    // 1. Fetch initial session directly with its own timeout
    const sessionTimeout = new Promise<null>((r) => setTimeout(() => r(null), 2500));
    Promise.race([supabase.auth.getSession(), sessionTimeout])
      .then(async (result) => {
        if (result && typeof result === 'object' && 'data' in result) {
          const currentSession = result.data.session;
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            try {
              const profileTimeout = new Promise<null>((r) => setTimeout(() => r(null), 2000));
              const profile = await Promise.race([
                fetchUserProfile(currentSession.user.id),
                profileTimeout,
              ]);
              setUserProfile(profile);
            } catch {
              // Continue without profile
            }
          }
        }
        clearTimeout(timeout);
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    // 2. Subscribe to later auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Skip INITIAL_SESSION — handled by getSession() above
      if (event === 'INITIAL_SESSION') return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
        newSession?.user
      ) {
        try {
          const profile = await fetchUserProfile(newSession.user.id);
          setUserProfile(profile);
        } catch {
          // Keep existing profile
        }
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error: string | null }> => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { error: mapAuthError(error) };
        }

        return { error: null };
      } catch {
        return {
          error: 'Er is iets misgegaan. Probeer het later opnieuw.',
        };
      }
    },
    []
  );

  const signInWithMagicLink = useCallback(
    async (email: string): Promise<{ error: string | null }> => {
      try {
        const { error } = await supabase.auth.signInWithOtp({ email });

        if (error) {
          return { error: mapAuthError(error) };
        }

        return { error: null };
      } catch {
        return {
          error: 'Er is iets misgegaan. Probeer het later opnieuw.',
        };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        signIn,
        signInWithMagicLink,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context. Must be used within an AuthProvider.
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
