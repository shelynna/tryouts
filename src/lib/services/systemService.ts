
import { supabase } from '../supabaseClient';
import { Cycle, SystemSettings, CycleDates } from '../../types';
import { Logger } from '../logger';
import { cycleService } from './cycleService';

let cachedCycle: Cycle | null = null;

export const getActiveCycle = async (forceRefresh = false): Promise<Cycle | null> => {
    // Force refresh if requested, otherwise check cache
    if (!forceRefresh && cachedCycle) return cachedCycle;

    const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    
    if (error || !data) {
        cachedCycle = null;
        return null;
    }

    // Map DB columns to Frontend Interface
    cachedCycle = {
        id: data.id,
        name: data.name,
        status: data.status, // Respect DB status (OPEN, LOCKED, CLOSED)
        paymentStartDate: data.start_date,
        paymentEndDate: data.end_date,
        lockDate: data.end_date, // Usually end date is lock date
        deliveryDate: data.delivery_date,
        isActive: data.status === 'OPEN' || data.status === 'LOCKED'
    } as any;
    
    return cachedCycle;
};

export const getSettings = async (forceRefresh = false): Promise<SystemSettings> => {
    const defaults = {
        cycleName: 'SML Market',
        isActive: false,
        basketServiceFeePercentage: 5,
        topUpServiceFeePercentage: 5,
        heroImages: [],
        branding: {}
    };

    try {
        const [configResult, activeCycle] = await Promise.allSettled([
            supabase.from('app_settings').select('value').eq('key', 'GLOBAL_CONFIG').maybeSingle(),
            getActiveCycle(forceRefresh)
        ]);

        const config = configResult.status === 'fulfilled' ? (configResult.value as any).data : null;
        const cycle = activeCycle.status === 'fulfilled' ? activeCycle.value : null;

        const combined = { ...defaults, ...(config?.value || {}) };
        
        return {
            ...combined,
            cycleName: cycle?.name || 'SML Market',
            cycleStatus: cycle?.status || 'CLOSED',
            paymentStartDate: cycle?.paymentStartDate,
            lockDate: cycle?.lockDate,
            deliveryDate: cycle?.deliveryDate,
            isActive: !!cycle && cycle.status !== 'CLOSED'
        };
    } catch (e) {
        return defaults as SystemSettings;
    }
};

export const checkHealth = async (): Promise<{ status: 'ONLINE' | 'OFFLINE' | 'DB_ERROR'; message?: string }> => ({ status: 'ONLINE' });

export const saveSettings = async (settings: Partial<SystemSettings>) => {
    const { error } = await supabase.from('app_settings').upsert({
        key: 'GLOBAL_CONFIG',
        value: settings
    });
    if (error) throw error;
};

export const startNewCycle = async (
    name: string,
    startDate: string,
    endDate: string, // Lock Date
    deliveryDate: string
) => {
    const { data, error } = await supabase.rpc('start_new_cycle', {
        p_name: name,
        p_start_date: startDate,
        p_end_date: endDate, 
        p_lock_date: endDate, // Lock matches end date
        p_delivery_date: deliveryDate
    });
    if (error) throw error;
    return data;
};

export const lockCurrentCycle = async (cycleId: string) => {
    const { error } = await supabase
        .from('cycles')
        .update({ status: 'LOCKED' })
        .eq('id', cycleId);
    if (error) throw error;
};

export const updateCycleDates = async (cycleId: string, dates: Partial<CycleDates>) => {
    return cycleService.updateCycleDates(cycleId, dates);
};

export const uploadImage = async (file: File, bucket: string = 'app-assets') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
};

export const reportError = (e: any) => { console.error(e); };
