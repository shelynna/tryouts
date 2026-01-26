
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { useBasket } from '../../context/BasketContext';
import { Button } from '../ui';
import { formatCurrency } from '../../lib/utils';
import { BasketStatus } from '../../types';
import { ASSETS } from '../../assets';
import { cn } from '../ui/utils';

interface CartDrawerProps {
    onNavigateToDashboard: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigateToDashboard }) => {
  const { 
    isCartOpen, closeCart, basket, 
    updateItem, removeItem, 
    subtotal, serviceFee, totalValue 
  } = useBasket();
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const isLocked = basket?.status !== BasketStatus.OPEN && basket !== undefined;

  const handleCheckout = () => {
      closeCart();
      onNavigateToDashboard();
  };

  const handleUpdate = async (productId: string, delta: number) => {
      if (updatingId) return;
      setUpdatingId(productId);
      try {
          await updateItem(productId, delta);
      } finally {
          setUpdatingId(null);
      }
  };

  const handleRemove = async (productId: string) => {
      if (updatingId) return;
      setUpdatingId(productId);
      try {
          await removeItem(productId);
      } finally {
          setUpdatingId(null);
      }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[101] w-full max-w-md bg-stone-50 shadow-2xl flex flex-col border-l border-white/50"
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
                <div>
                    <h2 className="font-serif font-bold text-2xl text-stone-900 tracking-tight">Your Basket</h2>
                    <p className="text-sm text-stone-500">{basket?.items?.length || 0} items selected</p>
                </div>
                <button 
                    onClick={closeCart} 
                    className="w-10 h-10 flex items-center justify-center hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-colors"
                >
                    <X size={22} />
                </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {!basket || !basket.items || basket.items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-80">
                        <div className="w-24 h-24 bg-stone-200 rounded-full flex items-center justify-center">
                            <ShoppingBag size={40} className="text-stone-400" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="font-serif font-bold text-xl text-stone-900 mb-2">Your basket is empty</h3>
                            <p className="font-medium text-stone-500 max-w-xs mx-auto">
                                Start adding essentials like rice and oil to secure your monthly stock.
                            </p>
                        </div>
                        <Button onClick={closeCart} className="shadow-lg shadow-brand-900/10">Start Shopping</Button>
                    </div>
                ) : (
                    basket.items.map((item) => {
                        const product = item.product;
                        const fallbackName = "Product Item";
                        const isUpdatingThis = updatingId === item.productId;
                        
                        return (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={item.productId} 
                                className="bg-white p-3 pr-4 rounded-2xl shadow-sm border border-stone-100 flex gap-4 group relative overflow-hidden"
                            >
                                {/* Normalized Thumbnail */}
                                <div className="w-20 h-20 bg-[#F3F4F6] border border-stone-100 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center">
                                    <img 
                                        src={product?.image || ASSETS.PRODUCT_RICE} 
                                        alt={product?.name || fallbackName} 
                                        className="w-full h-full object-contain p-2" 
                                        onError={(e) => { 
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null; 
                                            target.src = ASSETS.PRODUCT_RICE; 
                                        }}
                                    />
                                    {isUpdatingThis && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                                            <Loader2 size={24} className="text-stone-900 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{product?.name || fallbackName}</h4>
                                            <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">{product?.size}</p>
                                        </div>
                                        <span className="font-serif font-bold text-brand-900 text-sm">
                                            {formatCurrency(item.unitPrice * item.quantity)}
                                        </span>
                                    </div>

                                    {!isLocked ? (
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
                                                <button 
                                                    onClick={() => handleUpdate(item.productId, -1)}
                                                    disabled={isUpdatingThis}
                                                    className="w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-stone-600 hover:text-red-500 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <span className="text-xs font-bold w-6 text-center tabular-nums">
                                                    {item.quantity}
                                                </span>
                                                <button 
                                                    onClick={() => handleUpdate(item.productId, 1)}
                                                    disabled={isUpdatingThis}
                                                    className="w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-brand-600 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                            <button 
                                                onClick={() => handleRemove(item.productId)}
                                                disabled={isUpdatingThis}
                                                className="text-stone-300 hover:text-red-500 transition-colors p-2 disabled:opacity-50"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                         <div className="mt-2 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded inline-block font-bold">
                                             Locked
                                         </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Footer / Summary */}
            <div className="p-6 bg-white border-t border-stone-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] relative z-20">
                {isLocked && (
                    <div className="mb-4 bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-start gap-3">
                        <AlertCircle className="text-orange-500 shrink-0" size={18} />
                        <p className="text-xs text-orange-800 leading-relaxed">
                            <strong>Basket Locked:</strong> Modifications are disabled because the monthly cycle has closed or you have checked out.
                        </p>
                    </div>
                )}
                
                {basket && basket.items && basket.items.length > 0 && (
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-stone-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-stone-500">
                            <span className="flex items-center gap-1">Service Fee <ShieldCheck size={12} className="text-stone-400"/></span>
                            <span>{formatCurrency(serviceFee)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-serif font-bold text-brand-900 pt-4 border-t border-stone-100 items-baseline">
                            <span className="text-base font-sans font-normal text-stone-500">Total Payable</span>
                            <span>{formatCurrency(totalValue)}</span>
                        </div>
                    </div>
                )}

                <Button 
                    fullWidth 
                    size="xl" 
                    onClick={handleCheckout} 
                    className="shadow-xl shadow-brand-900/20 group relative overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        {basket && basket.items && basket.items.length > 0 
                            ? "Proceed to Payment" 
                            : "Start Shopping"
                        } 
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                </Button>
                
                {basket && basket.items && basket.items.length > 0 && (
                    <p className="text-[10px] text-center text-stone-400 mt-4">
                        Payments are secure and flexible. Pay what you can, when you can.
                    </p>
                )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
