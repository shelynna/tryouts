
import { supabase } from '../supabaseClient';
import { Basket, BasketStatus } from '../../types';
import { getActiveCycle, getSettings } from './systemService';

const calculateBasketTotals = (items: any[], feePercent: number, discountAmount: number = 0) => {
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
    const serviceFee = subtotal * (feePercent / 100);
    const totalValue = Math.max(0, subtotal + serviceFee - discountAmount);
    return { subtotal, serviceFee, totalValue };
};

export const getBasket = async (): Promise<Basket | undefined> => {
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) throw new Error("Not logged in");

    const activeCycle = await getActiveCycle();
    
    if (!activeCycle) {
        return {
            id: 'virtual-closed',
            userId: user.id,
            month: 'No Active Cycle',
            status: BasketStatus.LOCKED,
            items: [],
            subtotal: 0, serviceFee: 0, discount: 0, totalValue: 0, amountPaid: 0,
            transactions: []
        };
    }

    // Smart Fetch: First try to find the basket associated with the active cycle.
    // FIX: Added .limit(1) to prevent PGRST116 if duplicates exist
    let { data: basket, error } = await supabase
        .from('baskets')
        .select(`*, items:basket_items(*, product:products(*)), payments(*)`)
        .eq('user_id', user.id)
        .eq('cycle_id', activeCycle.id)
        .limit(1)
        .maybeSingle();

    if (error) throw error;

    // Rollover Logic:
    // If the active cycle basket exists but is LOCKED/PAID/etc., check if there is already a "Next Cycle" (Rollover) basket.
    // A Rollover basket is defined as one where cycle_id is NULL (pending next cycle assignment) but status is OPEN.
    if (basket && basket.status !== 'OPEN') {
        const { data: rolloverBasket } = await supabase
            .from('baskets')
            .select(`*, items:basket_items(*, product:products(*)), payments(*)`)
            .eq('user_id', user.id)
            .is('cycle_id', null)
            .eq('status', 'OPEN')
            .limit(1)
            .maybeSingle();
        
        if (rolloverBasket) {
            basket = rolloverBasket;
        }
    }

    if (!basket) {
        // Create initial basket for current active cycle
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
        
        const { data: refreshedBasket, error: refreshError } = await supabase
             .from('baskets')
             .select(`*, items:basket_items(*, product:products(*)), payments(*)`)
             .eq('id', newBasket.id)
             .single();
             
        if (refreshError) throw refreshError;
        basket = refreshedBasket;
    }

    const settings = await getSettings();
    const metadata = basket.metadata || {};
    const couponCode = metadata.coupon_code;
    const discountAmount = metadata.discount_amount || 0;

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

    const { subtotal, serviceFee, totalValue } = calculateBasketTotals(mappedItems, settings.basketServiceFeePercentage, discountAmount);

    // If cycle_id is null, it's a future/rollover basket
    const displayMonth = basket.cycle_id ? activeCycle.name : 'Next Cycle (Rollover)';

    return {
        id: basket.id,
        userId: basket.user_id,
        cycleId: basket.cycle_id,
        month: displayMonth,
        status: basket.status,
        items: mappedItems,
        subtotal: subtotal,
        serviceFee: serviceFee,
        discount: discountAmount,
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
        pickupTimestamp: basket.pickup_timestamp,
        couponCode: couponCode,
        metadata: metadata
    };
};

export const getUserBaskets = async (): Promise<Basket[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");

    const { data: baskets, error } = await supabase
        .from('baskets')
        .select(`
            *, 
            items:basket_items(*, product:products(*)), 
            payments(*),
            cycle:cycles(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const settings = await getSettings();

    return baskets.map((basket: any) => {
        const metadata = basket.metadata || {};
        const mappedItems = (basket.items || []).map((i: any) => ({
            productId: i.product_id,
            quantity: i.quantity,
            unitPrice: i.unit_price,
            totalPrice: i.total_price,
            product: i.product
        }));

        const { subtotal, serviceFee, totalValue } = calculateBasketTotals(mappedItems, settings.basketServiceFeePercentage, metadata.discount_amount || 0);

        return {
            id: basket.id,
            userId: basket.user_id,
            cycleId: basket.cycle_id,
            month: basket.cycle?.name || 'Next Cycle (Rollover)',
            status: basket.status,
            items: mappedItems,
            subtotal,
            serviceFee,
            discount: metadata.discount_amount || 0,
            totalValue,
            amountPaid: basket.amount_paid || 0,
            transactions: (basket.payments || []).map((t: any) => ({
                id: t.id,
                date: t.created_at,
                amount: t.amount,
                type: t.type,
                status: t.status
            })),
            topUpRequested: basket.top_up_requested,
            deliveryCode: basket.delivery_code,
            pickupTimestamp: basket.pickup_timestamp
        };
    });
};

export const addToBasket = async (productId: string, quantity: number) => {
    // 1. Get current context (Basket + Active Cycle)
    let basket = await getBasket();
    if (!basket || basket.id === 'virtual-closed') throw new Error("No active shopping cycle.");
    
    // 2. Rollover Logic:
    // If the current returned basket is LOCKED, it means we didn't find a rollover basket in getBasket,
    // so we need to CREATE one now.
    if (basket.status !== 'OPEN') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User session lost.");

        // Check one last time if a rollover exists to avoid duplicates (race condition fix)
        const { data: existingRollover } = await supabase
             .from('baskets')
             .select('id')
             .eq('user_id', user.id)
             .is('cycle_id', null)
             .eq('status', 'OPEN')
             .limit(1)
             .maybeSingle();

        if (existingRollover) {
             basket = { ...basket, id: existingRollover.id };
        } else {
             // Create "Next Cycle" Basket (cycle_id is null)
             const { data: newRollover, error: createError } = await supabase
                .from('baskets')
                .insert([{ 
                    user_id: user.id, 
                    cycle_id: null, // Null indicates pending/future cycle
                    status: 'OPEN'
                }])
                .select()
                .single();
            
             if (createError) throw createError;
             basket = { ...basket, id: newRollover.id };
        }
    }
    
    const { data: product } = await supabase.from('products').select('*').eq('id', productId).limit(1).single();
    if (!product) throw new Error("Product not found");

    // Check if item exists in this specific basket (re-query items to be safe)
    const { data: existingItems } = await supabase
        .from('basket_items')
        .select('*')
        .eq('basket_id', basket.id)
        .eq('product_id', productId);
    
    const existingItem = existingItems?.[0];
    
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
};

export const applyCoupon = async (code: string) => {
    const basket = await getBasket();
    if (!basket || basket.id === 'virtual-closed') throw new Error("No active basket.");
    
    const cleanCode = code.trim().toUpperCase();

    let discount = 0;
    let isValid = false;

    if (cleanCode === 'WELCOME5') {
        discount = 5.00;
        isValid = true;
    } else if (cleanCode === 'SML10') {
        discount = 10.00;
        isValid = true;
    } else {
        // Check database for coupon validity
        const { data: coupon } = await supabase.from('coupons').select('id').eq('code', cleanCode).eq('is_active', true).maybeSingle();
        if (coupon) {
             discount = 2.00;
             isValid = true;
        } else {
             // Legacy Friend Code Check
             const { data } = await supabase.from('profiles').select('id').eq('referral_code', cleanCode).maybeSingle();
             if (data && data.id !== basket.userId) {
                 discount = 2.00; 
                 isValid = true;
             }
        }
    }

    if (!isValid) throw new Error("Invalid coupon code.");

    const newMetadata = { 
        ...basket.metadata, 
        coupon_code: cleanCode, 
        discount_amount: discount 
    };

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from('baskets')
        .update({ top_up_requested: true })
        .eq('id', basketId)
        .eq('user_id', user.id);
    
    if (error) throw error;
};
