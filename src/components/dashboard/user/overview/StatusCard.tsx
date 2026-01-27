
import React, { useState } from 'react';
import { Card, Button } from '../../../ui';
import { formatCurrency, cn } from '../../../../lib/utils';
import { Basket, BasketStatus } from '../../../../types';
import { motion } from 'framer-motion';
import { Check, ShoppingBag, XCircle, PackageCheck, AlertTriangle, CreditCard, Lock, ArrowRight } from 'lucide-react';

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
    basket, isEmpty, isLocked, isFullyPaid, remaining, totalPaid, totalValue, progress,
    onGoToShop, onInitiatePayment, isPaying
}) => {
    const [paymentAmount, setPaymentAmount] = useState('');

    // --- STATES THAT REPLACE THE CARD COMPLETELY ---

    // State: Collected
    if (basket?.status === BasketStatus.COLLECTED) {
        return (
            <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                    <PackageCheck size={32} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-emerald-900">Order Completed</h2>
                <p className="text-emerald-700 text-sm max-w-xs">
                    You have successfully collected your items for <strong>{basket.month}</strong>.
                </p>
            </div>
        );
    }

    // State: Cancelled
    if (basket?.status === BasketStatus.CANCELLED) {
        return (
            <div className="bg-red-50 rounded-3xl p-8 border border-red-100 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
                    <XCircle size={32} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-red-900">Order Cancelled</h2>
                <p className="text-red-700 text-sm">Please contact support.</p>
            </div>
        );
    }

    // State: Delivery Ready (QR Code)
    if (basket?.deliveryCode) {
        return (
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                    <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest mb-4">
                        <Check size={14} /> Ready for Collection
                    </div>
                    <h2 className="text-4xl md:text-5xl font-mono font-bold tracking-tighter text-stone-900 mb-2">{basket.deliveryCode}</h2>
                    <p className="text-stone-500 text-sm">Present this code at your pickup point</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 shrink-0">
                    <i className='bx bx-qr text-[120px] text-stone-900 leading-none'></i>
                </div>
            </div>
        );
    }

    // --- MAIN FINANCIAL CARD (Dark Theme) ---
    return (
        <div className={cn(
            "rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-300",
            isLocked ? "bg-stone-100 border border-stone-200" : "bg-stone-900 text-white"
        )}>
            {/* Background Decor */}
            {!isLocked && (
                <>
                    <div className="absolute top-0 right-0 p-32 bg-stone-800 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 p-24 bg-brand-900 rounded-full blur-3xl -ml-12 -mb-12 opacity-30 pointer-events-none"></div>
                </>
            )}

            <div className="p-6 md:p-8 relative z-10">
                {/* Header Row */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className={cn("text-xs font-bold uppercase tracking-widest mb-1", isLocked ? "text-stone-500" : "text-stone-400")}>
                            {basket?.month.includes('Rollover') ? 'Next Cycle Balance' : (isLocked ? 'Locked Balance' : 'Outstanding Balance')}
                        </p>
                        {isEmpty ? (
                            <h2 className={cn("text-3xl font-heading font-bold", isLocked ? "text-stone-300" : "text-stone-500")}>No Active Order</h2>
                        ) : (
                            <h2 className={cn("text-4xl md:text-5xl font-heading font-bold tracking-tight tabular-nums", isLocked ? "text-stone-900" : "text-white")}>
                                {remaining > 0 ? formatCurrency(remaining) : "PAID"}
                            </h2>
                        )}
                    </div>
                    
                    <div className={cn("p-3 rounded-2xl flex items-center justify-center backdrop-blur-md", isLocked ? "bg-stone-200 text-stone-500" : "bg-white/10 text-white")}>
                        {isLocked ? <Lock size={24} /> : <CreditCard size={24} />}
                    </div>
                </div>

                {/* Progress Section */}
                {!isEmpty && (
                    <div className="mb-8">
                        <div className="flex justify-between text-xs font-bold mb-2 opacity-80">
                            <span>Payment Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className={cn("h-3 rounded-full overflow-hidden", isLocked ? "bg-stone-200" : "bg-stone-800")}>
                            <MotionDiv 
                                className={cn("h-full rounded-full", progress >= 100 ? 'bg-emerald-500' : isLocked ? 'bg-stone-400' : 'bg-brand-500')}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1 }}
                            />
                        </div>
                        <div className={cn("flex justify-between mt-2 text-xs font-medium", isLocked ? "text-stone-500" : "text-stone-400")}>
                            <span>Paid: {formatCurrency(totalPaid)}</span>
                            <span>Total: {formatCurrency(totalValue)}</span>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                {!isLocked && !isEmpty && remaining > 0 ? (
                    <div className="bg-white/5 rounded-2xl p-4 md:p-1 flex flex-col md:flex-row gap-3 backdrop-blur-sm border border-white/10">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">GHS</span>
                            <input 
                                type="number" 
                                placeholder="Amount"
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-transparent text-white font-bold placeholder:text-stone-600 focus:outline-none h-full rounded-xl"
                            />
                        </div>
                        <div className="flex gap-2">
                            {[20, 50, 100].map(amt => (
                                <button 
                                    key={amt}
                                    onClick={() => setPaymentAmount(amt.toString())} 
                                    className="hidden md:block px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-bold transition-colors border border-white/5"
                                >
                                    {amt}
                                </button>
                            ))}
                            <Button 
                                onClick={() => onInitiatePayment(parseFloat(paymentAmount))}
                                loading={isPaying}
                                disabled={!paymentAmount || isPaying}
                                className="bg-brand-500 hover:bg-brand-400 text-white border-none px-6 rounded-xl shadow-lg shadow-brand-500/20"
                            >
                                Pay Now
                            </Button>
                        </div>
                    </div>
                ) : isEmpty && !isLocked ? (
                    <Button onClick={onGoToShop} fullWidth size="lg" className="bg-brand-500 hover:bg-brand-400 border-none text-white shadow-lg shadow-brand-500/20 h-12 rounded-xl">
                        Start Shopping <ArrowRight size={18} className="ml-2" />
                    </Button>
                ) : isLocked ? (
                    <div className="p-3 bg-stone-200/50 rounded-xl text-center text-xs text-stone-500 font-medium">
                        {basket?.month.includes('Rollover') ? (
                            <span>This is your next cycle's basket. <br/> Add items freely while your current order processes.</span>
                        ) : (
                            <span>This basket is locked. Check History for status.</span>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
};
