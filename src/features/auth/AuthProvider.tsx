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

  // Suppress Supabase auth lock errors — they are not fatal and
  // should not crash the app
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const msg = String(e.reason?.message ?? e.reason ?? '');
      if (msg.includes('Lock') && msg.includes('stolen')) {
        e.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  useEffect(() => {
    // Safety timeout — never hang on auth check longer than 8 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    // Use onAuthStateChange with INITIAL_SESSION to avoid lock conflicts
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'INITIAL_SESSION') {
        // This fires once after getSession() resolves — use it as the
        // single source of truth for the initial load
        clearTimeout(timeout);
        if (newSession?.user) {
          try {
            const profile = await fetchUserProfile(newSession.user.id);
            setUserProfile(profile);
          } catch {
            // Profile fetch failed — continue without profile
          }
        }
        setLoading(false);
        return;
      }

      if (
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
        newSession?.user
      ) {
        try {
          const profile = await fetchUserProfile(newSession.user.id);
          setUserProfile(profile);
        } catch {
          // Profile fetch failed — keep existing profile
        }
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Cleanup subscription and timeout on unmount
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
