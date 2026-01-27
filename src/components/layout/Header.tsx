
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBasket } from '../../context/BasketContext';
import { Button, Modal } from '../ui';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ASSETS } from '../../assets';
import { Link, useLocation } from '../ui/utils';

// Cast motion components to any to bypass type mismatch errors
const MotionHeader = motion.header as any;
const MotionDiv = motion.div as any;

interface HeaderProps {
  currentView: string;
  setView: (view: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount, openCart } = useBasket(); 
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdmin = user?.role === 'ADMIN';

  // Define Links with their paths
  const navLinks = isAuthenticated 
    ? (isAdmin 
        ? [{ id: 'ADMIN_DASHBOARD', label: 'Admin Console', path: '/admin' }]
        : [
            { id: 'SHOP', label: 'Marketplace', path: '/shop' },
            { id: 'DASHBOARD', label: 'My Dashboard', path: '/dashboard' },
            { id: 'PRICING', label: 'Pricing Cycle', path: '/pricing' },
            { id: 'PARTNER', label: 'Partner with us', path: '/partner' },
          ]
      )
    : [
        { id: 'LANDING', label: 'Home', path: '/' },
        { id: 'SHOP', label: 'Shop', path: '/shop' },
        { id: 'ABOUT', label: 'How SML Works', path: '/about' },
        { id: 'PRICING', label: 'Pricing Cycle', path: '/pricing' },
        { id: 'PARTNER', label: 'Partner with us', path: '/partner' },
      ];

  const handleLogoutClick = () => {
      setMobileMenuOpen(false);
      setIsLogoutConfirmOpen(true);
  };

  const isActive = (path: string) => {
      if (path === '/' && location.pathname !== '/') return false;
      return location.pathname.startsWith(path);
  };

  return (
    <>
      <Modal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        title="Sign Out"
        size="sm"
        footer={
            <>
                <Button variant="ghost" onClick={() => setIsLogoutConfirmOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={() => { logout(); setIsLogoutConfirmOpen(false); setView('LOGIN'); }}>Confirm Sign Out</Button>
            </>
        }
      >
        <p className="text-stone-600">
            Are you sure you want to sign out?
        </p>
      </Modal>

      <MotionHeader 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled ? "glass-nav py-3" : "bg-white/80 backdrop-blur-sm py-4 lg:py-5 lg:bg-transparent"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container-padding flex items-center justify-between">
          
          {/* 1. Logo & Brand Name - Force Flex display for mobile */}
          <Link 
            to={isAuthenticated ? (isAdmin ? '/admin' : '/shop') : '/'}
            className="flex items-center cursor-pointer gap-2 z-50 shrink-0" 
          >
            <img src={ASSETS.LOGO} alt="SMM" className="h-8 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl tracking-tight text-stone-900 leading-none">SMM.</span>
              <span className="text-[8px] font-bold text-brand-600 uppercase tracking-widest leading-none">Sɔ ME MU</span>
            </div>
          </Link>

          {/* 2. Desktop Nav - Centered */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
             {navLinks.map(link => (
               <Link
                 key={link.id}
                 to={link.path}
                 className={cn(
                   "text-sm font-medium transition-all duration-200 relative group whitespace-nowrap",
                   isActive(link.path) ? "text-stone-900 font-bold" : "text-stone-500 hover:text-stone-900"
                 )}
               >
                 {link.label}
                 {isActive(link.path) && (
                   <MotionDiv layoutId="underline" className="absolute -bottom-1 left-0 right-0 h-px bg-stone-900" />
                 )}
               </Link>
             ))}
          </nav>

          {/* 3. Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Search Trigger (Visual Only for now) */}
            <button className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors hidden sm:block">
              <i className='bx bx-search text-xl'></i>
            </button>

            {isAuthenticated ? (
               <div className="flex items-center gap-2">
                 {!isAdmin && (
                    <button 
                      onClick={openCart}
                      className="relative p-2 text-stone-900 hover:opacity-70 transition-opacity"
                    >
                        <i className='bx bx-shopping-bag text-xl font-bold'></i>
                        {itemCount > 0 && (
                          <span className="absolute top-0 right-0 bg-accent-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                            {itemCount}
                          </span>
                        )}
                    </button>
                 )}

                 <div className="relative group hidden sm:block">
                    <Link 
                        to={isAdmin ? '/admin' : '/dashboard'} 
                        className={cn("flex items-center gap-2 pl-2 transition-transform active:scale-95", isActive('/dashboard') && "scale-105")}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center transition-colors",
                            isActive('/dashboard') ? "bg-brand-900 text-white border-brand-900" : "bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200"
                        )}>
                            {isActive('/dashboard') ? <i className='bx bxs-dashboard text-base'></i> : <i className='bx bx-user text-base'></i>}
                        </div>
                    </Link>
                 </div>
               </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <Link 
                  to="/login"
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Log in
                </Link>
                <Button 
                  size="sm" 
                  onClick={() => setView('REGISTER')} // Keep setView for this since Register is a flow in this context or use Link
                  className="rounded-full px-6"
                >
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-stone-900 z-50 relative"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <i className='bx bx-x text-2xl'></i> : <i className='bx bx-menu text-2xl'></i>}
            </button>
          </div>
        </div>
      </MotionHeader>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <MotionDiv 
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-white pt-28 px-6 flex flex-col h-screen overflow-y-auto shadow-2xl"
          >
            <div className="space-y-6 flex-1">
                {navLinks.map((link, i) => (
                  <MotionDiv
                    key={link.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + (i * 0.05) }}
                  >
                    <Link 
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "block w-full text-left text-3xl font-heading font-medium transition-colors",
                        isActive(link.path) ? "text-brand-600" : "text-stone-900 hover:text-brand-500"
                      )}
                    >
                      {link.label}
                    </Link>
                  </MotionDiv>
                ))}
            </div>

            <MotionDiv 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-auto pb-12 border-t border-stone-100 pt-8"
            >
                {!isAuthenticated ? (
                   <div className="space-y-4">
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                          <Button fullWidth size="lg">
                            Sign Up <i className='bx bx-right-arrow-alt ml-2 text-lg'></i>
                          </Button>
                      </Link>
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" fullWidth size="lg">
                            Log In
                          </Button>
                      </Link>
                   </div>
                ) : (
                  <Button variant="danger" fullWidth onClick={handleLogoutClick}>
                    Sign Out
                  </Button>
                )}
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </>
  );
};
