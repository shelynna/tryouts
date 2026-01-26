
import React, { useState } from 'react';
import { Modal, Button, Badge } from '../ui';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { ASSETS } from '../../assets';
import { Minus, Plus, ShoppingBag, Truck, ShieldCheck, Info } from 'lucide-react';
import { cn } from '../ui/utils';

interface ProductDetailsModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    currentQuantity: number;
    onIncrement: () => void;
    onDecrement: () => void;
    isLocked: boolean;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ 
    product, isOpen, onClose, currentQuantity, onIncrement, onDecrement, isLocked 
}) => {
    const [imageError, setImageError] = useState(false);

    if (!product) return null;

    const isSoldOut = product.stockStatus === 'SOLD_OUT';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            noPadding
            className="overflow-hidden h-[90vh] md:h-auto md:max-h-[85vh] flex flex-col"
        >
            <div className="flex flex-col md:flex-row h-full">
                {/* Hero Image Section */}
                <div className="w-full md:w-1/2 bg-stone-50 relative flex items-center justify-center p-6 md:p-8 border-b md:border-b-0 md:border-r border-stone-100 shrink-0 h-1/3 md:h-auto min-h-[200px]">
                    <div className="absolute top-4 left-4 z-10">
                        <Badge status={isSoldOut ? 'LOCKED' : (product.isActive ? 'OPEN' : 'LOCKED')} size="sm" />
                    </div>
                    
                    {!imageError ? (
                        <img 
                            src={product.image || ASSETS.PRODUCT_RICE} 
                            alt={product.name}
                            className={cn("max-h-full w-auto object-contain drop-shadow-xl transition-all duration-500", isSoldOut ? "grayscale" : "")}
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="flex flex-col items-center text-stone-300">
                            <ShoppingBag size={48} />
                            <span className="text-xs font-bold mt-2 uppercase">No Image</span>
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="w-full md:w-1/2 flex flex-col h-full overflow-hidden">
                    <div className="p-5 md:p-8 flex-1 overflow-y-auto">
                        <div className="flex flex-col gap-1 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-1 rounded-md">
                                    {product.category}
                                </span>
                                {currentQuantity > 0 && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-brand-900 px-2 py-1 rounded-md">
                                        In Basket
                                    </span>
                                )}
                            </div>

                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 leading-tight md:leading-tight">
                                {product.name}
                            </h2>
                            
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl md:text-3xl font-bold text-brand-900">{formatCurrency(product.price)}</span>
                                <span className="text-sm text-stone-500 font-medium">/ {product.size}</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <span className="hidden sm:inline"><Info size={14} className="text-brand-500" /></span> Description
                                </h3>
                                <p className="text-stone-700 text-sm md:text-base leading-relaxed">
                                    {product.description || "Premium quality household essential sourced directly for the best value."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col justify-center">
                                    <div className="hidden sm:block mb-2"><Truck size={20} className="text-stone-400" /></div>
                                    <p className="text-xs font-bold text-stone-800">Campus Pickup</p>
                                    <p className="text-[10px] text-stone-500 leading-tight">Available at Hall 7, Conti & more</p>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col justify-center">
                                    <div className="hidden sm:block mb-2"><ShieldCheck size={20} className="text-stone-400" /></div>
                                    <p className="text-xs font-bold text-stone-800">Quality Assured</p>
                                    <p className="text-[10px] text-stone-500 leading-tight">Sourced from verified suppliers</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-4 md:p-6 bg-white border-t border-stone-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] relative z-20 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-stone-100 rounded-xl p-1 h-12 md:h-14 shrink-0">
                                <button 
                                    onClick={onDecrement}
                                    className="w-10 md:w-12 h-full flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all text-stone-600 active:scale-95 disabled:opacity-50"
                                    disabled={currentQuantity === 0}
                                >
                                    <Minus size={18} />
                                </button>
                                <span className="w-10 md:w-12 text-center font-bold text-stone-900 text-lg tabular-nums">
                                    {currentQuantity}
                                </span>
                                <button 
                                    onClick={onIncrement}
                                    className="w-10 md:w-12 h-full flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all text-stone-600 active:scale-95 disabled:opacity-50"
                                    disabled={isLocked || isSoldOut}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                            
                            <Button 
                                fullWidth 
                                size="lg"
                                disabled={isLocked || isSoldOut}
                                onClick={onIncrement}
                                className={cn(
                                    "h-12 md:h-14 text-base shadow-xl shadow-brand-900/10", 
                                    isSoldOut ? "bg-stone-300 text-white border-none" : ""
                                )}
                            >
                                {isSoldOut ? 'Sold Out' : (currentQuantity === 0 ? 'Add to Basket' : 'Add Another')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
