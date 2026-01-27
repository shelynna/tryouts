
import React from 'react';
import { Card, Badge, Button } from '../../ui';
import { TopUpRequest } from '../../../types';
import { formatCurrency } from '../../../lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';
import { API } from '../../../lib/api';

interface TopUpsTabProps {
    topUps: TopUpRequest[];
    refreshAdminData: () => void;
    notify: (msg: string, type?: any) => void;
}

export const TopUpsTab: React.FC<TopUpsTabProps> = ({ topUps, refreshAdminData, notify }) => {

    const handleApprove = async (id: string) => {
        if (!confirm("Approve this top-up request? This will mark the basket as fully paid.")) return;
        try {
            await API.approveTopUp(id);
            notify("Top-up approved successfully.", "success");
            refreshAdminData();
        } catch(e: any) {
            notify(e.message || "Failed to approve.", "error");
        }
    }

    const handleDeny = async (id: string) => {
        if (!confirm("Deny this top-up request?")) return;
        try {
            await API.denyTopUp(id);
            notify("Top-up request denied.", "info");
            refreshAdminData();
        } catch(e: any) {
            notify(e.message || "Failed to deny.", "error");
        }
    }

    return (
        <Card noPadding>
            <div className="p-6 border-b border-stone-100 bg-stone-50/30">
                <h3 className="font-serif font-bold text-xl text-brand-900">Top-Up Requests</h3>
                <p className="text-sm text-stone-500">Review and approve subscriber support requests.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">User ID</th>
                            <th className="px-6 py-4 text-right">Requested</th>
                            <th className="px-6 py-4 text-right">Repayable</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {topUps.map((req) => (
                            <tr key={req.id} className="hover:bg-stone-50/50">
                                <td className="px-6 py-4 font-mono text-xs">{req.userId.substring(0,8)}...</td>
                                <td className="px-6 py-4 text-right font-bold">{formatCurrency(req.amount)}</td>
                                <td className="px-6 py-4 text-right text-stone-500">{formatCurrency(req.totalRepayable)}</td>
                                <td className="px-6 py-4 text-center">
                                    <Badge status={req.status} size="sm" />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {req.status === 'PENDING' && (
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleApprove(req.basketId)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><CheckCircle size={18}/></button>
                                            <button onClick={() => handleDeny(req.basketId)} className="text-red-600 hover:bg-red-50 p-1 rounded"><XCircle size={18}/></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {topUps.length === 0 && (
                            <tr><td colSpan={5} className="p-12 text-center text-stone-400">No pending requests.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
