
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
      } catch (e) {
          console.warn("Basket store init failed", e);
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
          
          if (b?.id === 'virtual-closed') {
              set({ basket: b, itemCount: 0, subtotal: 0, isBasketLocked: true });
              return;
          }

          const items = b?.items || [];
          const count = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
          const currentDiscount = b?.discount || 0;
          
          // Use backend calculation if available, else local
          const backendTotal = b?.totalValue;
          const { localSub, localFee, localTot } = calculateTotals(items, currentDiscount, get().feePercentage);

          set({
              basket: b,
              itemCount: count,
              subtotal: b?.subtotal !== undefined ? b.subtotal : localSub,
              serviceFee: b?.serviceFee !== undefined ? b.serviceFee : localFee,
              discount: currentDiscount,
              totalValue: backendTotal !== undefined ? backendTotal : localTot,
              // Update locked state based on basket status too
              isBasketLocked: b?.status !== 'OPEN' ? true : get().isBasketLocked
          });
      } catch (e) {
          // Silent fail or toast in UI component
      }
  },

  addItem: async (product, quantity = 1) => {
      const prevBasket = get().basket;
      const fee = get().feePercentage;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return; // Guard clause

      // Optimistic Update Construction
      let newItems: BasketItem[] = [];
      let currentBasket = prevBasket;

      // If no basket exists yet, create a virtual one for UI
      if (!currentBasket) {
          currentBasket = {
              id: 'temp-optimistic',
              userId: user.id,
              month: get().activeCycle?.name || 'Current Cycle',
              status: BasketStatus.OPEN,
              items: [],
              subtotal: 0, serviceFee: 0, discount: 0, totalValue: 0, amountPaid: 0, transactions: []
          };
      }

      newItems = [...currentBasket.items];
      const idx = newItems.findIndex(i => i.productId === product.id);
      
      if (idx > -1) {
          // Update existing item
          const item = { ...newItems[idx] };
          item.quantity += quantity;
          item.totalPrice = item.quantity * item.unitPrice; // Recalc total price for item
          if (item.quantity <= 0) newItems.splice(idx, 1);
          else newItems[idx] = item;
      } else if (quantity > 0) {
          // Add new item
          newItems.push({
              productId: product.id,
              quantity,
              unitPrice: product.price,
              totalPrice: product.price * quantity,
              product: product // IMPORTANT: Ensure product object is attached for UI rendering
          });
      }

      const count = newItems.reduce((acc, i) => acc + i.quantity, 0);
      const { localSub, localFee, localTot } = calculateTotals(newItems, currentBasket.discount, fee);
      
      // Apply Optimistic State
      set({
          basket: { ...currentBasket, items: newItems, subtotal: localSub, serviceFee: localFee, totalValue: localTot },
          itemCount: count,
          subtotal: localSub, serviceFee: localFee, totalValue: localTot
      });

      try {
          await API.addToBasket(product.id, quantity);
          // Only refresh if the basket ID was temporary or we need strict sync
          if (currentBasket.id === 'temp-optimistic') {
              await get().refreshBasket();
          }
      } catch (e) {
          // Revert on failure by refreshing from server (truth)
          await get().refreshBasket(); 
          throw e;
      }
  },

  removeItem: async (productId) => {
      const item = get().basket?.items?.find((i: any) => i.productId === productId);
      if (item && item.product) {
          // Pass negative quantity equal to current quantity to remove
          await get().addItem(item.product!, -item.quantity);
      }
  },

  updateItem: async (productId, quantity) => {
      const item = get().basket?.items?.find((i: any) => i.productId === productId);
      if (item && item.product) {
          await get().addItem(item.product!, quantity);
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
          set({ basket: { ...b, amountPaid: (b.amountPaid || 0) + amount } });
      }
  }
}));
