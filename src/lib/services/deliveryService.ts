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
    
    return data.map((d: any) => ({
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
