
import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Input, Select, useToast, Modal } from '../../ui';
import { User, PickupPoint } from '../../../types';
import { MapPin, Edit2, LogOut, Camera, User as UserIcon, Mail, Phone, Loader2, Crown, CreditCard, CalendarCheck } from 'lucide-react';
import { API } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../../../hooks/useSubscription';
import { PlanSelector } from '../../subscription/PlanSelector';
import { env } from '../../../lib/env';
import { formatDate } from '../../../lib/utils';

declare global {
    interface Window {
        PaystackPop: any;
    }
}

export const SettingsTab: React.FC<{ user: User }> = ({ user }) => {
  const { refreshUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SUBSCRIPTION'>('PROFILE');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscription State
  const { downgradeToStandard, isSML, loading: subLoading, refresh: refreshSubscription, planContext } = useSubscription(user?.id || '');
  const [isProcessingSub, setIsProcessingSub] = useState(false);

  useEffect(() => {
      const params = new URLSearchParams(location.search);
      if (params.get('tab') === 'subscription') {
          setActiveTab('SUBSCRIPTION');
      }
  }, [location.search]);

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
          showToast("Image size must be less than 2MB", "error");
          return;
      }

      setIsUploading(true);
      try {
          const url = await API.uploadImage(file, 'avatars');
          await API.updateProfile({ ...user, avatarUrl: url });
          await refreshUser();
          showToast("Profile picture updated", "success");
          setImageError(false);
      } catch (e: any) {
          showToast("Failed to upload image", "error");
      } finally {
          setIsUploading(false);
      }
  };

  const verifySubscription = async (reference: string) => {
        try {
            showToast("Verifying subscription...", "info");
            const res = await API.subscription.verifyAndCompleteSubscription({
                reference: reference,
                userId: user.id,
                planId: 'sml'
            });

            if (!res.success) throw new Error(res.error || "Verification failed");
            
            await Promise.all([
                refreshUser(),
                refreshSubscription()
            ]);
            showToast("Welcome to SML Subscriber Tier!", "success");
        } catch (verifyError: any) {
            console.error("Verification failed", verifyError);
            showToast("Verification failed: " + verifyError.message, "error");
        } finally {
            setIsProcessingSub(false);
        }
  };

  const handleUpgradePayment = async () => {
    setIsProcessingSub(true);
    const amount = 15.00;

    try {
        const publicKey = env.VITE_PAYSTACK_PUBLIC_KEY;
        if (!publicKey) throw new Error("Payment System Error: Missing Public Key");

        if (!window.PaystackPop) {
            await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://js.paystack.co/v1/inline.js';
                script.async = true;
                script.onload = resolve;
                document.body.appendChild(script);
            });
        }

        const handler = window.PaystackPop.setup({
            key: publicKey, 
            email: user.email,
            amount: Math.ceil(amount * 100),
            currency: 'GHS',
            ref: `SMM-SUB-${Math.floor(Math.random() * 1000000000 + 1)}`,
            metadata: { 
                custom_fields: [{ display_name: "Type", variable_name: "type", value: "SUBSCRIPTION" }] 
            },
            callback: function(response: any) {
                verifySubscription(response.reference);
            },
            onClose: function() { 
                setIsProcessingSub(false); 
                showToast("Payment cancelled", "info"); 
            }
        });
        handler.openIframe();

    } catch (e: any) {
        setIsProcessingSub(false);
        showToast("Payment Init Failed: " + e.message, "error");
    }
  };

  const handlePlanSelect = async (code: string) => {
    if (code === 'sml') {
        await handleUpgradePayment();
    } else {
        if (confirm("Downgrade to Standard? You will lose credit access immediately.")) {
            const res = await downgradeToStandard();
            if (res.success) {
                showToast("Plan downgraded to Standard.", "success");
                await Promise.all([
                    refreshUser(),
                    refreshSubscription()
                ]);
            } else {
                showToast("Downgrade failed: " + res.error, "error");
            }
        }
    }
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
          
          {/* LEFT COLUMN: IDENTITY & NAVIGATION */}
          <div className="lg:col-span-1 space-y-6">
              <Card className="p-8 flex flex-col items-center text-center border-stone-200 shadow-md">
                  <div className="relative mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-32 h-32 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center text-4xl font-heading font-bold border-4 border-white shadow-xl overflow-hidden relative">
                          {user.avatarUrl && !imageError ? (
                              <img 
                                src={user.avatarUrl} 
                                alt="Profile" 
                                className="w-full h-full object-cover" 
                                onError={() => setImageError(true)}
                              />
                          ) : (
                              user.fullName ? user.fullName.charAt(0) : <UserIcon size={40} />
                          )}
                          
                          {isUploading && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                  <Loader2 className="animate-spin text-white" size={24} />
                              </div>
                          )}
                      </div>
                      <div className="absolute bottom-0 right-0 bg-stone-900 text-white p-2.5 rounded-full shadow-lg border-4 border-white z-10 transition-transform group-hover:scale-110">
                          <Camera size={16} />
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                  </div>
                  
                  <h2 className="text-2xl font-heading font-bold text-stone-900 mb-1">{user.fullName}</h2>
                  <p className="text-stone-500 font-medium text-sm mb-4">{user.email}</p>
                  
                  <div className="w-full space-y-2 mt-4">
                      <button 
                        onClick={() => setActiveTab('PROFILE')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'PROFILE' ? 'bg-stone-900 text-white shadow-lg' : 'bg-transparent text-stone-500 hover:bg-stone-50'}`}
                      >
                          <UserIcon size={18} /> Personal Details
                      </button>
                      <button 
                        onClick={() => setActiveTab('SUBSCRIPTION')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'SUBSCRIPTION' ? 'bg-stone-900 text-white shadow-lg' : 'bg-transparent text-stone-500 hover:bg-stone-50'}`}
                      >
                          <CreditCard size={18} /> My Subscription
                      </button>
                  </div>

                  <div className="mt-8 w-full pt-6 border-t border-stone-100">
                      <button onClick={() => setIsLogoutConfirmOpen(true)} className="w-full flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-3 rounded-xl transition-colors">
                        <LogOut size={18} /> Sign Out
                      </button>
                  </div>
              </Card>
          </div>

          {/* RIGHT COLUMN: DYNAMIC CONTENT */}
          <div className="lg:col-span-2">
              {activeTab === 'PROFILE' ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                      <Card className="h-auto border-stone-200 shadow-sm relative overflow-visible">
                          <div className="flex justify-between items-center mb-8 pb-4 border-b border-stone-100">
                              <div>
                                  <h3 className="font-heading font-bold text-xl text-stone-900">Personal Details</h3>
                                  <p className="text-stone-500 text-sm">Manage your contact information.</p>
                              </div>
                              {!isEditing && (
                                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                                      <Edit2 size={14} /> Edit
                                  </Button>
                              )}
                          </div>

                          {isEditing ? (
                              <div className="space-y-6">
                                  <div className="grid md:grid-cols-2 gap-6">
                                      <Input label="Full Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} icon={<UserIcon size={18} />} />
                                      <Input label="Phone Number" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} icon={<Phone size={18} />} />
                                  </div>
                                  <Select label="Preferred Pickup Point" options={Object.values(PickupPoint).map(p => ({ label: p, value: p }))} value={formData.pickupPoint} onChange={(e: any) => setFormData({...formData, pickupPoint: e.target.value})} />
                                  <div className="flex gap-4 pt-4 border-t border-stone-100 mt-8">
                                      <Button variant="ghost" onClick={handleCancel} disabled={isSaving} className="w-1/3">Cancel</Button>
                                      <Button onClick={handleSave} loading={isSaving} disabled={isSaving} className="w-2/3">Save Changes</Button>
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
                                          <div className="p-3 bg-brand-100 text-brand-700 rounded-xl"><MapPin size={24} /></div>
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
              ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <Card className="border-stone-200 shadow-sm p-6 relative overflow-hidden">
                          <div className="flex items-center justify-between mb-6">
                              <div>
                                  <h3 className="font-heading font-bold text-xl text-stone-900">Membership Plan</h3>
                                  <p className="text-stone-500 text-sm">Upgrade to unlock credit and priority features.</p>
                              </div>
                              {isSML && (
                                  <div className="bg-brand-900 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md">
                                      <Crown size={14} className="text-yellow-400" /> Active Subscriber
                                  </div>
                              )}
                          </div>
                          
                          {isSML && planContext?.subscription && (
                              <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                  <div className="flex items-center gap-3 text-emerald-800">
                                      <CalendarCheck size={20} />
                                      <span className="font-bold">Valid until {formatDate(planContext.subscription.current_period_end)}</span>
                                  </div>
                              </div>
                          )}
                          
                          {subLoading ? (
                              <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-stone-400"/></div>
                          ) : (
                              <PlanSelector userId={user.id} onPlanSelect={handlePlanSelect} />
                          )}
                      </Card>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
