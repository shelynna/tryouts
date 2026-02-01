
import { supabase } from '../supabaseClient';
import { Delivery } from '../../types';
import { Logger } from '../logger';

export const getAllDeliveries = async (filter?: string): Promise<Delivery[]> => {
    // Switch to new robust delivery_codes table
    let query = supabase.from('delivery_codes').select('*');
    if (filter && filter !== 'ALL') {
        // Note: New table uses 'hall' instead of 'pickup_point'
        query = query.eq('hall', filter);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map((d: any) => ({
        id: d.id,
        deliveryCode: d.delivery_code,
        basketId: d.basket_id,
        userId: '', // Not strictly needed for list view, simplifies query
        fullName: d.full_name,
        phone: d.phone,
        pickupPoint: d.hall,
        batchName: d.batch,
        status: d.status,
        lockedAt: d.created_at,
        pickedUpAt: d.collected_at,
        pickedUpBy: ''
    }));
};

export const collectDelivery = async (code: string) => {
    // Use new secure RPC
    const { data, error } = await supabase.rpc('collect_basket', { p_delivery_code: code });
    if (error) throw error;
    
    // Log collection
    await Logger.transaction("Delivery Collected", { code, result: data });
    
    return data; // Returns object { success: boolean, message: string, student: string }
};

export const markDeliveryAsCollected = async (deliveryId: string, basketId: string) => {
    if (!deliveryId) throw new Error("Invalid Delivery ID");

    // 1. Update New Delivery Table
    const { error: deliveryError } = await supabase
        .from('delivery_codes')
        .update({ 
            status: 'COLLECTED', 
            collected_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

    if (deliveryError) throw deliveryError;

    // 2. Sync Basket Status
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
    // Legacy support for manual button if needed, but trigger handles creation now.
    // We can use this function to just trigger notifications if we want.
    // For now, let's just log a message that system is auto-handling.
    console.log("Delivery codes are now auto-generated when baskets are locked.");
    return { count: 0, notified: 0 };
};
