
import React, { useState } from 'react';
import { Button, Input, useToast } from '../../components/ui';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { API } from '../../lib/api';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

export const ForgotPassword: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await API.forgotPassword(email);
      setIsSent(true);
    } catch (err: any) {
      showToast(err.message || "Request failed", 'error');
    }
    setIsLoading(false);
  };

  if (isSent) {
      return (
        <AuthLayout title="Check your email" subtitle={`We've sent a link to ${email}`} onBack={() => onNavigate('LOGIN')}>
            <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6 py-8">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={40} />
                </div>
                <div className="space-y-2">
                    <p className="text-stone-600">Click the link in the email to reset your password. If you don't see it, check your spam folder.</p>
                </div>
                <div className="pt-4 space-y-3">
                    <Button variant="outline" fullWidth onClick={() => window.open('https://gmail.com', '_blank')}>Open Email App</Button>
                    <Button variant="ghost" fullWidth onClick={() => setIsSent(false)}>Try another email</Button>
                </div>
            </MotionDiv>
        </AuthLayout>
      );
  }

  return (
    <AuthLayout 
        title="Reset Password" 
        subtitle="Enter your email to receive a recovery link." 
        onBack={() => onNavigate('LOGIN')}
    >
       <form onSubmit={handleForgotPassword} className="space-y-6">
            <Input 
                label="Email Address" 
                name="email" 
                icon={<Mail size={18} />} 
                required 
                type="email" 
                placeholder="Enter your registered email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
            />
            <Button fullWidth size="xl" loading={isLoading} className="shadow-lg">
                Send Reset Link <ArrowRight size={20} className="ml-2"/>
            </Button>
       </form>
    </AuthLayout>
  );
};
