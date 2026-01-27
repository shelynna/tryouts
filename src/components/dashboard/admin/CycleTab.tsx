
import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../ui';
import { Save, AlertTriangle, Calendar, Info } from 'lucide-react';
import { SystemSettings } from '../../../types';

interface CycleTabProps {
    settings: SystemSettings;
    onSave: (settings: SystemSettings) => void;
}

// Helper to format for datetime-local input (YYYY-MM-DDTHH:mm)
const formatForInput = (isoString: string | undefined | null) => {
    if (!isoString) return '';
    try {
        return new Date(isoString).toISOString().slice(0, 16);
    } catch (e) {
        return '';
    }
};

export const CycleTab: React.FC<CycleTabProps> = ({ settings, onSave }) => {
    const [fees, setFees] = useState({
        basket: (settings.basketServiceFeePercentage ?? 5).toString(),
        topup: (settings.topUpServiceFeePercentage ?? 5).toString()
    });

    const [dates, setDates] = useState({
        paymentStart: formatForInput(settings.paymentStartDate),
        paymentEnd: formatForInput(settings.paymentEndDate),
        lock: formatForInput(settings.lockDate),
        unlock: formatForInput(settings.unlockDate),
        bulkStart: formatForInput(settings.bulkStartDate),
        bulkEnd: formatForInput(settings.bulkEndDate),
        delivery: formatForInput(settings.deliveryDate)
    });

    const [warnings, setWarnings] = useState<string[]>([]);

    // Soft Validation Logic
    useEffect(() => {
        const w = [];
        const d = {
            payStart: new Date(dates.paymentStart),
            payEnd: new Date(dates.paymentEnd),
            lock: new Date(dates.lock),
            bulkStart: new Date(dates.bulkStart),
            delivery: new Date(dates.delivery)
        };

        if (dates.lock && dates.paymentEnd && d.lock < d.payEnd) {
            w.push("Note: Lock date is before Payment window closes. Users can still pay for locked baskets.");
        }
        if (dates.paymentStart && dates.paymentEnd && d.payStart > d.payEnd) {
            w.push("Warning: Payment Start is after Payment End.");
        }
        if (dates.delivery && dates.bulkStart && d.delivery <= d.bulkStart) {
            w.push("Warning: Delivery date is set before or during Bulk Procurement start.");
        }
        
        setWarnings(w);
    }, [dates]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Helper to convert input value back to ISO or null if empty
        const toIsoOrNull = (d: string) => d ? new Date(d).toISOString() : null;

        onSave({
            ...settings,
            basketServiceFeePercentage: parseFloat(fees.basket),
            topUpServiceFeePercentage: parseFloat(fees.topup),
            
            // Map inputs to settings, sending null if cleared
            paymentStartDate: toIsoOrNull(dates.paymentStart),
            paymentEndDate: toIsoOrNull(dates.paymentEnd),
            lockDate: toIsoOrNull(dates.lock),
            unlockDate: toIsoOrNull(dates.unlock),
            bulkStartDate: toIsoOrNull(dates.bulkStart),
            bulkEndDate: toIsoOrNull(dates.bulkEnd),
            deliveryDate: toIsoOrNull(dates.delivery),
            
            // Legacy mapping fallback
            basketOpenDate: toIsoOrNull(dates.paymentStart),
            basketLockDate: toIsoOrNull(dates.lock)
        });
    };

    return (
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-8 animate-in fade-in">
            {/* 1. FEES CONFIG */}
            <Card>
                <h3 className="text-xl font-serif font-bold text-brand-900 mb-6">Service Fees</h3>
                <div className="space-y-6">
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
                </div>
            </Card>

            {/* 2. CYCLE CONFIG */}
            <Card className="bg-brand-50 border-brand-100 flex flex-col">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-serif font-bold text-brand-900">Cycle Configuration</h3>
                        <p className="text-sm text-brand-700 mt-1">Full control over cycle phases.</p>
                    </div>
                    <div className="bg-white/80 px-3 py-1 rounded-lg border border-brand-100">
                        <span className="text-[10px] font-bold text-brand-400 uppercase block">Active Cycle</span>
                        <span className="text-sm font-bold text-brand-900">{settings.cycleName}</span>
                    </div>
                </div>

                <div className="space-y-6 flex-1">
                    
                    {/* Payment Phase */}
                    <div className="bg-white p-4 rounded-xl border border-brand-100">
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Calendar size={14} className="text-brand-500"/> Payment Window
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] text-stone-500 font-bold mb-1">Opens (Start)</label>
                                <input type="datetime-local" value={dates.paymentStart} onChange={e => setDates({...dates, paymentStart: e.target.value})} className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 text-xs" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-stone-500 font-bold mb-1">Closes (Hard Stop)</label>
                                <input type="datetime-local" value={dates.paymentEnd} onChange={e => setDates({...dates, paymentEnd: e.target.value})} className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 text-xs" />
                            </div>
                        </div>
                    </div>

                    {/* Locking Phase */}
                    <div className="bg-white p-4 rounded-xl border border-brand-100">
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-orange-500"/> Basket Modification
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] text-stone-500 font-bold mb-1">Lock Date (No Edits)</label>
                                <input type="datetime-local" value={dates.lock} onChange={e => setDates({...dates, lock: e.target.value})} className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 text-xs" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-stone-500 font-bold mb-1">Unlock Until (Optional)</label>
                                <input type="datetime-local" value={dates.unlock} onChange={e => setDates({...dates, unlock: e.target.value})} className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 text-xs" />
                            </div>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-2">
                            Users cannot add/remove items after Lock Date, unless 'Unlock Until' is set to a future date. Leave blank to keep open.
                        </p>
                    </div>

                    {/* Procurement & Delivery */}
                    <div className="bg-white p-4 rounded-xl border border-brand-100">
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Info size={14} className="text-blue-500"/> Logistics
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[10px] text-stone-500 font-bold mb-1">Bulk Start</label>
                                <input type="datetime-local" value={dates.bulkStart} onChange={e => setDates({...dates, bulkStart: e.target.value})} className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 text-[10px]" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-stone-500 font-bold mb-1">Bulk End</label>
                                <input type="datetime-local" value={dates.bulkEnd} onChange={e => setDates({...dates, bulkEnd: e.target.value})} className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 text-[10px]" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-stone-500 font-bold mb-1 text-brand-600">Delivery Day</label>
                                <input type="datetime-local" value={dates.delivery} onChange={e => setDates({...dates, delivery: e.target.value})} className="w-full p-2 bg-brand-50 rounded-lg border border-brand-200 text-[10px] font-bold" />
                            </div>
                        </div>
                    </div>

                    {/* Warnings Display */}
                    {warnings.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                            {warnings.map((w, i) => (
                                <p key={i} className="text-xs text-orange-700 flex items-start gap-2 mb-1 last:mb-0">
                                    <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {w}
                                </p>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-6 mt-6 border-t border-brand-200">
                    <Button type="submit" size="lg" fullWidth className="gap-2 shadow-lg shadow-brand-900/10">
                        <Save size={18} /> Update Cycle Config
                    </Button>
                </div>
            </Card>
        </form>
    );
};
