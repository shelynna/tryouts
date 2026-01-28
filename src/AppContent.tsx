
import React, { useState, useEffect, Suspense, lazy } from 'react';
// @ts-ignore
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { SystemSettings } from './types';
import { useToast, Modal, SplashLoader } from './components/ui';
import { API } from './lib/api';
import { ASSETS } from './assets';
import { ServerStatus } from './components/ui/ServerStatus';
import { CartDrawer } from './components/shopping/CartDrawer';
import { BottomNavBar } from './components/layout/BottomNavBar';
import { AnimatePresence, motion } from 'framer-motion';
import { Logger } from './lib/logger';
import { Loader2 } from 'lucide-react';
import { SEO } from './components/SEO';
import DOMPurify from 'dompurify';

const UserDashboard = lazy(() => import('./pages/UserDashboard').then(module => ({ default: module.UserDashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const LandingView = lazy(() => import('./pages/Landing').then(module => ({ default: module.LandingView })));
const ProductsPage = lazy(() => import('./pages/Products').then(module => ({ default: module.ProductsPage })));
const HelpPage = lazy(() => import('./pages/Help').then(module => ({ default: module.HelpPage })));
const AboutPage = lazy(() => import('./pages/About').then(module => ({ default: module.AboutPage })));
const PricingCyclePage = lazy(() => import('./pages/PricingCycle').then(module => ({ default: module.PricingCyclePage })));
const PartnerPage = lazy(() => import('./pages/Partner').then(module => ({ default: module.PartnerPage })));

const Login = lazy(() => import('./pages/auth/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('./pages/auth/Register').then(module => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword').then(module => ({ default: module.ResetPassword })));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail').then(module => ({ default: module.VerifyEmail })));

const HistoryTab = lazy(() => import('./components/dashboard/user/HistoryTab').then(module => ({ default: module.HistoryTab })));
const SettingsTab = lazy(() => import('./components/dashboard/user/SettingsTab').then(module => ({ default: module.SettingsTab })));

const MotionDiv = motion.div as any;

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode, adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
    const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
    
    if (isLoading) return null;
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
        <i className='bx bx-loader-alt bx-spin text-3xl text-brand-600'></i>
    </div>
);

export const AppContent: React.FC = () => {
  const { user, isLoading: isAuthLoading, logout, isAdmin, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isSystemLoading, setIsSystemLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<{ title: string, content: string } | null>(null);

  // Initialize System Settings
  useEffect(() => { 
      let isMounted = true;
      
      const initSystem = async () => {
          const safetyTimeout = setTimeout(() => {
              if (isMounted) setIsSystemLoading(false);
          }, 5000);

          try {
             const fetchedSettings = await API.getSettings();
             if (isMounted) {
                 setSettings(fetchedSettings);
                 setIsSystemLoading(false);
                 clearTimeout(safetyTimeout);
             }
          } catch (e) {
             Logger.error("Critical: Failed to fetch SML settings", e);
             if (isMounted) {
                 useDefaultSettings();
                 setIsSystemLoading(false);
                 clearTimeout(safetyTimeout);
             }
          }
      };
      initSystem();
      return () => { isMounted = false; };
  }, []);

  const useDefaultSettings = () => {
      setSettings({
        cycleName: 'SML Marketplace',
        paymentStartDate: null,
        paymentEndDate: null,
        lockDate: null,
        unlockDate: null,
        bulkStartDate: null,
        bulkEndDate: null,
        deliveryDate: null,
        basketOpenDate: null,
        basketLockDate: null,
        isActive: true,
        basketServiceFeePercentage: 5,
        topUpServiceFeePercentage: 5,
        heroImages: [ASSETS.LANDING_HERO_BG]
    });
  };

  // Logic: Show splash only if authentication state is determining OR system settings loading,
  // BUT skip splash immediately if we are on the public Landing page and not authenticated yet (improves perceived load time).
  const isLandingPage = location.pathname === '/';
  
  useEffect(() => {
      if (isLandingPage && !isAuthLoading && !isAuthenticated) {
          // If on landing page and not logged in, hide splash immediately
          setShowSplash(false);
      } else if (!isAuthLoading && !isSystemLoading) {
          // Otherwise wait for everything to load
          setShowSplash(false);
      }
  }, [isLandingPage, isAuthLoading, isAuthenticated, isSystemLoading]);

  const isDataLoading = isAuthLoading || (isSystemLoading && !settings);

  // Determine if we should show the standard public header/footer
  const showPublicChrome = !isAuthenticated;

  const handleNavigate = (path: string) => {
      if (path === 'LANDING') navigate('/');
      else navigate(`/${path.toLowerCase()}`);
  };

  const logoUrl = settings?.branding?.logo || ASSETS.LOGO;
  const logoWhiteUrl = settings?.branding?.logoWhite || ASSETS.LOGO_WHITE;

  const handleDashboardNavigate = (path: string) => {
      if (path === 'SHOP') navigate('/shop');
      else if (path === 'HELP') navigate('/help');
      else if (path === 'DASHBOARD') navigate('/dashboard');
      else if (path.startsWith('/dashboard/')) navigate(path); 
      else navigate(`/dashboard/${path.toLowerCase()}`);
  };

  // Only render app content when splash is dismissed
  // NOTE: If we are on landing page, we bypass this check early via useEffect logic above
  if (showSplash && (!isLandingPage || isAuthenticated)) {
      return (
          <SplashLoader 
            isLoading={isDataLoading} 
            onComplete={() => setShowSplash(false)} 
            logoUrl={logoUrl}
          />
      );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-stone-900 selection:bg-brand-200 animate-in fade-in zoom-in duration-500">
      <ScrollToTop />
      <ServerStatus />
      <CartDrawer onNavigateToDashboard={() => navigate('/dashboard')} />
      
      {showPublicChrome && (
         <Header currentView={location.pathname} setView={handleNavigate} logoUrl={logoUrl} />
      )}

      <Modal
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        title={viewingDoc?.title}
        size="lg"
      >
        <div 
            className="whitespace-pre-wrap text-sm text-stone-600 leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(viewingDoc?.content || "No content available.") }}
        />
      </Modal>

      <main className={showPublicChrome ? "min-h-[calc(100vh-80px)]" : ""}>
        <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode='wait'>
                <Routes location={location} key={location.pathname}>
                    
                    {/* Root: Logic to split Guest / User / Admin */}
                    <Route path="/" element={
                        isAuthenticated ? (
                            isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/shop" replace />
                        ) : (
                            <MotionDiv initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                                <SEO title="Home" description="SML helps students in Ghana buy food essentials in bulk and pay small-small." />
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
                        )
                    } />
                    
                    {/* --- PROTECTED USER ROUTES (Wrapped in Dashboard Layout) --- */}
                    <Route path="/shop" element={
                        <ProtectedRoute>
                            <SEO title="Marketplace" />
                            <DashboardLayout 
                                user={user!} 
                                currentView="SHOP" 
                                logoUrl={logoWhiteUrl}
                                onNavigate={handleDashboardNavigate}
                                onLogout={() => { logout(); navigate('/'); }}
                            >
                                <ProductsPage onAction={(msg) => showToast(msg, 'success')} />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <SEO title="My Dashboard" />
                            <DashboardLayout 
                                user={user!} 
                                currentView="DASHBOARD" 
                                logoUrl={logoWhiteUrl}
                                onNavigate={handleDashboardNavigate}
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
                            <SEO title="Order History" />
                            <DashboardLayout 
                                user={user!} 
                                logoUrl={logoWhiteUrl} 
                                currentView="HISTORY" 
                                onNavigate={handleDashboardNavigate} 
                                onLogout={() => { logout(); navigate('/'); }}
                            >
                                <HistoryTab />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard/settings" element={
                        <ProtectedRoute>
                            <SEO title="Profile Settings" />
                            <DashboardLayout 
                                user={user!} 
                                logoUrl={logoWhiteUrl} 
                                currentView="SETTINGS" 
                                onNavigate={handleDashboardNavigate} 
                                onLogout={() => { logout(); navigate('/'); }}
                            >
                                <SettingsTab user={user!} />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />

                    {/* --- ADMIN ROUTE --- */}
                    <Route path="/admin" element={
                        <ProtectedRoute adminOnly>
                            <SEO title="Admin Console" />
                            <AdminDashboard onAction={(msg, type) => showToast(msg, type)} />
                        </ProtectedRoute>
                    } />

                    {/* --- PUBLIC PAGES --- */}
                    <Route path="/help" element={<MotionDiv initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><div className="pt-24"><SEO title="Support" /><HelpPage onBack={() => navigate('/')} /></div></MotionDiv>} />
                    <Route path="/about" element={<MotionDiv initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><div className="pt-20"><SEO title="How it Works" /><AboutPage onBack={() => navigate('/')} onRegister={() => navigate('/register')} /></div></MotionDiv>} />
                    <Route path="/pricing" element={<MotionDiv initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><SEO title="Pricing & Cycles" /><PricingCyclePage onBack={() => navigate('/')} /></MotionDiv>} />
                    <Route path="/partner" element={<MotionDiv initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><SEO title="Partner with SML" /><PartnerPage onBack={() => navigate('/')} /></MotionDiv>} />

                    <Route path="/login" element={<><SEO title="Login" /><Login onNavigate={handleNavigate} logoUrl={logoWhiteUrl} /></>} />
                    <Route path="/register" element={<><SEO title="Sign Up" /><Register onNavigate={handleNavigate} logoUrl={logoWhiteUrl} /></>} />
                    <Route path="/forgot-password" element={<ForgotPassword onNavigate={handleNavigate} logoUrl={logoWhiteUrl} />} />
                    <Route path="/reset-password" element={<ResetPassword onNavigate={handleNavigate} />} />
                    <Route path="/verify-email" element={<VerifyEmail token={new URLSearchParams(location.search).get('token') || ''} onNavigate={handleNavigate} onSuccess={(msg) => showToast(msg, 'success')} />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AnimatePresence>
        </Suspense>
      </main>

      {showPublicChrome && (
         <Footer 
            onNavigate={handleNavigate} 
            logoUrl={logoWhiteUrl}
            onLegal={(docTitle) => {
                let content = "";
                if(docTitle === 'Privacy Policy') content = settings?.legalContent?.privacyPolicy || "";
                if(docTitle === 'Terms of Service') content = settings?.legalContent?.termsOfService || "";
                if(docTitle === 'Refund Policy') content = settings?.legalContent?.refundPolicy || "";
                setViewingDoc({ title: docTitle, content });
            }}
         />
      )}
    </div>
  );
};
