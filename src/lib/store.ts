
import { create } from 'zustand';
import { Basket, BasketItem, Cycle, BasketStatus, Product } from '../types';
import { API } from './api';
import { supabase } from './supabaseClient';

interface BasketState {
  basket: Basket | undefined;
  itemCount: number;
  subtotal: number;
  serviceFee: number;
  discount: number;
  totalValue: number;
  isCartOpen: boolean;
  activeCycle: Cycle | null;
  feePercentage: number;
  
  // Computed
  isBasketLocked: boolean;
  isPaymentEnabled: boolean;

  // Realtime Subscription
  subscription: any | null;

  // Actions
  openCart: () => void;
  closeCart: () => void;
  setFeePercentage: (fee: number) => void;
  refreshBasket: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<number>;
  removeCoupon: () => Promise<void>;
  updateLocalPayment: (amount: number) => void;
  initialize: () => Promise<void>;
  subscribe: () => void;
  unsubscribe: () => void;
}

// Helper calculation
const calculateTotals = (items: BasketItem[], discountAmount: number = 0, feePercentage: number = 0.05) => {
    const localSub = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    const localFee = localSub * feePercentage; 
    const localTot = Math.max(0, localSub + localFee - discountAmount);
    return { localSub, localFee, localTot };
};

const safeDate = (dateString: string | null | undefined): Date | null => {
    if (!dateString) return null;
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? null : d;
};

export const useBasketStore = create<BasketState>((set, get) => ({
  basket: undefined,
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
  setFeePercentage: (fee) => set({ feePercentage: fee }),

  initialize: async () => {
      try {
          const [s, c] = await Promise.all([API.getSettings(), API.getActiveCycle()]);
          set({ 
              feePercentage: s.basketServiceFeePercentage ? s.basketServiceFeePercentage / 100 : 0.05,
              activeCycle: c
          });
          
          // Compute flags
          const now = new Date();
          let isLocked = false;
          let isPaying = false;

          if (c) {
              const start = safeDate(c.paymentStartDate);
              const end = safeDate(c.paymentEndDate);
              const lockDate = safeDate(c.lockDate);
              const unlockUntil = safeDate(c.unlockDate);

              if (start && end && now >= start && now <= end) isPaying = true;
              if (lockDate && now > lockDate) isLocked = true;
              if (unlockUntil && now < unlockUntil) isLocked = false;
          }
          
          set({ isBasketLocked: isLocked, isPaymentEnabled: isPaying });
          await get().refreshBasket();
          
          // Start listening for updates
          get().subscribe();
      } catch (e) {
          console.warn("Basket store init failed", e);
      }
  },

  subscribe: () => {
      const { subscription } = get();
      if (subscription) return; 

      // Realtime listener for 'baskets' table
      const channel = supabase.channel('basket-realtime')
          .on(
              'postgres_changes',
              { 
                  event: 'UPDATE', 
                  schema: 'public', 
                  table: 'baskets'
              },
              (payload) => {
                  const currentBasket = get().basket;
                  // Only refresh if the update belongs to the current user's basket
                  if (currentBasket && payload.new.id === currentBasket.id) {
                      get().refreshBasket();
                  }
              }
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
          set({ basket: undefined, itemCount: 0, subtotal: 0, totalValue: 0 });
          return;
      }

      try {
          const b = await API.getBasket();
          
          if (b === undefined) return;

          if (b?.id === 'virtual-closed') {
              set({ basket: b, itemCount: 0, subtotal: 0, isBasketLocked: true });
              return;
          }

          const items = b?.items || [];
          const count = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
          const currentDiscount = b?.discount || 0;
          
          const backendTotal = b?.totalValue;
          const { localSub, localFee, localTot } = calculateTotals(items, currentDiscount, get().feePercentage);

          set({
              basket: b,
              itemCount: count,
              subtotal: b?.subtotal !== undefined ? b.subtotal : localSub,
              serviceFee: b?.serviceFee !== undefined ? b.serviceFee : localFee,
              discount: currentDiscount,
              totalValue: backendTotal !== undefined ? backendTotal : localTot,
              isBasketLocked: b?.status !== 'OPEN' ? true : get().isBasketLocked
          });
      } catch (e) {
          console.error("Failed to refresh basket", e);
      }
  },

  addItem: async (product, quantity = 1) => {
      const { basket: prevBasket, itemCount: prevCount, subtotal: prevSub, totalValue: prevTotal } = get();
      const fee = get().feePercentage;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return; 

      // Snapshot for rollback
      const previousState = { basket: prevBasket, itemCount: prevCount, subtotal: prevSub, totalValue: prevTotal };

      let newItems: BasketItem[] = [];
      let currentBasket: Basket;

      // Handle empty/new basket state optimistically
      if (prevBasket) {
          currentBasket = prevBasket;
      } else {
          currentBasket = {
              id: 'temp-optimistic',
              userId: user.id,
              month: get().activeCycle?.name || 'Current Cycle',
              status: BasketStatus.OPEN,
              items: [],
              subtotal: 0, serviceFee: 0, discount: 0, totalValue: 0, amountPaid: 0, balance: 0,
              transactions: []
          };
      }

      newItems = [...currentBasket.items];
      const idx = newItems.findIndex(i => i.productId === product.id);
      
      let targetQty = quantity;

      if (idx > -1) {
          const item = { ...newItems[idx] };
          item.quantity += quantity;
          targetQty = item.quantity;
          item.totalPrice = item.quantity * item.unitPrice;
          
          if (item.quantity <= 0) newItems.splice(idx, 1);
          else newItems[idx] = item;
      } else if (quantity > 0) {
          newItems.push({
              productId: product.id,
              quantity,
              unitPrice: product.price,
              totalPrice: product.price * quantity,
              product: product
          });
      }

      // Optimistic update
      const count = newItems.reduce((acc, i) => acc + i.quantity, 0);
      const { localSub, localFee, localTot } = calculateTotals(newItems, currentBasket.discount, fee);
      const newBalance = Math.max(0, localTot - currentBasket.amountPaid);
      
      set({
          basket: { 
              ...currentBasket, 
              items: newItems, 
              subtotal: localSub, 
              serviceFee: localFee, 
              totalValue: localTot,
              balance: newBalance 
          },
          itemCount: count,
          subtotal: localSub, serviceFee: localFee, totalValue: localTot
      });

      try {
          // Send absolute total quantity to the server (UPSERT)
          await API.upsertBasketItem(product.id, targetQty, product.price);
      } catch (e) {
          console.error("Add item failed, reverting state", e);
          set(previousState);
      }
  },

  removeItem: async (productId) => {
      const item = get().basket?.items?.find((i: any) => i.productId === productId);
      if (item) {
          // Setting quantity to 0 triggers deletion in backend logic
          await get().updateItem(productId, -item.quantity);
      }
  },

  updateItem: async (productId, delta) => {
      // Find the product in the current basket to get its details
      const item = get().basket?.items?.find((i: any) => i.productId === productId);
      if (item && item.product) {
          await get().addItem(item.product, delta);
      }
  },

  applyCoupon: async (code) => {
      const discount = await API.applyCoupon(code);
      await get().refreshBasket();
      return discount;
  },

  removeCoupon: async () => {
      await API.removeCoupon();
      await get().refreshBasket();
  },

  updateLocalPayment: (amount) => {
      const b = get().basket;
      if (b) {
          // Optimistic update: Show paid amount immediately
          const newPaid = (b.amountPaid || 0) + amount;
          const newBalance = Math.max(0, b.totalValue - newPaid);
          set({ basket: { ...b, amountPaid: newPaid, balance: newBalance } });
      }
  }
}));
