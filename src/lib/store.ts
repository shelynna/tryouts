
import { create } from 'zustand';
import { Basket, BasketItem, Cycle, Product, BasketStatus } from '../types';
import { API } from './api';
import { supabase } from './supabaseClient';
import { getCurrentBasket, getOutstandingBaskets, upsertBasketItem } from './services/basketService';

interface BasketState {
  basket: Basket | undefined; // The 'Writable' basket
  outstandingBaskets: Basket[]; // 'Payable' baskets
  
  itemCount: number;
  subtotal: number;
  serviceFee: number;
  discount: number;
  totalValue: number;
  isCartOpen: boolean;
  activeCycle: Cycle | null;
  feePercentage: number;
  
  // Computed
  isBasketLocked: boolean; // True if STRICTLY locked (cannot add). False if Open or Draft.
  isPaymentEnabled: boolean; // True if Open. False if Draft/Locked.

  // Realtime Subscription
  subscription: any | null;

  // Actions
  openCart: () => void;
  closeCart: () => void;
  refreshBasket: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<number>;
  removeCoupon: () => Promise<void>;
  updateLocalPayment: (amount: number, basketId?: string) => void;
  initialize: () => Promise<void>;
  subscribe: () => void;
  unsubscribe: () => void;
}

const calculateTotals = (items: BasketItem[], discountAmount: number = 0, feePercentage: number = 0.05) => {
    const localSub = items.reduce((acc, item) => {
        // Exclude inactive products from total calculation
        if (item.product && item.product.isActive === false) return acc;
        return acc + (item.unitPrice * item.quantity);
    }, 0);
    const localFee = localSub * feePercentage; 
    const localTot = Math.max(0, localSub + localFee - discountAmount);
    return { localSub, localFee, localTot };
};

export const useBasketStore = create<BasketState>((set, get) => ({
  basket: undefined,
  outstandingBaskets: [],
  itemCount: 0,
  subtotal: 0,
  serviceFee: 0,
  discount: 0,
  totalValue: 0,
  isCartOpen: false,
  activeCycle: null,
  feePercentage: 0.05,
  isBasketLocked: false,
  isPaymentEnabled: false,
  subscription: null,

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),

  initialize: async () => {
      try {
          const [s, c] = await Promise.all([API.getSettings(), API.getActiveCycle()]);
          set({ 
              feePercentage: s.basketServiceFeePercentage ? s.basketServiceFeePercentage / 100 : 0.05,
              activeCycle: c
          });
          
          await get().refreshBasket();
          get().subscribe();
      } catch (e) {
          console.warn("Basket store init failed", e);
      }
  },

  subscribe: () => {
      if (get().subscription) return; 
      const channel = supabase.channel('basket-realtime')
          .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'baskets' },
              () => get().refreshBasket()
          )
          .subscribe();
      set({ subscription: channel });
  },

  unsubscribe: () => {
      const { subscription } = get();
      if (subscription) {
          supabase.removeChannel(subscription);
          set({ subscription: null });
      }
  },

  refreshBasket: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          set({ basket: undefined, outstandingBaskets: [], itemCount: 0, totalValue: 0 });
          return;
      }

      try {
          // Fetch both concurrently
          const [current, outstanding] = await Promise.all([
              getCurrentBasket(),
              getOutstandingBaskets()
          ]);

          // Calc totals for current basket
          const items = current?.items || [];
          const count = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
          const { localSub, localFee, localTot } = calculateTotals(items, current?.discount || 0, get().feePercentage);

          // Update current basket object with recalculated totals to exclude inactive items
          const updatedBasket = current ? {
              ...current,
              subtotal: localSub,
              serviceFee: localFee,
              totalValue: localTot,
              balance: Math.max(0, localTot - current.amountPaid)
          } : undefined;

          // Force normal e-commerce behavior: Always unlocked, always payable if items exist
          set({
              basket: updatedBasket,
              outstandingBaskets: outstanding,
              itemCount: count,
              subtotal: localSub,
              serviceFee: localFee,
              discount: current ? current.discount : 0,
              totalValue: localTot,
              isBasketLocked: false, 
              isPaymentEnabled: true
          });
      } catch (e) {
          console.error("Failed to refresh basket", e);
      }
  },

  addItem: async (product, quantity = 1) => {
      const { basket, feePercentage } = get();
      
      // OPTIMISTIC UPDATE START
      const currentItems = basket?.items ? [...basket.items] : [];
      const existingItemIndex = currentItems.findIndex((i: any) => i.productId === product.id);
      
      let newItems = [...currentItems];
      if (existingItemIndex > -1) {
          // Update existing item
          const item = newItems[existingItemIndex];
          if (quantity <= 0) {
              newItems.splice(existingItemIndex, 1);
          } else {
              newItems[existingItemIndex] = {
                  ...item,
                  quantity: quantity,
                  totalPrice: quantity * item.unitPrice
              };
          }
      } else if (quantity > 0) {
          // Add new item
          newItems.push({
              productId: product.id,
              quantity: quantity,
              unitPrice: product.price,
              totalPrice: quantity * product.price,
              product: product
          });
      }

      const { localSub, localFee, localTot } = calculateTotals(newItems, basket?.discount || 0, feePercentage);
      
      const newItemCount = newItems.reduce((acc: number, i: any) => acc + i.quantity, 0);

      const optimisticBasket = {
          ...(basket || { id: 'temp', status: 'OPEN', month: 'Current', userId: '', amountPaid: 0 } as Basket),
          items: newItems,
          subtotal: localSub,
          serviceFee: localFee,
          totalValue: localTot,
          balance: Math.max(0, localTot - (basket?.amountPaid || 0)),
      } as Basket;

      set({ 
          basket: optimisticBasket, 
          itemCount: newItemCount,
          subtotal: localSub,
          totalValue: localTot,
          serviceFee: localFee
      });
      // OPTIMISTIC UPDATE END

      try {
          await upsertBasketItem(product.id, quantity, product.price);
          // Sync with server eventually
          await get().refreshBasket();
      } catch (e) {
          console.error("Add item failed", e);
          get().refreshBasket(); // Revert on error
      }
  },

  removeItem: async (productId) => {
      // Just call addItem with 0 quantity which handles removal logic
      const item = get().basket?.items?.find((i: any) => i.productId === productId);
      // Even if item.product is undefined (rare), we need to pass a dummy product with correct ID to trigger removal logic in addItem
      // However, addItem expects a Product object. 
      // If item.product is missing, we can try to construct a minimal one or call API directly.
      if (item && item.product) {
          await get().addItem(item.product, 0);
      } else if (item) {
          // Fallback if product details are missing locally
          // We can't use addItem easily without full product obj for optimistic update of new list if we were adding, 
          // but for removing, we just need ID. 
          // But addItem logic relies on product obj.
          // Let's call API directly and refresh.
           try {
              await upsertBasketItem(productId, 0, 0);
              await get().refreshBasket();
          } catch(e) {
              console.error("Remove item failed", e);
          }
      }
  },

  updateItem: async (productId, delta) => {
      // Wrapper to use absolute quantity
      const item = get().basket?.items?.find((i: any) => i.productId === productId);
      if (item && item.product) {
          await get().addItem(item.product, item.quantity + delta);
      }
  },

  applyCoupon: async (code) => {
      // Re-using logic from service
      const discount = await API.applyCoupon(code);
      await get().refreshBasket();
      return discount;
  },

  removeCoupon: async () => {
      await API.removeCoupon();
      await get().refreshBasket();
  },

  updateLocalPayment: (amount: number, basketId?: string) => {
      // Optimistic payment update
      const { basket, outstandingBaskets } = get();
      
      // Check if it's the current basket
      if (basket && (!basketId || basket.id === basketId)) {
          const newPaid = (basket.amountPaid || 0) + amount;
          const newBalance = Math.max(0, basket.totalValue - newPaid);
          set({ basket: { ...basket, amountPaid: newPaid, balance: newBalance } });
          return;
      }

      // Check outstanding baskets
      const targetIndex = outstandingBaskets.findIndex(b => b.id === basketId);
      if (targetIndex > -1) {
          const target = outstandingBaskets[targetIndex];
          const newPaid = (target.amountPaid || 0) + amount;
          const newBalance = Math.max(0, target.totalValue - newPaid);
          
          const newOutstanding = [...outstandingBaskets];
          newOutstanding[targetIndex] = { ...target, amountPaid: newPaid, balance: newBalance };
          
          set({ outstandingBaskets: newOutstanding });
      }
  }
}));
