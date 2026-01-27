
/**
 * FEATURE FLAGS & TIER CONFIGURATION
 * 
 * Defines specific capabilities within the application and maps them
 * to user tiers (Standard vs. Subscriber).
 */

export enum Feature {
    // Standard Features (Available to everyone)
    ACCESS_WHOLESALE = 'ACCESS_WHOLESALE',
    FLEXIBLE_INSTALLMENTS = 'FLEXIBLE_INSTALLMENTS',
    FREE_DELIVERY = 'FREE_DELIVERY',
    BASIC_TOP_UP = 'BASIC_TOP_UP', // Basic access, likely manual approval
    
    // Subscriber Only Features
    ADVANCED_CREDIT = 'ADVANCED_CREDIT', // Instant/Higher limit
    PRIORITY_PROCESSING = 'PRIORITY_PROCESSING',
    DEAL_DROPS = 'DEAL_DROPS',
    INSTANT_SUPPORT = 'INSTANT_SUPPORT'
}

type TierConfig = {
    [key in 'STANDARD' | 'SUBSCRIBER']: Feature[];
};

export const TIER_PERMISSIONS: TierConfig = {
    STANDARD: [
        Feature.ACCESS_WHOLESALE,
        Feature.FLEXIBLE_INSTALLMENTS,
        Feature.FREE_DELIVERY,
        Feature.BASIC_TOP_UP,
    ],
    SUBSCRIBER: [
        // Subscriber inherits all Standard features
        Feature.ACCESS_WHOLESALE,
        Feature.FLEXIBLE_INSTALLMENTS,
        Feature.FREE_DELIVERY,
        Feature.BASIC_TOP_UP,
        
        // Plus Exclusive features
        Feature.ADVANCED_CREDIT,
        Feature.PRIORITY_PROCESSING,
        Feature.DEAL_DROPS,
        Feature.INSTANT_SUPPORT
    ]
};

export const getTierName = (isSubscriber: boolean) => isSubscriber ? 'SUBSCRIBER' : 'STANDARD';
