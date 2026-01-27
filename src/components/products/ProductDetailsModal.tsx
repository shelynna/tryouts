
import React, { useState } from 'react';
import { Modal, Button, Badge } from '../ui';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { ASSETS } from '../../assets';
import { Minus, Plus, ShoppingBag, Truck, ShieldCheck, X } from 'lucide-react';
import { cn } from '../../lib/utils';

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
            // Custom class to handle responsive height and full width on mobile
            className="overflow-hidden h-[90vh] md:h-auto md:max-h-[85vh] flex flex-col w-full md:max-w-4xl"
        >
            <div className="flex flex-col md:flex-row h-full relative">
                
                {/* Mobile Close Button (Absolute) */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 bg-white/80 backdrop-blur-md p-2 rounded-full text-stone-500 hover:text-stone-900 transition-colors md:hidden shadow-sm"
                >
                    <X size={20} />
                </button>

                {/* LEFT: Hero Image Section */}
                <div className="w-full md:w-1/2 bg-[#F9FAFB] relative flex items-center justify-center shrink-0 h-[40vh] md:h-auto border-b md:border-b-0 md:border-r border-stone-100">
                    <div className="absolute top-4 left-4 z-10">
                        <Badge status={isSoldOut ? 'LOCKED' : (product.isActive ? 'OPEN' : 'LOCKED')} size="sm" />
                    </div>
                    
                    {!imageError ? (
                        <img 
                            src={product.image || ASSETS.PRODUCT_PLACEHOLDER} 
                            alt={product.name}
                            className={cn("w-full h-full object-cover md:object-contain p-0 md:p-8 transition-all duration-500 mix-blend-multiply", isSoldOut ? "grayscale opacity-50" : "")}
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="flex flex-col items-center text-stone-300">
                            <ShoppingBag size={48} />
                            <span className="text-xs font-bold mt-2 uppercase">No Image</span>
                        </div>
                    )}
                </div>

                {/* RIGHT: Details Section */}
                <div className="w-full md:w-1/2 flex flex-col h-full overflow-hidden bg-white">
                    
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
                        
                        {/* Header Info */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-700 bg-brand-50 px-2 py-1 rounded-md border border-brand-100">
                                    {product.category}
                                </span>
                                {/* Desktop Close Button */}
                                <button onClick={onClose} className="hidden md:block text-stone-400 hover:text-stone-900 p-1 hover:bg-stone-50 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <h2 className="text-2xl md:text-3xl font-heading font-bold text-stone-900 capitalize leading-tight mb-2">
                                {product.name}
                            </h2>
                            
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-brand-600 tracking-tight">
                                    {formatCurrency(product.price)}
                                </span>
                                <span className="text-sm text-stone-400 font-medium">/ {product.size}</span>
                            </div>
                        </div>

                        {/* Description - Clean text */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">About this item</h3>
                            <p className="text-stone-600 text-base leading-relaxed font-light">
                                {product.description || "Premium quality household essential sourced directly for the best value. Perfect for your monthly stock."}
                            </p>
                        </div>

                        {/* Trust Badges - Horizontal List */}
                        <div className="pt-6 border-t border-stone-100">
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-sm text-stone-600">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <Truck size={16} />
                                    </div>
                                    <span><strong>Campus Pickup</strong> available at Hall 7, Conti & more</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-stone-600">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <span><strong>Quality Assured</strong> from verified suppliers</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Sticky Bottom Action Bar */}
                    <div className="p-4 md:p-6 bg-white border-t border-stone-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] relative z-20 shrink-0">
                        <div className="flex items-center gap-4">
                            {/* Quantity Selector */}
                            <div className="flex items-center bg-stone-100 rounded-xl h-12 md:h-14 shrink-0 px-2 border border-stone-200">
                                <button 
                                    onClick={onDecrement}
                                    className="w-10 h-full flex items-center justify-center hover:text-stone-900 text-stone-500 transition-colors disabled:opacity-30 active:scale-95"
                                    disabled={currentQuantity === 0}
                                >
                                    <Minus size={18} />
                                </button>
                                <span className="w-8 text-center font-bold text-stone-900 text-lg tabular-nums">
                                    {currentQuantity}
                                </span>
                                <button 
                                    onClick={onIncrement}
                                    className="w-10 h-full flex items-center justify-center hover:text-stone-900 text-stone-500 transition-colors disabled:opacity-30 active:scale-95"
                                    disabled={isLocked || isSoldOut}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                            
                            {/* Add Button */}
                            <Button 
                                fullWidth 
                                size="lg"
                                disabled={isLocked || isSoldOut}
                                onClick={onIncrement}
                                className={cn(
                                    "h-12 md:h-14 text-base font-bold shadow-xl shadow-brand-900/20 rounded-xl", 
                                    isSoldOut ? "bg-stone-300 text-white border-none shadow-none cursor-not-allowed" : "bg-brand-900 text-white hover:bg-brand-800"
                                )}
                            >
                                {isSoldOut ? 'Sold Out' : (currentQuantity === 0 ? 'Add to Basket' : `Update Basket (${currentQuantity})`)}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
