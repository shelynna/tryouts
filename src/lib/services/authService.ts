
import { supabase } from '../supabaseClient';
import { User, UserRole, PickupPoint } from '../../types';

export const getMe = async (userId?: string): Promise<User | undefined> => {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error("No user logged in");

    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
    
    if (error) return undefined;
    
    return {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        phoneNumber: data.phone,
        pickupPoint: data.pickup_point,
        role: data.role,
        isSubscriber: data.is_subscriber,
        isEmailVerified: false, 
        creditBalance: data.credit_balance,
        isBlocked: data.is_blocked,
        referralCode: data.referral_code,
        referredBy: data.referred_by
    } as User;
};

export const updateProfile = async (data: Partial<User>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Fix: Use data.pickupPoint (camelCase from User type) to map to pickup_point (snake_case DB column)
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
    
    // Check Coupons table first (Associate Codes)
    const { data: coupon } = await supabase.from('coupons').select('id').eq('code', cleanCode).eq('is_active', true).maybeSingle();
    if (coupon) return true;

    // Check Users table (Legacy Friend Codes)
    const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('referral_code', cleanCode);
    
    return !error && count !== null && count > 0;
};

// --- OTP LOGIC ---

export const sendLoginOtp = async (email: string) => {
    // This sends a 6-digit code if 'Enable Email OTP' is on in Supabase
    // Otherwise it sends a Magic Link.
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: false // Only allow existing users to login this way
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

export const forgotPassword = async (email: string) => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/?view=RESET_PASSWORD` });

export const resetPassword = async (token: string, pass: string) => supabase.auth.updateUser({ password: pass });

export const verifyEmail = async (token: string) => ({ success: true });
