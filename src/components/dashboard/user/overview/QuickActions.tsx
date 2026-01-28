
import React from 'react';
import { cn } from '../../../../lib/utils';

const QuickActionItem = ({ iconClass, label, subtext, onClick, colorClass = "bg-white text-stone-900", disabled = false, iconColorClass = "text-stone-900" }: any) => {
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
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-stone-50 group-hover:bg-white group-hover:shadow-sm transition-all border border-stone-100">
                <i className={cn("text-xl", iconClass, iconColorClass)}></i>
            </div>
            <div>
                <p className="font-bold text-sm text-stone-900 leading-tight">{label}</p>
                {subtext && <p className="text-[10px] text-stone-500 font-medium">{subtext}</p>}
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-stone-400">
                <i className='bx bx-chevron-right text-xl'></i>
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
                    iconClass="bx bx-shopping-bag"
                    label="Marketplace" 
                    subtext="Add items to basket"
                    onClick={onGoToShop}
                />
                
                <QuickActionItem 
                    iconClass="bx bx-group"
                    label="Invite Friends" 
                    subtext="Share code & earn"
                    onClick={onCopyReferral}
                />

                <QuickActionItem 
                    iconClass="bx bx-bolt-circle"
                    iconColorClass="text-amber-500"
                    label="Request Top-Up" 
                    subtext={canRequestTopUp ? "Credit Available" : (!isSubscriber ? "Subscriber Only" : "Not Eligible Yet")}
                    onClick={canRequestTopUp ? onRequestTopUp : () => showTopUpError(isSubscriber ? "You need to pay 70% of your basket to access Top-Ups." : "Top-ups are available to Subscribers only.")}
                    disabled={!isSubscriber && !canRequestTopUp}
                />
            </div>
        </div>
    );
};
