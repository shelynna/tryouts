
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Badge } from '../../ui';
import { API } from '../../../lib/api';
import { Coupon, AssociateReport } from '../../../types';
import { Users, Plus, BarChart2, Ticket, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

export const AssociatesTab: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [report, setReport] = useState<AssociateReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Form State
    const [newCode, setNewCode] = useState('');
    const [newAssociate, setNewAssociate] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [couponsData, reportData] = await Promise.all([
                API.getCoupons(),
                API.getAssociateReport()
            ]);
            setCoupons(couponsData);
            setReport(reportData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCode || !newAssociate) return;
        setCreating(true);
        try {
            await API.createCoupon(newCode, newAssociate);
            setShowCreateModal(false);
            setNewCode('');
            setNewAssociate('');
            loadData();
        } catch (e) {
            console.error("Failed to create coupon", e);
            alert("Failed to create. Code might be duplicate.");
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await API.toggleCoupon(id, !currentStatus);
            setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
        } catch (e) {
            console.error("Failed to toggle", e);
        }
    };

    return (
        <div className="space-y-8 font-sans">
            
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-stone-100 shadow-soft gap-4">
                <div>
                    <h3 className="text-xl font-serif font-bold text-stone-900">Expansion Associates</h3>
                    <p className="text-xs text-stone-500 font-medium mt-1">Manage referral codes and track performance.</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} size="md" className="gap-2 shadow-lg shadow-stone-900/10 w-full sm:w-auto">
                    <Plus size={16} /> New Coupon
                </Button>
            </div>

            {/* PERFORMANCE REPORT */}
            <Card noPadding>
                <div className="p-5 border-b border-stone-100 bg-stone-50/30 flex items-center gap-2">
                    <BarChart2 size={18} className="text-brand-600" />
                    <h3 className="font-bold text-stone-900 text-lg">Performance Report</h3>
                </div>
                <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3">Associate</th>
                                <th className="px-6 py-3">Code</th>
                                <th className="px-6 py-3">Month</th>
                                <th className="px-6 py-3 text-right">Active Traders</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {report.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-stone-400">No trading activity recorded yet.</td></tr>
                            ) : (
                                report.map((row, i) => (
                                    <tr key={i} className="hover:bg-stone-50">
                                        <td className="px-6 py-3 font-bold text-stone-900">{row.associateName}</td>
                                        <td className="px-6 py-3 font-mono text-xs text-stone-500">{row.couponCode}</td>
                                        <td className="px-6 py-3">{row.month}</td>
                                        <td className="px-6 py-3 text-right font-bold text-emerald-600">{row.activeUsers}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* COUPONS LIST */}
            <Card noPadding>
                <div className="p-5 border-b border-stone-100 bg-stone-50/30 flex items-center gap-2">
                    <Ticket size={18} className="text-blue-600" />
                    <h3 className="font-bold text-stone-900 text-lg">Active Coupons</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] tracking-widest">
                            <tr>
                                <th className="px-6 py-3">Coupon Code</th>
                                <th className="px-6 py-3">Owner / Associate</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="animate-spin mx-auto"/></td></tr>
                            ) : coupons.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-stone-400">No coupons created.</td></tr>
                            ) : (
                                coupons.map((c) => (
                                    <tr key={c.id} className="hover:bg-stone-50">
                                        <td className="px-6 py-4 font-mono font-bold text-stone-800">{c.code}</td>
                                        <td className="px-6 py-4">{c.associateName}</td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge status={c.isActive ? 'SUCCESS' : 'FAILED'} size="sm" />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleToggle(c.id, c.isActive)} className="text-stone-400 hover:text-stone-900 transition-colors">
                                                {c.isActive ? <ToggleRight size={24} className="text-emerald-500"/> : <ToggleLeft size={24}/>}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* CREATE MODAL */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Associate Coupon"
                size="sm"
            >
                <div className="space-y-4">
                    <Input 
                        label="Associate Name" 
                        placeholder="e.g. Ama" 
                        value={newAssociate} 
                        onChange={e => setNewAssociate(e.target.value)} 
                    />
                    <Input 
                        label="Coupon Code" 
                        placeholder="e.g. SML-AMA-01" 
                        value={newCode} 
                        onChange={e => setNewCode(e.target.value.toUpperCase())}
                        className="uppercase font-mono" 
                    />
                    <p className="text-xs text-stone-500 bg-stone-50 p-2 rounded">
                        <strong>Note:</strong> This code is for tracking only. It does not change prices for the user.
                    </p>
                    <div className="pt-2 flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                        <Button onClick={handleCreate} loading={creating} disabled={!newCode || !newAssociate}>Create</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
