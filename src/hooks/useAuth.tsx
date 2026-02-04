import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole, Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  premiumExpiresAt: string | null;
  premiumType: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);
  const [premiumType, setPremiumType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Clear user-specific cache when signing out
        if (event === 'SIGNED_OUT') {
          queryClient.removeQueries({ queryKey: ['watchlist'] });
          queryClient.removeQueries({ queryKey: ['admin'] });
        }
        
        // Refetch user-specific data when signing in
        if (event === 'SIGNED_IN' && session?.user) {
          queryClient.invalidateQueries({ queryKey: ['watchlist', session.user.id] });
        }

        // Defer profile/role fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setPremiumExpiresAt(null);
          setPremiumType(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserData(userId: string) {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch role and premium info
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, premium_expires_at, premium_type')
        .eq('user_id', userId)
        .single();

      if (roleData) {
        setRole(roleData.role as AppRole);
        setPremiumExpiresAt(roleData.premium_expires_at);
        setPremiumType(roleData.premium_type);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Clear all React Query cache
    queryClient.clear();
    
    // Clear localStorage items related to the app
    localStorage.removeItem('sb-orvctyhsjefhxncxxsrb-auth-token');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Reset state
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setPremiumExpiresAt(null);
    setPremiumType(null);
  };

  const isAdmin = role === 'admin';
  const isPremium = role === 'admin' || role === 'premium';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        premiumExpiresAt,
        premiumType,
        isLoading,
        isAdmin,
        isPremium,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
