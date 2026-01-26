
import React from 'react';
import { Card, Button } from '../../ui';
import { ProcurementItem } from '../../../types';
import { Truck } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';

interface ProcurementTabProps {
    procurementList: ProcurementItem[];
}

export const ProcurementTab: React.FC<ProcurementTabProps> = ({ procurementList }) => {
    return (
        <Card noPadding>
            <div className="p-6 border-b border-stone-100 bg-stone-50/30 flex justify-between items-center gap-4">
                <h3 className="font-serif font-bold text-lg md:text-xl text-brand-900 whitespace-nowrap">Procurement Orders</h3>
                <Button variant="outline" size="sm" className="gap-2 shrink-0"><Truck size={14}/> <span className="hidden sm:inline">Export List</span><span className="sm:hidden">Export</span></Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap">Product Name</th>
                            <th className="px-6 py-4 whitespace-nowrap">Unit Size</th>
                            <th className="px-6 py-4 text-center whitespace-nowrap">Total Required</th>
                            <th className="px-6 py-4 text-right whitespace-nowrap">Est. Cost</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {procurementList.map((item, i) => (
                            <tr key={i} className="hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-brand-900">{item.productName}</td>
                                <td className="px-6 py-4 text-stone-500 font-mono text-xs">{item.unitSize}</td>
                                <td className="px-6 py-4 text-center font-bold bg-brand-50/50 text-brand-700">{item.totalQuantity}</td>
                                <td className="px-6 py-4 text-right font-medium text-stone-900">{formatCurrency(item.totalCost)}</td>
                            </tr>
                        ))}
                        {procurementList.length === 0 && (
                            <tr><td colSpan={4} className="p-12 text-center text-stone-400">No completed orders to procure yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
