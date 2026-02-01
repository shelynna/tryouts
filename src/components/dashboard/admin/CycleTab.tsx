
import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Input, Badge } from '../../ui';
import { Save, AlertTriangle, Calendar, Play, Lock, Clock, Edit, Timer, Settings2 } from 'lucide-react';
import { SystemSettings, Cycle } from '../../../types';
import { API } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { CountdownTimer } from '../../user/CountdownTimer';
import { supabase } from '../../../lib/supabaseClient';

interface CycleTabProps {
    settings: SystemSettings;
    onSave: (settings: SystemSettings) => void;
}

const formatForInput = (isoString: string | undefined | null) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
        return localISOTime;
    } catch (e) {
        return '';
    }
};

export const CycleTab: React.FC<CycleTabProps> = ({ settings, onSave }) => {
    const [cycleName, setCycleName] = useState(settings.cycleName || '');
    const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
    const [isLoadingCycle, setIsLoadingCycle] = useState(false);

    const [showNewCycleModal, setShowNewCycleModal] = useState(false);
    const [newCycleData, setNewCycleData] = useState({
        name: '',
        start: '',
        lock: '', // This acts as Subscriber/Final Lock
        standardLock: '', // New Field for Standard Users
        delivery: ''
    });
    
    // Edit Dates State
    const [isEditingDates, setIsEditingDates] = useState(false);
    const [editDates, setEditDates] = useState({ open: '', lock: '', standardLock: '' });

    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadCycle();
    }, []);

    const loadCycle = async () => {
        setIsLoadingCycle(true);
        try {
            const cycle = await API.getActiveCycle(true);
            setActiveCycle(cycle);
            if (cycle) {
                setCycleName(cycle.name);
                setEditDates({
                    open: formatForInput(cycle.paymentStartDate),
                    lock: formatForInput(cycle.lockDate),
                    standardLock: formatForInput(cycle.standardLockDate || cycle.lockDate)
                });
            }
        } finally {
            setIsLoadingCycle(false);
        }
    };

    useEffect(() => {
        if (showNewCycleModal) {
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const monthName = nextMonth.toLocaleString('default', { month: 'long' });
            
            const start = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1, 8, 0);
            const standardLock = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 21, 23, 59); // 21st for standard
            const subLock = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 26, 23, 59); // 26th for subs
            const delivery = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 28, 9, 0);
            
            setNewCycleData({
                name: `SML ${monthName} Cycle`,
                start: formatForInput(start.toISOString()),
                standardLock: formatForInput(standardLock.toISOString()),
                lock: formatForInput(subLock.toISOString()), // Main lock date is for subs
                delivery: formatForInput(delivery.toISOString())
            });
        }
    }, [showNewCycleModal]);

    const handleStartNewCycle = async () => {
        if (!newCycleData.name) return;
        setIsProcessing(true);
        try {
            // Use Supabase RPC directly or via API service
            // We need to pass the standard lock date to the RPC
            const { error } = await supabase.rpc('start_new_cycle', {
                p_name: newCycleData.name,
                p_start_date: new Date(newCycleData.start).toISOString(),
                p_end_date: new Date(newCycleData.lock).toISOString(), // Subscriber/Final Lock
                p_delivery_date: new Date(newCycleData.delivery).toISOString(),
                p_standard_lock_date: new Date(newCycleData.standardLock).toISOString() // New Param
            });

            if (error) throw error;

            setShowNewCycleModal(false);
            // Reload page to refresh all contexts
            window.location.reload();
        } catch (e: any) {
            alert("Failed to start cycle: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLockCycle = async () => {
        if (!activeCycle) return;
        if (!confirm("Are you sure you want to LOCK this cycle? Students will no longer be able to add items, only pay.")) return;
        
        setIsProcessing(true);
        try {
            await API.lockCurrentCycle(activeCycle.id);
            await loadCycle();
        } catch(e: any) {
            alert("Failed to lock: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateDates = async () => {
        if (!activeCycle) return;
        setIsProcessing(true);
        try {
            await API.updateCycleDates(activeCycle.id, {
                open_date: new Date(editDates.open).toISOString(),
                lock_date: new Date(editDates.lock).toISOString(),
                standard_lock_date: new Date(editDates.standardLock).toISOString()
            });
            await loadCycle();
            setIsEditingDates(false);
            alert("Cycle timeline updated. Changes are pushed to users in real-time.");
        } catch (e: any) {
            alert("Failed to update dates: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-stone-100 shadow-soft gap-4">
                <div>
                    <h3 className="text-xl font-serif font-bold text-stone-900">SML Cycle Manager</h3>
                    <p className="text-xs text-stone-500 font-medium mt-1">
                        Control the Monthly Living timeline.
                    </p>
                </div>
                <Button onClick={() => setShowNewCycleModal(true)} size="md" className="gap-2 shadow-lg shadow-brand-900/10 w-full sm:w-auto bg-stone-900 text-white hover:bg-stone-800">
                    <Play size={16} /> Start Next Month
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Active Cycle Status Card */}
                <Card className={`h-full border-t-4 ${activeCycle?.status === 'OPEN' ? 'border-t-emerald-500' : 'border-t-orange-500'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-stone-900">Current Status</h3>
                            <p className="text-sm text-stone-500">Live system state</p>
                        </div>
                        <Badge status={activeCycle?.status || 'CLOSED'} />
                    </div>

                    {activeCycle ? (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Active Cycle Name</label>
                                    <p className="text-2xl font-heading font-bold text-stone-900">{activeCycle.name}</p>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setIsEditingDates(!isEditingDates)}
                                    className="gap-2"
                                >
                                    <Edit size={14} /> {isEditingDates ? 'Cancel Edit' : 'Edit Timeline'}
                                </Button>
                            </div>

                            {/* Live Countdown for Admins (Subscriber View) */}
                            {(activeCycle.status === 'OPEN' || activeCycle.status === 'active') && (
                                <div className="mt-4">
                                    <CountdownTimer cycle={activeCycle} user={{ isSubscriber: true } as any} />
                                </div>
                            )}

                            {isEditingDates ? (
                                <div className="space-y-4 bg-brand-50 p-4 rounded-xl border border-brand-100 animate-in fade-in">
                                    <div className="bg-white p-3 rounded-lg border border-brand-100 mb-2">
                                        <p className="text-[10px] text-brand-800 leading-relaxed">
                                            <strong>Real-time Update:</strong> Adjusting dates affects user access immediately.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-brand-800 mb-1">Cycle Open Date</label>
                                        <input 
                                            type="datetime-local" 
                                            className="w-full p-2 border rounded-lg text-sm bg-white" 
                                            value={editDates.open} 
                                            onChange={e => setEditDates({...editDates, open: e.target.value})} 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-orange-700 mb-1">Standard Lock (Free)</label>
                                            <input 
                                                type="datetime-local" 
                                                className="w-full p-2 border rounded-lg text-sm bg-white border-orange-200" 
                                                value={editDates.standardLock} 
                                                onChange={e => setEditDates({...editDates, standardLock: e.target.value})} 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-purple-700 mb-1">Subscriber Lock</label>
                                            <input 
                                                type="datetime-local" 
                                                className="w-full p-2 border rounded-lg text-sm bg-white border-purple-200" 
                                                value={editDates.lock} 
                                                onChange={e => setEditDates({...editDates, lock: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                    <Button fullWidth onClick={handleUpdateDates} loading={isProcessing} className="bg-brand-600 text-white shadow-lg">
                                        Update Real-time
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-100">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-2 rounded-lg text-brand-600 shadow-sm"><Play size={16}/></div>
                                            <div>
                                                <p className="text-xs font-bold text-stone-900">Started</p>
                                                <p className="text-[10px] text-stone-500">{formatDate(activeCycle.paymentStartDate)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-100">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-2 rounded-lg text-orange-600 shadow-sm"><Settings2 size={16}/></div>
                                            <div>
                                                <p className="text-xs font-bold text-stone-900">Free User Deadline</p>
                                                <p className="text-[10px] text-stone-500">{activeCycle.standardLockDate ? formatDate(activeCycle.standardLockDate) : 'Same as Subs'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-100">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-2 rounded-lg text-purple-600 shadow-sm"><Lock size={16}/></div>
                                            <div>
                                                <p className="text-xs font-bold text-stone-900">Subscriber Deadline</p>
                                                <p className="text-[10px] text-stone-500">{formatDate(activeCycle.lockDate)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-100">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm"><Calendar size={16}/></div>
                                            <div>
                                                <p className="text-xs font-bold text-stone-900">Delivery Day</p>
                                                <p className="text-[10px] text-stone-500">{formatDate(activeCycle.deliveryDate)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeCycle.status === 'OPEN' && !isEditingDates && (
                                <div className="pt-4 border-t border-stone-100">
                                    <Button 
                                        fullWidth 
                                        variant="outline" 
                                        className="border-orange-200 text-orange-700 hover:bg-orange-50"
                                        onClick={handleLockCycle}
                                        loading={isProcessing}
                                    >
                                        <Lock size={16} className="mr-2"/> Force Lock Cycle (Stop Orders)
                                    </Button>
                                    <p className="text-[10px] text-center text-stone-400 mt-2">
                                        This locks the cycle for everyone immediately.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-stone-400">
                            <Clock size={40} className="mx-auto mb-3 opacity-50"/>
                            <p>No active cycle found.</p>
                        </div>
                    )}
                </Card>

                {/* Configuration Card */}
                <Card>
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-stone-900">SMM Settings</h3>
                        <p className="text-sm text-stone-500">System-wide parameters</p>
                    </div>
                    <div className="space-y-4">
                        <Input 
                            label="System Display Name" 
                            value={cycleName} 
                            onChange={(e) => setCycleName(e.target.value)} 
                        />
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-xs leading-relaxed">
                            <strong className="block mb-1"><AlertTriangle size={14} className="inline mr-1"/> Note:</strong>
                            Use "Start Next Month" to officially rollover baskets. Editing dates on the left only affects the current active cycle.
                        </div>
                        <Button 
                            onClick={() => onSave({...settings, cycleName})} 
                            fullWidth 
                            className="bg-brand-900 text-white"
                        >
                            <Save size={16} className="mr-2"/> Update Display Name
                        </Button>
                    </div>
                </Card>
            </div>

            {/* NEW CYCLE MODAL */}
            <Modal
                isOpen={showNewCycleModal}
                onClose={() => setShowNewCycleModal(false)}
                title="Initialize SMM Cycle"
                size="md"
            >
                <div className="space-y-5">
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-900 text-sm">
                        <h4 className="font-bold flex items-center gap-2 mb-2"><AlertTriangle size={16}/> Rollover Warning</h4>
                        <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                            <li>Current active baskets will be archived.</li>
                            <li>Unpaid items will be cleared.</li>
                            <li>Paid balances remain in history.</li>
                            <li>System will switch to <strong>OPEN</strong> state for the new month.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <Input 
                            label="Cycle Name" 
                            value={newCycleData.name} 
                            onChange={e => setNewCycleData({...newCycleData, name: e.target.value})} 
                            placeholder="e.g. SMM March Cycle"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 mb-1">Start Date</label>
                                <input type="datetime-local" className="w-full p-2 border rounded-lg text-sm bg-stone-50" value={newCycleData.start} onChange={e => setNewCycleData({...newCycleData, start: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 mb-1">Delivery Day</label>
                                <input type="datetime-local" className="w-full p-2 border rounded-lg text-sm bg-stone-50" value={newCycleData.delivery} onChange={e => setNewCycleData({...newCycleData, delivery: e.target.value})} />
                            </div>
                        </div>
                        
                        {/* TIERED LOCK DATES */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-orange-700 mb-1">Standard Lock (Free)</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full p-2 border rounded-lg text-sm bg-white border-orange-200" 
                                    value={newCycleData.standardLock} 
                                    onChange={e => setNewCycleData({...newCycleData, standardLock: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-purple-700 mb-1">Subscriber Lock</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full p-2 border rounded-lg text-sm bg-white border-purple-200" 
                                    value={newCycleData.lock} 
                                    onChange={e => setNewCycleData({...newCycleData, lock: e.target.value})} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-stone-100">
                        <Button variant="ghost" onClick={() => setShowNewCycleModal(false)}>Cancel</Button>
                        <Button onClick={handleStartNewCycle} loading={isProcessing} className="bg-brand-900 text-white shadow-lg">Confirm & Start</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
