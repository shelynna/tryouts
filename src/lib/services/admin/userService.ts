
import { supabase } from '../../supabaseClient';
import { UserRole } from '../../../types';

export const getUsers = async () => {
    const { data, error } = await supabase.rpc('get_all_profiles_secure');
    if (error) return [];

    const referralCounts: Record<string, number> = {};
    data?.forEach((u: any) => {
        if (u.referred_by) {
            referralCounts[u.referred_by] = (referralCounts[u.referred_by] || 0) + 1;
        }
    });

    return data?.map((u: any) => ({
        ...u,
        fullName: u.full_name,
        phoneNumber: u.phone,
        pickupPoint: u.pickup_point,
        isBlocked: u.is_blocked,
        referralCode: u.referral_code,
        referredBy: u.referred_by,
        referralCount: referralCounts[u.referral_code] || 0 
    })) || [];
};

export const toggleUserBlock = async (id: string) => {
    const { data } = await supabase.from('profiles').select('is_blocked').eq('id', id).single();
    if (data) {
        await supabase.from('profiles').update({ is_blocked: !data.is_blocked }).eq('id', id);
    }
};

export const updateUserRole = async (id: string, newRole: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (error) throw error;
};
