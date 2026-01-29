
import React from 'react';
import { cn } from '../../../../lib/utils';
import { ChevronRight } from 'lucide-react';

const QuickActionItem = ({ iconClass, label, subtext, onClick, colorClass = "bg-white text-stone-900", disabled = false, iconColorClass = "text-stone-700" }: any) => {
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex items-center gap-4 w-full p-4 rounded-2xl transition-all group text-left relative overflow-hidden",
                colorClass,
                disabled ? "opacity-60 cursor-not-allowed grayscale bg-stone-50" : "bg-white hover:bg-stone-50 border border-stone-100 hover:border-stone-200 hover:shadow-md"
            )}
        >
            <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm border border-stone-100 group-hover:scale-110",
                disabled ? "bg-stone-100" : "bg-white"
            )}>
                <i className={cn("text-2xl", iconClass, iconColorClass)}></i>
            </div>
            
            <div className="flex-1">
                <p className="font-heading font-bold text-stone-900 text-sm">{label}</p>
                {subtext && <p className="text-xs text-stone-500 font-medium mt-0.5">{subtext}</p>}
            </div>
            
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-stone-300 group-hover:text-stone-900 group-hover:translate-x-1 transition-all">
                <ChevronRight size={20} />
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
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">Quick Actions</h3>
            <div className="flex flex-col gap-3">
                <QuickActionItem 
                    iconClass="bx bx-shopping-bag"
                    label="Marketplace" 
                    subtext="Add items to basket"
                    onClick={onGoToShop}
                    iconColorClass="text-brand-600"
                />
                
                <QuickActionItem 
                    iconClass="bx bx-group"
                    label="Invite Friends" 
                    subtext="Share code & earn"
                    onClick={onCopyReferral}
                    iconColorClass="text-blue-600"
                />

                <QuickActionItem 
                    iconClass="bx bx-bolt-circle"
                    label="Request Top-Up" 
                    subtext={canRequestTopUp ? "Credit Available" : (!isSubscriber ? "Subscriber Only" : "Not Eligible Yet")}
                    onClick={canRequestTopUp ? onRequestTopUp : () => showTopUpError(isSubscriber ? "You need to pay 70% of your basket to access Top-Ups." : "Top-ups are available to Subscribers only.")}
                    disabled={!isSubscriber && !canRequestTopUp}
                    iconColorClass="text-amber-500"
                />
            </div>
        </div>
    );
};
