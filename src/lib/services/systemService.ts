
import { supabase } from '../supabaseClient';
import { Cycle, SystemSettings } from '../../types';
import { Logger } from '../logger';

// In-memory cache to prevent redundant fetches in production
let cachedSettings: SystemSettings | null = null;
let cachedCycle: Cycle | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export const getActiveCycle = async (forceRefresh = false): Promise<Cycle | null> => {
    try {
        const now = Date.now();
        if (!forceRefresh && cachedCycle && (now - lastFetchTime < CACHE_TTL)) {
            return cachedCycle;
        }

        const { data, error } = await supabase.from('cycles').select('*').eq('is_active', true).maybeSingle();
        
        if (error) {
            // Suppress error log for aborts
            const lowMsg = error.message?.toLowerCase();
            if (!lowMsg?.includes('aborted') && !lowMsg?.includes('abort') && !lowMsg?.includes('signal')) {
                console.warn("Cycle fetch issue:", error);
            }
            return cachedCycle; 
        }
        
        if (!data) {
            cachedCycle = null;
            return null;
        }

        cachedCycle = {
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
        lastFetchTime = now;
        return cachedCycle;
    } catch (e) {
        return null;
    }
};

export const getSettings = async (forceRefresh = false): Promise<SystemSettings> => {
    const now = Date.now();
    if (!forceRefresh && cachedSettings && (now - lastFetchTime < CACHE_TTL)) {
        return cachedSettings;
    }

    try {
        const [configResult, activeCycle] = await Promise.allSettled([
            supabase.from('app_settings').select('value').eq('key', 'GLOBAL_CONFIG').maybeSingle(),
            getActiveCycle(forceRefresh)
        ]);

        const config = configResult.status === 'fulfilled' ? (configResult.value as any).data : null;
        const cycle = activeCycle.status === 'fulfilled' ? activeCycle.value : null;

        const defaults = {
            basketServiceFeePercentage: 5,
            topUpServiceFeePercentage: 5,
            heroImages: [],
            branding: {}
        };

        const combined = { ...defaults, ...(config?.value || {}) };

        const settings: SystemSettings = {
            ...combined,
            cycleName: cycle?.name || "No Active Cycle",
            basketOpenDate: cycle?.paymentStartDate,
            basketLockDate: cycle?.lockDate,
            deliveryDate: cycle?.deliveryDate,
            paymentStartDate: cycle?.paymentStartDate,
            paymentEndDate: cycle?.paymentEndDate,
            lockDate: cycle?.lockDate,
            unlockDate: cycle?.unlockDate,
            bulkStartDate: cycle?.bulkStartDate,
            bulkEndDate: cycle?.bulkEndDate,
            isActive: !!cycle
        };
        
        cachedSettings = settings;
        lastFetchTime = now;
        return settings;
    } catch (e) {
        return {
            cycleName: 'SML',
            isActive: false,
            basketServiceFeePercentage: 5,
            topUpServiceFeePercentage: 5
        } as SystemSettings;
    }
};

export const saveSettings = async (s: SystemSettings) => {
    const configValue = {
        basketServiceFeePercentage: s.basketServiceFeePercentage,
        topUpServiceFeePercentage: s.topUpServiceFeePercentage,
        heroImages: s.heroImages,
        legalContent: s.legalContent,
        branding: s.branding
    };
    
    await supabase.from('app_settings').upsert({ key: 'GLOBAL_CONFIG', value: configValue });

    const activeCycle = await getActiveCycle();
    if (activeCycle) {
        await supabase.from('cycles').update({
            payment_start_date: s.paymentStartDate ?? null,
            payment_end_date: s.paymentEndDate ?? null,
            lock_date: s.lockDate ?? null,
            unlock_date: s.unlockDate ?? null,
            bulk_start_date: s.bulkStartDate ?? null,
            bulk_end_date: s.bulkEndDate ?? null,
            delivery_date: s.deliveryDate ?? null
        }).eq('id', activeCycle.id);
    }

    cachedSettings = null;
    cachedCycle = null;
    lastFetchTime = 0;
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

export interface HealthCheckResult {
    status: 'ONLINE' | 'OFFLINE' | 'DB_ERROR';
    message?: string;
}

export const checkHealth = async (): Promise<HealthCheckResult> => {
    try {
        const { error } = await supabase.from('app_settings').select('key').limit(1);
        if (error) {
            if (error.code === '42P01') return { status: 'DB_ERROR', message: 'Database Setup Required' };
            // Production Abort check
            const lowMsg = error.message?.toLowerCase();
            if (lowMsg?.includes('aborted') || lowMsg?.includes('abort') || lowMsg?.includes('signal')) {
                 return { status: 'ONLINE' }; 
            }
            return { status: 'OFFLINE', message: error.message };
        }
        return { status: 'ONLINE' };
    } catch (e: any) {
        return { status: 'OFFLINE', message: 'Connection issue' };
    }
};

export const reportError = (err: any) => {
    const msg = typeof err === 'string' ? err : err.message;
    const lowMsg = msg?.toLowerCase();
    // CRITICAL: Silent ignore of abort signals/technical noise
    if (lowMsg?.includes('abort') || lowMsg?.includes('signal') || lowMsg?.includes('fetch')) return;
    Logger.error('SML Client Error', err);
};
