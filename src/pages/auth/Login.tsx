
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, useToast } from '../../components/ui';
import { Mail, Lock, ArrowRight, Loader2, RefreshCw, MailWarning, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { Logger } from '../../lib/logger';
import { motion, AnimatePresence } from 'framer-motion';
import { API } from '../../lib/api';
import { withTimeout } from '../../lib/utils';
import { User } from '../../types';

const MotionDiv = motion.div as any;

interface LoginProps {
  onNavigate: (view: string) => void;
  logoUrl?: string;
}

export const Login: React.FC<LoginProps> = ({ onNavigate, logoUrl }) => {
  const { showToast } = useToast();
  const { refreshUser } = useAuth(); 
  
  const [method, setMethod] = useState<'PASSWORD' | 'MAGIC_LINK'>('PASSWORD');
  const [isLoading, setIsLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  // REACT HOOK FORM SETUP
  const { register, handleSubmit, formState: { errors } } = useForm({
      mode: 'onChange', // Fix: Validate on change to prevent sticky errors
      defaultValues: {
          email: '',
          password: ''
      }
  });

  const checkUserRoleAndRedirect = async () => {
      setTimeout(async () => {
          try {
              const user = await API.getMe(); 
              if (user?.role === 'ADMIN') {
                  onNavigate('ADMIN');
              } else {
                  onNavigate('SHOP');
              }
          } catch {
              onNavigate('SHOP');
          }
      }, 500);
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setNeedsConfirmation(false);
    setSentEmail(data.email);

    try {
      if (method === 'PASSWORD') {
          const { data: authData, error } = await supabase.auth.signInWithPassword({ 
              email: data.email, 
              password: data.password 
          });

          if (error) throw error;
          if (!authData?.session) throw new Error("No session created.");
          
          showToast("Login successful!", 'success');
          await checkUserRoleAndRedirect();

      } else {
          const { error } = await supabase.auth.signInWithOtp({
              email: data.email,
              options: { emailRedirectTo: window.location.origin }
          });
          
          if (error) throw error;
          setMagicLinkSent(true);
          showToast("Magic Link sent to your email!", 'success');
      }

    } catch (err: any) {
      Logger.error("Login Failed", err);
      const msg = err.message || '';
      
      if (msg.includes("Email not confirmed")) {
          setNeedsConfirmation(true);
          showToast("Email not verified yet.", 'info');
      } else if (err.code === 'invalid_credentials' || msg.includes("Invalid login")) {
          showToast("Incorrect password or email.", 'error');
      } else {
          showToast(msg || "An unexpected error occurred.", 'error');
      }
    } finally {
        setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
      if (!sentEmail) return;
      setIsResending(true);
      const { error } = await supabase.auth.resend({
          type: 'signup',
          email: sentEmail,
          options: { emailRedirectTo: `${window.location.origin}/verify-email` }
      });
      
      if (error) {
          showToast(error.message, 'error');
      } else {
          showToast("Confirmation email resent!", 'success');
      }
      setIsResending(false);
  };

  if (magicLinkSent) {
      return (
        <AuthLayout title="Check your email" subtitle={`We sent a login link to ${sentEmail}`} onBack={() => setMagicLinkSent(false)} logoUrl={logoUrl}>
            <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-8 py-4">
                <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto text-brand-600">
                    <Mail size={40} />
                </div>
                <p className="text-stone-600 font-medium">
                    Click the link in the email to log in instantly. You can close this tab.
                </p>
                <div className="space-y-3">
                    <Button variant="outline" fullWidth onClick={() => window.open('https://gmail.com', '_blank')}>
                        Open Email App
                    </Button>
                    <Button variant="ghost" fullWidth onClick={() => setMagicLinkSent(false)}>
                        Try different email
                    </Button>
                </div>
            </MotionDiv>
        </AuthLayout>
      );
  }

  return (
    <AuthLayout 
        title={needsConfirmation ? "Check Your Email" : (method === 'PASSWORD' ? "Welcome Back" : "Magic Link Login")}
        subtitle={needsConfirmation ? `We sent a link to ${sentEmail}` : "Sign in to manage your monthly basket."}
        onBack={() => onNavigate('LANDING')}
        logoUrl={logoUrl}
    >
        <AnimatePresence mode="wait">
            {needsConfirmation ? (
                <MotionDiv
                    key="confirmation"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6 text-center"
                >
                    <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                        <MailWarning size={40} />
                    </div>
                    <p className="text-stone-600">
                        Your account isn't active yet. Please click the verification link in your email.
                    </p>
                    <div className="bg-stone-50 p-4 rounded-xl shadow-sm">
                        <Button 
                            type="button" 
                            variant="secondary" 
                            size="md" 
                            onClick={handleResendConfirmation} 
                            loading={isResending}
                            className="w-full"
                        >
                           <RefreshCw size={14} className="mr-2" /> Resend Confirmation
                        </Button>
                    </div>
                    <Button variant="ghost" onClick={() => setNeedsConfirmation(false)}>Back to Login</Button>
                </MotionDiv>
            ) : (
                <MotionDiv
                    key="login-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
                        <button 
                            onClick={() => setMethod('PASSWORD')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${method === 'PASSWORD' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}
                        >
                            Password
                        </button>
                        <button 
                            onClick={() => setMethod('MAGIC_LINK')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${method === 'MAGIC_LINK' ? 'bg-white shadow-sm text-brand-700' : 'text-stone-500'}`}
                        >
                            <Sparkles size={12} /> Magic Link
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <Input 
                                label="Email Address" 
                                type="email" 
                                icon={<Mail size={18} />} 
                                placeholder="student@university.edu.gh"
                                {...register("email", { required: "Email is required" })}
                                error={errors.email?.message as string}
                                autoFocus
                            />
                            
                            {method === 'PASSWORD' && (
                                <MotionDiv initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}}>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="block text-sm font-bold text-stone-700">Password</label>
                                            <button 
                                                type="button"
                                                onClick={() => onNavigate('FORGOT-PASSWORD')} 
                                                className="text-xs font-bold text-brand-600 hover:text-brand-800"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                        <Input 
                                            type="password" 
                                            icon={<Lock size={18} />} 
                                            placeholder="••••••••"
                                            {...register("password", { required: "Password is required" })}
                                            error={errors.password?.message as string}
                                        />
                                    </div>
                                </MotionDiv>
                            )}
                        </div>
                        
                        <Button fullWidth size="xl" loading={isLoading} disabled={isLoading} className="shadow-xl shadow-brand-900/20 group">
                            {isLoading ? (
                                <span className="flex items-center gap-2 animate-pulse">
                                    <Loader2 className="animate-spin" size={18} />
                                    {method === 'MAGIC_LINK' ? "Sending Link..." : "Signing in..."}
                                </span>
                            ) : (
                                <>
                                    {method === 'MAGIC_LINK' ? "Send Magic Link" : "Sign In"} 
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                    
                    <div className="text-center pt-4 mt-6 border-t border-stone-100">
                       <p className="text-stone-500 font-medium">
                          New to SML? <button onClick={() => onNavigate('REGISTER')} className="text-brand-700 font-bold hover:underline">Create an account</button>
                       </p>
                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>
    </AuthLayout>
  );
};
