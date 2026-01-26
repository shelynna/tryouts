
import { supabase } from './supabase';
import { User, Product, Basket, SystemSettings, ProcurementItem, PickupListEntry, TopUpRequest, Cycle, BasketStatus, AdminBasketEntry } from '../types';

// --- Local Helpers ---
const calculateBasketTotals = (items: any[], feePercent: number) => {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const serviceFee = subtotal * (feePercent / 100);
    return { subtotal, serviceFee, totalValue: subtotal + serviceFee };
};

export const API = {
  // --- AUTH & USER ---
  getMe: async (userId?: string): Promise<User | undefined> => {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error("No user logged in");

    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
    
    if (error) return undefined;
    
    return {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        phoneNumber: data.phone,
        pickupPoint: data.pickup_point,
        role: data.role,
        isSubscriber: data.is_subscriber,
        isEmailVerified: true, 
        creditBalance: data.credit_balance,
        isBlocked: data.is_blocked,
        referralCode: data.referral_code,
        referredBy: data.referred_by
    } as User;
  },

  updateProfile: async (data: Partial<User>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase.from('profiles').update({
        full_name: data.fullName,
        phone: data.phoneNumber,
        pickup_point: data.pickupPoint
    }).eq('id', user.id);

    if(error) throw error;
    return API.getMe();
  },

  // --- CYCLES ---
  getActiveCycle: async (): Promise<Cycle | null> => {
      const { data } = await supabase.from('cycles').select('*').eq('is_active', true).single();
      if (!data) return null;
      return {
          id: data.id,
          name: data.name,
          startDate: data.start_date,
          endDate: data.end_date,
          deliveryDate: data.delivery_date,
          isActive: data.is_active
      };
  },

  // --- PRODUCTS ---
  getProducts: async (params?: { isAdmin?: boolean, search?: string, category?: string }) => {
    let query = supabase.from('products').select('*');
    
    if (!params?.isAdmin) {
        query = query.eq('is_active', true);
    }
    if (params?.category && params.category !== 'All') {
        query = query.eq('category', params.category);
    }
    if (params?.search) {
        query = query.ilike('name', `%${params.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        size: p.size,
        price: p.price,
        description: p.description,
        image: p.images && p.images.length > 0 ? p.images[0] : p.image,
        images: p.images, 
        isActive: p.is_active,
        stockStatus: p.stock_status || (p.stock_quantity > 0 ? 'IN_STOCK' : 'SOLD_OUT'),
        stockQuantity: p.stock_quantity
    }));
  },

  saveProduct: async (p: Partial<Product>) => {
    const imagesArr = p.images || (p.image ? [p.image] : []);

    const payload = {
        name: p.name,
        category: p.category,
        size: p.size,
        price: p.price,
        description: p.description,
        images: imagesArr,
        is_active: p.isActive,
        stock_status: p.stockStatus,
        stock_quantity: p.stockQuantity ?? 100
    };

    if (p.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', p.id);
        if(error) throw error;
    } else {
        const { error } = await supabase.from('products').insert([payload]);
        if(error) throw error;
    }
  },

  // --- BASKET ---
  getBasket: async (): Promise<Basket> => {
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) throw new Error("Not logged in");

    const activeCycle = await API.getActiveCycle();
    if (!activeCycle) throw new Error("No active shopping cycle found.");

    let { data: basket, error } = await supabase
        .from('baskets')
        .select(`*, items:basket_items(*, product:products(*)), payments(*)`)
        .eq('user_id', user.id)
        .eq('cycle_id', activeCycle.id)
        .single();

    if (!basket && !error) {
        const { data: newBasket, error: createError } = await supabase
            .from('baskets')
            .insert([{ 
                user_id: user.id, 
                cycle_id: activeCycle.id,
                status: 'OPEN'
            }])
            .select()
            .single();
        
        if(createError) throw createError;
        
        const { data: refreshedBasket } = await supabase
             .from('baskets')
             .select(`*, items:basket_items(*, product:products(*)), payments(*)`)
             .eq('id', newBasket.id)
             .single();
             
        basket = refreshedBasket || { ...newBasket, items: [], payments: [] };
    }

    const settings = await API.getSettings();
    
    const mappedItems = (basket.items || []).map((i: any) => ({
        productId: i.product_id,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        totalPrice: i.total_price,
        product: {
            id: i.product.id,
            name: i.product.name,
            size: i.product.size,
            image: i.product.images?.[0] || null,
            category: i.product.category,
            price: i.product.price,
            description: i.product.description,
            isActive: i.product.is_active,
            stockStatus: i.product.stock_status
        }
    }));

    const { subtotal, serviceFee, totalValue } = calculateBasketTotals(mappedItems, settings.basketServiceFeePercentage);

    return {
        id: basket.id,
        userId: basket.user_id,
        cycleId: basket.cycle_id,
        month: activeCycle.name,
        status: basket.status,
        items: mappedItems,
        subtotal: subtotal,
        serviceFee: serviceFee,
        totalValue: totalValue,
        amountPaid: basket.amount_paid || 0,
        transactions: (basket.payments || []).map((t: any) => ({ 
            id: t.id, 
            date: t.created_at, 
            amount: t.amount, 
            type: t.type,
            status: t.status
        })),
        topUpRequested: basket.top_up_requested,
        topUpAmount: basket.top_up_amount,
        topUpApproved: basket.top_up_approved,
        deliveryCode: basket.delivery_code,
        pickupTimestamp: basket.pickup_timestamp
    };
  },

  addToBasket: async (productId: string, quantity: number) => {
    const basket = await API.getBasket();
    if (basket.status !== 'OPEN') throw new Error("Basket is locked. Cannot add items.");
    
    const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
    if (!product) throw new Error("Product not found");

    const existingItem = basket.items.find(i => i.productId === productId);
    
    if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        if (newQty <= 0) {
            await supabase.from('basket_items').delete().eq('basket_id', basket.id).eq('product_id', productId);
        } else {
            await supabase.from('basket_items').update({ quantity: newQty }).eq('basket_id', basket.id).eq('product_id', productId);
        }
    } else if (quantity > 0) {
        await supabase.from('basket_items').insert({
            basket_id: basket.id,
            product_id: productId,
            quantity: quantity,
            unit_price: product.price
        });
    }
  },

  // --- SECURE PAYMENTS ---
  verifyPayment: async (reference: string, basketId: string, amount: number) => {
    // We now call a Secure Database Function (RPC) instead of inserting directly.
    const { data, error } = await supabase.rpc('process_payment', {
        p_reference: reference,
        p_basket_id: basketId === 'subscription_upgrade' ? null : basketId,
        p_amount: amount,
        p_type: basketId === 'subscription_upgrade' ? 'SUBSCRIPTION' : 'PAYMENT'
    });

    if (error) throw error;
    return { status: true, data };
  },

  // --- STAFF DELIVERY FUNCTIONS ---
  // Staff function to fetch basket by code
  getBasketByDeliveryCode: async (code: string): Promise<PickupListEntry | null> => {
     // Join Basket -> Profile -> Items -> Product
     const { data: basket, error } = await supabase
        .from('baskets')
        .select(`
            id, status, delivery_code, pickup_timestamp,
            user_id,
            profiles:user_id (full_name, phone, pickup_point),
            items:basket_items (quantity, product:products (name, size))
        `)
        .eq('delivery_code', code)
        .single();
    
    if (error || !basket) return null;
    
    // Map to PickupListEntry for UI
    return {
        basketId: basket.id,
        userId: basket.user_id,
        userName: basket.profiles.full_name,
        userPhone: basket.profiles.phone,
        userPickupPoint: basket.profiles.pickup_point,
        status: basket.status,
        deliveryCode: basket.delivery_code,
        pickupTimestamp: basket.pickup_timestamp,
        items: basket.items.map((i: any) => ({
            name: i.product.name,
            size: i.product.size,
            quantity: i.quantity
        }))
    };
  },

  // Staff function to mark as collected
  redeemBasket: async (basketId: string) => {
      // Check permission (RLS handles this but extra check good)
      const { error } = await supabase
          .from('baskets')
          .update({ 
              status: 'COLLECTED',
              pickup_timestamp: new Date().toISOString()
          })
          .eq('id', basketId);
      
      if (error) throw error;
  },

  // --- ADMIN & SYSTEM ---
  getSettings: async (): Promise<SystemSettings> => {
    const { data: config } = await supabase.from('app_settings').select('value').eq('key', 'GLOBAL_CONFIG').single();
    const activeCycle = await API.getActiveCycle();

    const defaults = {
        basketServiceFeePercentage: 5,
        topUpServiceFeePercentage: 5,
        heroImages: []
    };

    const combined = { ...defaults, ...(config?.value || {}) };

    return {
        ...combined,
        cycleName: activeCycle?.name || "No Active Cycle",
        basketOpenDate: activeCycle?.startDate || new Date().toISOString(),
        basketLockDate: activeCycle?.endDate || new Date().toISOString(),
        deliveryDate: activeCycle?.deliveryDate || new Date().toISOString(),
        isActive: !!activeCycle
    };
  },
  
  saveSettings: async (s: SystemSettings) => {
    const configValue = {
        basketServiceFeePercentage: s.basketServiceFeePercentage,
        topUpServiceFeePercentage: s.topUpServiceFeePercentage,
        heroImages: s.heroImages,
        legalContent: s.legalContent
    };
    await supabase.from('app_settings').upsert({ key: 'GLOBAL_CONFIG', value: configValue });

    const activeCycle = await API.getActiveCycle();
    if (activeCycle) {
        await supabase.from('cycles').update({
            start_date: s.basketOpenDate,
            end_date: s.basketLockDate,
            delivery_date: s.deliveryDate
        }).eq('id', activeCycle.id);
    }
  },

  getAdminStats: async () => {
    // Basic aggregation
    // In real app, create a view for performance
    const { data: baskets } = await supabase.from('baskets').select('total_price, amount_paid, status');
    
    if (!baskets) return { projectedRevenue: 0, collectedRevenue: 0, completionRate: 0 };

    const projected = baskets.reduce((acc, b) => acc + (b.total_price || 0), 0);
    const collected = baskets.reduce((acc, b) => acc + (b.amount_paid || 0), 0);
    const completed = baskets.filter(b => b.status === 'PAID' || b.status === 'COLLECTED').length;
    const rate = baskets.length > 0 ? (completed / baskets.length) * 100 : 0;

    return { projectedRevenue: projected, collectedRevenue: collected, completionRate: rate };
  },
  
  getUsers: async () => {
      // Join to self to count referrals is complex in client-side, better as view.
      // For now, we fetch profiles.
      const { data } = await supabase.from('profiles').select('*');
      
      // Calculate referrals locally for now (small scale)
      const referralCounts: Record<string, number> = {};
      data?.forEach(u => {
          if (u.referred_by) {
              referralCounts[u.referred_by] = (referralCounts[u.referred_by] || 0) + 1;
          }
      });

      return data?.map((u: any) => ({
          ...u,
          fullName: u.full_name,
          phoneNumber: u.phone,
          pickupPoint: u.pickup_point,
          isBlocked: u.is_blocked,
          referralCode: u.referral_code,
          referredBy: u.referred_by,
          referralCount: referralCounts[u.referral_code] || 0 // Inject count
      })) || [];
  },

  // ADMIN: Get All Active Baskets with Progress
  getAllBaskets: async (): Promise<AdminBasketEntry[]> => {
      const { data } = await supabase
        .from('baskets')
        .select(`
            id, status, total_price, amount_paid, user_id,
            profiles (full_name),
            items:basket_items (id)
        `)
        .order('amount_paid', { ascending: false });

      return (data || []).map((b: any) => ({
          basketId: b.id,
          userId: b.user_id,
          userName: b.profiles?.full_name || 'Unknown',
          status: b.status,
          totalValue: b.total_price || 0,
          amountPaid: b.amount_paid || 0,
          itemCount: b.items?.length || 0
      }));
  },
  
  toggleUserBlock: async (id: string) => {
      const { data } = await supabase.from('profiles').select('is_blocked').eq('id', id).single();
      if (data) {
          await supabase.from('profiles').update({ is_blocked: !data.is_blocked }).eq('id', id);
      }
  },

  checkHealth: async () => {
      const { error } = await supabase.from('app_settings').select('key').limit(1);
      return !error;
  },

  getProcurementList: async () => [] as ProcurementItem[],
  
  getPickupList: async (filter?: string) => {
      let query = supabase.from('baskets')
        .select(`
            id, status, delivery_code, pickup_timestamp,
            user_id,
            profiles:user_id (full_name, phone, pickup_point),
            items:basket_items (quantity, product:products (name, size))
        `)
        .neq('status', 'OPEN'); // Only show locked/paid baskets

      if (filter) {
          // In real app, perform join filter or exact match
      }
      
      const { data } = await query;
      return (data || []).map((b: any) => ({
          basketId: b.id,
          userId: b.user_id,
          userName: b.profiles?.full_name || 'Unknown',
          userPhone: b.profiles?.phone || '',
          userPickupPoint: b.profiles?.pickup_point || '',
          status: b.status,
          deliveryCode: b.delivery_code,
          pickupTimestamp: b.pickup_timestamp,
          items: b.items.map((i: any) => ({
              name: i.product?.name,
              size: i.product?.size,
              quantity: i.quantity
          }))
      }));
  },
  
  getTopUpRequests: async () => [] as TopUpRequest[],
  
  reportError: (err: any) => console.error("Reported:", err),
  forgotPassword: async (email: string) => supabase.auth.resetPasswordForEmail(email),
  resetPassword: async (token: string, pass: string) => supabase.auth.updateUser({ password: pass }),
  verifyEmail: async (token: string) => ({ success: true }) 
};
