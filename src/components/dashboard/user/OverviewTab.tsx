
import React, { useState, useEffect } from 'react';
import { User, SystemSettings, Product, Basket } from '../../../types';
import { Button, Card, Skeleton } from '../../ui';
import { formatCurrency } from '../../../lib/utils';
import { useBasket } from '../../../context/BasketContext';
import { API } from '../../../lib/api';
import { Crown, ArrowRight, Headphones, RefreshCw, AlertTriangle, Clock, ShoppingBag } from 'lucide-react';
import { StatusCard } from './overview/StatusCard';
import { QuickActions } from './overview/QuickActions';
import { PaymentModal } from './modals/PaymentModal';
import { UpgradeModal } from './modals/UpgradeModal';
import { ASSETS } from '../../../assets';
import { useNavigate } from 'react-router-dom';
import { usePaymentProcessor } from '../../../hooks/usePaymentProcessor';
import { CountdownTimer } from '../../user/CountdownTimer';

interface OverviewTabProps {
    user: User;
    settings: SystemSettings;
    products: Product[];
    onGoToShop: () => void;
    onAction: (msg: string, type?: any) => void;
    refreshUser: () => Promise<void>;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ user, settings, products, onGoToShop, onAction, refreshUser }) => {
    const { basket, outstandingBaskets, refreshBasket, activeCycle } = useBasket();
    const navigate = useNavigate();
    const { processPayment, isProcessing } = usePaymentProcessor();
    
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [paymentType, setPaymentType] = useState<'PAYMENT' | 'SUBSCRIPTION'>('PAYMENT');
    const [targetBasketId, setTargetBasketId] = useState<string | undefined>(undefined);

    const totalPaid = basket?.amountPaid || 0;
    const totalValue = basket?.totalValue || 0;
    const isEmpty = !basket || !basket.items || basket.items.length === 0;
    
    const isPaidStatus = basket?.status === 'PAID' || basket?.status === 'COLLECTED' || basket?.status === 'DELIVERED';
    const remaining = isPaidStatus ? 0 : Math.max(0, totalValue - totalPaid);
    
    const progress = (!isEmpty && totalValue > 0) ? (isPaidStatus ? 100 : Math.min((totalPaid / totalValue) * 100, 100)) : 0;
    
    const canRequestTopUp = progress >= 70 && progress < 100 && !basket?.topUpRequested && basket?.status === 'OPEN' && user.isSubscriber;

    useEffect(() => {
        const checkIntent = () => {
            const localIntent = localStorage.getItem('sml_intent');
            const hasSubscriberIntent = (localIntent === 'SUBSCRIBE') || (user.planIntent === 'SUBSCRIBER');
            
            if (hasSubscriberIntent && !user.isSubscriber) {
                localStorage.removeItem('sml_intent');
                setPendingAmount(15);
                setPaymentType('SUBSCRIPTION');
                setUpgradeModalOpen(true);
            }
        };
        const t = setTimeout(checkIntent, 500);
        return () => clearTimeout(t);
    }, [user.isSubscriber, user.planIntent]);

    const initiatePayment = (amount: number, basketId?: string, type: 'PAYMENT' | 'SUBSCRIPTION' = 'PAYMENT') => {
        if (!amount || amount <= 0) {
            onAction("Please enter a valid amount", "error");
            return;
        }
        setPendingAmount(amount);
        setPaymentType(type);
        setTargetBasketId(basketId || basket?.id);
        setConfirmModalOpen(true);
    };

    const proceedWithPayment = async () => {
        setConfirmModalOpen(false);
        setUpgradeModalOpen(false);
        
        const pBasketId = targetBasketId || basket?.id;

        if (paymentType === 'PAYMENT' && !pBasketId) {
            onAction("No active basket found to pay for.", "error");
            return;
        }

        await processPayment(pendingAmount, user, pBasketId, paymentType, async () => {
            if (paymentType === 'SUBSCRIPTION') await refreshUser();
        });
    };

    return (
        <div className="pb-20 space-y-8">
            
            {/* 1. OUTSTANDING ALERTS */}
            {outstandingBaskets && outstandingBaskets.length > 0 && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 px-1">
                        <AlertTriangle className="text-orange-500" size={18} />
                        <h3 className="font-heading font-bold text-stone-900 text-lg">Outstanding Baskets</h3>
                    </div>
                    {outstandingBaskets.map(b => (
                        <StatusCard 
                            key={b.id}
                            userId={user.id}
                            basket={b}
                            isEmpty={false}
                            isLocked={true}
                            isFullyPaid={false}
                            remaining={b.balance}
                            totalPaid={b.amountPaid}
                            totalValue={b.totalValue}
                            progress={(b.amountPaid/b.totalValue)*100}
                            onGoToShop={() => {}} 
                            onInitiatePayment={(amt) => initiatePayment(amt, b.id)}
                            isPaying={isProcessing && targetBasketId === b.id}
                        />
                    ))}
                </div>
            )}

            {/* 2. MAIN STATUS CARD */}
            <div>
                <div className="flex items-center justify-between px-1 mb-4">
                    <h3 className="font-heading font-bold text-stone-900 text-lg flex items-center gap-2">
                        <Clock className="text-brand-600" size={18} /> Current Cycle Status
                    </h3>
                </div>
                
                {/* Countdown Timer Integration */}
                {activeCycle && (activeCycle.status === 'OPEN' || activeCycle.status === 'active') && (
                    <div className="mb-6">
                        <CountdownTimer cycle={activeCycle} user={user} />
                    </div>
                )}

                <StatusCard 
                    userId={user.id}
                    basket={basket}
                    isEmpty={isEmpty}
                    isLocked={false}
                    isFullyPaid={remaining <= 0 && !isEmpty}
                    remaining={remaining}
                    totalPaid={totalPaid}
                    totalValue={totalValue}
                    progress={progress}
                    onGoToShop={onGoToShop}
                    onInitiatePayment={(amt) => initiatePayment(amt, basket?.id)}
                    isPaying={isProcessing && targetBasketId === basket?.id}
                />
            </div>

            {/* 3. QUICK ACTIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Quick Actions */}
                <div className="md:col-span-1">
                    <QuickActions 
                        onGoToShop={onGoToShop}
                        onCopyReferral={() => {
                            if (user.referralCode) {
                                navigator.clipboard.writeText(user.referralCode);
                                onAction("Referral code copied!", "success");
                            }
                        }}
                        onSupport={() => window.location.href = "mailto:support@smlghana.store"}
                        onRequestTopUp={async () => {
                            if (!basket) return;
                            try {
                                await API.requestTopUp(basket.id);
                                await refreshBasket();
                                onAction("Top-up requested!", "success");
                            } catch (e: any) {
                                onAction(e.message, "error");
                            }
                        }}
                        canRequestTopUp={canRequestTopUp}
                        isSubscriber={user.isSubscriber}
                        showTopUpError={(msg) => onAction(msg, 'error')}
                    />
                </div>

                {/* Support / Help */}
                <div className="md:col-span-1 space-y-4">
                    {!user.isSubscriber && (
                        <div 
                            onClick={() => navigate('/subscription/plans')}
                            className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm cursor-pointer group hover:border-brand-200 hover:shadow-md transition-all relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 bg-brand-50 rounded-full blur-xl -mr-6 -mt-6"></div>
                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                <div className="bg-brand-100 p-2 rounded-lg text-brand-700">
                                    <Crown size={20} />
                                </div>
                                <h4 className="font-bold text-stone-900 text-sm">Become a Subscriber</h4>
                            </div>
                            <p className="text-stone-500 text-xs mb-3 leading-relaxed relative z-10">
                                Unlock Top-Ups, Deals, and Priority Delivery for GHS 15.
                            </p>
                            <span className="text-brand-600 text-xs font-bold flex items-center group-hover:translate-x-1 transition-transform relative z-10">
                                View Plans <ArrowRight size={14} className="ml-1"/>
                            </span>
                        </div>
                    )}

                    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center">
                                <Headphones size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-stone-900 text-sm">Need Help?</p>
                                <p className="text-[10px] text-stone-500 uppercase tracking-wider">Hall Rep Contact</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => window.location.href = "tel:+233550000000"}>Call</Button>
                    </div>
                </div>
            </div>

            {/* 4. CURRENT BASKET ITEMS */}
            {!isEmpty && basket && (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/30">
                        <h3 className="font-heading font-bold text-lg text-stone-900 flex items-center gap-2">
                            <ShoppingBag size={18} className="text-stone-400"/> Basket Items
                        </h3>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => refreshBasket()} className="text-stone-400 hover:text-stone-600">
                                <RefreshCw size={14} />
                            </Button>
                            <Button variant="outline" size="sm" onClick={onGoToShop} className="text-xs h-8">
                                Manage
                            </Button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] tracking-widest border-b border-stone-100">
                                <tr>
                                    <th className="px-5 py-3">Product</th>
                                    <th className="px-5 py-3 text-center">Qty</th>
                                    <th className="px-5 py-3 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 bg-white">
                                {basket.items.slice(0, 5).map((item, i) => (
                                    <tr key={i} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-5 py-3 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0">
                                                <img src={item.product?.image || ASSETS.PRODUCT_PLACEHOLDER} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-stone-800 text-xs">{item.product?.name}</p>
                                                <p className="text-[10px] text-stone-400 uppercase">{item.product?.size}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center text-stone-600 font-mono text-xs">{item.quantity}</td>
                                        <td className="px-5 py-3 text-right font-bold text-stone-900 text-xs">{formatCurrency(item.totalPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {basket.items.length > 5 && (
                        <div className="p-3 text-center border-t border-stone-100 bg-stone-50">
                            <button onClick={onGoToShop} className="text-xs font-bold text-stone-500 hover:text-stone-800">
                                + {basket.items.length - 5} more items
                            </button>
                        </div>
                    )}
                </div>
            )}

            <PaymentModal 
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                amount={pendingAmount}
                type={paymentType}
                onConfirm={proceedWithPayment}
            />

            <UpgradeModal 
                isOpen={upgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
                onProceed={() => { setConfirmModalOpen(true); }}
            />
        </div>
    );
};
