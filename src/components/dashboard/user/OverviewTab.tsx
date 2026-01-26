
import React, { useState, useEffect } from 'react';
import { User, SystemSettings, Product } from '../../../types';
import { Card, Button, Input, ProgressBar } from '../../ui';
import { CreditCard, Copy, Share2, Crown, CheckCircle, QrCode, ArrowRight, Wallet, ShoppingBag, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { useBasket } from '../../../context/BasketContext';
import { API } from '../../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
    interface Window {
        PaystackPop: any;
    }
}

interface OverviewTabProps {
    user: User;
    settings: SystemSettings;
    products: Product[];
    onGoToShop: () => void;
    onAction: (msg: string, type?: any) => void;
    refreshUser: () => Promise<void>;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ user, settings, products, onGoToShop, onAction, refreshUser }) => {
    const { basket, totalValue, refreshBasket } = useBasket();
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isPaying, setIsPaying] = useState(false);
    
    // Auto-trigger subscription if intent exists
    useEffect(() => {
        const checkIntent = async () => {
            const intent = localStorage.getItem('sml_intent');
            if (intent === 'SUBSCRIBE' && !user.isSubscriber) {
                // Clear intent so it doesn't loop
                localStorage.removeItem('sml_intent');
                // Small delay to ensure UI is ready
                setTimeout(() => {
                    if (confirm("You requested to become a Subscriber (GHS 15). Proceed to payment?")) {
                        handlePaystack(15, 'SUBSCRIPTION');
                    }
                }, 500);
            }
        };
        checkIntent();
    }, [user.isSubscriber]);

    // Calc totals
    const totalPaid = basket?.transactions?.reduce((acc, tx) => acc + (tx.status === 'SUCCESS' ? tx.amount : 0), 0) || 0;
    // Cap progress at 100%
    const progress = totalValue > 0 ? Math.min((totalPaid / totalValue) * 100, 100) : 0;
    const remaining = Math.max(0, totalValue - totalPaid);

    const handlePaystack = async (amount: number, type: 'PAYMENT' | 'SUBSCRIPTION' = 'PAYMENT') => {
        if (!amount || amount <= 0) return;
        setIsPaying(true);
        try {
            // Load Script
            if (!window.PaystackPop) {
                const script = document.createElement('script');
                script.src = 'https://js.paystack.co/v1/inline.js';
                script.async = true;
                document.body.appendChild(script);
                await new Promise(r => setTimeout(r, 1000));
            }

            const handler = window.PaystackPop.setup({
                key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY, 
                email: user.email,
                amount: amount * 100,
                currency: 'GHS',
                metadata: { custom_fields: [{ display_name: "Type", variable_name: "type", value: type }] },
                callback: async (response: any) => {
                    onAction("Verifying payment...", "info");
                    const basketId = type === 'PAYMENT' ? basket!.id : 'subscription_upgrade';
                    await API.verifyPayment(response.reference, basketId, amount);
                    onAction("Payment Successful!", "success");
                    await refreshBasket();
                    if(type === 'SUBSCRIPTION') await refreshUser();
                    setIsPaying(false);
                    setPaymentAmount('');
                },
                onClose: () => setIsPaying(false)
            });
            handler.openIframe();
        } catch (e) {
            setIsPaying(false);
            onAction("Payment failed to load", "error");
        }
    };

    const copyReferral = () => {
        if (user.referralCode) {
            navigator.clipboard.writeText(user.referralCode);
            onAction("Referral code copied!", "success");
        }
    };

    return (
        <div className="space-y-8 pb-20">
             
             {/* 1. STATUS HEADER: DELIVERY TICKET */}
             {basket?.deliveryCode ? (
                 <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-stone-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-8"
                 >
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #34d399 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                    
                    <div className="relative z-10 flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                             <span className="bg-emerald-500 text-stone-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle size={12} /> Ready for Pickup
                             </span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-mono font-bold tracking-tighter text-white mb-2">{basket.deliveryCode}</h2>
                        <p className="text-stone-400 text-sm max-w-lg">
                            Show this code at <strong>{user.pickupPoint}</strong>. This is your digital pass to collect your items.
                        </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-lg transform md:rotate-3 shrink-0">
                        <QrCode size={120} className="text-stone-900" />
                    </div>
                 </motion.div>
             ) : (
                /* WELCOME / EMPTY STATE HEADER */
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Cycle Dashboard</h2>
                        <p className="text-stone-500 max-w-xl">
                            {user.isSubscriber ? "You are a Premium Subscriber." : "You are on the Standard Plan."} 
                            Manage your basket payments and track delivery status here.
                        </p>
                    </div>
                    {!user.isSubscriber && (
                        <Button variant="outline" size="sm" onClick={() => handlePaystack(15, 'SUBSCRIPTION')} className="border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100">
                            <Crown size={14} className="mr-2"/> Upgrade to Subscriber (GHS 15)
                        </Button>
                    )}
                </div>
             )}

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 2. MAIN COLUMN: FINANCIALS & PAYMENT */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Pay Small Small Card */}
                    <Card className="border border-stone-200 shadow-md relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                                    <Wallet className="text-brand-500"/> Pay Small Small
                                </h3>
                                <p className="text-sm text-stone-500">Make installment payments via Mobile Money.</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Value</p>
                                <p className="text-2xl font-serif font-bold text-stone-900">{formatCurrency(totalValue)}</p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="mb-8">
                            <div className="flex justify-between mb-2 text-sm font-medium">
                                <span className="text-stone-900">Paid: <span className="text-brand-600 font-bold">{formatCurrency(totalPaid)}</span></span>
                                <span className="text-stone-500">{Math.round(progress)}% Complete</span>
                            </div>
                            <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
                                <motion.div 
                                    className={`h-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-brand-600'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1 }}
                                />
                            </div>
                            {remaining > 0 && (
                                <p className="text-xs text-stone-400 mt-2 text-right">Remaining: {formatCurrency(remaining)}</p>
                            )}
                        </div>

                        {/* Actions */}
                        {basket && basket.status === 'OPEN' ? (
                            remaining > 0 ? (
                                <div className="bg-stone-50 p-5 rounded-xl border border-stone-200">
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">GHS</span>
                                            <input 
                                                type="number" 
                                                placeholder="Amount"
                                                value={paymentAmount}
                                                onChange={e => setPaymentAmount(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 font-bold text-lg"
                                            />
                                        </div>
                                        <Button 
                                            size="lg"
                                            onClick={() => handlePaystack(parseFloat(paymentAmount))}
                                            loading={isPaying}
                                            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                                            className="px-8 shadow-lg shadow-brand-900/20"
                                        >
                                            Pay
                                        </Button>
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <button 
                                            onClick={() => handlePaystack(remaining)}
                                            className="text-xs font-bold text-brand-600 hover:text-brand-800 underline decoration-dotted"
                                        >
                                            Pay remaining {formatCurrency(remaining)}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex items-center gap-3 font-medium">
                                    <CheckCircle size={20} />
                                    <span>Basket fully paid! Waiting for delivery code generation...</span>
                                </div>
                            )
                        ) : (
                             <div className="bg-stone-50 p-4 rounded-xl text-center text-stone-500 italic border border-stone-100">
                                 Basket is locked or completed.
                             </div>
                        )}
                    </Card>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={onGoToShop} className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-brand-400 hover:shadow-md transition-all text-left group">
                            <ShoppingBag className="text-stone-400 group-hover:text-brand-500 mb-3" />
                            <h4 className="font-bold text-stone-900">Marketplace</h4>
                            <p className="text-xs text-stone-500 mt-1">Add items to basket</p>
                        </button>
                        <div className="bg-white p-5 rounded-2xl border border-stone-200 text-left">
                            <Clock className="text-stone-400 mb-3" />
                            <h4 className="font-bold text-stone-900">Next Delivery</h4>
                            <p className="text-xs text-stone-500 mt-1">{formatDate(settings.deliveryDate)}</p>
                        </div>
                    </div>
                </div>

                {/* 3. SIDE COLUMN: REFERRAL & PROFILE */}
                <div className="space-y-6">
                    
                    {/* Referral Card */}
                    <Card className="bg-gradient-to-br from-brand-900 to-brand-800 text-white border-none shadow-xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                         
                         <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4 text-brand-200 font-bold text-xs uppercase tracking-widest">
                                <Share2 size={14} /> Refer & Earn
                            </div>
                            <h3 className="text-xl font-serif font-bold mb-2">Invite Friends</h3>
                            <p className="text-brand-100 text-sm mb-6 leading-relaxed">
                                Share your code. When friends join and pay, you get discount credits.
                            </p>
                            
                            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10 mb-4">
                                <p className="text-[10px] uppercase text-brand-300 font-bold mb-1">Your Unique Code</p>
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xl font-bold tracking-wider">{user.referralCode || "Loading..."}</span>
                                    <button onClick={copyReferral} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                         </div>
                    </Card>

                    {/* Profile Summary */}
                    <Card className="border-stone-100">
                        <h4 className="font-bold text-stone-900 mb-4 text-sm uppercase tracking-wider">Your Profile</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-stone-500">Name</span>
                                <span className="font-bold text-stone-900 text-right">{user.fullName}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-stone-500">Pickup Point</span>
                                <span className="font-bold text-stone-900 text-right">{user.pickupPoint}</span>
                            </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-stone-500">Status</span>
                                <span className={`font-bold px-2 py-0.5 rounded text-xs ${user.isSubscriber ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-stone-600'}`}>
                                    {user.isSubscriber ? 'Subscriber' : 'Standard'}
                                </span>
                            </div>
                        </div>
                    </Card>

                </div>

             </div>
        </div>
    );
};
