import { supabase } from '../supabaseClient';
import { Cycle, SystemSettings } from '../../types';
import { Logger } from '../logger';

export const getActiveCycle = async (): Promise<Cycle | null> => {
    const { data } = await supabase.from('cycles').select('*').eq('is_active', true).single();
    if (!data) return null;
    return {
        id: data.id,
        name: data.name,
        paymentStartDate: data.payment_start_date,
        paymentEndDate: data.payment_end_date,
        lockDate: data.lock_date,
        unlockDate: data.unlock_date,
        bulkStartDate: data.bulk_start_date,
        bulkEndDate: data.bulk_end_date,
        deliveryDate: data.delivery_date,
        isActive: data.is_active
    };
};

export const getSettings = async (): Promise<SystemSettings> => {
    const { data: config } = await supabase.from('app_settings').select('value').eq('key', 'GLOBAL_CONFIG').single();
    const activeCycle = await getActiveCycle();

    const defaults = {
        basketServiceFeePercentage: 5,
        topUpServiceFeePercentage: 5,
        heroImages: []
    };

    const combined = { ...defaults, ...(config?.value || {}) };

    return {
        ...combined,
        cycleName: activeCycle?.name || "No Active Cycle",
        // Map UI primary dates (No hardcoded fallback, allow null)
        basketOpenDate: activeCycle?.paymentStartDate,
        basketLockDate: activeCycle?.lockDate,
        deliveryDate: activeCycle?.deliveryDate,
        
        // Granular Dates (New Schema)
        paymentStartDate: activeCycle?.paymentStartDate,
        paymentEndDate: activeCycle?.paymentEndDate,
        lockDate: activeCycle?.lockDate,
        unlockDate: activeCycle?.unlockDate,
        bulkStartDate: activeCycle?.bulkStartDate,
        bulkEndDate: activeCycle?.bulkEndDate,
        
        isActive: !!activeCycle
    };
};

export const saveSettings = async (s: SystemSettings) => {
    const configValue = {
        basketServiceFeePercentage: s.basketServiceFeePercentage,
        topUpServiceFeePercentage: s.topUpServiceFeePercentage,
        heroImages: s.heroImages,
        legalContent: s.legalContent
    };
    await supabase.from('app_settings').upsert({ key: 'GLOBAL_CONFIG', value: configValue });

    const activeCycle = await getActiveCycle();
    if (activeCycle) {
        await supabase.from('cycles').update({
            // Save all granular dates, ensuring nulls are respected
            payment_start_date: s.paymentStartDate ?? null,
            payment_end_date: s.paymentEndDate ?? null,
            lock_date: s.lockDate ?? null,
            unlock_date: s.unlockDate ?? null,
            bulk_start_date: s.bulkStartDate ?? null,
            bulk_end_date: s.bulkEndDate ?? null,
            delivery_date: s.deliveryDate ?? null
        }).eq('id', activeCycle.id);
    }
};

export const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
    return data.publicUrl;
};

export const checkHealth = async () => {
    const { error } = await supabase.from('app_settings').select('key').limit(1);
    return !error;
};

export const reportError = (err: any) => Logger.error('Frontend Error Report', err);
