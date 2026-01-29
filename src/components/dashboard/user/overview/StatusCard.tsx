
import React, { useState, useEffect } from 'react';
import { Button } from '../../../ui';
import { formatCurrency, cn } from '../../../../lib/utils';
import { Basket, BasketStatus } from '../../../../types';
import { motion } from 'framer-motion';
import { Check, XCircle, PackageCheck, CreditCard, Lock, ArrowRight, QrCode, RefreshCw } from 'lucide-react';

const MotionDiv = motion.div as any;

interface StatusCardProps {
    basket: Basket | undefined;
    isEmpty: boolean;
    isLocked: boolean;
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
    basket, isEmpty, isLocked, remaining, totalPaid, totalValue, progress,
    onGoToShop, onInitiatePayment, isPaying
}) => {
    const [paymentAmount, setPaymentAmount] = useState('');
    const [quickOptions, setQuickOptions] = useState<{label: string, value: number}[]>([]);

    const isRollover = basket?.month.includes('Rollover') || false;

    // Calculate dynamic percentages based on remaining balance
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

    if (basket?.status === BasketStatus.COLLECTED) {
        return (
            <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100 flex flex-col items-center text-center gap-4 shadow-sm">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-600 mb-2 shadow-sm">
                    <PackageCheck size={32} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-emerald-900">Order Completed</h2>
                <p className="text-emerald-800/70 text-sm max-w-xs font-medium">
                    You have successfully collected your items for <strong>{basket.month}</strong>.
                </p>
            </div>
        );
    }

    if (basket?.status === BasketStatus.CANCELLED) {
        return (
            <div className="bg-red-50 rounded-[2rem] p-8 border border-red-100 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-red-600 mb-2 shadow-sm">
                    <XCircle size={32} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-red-900">Order Cancelled</h2>
                <p className="text-red-700/70 text-sm">Please contact support for assistance.</p>
            </div>
        );
    }

    if (basket?.deliveryCode) {
        return (
            <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none -mr-16 -mt-16"></div>
                
                <div className="text-center md:text-left relative z-10">
                    <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest mb-6">
                        <Check size={12} strokeWidth={3} /> Ready for Collection
                    </div>
                    <h2 className="text-5xl md:text-6xl font-mono font-bold tracking-tighter text-stone-900 mb-2 tabular-nums">
                        {basket.deliveryCode}
                    </h2>
                    <p className="text-stone-500 text-sm font-medium">Present this secure code at your pickup point.</p>
                </div>
                <div className="bg-stone-900 p-5 rounded-3xl shrink-0 shadow-2xl rotate-3 transition-transform hover:rotate-0">
                    <QrCode size={100} className="text-white" />
                </div>
            </div>
        );
    }

    // MAIN STATE: WHITE CARD
    return (
        <div className={cn(
            "rounded-[2.5rem] overflow-hidden relative transition-all duration-300 min-h-[320px] flex flex-col justify-between border",
            isLocked 
                ? "bg-stone-100 border-stone-200" 
                : "bg-white border-stone-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]"
        )}>
            {/* Background Effects - Subtle Light */}
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
                                isLocked ? "text-stone-400" : "text-stone-500"
                            )}>
                                {isLocked ? 'Status: Locked' : 'Outstanding Balance'}
                            </span>
                            {basket?.month && (
                                <span className="text-[9px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-bold border border-brand-100 uppercase tracking-wide">
                                    {basket.month}
                                </span>
                            )}
                        </div>
                        
                        {isEmpty ? (
                            <div className="space-y-1">
                                <h2 className="text-3xl md:text-4xl font-heading font-bold text-stone-900">
                                    No Active Order
                                </h2>
                                <p className="text-sm font-medium text-stone-400">
                                    Your basket is empty.
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
                        isLocked ? "bg-white border-stone-200 text-stone-400" : "bg-stone-100 border-stone-200 text-stone-900"
                    )}>
                        {isLocked ? <Lock size={20} /> : <CreditCard size={20} />}
                    </div>
                </div>

                {/* Progress Bar (Only if not empty) */}
                {!isEmpty && (
                    <div className="mt-8 mb-4">
                        <div className="flex justify-between text-xs font-bold mb-3 opacity-80 text-stone-500">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden bg-stone-100">
                            <MotionDiv 
                                className={cn(
                                    "h-full rounded-full", 
                                    progress >= 100 ? 'bg-emerald-500' : isLocked ? 'bg-stone-400' : 'bg-brand-600'
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1 }}
                            />
                        </div>
                    </div>
                )}

                {/* Bottom Actions */}
                <div className="mt-auto pt-6">
                    {!isLocked && !isEmpty && remaining > 0 ? (
                        <div className="space-y-4">
                            <div className="bg-stone-50 rounded-2xl p-1 flex items-center border border-stone-200 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
                                <div className="relative flex-1">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">GHS</span>
                                    <input 
                                        type="number" 
                                        placeholder="Amount..."
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-transparent text-stone-900 font-bold placeholder:text-stone-400 focus:outline-none h-12 text-lg"
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
                            
                            <div className="flex gap-2">
                                {quickOptions.map((opt) => (
                                    <button 
                                        key={opt.label}
                                        onClick={() => handleQuickSelect(opt.value)} 
                                        className="px-4 py-2 rounded-xl bg-white border border-stone-200 hover:border-brand-500 hover:text-brand-700 text-stone-500 text-[10px] font-bold transition-all uppercase tracking-wider shadow-sm"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : isEmpty && !isLocked ? (
                        <Button onClick={onGoToShop} className="w-full md:w-auto bg-stone-900 text-white hover:bg-stone-800 border-none shadow-xl h-14 rounded-2xl px-8 text-base font-bold">
                            Start Shopping <ArrowRight size={18} className="ml-2" />
                        </Button>
                    ) : isLocked ? (
                        <div className="p-4 bg-stone-200/50 rounded-2xl text-center text-xs text-stone-500 font-bold border border-stone-200">
                            {isRollover ? (
                                <span className="flex items-center justify-center gap-2"><RefreshCw size={14}/> Rollover Balance Active</span>
                            ) : (
                                <span>Cycle Locked. Processing orders.</span>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
