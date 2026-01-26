
import React, { useState } from 'react';
import { Card, Button, Input, Select, useToast } from '../../ui';
import { User, PickupPoint } from '../../../types';
import { MapPin, CheckCircle, Edit2, Save, X } from 'lucide-react';
import { API } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

// Helper component
const CheckIcon = ({ size }: { size: number }) => (
    <CheckCircle size={size} />
);

export const SettingsTab: React.FC<{ user: User }> = ({ user }) => {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      <div className="grid md:grid-cols-3 gap-8">
          <Card className="md:col-span-2">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-serif font-bold text-xl text-brand-900">Account Settings</h3>
                  {!isEditing ? (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                          <Edit2 size={14} /> Edit Profile
                      </Button>
                  ) : (
                      <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving} className="gap-1 text-stone-500">
                              <X size={14} /> Cancel
                          </Button>
                          <Button size="sm" onClick={handleSave} loading={isSaving} className="gap-1">
                              <Save size={14} /> Save
                          </Button>
                      </div>
                  )}
              </div>
              
              <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                          {isEditing ? (
                              <Input 
                                label="Full Name"
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                              />
                          ) : (
                              <>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Full Name</label>
                                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-medium">{user.fullName}</div>
                              </>
                          )}
                      </div>
                      <div>
                          {isEditing ? (
                              <Input 
                                label="Phone Number"
                                value={formData.phoneNumber}
                                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                              />
                          ) : (
                              <>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Phone</label>
                                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-medium">{user.phoneNumber}</div>
                              </>
                          )}
                      </div>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Email Address</label>
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 font-medium flex justify-between items-center">
                          {user.email}
                          {user.isEmailVerified ? (
                              <span className="text-emerald-600 text-xs bg-emerald-50 px-2 py-1 rounded-md font-bold flex items-center gap-1"><CheckIcon size={10} /> Verified</span>
                          ) : (
                              <span className="text-orange-600 text-xs bg-orange-50 px-2 py-1 rounded-md font-bold">Unverified</span>
                          )}
                      </div>
                  </div>

                  {isEditing && (
                      <div>
                          <Select 
                            label="Preferred Pickup Point"
                            options={Object.values(PickupPoint).map(p => ({ label: p, value: p }))}
                            value={formData.pickupPoint}
                            onChange={(e: any) => setFormData({...formData, pickupPoint: e.target.value})}
                          />
                      </div>
                  )}
              </div>
          </Card>

          <Card className="bg-brand-50 border-brand-100">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4 text-brand-600 border border-brand-100">
                 <MapPin size={24} />
              </div>
              <h3 className="font-bold text-brand-900 mb-2">Pickup Location</h3>
              <p className="text-sm text-brand-700 mb-6">Your designated collection point for the current cycle.</p>
              <div className="p-4 bg-white rounded-xl border border-brand-100 shadow-sm text-center font-serif font-bold text-xl text-brand-900">
                  {isEditing ? formData.pickupPoint : user.pickupPoint}
              </div>
              <p className="text-xs text-brand-400 mt-4 text-center">
                  {isEditing ? "Select a new point above to change." : "To change this, verify contact support or edit profile before Lock Date."}
              </p>
          </Card>
      </div>
  );
};
