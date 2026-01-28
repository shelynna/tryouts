
import React, { useState } from 'react';
import { Button, Input, Select, useToast, Card } from '../../components/ui';
import { User, Lock, Mail, Phone, MapPin, Check, Ticket, MailOpen, UserPlus, X, Loader2, Crown } from 'lucide-react';
import { PickupPoint } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { ZodError } from 'zod';
import { RegisterStep1Schema, RegisterStep2Schema, RegisterStep3Schema } from '../../lib/validation';
import { Logger } from '../../lib/logger';
import { API } from '../../lib/api';

const MotionDiv = motion.div as any;

interface RegisterProps {
  onNavigate: (view: string) => void;
  logoUrl?: string;
}

const STEP_CREDENTIALS = 0;
const STEP_PERSONAL = 1;
const STEP_PLAN = 2; 
const STEP_PREFERENCES = 3;

export const Register: React.FC<RegisterProps> = ({ onNavigate, logoUrl }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(STEP_CREDENTIALS);

  const [formData, setFormData] = useState({
      email: '', password: '', confirmPassword: '',
      fullName: '', phoneNumber: '',
      pickupPoint: PickupPoint.HALL_7, referralCode: '',
      plan: 'STANDARD'
  });
  
  const [hasReferral, setHasReferral] = useState(false);

  const updateField = (field: string, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    try {
        if (currentStep === STEP_CREDENTIALS) RegisterStep1Schema.parse(formData);
        if (currentStep === STEP_PERSONAL) RegisterStep2Schema.parse(formData);
        if (currentStep === STEP_PREFERENCES) RegisterStep3Schema.parse(formData);
        return true;
    } catch (error) {
        if (error instanceof ZodError) showToast(error.issues[0].message, 'error');
        return false;
    }
  };

  const handleNext = () => {
      if (!validateStep()) return;
      setCurrentStep(prev => prev + 1);
  };

  const handleRegister = async () => {
      if (!validateStep()) return;
      
      if (hasReferral) {
          if (!formData.referralCode.trim()) {
              showToast("Please enter a referral code.", "error");
              return;
          }
          setIsValidatingCode(true);
          try {
              const isValid = await API.checkReferralCode(formData.referralCode);
              if (!isValid) {
                  showToast("Invalid Code.", "error");
                  setIsValidatingCode(false);
                  return;
              }
          } catch (e) {
              setIsValidatingCode(false);
              return;
          }
          setIsValidatingCode(false);
      }
      
      setIsLoading(true);
      try {
          // Dynamic URL base - works for localhost or prod automatically
          const redirectUrl = `${window.location.origin}/verify-email`;

          // v2 signUp signature
          const { data, error } = await supabase.auth.signUp(
              {
                  email: formData.email,
                  password: formData.password,
                  options: {
                      data: {
                          full_name: formData.fullName,
                          phone: formData.phoneNumber,
                          pickup_point: formData.pickupPoint,
                          referral_code_input: hasReferral ? formData.referralCode : '',
                          plan_intent: formData.plan // Stores selection in metadata for cross-device retrieval
                      },
                      emailRedirectTo: redirectUrl
                  }
              }
          );

          if (error) throw error;
          
          // Backup intention for immediate device login
          if (formData.plan === 'SUBSCRIBER') {
              localStorage.setItem('sml_intent', 'SUBSCRIBE');
          }

          if (!data.user) throw new Error("Account creation failed.");

          // If session is null, email confirmation is required (normal flow)
          if (data.user && !data.session) {
             setIsSuccess(true);
          } else {
             // If auto-confirm is on (dev), skip to dashboard
             showToast("Account created successfully!", "success");
             onNavigate('DASHBOARD');
          }

      } catch (error: any) {
          Logger.error("Registration failed", error);
          showToast(error.status === 429 ? "Too many attempts. Please wait a moment." : (error.message || "Registration failed"), 'error');
      } finally {
          setIsLoading(false);
      }
  };

  if (isSuccess) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
              <MotionDiv initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
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
                      <div className="bg-amber-50 p-4 rounded-xl shadow-sm text-sm text-amber-800">
                          <strong>Note:</strong> Check your <strong>Spam</strong> folder if you don't see it.
                          {formData.plan === 'SUBSCRIBER' && (
                              <span className="block mt-2 font-bold text-brand-700">
                                  You will be prompted to pay your subscription fee upon first login.
                              </span>
                          )}
                      </div>
                      <Button onClick={() => onNavigate('LOGIN')} fullWidth variant="outline">
                          Go to Login
                      </Button>
                  </Card>
              </MotionDiv>
          </div>
      );
  }

  return (
    <AuthLayout 
        title="Create Account" 
        subtitle="Join 1,000+ students shopping smarter."
        onBack={() => onNavigate('LANDING')}
        logoUrl={logoUrl}
    >
        <div className="flex justify-between mb-8 px-2 relative">
            {[0, 1, 2, 3].map((step) => (
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
                </div>
            ))}
            <div className="absolute left-0 right-0 top-3.5 h-1 bg-stone-100 z-0 mx-12" >
                <div className="h-1 bg-brand-500 transition-all duration-500" style={{width: `${(currentStep / 3) * 100}%`}}></div>
            </div>
        </div>

        <div className="min-h-[350px] flex flex-col">
            <AnimatePresence mode="wait">
                <MotionDiv 
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {currentStep === STEP_CREDENTIALS && (
                        <div className="space-y-4">
                            <Input label="Email Address" type="email" icon={<Mail size={18}/>} value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="you@school.edu" autoFocus />
                            <Input label="Create Password" type="password" icon={<Lock size={18}/>} value={formData.password} onChange={e => updateField('password', e.target.value)} placeholder="Min 6 characters" />
                            <Input label="Confirm Password" type="password" icon={<Lock size={18}/>} value={formData.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} placeholder="Re-enter password" />
                        </div>
                    )}
                    {currentStep === STEP_PERSONAL && (
                        <div className="space-y-4">
                            <Input label="Full Name" icon={<User size={18}/>} value={formData.fullName} onChange={e => updateField('fullName', e.target.value)} placeholder="First and Last Name" autoFocus />
                            <Input label="Phone Number (Momo)" icon={<Phone size={18}/>} value={formData.phoneNumber} onChange={e => updateField('phoneNumber', e.target.value)} placeholder="024 XXX XXXX" />
                        </div>
                    )}
                    {currentStep === STEP_PLAN && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-stone-900 text-center mb-2">Select your Plan</h3>
                            <div 
                                onClick={() => updateField('plan', 'STANDARD')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.plan === 'STANDARD' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200' : 'border-stone-200 hover:border-stone-300'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-stone-900">Standard</h4>
                                        <p className="text-xs text-stone-500">Pay as you go</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-lg">Free</span>
                                    </div>
                                </div>
                            </div>

                            <div 
                                onClick={() => updateField('plan', 'SUBSCRIBER')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${formData.plan === 'SUBSCRIBER' ? 'border-brand-900 bg-stone-900 text-white shadow-xl transform scale-[1.02]' : 'border-stone-200 hover:border-brand-300'}`}
                            >
                                {formData.plan === 'SUBSCRIBER' && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Recommended
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Crown size={18} className={formData.plan === 'SUBSCRIBER' ? 'text-brand-400' : 'text-stone-400'} />
                                        <div>
                                            <h4 className={`font-bold ${formData.plan === 'SUBSCRIBER' ? 'text-white' : 'text-stone-900'}`}>Subscriber</h4>
                                            <p className={`text-xs ${formData.plan === 'SUBSCRIBER' ? 'text-stone-400' : 'text-stone-500'}`}>Full Experience</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`block font-bold text-lg ${formData.plan === 'SUBSCRIBER' ? 'text-white' : 'text-stone-900'}`}>GHS 15</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentStep === STEP_PREFERENCES && (
                        <div className="space-y-6">
                            <Select label="Preferred Pickup Point" value={formData.pickupPoint} onChange={(e: any) => updateField('pickupPoint', e.target.value)} options={Object.values(PickupPoint).map(p => ({ label: p, value: p }))} />
                            {!hasReferral ? (
                                 <button onClick={() => setHasReferral(true)} className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center justify-center gap-2 text-sm font-bold">
                                    <Ticket size={16} /> Have a Code?
                                 </button>
                            ) : (
                                <MotionDiv initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} className="bg-stone-50 p-4 rounded-xl shadow-inner border border-stone-200 space-y-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1">
                                            Referral / Associate Code
                                        </label>
                                        <button onClick={() => { setHasReferral(false); updateField('referralCode', ''); }} className="text-xs text-stone-400 hover:text-red-500 font-bold">Remove</button>
                                    </div>
                                    <Input 
                                        icon={<UserPlus size={18} className="text-brand-500" />} 
                                        value={formData.referralCode} 
                                        onChange={e => updateField('referralCode', e.target.value.toUpperCase())} 
                                        placeholder="e.g. SML-AMA-01" 
                                        className="uppercase font-mono tracking-wider" 
                                        autoFocus 
                                    />
                                </MotionDiv>
                            )}
                        </div>
                    )}
                </MotionDiv>
            </AnimatePresence>

            <div className="mt-auto pt-8 flex gap-3">
                {currentStep > 0 && (
                    <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} className="w-1/3">Back</Button>
                )}
                <Button 
                    fullWidth 
                    size="lg" 
                    onClick={currentStep === STEP_PREFERENCES ? handleRegister : handleNext} 
                    loading={isLoading || isValidatingCode} 
                    className="shadow-xl"
                >
                    {currentStep === STEP_PREFERENCES ? 'Create Account' : 'Continue'}
                </Button>
            </div>
        </div>
    </AuthLayout>
  );
};
