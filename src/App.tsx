
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BasketProvider } from './context/BasketContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { SystemSettings } from './types';
import { ToastContainer, useToast, Modal } from './components/ui';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { LandingView } from './pages/Landing';
import { ProductsPage } from './pages/Products';
import { HelpPage } from './pages/Help';
import { AboutPage } from './pages/About';
import { API } from './lib/api';
import { ASSETS } from './assets';
import { ServerStatus } from './components/ui/ServerStatus';
import { CartDrawer } from './components/shopping/CartDrawer';
import { AnimatePresence, motion } from 'framer-motion';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { VerifyEmail } from './pages/auth/VerifyEmail';

type ViewState = 'LANDING' | 'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'SHOP' | 'PROFILE' | 'ADMIN_DASHBOARD' | 'HELP' | 'ABOUT' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD' | 'VERIFY_EMAIL';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, isAdmin } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [currentView, setCurrentView] = useState<ViewState>('LANDING');
  const [resetToken, setResetToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ title: string, content: string } | null>(null);

  // System Initialization
  useEffect(() => { 
      const initSystem = async () => {
          try {
             const isOnline = await API.checkHealth();
             if (isOnline) {
                const fetchedSettings = await API.getSettings();
                setSettings(fetchedSettings);
             } else {
                 useDefaultSettings();
             }
          } catch (e) {
             useDefaultSettings();
          }
      };
      initSystem();
  }, []);

  const useDefaultSettings = () => {
      setSettings({
        cycleName: 'System Offline',
        basketOpenDate: new Date().toISOString(),
        basketLockDate: new Date().toISOString(),
        deliveryDate: new Date().toISOString(),
        isActive: false,
        basketServiceFeePercentage: 5,
        topUpServiceFeePercentage: 5,
        heroImages: [ASSETS.LANDING_HERO_BG]
    });
  };

  // --- ROLE BASED ROUTING LOGIC ---
  useEffect(() => {
    // If loading, do nothing
    if (authLoading) return;

    if (isAuthenticated) {
        // If user is logged in
        if (isAdmin) {
             // If Admin, force Admin Dashboard unless they are deliberately on Profile/Settings
             if (currentView === 'LANDING' || currentView === 'LOGIN' || currentView === 'REGISTER' || currentView === 'DASHBOARD') {
                 setCurrentView('ADMIN_DASHBOARD');
             }
        } else {
             // If Customer, force User Dashboard if they try to access Admin or Auth pages
             if (currentView === 'LANDING' || currentView === 'LOGIN' || currentView === 'REGISTER' || currentView === 'ADMIN_DASHBOARD') {
                 setCurrentView('DASHBOARD');
             }
        }
    }
  }, [isAuthenticated, authLoading, isAdmin, user]);

  // Handle Deep Links (Email Verification / Password Reset)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const tokenParam = params.get('token');
    
    if (viewParam === 'RESET_PASSWORD' && tokenParam) {
        setResetToken(tokenParam);
        setCurrentView('RESET_PASSWORD');
    } else if (viewParam === 'VERIFY_EMAIL' && tokenParam) {
        setVerifyToken(tokenParam);
        setCurrentView('VERIFY_EMAIL');
    } else if (viewParam === 'REGISTER') {
        setCurrentView('REGISTER');
    }
  }, []);

  const handleDashboardNavigation = () => {
      if (isAdmin) {
          setCurrentView('ADMIN_DASHBOARD');
      } else {
          setCurrentView('DASHBOARD');
      }
  };

  if (authLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-900 rounded-full animate-spin"></div>
                  <p className="text-stone-500 font-medium animate-pulse">Authenticating...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-stone-900 selection:bg-brand-200">
      <ServerStatus />
      <CartDrawer onNavigateToDashboard={handleDashboardNavigation} />

      {/* Hide Header on Auth Pages */}
      {!['LOGIN', 'REGISTER', 'RESET_PASSWORD', 'FORGOT_PASSWORD', 'VERIFY_EMAIL'].includes(currentView) && (
         <Header currentView={currentView} setView={setCurrentView} />
      )}

      {/* Modal for Legal Docs */}
      <Modal
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        title={viewingDoc?.title}
        size="lg"
      >
        <div className="whitespace-pre-wrap text-sm text-stone-600 leading-relaxed font-medium">
            {viewingDoc?.content || "No content available."}
        </div>
      </Modal>

      <main className={!['LOGIN', 'REGISTER'].includes(currentView) ? "min-h-[calc(100vh-80px)] pt-20" : ""}>
        <AnimatePresence mode='wait'>
            <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                {/* --- PUBLIC VIEWS --- */}
                {currentView === 'LANDING' && (
                <LandingView 
                    onProceed={() => setCurrentView('REGISTER')} 
                    onHelp={() => setCurrentView('ABOUT')} 
                    onSubscribeIntent={() => {
                        localStorage.setItem('sml_intent', 'SUBSCRIBE');
                        setCurrentView('REGISTER');
                    }}
                    heroImages={settings?.heroImages}
                />
                )}

                {currentView === 'SHOP' && (
                    <ProductsPage onAction={(msg) => showToast(msg, 'success')} />
                )}

                {currentView === 'HELP' && (
                    <div className="max-w-4xl mx-auto px-6 py-12">
                        <HelpPage onBack={() => setCurrentView('LANDING')} />
                    </div>
                )}

                {currentView === 'ABOUT' && (
                    <AboutPage 
                        onBack={() => setCurrentView('LANDING')} 
                        onRegister={() => setCurrentView('REGISTER')}
                    />
                )}

                {/* --- AUTH VIEWS --- */}
                {currentView === 'LOGIN' && (
                    <Login 
                        onNavigate={(v) => setCurrentView(v as ViewState)} 
                        onLoginSuccess={handleDashboardNavigation} 
                    />
                )}

                {currentView === 'REGISTER' && (
                    <Register onNavigate={(v) => setCurrentView(v as ViewState)} />
                )}

                {currentView === 'FORGOT_PASSWORD' && (
                    <ForgotPassword onNavigate={(v) => setCurrentView(v as ViewState)} />
                )}

                {currentView === 'RESET_PASSWORD' && (
                    <ResetPassword 
                        token={resetToken}
                        onNavigate={(v) => setCurrentView(v as ViewState)} 
                    />
                )}

                 {currentView === 'VERIFY_EMAIL' && (
                    <VerifyEmail 
                        token={verifyToken} 
                        onNavigate={(v) => setCurrentView(v as ViewState)} 
                        onSuccess={(msg) => showToast(msg, 'success')} 
                    />
                )}

                {/* --- PROTECTED VIEWS --- */}
                {currentView === 'DASHBOARD' && user && !isAdmin && (
                    <UserDashboard 
                        user={user} 
                        onAction={(msg, type) => showToast(msg, type)} 
                        onGoToShop={() => setCurrentView('SHOP')} 
                    />
                )}

                {currentView === 'ADMIN_DASHBOARD' && isAdmin && (
                    <AdminDashboard onAction={(msg, type) => showToast(msg, type)} />
                )}
                
                {/* Fallback for access denied / loading states */}
                {(currentView === 'DASHBOARD' || currentView === 'ADMIN_DASHBOARD') && !user && (
                    <div className="flex h-[80vh] items-center justify-center">
                        <p className="text-stone-400">Please log in to access this page.</p>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
      </main>

      {/* Hide Footer on Auth/Dashboard Pages to reduce noise */}
      {!['LOGIN', 'REGISTER', 'DASHBOARD', 'ADMIN_DASHBOARD', 'RESET_PASSWORD', 'VERIFY_EMAIL'].includes(currentView) && (
         <Footer 
            onNavigate={(v) => setCurrentView(v as ViewState)} 
            onLegal={(docTitle) => {
                let content = "";
                if(docTitle === 'Privacy Policy') content = settings?.legalContent?.privacyPolicy || "";
                if(docTitle === 'Terms of Service') content = settings?.legalContent?.termsOfService || "";
                if(docTitle === 'Refund Policy') content = settings?.legalContent?.refundPolicy || "";
                setViewingDoc({ title: docTitle, content });
            }}
         />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BasketProvider>
         <AppContent />
      </BasketProvider>
    </AuthProvider>
  );
};

export default App;
