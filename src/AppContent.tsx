
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from './components/ui/utils';
import { useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { SystemSettings } from './types';
import { useToast, Modal } from './components/ui';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { LandingView } from './pages/Landing';
import { ProductsPage } from './pages/Products';
import { HelpPage } from './pages/Help';
import { AboutPage } from './pages/About';
import { PricingCyclePage } from './pages/PricingCycle';
import { PartnerPage } from './pages/Partner';
import { API } from './lib/api';
import { ASSETS } from './assets';
import { ServerStatus } from './components/ui/ServerStatus';
import { CartDrawer } from './components/shopping/CartDrawer';
import { BottomNavBar } from './components/layout/BottomNavBar';
import { AnimatePresence, motion } from 'framer-motion';
import { Logger } from './lib/logger';
import { Loader2 } from 'lucide-react';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { HistoryTab } from './components/dashboard/user/HistoryTab';
import { SettingsTab } from './components/dashboard/user/SettingsTab';

const MotionDiv = motion.div as any;

// ScrollToTop Component to reset scroll on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode, adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
    const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
    
    if (isLoading) return null; // Let the main loader handle this
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        // If not admin, redirect to user dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export const AppContent: React.FC = () => {
  const { user, isLoading, logout, isAdmin, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ title: string, content: string } | null>(null);

  // System Initialization
  useEffect(() => { 
      const initSystem = async () => {
          try {
             const fetchedSettings = await API.getSettings();
             setSettings(fetchedSettings);
          } catch (e) {
             Logger.error("Critical: Failed to fetch system settings", e);
             showToast("System is offline. Some features may be unavailable.", "error");
             useDefaultSettings();
          }
      };
      initSystem();
  }, []);

  // Redirect if logged in and visiting auth pages
  useEffect(() => {
      if (isAuthenticated && !isLoading && (location.pathname === '/login' || location.pathname === '/register')) {
          // Strict Role Based Redirect
          if (isAdmin) {
              navigate('/admin');
          } else {
              navigate('/dashboard');
          }
      }
  }, [isAuthenticated, isLoading, isAdmin, location.pathname, navigate]);

  const useDefaultSettings = () => {
      setSettings({
        cycleName: 'System Offline',
        paymentStartDate: null,
        paymentEndDate: null,
        lockDate: null,
        unlockDate: null,
        bulkStartDate: null,
        bulkEndDate: null,
        deliveryDate: null,
        basketOpenDate: null,
        basketLockDate: null,
        isActive: false,
        basketServiceFeePercentage: 5,
        topUpServiceFeePercentage: 5,
        heroImages: [ASSETS.LANDING_HERO_BG]
    });
  };

  // --- SPLASH SCREEN ---
  if (isLoading) {
      return (
          <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center">
              <div className="animate-pulse flex flex-col items-center gap-4">
                  <img src={ASSETS.LOGO} className="w-12 h-12" alt="Loading..." />
                  <Loader2 className="animate-spin text-brand-500" size={24} />
                  <p className="text-xs font-bold text-stone-400 tracking-widest uppercase">Secure Connection...</p>
              </div>
          </div>
      );
  }

  // Determine if we should show the default Header/Footer
  const hideChromeRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/dashboard', '/admin'];
  const showChrome = !hideChromeRoutes.some(path => location.pathname.startsWith(path));
  
  // Specifically for Dashboard Layout wrapping
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  // Calculate current view for BottomNavBar
  let bottomNavView = 'DASHBOARD';
  if (location.pathname === '/shop') bottomNavView = 'SHOP';
  else if (location.pathname === '/dashboard/history') bottomNavView = 'HISTORY';
  else if (location.pathname === '/dashboard/settings') bottomNavView = 'SETTINGS';

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-stone-900 selection:bg-brand-200">
      <ScrollToTop />
      <ServerStatus />
      <CartDrawer onNavigateToDashboard={() => navigate('/dashboard')} />
      
      {showChrome && (
         <Header currentView={location.pathname} setView={(path) => navigate(path === 'LANDING' ? '/' : path.toLowerCase())} />
      )}

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

      <main className={showChrome ? "min-h-[calc(100vh-80px)]" : ""}>
        <AnimatePresence mode='wait'>
            <Routes location={location} key={location.pathname}>
                {/* Public Routes */}
                <Route path="/" element={
                    <MotionDiv initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                        <LandingView 
                            onProceed={() => navigate('/register')} 
                            onHelp={() => navigate('/about')} 
                            onSubscribeIntent={() => {
                                localStorage.setItem('sml_intent', 'SUBSCRIBE');
                                navigate('/register');
                            }}
                            heroImages={settings?.heroImages}
                        />
                    </MotionDiv>
                } />
                
                <Route path="/shop" element={
                    <MotionDiv initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                        <div className="pt-24 min-h-screen bg-[#F5F5F7]">
                            <ProductsPage onAction={(msg) => showToast(msg, 'success')} />
                            {!user && (
                                <div className="fixed bottom-0 left-0 right-0 p-4 bg-stone-900 text-white text-center z-50">
                                     Sign in to add items to your basket. <button onClick={() => navigate('/login')} className="underline font-bold">Login</button>
                                </div>
                            )}
                        </div>
                    </MotionDiv>
                } />

                <Route path="/help" element={<MotionDiv initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><div className="pt-24"><HelpPage onBack={() => navigate('/')} /></div></MotionDiv>} />
                <Route path="/about" element={<MotionDiv initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><div className="pt-20"><AboutPage onBack={() => navigate('/')} onRegister={() => navigate('/register')} /></div></MotionDiv>} />
                <Route path="/pricing" element={<MotionDiv initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><PricingCyclePage onBack={() => navigate('/')} /></MotionDiv>} />
                <Route path="/partner" element={<MotionDiv initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><PartnerPage onBack={() => navigate('/')} /></MotionDiv>} />

                {/* Auth Routes */}
                <Route path="/login" element={<Login onNavigate={(path) => navigate(path === 'LANDING' ? '/' : `/${path.toLowerCase()}`)} />} />
                <Route path="/register" element={<Register onNavigate={(path) => navigate(path === 'LANDING' ? '/' : `/${path.toLowerCase()}`)} />} />
                <Route path="/forgot-password" element={<ForgotPassword onNavigate={(path) => navigate(path === 'LANDING' ? '/' : `/${path.toLowerCase()}`)} />} />
                <Route path="/reset-password" element={<ResetPassword token={new URLSearchParams(location.search).get('token') || ''} onNavigate={(path) => navigate(`/${path.toLowerCase()}`)} />} />
                <Route path="/verify-email" element={<VerifyEmail token={new URLSearchParams(location.search).get('token') || ''} onNavigate={(path) => navigate(`/${path.toLowerCase()}`)} onSuccess={(msg) => showToast(msg, 'success')} />} />

                {/* Admin Dashboard */}
                <Route path="/admin" element={
                    <ProtectedRoute adminOnly>
                        <AdminDashboard onAction={(msg, type) => showToast(msg, type)} />
                    </ProtectedRoute>
                } />

                {/* User Dashboard Routes (Wrapped in Layout) */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardLayout 
                            user={user!} 
                            currentView="DASHBOARD" 
                            onNavigate={(path) => {
                                if (path === 'SHOP') navigate('/shop');
                                else if (path === 'HELP') navigate('/help');
                                else if (path === 'DASHBOARD') navigate('/dashboard');
                                else navigate(`/dashboard/${path.toLowerCase()}`);
                            }}
                            onLogout={() => { logout(); navigate('/'); }}
                        >
                            <UserDashboard 
                                user={user!} 
                                onAction={(msg, type) => showToast(msg, type)} 
                                onGoToShop={() => navigate('/shop')} 
                            />
                        </DashboardLayout>
                    </ProtectedRoute>
                } />
                
                <Route path="/dashboard/history" element={
                    <ProtectedRoute>
                        <DashboardLayout user={user!} currentView="HISTORY" onNavigate={(path) => {
                            if (path === 'SHOP') navigate('/shop');
                            else if (path === 'HELP') navigate('/help');
                            else if (path === 'DASHBOARD') navigate('/dashboard');
                            else navigate(`/dashboard/${path.toLowerCase()}`);
                        }} onLogout={() => { logout(); navigate('/'); }}>
                            <HistoryTab />
                        </DashboardLayout>
                    </ProtectedRoute>
                } />

                <Route path="/dashboard/settings" element={
                    <ProtectedRoute>
                        <DashboardLayout user={user!} currentView="SETTINGS" onNavigate={(path) => {
                            if (path === 'SHOP') navigate('/shop');
                            else if (path === 'HELP') navigate('/help');
                            else if (path === 'DASHBOARD') navigate('/dashboard');
                            else navigate(`/dashboard/${path.toLowerCase()}`);
                        }} onLogout={() => { logout(); navigate('/'); }}>
                            <SettingsTab user={user!} />
                        </DashboardLayout>
                    </ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
      </main>

      {showChrome && (
         <Footer 
            onNavigate={(path) => navigate(`/${path.toLowerCase()}`)} 
            onLegal={(docTitle) => {
                let content = "";
                if(docTitle === 'Privacy Policy') content = settings?.legalContent?.privacyPolicy || "";
                if(docTitle === 'Terms of Service') content = settings?.legalContent?.termsOfService || "";
                if(docTitle === 'Refund Policy') content = settings?.legalContent?.refundPolicy || "";
                setViewingDoc({ title: docTitle, content });
            }}
         />
      )}
      
      {/* Mobile Nav for Shop/Dashboard contexts */}
      {(showChrome && location.pathname === '/shop' || isDashboardRoute) && (
          <BottomNavBar currentView={bottomNavView} onNavigate={(id) => {
              if (id === 'SHOP') navigate('/shop');
              else if (id === 'DASHBOARD') navigate('/dashboard');
              else if (id === 'HISTORY') navigate('/dashboard/history');
              else if (id === 'SETTINGS') navigate('/dashboard/settings');
          }} />
      )}
    </div>
  );
};
