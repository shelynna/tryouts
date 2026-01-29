
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '../types';
import { API } from '../lib/api';
import { Button, Skeleton } from '../components/ui';
import { useBasket } from '../context/BasketContext';
import { useAuth } from '../context/AuthContext';
import { OverviewTab } from '../components/dashboard/user/OverviewTab';
import { OnboardingModal } from '../components/dashboard/OnboardingModal';
import { AlertCircle, ShoppingBag, Zap } from 'lucide-react';

export const UserDashboard: React.FC<{ user: User, onAction: (msg: string, type?: any) => void, onGoToShop: () => void }> = ({ user, onAction, onGoToShop }) => {
  const { refreshUser } = useAuth();
  const { basket, refreshBasket } = useBasket();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 1. React Query for Products (Cached for 5 mins)
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => API.getProducts(),
    enabled: !!user.isEmailVerified
  });

  // 2. React Query for Settings (Global Config)
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => API.getSettings(),
    enabled: !!user.isEmailVerified
  });

  // Effect for Onboarding logic
  useEffect(() => {
     if (user.isEmailVerified) {
        // Basket is automatically refreshed by BasketContext when user is verified
        const isNewUser = localStorage.getItem('sml_show_welcome');
        if (isNewUser) {
            setShowOnboarding(true);
            localStorage.removeItem('sml_show_welcome');
        }
     }
  }, [user.isEmailVerified]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    onGoToShop();
  };

  const getTimeGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
  };

  if (!user.isEmailVerified) {
      return (
          <div className="max-w-xl mx-auto px-4 py-20">
             <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border-t-8 border-brand-500 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <AlertCircle size={40} />
                  </div>
                  <h1 className="text-3xl font-heading font-extrabold text-stone-900 mb-4 tracking-tight">Verify Your Identity</h1>
                  <p className="text-stone-500 mb-10 leading-relaxed font-medium">We've sent a secure link to your email address. Please click it to activate your SML account.</p>
                  <div className="flex flex-col gap-3">
                      <Button fullWidth size="lg" onClick={() => window.location.reload()} className="rounded-2xl shadow-xl shadow-brand-900/10">
                          Refresh Status
                      </Button>
                      <Button variant="ghost" onClick={() => refreshUser()} className="text-stone-400 font-bold hover:text-stone-600 uppercase tracking-widest text-[10px]">
                          Check Verification Again
                      </Button>
                  </div>
             </div>
          </div>
      );
  }
  
  const isLoading = loadingProducts || loadingSettings;

  return (
    <div className="min-h-screen pb-32">
      
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
        onComplete={handleOnboardingComplete}
        pickupPoint={user.pickupPoint}
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 px-1">
        <div>
            <p className="text-stone-500 font-medium mb-1 flex items-center gap-2">
                {getTimeGreeting()},
            </p>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-stone-900 tracking-tight leading-none capitalize">
                {user.fullName.split(' ')[0]}
            </h1>
            
            <div className="mt-4 flex items-center gap-3">
                {isLoading ? <Skeleton className="h-8 w-40 rounded-full" /> : 
                 (settings?.cycleName === 'No Active Cycle' || !settings?.isActive ? 
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100 text-stone-500 text-xs font-bold uppercase tracking-wider border border-stone-200">
                    <div className="h-2 w-2 bg-stone-400 rounded-full"></div> Market Closed
                  </span> : 
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-100/50 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Active: {settings?.cycleName}
                  </span>)}
            </div>
        </div>

        <div className="flex items-center gap-3">
            {!user.isSubscriber && (
                <Button variant="ghost" size="sm" onClick={() => {}} className="hidden md:flex bg-white text-stone-600 hover:text-brand-700 hover:bg-brand-50 border border-stone-200 hover:border-brand-200 rounded-xl px-5 h-12 font-bold shadow-sm">
                    <Zap size={16} className="mr-2 text-amber-500 fill-amber-500" /> Upgrade
                </Button>
            )}
            <Button onClick={onGoToShop} className="shadow-xl shadow-brand-900/20 rounded-xl h-12 px-6 bg-stone-900 hover:bg-stone-800 text-white font-bold tracking-wide">
                <ShoppingBag size={18} className="mr-2" /> Marketplace
            </Button>
        </div>
      </div>
      
      {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-[280px] rounded-[2.5rem] w-full" />
                <Skeleton className="h-[200px] rounded-[2rem] w-full" />
             </div>
             <div className="space-y-8">
                <Skeleton className="h-[140px] rounded-[2rem] w-full" />
                <Skeleton className="h-[140px] rounded-[2rem] w-full" />
             </div>
          </div>
      ) : (
          <div>
            {basket?.id === 'virtual-closed' && (
                <div className="bg-stone-100 border border-stone-200 p-6 rounded-[2rem] flex items-start gap-4 mb-8 shadow-sm">
                    <AlertCircle className="text-stone-500 shrink-0 mt-1" />
                    <div>
                        <h4 className="font-heading font-extrabold text-stone-900 text-base">Marketplace Closed</h4>
                        <p className="text-sm text-stone-500 mt-1 font-medium leading-relaxed">
                            There is currently no active shopping cycle. You can still manage your existing orders in the History tab.
                        </p>
                    </div>
                </div>
            )}
            
            <OverviewTab 
                user={user} 
                settings={settings || { cycleName: 'SML', isActive: false, basketServiceFeePercentage: 5, topUpServiceFeePercentage: 5 }} 
                products={products} 
                onGoToShop={onGoToShop} 
                onAction={onAction}
                refreshUser={refreshUser}
            />
          </div>
      )}
    </div>
  );
};
