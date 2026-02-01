
import React, { useState } from 'react';
import { Button, Input } from '../ui';
import { Basket } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface BasketActionsProps {
    basket: Basket | null | undefined;
    canAddToCart: boolean;
    canPay: boolean;
    onPayment: (amount: number) => Promise<void>;
    showPaymentOnly?: boolean;
}

export const BasketActions: React.FC<BasketActionsProps> = ({ basket, canPay, onPayment, showPaymentOnly }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        const val = parseFloat(amount);
        if (!amount || isNaN(val) || val <= 0) return;
        setLoading(true);
        await onPayment(val);
        setLoading(false);
        setAmount('');
    };

    const handlePreset = (percentage: number) => {
        if (!basket) return;
        const remaining = Math.max(0, basket.totalValue - basket.amountPaid);
        const val = (remaining * percentage) / 100;
        // Format to 2 decimal places then parse back to avoid long floats in input
        setAmount(val.toFixed(2));
    };

    if (!basket) return null;

    const remaining = Math.max(0, basket.totalValue - basket.amountPaid);

    return (
        <div className="bg-white border-t border-stone-100 p-4 space-y-4 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center text-sm font-bold">
                <span>Total: {formatCurrency(basket.totalValue)}</span>
                <div className="text-right">
                    <span className="text-stone-400 text-xs mr-2">Paid: {formatCurrency(basket.amountPaid)}</span>
                    <span className="text-emerald-600">Due: {formatCurrency(remaining)}</span>
                </div>
            </div>
            
            {canPay && remaining > 0 && (
                <div className="space-y-3">
                    {/* Preset Buttons */}
                    <div className="flex gap-2">
                        {[10, 30, 50, 100].map((pct) => (
                            <button
                                key={pct}
                                onClick={() => handlePreset(pct)}
                                className="flex-1 py-2 text-[10px] font-bold uppercase tracking-wider bg-stone-50 border border-stone-200 rounded-lg text-stone-500 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors active:scale-95"
                            >
                                {pct === 100 ? 'Full' : `${pct}%`}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">GHS</span>
                            <Input 
                                placeholder="Enter amount" 
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                type="number"
                                className="pl-10"
                            />
                        </div>
                        <Button onClick={handlePay} loading={loading} disabled={!amount || parseFloat(amount) <= 0}>
                            Pay Now
                        </Button>
                    </div>
                </div>
            )}
            
            {remaining <= 0 && basket.totalValue > 0 && (
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-center font-bold text-sm border border-emerald-100 flex items-center justify-center gap-2">
                    <i className='bx bx-check-circle text-xl'></i> Basket Fully Paid!
                </div>
            )}
        </div>
    );
};
