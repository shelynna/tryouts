
import React, { useState } from 'react';
import { Button, Input, useToast } from '../../components/ui';
import { Mail, Lock, ArrowRight, Loader2, RefreshCw, MailWarning, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { Logger } from '../../lib/logger';
import { motion, AnimatePresence } from 'framer-motion';
import { API } from '../../lib/api';

const MotionDiv = motion.div as any;

interface LoginProps {
  onNavigate: (view: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  
  const [method, setMethod] = useState<'PASSWORD' | 'MAGIC_LINK'>('PASSWORD');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const checkUserRoleAndRedirect = async () => {
      // Fetch latest profile to determine strict role
      try {
          const user = await API.getMe();
          if (user?.role === 'ADMIN') {
              onNavigate('ADMIN');
          } else {
              onNavigate('DASHBOARD');
          }
      } catch (e) {
          // Fallback if fetch fails
          onNavigate('DASHBOARD');
      }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNeedsConfirmation(false);

    try {
      if (method === 'PASSWORD') {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (!data.session) throw new Error("No session created. Please try again.");
          
          await refreshUser();
          showToast("Login successful!", 'success');
          
          // Strict Role Redirect
          await checkUserRoleAndRedirect();

      } else {
          // Magic Link Flow
          const { error } = await supabase.auth.signInWithOtp({
              email,
              options: {
                  shouldCreateUser: false // Only allow existing users
              }
          });
          
          if (error) throw error;
          setMagicLinkSent(true);
          showToast("Magic Link sent to your email!", 'success');
      }

    } catch (err: any) {
      Logger.error("Login Failed", err);
      if (err.message.includes("Invalid login")) {
          showToast("Incorrect email or password.", 'error');
      } else if (err.message.includes("Email not confirmed")) {
          setNeedsConfirmation(true);
      } else {
          showToast(err.message || "An unexpected error occurred.", 'error');
      }
    } finally {
        setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
      if (!email) return;
      setIsResending(true);
      const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email,
      });
      
      if (error) {
          showToast(error.message, 'error');
      } else {
          showToast("Confirmation email resent! Check your inbox.", 'success');
      }
      setIsResending(false);
  };

  // View: Magic Link Sent Confirmation
  if (magicLinkSent) {
      return (
        <AuthLayout title="Check your email" subtitle={`We sent a login link to ${email}`} onBack={() => setMagicLinkSent(false)}>
            <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-8 py-4">
                <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto text-brand-600">
                    <Mail size={40} />
                </div>
                <p className="text-stone-600">
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
        subtitle={needsConfirmation ? `We sent a link to ${email}` : "Sign in to manage your monthly basket."}
        onBack={() => onNavigate('LANDING')}
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
                    {/* Toggle */}
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

                    <form onSubmit={handleLoginSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <Input 
                                label="Email Address" type="email" icon={<Mail size={18} />} 
                                placeholder="student@university.edu.gh"
                                value={email} onChange={e => setEmail(e.target.value)} 
                                required autoFocus
                            />
                            
                            {method === 'PASSWORD' && (
                                <MotionDiv initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}}>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="block text-sm font-bold text-stone-700">Password</label>
                                            <button 
                                                type="button"
                                                onClick={() => onNavigate('FORGOT_PASSWORD')} 
                                                className="text-xs font-bold text-brand-600 hover:text-brand-800"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                        <Input 
                                            type="password" icon={<Lock size={18} />} 
                                            placeholder="••••••••"
                                            value={password} onChange={e => setPassword(e.target.value)} 
                                            required 
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
