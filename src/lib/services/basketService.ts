
import { supabase } from '../supabaseClient';
import { Basket, BasketStatus } from '../../types';
import { getActiveCycle, getSettings } from './systemService';
import { withTimeout } from '../utils';

// Global cache for the session to prevent race conditions during rapid refresh
let cachedBasketId: string | null = null;
let cachedUserId: string | null = null;

// Helper: Get or Create Valid Open Basket ID using atomic RPC and Caching
const _getOrCreateOpenBasketId = async (userId: string): Promise<string> => {
    // Return cached ID if user hasn't changed
    if (cachedBasketId && cachedUserId === userId) {
        return cachedBasketId;
    }

    cachedUserId = userId;
    const activeCycle = await getActiveCycle();
    
    // 1. Try to get Active Cycle Basket (Consolidated)
    if (activeCycle) {
        const { data: resolvedId } = await supabase.rpc('resolve_basket_conflict', {
            p_user_id: userId,
            p_cycle_id: activeCycle.id
        });
        if (resolvedId) {
            cachedBasketId = resolvedId;
            return resolvedId;
        }
    }

    // 2. Check for Rollover Basket (Consolidated)
    const { data: rolloverId } = await supabase.rpc('resolve_basket_conflict', {
        p_user_id: userId,
        p_cycle_id: null
    });
    if (rolloverId) {
        cachedBasketId = rolloverId;
        return rolloverId;
    }

    // 3. Create New Basket (Fallback)
    const { data: newBasket, error } = await supabase.from('baskets')
        .insert({ 
            user_id: userId, 
            cycle_id: activeCycle?.id || null, 
            status: 'OPEN' 
        })
        .select('id')
        .single();

    if (error) throw error;
    cachedBasketId = newBasket.id;
    return newBasket.id;
};

export const getBasket = async (): Promise<Basket | undefined> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) throw new Error("Not logged in");

        // Clear cache if user changed
        if (cachedUserId !== user.id) {
            cachedBasketId = null;
            cachedUserId = user.id;
        }

        // Fetch cycle
        const activeCycle = await getActiveCycle();
        let basketIdToFetch: string | null = null;

        // --- PHASE 1: IDENTIFY BASKET ID ---
        
        if (activeCycle) {
            // Attempt to resolve existing OPEN or PARTIAL basket for active cycle
            const { data: activeId } = await supabase.rpc('resolve_basket_conflict', {
                p_user_id: user.id,
                p_cycle_id: activeCycle.id
            });
            
            if (activeId) {
                basketIdToFetch = activeId;
            } else {
                // No active basket, check if we have a rollover (null cycle)
                const { data: rolloverId } = await supabase.rpc('resolve_basket_conflict', {
                    p_user_id: user.id,
                    p_cycle_id: null
                });
                
                if (rolloverId) {
                    basketIdToFetch = rolloverId;
                } else {
                    // Try to fetch a recent locked/paid basket to show status
                    const { data: recentBasket } = await supabase
                        .from('baskets')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('cycle_id', activeCycle.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    
                    if (recentBasket) basketIdToFetch = recentBasket.id;
                }
            }
        } else {
            // No active cycle, just check rollover
            const { data: rolloverId } = await supabase.rpc('resolve_basket_conflict', {
                p_user_id: user.id,
                p_cycle_id: null
            });
            basketIdToFetch = rolloverId;
        }

        if (basketIdToFetch) cachedBasketId = basketIdToFetch;

        // --- PHASE 2: FETCH OR CREATE ---

        let basket;

        if (basketIdToFetch) {
            const { data } = await supabase
                .from('baskets')
                .select(`*, items:basket_items(*, product:products(*)), payments(*)`)
                .eq('id', basketIdToFetch)
                .single();
            basket = data;
        }

        // If absolute fallback needed (create new)
        if (!basket && activeCycle) {
             // Only create if we are sure no other valid basket exists
             // (Wait, logic above already checked conflicts via RPC, safe to create)
             const { data: newBasket, error: createError } = await supabase
                .from('baskets')
                .insert([{ user_id: user.id, cycle_id: activeCycle.id, status: 'OPEN' }])
                .select(`*, items:basket_items(*, product:products(*)), payments(*)`)
                .single();
            
            if(createError) throw createError;
            basket = newBasket;
            cachedBasketId = newBasket.id;
        } else if (!basket && !activeCycle) {
             return {
                id: 'virtual-closed',
                userId: user.id,
                month: 'No Active Cycle',
                status: BasketStatus.LOCKED,
                items: [],
                subtotal: 0, serviceFee: 0, discount: 0, totalValue: 0, amountPaid: 0, balance: 0,
                transactions: []
            };
        }

        const metadata = basket.metadata || {};
        const discountAmount = metadata.discount_amount || 0;

        const mappedItems = (basket.items || []).map((i: any) => ({
            productId: i.product_id,
            quantity: i.quantity,
            unitPrice: i.unit_price,
            totalPrice: i.total_price,
            product: i.product ? {
                id: i.product.id,
                name: i.product.name,
                size: i.product.size,
                image: i.product.images?.[0] || i.product.image,
                category: i.product.category,
                price: i.product.price,
                isActive: i.product.is_active,
                stockStatus: i.product.stock_status
            } : null
        })).filter((i: any) => i.product);

        // Determine display month label
        let displayMonth = activeCycle?.name || "Market";
        if (activeCycle && basket.cycle_id !== activeCycle.id) {
             if (!basket.cycle_id) displayMonth = "Next Cycle (Rollover)";
             else displayMonth = "Previous Cycle";
        } else if (!activeCycle && !basket.cycle_id) {
             displayMonth = "Next Cycle (Rollover)";
        }

        return {
            id: basket.id,
            userId: basket.user_id,
            cycleId: basket.cycle_id,
            month: displayMonth,
            status: basket.status,
            items: mappedItems,
            
            // USE DB TRUTH - NO FRONTEND CALCULATION
            subtotal: basket.subtotal || 0,
            serviceFee: basket.service_fee || 0,
            discount: discountAmount,
            totalValue: basket.total_price || 0,
            amountPaid: basket.amount_paid || 0,
            balance: basket.balance || Math.max(0, (basket.total_price || 0) - (basket.amount_paid || 0)),

            transactions: (basket.payments || []).map((t: any) => ({ 
                id: t.id, date: t.created_at, amount: t.amount, type: t.type, status: t.status, metadata: t.metadata
            })),
            topUpRequested: basket.top_up_requested,
            topUpAmount: basket.top_up_amount,
            topUpApproved: basket.top_up_approved,
            topUpStatus: basket.top_up_status || (basket.top_up_requested ? 'PENDING' : 'NONE'),
            topUpDenialReason: basket.top_up_denial_reason,
            deliveryCode: basket.delivery_code,
            pickupTimestamp: basket.pickup_timestamp,
            couponCode: metadata.coupon_code,
            metadata
        };
    } catch (e: any) {
        if (e.name !== 'AbortError' && !e.message?.includes('aborted')) {
            console.warn("getBasket failed:", e.message);
        }
        return undefined;
    }
};

export const getUserBaskets = async (): Promise<Basket[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");

    const { data, error } = await supabase
        .from('baskets')
        .select(`*, items:basket_items(*, product:products(*)), payments(*), cycle:cycles(name)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((basket: any) => {
        const metadata = basket.metadata || {};
        const mappedItems = (basket.items || []).map((i: any) => ({
            productId: i.product_id, quantity: i.quantity, unitPrice: i.unit_price, totalPrice: i.total_price, product: i.product
        }));
        
        return {
            id: basket.id, userId: basket.user_id, cycleId: basket.cycle_id,
            month: basket.cycle?.name || 'Next Cycle (Rollover)',
            status: basket.status, items: mappedItems, 
            // Use DB fields directly
            subtotal: basket.subtotal, 
            serviceFee: basket.service_fee, 
            discount: metadata.discount_amount || 0, 
            totalValue: basket.total_price, 
            amountPaid: basket.amount_paid || 0,
            balance: basket.balance || 0,
            transactions: (basket.payments || []).map((t: any) => ({
                id: t.id, date: t.created_at, amount: t.amount, type: t.type, status: t.status, metadata: t.metadata
            })),
            topUpRequested: basket.top_up_requested, 
            deliveryCode: basket.delivery_code, 
            pickupTimestamp: basket.pickup_timestamp,
            topUpStatus: basket.top_up_status || 'NONE',
            topUpDenialReason: basket.top_up_denial_reason
        };
    });
};

export const upsertBasketItem = async (productId: string, quantity: number, unitPrice: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Login required");

    // Get the ID of the basket we should be editing
    const basketId = await _getOrCreateOpenBasketId(user.id);

    // CRITICAL: Prevent edits to locked/paid/collected baskets
    const { data: basket } = await supabase.from('baskets').select('status').eq('id', basketId).single();
    if (basket && ['PAID', 'LOCKED', 'COLLECTED', 'DELIVERED'].includes(basket.status)) {
         throw new Error(`Cannot modify a ${basket.status} basket.`);
    }

    if (quantity <= 0) {
        await supabase.from('basket_items').delete()
            .eq('basket_id', basketId)
            .eq('product_id', productId);
        return;
    }

    const { error } = await supabase.from('basket_items').upsert({
        basket_id: basketId,
        product_id: productId,
        quantity: quantity,
        unit_price: unitPrice
    }, { onConflict: 'basket_id, product_id' });

    if (error) {
        console.error("Upsert failed:", error);
        throw error;
    }
};

export const applyCoupon = async (code: string) => {
    const basket = await getBasket();
    if (!basket || basket.id === 'virtual-closed') throw new Error("No active basket.");
    const cleanCode = code.trim().toUpperCase();
    let discount = 0;
    let isValid = false;

    if (cleanCode === 'WELCOME5') { discount = 5.00; isValid = true; }
    else if (cleanCode === 'SML10') { discount = 10.00; isValid = true; }
    else {
        const { data: coupon } = await supabase.from('coupons').select('id').eq('code', cleanCode).eq('is_active', true).maybeSingle();
        if (coupon) { discount = 2.00; isValid = true; }
    }

    if (!isValid) throw new Error("Invalid coupon code.");
    const newMetadata = { ...basket.metadata, coupon_code: cleanCode, discount_amount: discount };
    // This update will trigger the DB trigger to recalculate totals, correctly applying the discount
    await supabase.from('baskets').update({ metadata: newMetadata }).eq('id', basket.id);
    return discount;
};

export const removeCoupon = async () => {
     const basket = await getBasket();
     if (!basket || basket.id === 'virtual-closed') return;
     const newMetadata = { ...basket.metadata };
     delete newMetadata.coupon_code;
     delete newMetadata.discount_amount;
     await supabase.from('baskets').update({ metadata: newMetadata }).eq('id', basket.id);
};

export const requestTopUp = async (basketId: string) => {
    const { error } = await supabase.from('baskets').update({ 
        top_up_requested: true,
        top_up_status: 'PENDING',
        top_up_denial_reason: null
    }).eq('id', basketId);
    if (error) throw error;
};
