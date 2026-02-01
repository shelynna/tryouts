
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '../types';
import { API } from '../lib/api';
import { Button, Skeleton, Card } from '../components/ui';
import { useBasket } from '../context/BasketContext';
import { useAuth } from '../context/AuthContext';
import { OnboardingModal } from '../components/dashboard/OnboardingModal';
import { OverviewTab } from '../components/dashboard/user/OverviewTab';
import { AlertCircle, CheckCircle, MapPin, Hash, ShoppingBag, Copy, Users, Wallet, ChevronRight, Crown } from 'lucide-react';
import { generateSmlId } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';

export const UserDashboard: React.FC<{ user: User, onAction: (msg: string, type?: any) => void, onGoToShop: () => void }> = ({ user, onAction, onGoToShop }) => {
  const { refreshUser } = useAuth();
  const { basket } = useBasket();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  // 1. React Query for Products (Cached)
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

  // Fetch Referral Count
  useEffect(() => {
      const fetchRef = async () => {
          if (!user.referralCode) return;
          const { count } = await supabase
              .from('profiles')
              .select('id', { count: 'exact', head: true })
              .eq('referred_by', user.referralCode);
          setReferralCount(count || 0);
      };
      if (user.isEmailVerified) fetchRef();
  }, [user.referralCode, user.isEmailVerified]);

  // Effect for Onboarding logic
  useEffect(() => {
     if (user.isEmailVerified) {
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

  const copyReferral = () => {
      if (user.referralCode) {
          navigator.clipboard.writeText(user.referralCode);
          setCopied(true);
          onAction("Referral code copied!", "success");
          setTimeout(() => setCopied(false), 2000);
      }
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
  const smlId = generateSmlId(user.id);
  
  // Strict check: Only show banner if delivery code AND fully paid
  const isReadyForPickup = basket?.deliveryCode && 
                           (basket.status === 'PAID' || (basket.totalValue > 0 && basket.amountPaid >= basket.totalValue - 0.1));

  return (
    <div className="min-h-screen pb-32">
      
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
        onComplete={handleOnboardingComplete}
        pickupPoint={user.pickupPoint}
      />

      {/* 1. TOP HEADER SECTION */}
      <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
            <div>
                <p className="text-stone-500 font-medium mb-1 flex items-center gap-2">
                    {getTimeGreeting()},
                </p>
                <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-stone-900 tracking-tight leading-none capitalize">
                    {user.fullName.split(' ')[0]}
                </h1>
            </div>
            
            <div className="flex items-center gap-3">
                <Button onClick={onGoToShop} className="shadow-xl shadow-brand-900/20 rounded-xl h-12 px-6 bg-stone-900 hover:bg-stone-800 text-white font-bold tracking-wide">
                    <ShoppingBag size={18} className="mr-2" /> Marketplace
                </Button>
            </div>
          </div>
      </div>

      {/* 2. IDENTITY & NOTIFICATIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Identity Card with Referral Info */}
          <Card className="lg:col-span-2 bg-gradient-to-r from-stone-900 to-stone-800 text-white border-none p-6 md:p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6 h-full">
                  <div className="space-y-6 flex-1">
                      <div>
                          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-2">Member Identity</p>
                          <div className="flex items-center gap-3">
                              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                                  <Hash size={14} className="text-brand-400" />
                                  <span className="font-mono font-bold tracking-wider">{smlId}</span>
                              </div>
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${user.isSubscriber ? 'bg-brand-600 text-white' : 'bg-stone-700 text-stone-300'}`}>
                                  {user.isSubscriber ? <Crown size={12} className="text-yellow-400"/> : null}
                                  {user.isSubscriber ? 'Subscriber' : 'Standard'}
                              </span>
                          </div>
                      </div>

                      {/* Referral Section - New & Prominent */}
                      {user.referralCode && (
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 max-w-md backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer" onClick={copyReferral}>
                              <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/30">
                                  <Users size={20} className="text-white" />
                              </div>
                              <div className="flex-1 text-center sm:text-left">
                                  <p className="text-stone-300 text-[10px] font-bold uppercase tracking-widest mb-1">Referral Code</p>
                                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                                      <p className="text-xl font-bold font-mono tracking-widest text-white">{user.referralCode}</p>
                                      <button className="p-1.5 rounded-full transition-colors text-stone-400 hover:text-white">
                                          {copied ? <CheckCircle size={16} className="text-emerald-400"/> : <Copy size={16}/>}
                                      </button>
                                  </div>
                              </div>
                              <div className="text-center bg-black/20 p-2 px-4 rounded-xl min-w-[80px]">
                                  <p className="text-2xl font-bold text-white leading-none">{referralCount}</p>
                                  <p className="text-[9px] text-stone-400 uppercase font-bold tracking-wider mt-1">Invited</p>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Pickup Point Display */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[160px] text-center md:text-right self-stretch md:self-auto flex flex-col justify-center">
                      <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Pickup Point</p>
                      <p className="text-xl font-bold text-white flex items-center justify-center md:justify-end gap-2">
                          <MapPin size={18} className="text-brand-400" /> {user.pickupPoint}
                      </p>
                  </div>
              </div>
          </Card>

          {/* Action / Notification Area */}
          <div className="space-y-4">
              {isReadyForPickup ? (
                  <Card className="bg-emerald-50 border-emerald-100 p-6 flex flex-col justify-center h-full">
                      <div className="flex items-center gap-3 mb-2">
                          <CheckCircle className="text-emerald-600" size={24} />
                          <h3 className="text-emerald-900 font-bold text-lg">Ready for Pickup</h3>
                      </div>
                      <p className="text-emerald-800 text-sm mb-4">
                          Order complete. Collect at <strong>{user.pickupPoint}</strong>.
                      </p>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100 text-center">
                          <p className="text-xs text-stone-400 uppercase font-bold">Ticket Code</p>
                          <p className="text-2xl font-mono font-bold text-stone-900 tracking-widest">{basket.deliveryCode}</p>
                      </div>
                  </Card>
              ) : (
                  <Card className="bg-white border-stone-200 p-6 flex flex-col justify-between h-full group cursor-pointer hover:border-brand-200 hover:shadow-md transition-all" onClick={onGoToShop}>
                      <div>
                          <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                              <Wallet size={24} className="text-stone-400 group-hover:text-brand-600" />
                          </div>
                          <h3 className="font-bold text-stone-900 text-lg">Shop & Pay</h3>
                          <p className="text-stone-500 text-sm mt-1">Add items or make installments.</p>
                      </div>
                      <div className="flex items-center text-brand-600 font-bold text-sm mt-4">
                          Go to Market <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                  </Card>
              )}
          </div>
      </div>
      
      {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-[320px] rounded-[2.5rem] w-full" />
             </div>
             <div className="space-y-8">
                <Skeleton className="h-[200px] rounded-[2rem] w-full" />
             </div>
          </div>
      ) : (
          <div>
            <OverviewTab 
                user={user} 
                settings={settings || { cycleName: 'Sɔ ME MU (SMM)', isActive: true, basketServiceFeePercentage: 5, topUpServiceFeePercentage: 5 }} 
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
