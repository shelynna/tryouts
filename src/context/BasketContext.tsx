
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Basket, BasketItem } from '../types';
import { API } from '../lib/api';
import { AuthContext } from './AuthContext';

interface BasketContextType {
  basket: Basket | undefined;
  itemCount: number;
  subtotal: number;
  serviceFee: number;
  totalValue: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  refreshBasket: () => void;
  addItem: (productId: string, quantity?: number, unitPrice?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
}

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export const BasketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [basket, setBasket] = useState<Basket | undefined>();
  const [itemCount, setItemCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [subtotal, setSubtotal] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  
  // Store fee percentage locally to match backend
  const [feePercentage, setFeePercentage] = useState(0.05);

  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const refreshUser = authContext?.refreshUser;

  // Fetch settings once to get accurate fee
  useEffect(() => {
      const loadSettings = async () => {
          try {
              const s = await API.getSettings();
              if (s.basketServiceFeePercentage) {
                  setFeePercentage(s.basketServiceFeePercentage / 100);
              }
          } catch(e) {}
      };
      loadSettings();
  }, []);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const resetBasket = () => {
        setBasket(undefined);
        setItemCount(0);
        setSubtotal(0);
        setServiceFee(0);
        setTotalValue(0);
  };

  const calculateTotals = useCallback((items: BasketItem[]) => {
      const localSub = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
      const localFee = localSub * feePercentage; 
      const localTot = localSub + localFee;
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
        
        const items = b?.items || [];
        const count = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
        setItemCount(count);
        
        const { localSub, localFee, localTot } = calculateTotals(items);

        // Prefer backend calculation if available, else fallback to local
        setSubtotal(b.subtotal !== undefined ? b.subtotal : localSub);
        setServiceFee(b.serviceFee !== undefined ? b.serviceFee : localFee);
        setTotalValue(b.totalValue !== undefined ? b.totalValue : localTot);

    } catch (e: any) {
        if (e.message && e.message.includes("verify your email")) {
            if (refreshUser) refreshUser();
            resetBasket();
        }
    }
  }, [user, refreshUser, calculateTotals]);

  useEffect(() => {
    refreshBasket();
  }, [refreshBasket]);

  // OPTIMISTIC UPDATE LOGIC
  const addItem = async (productId: string, quantity = 1, unitPrice = 0) => {
    if (!user || !user.isEmailVerified) throw new Error("Please verify your email address to shop.");

    // 1. Snapshot previous state
    const prevBasket = basket ? { ...basket } : undefined;
    const prevItems = basket?.items ? [...basket.items] : [];

    // 2. Optimistically Update State
    let newItems = [...prevItems];
    const existingItemIndex = newItems.findIndex(i => i.productId === productId);

    if (existingItemIndex > -1) {
        const item = { ...newItems[existingItemIndex] };
        item.quantity += quantity;
        if (item.quantity <= 0) {
            newItems = newItems.filter(i => i.productId !== productId);
        } else {
            newItems[existingItemIndex] = item;
        }
    } else if (quantity > 0) {
        // If unitPrice isn't passed (from cart +/-), try to find it in existing items or fallback
        const effectivePrice = unitPrice || 0; 
        
        newItems.push({
            productId,
            quantity,
            unitPrice: effectivePrice, 
            totalPrice: effectivePrice * quantity
        });
    }

    // Update Local Context immediately
    const newCount = newItems.reduce((acc, i) => acc + i.quantity, 0);
    const { localSub, localFee, localTot } = calculateTotals(newItems);
    
    setItemCount(newCount);
    setSubtotal(localSub);
    setServiceFee(localFee);
    setTotalValue(localTot);
    
    if (basket) {
        setBasket({ ...basket, items: newItems, subtotal: localSub, serviceFee: localFee, totalValue: localTot });
    }

    try {
        await API.addToBasket(productId, quantity);
        // Silent refresh to ensure sync
        refreshBasket(); 
    } catch (e) {
        // Rollback on error
        console.error("Optimistic update failed, rolling back");
        setBasket(prevBasket);
        if (prevBasket) {
             const prevCount = prevBasket.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
             const totals = calculateTotals(prevBasket.items);
             setItemCount(prevCount);
             setSubtotal(totals.localSub);
             setServiceFee(totals.localFee);
             setTotalValue(totals.localTot);
        }
        throw e; 
    }
  };

  const updateItem = async (productId: string, quantity: number) => {
      // Find the item to get its price for the optimistic update
      const item = basket?.items?.find((i: any) => i.productId === productId);
      await addItem(productId, quantity, item?.unitPrice);
  };

  const removeItem = async (productId: string) => {
    const item = basket?.items?.find((i: any) => i.productId === productId);
    if (item) {
        await addItem(productId, -item.quantity, item.unitPrice);
    }
  };

  return (
    <BasketContext.Provider value={{ 
        basket, itemCount, subtotal, serviceFee, totalValue, 
        isCartOpen, openCart, closeCart,
        refreshBasket, addItem, removeItem, updateItem 
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
