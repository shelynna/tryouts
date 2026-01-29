
import React, { useState, useEffect } from 'react';
import { Card, useToast } from '../../ui';
import { Delivery, PickupPoint } from '../../../types';
import { API } from '../../../lib/api';
import { RefreshCw, MapPin, Truck, CheckCircle, Package, ClipboardList, Wand2, Bell, BellOff, Check } from 'lucide-react';

export const DeliveriesTab: React.FC = () => {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [notifyUsers, setNotifyUsers] = useState(true);
    const { showToast } = useToast();

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const data = await API.getAllDeliveries(filter);
            setDeliveries(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, [filter]);

    const handleGenerateManifest = async () => {
        const msg = notifyUsers 
            ? "Generate codes and AUTO-NOTIFY students via email?" 
            : "Generate codes silently (no notifications)?";
            
        if (!confirm(msg)) return;
        
        setGenerating(true);
        try {
            const res = await API.generateDeliveryManifest(notifyUsers);
            const notifyMsg = res.notified > 0 ? ` and sent ${res.notified} emails` : '';
            if (res.count > 0) {
                showToast(`Generated ${res.count} tickets${notifyMsg}.`, 'success');
                fetchDeliveries();
            } else {
                showToast("No new paid baskets found to process.", 'info');
            }
        } catch (e: any) {
            showToast("Failed to generate manifest", "error");
        } finally {
            setGenerating(false);
        }
    };

    const handleMarkCollected = async (deliveryId: string, basketId: string, userName: string) => {
        if (!confirm(`Mark order for ${userName} as COLLECTED?`)) return;
        
        try {
            await API.markDeliveryAsCollected(deliveryId, basketId);
            showToast(`Marked ${userName}'s order as collected`, 'success');
            // Optimistic update
            setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status: 'COLLECTED' } : d));
        } catch (e: any) {
            showToast("Failed to update status", "error");
        }
    };

    const stats = {
        ready: deliveries.filter(d => d.status === 'READY').length,
        collected: deliveries.filter(d => d.status === 'COLLECTED').length,
        total: deliveries.length
    };

    return (
        <div className="space-y-4 font-sans h-full flex flex-col">
            
            {/* 1. Compact Metrics Row */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
                {/* Ready */}
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center flex flex-col justify-center min-h-[70px]">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Ready</p>
                    <p className="text-2xl font-black text-blue-900 leading-none tabular-nums">{stats.ready}</p>
                </div>
                {/* Collected */}
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center flex flex-col justify-center min-h-[70px]">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Collected</p>
                    <p className="text-2xl font-black text-emerald-900 leading-none tabular-nums">{stats.collected}</p>
                </div>
                {/* Total */}
                <div className="bg-white p-3 rounded-xl border border-stone-200 text-center flex flex-col justify-center min-h-[70px] shadow-sm">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-2xl font-black text-stone-700 leading-none tabular-nums">{stats.total}</p>
                </div>
            </div>

            {/* 2. Main Feed Card */}
            <Card noPadding className="flex flex-col flex-1 min-h-[400px] border-stone-200 shadow-sm overflow-hidden">
                {/* Toolbar Header */}
                <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <div className="bg-stone-100 p-1.5 rounded-md text-stone-600">
                                <ClipboardList size={16} />
                            </div>
                            <h3 className="font-bold text-stone-900 leading-tight text-sm">Dispatch Feed</h3>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleGenerateManifest}
                                disabled={generating}
                                className="bg-brand-900 hover:bg-brand-800 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {generating ? 'Processing...' : <><Wand2 size={12} /> Auto-Generate</>}
                            </button>
                            <button 
                                onClick={() => setNotifyUsers(!notifyUsers)}
                                className={`p-1.5 rounded-lg border transition-all ${notifyUsers ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-stone-50 border-stone-200 text-stone-400'}`}
                                title={notifyUsers ? "Notifications ON" : "Notifications OFF"}
                            >
                                {notifyUsers ? <Bell size={12} /> : <BellOff size={12} />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select 
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="appearance-none bg-stone-50 border border-stone-200 text-[10px] font-bold uppercase text-stone-600 pl-3 pr-7 py-2 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 w-28"
                            >
                                <option value="ALL">All Points</option>
                                {Object.values(PickupPoint).map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-400">
                                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                        <button 
                            onClick={fetchDeliveries} 
                            disabled={loading}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-500 transition-all ${loading ? 'animate-spin bg-stone-50' : ''}`}
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto bg-stone-50/30 p-3 space-y-3">
                    {deliveries.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60 min-h-[300px]">
                            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                                <Package size={32} className="text-stone-300" strokeWidth={1.5} />
                            </div>
                            <p className="font-bold text-stone-600">All caught up!</p>
                            <p className="text-xs text-stone-400 mt-1">No pending deliveries found.</p>
                            <button onClick={handleGenerateManifest} disabled={generating} className="mt-4 text-brand-600 text-xs font-bold hover:underline">
                                Generate Manifest for Paid Orders
                            </button>
                        </div>
                    ) : (
                        deliveries.map(d => (
                            <div key={d.id} className="bg-white p-4 rounded-xl border border-stone-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center justify-between group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {/* Status Icon */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${d.status === 'COLLECTED' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {d.status === 'COLLECTED' ? <CheckCircle size={18} strokeWidth={2.5} /> : <Truck size={18} strokeWidth={2.5} />}
                                    </div>
                                    
                                    {/* Text Info */}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-stone-900 text-sm truncate">{d.fullName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="flex items-center gap-1 bg-stone-100 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wide text-stone-600 border border-stone-200">
                                                <MapPin size={10} /> {d.pickupPoint}
                                            </span>
                                            {/* Phone number display */}
                                            <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">{d.phone}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Delivery Code & Action */}
                                <div className="flex items-center gap-3">
                                    <div className="text-right hidden md:block">
                                        <div className="font-mono font-bold text-sm text-stone-800 tracking-wider">
                                            {d.deliveryCode}
                                        </div>
                                        <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${d.status === 'READY' ? 'text-blue-500' : 'text-emerald-500'}`}>
                                            {d.status === 'READY' ? 'Pending Pickup' : 'Collected'}
                                        </p>
                                    </div>

                                    {d.status === 'READY' ? (
                                        <button 
                                            onClick={() => handleMarkCollected(d.id, d.basketId, d.fullName)}
                                            className="bg-brand-900 text-white p-2 rounded-lg hover:bg-brand-800 shadow-sm transition-transform active:scale-95 flex items-center gap-2 text-xs font-bold"
                                            title="Mark as Collected"
                                        >
                                            <Check size={16} /> <span className="hidden sm:inline">Mark Collected</span>
                                        </button>
                                    ) : (
                                        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg border border-emerald-100">
                                            <CheckCircle size={16} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
};
