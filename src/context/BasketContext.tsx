
import React, { createContext, useContext, useEffect } from 'react';
import { useBasketStore } from '../lib/store';
import { useAuth } from './AuthContext';

// We maintain the Context Provider interface for backward compatibility with App.tsx
// but the logic is now delegated to Zustand.

const BasketContext = createContext<any>(undefined);

export const BasketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialize = useBasketStore(state => state.initialize);
  const refreshBasket = useBasketStore(state => state.refreshBasket);
  const { user } = useAuth();

  // Initialize store on mount
  useEffect(() => {
      initialize();
  }, []);

  // Sync with Auth
  useEffect(() => {
      if (user?.isEmailVerified) {
          refreshBasket();
      }
  }, [user]);

  return <>{children}</>;
};

// Hook now directly returns the Zustand state
export const useBasket = () => {
  return useBasketStore();
};
