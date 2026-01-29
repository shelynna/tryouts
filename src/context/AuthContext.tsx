
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User, UserRole, PickupPoint } from '../types';
import { supabase } from '../lib/supabaseClient';
import { API } from '../lib/api';
import { Logger } from '../lib/logger';

interface AuthContextType {
  user: User | undefined;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean; // True only during initial boot
  isAdmin: boolean;
  authStatus: string;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMsg, setAuthMsg] = useState('');
  
  // Ref to track current user ID without triggering re-renders in effects
  const profileIdRef = useRef<string | null>(null);
  
  // 1. Helper to construct a User object from Session Metadata (Fast Fallback)
  const getUserFromSession = (currentSession: any): User | null => {
      if (!currentSession?.user) return null;
      const meta = currentSession.user.user_metadata || {};
      
      return {
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          isEmailVerified: !!currentSession.user.email_confirmed_at,
          fullName: meta.full_name || 'SML User',
          phoneNumber: meta.phone || '',
          pickupPoint: (meta.pickup_point as PickupPoint) || PickupPoint.HALL_7,
          role: UserRole.USER, // Default until DB loads
          isSubscriber: false,
          creditBalance: 0,
          isBlocked: false,
          referralCode: meta.referral_code_input || '',
          planIntent: meta.plan_intent || 'STANDARD'
      };
  };

  // 2. Load Profile from DB (Async Enhancement)
  const fetchProfile = useCallback(async (uid: string, currentSession: any) => {
      try {
          const dbUser = await API.getMe(uid);
          if (dbUser) {
              setProfile(dbUser);
              profileIdRef.current = dbUser.id;
          } else if (!profile) {
              // Only fallback to session metadata if we don't have a profile yet
              const sessionUser = getUserFromSession(currentSession);
              setProfile(sessionUser);
              if (sessionUser) profileIdRef.current = sessionUser.id;
          }
      } catch (err) {
          if (!profile) {
              const sessionUser = getUserFromSession(currentSession);
              setProfile(sessionUser);
              if (sessionUser) profileIdRef.current = sessionUser.id;
          }
      }
  }, [profile]); // Dependency on profile to check if it exists

  useEffect(() => {
    let mounted = true;

    // 3. Initialize Session
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
            if (initialSession) {
                setSession(initialSession);
                // Set immediate fallback so UI shows "Logged In" instantly
                const initialUser = getUserFromSession(initialSession);
                setProfile(initialUser);
                if (initialUser) profileIdRef.current = initialUser.id;
                
                // CRITICAL FIX: Await full profile fetch before releasing loading state
                // This ensures we have the correct Role (ADMIN/USER) before routing logic runs
                await fetchProfile(initialSession.user.id, initialSession);
            }
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // 4. Real-time Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;

        if (newSession) {
            setSession(newSession);
            
            // CRITICAL FIX: Only reset profile if the user ID has changed.
            // Using ref to check current ID prevents stale closure issues.
            const currentId = profileIdRef.current;
            const newId = newSession.user.id;
            const isDifferentUser = currentId !== newId;

            if (isDifferentUser) {
                const sessionUser = getUserFromSession(newSession);
                setProfile(sessionUser);
                profileIdRef.current = newId;
            }
            
            // Always try to fetch latest data to ensure sync
            // Note: We don't await here because this happens after initial load
            fetchProfile(newSession.user.id, newSession);
            
            if (isLoading) setIsLoading(false);
        } else {
            // Signed out
            setSession(null);
            setProfile(null);
            profileIdRef.current = null;
            setIsLoading(false);
        }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array for setup

  const logout = async () => {
    setAuthMsg('Signing out...');
    try {
        await supabase.auth.signOut();
        localStorage.clear();
        setSession(null);
        setProfile(null);
        profileIdRef.current = null;
    } catch (e) {
        Logger.error("Logout error", e);
    } finally {
        setAuthMsg('');
    }
  };

  const refreshUser = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession) {
        setSession(currentSession);
        await fetchProfile(currentSession.user.id, currentSession);
    }
  };

  const computedUser = useMemo(() => profile, [profile]);

  return (
    <AuthContext.Provider value={{
      user: computedUser || undefined, 
      session, 
      isAuthenticated: !!session,
      isLoading,
      isAdmin: computedUser?.role === UserRole.ADMIN,
      authStatus: authMsg,
      logout, 
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
