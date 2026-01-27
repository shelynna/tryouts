
import React, { useState, useMemo } from 'react';
import { Card, Badge, ProgressBar, Pagination } from '../../ui';
import { AdminBasketEntry } from '../../../types';
import { formatCurrency } from '../../../lib/utils';
import { CheckCircle2, DollarSign, AlertCircle } from 'lucide-react';

interface OrdersTabProps {
    orders: AdminBasketEntry[];
}

const ITEMS_PER_PAGE = 10;

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders }) => {
    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');
    const [currentPage, setCurrentPage] = useState(1);

    const { filteredOrders, counts } = useMemo(() => {
        const active = orders.filter(o => o.status === 'OPEN' || o.status === 'LOCKED');
        const completed = orders.filter(o => o.status === 'PAID' || o.status === 'COLLECTED' || o.status === 'DELIVERED');
        const counts = {
            ACTIVE: active.length,
            COMPLETED: completed.length,
            ALL: orders.length
        };
        
        let filtered;
        if (filter === 'ACTIVE') filtered = active;
        else if (filter === 'COMPLETED') filtered = completed;
        else filtered = orders;

        return { filteredOrders: filtered, counts };
    }, [orders, filter]);

    const totalExpected = filteredOrders.reduce((sum, o) => sum + o.totalValue, 0);
    const totalCollected = filteredOrders.reduce((sum, o) => sum + o.amountPaid, 0);
    const outstanding = totalExpected - totalCollected;

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleFilterChange = (newFilter: 'ALL' | 'ACTIVE' | 'COMPLETED') => {
        setFilter(newFilter);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 flex items-center justify-between bg-stone-900 text-white border-none">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Total Value</p>
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
                <div className="p-6 border-b border-stone-100 bg-stone-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="font-heading font-bold text-xl text-brand-900">Order Management</h3>
                        <p className="text-sm text-stone-500">Track installments and fulfillment.</p>
                    </div>
                    
                    <div className="flex bg-white rounded-lg p-1 border border-stone-200 shadow-sm">
                        <button 
                            onClick={() => handleFilterChange('ACTIVE')}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${filter === 'ACTIVE' ? 'bg-brand-50 text-brand-700' : 'text-stone-500 hover:text-stone-900'}`}
                        >
                            Active <span className="bg-brand-100 text-brand-700 text-[10px] px-1.5 py-0.5 rounded-md">{counts.ACTIVE}</span>
                        </button>
                        <button 
                            onClick={() => handleFilterChange('COMPLETED')}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${filter === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'text-stone-500 hover:text-stone-900'}`}
                        >
                            Completed <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-md">{counts.COMPLETED}</span>
                        </button>
                        <button 
                            onClick={() => handleFilterChange('ALL')}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${filter === 'ALL' ? 'bg-stone-100 text-stone-700' : 'text-stone-500 hover:text-stone-900'}`}
                        >
                            All <span className="bg-stone-200 text-stone-600 text-[10px] px-1.5 py-0.5 rounded-md">{counts.ALL}</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] tracking-widest border-b border-stone-100">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4 text-right">Total Value</th>
                                <th className="px-6 py-4 text-right">Outstanding</th>
                                <th className="px-6 py-4 w-1/3">Payment Progress</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {paginatedOrders.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-stone-400">No orders found for this filter.</td></tr>
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
