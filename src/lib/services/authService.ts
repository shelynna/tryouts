
import { supabase } from '../supabaseClient';
import { User } from '../../types';
import { withTimeout } from '../utils';

export const getMe = async (userId?: string, sessionUser?: any): Promise<User | undefined> => {
    try {
        let user = sessionUser;
        
        // If no user provided, fetch from Auth
        if (!user) {
            const { data, error } = await supabase.auth.getUser();
            if (error || !data.user) return undefined;
            user = data.user;
        }

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

        // Self-Healing: If profile is missing but Auth exists, try to recreate the profile
        if (!profileData && !error) {
            const meta = user.user_metadata || {};
            // CRITICAL FIX: Don't hardcode USER role if metadata already has ADMIN
            const existingRole = meta.role || 'USER';

            const { error: upsertError } = await supabase.from('profiles').upsert({
                id: uid,
                email: user.email,
                full_name: meta.full_name,
                phone: meta.phone,
                pickup_point: meta.pickup_point || 'Hall 7',
                role: existingRole, 
                referral_code: meta.referral_code_input
            }, { onConflict: 'id', ignoreDuplicates: true });

            if (!upsertError) {
                // Retry fetch immediately - it should exist now
                const { data: retryData } = await supabase.from('profiles').select('*').eq('id', uid).single();
                if (retryData) {
                    return mapProfileToUser(retryData, user);
                }
            }
        }

        // If DB profile exists, return it
        if (profileData && !error) {
            // SYNC METADATA: If DB role is different from Auth metadata, update Auth
            // This ensures subsequent page loads have correct fallback role in JWT
            if (profileData.role && user.user_metadata?.role !== profileData.role) {
                console.log(`[Auth] Syncing role ${profileData.role} to metadata`);
                // Fire and forget update to avoid blocking
                supabase.auth.updateUser({
                    data: { role: profileData.role }
                }).then(({ error }) => {
                    if (error) console.warn("Failed to sync role to metadata", error);
                });
            }

            return mapProfileToUser(profileData, user);
        }

        return undefined;

    } catch (e: any) {
        // Silent fail allows AuthContext to fall back to session metadata
        console.warn("[Auth] getMe failed", e);
        return undefined;
    }
};

const mapProfileToUser = (profileData: any, authUser: any): User => {
    return {
        id: profileData.id,
        fullName: profileData.full_name || authUser.user_metadata?.full_name,
        email: profileData.email || authUser.email,
        phoneNumber: profileData.phone || authUser.user_metadata?.phone,
        pickupPoint: profileData.pickup_point,
        role: profileData.role,
        isSubscriber: profileData.is_subscriber,
        isEmailVerified: !!authUser.email_confirmed_at, 
        creditBalance: profileData.credit_balance,
        isBlocked: profileData.is_blocked,
        referralCode: profileData.referral_code,
        referredBy: profileData.referred_by,
        avatarUrl: profileData.avatar_url
    } as User;
};

export const updateProfile = async (data: Partial<User>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const payload: any = {
        full_name: data.fullName,
        phone: data.phoneNumber,
        pickup_point: data.pickupPoint
    };

    if (data.avatarUrl) {
        payload.avatar_url = data.avatarUrl;
    }

    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);

    if(error) throw error;
    // Pass user to getMe to avoid re-fetching
    return getMe(user.id, user);
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
