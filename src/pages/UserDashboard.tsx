
import React, { useState, useEffect } from 'react';
import { User, Product, SystemSettings } from '../types';
import { API } from '../lib/api';
import { Badge, Tabs, Button, Card } from '../components/ui';
import { MapPin, Wallet, History, Settings as SettingsIcon, Crown, AlertTriangle, Mail } from 'lucide-react';
import { useBasket } from '../context/BasketContext';
import { useAuth } from '../context/AuthContext';
import { OverviewTab } from '../components/dashboard/user/OverviewTab';
import { HistoryTab } from '../components/dashboard/user/HistoryTab';
import { SettingsTab } from '../components/dashboard/user/SettingsTab';
import { OnboardingModal } from '../components/dashboard/OnboardingModal';

export const UserDashboard: React.FC<{ user: User, onAction: (msg: string, type?: any) => void, onGoToShop: () => void }> = ({ user, onAction, onGoToShop }) => {
  const { refreshUser } = useAuth();
  const { basket, refreshBasket } = useBasket();
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
     if (user.isEmailVerified) {
         API.getProducts().then(setProducts).catch(() => {});
         API.getSettings().then(setSettings).catch(() => {});
         refreshBasket();

         const isNewUser = localStorage.getItem('sml_show_welcome');
         if (isNewUser) {
            setShowOnboarding(true);
            localStorage.removeItem('sml_show_welcome');
         }
     }
  }, [user, refreshBasket]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    onGoToShop();
  };

  // --- BLOCKED STATE: EMAIL NOT VERIFIED ---
  if (!user.isEmailVerified) {
      return (
          <div className="max-w-xl mx-auto px-4 py-20">
              <Card className="text-center p-10 border-t-4 border-t-orange-500">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                      <Mail size={40} />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">Verify Your Email</h1>
                  <p className="text-stone-500 mb-8 leading-relaxed">
                      We've sent a verification link to <strong>{user.email}</strong>.<br/>
                      Please check your inbox (and spam folder) to activate your account and start building your basket.
                  </p>
                  <div className="space-y-3">
                      <Button onClick={() => window.location.reload()} fullWidth>
                          I've Verified My Email
                      </Button>
                      <p className="text-xs text-stone-400">Refresh this page after verifying.</p>
                  </div>
              </Card>
          </div>
      );
  }

  if (!settings) return <div className="p-20 text-center animate-pulse text-stone-400">Loading Dashboard...</div>;

  const tabs = [
      { id: 'OVERVIEW', label: 'Overview', icon: <Wallet size={16} /> },
      { id: 'HISTORY', label: 'Transactions', icon: <History size={16} /> },
      { id: 'SETTINGS', label: 'Settings', icon: <SettingsIcon size={16} /> }
  ];

  return (
    <div className="pt-6 pb-12 max-w-7xl mx-auto px-4 md:px-6 space-y-8 animate-in fade-in duration-500">
      
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
        onComplete={handleOnboardingComplete}
        pickupPoint={user.pickupPoint}
      />

      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-stone-200">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-stone-900 text-white flex items-center justify-center text-xl md:text-2xl font-serif shrink-0">
                {user.fullName.charAt(0)}
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-serif text-stone-900 mb-1">
                Welcome, {user.fullName.split(' ')[0]}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500 font-medium">
                    <span className="flex items-center gap-1"><MapPin size={14}/> {user.pickupPoint}</span>
                    <span className="w-1 h-1 bg-stone-300 rounded-full hidden sm:block"></span>
                    <span>{user.phoneNumber}</span>
                    
                    {user.isSubscriber ? (
                        <span className="text-white bg-stone-900 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ml-2">
                            <Crown size={12} fill="currentColor" /> Subscriber
                        </span>
                    ) : (
                        <span className="text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ml-2">
                            Standard User
                        </span>
                    )}
                </div>
            </div>
         </div>
         <div className="flex flex-col items-end gap-2 w-full md:w-auto">
             <div className="flex justify-between md:block w-full md:w-auto items-center">
                 <Badge status={basket?.status || 'OPEN'} />
                 <p className="text-xs text-stone-400 font-bold uppercase tracking-widest md:text-right mt-0 md:mt-2">{settings.cycleName}</p>
             </div>
         </div>
      </div>

      <Tabs activeId={activeTab} onChange={setActiveTab} items={tabs} className="mb-8" />

      {activeTab === 'OVERVIEW' && (
        <OverviewTab 
            user={user} 
            settings={settings} 
            products={products} 
            onGoToShop={onGoToShop} 
            onAction={onAction}
            refreshUser={refreshUser}
        />
      )}

      {activeTab === 'HISTORY' && (
          <HistoryTab basket={basket} />
      )}

      {activeTab === 'SETTINGS' && (
          <SettingsTab user={user} />
      )}
    </div>
  );
};
