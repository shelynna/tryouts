
import React from 'react';
import { useRBAC } from '../../hooks/useRBAC';
import { Feature } from '../../lib/features';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
    feature: Feature;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    showLock?: boolean; // If true, shows a lock icon/overlay instead of null
    onLockedClick?: () => void;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ 
    feature, 
    children, 
    fallback = null, 
    showLock = false,
    onLockedClick
}) => {
    const { hasAccess } = useRBAC();

    if (hasAccess(feature)) {
        return <>{children}</>;
    }

    if (showLock) {
        return (
            <div 
                onClick={onLockedClick}
                className="relative group cursor-pointer overflow-hidden rounded-xl border border-stone-200 bg-stone-50 p-6 opacity-80 hover:opacity-100 transition-all"
            >
                <div className="absolute inset-0 bg-stone-100/50 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-stone-500">
                    <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform text-brand-600">
                        <Lock size={20} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Subscriber Only</span>
                </div>
                <div className="blur-sm grayscale opacity-50 pointer-events-none">
                    {children}
                </div>
            </div>
        );
    }

    return <>{fallback}</>;
};
