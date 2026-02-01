
import { supabase } from '../supabaseClient';
import { realtimeService } from '../supabase/realtime';
import { cycleService } from './cycleService';
import { Basket, BasketStatus } from '../../types';

// MAPPER: Converts raw DB RPC response to Frontend Basket Interface
const mapVirtualBasket = (data: any): Basket => {
    return {
        id: data.id, 
        userId: '', 
        cycleId: data.cycle_id || data.id, // Fallback if RPC structure varies
        month: data.month,
        status: data.status as BasketStatus,
        items: (data.items || []).map((i: any) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            product: i.product
        })),
        subtotal: data.totalValue,
        serviceFee: 0,
        discount: data.discount,
        deliveryFee: data.delivery_fee || 0, // Mapped
        totalValue: data.totalValue,
        amountPaid: data.amountPaid,
        balance: data.balance,
        transactions: [], 
        deliveryCode: data.deliveryCode,
        pickupTimestamp: undefined,
        couponCode: data.coupon_code, // Mapped
        metadata: { pickupPoint: data.pickupPoint },
        refundRequested: data.refundRequested,
        isRolledOver: data.isRolledOver
    };
};

// 1. GET CURRENT BASKET
// Fetches the basket for the currently active cycle (OPEN/LOCKED but active timeline)
export const getCurrentBasket = async (): Promise<Basket | undefined> => {
    try {
        const cycle = await cycleService.getCurrentCycle();
        if (!cycle) return undefined;

        // Use RPC to get summarized data including product details
        const { data, error } = await supabase.rpc('get_user_cycle_summary', { p_cycle_id: cycle.id });
        if (error) throw error;
        
        return mapVirtualBasket({ ...data, delivery_fee: data.delivery_fee || 0 });
    } catch (e) {
        console.warn("Basket fetch error", e);
        return undefined;
    }
};

// 2. GET OUTSTANDING BASKETS
// Fetches previous baskets that have unpaid balances
export const getOutstandingBaskets = async (): Promise<Basket[]> => {
    try {
        const activeCycle = await cycleService.getCurrentCycle();
        
        let query = supabase
            .from('baskets')
            .select(`
                id, user_id, cycle_id, status, total_price, amount_paid, 
                delivery_code, created_at, refund_requested, is_rolled_over,
                delivery_fee, coupon_code,
                cycles (name)
            `)
            .in('status', ['LOCKED', 'PARTIAL']) 
            .is('is_rolled_over', false) 
            .order('created_at', { ascending: false });

        if (activeCycle) {
            query = query.neq('cycle_id', activeCycle.id);
        }

        const { data, error } = await query;

        if (error) return [];
        
        return data.map((b: any) => ({
            id: b.id,
            userId: b.user_id,
            cycleId: b.cycle_id,
            month: b.cycles?.name || 'Past Cycle',
            items: [],
            subtotal: b.total_price,
            serviceFee: 0,
            discount: 0,
            deliveryFee: b.delivery_fee || 0,
            totalValue: b.total_price,
            amountPaid: b.amount_paid,
            balance: Math.max(0, b.total_price - b.amount_paid),
            status: b.status as BasketStatus,
            transactions: [],
            deliveryCode: b.delivery_code,
            couponCode: b.coupon_code,
            pickupTimestamp: undefined,
            refundRequested: b.refund_requested,
            isRolledOver: b.is_rolled_over
        })).filter(b => b.balance > 0);
    } catch (e) {
        return [];
    }
};

// 3. UPSERT ITEM
// Uses DB function which should enforce cycle access
export const upsertBasketItem = async (productId: string, quantity: number, unitPrice: number) => {
    // We use a new secure RPC or fallback to existing
    // For strict cycle logic, we use 'add_item_to_cycle' which we will update in migration
    const { error } = await supabase.rpc('add_item_to_cycle', {
        p_product_id: productId,
        p_quantity: quantity
    });
    
    if (error) {
        if (error.message.includes('locked') || error.message.includes('access')) {
            throw new Error("This cycle is currently locked for new items.");
        }
        throw error;
    }
};

// 4. GET OR CREATE USER BASKET (Used by useCycle hook)
export const getOrCreateUserBasket = async (userId: string): Promise<Basket | null> => {
    const currentCycle = await cycleService.getCurrentCycle();
    if (!currentCycle) return null;
    
    const { data: existingBasket } = await supabase
      .from('baskets')
      .select(`
        id, user_id, cycle_id, status, 
        total_amount:total_price, 
        paid_amount:amount_paid,
        delivery_fee, coupon_code,
        locked_at, created_at, updated_at
      `)
      .eq('user_id', userId)
      .eq('cycle_id', currentCycle.id)
      .maybeSingle();
    
    if (existingBasket) {
        // Map DB fields to Frontend fields
        return {
            ...existingBasket,
            totalValue: existingBasket.total_amount,
            amountPaid: existingBasket.paid_amount,
            deliveryFee: existingBasket.delivery_fee,
            couponCode: existingBasket.coupon_code,
            items: [] // Initialize empty if not fetching items
        } as unknown as Basket;
    }
    
    const access = await cycleService.checkCycleAccess(userId, currentCycle.id);
    if (!access.canAccess) return null;
    
    // FETCH PROFILE TO CHECK SUBSCRIPTION STATUS
    const { data: profile } = await supabase.from('profiles').select('is_subscriber').eq('id', userId).single();
    const isSubscriber = profile?.is_subscriber || false;
    const deliveryFee = isSubscriber ? 0 : 9.50; // 9.5 GHS for standard users

    // Create new basket
    const { data: newBasket, error } = await supabase
      .from('baskets')
      .insert({
        user_id: userId,
        cycle_id: currentCycle.id,
        status: 'OPEN',
        total_price: deliveryFee, // Initial total is just delivery fee
        amount_paid: 0,
        delivery_fee: deliveryFee
      })
      .select(`
        id, user_id, cycle_id, status, 
        total_amount:total_price, 
        paid_amount:amount_paid,
        delivery_fee, coupon_code,
        locked_at, created_at, updated_at
      `)
      .single();
    
    if (error) console.error(error);
    if (!newBasket) return null;

    return {
        ...newBasket,
        totalValue: newBasket.total_amount,
        amountPaid: newBasket.paid_amount,
        deliveryFee: newBasket.delivery_fee,
        couponCode: newBasket.coupon_code,
        items: []
    } as unknown as Basket;
};

// 5. UPDATE PAID AMOUNT
export const updatePaidAmount = async (basketId: string, amount: number): Promise<Basket | null> => {
    const { data: b } = await supabase.from('baskets').select('amount_paid, total_price').eq('id', basketId).single();
    if(!b) return null;

    const newPaid = (b.amount_paid || 0) + amount;
    const { data, error } = await supabase
      .from('baskets')
      .update({ 
        amount_paid: newPaid,
        updated_at: new Date().toISOString(),
        status: newPaid >= (b.total_price - 0.01) ? 'PAID' : 'OPEN'
      })
      .eq('id', basketId)
      .select(`
        id, user_id, cycle_id, status, 
        total_amount:total_price, 
        paid_amount:amount_paid,
        delivery_fee, coupon_code
      `)
      .single();
    
    if (error || !data) return null;

    return {
        ...data,
        totalValue: data.total_amount,
        amountPaid: data.paid_amount,
        deliveryFee: data.delivery_fee,
        couponCode: data.coupon_code
    } as unknown as Basket;
};

// 6. MISC ACTIONS
export const requestRollover = async (basketId: string): Promise<boolean> => {
    const { error } = await supabase.from('baskets').update({ status: 'CANCELLED', is_rolled_over: true }).eq('id', basketId);
    return !error;
};

export const requestRefund = async (basketId: string): Promise<boolean> => {
    const { error } = await supabase.from('baskets').update({ refund_requested: true }).eq('id', basketId);
    return !error;
};

export const requestTopUp = async (basketId: string): Promise<void> => {
    const { error } = await supabase
        .from('baskets')
        .update({ top_up_requested: true })
        .eq('id', basketId);
    if (error) throw error;
};

export const getUserBaskets = async (): Promise<Basket[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('baskets')
        .select(`
            *,
            items:basket_items (
                quantity, unit_price,
                product:products (*)
            ),
            cycles (name),
            payments (
                id, reference, amount, status, created_at, payment_method, paystack_data
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((b: any) => ({
        id: b.id,
        userId: b.user_id,
        cycleId: b.cycle_id,
        month: b.cycles?.name || 'Cycle',
        items: (b.items || []).map((i: any) => ({
            productId: i.product_id,
            quantity: i.quantity,
            unitPrice: i.unit_price,
            totalPrice: i.quantity * i.unit_price,
            product: i.product ? {
                id: i.product.id,
                name: i.product.name,
                price: i.product.price,
                size: i.product.size,
                image: i.product.image,
                category: i.product.category,
                isActive: i.product.is_active,
                stockStatus: i.product.stock_status,
                stockQuantity: i.product.stock_quantity
            } : undefined
        })),
        subtotal: b.total_price,
        serviceFee: 0,
        discount: 0,
        deliveryFee: b.delivery_fee,
        couponCode: b.coupon_code,
        totalValue: b.total_price,
        amountPaid: b.amount_paid,
        balance: Math.max(0, b.total_price - b.amount_paid),
        status: b.status,
        transactions: (b.payments || []).map((p: any) => ({
            id: p.reference || p.id,
            date: p.created_at,
            amount: p.amount,
            type: 'PAYMENT',
            status: p.status === 'success' ? 'SUCCESS' : (p.status === 'pending' ? 'PENDING' : 'FAILED'),
            metadata: p.paystack_data
        })), 
        deliveryCode: b.delivery_code,
        pickupTimestamp: b.updated_at,
        isRolledOver: b.is_rolled_over,
        refundRequested: b.refund_requested
    }));
};

export const applyCoupon = async (code: string) => 0; 
export const removeCoupon = async () => {};

export const subscribeToBasketUpdates = (basketId: string, callback: (basket: Basket) => void) => {
    const mapper = (payload: any) => {
        const mapped = {
            ...payload,
            totalValue: payload.total_price,
            amountPaid: payload.amount_paid,
            deliveryFee: payload.delivery_fee,
            couponCode: payload.coupon_code
        };
        callback(mapped as Basket);
    };
    return realtimeService.subscribeToBasket(basketId, mapper);
};
