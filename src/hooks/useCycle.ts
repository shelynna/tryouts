
import { useState, useEffect, useCallback } from 'react';
import { cycleService } from '../lib/services/cycleService';
import * as basketService from '../lib/services/basketService';
import { supabase } from '../lib/supabaseClient';
import type { Cycle, Basket, CyclePhase, CycleAccess } from '../types';

export const useCycle = () => {
  const [currentCycle, setCurrentCycle] = useState<Cycle | null>(null);
  const [userBasket, setUserBasket] = useState<Basket | null>(null);
  const [access, setAccess] = useState<CycleAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    initialize();
  }, []);
  
  const initialize = async () => {
    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      const cycle = await cycleService.getCurrentCycle();
      setCurrentCycle(cycle);
      
      if (!cycle || !currentUser) {
        setLoading(false);
        return;
      }
      
      const accessCheck = await cycleService.checkCycleAccess(currentUser.id, cycle.id);
      setAccess(accessCheck);
      
      const basket = await basketService.getOrCreateUserBasket(currentUser.id);
      setUserBasket(basket);
      
      const unsubscribeCycle = cycleService.subscribeToCycleUpdates(cycle.id, (updated) => {
        setCurrentCycle(updated);
        // We re-check access when cycle updates (e.g. locks/unlocks)
        cycleService.checkCycleAccess(currentUser.id, updated.id).then(setAccess);
      });
      
      if (basket) {
        const unsubscribeBasket = basketService.subscribeToBasketUpdates(basket.id, setUserBasket);
        return () => { unsubscribeCycle(); unsubscribeBasket(); };
      }
      return unsubscribeCycle;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  const getTimeUntilLock = useCallback(() => {
    if (!currentCycle) return null;
    return cycleService.getTimeUntilLock(currentCycle);
  }, [currentCycle]);
  
  const getCurrentPhase = useCallback((): CyclePhase => {
    if (!currentCycle) return 'no_access';
    return cycleService.getCurrentPhase(currentCycle);
  }, [currentCycle]);
  
  return {
    currentCycle,
    userBasket,
    access,
    user,
    loading,
    getTimeUntilLock,
    getCurrentPhase,
    refresh: initialize
  };
};