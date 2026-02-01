export * from './admin/statsService';
export * from './admin/userService';
export * from './admin/orderService';
import { supabase } from '../supabaseClient';
import { Coupon, AssociateReport } from '../../types';

export const getCoupons = async (): Promise<Coupon[]> => {
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((c: any) => ({
        id: c.id,
        code: c.code,
        associateName: c.associate_name,
        isActive: c.is_active
    }));
};

export const createCoupon = async (code: string, associateName: string) => {
    const { error } = await supabase.from('coupons').insert({
        code: code.toUpperCase().trim(),
        associate_name: associateName
    });
    if (error) throw error;
};

export const toggleCoupon = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('coupons').update({ is_active: isActive }).eq('id', id);
    if (error) throw error;
};

export const getAssociateReport = async (): Promise<AssociateReport[]> => {
    const { data, error } = await supabase.rpc('get_associate_report');
    if (error) throw error;
    return data.map((r: any) => ({
        associateName: r.associate_name,
        couponCode: r.coupon_code,
        month: r.month,
        activeUsers: r.active_users
    }));
};

// --- NEW ADMIN FEATURES ---

export const exportUserContacts = async (cycleId?: string, onlyDebtors: boolean = false) => {
    // Queries the admin_user_contacts view defined in schema
    let query = supabase.from('admin_user_contacts').select('*');
    // Basic filter implementation - View limitations apply
    if (cycleId) {
        query = query.eq('cycle', cycleId); // View uses cycle name not ID
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const exportAllProfiles = async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data;
};

export const getUserCycleHistory = async (userId: string) => {
    const { data, error } = await supabase.rpc('admin_get_user_cycle_history', {
        p_user_id: userId
    });
    if (error) throw error;
    return data;
};