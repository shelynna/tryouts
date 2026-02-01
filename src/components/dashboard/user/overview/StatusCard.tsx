
import React, { useState, useEffect } from 'react';
import { Button, useToast } from '../../../ui';
import { formatCurrency, cn, generateSmlId } from '../../../../lib/utils';
import { Basket, BasketStatus } from '../../../../types';
import { API } from '../../../../lib/api';
import { motion } from 'framer-motion';
import { Check, XCircle, PackageCheck, CreditCard, ShoppingBag, ArrowRight, QrCode, Lock, Clock, AlertTriangle, Info } from 'lucide-react';

const MotionDiv = motion.div as any;

interface StatusCardProps {
    basket: Basket | undefined;
    userId: string;
    isEmpty: boolean;
    isLocked: boolean; // Derived from Cycle Status or Basket Status
    isFullyPaid: boolean;
    remaining: number;
    totalPaid: number;
    totalValue: number;
    progress: number;
    onGoToShop: () => void;
    onInitiatePayment: (amount: number) => void;
    isPaying: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
    basket, userId, isEmpty, isLocked, remaining, totalPaid, totalValue, progress,
    onGoToShop, onInitiatePayment, isPaying
}) => {
    const [paymentAmount, setPaymentAmount] = useState('');
    const [quickOptions, setQuickOptions] = useState<{label: string, value: number}[]>([]);
    const { showToast } = useToast();

    const isRollover = basket?.isRolledOver || false;
    const smlId = generateSmlId(userId);
    
    // Strict check for full payment before showing delivery status
    const isStrictlyPaid = (remaining <= 0.1 && totalValue > 0) || basket?.status === 'PAID';

    useEffect(() => {
        if (remaining > 0) {
            setQuickOptions([
                { label: '10%', value: Math.ceil(remaining * 0.1) },
                { label: '50%', value: Math.ceil(remaining * 0.5) },
                { label: 'Full', value: remaining }
            ]);
        }
    }, [remaining]);

    const handleQuickSelect = (amount: number) => {
        setPaymentAmount(amount.toString());
    };

    // 1. COLLECTED STATE
    if (basket?.status === BasketStatus.COLLECTED) {
        return (
            <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100 flex flex-col items-center text-center gap-4 shadow-sm">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-600 mb-2 shadow-sm">
                    <PackageCheck size={32} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-emerald-900">SMM Cycle Complete</h2>
                <p className="text-emerald-800/70 text-sm max-w-xs font-medium">
                    You have successfully collected your monthly items. See you in the next cycle!
                </p>
            </div>
        );
    }

    // 2. READY FOR COLLECTION STATE
    if (basket?.deliveryCode && isStrictlyPaid) {
        return (
            <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-xl flex flex-col items-start gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none -mr-16 -mt-16"></div>
                
                <div className="w-full text-left relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest">
                            <Check size={12} strokeWidth={3} /> Ready for Pickup
                        </div>
                        {basket.metadata?.pickupPoint && (
                            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                                At {basket.metadata.pickupPoint}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <div className="bg-stone-900 text-white p-5 rounded-3xl shrink-0 shadow-lg flex flex-col items-center justify-center text-center gap-2 min-w-[140px]">
                            <QrCode size={64} className="text-white mb-1" />
                            <p className="text-[10px] uppercase font-bold text-stone-400">Delivery Code</p>
                            <p className="text-xl font-mono font-bold tracking-widest">{basket.deliveryCode}</p>
                        </div>

                        <div className="space-y-4 flex-1">
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-100 p-1.5 rounded-full text-blue-600 shrink-0 mt-0.5"><Info size={16}/></div>
                                    <div>
                                        <h4 className="font-bold text-blue-900 text-sm mb-1">Collection Instructions</h4>
                                        <p className="text-sm text-blue-800 leading-relaxed">
                                            Your items are ready! Please go to your pickup point on Delivery Day. 
                                            Show your <strong className="font-mono bg-blue-100 px-1 rounded">SML ID: {smlId}</strong> and this code.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 3. MAIN STATE: Payment / Status Card
    return (
        <div className={cn(
            "rounded-[2.5rem] overflow-hidden relative transition-all duration-300 min-h-[320px] flex flex-col justify-between border",
            isLocked 
                ? "bg-stone-50 border-stone-200" 
                : "bg-white border-stone-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]"
        )}>
            {/* SMM Brand Background Effects */}
            {!isLocked && (
                <>
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-50/50 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
                </>
            )}

            <div className="p-8 md:p-10 relative z-10 flex flex-col h-full justify-between">
                
                {/* Top Section */}
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-[0.2em]", 
                                isLocked ? "text-orange-500" : "text-stone-500"
                            )}>
                                {isRollover ? 'Rollover Credit' : (isLocked ? 'Cycle Locked: Payment Only' : 'SMM Balance')}
                            </span>
                        </div>
                        
                        {isEmpty ? (
                            <div className="space-y-1">
                                <h2 className="text-3xl md:text-4xl font-heading font-bold text-stone-900">
                                    Start SMM Basket
                                </h2>
                                <p className="text-sm font-medium text-stone-400">
                                    Add items to secure your monthly stock.
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-5xl md:text-6xl font-heading font-bold tracking-tight tabular-nums text-stone-900">
                                    {remaining > 0 ? formatCurrency(remaining).replace('GHS', '').trim() : "PAID"}
                                </h2>
                                <span className="text-sm font-bold text-stone-400">GHS</span>
                            </div>
                        )}
                    </div>
                    
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border",
                        isLocked ? "bg-orange-50 border-orange-200 text-orange-500" : "bg-stone-100 border-stone-200 text-stone-900"
                    )}>
                        {isLocked ? <Lock size={20} /> : <CreditCard size={20} />}
                    </div>
                </div>

                {/* Progress Bar (Only if not empty) */}
                {!isEmpty && (
                    <div className="mt-8 mb-4">
                        <div className="flex justify-between text-xs font-bold mb-3 opacity-80 text-stone-500">
                            <span>Payment Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden bg-stone-100">
                            <MotionDiv 
                                className={cn(
                                    "h-full rounded-full", 
                                    progress >= 100 ? 'bg-emerald-500' : 'bg-brand-600'
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1 }}
                            />
                        </div>
                    </div>
                )}

                {/* Warning if Locked */}
                {isLocked && !isEmpty && remaining > 0 && (
                    <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-center gap-3 text-orange-800 text-xs font-medium mb-4">
                        <AlertTriangle size={16} />
                        <span>Cycle is locked. No new items can be added. Please complete payment.</span>
                    </div>
                )}

                {/* Bottom Actions */}
                <div className="mt-auto pt-6">
                    {!isEmpty && remaining > 0 ? (
                        <div className="space-y-4">
                            {/* Flexible Payment Input */}
                            <div className="bg-stone-50 rounded-2xl p-1 flex items-center border border-stone-200 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
                                <div className="relative flex-1">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">GHS</span>
                                    <input 
                                        type="number" 
                                        placeholder="Pay any amount..."
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-transparent text-stone-900 font-bold placeholder:text-stone-400 focus:outline-none h-12 text-lg"
                                        min="1"
                                    />
                                </div>
                                <Button 
                                    onClick={() => onInitiatePayment(parseFloat(paymentAmount))}
                                    loading={isPaying}
                                    disabled={!paymentAmount || isPaying || parseFloat(paymentAmount) <= 0}
                                    className="bg-stone-900 text-white hover:bg-stone-800 border-none px-6 rounded-xl h-10 shadow-lg font-bold"
                                >
                                    Pay Now
                                </Button>
                            </div>
                            
                            {/* Quick Percentages */}
                            <div className="flex gap-2 items-center">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide mr-1">Quick Add:</span>
                                {quickOptions.map((opt) => (
                                    <button 
                                        key={opt.label}
                                        onClick={() => handleQuickSelect(opt.value)} 
                                        className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:border-brand-500 hover:text-brand-700 text-stone-500 text-[10px] font-bold transition-all uppercase tracking-wider shadow-sm"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : isEmpty ? (
                        <Button onClick={onGoToShop} className="w-full md:w-auto bg-stone-900 text-white hover:bg-stone-800 border-none shadow-xl h-14 rounded-2xl px-8 text-base font-bold">
                            {isLocked ? "Cycle Locked" : "Start Shopping"} <ArrowRight size={18} className="ml-2" />
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
