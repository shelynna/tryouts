
import React from 'react';
import { Card, Button } from '../../ui';
import { ProcurementItem } from '../../../types';
import { Truck, Download, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';

interface ProcurementTabProps {
    procurementList: ProcurementItem[];
}

export const ProcurementTab: React.FC<ProcurementTabProps> = ({ procurementList = [] }) => {
    
    const handleExport = () => {
        if (!procurementList || procurementList.length === 0) return;

        // CSV Header
        const headers = ['Product Name', 'Unit Size', 'Total Quantity', 'Unit Price', 'Total Cost'];
        
        // CSV Rows
        const rows = procurementList.map(item => {
            const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
            const totalCost = typeof item.totalCost === 'number' ? item.totalCost : 0;
            return [
                `"${(item.productName || 'Unknown').replace(/"/g, '""')}"`, // Escape quotes
                `"${item.unitSize || '-'}"`,
                item.totalQuantity || 0,
                unitPrice.toFixed(2),
                totalCost.toFixed(2)
            ];
        });

        // Combine
        const csvContent = [
            headers.join(','), 
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `sml_procurement_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalCost = procurementList.reduce((acc, item) => acc + (item.totalCost || 0), 0);

    return (
        <Card noPadding>
            <div className="p-6 border-b border-stone-100 bg-stone-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-serif font-bold text-lg md:text-xl text-brand-900 whitespace-nowrap">Procurement Orders</h3>
                    <p className="text-stone-500 text-sm">Aggregated items for bulk purchase.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total Value</p>
                        <p className="font-mono font-bold text-lg text-stone-900">{formatCurrency(totalCost)}</p>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 shrink-0 bg-white"
                        onClick={handleExport}
                        disabled={procurementList.length === 0}
                    >
                        <Download size={14}/> <span className="hidden sm:inline">Export CSV</span><span className="sm:hidden">Export</span>
                    </Button>
                </div>
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
                                <td className="px-6 py-4 font-bold text-brand-900">{item.productName || 'Unknown Product'}</td>
                                <td className="px-6 py-4 text-stone-500 font-mono text-xs">{item.unitSize || '-'}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-brand-50 text-brand-700 font-bold px-3 py-1 rounded-full">{item.totalQuantity || 0}</span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-stone-900">{formatCurrency(item.totalCost || 0)}</td>
                            </tr>
                        ))}
                        {procurementList.length === 0 && (
                            <tr><td colSpan={4} className="p-12 text-center text-stone-400 flex flex-col items-center gap-2">
                                <AlertTriangle className="opacity-50" />
                                <span>No completed orders to procure yet.</span>
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
