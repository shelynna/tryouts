
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, ArrowRight, AlertCircle, ShieldCheck, Ticket, Plus, LayoutDashboard } from 'lucide-react';
import { useBasket } from '../../context/BasketContext';
import { Button, useToast } from '../ui';
import { formatCurrency } from '../../lib/utils';
import { BasketStatus } from '../../types';
import { CartItem } from './CartItem';

const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;

interface CartDrawerProps {
    onNavigateToDashboard: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigateToDashboard }) => {
  const { 
    isCartOpen, closeCart, basket, 
    updateItem, removeItem, applyCoupon, removeCoupon,
    subtotal, serviceFee, totalValue, discount 
  } = useBasket();
  
  const { showToast } = useToast();
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  const isLocked = basket?.status !== BasketStatus.OPEN && basket !== undefined;

  const handleGoToDashboard = () => {
      closeCart();
      onNavigateToDashboard();
  };

  const handleApplyCoupon = async () => {
      if (!couponInput.trim()) return;
      setIsApplyingCoupon(true);
      try {
          const amount = await applyCoupon(couponInput);
          showToast(`Coupon applied! Saved ${formatCurrency(amount)}`, 'success');
          setCouponInput('');
      } catch (e: any) {
          showToast(e.message || "Invalid coupon", 'error');
      } finally {
          setIsApplyingCoupon(false);
      }
  };

  const handleRemoveCoupon = async () => {
      try {
          await removeCoupon();
          showToast("Coupon removed", 'info');
      } catch (e) {
          showToast("Failed to remove coupon", 'error');
      }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[9998]"
          />
          
          {/* Drawer */}
          <MotionDiv
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[9999] w-full max-w-md bg-stone-50 shadow-2xl flex flex-col border-l border-white/50"
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
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-100 animate-in fade-in duration-500">
                        <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center relative">
                            <ShoppingBag size={40} className="text-stone-300" strokeWidth={1.5} />
                            <div className="absolute bottom-0 right-0 bg-stone-200 p-2 rounded-full border-4 border-stone-50 shadow-sm">
                                <Plus size={20} className="text-stone-400" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-serif font-bold text-xl text-stone-900 mb-2">Your basket is empty</h3>
                            <p className="font-medium text-stone-500 max-w-xs mx-auto text-sm leading-relaxed">
                                Start adding essentials like rice, oil, and canned goods to secure your monthly stock.
                            </p>
                        </div>
                        <Button onClick={closeCart} className="shadow-lg shadow-brand-900/10 rounded-full px-8 h-12">
                            Start Shopping
                        </Button>
                    </div>
                ) : (
                    <AnimatePresence>
                        {basket.items.map((item) => (
                            <CartItem 
                                key={item.productId}
                                item={item}
                                isLocked={isLocked}
                                onUpdate={updateItem}
                                onRemove={removeItem}
                            />
                        ))}
                    </AnimatePresence>
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
                        {/* Coupon Section */}
                        <div className="pb-3 border-b border-stone-100">
                            {basket.couponCode ? (
                                 <MotionDiv 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center justify-between bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100"
                                 >
                                    <div className="flex items-center gap-2">
                                        <Ticket size={16} className="text-emerald-600" />
                                        <span className="text-sm font-bold text-emerald-900">{basket.couponCode} Applied</span>
                                    </div>
                                    <button onClick={handleRemoveCoupon} className="text-emerald-400 hover:text-emerald-700 transition-colors p-1"><X size={14}/></button>
                                 </MotionDiv>
                            ) : (
                                 <div className="flex gap-2">
                                    <input 
                                        placeholder="Promo Code" 
                                        value={couponInput}
                                        onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                        className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 focus:bg-white uppercase font-mono placeholder:normal-case placeholder:font-sans"
                                        disabled={isLocked}
                                    />
                                    <Button 
                                        size="sm" 
                                        variant="secondary" 
                                        onClick={handleApplyCoupon} 
                                        disabled={!couponInput || isLocked || isApplyingCoupon}
                                        loading={isApplyingCoupon}
                                        className="h-auto"
                                    >
                                        Apply
                                    </Button>
                                 </div>
                            )}
                        </div>

                        <div className="flex justify-between text-sm text-stone-500">
                            <span>Subtotal</span>
                            <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-stone-500">
                            <span className="flex items-center gap-1">Service Fee <ShieldCheck size={12} className="text-stone-400"/></span>
                            <span className="tabular-nums">{formatCurrency(serviceFee)}</span>
                        </div>
                        {discount > 0 && (
                            <MotionDiv 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex justify-between text-sm text-emerald-600 font-bold"
                            >
                                <span>Discount</span>
                                <span className="tabular-nums">-{formatCurrency(discount)}</span>
                            </MotionDiv>
                        )}
                        <div className="flex justify-between text-xl font-serif font-bold text-brand-900 pt-2 items-baseline">
                            <span className="text-base font-sans font-normal text-stone-500">Total Value</span>
                            <MotionSpan 
                                key={totalValue} 
                                initial={{ scale: 1.1, color: '#2A9D8F' }}
                                animate={{ scale: 1, color: '#134440' }}
                                className="tabular-nums"
                            >
                                {formatCurrency(totalValue)}
                            </MotionSpan>
                        </div>
                    </div>
                )}

                <Button 
                    fullWidth 
                    size="xl" 
                    onClick={handleGoToDashboard} 
                    className="shadow-xl shadow-brand-900/20 group relative overflow-hidden"
                    disabled={!basket || !basket.items || basket.items.length === 0}
                >
                    <span className="relative z-10 flex items-center gap-2">
                        {basket && basket.items && basket.items.length > 0 
                            ? "Go to Dashboard to Pay" 
                            : "Start Shopping"
                        } 
                        <LayoutDashboard size={18} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                </Button>
                
                {basket && basket.items && basket.items.length > 0 && (
                    <p className="text-[10px] text-center text-stone-400 mt-4">
                        <strong>Pay Small-Small:</strong> Choose your installment amount on the dashboard.
                    </p>
                )}
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
