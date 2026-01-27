
import { useAuth } from '../context/AuthContext';
import { Feature, TIER_PERMISSIONS, getTierName } from '../lib/features';

export const useRBAC = () => {
    const { user } = useAuth();

    /**
     * Check if the current user has access to a specific feature.
     * @param feature The feature constant to check
     * @returns boolean
     */
    const hasAccess = (feature: Feature): boolean => {
        if (!user) return false;
        
        // Admins have access to everything for debugging/management
        if (user.role === 'ADMIN') return true;

        const currentTier = getTierName(user.isSubscriber);
        const allowedFeatures = TIER_PERMISSIONS[currentTier];

        return allowedFeatures.includes(feature);
    };

    /**
     * Strictly checks if user is a subscriber.
     * Use this for Upgrade prompts.
     */
    const isSubscriber = user?.isSubscriber || false;

    return { 
        hasAccess, 
        isSubscriber,
        currentTier: user ? getTierName(user.isSubscriber) : 'GUEST'
    };
};
