import React, { useEffect, useState } from 'react';
import { Modal, Button, Badge, ProgressBar } from '../../../ui';
import { User } from '../../../../types';
import { API } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/utils';
import { User as UserIcon, Phone, MapPin, Loader2, Package, History, CheckCircle, AlertCircle } from 'lucide-react';

interface UserDashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

interface CycleHistoryItem {
    cycleId: string;
    cycleName: string;
    status: string;
    totalValue: number;
    amountPaid: number;
    balance: number;
    itemCount: number;
    deliveryCode?: string;
    deliveryStatus?: string;
    items: { name: string; size: string; quantity: number; total: number }[];
}

export const UserDashboardModal: React.FC<UserDashboardModalProps> = ({ isOpen, onClose, user }) => {
    const [history, setHistory] = useState<CycleHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            fetchHistory();
        }
    }, [isOpen, user]);

    const fetchHistory = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await API.getUserCycleHistory(user.id);
            setHistory(data);
        } catch (e) {
            console.error("Failed to load user history", e);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="User Dashboard (Read-Only)"
            size="lg"
            className="h-[80vh] flex flex-col"
            noPadding
        >
            {/* Header: User Profile */}
            <div className="bg-stone-50 border-b border-stone-200 p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-400 shadow-sm text-2xl font-bold">
                            {user.fullName?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-heading font-bold text-stone-900">{user.fullName}</h2>
                            <div className="flex flex-col gap-1 mt-1 text-sm text-stone-500">
                                <div className="flex items-center gap-2"><Phone size={14}/> {user.phoneNumber || 'No Phone'}</div>
                                <div className="flex items-center gap-2"><MapPin size={14}/> {user.pickupPoint}</div>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <Badge status={user.isBlocked ? 'DENIED' : 'SUCCESS'} size="sm" />
                        <p className="text-xs text-stone-400 mt-2 font-mono">{user.email}</p>
                    </div>
                </div>
            </div>

            {/* Body: Cycle History */}
            <div className="flex-1 overflow-y-auto p-6 bg-stone-100/50">
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-stone-400" /></div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12 text-stone-400">
                        <History size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No activity recorded for this user.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {history.map((cycle) => {
                            const progress = cycle.totalValue > 0 ? (cycle.amountPaid / cycle.totalValue) * 100 : 0;
                            const isFullyPaid = progress >= 99.9;

                            return (
                                <div key={cycle.cycleId} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                                    {/* Cycle Header */}
                                    <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/30">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-stone-900">{cycle.cycleName}</h3>
                                            <Badge status={cycle.status} size="sm" />
                                        </div>
                                        {cycle.deliveryCode && (
                                            <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded border border-emerald-200">
                                                Code: {cycle.deliveryCode}
                                            </span>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="p-4 grid grid-cols-2 gap-4 border-b border-stone-100">
                                        <div>
                                            <p className="text-[10px] uppercase text-stone-400 font-bold">Total Due</p>
                                            <p className="text-lg font-mono font-bold text-stone-900">{formatCurrency(cycle.totalValue)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase text-stone-400 font-bold">Paid / Balance</p>
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-emerald-600 font-bold">{formatCurrency(cycle.amountPaid)}</span>
                                                <span className="text-stone-300">/</span>
                                                <span className="text-red-500 font-bold">{formatCurrency(cycle.balance)}</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <ProgressBar progress={progress} className="h-1.5" barClassName={isFullyPaid ? "bg-emerald-500" : "bg-brand-500"} />
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="p-4 bg-stone-50/50">
                                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Package size={12}/> Basket Content ({cycle.itemCount})
                                        </p>
                                        <div className="space-y-1">
                                            {cycle.items.map((item, i) => (
                                                <div key={i} className="flex justify-between text-xs py-1 border-b border-stone-100 last:border-0">
                                                    <span className="text-stone-700"><span className="font-bold">{item.quantity}x</span> {item.name} ({item.size})</span>
                                                    <span className="font-mono text-stone-500">{formatCurrency(item.total)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Delivery Status Footer */}
                                    {cycle.deliveryStatus && (
                                        <div className={`p-2 text-center text-xs font-bold uppercase tracking-widest ${cycle.deliveryStatus === 'COLLECTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'}`}>
                                            Delivery Status: {cycle.deliveryStatus}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <div className="p-4 border-t border-stone-200 bg-white">
                <Button fullWidth variant="outline" onClick={onClose}>Close Viewer</Button>
            </div>
        </Modal>
    );
};