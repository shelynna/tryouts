
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, UserRole, PickupPoint } from '../types';
import { supabase } from '../lib/supabaseClient';
import { API } from '../lib/api';
import { Logger } from '../lib/logger';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

// The Gold Standard Auth States
export type AuthStatus = 'CHECKING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

interface AuthContextType {
  user: User | undefined;
  session: Session | null;
  status: AuthStatus;
  
  // Helpers
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  authStatus: string; // Kept for backward compatibility with Login UI
  
  // Actions
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('CHECKING');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Partial<User> | null>(null);
  const [authMsg, setAuthMsg] = useState('');

  // Helper to load profile data
  const loadProfile = async (uid: string) => {
    try {
      const p = await API.getMe(uid);
      if (p) {
        setProfile(p);
        return p;
      }
    } catch (e) {
      Logger.warn("Failed to load profile data. Using session metadata fallback.", { error: e });
    }
    return null;
  };

  // 1. AUTHENTICATION INITIALIZATION
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (initialSession) {
            setSession(initialSession);
            // CRITICAL: Load profile BEFORE setting authenticated status
            // This prevents the UI from rendering as "User" (default) before "Admin" is confirmed
            await loadProfile(initialSession.user.id);
            setStatus('AUTHENTICATED');
            Logger.info("Auth initialized: Authenticated");
          } else {
            setStatus('UNAUTHENTICATED');
            Logger.info("Auth initialized: No Session");
          }
        }
      } catch (e) {
        Logger.error("Auth initialization error", e);
        if (mounted) setStatus('UNAUTHENTICATED');
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, newSession: Session | null) => {
      if (!mounted) return;
      Logger.info(`Auth Event: ${event}`);

      if (newSession) {
        setSession(newSession);
        // Only load profile if we don't have it or it's a different user
        if (!profile || profile.id !== newSession.user.id) {
             await loadProfile(newSession.user.id);
        }
        setStatus('AUTHENTICATED');
      } else {
        setSession(null);
        setProfile(null);
        setStatus('UNAUTHENTICATED');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 3. DERIVED STATE (The "Model")
  const user = useMemo((): User | undefined => {
    if (!session?.user) return undefined;

    const metadata = session.user.user_metadata || {};
    
    return {
      id: session.user.id,
      email: session.user.email || '',
      isEmailVerified: !!session.user.email_confirmed_at,
      
      fullName: profile?.fullName || metadata.full_name || 'User',
      phoneNumber: profile?.phoneNumber || metadata.phone || '',
      pickupPoint: (profile?.pickupPoint as PickupPoint) || (metadata.pickup_point as PickupPoint) || PickupPoint.HALL_7,
      
      role: profile?.role || UserRole.USER,
      isSubscriber: profile?.isSubscriber || false,
      creditBalance: profile?.creditBalance || 0,
      isBlocked: profile?.isBlocked || false,
      
      referralCode: profile?.referralCode,
      referredBy: profile?.referredBy
    };
  }, [session, profile]);

  const logout = async () => {
    setAuthMsg('Signing out...');
    try {
        await supabase.auth.signOut();
    } catch (e) {
        Logger.error("Logout error", e);
    }
    setSession(null);
    setProfile(null);
    setStatus('UNAUTHENTICATED');
    localStorage.clear();
    setAuthMsg('');
  };

  const refreshUser = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (currentSession?.user) {
      if (!session || session.user.id !== currentSession.user.id) {
          setSession(currentSession);
      }
      // Force reload profile to get latest role/balance
      await loadProfile(currentSession.user.id);
      
      if (status !== 'AUTHENTICATED') {
          setStatus('AUTHENTICATED');
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      status,
      isAuthenticated: status === 'AUTHENTICATED',
      isLoading: status === 'CHECKING',
      isAdmin: user?.role === UserRole.ADMIN,
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
