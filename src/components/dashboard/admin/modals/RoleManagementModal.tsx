
import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../../../ui';
import { User, UserRole } from '../../../../types';
import { CheckCircle, Briefcase, User as UserIcon } from 'lucide-react';

interface RoleManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSave: (userId: string, newRole: UserRole) => Promise<void>;
}

export const RoleManagementModal: React.FC<RoleManagementModalProps> = ({ isOpen, onClose, user, onSave }) => {
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (user) {
            // Default to STAFF if currently ADMIN to encourage safety, else current role
            setSelectedRole(user.role === 'ADMIN' ? UserRole.STAFF : user.role);
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setIsUpdating(true);
        try {
            await onSave(user.id, selectedRole as UserRole);
            onClose();
        } finally {
            setIsUpdating(false);
        }
    };

    const roles = [
        { 
            id: UserRole.USER, 
            label: 'Standard User', 
            desc: 'Can browse marketplace, create baskets, and make payments.',
            icon: UserIcon 
        },
        { 
            id: UserRole.STAFF, 
            label: 'Staff / Employer', 
            desc: 'Can scan delivery codes and mark orders as collected. No admin access.',
            icon: Briefcase 
        }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Manage User Role"
            size="md"
        >
            <div className="space-y-6">
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center font-bold text-lg text-stone-700 shadow-sm">
                        {user?.fullName?.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-stone-900 text-lg">{user?.fullName}</p>
                        <p className="text-sm text-stone-500">{user?.email}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Assign System Role</label>
                    {roles.map((role) => {
                        const isSelected = selectedRole === role.id;
                        return (
                            <div 
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-brand-500 bg-brand-50' : 'border-stone-100 hover:border-stone-200'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-stone-500'}`}>
                                        <role.icon size={20} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${isSelected ? 'text-brand-900' : 'text-stone-900'}`}>{role.label}</h4>
                                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">{role.desc}</p>
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-4 right-4 text-brand-600">
                                        <CheckCircle size={20} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-stone-100">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} loading={isUpdating}>Save Changes</Button>
                </div>
            </div>
        </Modal>
    );
};
