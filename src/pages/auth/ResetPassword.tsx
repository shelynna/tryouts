
import React, { useState } from 'react';
import { Card, Button, Input, useToast } from '../../components/ui';
import { Lock } from 'lucide-react';
import { ASSETS } from '../../assets';
import { API } from '../../lib/api';

export const ResetPassword: React.FC<{ onNavigate: (view: string) => void, token: string }> = ({ onNavigate, token }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPass = (e.target as any).password.value;
    const confirmPass = (e.target as any).confirmPassword.value;
    
    if (newPass !== confirmPass) return showToast("Passwords do not match", 'error');

    setIsLoading(true);
    showToast("Updating password...", 'info');
    try {
      await API.resetPassword(token, newPass);
      showToast("Password reset successfully!", 'success');
      onNavigate('LOGIN');
    } catch (err: any) {
      showToast(err.message || "Reset failed", 'error');
    }
    setIsLoading(false);
  };

  return (
     <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" 
          style={{ backgroundImage: `url(${ASSETS.AUTH_BG_PATTERN})` }}>
        <Card className="max-w-md w-full relative z-10 shadow-2xl border-none">
           <div className="text-center mb-8">
              <h2 className="text-2xl font-serif font-bold text-brand-900 mb-2">New Password</h2>
              <p className="text-stone-500 text-sm">Create a secure password for your account.</p>
           </div>
           <form onSubmit={handleResetPassword} className="space-y-6">
              <Input name="password" label="New Password" icon={<Lock size={18} />} required type="password" />
              <Input name="confirmPassword" label="Confirm Password" icon={<Lock size={18} />} required type="password" />
              <Button fullWidth size="lg" loading={isLoading}>Set New Password</Button>
           </form>
        </Card>
     </div>
  );
};
