
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Wallet } from 'lucide-react';
import { useBasket } from '../../context/BasketContext';
import { Button } from '../ui';
import { formatCurrency } from '../../lib/utils';
import { CartItem } from './CartItem';

const MotionDiv = motion.div as any;

interface CartDrawerProps {
    onNavigateToDashboard: () => void;
    onCheckout?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigateToDashboard, onCheckout }) => {
  const { 
    isCartOpen, closeCart, basket, 
    updateItem, removeItem,
    subtotal, discount, totalValue 
  } = useBasket();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleCheckout = () => {
      closeCart();
      if (onCheckout) {
          onCheckout();
      } else {
          onNavigateToDashboard();
      }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isCartOpen && (
        <>
          <MotionDiv
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[9998]"
          />
          
          <MotionDiv
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[9999] w-full max-w-md bg-stone-50 shadow-2xl flex flex-col border-l border-white/50"
          >
            {/* Header */}
            <div className="p-5 border-b border-stone-200 bg-white/80 backdrop-blur-md flex items-center justify-between">
                <h2 className="font-heading font-bold text-xl text-stone-900">Your Basket</h2>
                <button onClick={closeCart} className="p-2 rounded-full hover:bg-stone-100"><X size={20}/></button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F9FAFB]">
                {!basket || !basket.items || basket.items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                        <ShoppingBag size={48} className="mb-4 text-stone-300" />
                        <p className="font-bold text-stone-500">Your basket is empty</p>
                    </div>
                ) : (
                    basket.items.map(item => (
                        <CartItem 
                            key={item.productId}
                            item={item}
                            isLocked={false} 
                            onUpdate={updateItem}
                            onRemove={removeItem}
                        />
                    ))
                )}
            </div>

            {/* Summary & Checkout */}
            {basket && basket.items && basket.items.length > 0 && (
                <div className="p-6 bg-white border-t border-stone-200 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] pb-8">
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-stone-500 text-sm">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-emerald-600 font-bold text-sm">
                                <span>Discount</span>
                                <span>-{formatCurrency(discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-baseline pt-2 border-t border-stone-100">
                            <span className="font-bold text-stone-900">Total</span>
                            <span className="font-heading font-bold text-2xl text-brand-900">{formatCurrency(totalValue)}</span>
                        </div>
                    </div>

                    <Button 
                        fullWidth 
                        size="xl" 
                        onClick={handleCheckout} 
                        className="shadow-xl bg-stone-900 hover:bg-stone-800 flex items-center justify-between px-6"
                    >
                        <span className="flex items-center gap-2"><Wallet size={18} /> Checkout</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-mono">{formatCurrency(totalValue)}</span>
                    </Button>
                </div>
            )}
          </MotionDiv>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
