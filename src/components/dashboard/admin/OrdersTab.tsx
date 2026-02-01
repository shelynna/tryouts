
import React, { useState, useMemo } from 'react';
import { Card, Badge, ProgressBar, Pagination, useToast } from '../../ui';
import { AdminBasketEntry, BasketStatus } from '../../../types';
import { formatCurrency } from '../../../lib/utils';
import { CheckCircle2, DollarSign, AlertCircle, Filter, Truck } from 'lucide-react';
import { API } from '../../../lib/api';

interface OrdersTabProps {
    orders: AdminBasketEntry[];
}

const ITEMS_PER_PAGE = 10;
const BATCH_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders }) => {
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [batchFilter, setBatchFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const { showToast } = useToast();

    // Local state to handle optimistic updates for batches
    const [localOrders, setLocalOrders] = useState<AdminBasketEntry[]>(orders);

    // Sync local state when prop changes
    React.useEffect(() => {
        setLocalOrders(orders);
    }, [orders]);

    const handleBatchUpdate = async (basketId: string, newBatch: string) => {
        try {
            await API.updateOrderBatch(basketId, newBatch);
            setLocalOrders(prev => prev.map(o => o.basketId === basketId ? { ...o, deliveryBatch: newBatch } : o));
            showToast(`Batch updated to ${newBatch}`, 'success');
        } catch (e) {
            showToast("Failed to update batch", "error");
        }
    };

    const { filteredOrders, counts } = useMemo(() => {
        let filtered = localOrders;

        // 1. Status Filter
        if (statusFilter !== 'ALL') {
            if (statusFilter === 'ACTIVE') {
                filtered = filtered.filter(o => o.status === 'OPEN' || o.status === 'LOCKED');
            } else if (statusFilter === 'COMPLETED') {
                filtered = filtered.filter(o => o.status === 'PAID' || o.status === 'COLLECTED' || o.status === 'DELIVERED');
            } else {
                filtered = filtered.filter(o => o.status === statusFilter);
            }
        }

        // 2. Batch Filter
        if (batchFilter !== 'ALL') {
            filtered = filtered.filter(o => o.deliveryBatch === batchFilter);
        }

        // Counts for tabs
        const activeCount = localOrders.filter(o => o.status === 'OPEN' || o.status === 'LOCKED').length;
        const completedCount = localOrders.filter(o => o.status === 'PAID' || o.status === 'COLLECTED' || o.status === 'DELIVERED').length;

        return { 
            filteredOrders: filtered, 
            counts: { ACTIVE: activeCount, COMPLETED: completedCount, ALL: localOrders.length } 
        };
    }, [localOrders, statusFilter, batchFilter]);

    const totalExpected = filteredOrders.reduce((sum, o) => sum + o.totalValue, 0);
    const totalCollected = filteredOrders.reduce((sum, o) => sum + o.amountPaid, 0);
    const outstanding = totalExpected - totalCollected;

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 flex items-center justify-between bg-stone-900 text-white border-none">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Total Value (Visible)</p>
                        <p className="text-2xl font-mono font-bold mt-1">{formatCurrency(totalExpected)}</p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg"><DollarSign size={20}/></div>
                </Card>
                <Card className="p-5 flex items-center justify-between border-emerald-100 bg-emerald-50/50">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Collected</p>
                        <p className="text-2xl font-mono font-bold mt-1 text-emerald-700">{formatCurrency(totalCollected)}</p>
                    </div>
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><CheckCircle2 size={20}/></div>
                </Card>
                <Card className="p-5 flex items-center justify-between border-brand-100 bg-brand-50/50">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Outstanding</p>
                        <p className="text-2xl font-mono font-bold mt-1 text-brand-700">{formatCurrency(outstanding)}</p>
                    </div>
                    <div className="bg-brand-100 p-2 rounded-lg text-brand-600"><AlertCircle size={20}/></div>
                </Card>
            </div>

            <Card noPadding>
                {/* Header & Controls */}
                <div className="p-6 border-b border-stone-100 bg-stone-50/30 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="font-heading font-bold text-xl text-brand-900">Order Management</h3>
                            <p className="text-sm text-stone-500">Track installments and batch fulfillment.</p>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-xl border border-stone-200">
                        {/* Status Tabs */}
                        <div className="flex gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
                            {[
                                { id: 'ALL', label: 'All Orders', count: counts.ALL },
                                { id: 'ACTIVE', label: 'Active', count: counts.ACTIVE },
                                { id: 'COMPLETED', label: 'Completed', count: counts.COMPLETED }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                                        statusFilter === tab.id 
                                            ? 'bg-stone-900 text-white shadow-md' 
                                            : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                                    }`}
                                >
                                    {tab.label} <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>{tab.count}</span>
                                </button>
                            ))}
                        </div>

                        {/* Dropdown Filters */}
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <select 
                                    value={batchFilter}
                                    onChange={(e) => { setBatchFilter(e.target.value); setCurrentPage(1); }}
                                    className="w-full appearance-none bg-stone-50 border border-stone-200 text-xs font-bold text-stone-700 pl-9 pr-8 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                >
                                    <option value="ALL">All Batches</option>
                                    {BATCH_OPTIONS.map(b => <option key={b} value={b}>Batch {b}</option>)}
                                </select>
                                <Truck size={14} className="absolute left-3 top-3 text-stone-400" />
                            </div>

                            <div className="relative flex-1 md:flex-none">
                                <select 
                                    value={['ALL', 'ACTIVE', 'COMPLETED'].includes(statusFilter) ? '' : statusFilter}
                                    onChange={(e) => { if(e.target.value) { setStatusFilter(e.target.value); setCurrentPage(1); } }}
                                    className="w-full appearance-none bg-stone-50 border border-stone-200 text-xs font-bold text-stone-700 pl-9 pr-8 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                >
                                    <option value="" disabled>Specific Status...</option>
                                    {Object.values(BasketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <Filter size={14} className="absolute left-3 top-3 text-stone-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] tracking-widest border-b border-stone-100">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4 text-right">Value</th>
                                <th className="px-6 py-4 text-right">Outstanding</th>
                                <th className="px-6 py-4 w-1/4">Progress</th>
                                <th className="px-6 py-4 text-center">Batch</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {paginatedOrders.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-stone-400">No orders found matching filters.</td></tr>
                            ) : (
                                paginatedOrders.map(order => {
                                    const progress = order.totalValue > 0 ? (order.amountPaid / order.totalValue) * 100 : 0;
                                    const outstandingAmount = order.totalValue - order.amountPaid;
                                    const isFullyPaid = progress >= 99.9;

                                    return (
                                        <tr key={order.basketId} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-stone-900">{order.userName}</div>
                                                <div className="text-[10px] text-stone-400 font-mono">ID: {order.basketId.substring(0,8)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-stone-700 font-bold">
                                                {formatCurrency(order.totalValue)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-brand-700 font-medium">
                                                {formatCurrency(outstandingAmount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className={`font-bold ${isFullyPaid ? 'text-emerald-600' : 'text-stone-600'}`}>{formatCurrency(order.amountPaid)}</span>
                                                    <span className="text-stone-400 font-medium">{Math.round(progress)}%</span>
                                                </div>
                                                <ProgressBar 
                                                    progress={progress} 
                                                    className="h-2 bg-stone-100" 
                                                    barClassName={isFullyPaid ? "bg-emerald-500" : (progress > 50 ? "bg-brand-500" : "bg-orange-400")} 
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <select
                                                    value={order.deliveryBatch || 'A'}
                                                    onChange={(e) => handleBatchUpdate(order.basketId, e.target.value)}
                                                    className="bg-white border border-stone-200 text-xs font-bold rounded px-2 py-1 focus:ring-2 focus:ring-brand-500/20 outline-none cursor-pointer hover:border-brand-300"
                                                >
                                                    {BATCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge status={order.status} size="sm" />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="border-t border-stone-100">
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </Card>
        </div>
    );
};
