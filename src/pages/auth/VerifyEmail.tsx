
import React, { useState, useEffect } from 'react';
import { Button, Card } from '../../components/ui';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ASSETS } from '../../assets';
import { supabase } from '../../lib/supabaseClient';

interface VerifyEmailProps {
    onNavigate: (view: string) => void;
    onSuccess: (msg: string) => void;
    token: string;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({ onNavigate, onSuccess }) => {
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'PENDING' | 'SUCCESS' | 'ERROR'>('PENDING');

  useEffect(() => {
      // In Supabase, the "Magic Link" or "Confirmation Link" usually contains an access_token in the URL hash
      // e.g. #access_token=...&refresh_token=...&type=signup
      // The Supabase client automatically detects this and sets the session.
      
      const checkSession = async () => {
          // Wait briefly for Supabase client to process the hash
          await new Promise(r => setTimeout(r, 1000));
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
              setStatus('SUCCESS');
              await refreshUser();
              setTimeout(() => {
                  onSuccess("Identity verified! Welcome.");
                  onNavigate('DASHBOARD');
              }, 2000);
          } else {
              // If no session found automatically, it might be an expired link or just a view render
              // We can't manually "verify" a token easily client-side without the hash flow.
              setStatus('ERROR');
          }
      };

      checkSession();
  }, [refreshUser, onNavigate, onSuccess]);

  return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4 relative overflow-hidden">
          {/* Background Decor */}
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url(${ASSETS.AUTH_BG_PATTERN})` }}></div>
          
          <Card className="max-w-md w-full text-center p-10 relative z-10 shadow-2xl border-white/50 backdrop-blur-sm">
              {status === 'PENDING' && (
                  <div className="py-8 space-y-6">
                    <div className="relative mx-auto w-20 h-20">
                        <div className="absolute inset-0 border-4 border-stone-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                        <Mail size={24} className="absolute inset-0 m-auto text-brand-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-stone-900">Verifying...</h2>
                        <p className="text-stone-500 mt-2">Finalizing your account setup.</p>
                    </div>
                  </div>
              )}
              
              {status === 'SUCCESS' && (
                  <div className="py-8 space-y-6 animate-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle size={48} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-emerald-900">Success!</h2>
                        <p className="text-stone-500 mt-2 font-medium">You are now logged in.</p>
                    </div>
                    <div className="pt-4">
                        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out_infinite] w-full origin-left"></div>
                        </div>
                        <p className="text-xs text-stone-400 mt-2 uppercase tracking-widest">Redirecting to Dashboard</p>
                    </div>
                  </div>
              )}

              {status === 'ERROR' && (
                  <div className="py-8 space-y-6 animate-in shake duration-300">
                    <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <XCircle size={48} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-red-900">Link Expired</h2>
                        <p className="text-stone-500 mt-2">This verification link is invalid or has already been used.</p>
                    </div>
                    <Button onClick={() => onNavigate('LOGIN')} fullWidth variant="outline" className="mt-4">
                        Return to Login
                    </Button>
                  </div>
              )}
          </Card>
      </div>
  );
};
