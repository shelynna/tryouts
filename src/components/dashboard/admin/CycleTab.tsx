
import React, { useState } from 'react';
import { Card, Button } from '../../ui';
import { Save } from 'lucide-react';
import { SystemSettings } from '../../../types';

interface CycleTabProps {
    settings: SystemSettings;
    onSave: (settings: SystemSettings) => void;
}

export const CycleTab: React.FC<CycleTabProps> = ({ settings, onSave }) => {
    const [fees, setFees] = useState({
        basket: (settings.basketServiceFeePercentage ?? 5).toString(),
        topup: (settings.topUpServiceFeePercentage ?? 5).toString()
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...settings,
            basketServiceFeePercentage: parseFloat(fees.basket),
            topUpServiceFeePercentage: parseFloat(fees.topup),
        });
    };

    return (
        <div className="grid md:grid-cols-2 gap-8">
            <Card>
                <h3 className="text-xl font-serif font-bold text-brand-900 mb-6">Service Fees Configuration</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-widest">Basket Service Fee (%)</label>
                        <p className="text-xs text-stone-400 mb-3">Added to every basket subtotal.</p>
                        <div className="relative">
                            <input 
                            type="number" step="0.1" min="0" max="100" 
                            value={fees.basket} 
                            onChange={e => setFees({...fees, basket: e.target.value})}
                            className="w-full pl-4 pr-12 py-3 bg-stone-50 rounded-xl border border-stone-200 font-bold text-lg focus:outline-none focus:border-brand-500"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-stone-400">%</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-widest">Top-Up Service Fee (%)</label>
                        <p className="text-xs text-stone-400 mb-3">Interest charged on support/loans.</p>
                        <div className="relative">
                            <input 
                            type="number" step="0.1" min="0" max="100" 
                            value={fees.topup} 
                            onChange={e => setFees({...fees, topup: e.target.value})}
                            className="w-full pl-4 pr-12 py-3 bg-stone-50 rounded-xl border border-stone-200 font-bold text-lg focus:outline-none focus:border-brand-500"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-stone-400">%</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-stone-100">
                        <Button type="submit" size="lg" fullWidth className="gap-2">
                            <Save size={18} /> Save Configurations
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="bg-brand-50 border-brand-100">
                <h3 className="text-xl font-serif font-bold text-brand-900 mb-4">Cycle Schedule</h3>
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-brand-100">
                        <span className="text-xs font-bold text-brand-400 uppercase">Current Cycle</span>
                        <p className="text-lg font-bold text-brand-900">{settings.cycleName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-brand-100">
                            <span className="text-xs font-bold text-brand-400 uppercase">Open Date</span>
                            <p className="font-mono text-brand-900">{new Date(settings.basketOpenDate).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-brand-100">
                            <span className="text-xs font-bold text-brand-400 uppercase">Lock Date</span>
                            <p className="font-mono text-brand-900">{new Date(settings.basketLockDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <p className="text-xs text-brand-600 mt-4 italic">
                        Note: Changing dates requires a system reset or database update. Contact technical support for date adjustments.
                    </p>
                </div>
            </Card>
        </div>
    );
};
