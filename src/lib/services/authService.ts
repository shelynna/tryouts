
import { supabase } from '../supabaseClient';
import { User } from '../../types';
import { withTimeout } from '../utils';

export const getMe = async (userId?: string): Promise<User | undefined> => {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) return undefined;

        const uid = userId || user.id;

        // Try to fetch profile from DB
        const { data: profileData, error } = await withTimeout(
            supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .maybeSingle(),
            5000, // 5s timeout max for DB
            "Profile Fetch"
        ) as any;

        // If DB profile exists, return it
        if (profileData && !error) {
            return {
                id: profileData.id,
                fullName: profileData.full_name,
                email: profileData.email,
                phoneNumber: profileData.phone,
                pickupPoint: profileData.pickup_point,
                role: profileData.role,
                isSubscriber: profileData.is_subscriber,
                isEmailVerified: !!user.email_confirmed_at, 
                creditBalance: profileData.credit_balance,
                isBlocked: profileData.is_blocked,
                referralCode: profileData.referral_code,
                referredBy: profileData.referred_by
            } as User;
        }

        // If DB profile is missing (race condition or trigger fail), 
        // DO NOT LOOP. Return undefined. AuthContext will handle the fallback.
        // Console warning suppressed to avoid noise during registration flows.
        return undefined;

    } catch (e: any) {
        // Silent fail allows AuthContext to fall back to session metadata
        return undefined;
    }
};

export const updateProfile = async (data: Partial<User>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase.from('profiles').update({
        full_name: data.fullName,
        phone: data.phoneNumber,
        pickup_point: data.pickupPoint 
    }).eq('id', user.id);

    if(error) throw error;
    return getMe();
};

export const checkReferralCode = async (code: string): Promise<boolean> => {
    if (!code) return false;
    const cleanCode = code.toUpperCase().trim();
    
    const { data: coupon } = await supabase.from('coupons').select('id').eq('code', cleanCode).eq('is_active', true).maybeSingle();
    if (coupon) return true;

    const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('referral_code', cleanCode);
    
    return !error && count !== null && count > 0;
};

export const sendLoginOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: window.location.origin
        }
    });
    if (error) throw error;
};

export const verifyLoginOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
    });
    
    if (error) throw error;
    return data;
};

export const forgotPassword = async (email: string) => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });

export const resetPassword = async (token: string, pass: string) => {
    const { data, error } = await supabase.auth.updateUser({ password: pass });
    if (error) throw error;
    return data;
};

export const verifyEmail = async (token: string) => ({ success: true });
