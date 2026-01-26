
import React, { useState } from 'react';
import { Button, Input, useToast } from '../../components/ui';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AuthLayout } from '../../components/layout/AuthLayout';

interface LoginProps {
  onNavigate: (view: string) => void;
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate, onLoginSuccess }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      showToast("Welcome back!", 'success');
      onLoginSuccess();
    } catch (err: any) {
      if (err.message.includes("Invalid login")) {
          showToast("Incorrect email or password.", 'error');
      } else if (err.message.includes("Email not confirmed")) {
          showToast("Please check your email to confirm your account.", 'info');
      } else {
          showToast(err.message, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
        title="Welcome Back" 
        subtitle="Sign in to manage your monthly basket."
        onBack={() => onNavigate('LANDING')}
    >
        <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="space-y-4">
                <Input 
                    label="Email Address" 
                    type="email" 
                    icon={<Mail size={18} />} 
                    placeholder="student@university.edu.gh"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    autoFocus
                />
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
                        type="password" 
                        icon={<Lock size={18} />} 
                        placeholder="••••••••"
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                    />
                </div>
            </div>
            
            <Button fullWidth size="xl" loading={isLoading} className="shadow-xl shadow-brand-900/20 group">
                Sign In <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
        </form>
        
        <div className="text-center pt-4">
           <p className="text-stone-500 font-medium">
              New to SML? <button onClick={() => onNavigate('REGISTER')} className="text-brand-700 font-bold hover:underline">Create an account</button>
           </p>
        </div>
    </AuthLayout>
  );
};
