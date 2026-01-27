
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Basket, BasketItem, BasketStatus, Product, Cycle } from '../types';
import { API } from '../lib/api';
import { AuthContext } from './AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ui';
import { Logger } from '../lib/logger';

interface BasketContextType {
  basket: Basket | undefined;
  itemCount: number;
  subtotal: number;
  serviceFee: number;
  discount: number;
  totalValue: number;
  isCartOpen: boolean;
  activeCycle: Cycle | null;
  isBasketLocked: boolean; // Runtime lock for edits
  isPaymentEnabled: boolean; // Runtime check for payment window
  openCart: () => void;
  closeCart: () => void;
  refreshBasket: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<number>;
  removeCoupon: () => Promise<void>;
  updateLocalPayment: (amount: number) => void; // New method for instant UI updates
}

const BasketContext = createContext<BasketContextType | undefined>(undefined);

// Helper for safe dates
const safeDate = (dateString: string | null | undefined): Date | null => {
    if (!dateString) return null;
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? null : d;
};

export const BasketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [basket, setBasket] = useState<Basket | undefined>();
  const [itemCount, setItemCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [subtotal, setSubtotal] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  
  // Store fee percentage locally to match backend
  const [feePercentage, setFeePercentage] = useState(0.05);

  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const refreshUser = authContext?.refreshUser;
  
  const { showToast } = useToast();
  const prevStatusRef = useRef<BasketStatus | undefined>(undefined);

  // Fetch settings & Active Cycle
  const loadCycleAndSettings = useCallback(async () => {
      try {
          const [s, c] = await Promise.all([
              API.getSettings(),
              API.getActiveCycle()
          ]);
          
          if (s.basketServiceFeePercentage) {
              setFeePercentage(s.basketServiceFeePercentage / 100);
          }
          setActiveCycle(c);
      } catch(e) {
          // Silent fail on settings load is okay, defaults are used
          console.warn("Failed to load cycle settings, using defaults.");
      }
  }, []);

  useEffect(() => {
      loadCycleAndSettings();
  }, [loadCycleAndSettings]);

  // Computed Lock Status: Realtime check against current date OR explicit status
  const isBasketLocked = React.useMemo(() => {
      // 0. System Closed check
      if (basket?.id === 'virtual-closed') return true;

      // 1. Explicit Status Check
      if (basket && basket.status !== BasketStatus.OPEN) return true;
      
      // 2. Runtime Date Check
      if (activeCycle) {
          const now = new Date();
          const lockDate = safeDate(activeCycle.lockDate);
          
          // Check optional Unlock Override
          if (activeCycle.unlockDate) {
              const unlockUntil = safeDate(activeCycle.unlockDate);
              if (unlockUntil && now < unlockUntil) return false; // Explicitly unlocked
          }

          if (lockDate && now > lockDate) return true; // Auto-lock if date passed
      }
      return false;
  }, [basket, activeCycle]);

  // Computed Payment Status: Payment window is independent of Lock Date
  const isPaymentEnabled = React.useMemo(() => {
      if (!activeCycle) return false;
      const now = new Date();
      const start = safeDate(activeCycle.paymentStartDate);
      const end = safeDate(activeCycle.paymentEndDate);
      
      if (!start || !end) return true; // Default to open if dates are messy
      return now >= start && now <= end;
  }, [activeCycle]);

  // Monitor Status for Toast Notification
  useEffect(() => {
      if (basket) {
          // Check explicit status change
          if (prevStatusRef.current === BasketStatus.OPEN && basket.status === BasketStatus.LOCKED) {
              showToast("Your basket has been LOCKED for processing. Modifications are now disabled.", "info");
          }
          prevStatusRef.current = basket.status;
      } else {
          prevStatusRef.current = undefined;
      }
  }, [basket, showToast]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const resetBasket = () => {
        setBasket(undefined);
        setItemCount(0);
        setSubtotal(0);
        setServiceFee(0);
        setDiscount(0);
        setTotalValue(0);
  };

  const calculateTotals = useCallback((items: BasketItem[], discountAmount: number = 0) => {
      const localSub = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
      const localFee = localSub * feePercentage; 
      const localTot = Math.max(0, localSub + localFee - discountAmount);
      return { localSub, localFee, localTot };
  }, [feePercentage]);

  const refreshBasket = useCallback(async () => {
    if (!user || !user.isEmailVerified) {
        resetBasket();
        return;
    }

    try {
        const b = await API.getBasket();
        setBasket(b);
        
        if (b?.id === 'virtual-closed') {
             // Handle closed system state
             setItemCount(0);
             setSubtotal(0);
             return;
        }

        const items = b?.items || [];
        const count = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
        setItemCount(count);
        
        const currentDiscount = b?.discount || 0;
        const { localSub, localFee, localTot } = calculateTotals(items, currentDiscount);

        // Prefer backend calculation if available, else fallback to local
        setSubtotal(b?.subtotal !== undefined ? b.subtotal : localSub);
        setServiceFee(b?.serviceFee !== undefined ? b.serviceFee : localFee);
        setDiscount(currentDiscount);
        setTotalValue(b?.totalValue !== undefined ? b.totalValue : localTot);

    } catch (e: any) {
        if (e.message && e.message.includes("verify your email")) {
            if (refreshUser) refreshUser();
            resetBasket();
        } else {
            // Only log if it's not a generic network fetch error during init
            if(e.message !== 'Not logged in') {
               console.warn("Basket refresh deferred:", e.message);
            }
        }
    }
  }, [user, refreshUser, calculateTotals]);

  // --- REALTIME SUBSCRIPTIONS ---
  useEffect(() => {
    // 1. Listen for CYCLE updates (Lock Date changes by Admin)
    const cycleChannel = supabase.channel('public:cycles')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'cycles' },
            (payload: any) => {
                if (payload.new && payload.new.is_active) {
                    setActiveCycle({
                        id: payload.new.id,
                        name: payload.new.name,
                        paymentStartDate: payload.new.payment_start_date,
                        paymentEndDate: payload.new.payment_end_date,
                        lockDate: payload.new.lock_date,
                        unlockDate: payload.new.unlock_date,
                        bulkStartDate: payload.new.bulk_start_date,
                        bulkEndDate: payload.new.bulk_end_date,
                        deliveryDate: payload.new.delivery_date,
                        isActive: payload.new.is_active
                    });
                }
            }
        )
        .subscribe();

    if (!user) return () => { supabase.removeChannel(cycleChannel); };

    // 2. Listen for BASKET updates (User-specific)
    const basketChannel = supabase.channel(`basket_${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'baskets', 
          filter: `user_id=eq.${user.id}` 
        },
        () => {
          refreshBasket();
        }
      )
      .subscribe();

    refreshBasket();

    return () => {
      supabase.removeChannel(cycleChannel);
      supabase.removeChannel(basketChannel);
    };
  }, [user, refreshBasket]);


  // OPTIMISTIC UPDATE LOGIC
  const addItem = async (product: Product, quantity = 1) => {
    if (!user || !user.isEmailVerified) throw new Error("Please verify your email address to shop.");
    
    // Check if system is closed (virtual basket)
    if (basket?.id === 'virtual-closed') {
        showToast("The market is currently closed for new orders.", "error");
        return;
    }

    // Rollover Logic: If locked, allow add but notify user it's for next cycle.
    // The API layer handles creating the new basket.
    if (isBasketLocked) {
         showToast("Current cycle is locked. Item added to your Next Cycle basket.", "info");
    }

    // 1. Snapshot previous state
    const prevBasket = basket ? { ...basket } : undefined;
    const prevItems = basket?.items ? [...basket.items] : [];

    // 2. Optimistically Update State (Simple add, won't accurately reflect "New Basket" structure until refresh)
    // If locked, we don't optimistically update purely to avoid UI confusion until the refresh brings back the new basket.
    if (!isBasketLocked) {
        let newItems = [...prevItems];
        const existingItemIndex = newItems.findIndex(i => i.productId === product.id);

        if (existingItemIndex > -1) {
            const item = { ...newItems[existingItemIndex] };
            item.quantity += quantity;
            if (item.quantity <= 0) {
                newItems = newItems.filter(i => i.productId !== product.id);
            } else {
                newItems[existingItemIndex] = item;
            }
        } else if (quantity > 0) {
            newItems.push({
                productId: product.id,
                quantity,
                unitPrice: product.price,
                totalPrice: product.price * quantity,
                product: product // Ensure product data is available immediately
            });
        }

        // Update Local Context immediately
        const newCount = newItems.reduce((acc, i) => acc + i.quantity, 0);
        const { localSub, localFee, localTot } = calculateTotals(newItems, discount);
        
        setItemCount(newCount);
        setSubtotal(localSub);
        setServiceFee(localFee);
        setTotalValue(localTot);
        
        if (basket) {
            setBasket({ ...basket, items: newItems, subtotal: localSub, serviceFee: localFee, totalValue: localTot });
        }
    }

    try {
        await API.addToBasket(product.id, quantity);
        
        // Show Toast on Success
        if (quantity > 0) {
            showToast(`${product.name} has been added to cart`, "success");
        } else if (quantity < 0) {
            // Optional: Message for removal or decrement
            // showToast("Cart updated", "info");
        }

        // Force refresh to handle the potential basket switch (Rollover)
        refreshBasket(); 
    } catch (e: any) {
        // Rollback on error
        Logger.error("Update failed, rolling back", e.message || e);
        showToast('Failed to update basket. Please try again.', 'error');
        if (!isBasketLocked) {
            setBasket(prevBasket);
            if (prevBasket) {
                 const prevCount = prevBasket.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
                 const totals = calculateTotals(prevBasket.items, prevBasket.discount);
                 setItemCount(prevCount);
                 setSubtotal(totals.localSub);
                 setServiceFee(totals.localFee);
                 setTotalValue(totals.localTot);
                 setDiscount(prevBasket.discount || 0);
            }
        }
        throw e; 
    }
  };

  const updateItem = async (productId: string, quantity: number) => {
      const item = basket?.items?.find((i: any) => i.productId === productId);
      if (item && item.product) {
          await addItem(item.product, quantity);
      }
  };

  const removeItem = async (productId: string) => {
    const item = basket?.items?.find((i: any) => i.productId === productId);
    if (item && item.product) {
        await addItem(item.product, -item.quantity);
        showToast("Item removed from cart", "info");
    }
  };

  const applyCoupon = async (code: string) => {
      const discountAmount = await API.applyCoupon(code);
      await refreshBasket();
      return discountAmount;
  };

  const removeCoupon = async () => {
      await API.removeCoupon();
      await refreshBasket();
  };

  // NEW: Optimistic Payment Update
  const updateLocalPayment = useCallback((amount: number) => {
      if (basket) {
          setBasket((prev) => {
              if(!prev) return undefined;
              return { 
                  ...prev, 
                  amountPaid: (prev.amountPaid || 0) + amount 
              };
          });
      }
  }, [basket]);

  return (
    <BasketContext.Provider value={{ 
        basket, itemCount, subtotal, serviceFee, discount, totalValue, 
        isCartOpen, activeCycle, isBasketLocked, isPaymentEnabled,
        openCart, closeCart,
        refreshBasket, addItem, removeItem, updateItem,
        applyCoupon, removeCoupon,
        updateLocalPayment 
    }}>
      {children}
    </BasketContext.Provider>
  );
};

export const useBasket = () => {
  const context = useContext(BasketContext);
  if (!context) throw new Error('useBasket must be used within a BasketProvider');
  return context;
};
