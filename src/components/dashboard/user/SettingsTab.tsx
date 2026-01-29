
import React, { useState } from 'react';
import { Card, Button, Input, Select, useToast, Modal } from '../../ui';
import { User, PickupPoint } from '../../../types';
import { MapPin, CheckCircle, Edit2, LogOut, Camera, User as UserIcon, Mail, Phone, Shield } from 'lucide-react';
import { API } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

export const SettingsTab: React.FC<{ user: User }> = ({ user }) => {
  const { refreshUser, logout } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      pickupPoint: user.pickupPoint
  });

  const handleSave = async () => {
      setIsSaving(true);
      try {
          await API.updateProfile(formData);
          await refreshUser();
          setIsEditing(false);
          showToast("Profile updated successfully", "success");
      } catch (e: any) {
          showToast(e.message || "Failed to update profile", "error");
      } finally {
          setIsSaving(false);
      }
  };

  const handleCancel = () => {
      setFormData({
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          pickupPoint: user.pickupPoint
      });
      setIsEditing(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-20">
      
      <Modal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        title="Sign Out"
        size="sm"
        footer={
            <>
                <Button variant="ghost" onClick={() => setIsLogoutConfirmOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={logout}>Confirm Sign Out</Button>
            </>
        }
      >
        <p className="text-stone-600">
            Are you sure you want to sign out of your account?
        </p>
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: IDENTITY CARD */}
          <div className="lg:col-span-1">
              <Card className="p-8 flex flex-col items-center text-center h-full border-stone-200 shadow-md">
                  <div className="relative mb-6">
                      <div className="w-32 h-32 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center text-4xl font-heading font-bold border-4 border-white shadow-xl overflow-hidden">
                          {user.fullName ? user.fullName.charAt(0) : <UserIcon size={40} />}
                      </div>
                      <div className="absolute bottom-0 right-0 bg-stone-900 text-white p-2.5 rounded-full shadow-lg border-4 border-white">
                          <Shield size={16} />
                      </div>
                  </div>
                  
                  <h2 className="text-2xl font-heading font-bold text-stone-900 mb-1">{user.fullName}</h2>
                  <p className="text-stone-500 font-medium text-sm mb-4">{user.email}</p>
                  
                  <div className="flex gap-2 mb-8">
                     <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${user.isSubscriber ? 'bg-brand-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                         {user.isSubscriber ? 'Subscriber' : 'Standard'}
                     </span>
                     {user.isEmailVerified && (
                         <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100">
                             <CheckCircle size={10} /> Verified
                         </span>
                     )}
                  </div>

                  <div className="mt-auto w-full pt-6 border-t border-stone-100">
                      <button 
                        onClick={() => setIsLogoutConfirmOpen(true)} 
                        className="w-full flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-3 rounded-xl transition-colors"
                      >
                        <LogOut size={18} /> Sign Out
                      </button>
                  </div>
              </Card>
          </div>

          {/* RIGHT COLUMN: DETAILS FORM */}
          <div className="lg:col-span-2">
              <Card className="h-full border-stone-200 shadow-sm relative overflow-visible">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-stone-100">
                      <div>
                          <h3 className="font-heading font-bold text-xl text-stone-900">Account Details</h3>
                          <p className="text-stone-500 text-sm">Manage your contact information and delivery preferences.</p>
                      </div>
                      {!isEditing && (
                          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                              <Edit2 size={14} /> Edit
                          </Button>
                      )}
                  </div>

                  {isEditing ? (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="grid md:grid-cols-2 gap-6">
                              <Input 
                                label="Full Name"
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                                icon={<UserIcon size={18} />}
                              />
                              <Input 
                                label="Phone Number"
                                value={formData.phoneNumber}
                                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                                icon={<Phone size={18} />}
                              />
                          </div>
                          
                          <Select 
                            label="Preferred Pickup Point"
                            options={Object.values(PickupPoint).map(p => ({ label: p, value: p }))}
                            value={formData.pickupPoint}
                            onChange={(e: any) => setFormData({...formData, pickupPoint: e.target.value})}
                          />
                          
                          <div className="flex gap-4 pt-4 border-t border-stone-100 mt-8">
                              <Button variant="ghost" onClick={handleCancel} disabled={isSaving} className="w-1/3">Cancel</Button>
                              <Button onClick={handleSave} loading={isSaving} className="w-2/3">Save Changes</Button>
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Phone Number</p>
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-white rounded-lg text-stone-600"><Phone size={18} /></div>
                                      <span className="font-medium text-stone-900 text-lg">{user.phoneNumber || 'Not set'}</span>
                                  </div>
                              </div>
                              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Email Address</p>
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-white rounded-lg text-stone-600"><Mail size={18} /></div>
                                      <span className="font-medium text-stone-900 text-lg truncate">{user.email}</span>
                                  </div>
                              </div>
                          </div>

                          <div className="p-6 bg-brand-50/50 rounded-2xl border border-brand-100/50">
                              <div className="flex items-start gap-4">
                                  <div className="p-3 bg-brand-100 text-brand-700 rounded-xl">
                                      <MapPin size={24} />
                                  </div>
                                  <div>
                                      <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-1">Default Pickup Point</p>
                                      <h4 className="text-xl font-bold text-brand-900">{user.pickupPoint}</h4>
                                      <p className="text-sm text-brand-700/70 mt-1">Your monthly items will be delivered here.</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
              </Card>
          </div>
      </div>
    </div>
  );
};
