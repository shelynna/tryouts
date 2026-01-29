
import React, { useState, useEffect, useCallback } from 'react';
import { User, SystemSettings, Product } from '../../../types';
import { Button, Card } from '../../ui';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { useBasket } from '../../../context/BasketContext';
import { API } from '../../../lib/api';
import { env } from '../../../lib/env'; 
import { Logger } from '../../../lib/logger';
import { Crown, ArrowRight, Headphones, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { StatusCard } from './overview/StatusCard';
import { QuickActions } from './overview/QuickActions';
import { PaymentModal } from './modals/PaymentModal';
import { UpgradeModal } from './modals/UpgradeModal';
import { ASSETS } from '../../../assets';

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
    const { basket, totalValue, refreshBasket, updateLocalPayment } = useBasket();
    const [isPaying, setIsPaying] = useState<'IDLE' | 'PROCESSING' | 'VERIFYING'>('IDLE');
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [paymentType, setPaymentType] = useState<'PAYMENT' | 'SUBSCRIPTION'>('PAYMENT');

    const totalPaid = basket?.amountPaid || 0;
    const isEmpty = !basket || !basket.items || basket.items.length === 0;
    const remaining = Math.max(0, totalValue - totalPaid);
    const isFullyPaid = !isEmpty && remaining <= 0 && totalValue > 0;
    const progress = (!isEmpty && totalValue > 0) ? Math.min((totalPaid / totalValue) * 100, 100) : 0;
    const canRequestTopUp = progress >= 70 && progress < 100 && !basket?.topUpRequested && basket?.status === 'OPEN' && user.isSubscriber;
    const isLocked = basket?.status !== 'OPEN';

    // Fix: Only trigger auto-upgrade if explicit local intent exists (prevents loops/flickering)
    useEffect(() => {
        const checkIntent = () => {
            const localIntent = localStorage.getItem('sml_intent');
            if (localIntent === 'SUBSCRIBE' && !user.isSubscriber) {
                localStorage.removeItem('sml_intent');
                setPendingAmount(15);
                setPaymentType('SUBSCRIPTION');
                setUpgradeModalOpen(true); // Open info modal first for context
            }
        };
        checkIntent();
    }, [user.isSubscriber]);

    const initiatePayment = (amount: number, type: 'PAYMENT' | 'SUBSCRIPTION' = 'PAYMENT') => {
        if (!amount || amount <= 0) {
            onAction("Please enter a valid amount", "error");
            return;
        }
        setPendingAmount(amount);
        setPaymentType(type);
        setConfirmModalOpen(true);
    };

    const generateReference = () => {
        const text = Math.random().toString(36).substring(2, 12);
        return `SML-${text}-${Date.now()}`;
    };

    const proceedWithPayment = async () => {
        setConfirmModalOpen(false);
        setUpgradeModalOpen(false);
        setIsPaying('PROCESSING');
        const amount = pendingAmount;
        const type = paymentType;
        const reference = generateReference();

        try {
            const publicKey = env.VITE_PAYSTACK_PUBLIC_KEY;
            if (!publicKey) throw new Error("Payment System Error: Missing Public Key");

            const loadPaystackScript = (): Promise<boolean> => {
                return new Promise((resolve) => {
                    if (window.PaystackPop) { resolve(true); return; }
                    const script = document.createElement('script');
                    script.src = 'https://js.paystack.co/v1/inline.js';
                    script.async = true;
                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);
                    document.body.appendChild(script);
                });
            };

            // Async logic separated from the immediate callback return
            const processSuccess = async (response: any) => {
                setIsPaying('VERIFYING');
                const txRef = response.reference || reference;
                const basketId = type === 'SUBSCRIPTION' ? 'subscription_upgrade' : basket!.id;
                
                try {
                    await API.verifyPayment(txRef, basketId, amount);
                    
                    if (type === 'PAYMENT') {
                        updateLocalPayment(amount);
                        onAction(`Payment of ${formatCurrency(amount)} successful!`, "success");
                    } else if (type === 'SUBSCRIPTION') {
                        await refreshUser();
                        onAction("Welcome to Subscriber Tier!", "success");
                    }
                    await refreshBasket();
                } catch (verifyError: any) {
                    onAction("Verification delayed: " + verifyError.message, "info");
                    setTimeout(refreshBasket, 2000);
                } finally {
                    setIsPaying('IDLE');
                }
            };

            // Synchronous wrappers for Paystack
            const onPaystackSuccess = (response: any) => {
                processSuccess(response);
            };

            const onPaystackClose = () => {
                setIsPaying('IDLE');
                onAction("Payment cancelled", "info");
                
                const dateStr = new Date().toLocaleString('en-GB', { 
                    day: 'numeric', month: 'short', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                });

                const logMessage = `
${formatCurrency(amount)}

Transaction Details

Reference ${reference}

Status Cancelled

Date ${dateStr}
`.trim();
                
                Logger.info(logMessage, {
                    status: 'CANCELLED',
                    amount,
                    reference,
                    user: user.email
                });
            };

            const scriptLoaded = await loadPaystackScript();
            if (!scriptLoaded) throw new Error("Could not load payment gateway.");

            const handler = window.PaystackPop.setup({
                key: publicKey, 
                email: user.email,
                amount: amount * 100, // In kobo/pesewas
                currency: 'GHS',
                ref: reference,
                metadata: { 
                    custom_fields: [{ display_name: "Type", variable_name: "type", value: type }] 
                },
                callback: onPaystackSuccess,
                onClose: onPaystackClose
            });
            
            handler.openIframe();

        } catch (e: any) {
            setIsPaying('IDLE');
            onAction("Payment Error: " + e.message, "error");
        }
    };

    const copyReferral = () => {
        if (user.referralCode) {
            navigator.clipboard.writeText(user.referralCode);
            onAction("Referral code copied!", "success");
        } else {
            onAction("No referral code available", "error");
        }
    };

    const handleRequestTopUp = async () => {
        if (!basket) return;
        try {
            await API.requestTopUp(basket.id);
            await refreshBasket();
            onAction("Top-up requested!", "success");
        } catch (e: any) {
            onAction(e.message || "Failed to request top-up.", "error");
        }
    };

    return (
        <div className="pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <StatusCard 
                        basket={basket}
                        isEmpty={isEmpty}
                        isLocked={isLocked}
                        isFullyPaid={isFullyPaid}
                        remaining={remaining}
                        totalPaid={totalPaid}
                        totalValue={totalValue}
                        progress={progress}
                        onGoToShop={onGoToShop}
                        onInitiatePayment={(amt) => initiatePayment(amt)}
                        isPaying={isPaying === 'PROCESSING'}
                    />

                    {/* TOP-UP STATUS DISPLAY */}
                    {basket?.topUpStatus && basket.topUpStatus !== 'NONE' && (
                        <div className={`rounded-xl p-4 border flex flex-col md:flex-row gap-4 items-start ${
                            basket.topUpStatus === 'PENDING' ? 'bg-amber-50 border-amber-100' :
                            basket.topUpStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-100' :
                            'bg-red-50 border-red-100'
                        }`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                basket.topUpStatus === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                                basket.topUpStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                                'bg-red-100 text-red-600'
                            }`}>
                                {basket.topUpStatus === 'PENDING' ? <Clock size={20} /> :
                                 basket.topUpStatus === 'APPROVED' ? <CheckCircle size={20} /> :
                                 <AlertTriangle size={20} />}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold text-sm uppercase tracking-wide ${
                                    basket.topUpStatus === 'PENDING' ? 'text-amber-800' :
                                    basket.topUpStatus === 'APPROVED' ? 'text-emerald-800' :
                                    'text-red-800'
                                }`}>
                                    Top-Up Request {basket.topUpStatus}
                                </h4>
                                <p className="text-xs text-stone-600 mt-1">
                                    {basket.topUpStatus === 'PENDING' && "We are reviewing your request. This typically takes 24 hours."}
                                    {basket.topUpStatus === 'APPROVED' && `Credit approved! ${formatCurrency(basket.topUpAmount)} has been covered. Repay next cycle.`}
                                    {basket.topUpStatus === 'DENIED' && (
                                        <>
                                            Request declined. <br/>
                                            <strong>Reason:</strong> {basket.topUpDenialReason || "Criteria not met."}
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {!isEmpty && (
                        <Card className="hidden lg:block border border-stone-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-heading font-bold text-lg text-stone-900">
                                    Current Basket ({basket?.month || settings.cycleName})
                                </h3>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => refreshBasket()} className="text-stone-500" title="Refresh Basket">
                                        <RefreshCw size={14} />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={onGoToShop} className="text-brand-600">
                                        Manage Items <ArrowRight size={14} className="ml-1"/>
                                    </Button>
                                </div>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-stone-100">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] tracking-widest">
                                        <tr>
                                            <th className="px-4 py-3">Item</th>
                                            <th className="px-4 py-3 text-center">Qty</th>
                                            <th className="px-4 py-3 text-right">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 bg-white">
                                        {basket?.items.slice(0, 5).map((item, i) => (
                                            <tr key={i} className="hover:bg-stone-50">
                                                <td className="px-4 py-3 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0">
                                                        <img src={item.product?.image || ASSETS.PRODUCT_PLACEHOLDER} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                    <span className="font-medium text-stone-700">{item.product?.name}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-stone-500 font-mono">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right font-bold text-stone-900">{formatCurrency(item.totalPrice)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-4 space-y-6">
                    {!user.isSubscriber && (
                        <div className="bg-gradient-to-br from-brand-900 to-stone-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 bg-brand-50 rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                                        <Crown size={20} className="text-brand-300" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-brand-300">Premium</span>
                                </div>
                                <h3 className="font-heading font-bold text-xl mb-2">Upgrade to Subscriber</h3>
                                <p className="text-stone-300 text-sm mb-6 leading-loose">
                                    Unlock <strong>Top-Up Credit</strong>, exclusive deals, and priority delivery for just GHS 15.
                                </p>
                                <Button 
                                    size="md" 
                                    fullWidth
                                    onClick={() => { setPendingAmount(15); setPaymentType('SUBSCRIPTION'); setUpgradeModalOpen(true); }}
                                    className="bg-brand-50 hover:bg-brand-400 text-white border-none shadow-lg shadow-brand-500/30"
                                >
                                    Upgrade Account
                                </Button>
                            </div>
                        </div>
                    )}

                    <QuickActions 
                        onGoToShop={onGoToShop}
                        onCopyReferral={copyReferral}
                        onSupport={() => window.location.href = "mailto:support@smlghana.store"}
                        onRequestTopUp={handleRequestTopUp}
                        canRequestTopUp={canRequestTopUp}
                        isSubscriber={user.isSubscriber}
                        showTopUpError={(msg) => onAction(msg, 'error')}
                    />

                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Headphones size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-stone-900 text-sm">Need Help?</p>
                                <p className="text-xs text-stone-500">Contact Hall Rep</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => window.location.href = "tel:+233200000000"}>Call</Button>
                    </div>
                </div>
            </div>

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
