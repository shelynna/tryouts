
import React from 'react';
import { cn } from '../../../../lib/utils';

const QuickActionItem = ({ icon, label, subtext, onClick, colorClass = "bg-white text-stone-900", disabled = false }: any) => {
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex items-center gap-3 w-full p-3 rounded-xl border transition-all group text-left hover:shadow-sm active:scale-[0.98]",
                colorClass,
                disabled ? "opacity-50 cursor-not-allowed grayscale" : "border-stone-100 hover:border-stone-200"
            )}
        >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-stone-50 text-xl group-hover:bg-white group-hover:shadow-sm transition-all border border-stone-100">
                {icon}
            </div>
            <div>
                <p className="font-bold text-sm text-stone-900 leading-tight">{label}</p>
                {subtext && <p className="text-[10px] text-stone-500 font-medium">{subtext}</p>}
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-stone-400">
                <i className='bx bx-chevron-right text-lg'></i>
            </div>
        </button>
    );
};

interface QuickActionsProps {
    onGoToShop: () => void;
    onCopyReferral: () => void;
    onSupport: () => void;
    onRequestTopUp: () => void;
    canRequestTopUp: boolean;
    isSubscriber: boolean;
    showTopUpError: (msg: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ 
    onGoToShop, onCopyReferral, onSupport, onRequestTopUp, canRequestTopUp, isSubscriber, showTopUpError 
}) => {
    return (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-2">
                <QuickActionItem 
                    icon={<i className="bx bx-shopping-bag"></i>}
                    label="Marketplace" 
                    subtext="Add items to basket"
                    onClick={onGoToShop}
                />
                
                <QuickActionItem 
                    icon={<i className="bx bx-group"></i>}
                    label="Invite Friends" 
                    subtext="Share code & earn"
                    onClick={onCopyReferral}
                />

                <QuickActionItem 
                    icon={<i className="bx bx-bolt-circle text-amber-500"></i>}
                    label="Request Top-Up" 
                    subtext={canRequestTopUp ? "Credit Available" : (!isSubscriber ? "Subscriber Only" : "Not Eligible Yet")}
                    onClick={canRequestTopUp ? onRequestTopUp : () => showTopUpError(isSubscriber ? "You need to pay 70% of your basket to access Top-Ups." : "Top-ups are available to Subscribers only.")}
                    disabled={!isSubscriber && !canRequestTopUp}
                />
            </div>
        </div>
    );
};
