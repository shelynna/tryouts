
import React, { useState } from 'react';
import { Card, Button, Input, Select, useToast, Modal } from '../../ui';
import { User, PickupPoint } from '../../../types';
import { MapPin, CheckCircle, Edit2, Save, X, LogOut, Camera, User as UserIcon, Mail, Phone } from 'lucide-react';
import { API } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { ASSETS } from '../../../assets';

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

  const ProfileItem = ({ label, value, icon: Icon, verified }: any) => (
      <div className="flex items-center justify-between py-4 border-b border-stone-100 last:border-0 group">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400">
                  <Icon size={16} />
              </div>
              <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="font-medium text-stone-900 text-base">{value}</p>
              </div>
          </div>
          {verified && (
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle size={10} /> Verified
              </span>
          )}
      </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      
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

      {/* HEADER / AVATAR SECTION */}
      <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 group">
              <div className="w-24 h-24 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-3xl font-heading font-bold border-4 border-white shadow-xl">
                  {user.fullName.charAt(0)}
              </div>
              {/* Optional: Add functionality to upload image later */}
              <button className="absolute bottom-0 right-0 bg-stone-900 text-white p-2 rounded-full shadow-md hover:bg-brand-600 transition-colors">
                  <Camera size={14} />
              </button>
          </div>
          <h2 className="text-2xl font-heading font-bold text-stone-900">{user.fullName}</h2>
          <p className="text-stone-500 font-medium">{user.email}</p>
          <div className="mt-2">
             <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.isSubscriber ? 'bg-brand-900 text-white' : 'bg-stone-200 text-stone-600'}`}>
                 {user.isSubscriber ? 'Subscriber' : 'Standard Member'}
             </span>
          </div>
      </div>

      <Card className="overflow-hidden">
          <div className="flex justify-between items-center mb-2">
              <h3 className="font-heading font-bold text-lg text-stone-900">Personal Details</h3>
              {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-brand-600 font-bold text-sm hover:underline flex items-center gap-1">
                      <Edit2 size={14} /> Edit
                  </button>
              )}
          </div>

          {isEditing ? (
              <div className="space-y-5 animate-in fade-in pt-4">
                  <Input 
                    label="Full Name"
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                  />
                  <Input 
                    label="Phone Number"
                    value={formData.phoneNumber}
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                  />
                  <Select 
                    label="Pickup Point"
                    options={Object.values(PickupPoint).map(p => ({ label: p, value: p }))}
                    value={formData.pickupPoint}
                    onChange={(e: any) => setFormData({...formData, pickupPoint: e.target.value})}
                  />
                  
                  <div className="flex gap-3 pt-2">
                      <Button fullWidth variant="ghost" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
                      <Button fullWidth onClick={handleSave} loading={isSaving}>Save Changes</Button>
                  </div>
              </div>
          ) : (
              <div className="space-y-1">
                  <ProfileItem icon={Phone} label="Phone" value={user.phoneNumber} />
                  <ProfileItem icon={Mail} label="Email" value={user.email} verified={user.isEmailVerified} />
                  <ProfileItem icon={MapPin} label="Pickup Location" value={user.pickupPoint} />
              </div>
          )}
      </Card>

      <div className="flex justify-center">
         <button 
            onClick={() => setIsLogoutConfirmOpen(true)} 
            className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-6 py-3 rounded-xl transition-colors"
         >
            <LogOut size={18} /> Sign Out
         </button>
      </div>
    </div>
  );
};
