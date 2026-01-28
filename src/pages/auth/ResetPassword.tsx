
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, useToast } from '../../components/ui';
import { Lock, Loader2, XCircle, CheckCircle } from 'lucide-react';
import { API } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

export const ResetPassword: React.FC<{ onNavigate: (view: string) => void, token?: string }> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
      let mounted = true;

      // 1. Immediate URL Error Check
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      const errorDesc = hashParams.get('error_description') || queryParams.get('error_description');
      
      if (errorDesc) {
          setErrorMsg(errorDesc.replace(/\+/g, ' '));
          return;
      }

      // 2. Setup Session Listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (mounted && (event === 'PASSWORD_RECOVERY' || session)) {
              setIsSessionReady(true);
          }
      });

      // 3. Initial Session Check
      supabase.auth.getSession().then(({ data: { session } }) => {
          if (mounted && session) setIsSessionReady(true);
      });

      // 4. Safety Timeout
      const timer = setTimeout(() => {
          if (mounted && !isSessionReady) {
              supabase.auth.getSession().then(({ data: { session } }) => {
                  if (!session && mounted) {
                      setErrorMsg("This password reset link is invalid or has expired. Please request a new one.");
                  }
              });
          }
      }, 4000);

      return () => {
          mounted = false;
          clearTimeout(timer);
          subscription.unsubscribe();
      };
  }, [isSessionReady]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPass = (e.target as any).password.value;
    const confirmPass = (e.target as any).confirmPassword.value;
    
    if (newPass !== confirmPass) return showToast("Passwords do not match", 'error');

    setIsLoading(true);
    
    // SAFETY: Hard timeout to kill spinner if network hangs for 20s
    const safetyTimer = setTimeout(() => {
        if (!success) {
            setIsLoading(false);
            showToast("Request timed out. Please check connection and try again.", 'error');
        }
    }, 20000);

    try {
      // 0. Verify session exists before attempting update
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please request a new reset link.");

      // 1. Update Password
      await API.resetPassword('', newPass);

      // Success sequence
      setSuccess(true);
      
      // 2. Force logout to ensure clean state for new login
      setTimeout(async () => {
          await logout();
          onNavigate('LOGIN');
      }, 3000);

    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Reset failed. Try requesting a new link.", 'error');
      setIsLoading(false);
    } finally {
        clearTimeout(safetyTimer);
    }
  };

  if (success) {
      return (
         <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-stone-50">
            <Card className="max-w-md w-full relative z-10 shadow-2xl border-none text-center py-10">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                   <CheckCircle size={40} />
               </div>
               <h2 className="text-2xl font-serif font-bold text-emerald-900 mb-2">Password Updated</h2>
               <p className="text-stone-500 mb-6">Your password has been changed successfully.<br/>Redirecting to login...</p>
               <Loader2 className="animate-spin mx-auto text-brand-500" />
            </Card>
         </div>
      );
  }

  return (
     <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-stone-50">
        <Card className="max-w-md w-full relative z-10 shadow-2xl border-none">
           <div className="text-center mb-8">
              <h2 className="text-2xl font-serif font-bold text-brand-900 mb-2">New Password</h2>
              <p className="text-stone-500 text-sm">Create a secure password for your account.</p>
           </div>
           
           {errorMsg ? (
               <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4">
                   <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                       <XCircle size={32} />
                   </div>
                   <p className="text-red-600 font-bold mb-2">Link Expired</p>
                   <p className="text-stone-500 text-xs mb-6 px-4">{errorMsg}</p>
                   <Button onClick={() => onNavigate('LOGIN')} variant="outline" fullWidth>Back to Login</Button>
               </div>
           ) : !isSessionReady ? (
               <div className="text-center py-12">
                   <Loader2 className="animate-spin mx-auto text-brand-500 mb-4" size={32} />
                   <p className="text-stone-500 text-sm font-medium">Verifying secure link...</p>
               </div>
           ) : (
               <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in">
                  <Input name="password" label="New Password" icon={<Lock size={18} />} required type="password" placeholder="Min 6 characters" />
                  <Input name="confirmPassword" label="Confirm Password" icon={<Lock size={18} />} required type="password" placeholder="Re-enter password" />
                  <Button fullWidth size="lg" loading={isLoading} disabled={isLoading}>Set New Password</Button>
               </form>
           )}
        </Card>
     </div>
  );
};
