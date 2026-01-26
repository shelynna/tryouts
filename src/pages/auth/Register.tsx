
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Select, useToast, Card } from '../../components/ui';
import { User, Lock, Mail, Phone, MapPin, Check, Ticket, MailOpen, UserPlus } from 'lucide-react';
import { PickupPoint } from '../../types';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthLayout } from '../../components/layout/AuthLayout';

interface RegisterProps {
  onNavigate: (view: string) => void;
}

const STEP_CREDENTIALS = 0;
const STEP_PERSONAL = 1;
const STEP_PREFERENCES = 2;

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { registerSync } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(STEP_CREDENTIALS);

  const [formData, setFormData] = useState({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      phoneNumber: '',
      pickupPoint: PickupPoint.HALL_7,
      referralCode: ''
  });
  
  const [hasReferral, setHasReferral] = useState(false);

  const updateField = (field: string, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
      if (currentStep === STEP_CREDENTIALS) {
          if (!formData.email || !formData.email.includes('@')) return "Please enter a valid email.";
          if (formData.password.length < 6) return "Password must be at least 6 characters.";
          if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
      }
      if (currentStep === STEP_PERSONAL) {
          if (!formData.fullName.trim()) return "Full name is required.";
          if (formData.fullName.split(' ').length < 2) return "Please enter your first and last name.";
          if (!formData.phoneNumber || formData.phoneNumber.length < 10) return "Please enter a valid phone number.";
      }
      return null;
  };

  const handleNext = () => {
      const error = validateStep();
      if (error) {
          showToast(error, 'error');
          return;
      }
      setCurrentStep(prev => prev + 1);
  };

  const handleRegister = async () => {
      setIsLoading(true);
      try {
          // 1. Supabase Sign Up
          const { data, error } = await supabase.auth.signUp({
              email: formData.email,
              password: formData.password,
              options: {
                  data: {
                      full_name: formData.fullName,
                  }
              }
          });

          if (error) throw error;
          if (!data.user) throw new Error("No user created");

          // 2. Sync additional details
          const syncRes = await registerSync({
              id: data.user.id,
              phoneNumber: formData.phoneNumber,
              pickupPoint: formData.pickupPoint as PickupPoint,
              fullName: formData.fullName,
              referralCode: hasReferral ? formData.referralCode : '' 
          });

          if (!syncRes.success) throw new Error(syncRes.message);

          // Success State - Show Prompt
          setIsSuccess(true);
      } catch (error: any) {
          showToast(error.message, 'error');
      } finally {
          setIsLoading(false);
      }
  };

  // Explicit Success UI to prevent "Spam" confusion
  if (isSuccess) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
              <Card className="max-w-md w-full text-center p-8 space-y-6">
                  <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto text-brand-600">
                      <MailOpen size={40} />
                  </div>
                  <div>
                      <h2 className="text-2xl font-serif font-bold text-stone-900">Check Your Email</h2>
                      <p className="text-stone-500 mt-2">
                          We've sent a verification link to <strong>{formData.email}</strong>.
                      </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-yellow-800">
                      <strong>Note:</strong> If you don't see it in your Inbox, please check your <strong>Spam</strong> or <strong>Promotions</strong> folder.
                  </div>
                  <Button onClick={() => onNavigate('LOGIN')} fullWidth variant="outline">
                      Back to Login
                  </Button>
              </Card>
          </div>
      );
  }

  return (
    <AuthLayout 
        title="Create Account" 
        subtitle="Join 1,000+ students shopping smarter."
        onBack={() => onNavigate('LANDING')}
        testimonial={{
            quote: "I love that I can pay small-small via Momo. It fits my unpredictable student cashflow perfectly.",
            author: "David K.",
            role: "Engineering, Legon"
        }}
    >
        {/* Progress Indicators */}
        <div className="flex justify-between mb-8 px-2 relative">
            {[0, 1, 2].map((step) => (
                <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        step === currentStep 
                            ? 'bg-brand-900 text-white scale-110 shadow-lg' 
                            : step < currentStep 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-stone-200 text-stone-400'
                    }`}>
                        {step < currentStep ? <Check size={14} strokeWidth={3} /> : step + 1}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                        {step === 0 ? 'Login' : step === 1 ? 'Details' : 'Finish'}
                    </span>
                </div>
            ))}
            {/* Connecting Lines */}
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-stone-200 z-0 mx-10 mt-1 hidden sm:block" />
        </div>

        <div className="min-h-[350px] flex flex-col">
            <AnimatePresence mode="wait">
                {currentStep === STEP_CREDENTIALS && (
                    <motion.div 
                        key="step1" 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} 
                        className="space-y-4"
                    >
                        <Input 
                            label="Email Address" type="email" icon={<Mail size={18}/>} 
                            value={formData.email} onChange={e => updateField('email', e.target.value)} 
                            placeholder="you@school.edu"
                            autoFocus
                        />
                        <Input 
                            label="Create Password" type="password" icon={<Lock size={18}/>} 
                            value={formData.password} onChange={e => updateField('password', e.target.value)} 
                            placeholder="Min 6 characters"
                        />
                        <Input 
                            label="Confirm Password" type="password" icon={<Lock size={18}/>} 
                            value={formData.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} 
                            placeholder="Re-enter password"
                        />
                    </motion.div>
                )}

                {currentStep === STEP_PERSONAL && (
                    <motion.div 
                        key="step2" 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} 
                        className="space-y-4"
                    >
                        <Input 
                            label="Full Name" icon={<User size={18}/>} 
                            value={formData.fullName} onChange={e => updateField('fullName', e.target.value)} 
                            placeholder="First and Last Name"
                            autoFocus
                        />
                        <Input 
                            label="Phone Number (Momo)" icon={<Phone size={18}/>} 
                            value={formData.phoneNumber} onChange={e => updateField('phoneNumber', e.target.value)} 
                            placeholder="024 XXX XXXX"
                        />
                        <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 flex gap-3 items-start">
                            <div className="bg-white p-1 rounded-full text-brand-500"><Check size={12}/></div>
                            <p className="text-xs text-brand-800 leading-relaxed">Ensure this number is active on WhatsApp for delivery updates.</p>
                        </div>
                    </motion.div>
                )}

                {currentStep === STEP_PREFERENCES && (
                    <motion.div 
                        key="step3" 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} 
                        className="space-y-6"
                    >
                        <Select 
                            label="Preferred Pickup Point" 
                            icon={<MapPin size={18} />}
                            value={formData.pickupPoint} 
                            onChange={(e: any) => updateField('pickupPoint', e.target.value)} 
                            options={Object.values(PickupPoint).map(p => ({ label: p, value: p }))} 
                        />
                        
                        {/* Referral Section - Distinct UI */}
                        {!hasReferral ? (
                             <button 
                                onClick={() => setHasReferral(true)}
                                className="w-full py-4 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center justify-center gap-2 text-sm font-bold"
                             >
                                <Ticket size={16} /> I have a Referral Code
                             </button>
                        ) : (
                            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 animate-in fade-in">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Friend's Referral Code</label>
                                    <button onClick={() => { setHasReferral(false); updateField('referralCode', ''); }} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                                </div>
                                <Input 
                                    icon={<UserPlus size={18} />}
                                    value={formData.referralCode} 
                                    onChange={e => updateField('referralCode', e.target.value.toUpperCase())} 
                                    placeholder="e.g. DAV-9021"
                                    className="uppercase font-mono tracking-wider"
                                    autoFocus
                                />
                                <p className="text-[10px] text-stone-400">Enter code to support your referrer.</p>
                            </div>
                        )}

                        <div className="text-center pt-2">
                             <p className="text-xs text-stone-400">By clicking Register, you agree to our Terms of Service.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-auto pt-8 flex gap-3">
                {currentStep > 0 && (
                    <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} className="w-1/3 border-stone-300">
                        Back
                    </Button>
                )}
                <Button 
                    fullWidth 
                    size="lg"
                    onClick={currentStep === STEP_PREFERENCES ? handleRegister : handleNext} 
                    loading={isLoading}
                    className="shadow-xl shadow-brand-900/10"
                >
                    {currentStep === STEP_PREFERENCES ? 'Create Account' : 'Continue'}
                </Button>
            </div>
        </div>
        
        <div className="text-center pt-6 border-t border-stone-100 mt-6">
           <p className="text-stone-500 font-medium">
              Already have an account? <button onClick={() => onNavigate('LOGIN')} className="text-brand-700 font-bold hover:underline">Log in</button>
           </p>
        </div>
    </AuthLayout>
  );
};
