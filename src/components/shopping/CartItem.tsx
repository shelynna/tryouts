
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Minus, Plus, Trash2, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { ASSETS } from '../../assets';

const MotionDiv = motion.div as any;

interface CartItemProps {
    item: any;
    isLocked: boolean;
    onUpdate: (id: string, delta: number) => Promise<void>;
    onRemove: (id: string) => Promise<void>;
}

export const CartItem: React.FC<CartItemProps> = ({ item, isLocked, onUpdate, onRemove }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const product = item.product;
    const fallbackName = "Product Item";
    const isUnavailable = product?.isActive === false;

    const handleUpdateAction = async (delta: number) => {
        if (isUnavailable) return;
        setIsUpdating(true);
        try {
            await onUpdate(item.productId, delta);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveAction = async () => {
        setIsUpdating(true);
        try {
            await onRemove(item.productId);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <MotionDiv 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={cn(
                "bg-white p-3 pr-4 rounded-2xl shadow-sm border flex gap-4 group relative overflow-hidden",
                isUnavailable ? "border-red-100 bg-red-50/20" : "border-stone-100"
            )}
        >
            <div className="w-20 h-20 bg-[#F3F4F6] border border-stone-100 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center">
                <img 
                    src={product?.image || ASSETS.PRODUCT_PLACEHOLDER} 
                    alt={product?.name || fallbackName} 
                    className={cn(
                        "w-full h-full object-contain p-2",
                        isUnavailable && "grayscale opacity-50"
                    )}
                    onError={(e) => { 
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; 
                        target.src = ASSETS.PRODUCT_PLACEHOLDER; 
                    }}
                />
                {isUpdating && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <Loader2 size={24} className="text-stone-900 animate-spin" />
                    </div>
                )}
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className={cn("font-bold text-sm line-clamp-1", isUnavailable ? "text-stone-500" : "text-stone-900")}>
                            {product?.name || fallbackName}
                        </h4>
                        <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">{product?.size}</p>
                    </div>
                    
                    {isUnavailable ? (
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 px-2 py-1 rounded">Unavailable</span>
                    ) : (
                        <span className="font-serif font-bold text-brand-900 text-sm">
                            {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                    )}
                </div>

                {isUnavailable && (
                    <div className="flex items-center gap-1 text-[10px] text-red-500 font-medium mt-1">
                        <AlertCircle size={12} />
                        <span>Item discontinued by admin.</span>
                    </div>
                )}

                <div className="flex items-center justify-between mt-2">
                    {!isLocked && !isUnavailable ? (
                        <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
                            <button 
                                onClick={() => handleUpdateAction(-1)}
                                disabled={isUpdating}
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-stone-600 hover:text-red-500 active:scale-95 transition-all disabled:opacity-50"
                            >
                                <Minus size={12} />
                            </button>
                            <span className="text-xs font-bold w-6 text-center tabular-nums">
                                {item.quantity}
                            </span>
                            <button 
                                onClick={() => handleUpdateAction(1)}
                                disabled={isUpdating}
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-brand-600 active:scale-95 transition-all disabled:opacity-50"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                    ) : (
                        !isUnavailable && (
                            <div className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded inline-block font-bold">
                                Locked
                            </div>
                        )
                    )}
                    
                    {/* Always allow removing inactive items */}
                    <button 
                        onClick={handleRemoveAction}
                        disabled={isUpdating}
                        className={cn(
                            "transition-colors p-2 disabled:opacity-50",
                            isUnavailable ? "text-red-500 hover:text-red-700 bg-red-50 rounded-lg hover:bg-red-100 ml-auto" : "text-stone-300 hover:text-red-500"
                        )}
                        title="Remove item"
                    >
                        <Trash2 size={isUnavailable ? 16 : 14} />
                        {isUnavailable && <span className="ml-2 text-xs font-bold">Remove</span>}
                    </button>
                </div>
            </div>
        </MotionDiv>
    );
};
