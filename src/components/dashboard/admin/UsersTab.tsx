
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Pagination, Badge, useToast } from '../../ui';
import { User, UserRole } from '../../../types';
import { API } from '../../../lib/api';
import { Search, Mail, Phone, MapPin, Ticket, CheckCircle, Shield, Briefcase, User as UserIcon, Edit2 } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { Logger } from '../../../lib/logger';
import { RoleManagementModal } from './modals/RoleManagementModal';

const ITEMS_PER_PAGE = 8;

export const UsersTab: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const { showToast } = useToast();
    
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const fetchUsers = async () => {
        try {
            const data = await API.getUsers();
            setUsers(data);
        } catch (e) {
            Logger.error("Failed to load users", e);
            showToast("Failed to load user directory", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleBlock = async (user: User) => {
        const action = user.isBlocked ? 'Unblock' : 'Block';
        if (!confirm(`${action} user ${user.fullName}?`)) return;

        try {
            await API.toggleUserBlock(user.id);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u));
            showToast(`User ${action.toLowerCase()}ed`, 'success');
        } catch (e: any) {
            Logger.error(`Failed to ${action} user`, e, { userId: user.id });
            showToast(e.message || "Action failed", 'error');
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: UserRole) => {
        try {
            await API.updateUserRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            showToast(`Role updated to ${newRole}`, 'success');
        } catch (e: any) {
            showToast("Failed to update role", "error");
            throw e; // Modal handles loading state
        }
    };

    const filteredUsers = users.filter(u => 
        u.fullName?.toLowerCase().includes(search.toLowerCase()) || 
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        (u.phoneNumber && u.phoneNumber.includes(search)) ||
        (u.referralCode && u.referralCode.toLowerCase().includes(search.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getRoleIcon = (role: string) => {
        switch(role) {
            case 'ADMIN': return <Shield size={12} className="text-white"/>;
            case 'STAFF': return <Briefcase size={12} className="text-stone-600"/>;
            default: return <UserIcon size={12} className="text-stone-500"/>;
        }
    };

    return (
        <Card noPadding className="overflow-hidden flex flex-col h-full">
            <RoleManagementModal 
                isOpen={!!editingUser} 
                onClose={() => setEditingUser(null)} 
                user={editingUser} 
                onSave={handleRoleUpdate} 
            />

            <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-stone-50/50">
                <div>
                    <h3 className="font-heading font-bold text-xl text-brand-900">User Directory</h3>
                    <p className="text-sm text-stone-500">Manage {filteredUsers.length} student accounts.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-3.5 text-stone-400" size={16} />
                    <Input 
                        placeholder="Search name, code, email..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 h-11 bg-white border-stone-200"
                    />
                </div>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left">
                    <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] tracking-widest border-b border-stone-100">
                        <tr>
                            <th className="px-6 py-4 min-w-[200px]">Student</th>
                            <th className="px-6 py-4 min-w-[200px]">Contact</th>
                            <th className="px-6 py-4 whitespace-nowrap">Stats</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-12 text-center text-stone-400">Loading directory...</td></tr>
                        ) : paginatedUsers.length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center text-stone-400">No users found.</td></tr>
                        ) : (
                            paginatedUsers.map(user => (
                                <tr key={user.id} className={`group transition-colors ${user.isBlocked ? 'bg-red-50/30' : 'hover:bg-stone-50'}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-heading font-bold shadow-sm ${user.isBlocked ? 'bg-stone-200 text-stone-500' : 'bg-white border border-stone-200 text-brand-900'}`}>
                                                {user.fullName?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-stone-900">{user.fullName || 'Unknown'}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${user.role === 'ADMIN' ? 'bg-stone-900 text-white' : user.role === 'STAFF' ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-500'}`}>
                                                        {getRoleIcon(user.role)} {user.role}
                                                    </span>
                                                    {user.isSubscriber && <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-bold uppercase">Sub</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 space-y-1.5">
                                        <div className="flex items-center gap-2 text-stone-600 truncate max-w-[200px]" title={user.email}>
                                            <Mail size={12} className="text-stone-400 shrink-0"/> {user.email}
                                        </div>
                                        {user.phoneNumber && (
                                            <div className="flex items-center gap-2 text-stone-600">
                                                <Phone size={12} className="text-stone-400 shrink-0"/> {user.phoneNumber}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-stone-500 text-xs">
                                            <MapPin size={10} className="shrink-0"/> {user.pickupPoint}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs">
                                                <Ticket size={12} className="text-brand-400" />
                                                <span className="font-mono font-bold text-stone-700">{user.referralCode || '-'}</span>
                                            </div>
                                            <div className="text-[10px] text-stone-500">
                                                Invited: <strong>{user.referralCount || 0}</strong>
                                            </div>
                                            {user.creditBalance > 0 && (
                                                <div className="text-[10px] text-emerald-600 font-bold">
                                                    Credit: {formatCurrency(user.creditBalance)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user.isBlocked ? (
                                            <Badge status="DENIED" size="sm" />
                                        ) : (
                                            <div className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                                                <CheckCircle size={10} /> Active
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => setEditingUser(user)}
                                                className="h-8 px-2 border-stone-200 text-stone-600 hover:text-brand-700 hover:border-brand-200"
                                                title="Manage Role"
                                            >
                                                <Edit2 size={12} />
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant={user.isBlocked ? 'success' : 'danger'}
                                                onClick={() => handleBlock(user)}
                                                className="h-8 px-3 text-xs"
                                                title={user.isBlocked ? "Unblock Access" : "Block Access"}
                                            >
                                                {user.isBlocked ? 'Unblock' : 'Block'}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-auto border-t border-stone-100">
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
        </Card>
    );
};
