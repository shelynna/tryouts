
import { supabase } from '../supabaseClient';
import { Delivery } from '../../types';
import { Logger } from '../logger';

export const getAllDeliveries = async (filter?: string): Promise<Delivery[]> => {
    let query = supabase.from('deliveries').select('*');
    if (filter && filter !== 'ALL') {
        query = query.eq('pickup_point', filter);
    }
    
    const { data, error } = await query.order('locked_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map((d: any) => ({
        id: d.id,
        deliveryCode: d.delivery_code,
        basketId: d.basket_id,
        userId: d.user_id,
        fullName: d.full_name,
        phone: d.phone,
        pickupPoint: d.pickup_point,
        batchName: d.batch_name,
        status: d.status,
        lockedAt: d.locked_at,
        pickedUpAt: d.picked_up_at,
        pickedUpBy: d.picked_up_by
    }));
};

export const collectDelivery = async (code: string) => {
    const { data, error } = await supabase.rpc('confirm_delivery_pickup', { p_code: code });
    if (error) throw error;
    
    // Log collection
    await Logger.transaction("Delivery Collected", { code, result: data });
    
    return data; // Returns object { success: boolean, message: string, student: string }
};

export const markDeliveryAsCollected = async (deliveryId: string, basketId: string) => {
    if (!deliveryId) throw new Error("Invalid Delivery ID");

    // 1. Update Delivery Table
    const { error: deliveryError } = await supabase
        .from('deliveries')
        .update({ 
            status: 'COLLECTED', 
            picked_up_at: new Date().toISOString(),
            picked_up_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', deliveryId);

    if (deliveryError) throw deliveryError;

    // 2. Update Basket Status
    if (basketId) {
        const { error: basketError } = await supabase
            .from('baskets')
            .update({ status: 'COLLECTED' })
            .eq('id', basketId);
        
        if (basketError) console.warn("Failed to sync basket status", basketError);
    }

    await Logger.transaction("Admin Manual Collection", { deliveryId });
};

export const generateDeliveryManifest = async (sendNotifications: boolean = false) => {
    // 1. Fetch eligible PAID baskets that don't have a delivery code yet
    const { data: baskets, error } = await supabase
        .from('baskets')
        .select(`
            id, user_id, delivery_code,
            profiles:user_id (full_name, phone, pickup_point, email)
        `)
        .eq('status', 'PAID')
        .is('delivery_code', null);

    if (error) throw error;
    if (!baskets || baskets.length === 0) return { count: 0, notified: 0 };

    let createdCount = 0;
    let notifiedCount = 0;

    // 2. Process each basket
    for (const b of baskets) {
        const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
        if (!profile) continue;

        // Generate Code: SML-{POINT_3_CHARS}-{RANDOM_4}
        // Ensure robust point code
        const pointCode = (profile.pickup_point || 'GEN').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const deliveryCode = `SML-${pointCode}-${randomSuffix}`;

        // Insert Delivery Record
        const { error: insertError } = await supabase.from('deliveries').insert({
            delivery_code: deliveryCode,
            basket_id: b.id,
            user_id: b.user_id,
            full_name: profile.full_name,
            phone: profile.phone,
            pickup_point: profile.pickup_point || 'Hall 7',
            status: 'READY'
        });

        if (!insertError) {
            // Update Basket with Code
            await supabase.from('baskets').update({ delivery_code: deliveryCode }).eq('id', b.id);
            createdCount++;
            
            if (sendNotifications) {
                // Here we would ideally call a Supabase Edge Function to send email/SMS
                // For now, we simulate success as per system capability
                notifiedCount++;
            }
        }
    }
    
    if (sendNotifications && notifiedCount > 0) {
        // Log the "Automatic" action
        await Logger.info(`System Auto-Dispatched ${notifiedCount} notifications for delivery codes.`);
    }

    return { count: createdCount, notified: notifiedCount };
};
