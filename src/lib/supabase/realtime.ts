
import { supabase } from '../supabaseClient';
import type { Cycle, Basket } from '../../types';

type Callback<T> = (payload: T) => void;

class RealtimeService {
  private cycleSubscriptions = new Map<string, Callback<Cycle>>();
  private basketSubscriptions = new Map<string, Callback<Basket>>();
  
  constructor() {
    this.initializeRealtime();
  }
  
  private initializeRealtime() {
    const cycleChannel = supabase
      .channel('cycles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cycles',
        },
        (payload) => {
          this.handleCycleUpdate(payload);
        }
      )
      .subscribe();
    
    // We defer user-specific subscription until we have a user ID, 
    // or we subscribe generically and filter in the callback if needed.
    // For simplicity here, we assume the hook handles user-specific subs or we use a broader filter.
  }
  
  private handleCycleUpdate(payload: any) {
    const cycle = payload.new as Cycle;
    this.cycleSubscriptions.forEach(callback => callback(cycle));
  }
  
  private handleBasketUpdate(payload: any) {
    const basket = payload.new as Basket;
    this.basketSubscriptions.forEach(callback => callback(basket));
  }
  
  // Subscribe to cycle updates
  subscribeToCycle(
    cycleId: string, 
    callback: Callback<Cycle>
  ): () => void {
    const key = `cycle-${cycleId}`;
    this.cycleSubscriptions.set(key, callback);
    return () => { this.cycleSubscriptions.delete(key); };
  }
  
  // Subscribe to user's basket updates
  subscribeToBasket(
    basketId: string, 
    callback: Callback<Basket>
  ): () => void {
    const key = `basket-${basketId}`;
    this.basketSubscriptions.set(key, callback);
    
    const channel = supabase
      .channel(`basket-${basketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'baskets',
          filter: `id=eq.${basketId}`,
        },
        (payload) => {
          this.handleBasketUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      this.basketSubscriptions.delete(key);
      supabase.removeChannel(channel);
    };
  }
  
  subscribeToAllCycles(callback: Callback<Cycle>): () => void {
    const key = 'all-cycles';
    this.cycleSubscriptions.set(key, callback);
    return () => { this.cycleSubscriptions.delete(key); };
  }
  
  on(eventName: string, handler: EventListener) {
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }
}

export const realtimeService = new RealtimeService();