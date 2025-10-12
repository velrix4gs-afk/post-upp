import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    console.log('[Auth] Initializing auth state...');
    
    // Set timeout to prevent infinite loading (5 seconds)
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[Auth] Auth check timed out, continuing without auth');
        setLoading(false);
        setSession(null);
        setUser(null);
      }
    }, 5000);

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] State change:', event, session?.user?.id);
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('[Auth] Session error:', error.message);
        }
        console.log('[Auth] Session loaded:', session?.user?.id || 'no session');
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('[Auth] Failed to get session:', error);
        if (mounted) {
          setLoading(false);
          setSession(null);
          setUser(null);
        }
      });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};