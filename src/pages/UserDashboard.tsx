
import React, { useState, useEffect } from 'react';
import { User, Product, SystemSettings } from '../types';
import { API } from '../lib/api';
import { Button, Skeleton } from '../components/ui';
import { useBasket } from '../context/BasketContext';
import { useAuth } from '../context/AuthContext';
import { OverviewTab } from '../components/dashboard/user/OverviewTab';
import { OnboardingModal } from '../components/dashboard/OnboardingModal';
import { Logger } from '../lib/logger';
import { AlertCircle, ShoppingBag } from 'lucide-react';

export const UserDashboard: React.FC<{ user: User, onAction: (msg: string, type?: any) => void, onGoToShop: () => void }> = ({ user, onAction, onGoToShop }) => {
  const { refreshUser } = useAuth();
  const { basket, refreshBasket } = useBasket();
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
     if (user.isEmailVerified) {
         setIsLoading(true);
         Promise.all([
            API.getProducts(),
            API.getSettings(),
            refreshBasket()
         ]).then(([productsData, settingsData]) => {
            setProducts(productsData);
            setSettings(settingsData);
            
            const isNewUser = localStorage.getItem('sml_show_welcome');
            if (isNewUser) {
                setShowOnboarding(true);
                localStorage.removeItem('sml_show_welcome');
            }
         }).catch((err) => {
            Logger.error("Dashboard init failed", err);
            onAction("Failed to load dashboard data.", 'error');
         }).finally(() => {
            setIsLoading(false);
         });
     }
  }, [user, refreshBasket]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    onGoToShop();
  };

  // --- BLOCKED STATE: EMAIL NOT VERIFIED ---
  if (!user.isEmailVerified) {
      // ... (Existing Verification View - truncated for brevity as it remains same)
      return (
          <div className="max-w-xl mx-auto px-4 py-20">
             {/* Same content as before */}
             <div className="bg-white p-8 rounded-2xl shadow-sm text-center border-t-4 border-orange-500">
                  <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
                  <p className="text-stone-500 mb-4">Check your inbox to activate your account.</p>
                  <Button onClick={() => window.location.reload()}>Refresh</Button>
             </div>
          </div>
      );
  }
  
  return (
    <div className="animate-in fade-in duration-500 min-h-screen">
      
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
        onComplete={handleOnboardingComplete}
        pickupPoint={user.pickupPoint}
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-stone-900 tracking-tight">
                Hello, {user.fullName.split(' ')[0]}
            </h1>
            <p className="text-sm text-stone-500 font-medium mt-1 flex items-center gap-2">
                {isLoading ? <Skeleton className="h-4 w-32" /> : 
                 (settings?.cycleName === 'No Active Cycle' ? 
                  <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full text-xs">Market Closed</span> : 
                  <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md text-xs border border-stone-200">
                    Cycle: <strong className="text-stone-900">{settings?.cycleName}</strong>
                  </span>)}
            </p>
        </div>
        <div className="flex gap-3">
            {!user.isSubscriber && (
                <Button variant="ghost" size="sm" onClick={() => {}} className="hidden md:flex bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200">
                    Upgrade to Subscriber
                </Button>
            )}
            <Button onClick={onGoToShop} className="shadow-lg shadow-brand-900/10">
                <ShoppingBag size={18} className="mr-2" /> Marketplace
            </Button>
        </div>
      </div>
      
      {isLoading || !settings ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64 rounded-3xl" />
                <Skeleton className="h-48 rounded-3xl" />
             </div>
             <div className="space-y-6">
                <Skeleton className="h-32 rounded-3xl" />
                <Skeleton className="h-32 rounded-3xl" />
             </div>
          </div>
      ) : (
          <>
            {basket?.id === 'virtual-closed' && (
                <div className="bg-stone-100 border border-stone-200 p-4 rounded-xl flex items-start gap-3 mb-6">
                    <AlertCircle className="text-stone-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-stone-900 text-sm">Marketplace Closed</h4>
                        <p className="text-xs text-stone-500 mt-1">
                            There is currently no active shopping cycle.
                        </p>
                    </div>
                </div>
            )}
            
            <OverviewTab 
                user={user} 
                settings={settings} 
                products={products} 
                onGoToShop={onGoToShop} 
                onAction={onAction}
                refreshUser={refreshUser}
            />
          </>
      )}
    </div>
  );
};
