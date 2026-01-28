
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
          } else {
              // Keep the metadata user if DB fails, don't crash
              setProfile(getUserFromSession(currentSession));
          }
      } catch (err) {
          console.warn("Profile fetch error, using fallback", err);
      }
  }, []);

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
                setProfile(getUserFromSession(initialSession)); 
                // Then fetch full data in background
                fetchProfile(initialSession.user.id, initialSession);
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
            // If we just signed in or don't have a profile yet
            if (event === 'SIGNED_IN' || !profile) {
                setProfile(getUserFromSession(newSession));
                fetchProfile(newSession.user.id, newSession);
            }
            setIsLoading(false);
        } else {
            // Signed out
            setSession(null);
            setProfile(null);
            setIsLoading(false);
        }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const logout = async () => {
    setAuthMsg('Signing out...');
    try {
        await supabase.auth.signOut();
        localStorage.clear();
        setSession(null);
        setProfile(null);
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
