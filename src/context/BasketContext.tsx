
import React, { createContext, useContext, useEffect } from 'react';
import { useBasketStore } from '../lib/store';
import { useAuth } from './AuthContext';

const BasketContext = createContext<any>(undefined);

export const BasketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialize = useBasketStore(state => state.initialize);
  const refreshBasket = useBasketStore(state => state.refreshBasket);
  const subscribe = useBasketStore(state => state.subscribe);
  const unsubscribe = useBasketStore(state => state.unsubscribe);
  const { user } = useAuth();

  // Initialize store on mount
  useEffect(() => {
      initialize();
      return () => {
          unsubscribe();
      };
  }, []);

  // Sync with Auth & Realtime
  // Optimized dependency: Only trigger when user ID or verification status changes
  useEffect(() => {
      if (user?.isEmailVerified && user?.id) {
          refreshBasket().then(() => {
              subscribe(); // Activate Realtime listener
          });
      } else {
          unsubscribe();
      }
  }, [user?.id, user?.isEmailVerified]);

  return <>{children}</>;
};

// Hook now directly returns the Zustand state
export const useBasket = () => {
  return useBasketStore();
};
