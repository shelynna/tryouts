
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { API } from '../lib/api';

interface AuthContextType {
  user: User | undefined;
  logout: () => void;
  registerSync: (user: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to determine admin status based on DB role or Domain fallback
  const checkIsAdmin = (u: User) => {
    return u.role === UserRole.ADMIN || u.email.endsWith('@smlghana.store');
  };

  const fetchProfile = async (userId: string) => {
    try {
        const profile = await API.getMe(userId);
        if (profile) setUser(profile);
        else setUser(undefined);
    } catch (e) {
        console.error("Error fetching profile", e);
        setUser(undefined);
    }
  };

  useEffect(() => {
    // 1. Check active session on load
    const initSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchProfile(session.user.id);
            }
        } catch (error) {
            console.error("Session init error", error);
        } finally {
            setIsLoading(false);
        }
    };

    initSession();

    // 2. Listen for Auth Changes (Login, Logout, Auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Only fetch if we don't have the user or the ID changed
        if (!user || user.id !== session.user.id) {
            await fetchProfile(session.user.id);
        }
      } else {
        setUser(undefined);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await fetchProfile(authUser.id);
    }
  };

  const registerSync = async (userData: Partial<User>) => {
    // Supabase trigger handles row creation in 'profiles', update fields here
    try {
        const payload: any = {
            phone: userData.phoneNumber,
            pickup_point: userData.pickupPoint,
            full_name: userData.fullName
        };

        // Only update referred_by if provided and not empty
        if (userData.referralCode && userData.referralCode.trim() !== '') {
            payload.referred_by = userData.referralCode.trim().toUpperCase();
        }

        const { error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', userData.id);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(undefined);
    localStorage.clear();
  };

  const isAdmin = user ? checkIsAdmin(user) : false;

  return (
    <AuthContext.Provider value={{ 
        user, 
        logout, 
        registerSync, 
        refreshUser, 
        isAuthenticated: !!user, 
        isLoading,
        isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
      throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
