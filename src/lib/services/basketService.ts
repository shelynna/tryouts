
import { supabase } from '../supabaseClient';
import { Basket, BasketStatus } from '../../types';
import { getActiveCycle, getSettings } from './systemService';
import { withTimeout } from '../utils';

const calculateBasketTotals = (items: any[], feePercent: number, discountAmount: number = 0) => {
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
    const serviceFee = subtotal * (feePercent / 100);
    const totalValue = Math.max(0, subtotal + serviceFee - discountAmount);
    return { subtotal, serviceFee, totalValue };
};

export const getBasket = async (): Promise<Basket | undefined> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) throw new Error("Not logged in");

        // Fetch cycle and settings in parallel with a timeout
        const [activeCycle, settings] = await withTimeout(
            Promise.all([getActiveCycle(), getSettings()]),
            10000,
            "System Config Fetch"
        ) as [any, any];
        
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

        const basketQuery = supabase
            .from('baskets')
            .select(`*, items:basket_items(*, product:products(*)), payments(*)`)
            .eq('user_id', user.id)
            .eq('cycle_id', activeCycle.id)
            .limit(1)
            .maybeSingle();

        let { data: basket } = await withTimeout(basketQuery, 10000, "Basket DB Fetch") as any;

        if (basket && basket.status !== 'OPEN') {
            const rolloverQuery = supabase
                .from('baskets')
                .select(`*, items:basket_items(*, product:products(*)), payments(*)`)
                .eq('user_id', user.id)
                .is('cycle_id', null)
                .eq('status', 'OPEN')
                .limit(1)
                .maybeSingle();
            
            const { data: rolloverBasket } = await withTimeout(rolloverQuery, 8000, "Rollover Basket Fetch") as any;
            if (rolloverBasket) basket = rolloverBasket;
        }

        if (!basket) {
            const { data: newBasket, error: createError } = await supabase
                .from('baskets')
                .insert([{ user_id: user.id, cycle_id: activeCycle.id, status: 'OPEN' }])
                .select(`*, items:basket_items(*, product:products(*)), payments(*)`)
                .single();
            
            if(createError) throw createError;
            basket = newBasket;
        }

        const metadata = basket.metadata || {};
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
                isActive: i.product.is_active,
                stockStatus: i.product.stock_status
            }
        }));

        const { subtotal, serviceFee, totalValue } = calculateBasketTotals(mappedItems, settings.basketServiceFeePercentage, discountAmount);

        return {
            id: basket.id,
            userId: basket.user_id,
            cycleId: basket.cycle_id,
            month: basket.cycle_id ? activeCycle.name : 'Next Cycle (Rollover)',
            status: basket.status,
            items: mappedItems,
            subtotal, serviceFee, discount: discountAmount, totalValue,
            amountPaid: basket.amount_paid || 0,
            transactions: (basket.payments || []).map((t: any) => ({ 
                id: t.id, date: t.created_at, amount: t.amount, type: t.type, status: t.status
            })),
            topUpRequested: basket.top_up_requested,
            topUpAmount: basket.top_up_amount,
            topUpApproved: basket.top_up_approved,
            deliveryCode: basket.delivery_code,
            pickupTimestamp: basket.pickup_timestamp,
            couponCode: metadata.coupon_code,
            metadata
        };
    } catch (e: any) {
        if (e.name !== 'AbortError' && !e.message?.includes('aborted')) {
            console.warn("getBasket timed out or failed", e);
        }
        return undefined;
    }
};

export const getUserBaskets = async (): Promise<Basket[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");

    const [basketsRes, settings] = await Promise.all([
        supabase.from('baskets').select(`*, items:basket_items(*, product:products(*)), payments(*), cycle:cycles(name)`).eq('user_id', user.id).order('created_at', { ascending: false }),
        getSettings()
    ]);

    if (basketsRes.error) throw basketsRes.error;

    return (basketsRes.data || []).map((basket: any) => {
        const metadata = basket.metadata || {};
        const mappedItems = (basket.items || []).map((i: any) => ({
            productId: i.product_id, quantity: i.quantity, unitPrice: i.unit_price, totalPrice: i.total_price, product: i.product
        }));
        const { subtotal, serviceFee, totalValue } = calculateBasketTotals(mappedItems, settings.basketServiceFeePercentage, metadata.discount_amount || 0);
        return {
            id: basket.id, userId: basket.user_id, cycleId: basket.cycle_id,
            month: basket.cycle?.name || 'Next Cycle (Rollover)',
            status: basket.status, items: mappedItems, subtotal, serviceFee, 
            discount: metadata.discount_amount || 0, totalValue, amountPaid: basket.amount_paid || 0,
            transactions: (basket.payments || []).map((t: any) => ({
                id: t.id, date: t.created_at, amount: t.amount, type: t.type, status: t.status
            })),
            topUpRequested: basket.top_up_requested, deliveryCode: basket.delivery_code, pickupTimestamp: basket.pickup_timestamp
        };
    });
};

export const addToBasket = async (productId: string, quantity: number) => {
    const [basket, { data: product }] = await Promise.all([
        getBasket(),
        supabase.from('products').select('price').eq('id', productId).single()
    ]);

    if (!basket || basket.id === 'virtual-closed') throw new Error("No active shopping cycle.");
    if (!product) throw new Error("Product not found");

    let targetBasketId = basket.id;

    if (basket.status !== 'OPEN') {
        const { data: rollover } = await supabase.from('baskets').select('id').eq('user_id', basket.userId).is('cycle_id', null).eq('status', 'OPEN').maybeSingle();
        if (rollover) targetBasketId = rollover.id;
        else {
            const { data: newB } = await supabase.from('baskets').insert([{ user_id: basket.userId, cycle_id: null, status: 'OPEN' }]).select('id').single();
            if (newB) targetBasketId = newB.id;
        }
    }

    const { data: existing } = await supabase.from('basket_items').select('*').eq('basket_id', targetBasketId).eq('product_id', productId).maybeSingle();
    
    if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty <= 0) await supabase.from('basket_items').delete().eq('id', existing.id);
        else await supabase.from('basket_items').update({ quantity: newQty }).eq('id', existing.id);
    } else if (quantity > 0) {
        await supabase.from('basket_items').insert({
            basket_id: targetBasketId, product_id: productId, quantity: quantity, unit_price: product.price
        });
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
    const { error } = await supabase.from('baskets').update({ top_up_requested: true }).eq('id', basketId);
    if (error) throw error;
};
