
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
