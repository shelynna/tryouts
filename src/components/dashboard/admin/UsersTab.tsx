
import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../../ui';
import { User } from '../../../types';
import { API } from '../../../lib/api';
import { Search, ShieldAlert, ShieldCheck, Mail, Phone, MapPin, MoreHorizontal, Ban, Unlock, Ticket } from 'lucide-react';

export const UsersTab: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await API.getUsers();
            setUsers(data);
        } catch (e) {
            console.error("Failed to load users", e);
        } finally {
            setLoading(false);
        }
    };

    const handleBlock = async (user: User) => {
        // Optimistic UI update could be done here, but safe to wait
        const action = user.isBlocked ? 'Unblock' : 'Block';
        if (!confirm(`${action} user ${user.fullName}? They will ${user.isBlocked ? 'regain' : 'lose'} access immediately.`)) return;

        try {
            await API.toggleUserBlock(user.id);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u));
        } catch (e: any) {
            alert(e.message || "Action failed");
        }
    };

    const filteredUsers = users.filter(u => 
        u.fullName.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.phoneNumber && u.phoneNumber.includes(search)) ||
        (u.referralCode && u.referralCode.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Card noPadding className="overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-stone-50/50">
                <div>
                    <h3 className="font-serif font-bold text-xl text-brand-900">User Directory</h3>
                    <p className="text-sm text-stone-500">Manage student accounts, access, and referrals.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-3 text-stone-400" size={16} />
                    <Input 
                        placeholder="Search by name, code, email..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 h-11 bg-white border-stone-200"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] tracking-widest border-b border-stone-100">
                        <tr>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Referrals</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-12 text-center text-stone-400">Loading directory...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={6} className="p-12 text-center text-stone-400">No users found matching your search.</td></tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id} className={`group transition-colors ${user.isBlocked ? 'bg-red-50/30' : 'hover:bg-stone-50'}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.isBlocked ? 'bg-stone-200 text-stone-500' : 'bg-brand-100 text-brand-700'}`}>
                                                {user.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-stone-900">{user.fullName}</div>
                                                <div className="text-[10px] text-stone-400 font-mono">ID: {user.id.substring(0,6)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 space-y-1">
                                        <div className="flex items-center gap-2 text-stone-600"><Mail size={12} className="text-stone-400"/> {user.email}</div>
                                        {user.phoneNumber && <div className="flex items-center gap-2 text-stone-600"><Phone size={12} className="text-stone-400"/> {user.phoneNumber}</div>}
                                        <div className="flex items-center gap-2 text-stone-500 text-xs"><MapPin size={10} /> {user.pickupPoint}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Ticket size={14} className="text-brand-400" />
                                            <span className="font-mono font-bold text-stone-700">{user.referralCode || '-'}</span>
                                        </div>
                                        <div className="text-[10px] text-stone-500 mt-1">
                                            Invited: <strong>{user.referralCount || 0}</strong>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.role === 'ADMIN' ? 'bg-brand-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.isBlocked ? (
                                            <span className="inline-flex items-center gap-1.5 text-red-700 bg-red-100 px-2.5 py-1 rounded-full text-xs font-bold border border-red-200">
                                                <Ban size={12} /> Blocked
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200">
                                                <ShieldCheck size={12} /> Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user.role !== 'ADMIN' && (
                                            <Button 
                                                size="sm" 
                                                variant={user.isBlocked ? "outline" : "ghost"} 
                                                onClick={() => handleBlock(user)}
                                                className={`h-8 w-8 p-0 rounded-full ${user.isBlocked ? 'text-stone-600 hover:text-emerald-600 hover:border-emerald-600' : 'text-stone-400 hover:text-red-600 hover:bg-red-50'}`}
                                                title={user.isBlocked ? "Unblock User" : "Block User"}
                                            >
                                                {user.isBlocked ? <Unlock size={14} /> : <Ban size={14} />}
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
