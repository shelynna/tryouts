
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBasket } from '../../context/BasketContext';
import { Button, cn } from '../ui';
import { Menu, X, ShoppingBag, User, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ASSETS } from '../../assets';

interface HeaderProps {
  currentView: string;
  setView: (view: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount, openCart } = useBasket(); 
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdmin = user?.role === 'ADMIN';

  const navLinks = isAuthenticated 
    ? (isAdmin 
        ? [{ id: 'ADMIN_DASHBOARD', label: 'Admin Console' }]
        : [
            { id: 'DASHBOARD', label: 'Dashboard' },
            { id: 'SHOP', label: 'Marketplace' },
          ]
      )
    : [
        { id: 'LANDING', label: 'Home' },
        { id: 'SHOP', label: 'Shop' },
        { id: 'ABOUT', label: 'Our Mission' },
      ];

  return (
    <>
      <motion.header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled ? "glass-nav py-3" : "bg-transparent py-5"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container-padding flex items-center justify-between">
          
          {/* 1. Logo */}
          <div 
            className="flex items-center cursor-pointer gap-2 z-50" 
            onClick={() => setView(isAuthenticated ? (isAdmin ? 'ADMIN_DASHBOARD' : 'DASHBOARD') : 'LANDING')}
          >
            <img src={ASSETS.LOGO} alt="SML" className="h-8 w-auto object-contain" />
            <span className="font-serif font-bold text-xl tracking-tighter text-stone-900 hidden sm:block">SML.</span>
          </div>

          {/* 2. Desktop Nav - Centered */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
             {navLinks.map(link => (
               <button
                 key={link.id}
                 onClick={() => setView(link.id)}
                 className={cn(
                   "text-sm font-medium transition-all duration-200 relative group",
                   currentView === link.id ? "text-stone-900" : "text-stone-500 hover:text-stone-900"
                 )}
               >
                 {link.label}
                 {currentView === link.id && (
                   <motion.div layoutId="underline" className="absolute -bottom-1 left-0 right-0 h-px bg-stone-900" />
                 )}
               </button>
             ))}
          </nav>

          {/* 3. Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Search Trigger (Visual Only for now) */}
            <button className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors hidden sm:block">
              <Search size={20} />
            </button>

            {isAuthenticated ? (
               <div className="flex items-center gap-2">
                 {!isAdmin && (
                    <button 
                      onClick={openCart}
                      className="relative p-2 text-stone-900 hover:opacity-70 transition-opacity"
                    >
                        <ShoppingBag size={20} strokeWidth={2} />
                        {itemCount > 0 && (
                          <span className="absolute top-0 right-0 bg-accent-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                            {itemCount}
                          </span>
                        )}
                    </button>
                 )}

                 <div className="relative group">
                    <button onClick={() => setView(isAdmin ? 'ADMIN_DASHBOARD' : 'DASHBOARD')} className="flex items-center gap-2 pl-2">
                        <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors">
                            <User size={16} />
                        </div>
                    </button>
                 </div>
               </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <button 
                  onClick={() => setView('LOGIN')}
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Log in
                </button>
                <Button 
                  size="sm" 
                  onClick={() => setView('REGISTER')} 
                  className="rounded-full px-6"
                >
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-stone-900 z-50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 flex flex-col"
          >
            <div className="space-y-6">
                {navLinks.map(link => (
                  <button 
                    key={link.id}
                    onClick={() => { setView(link.id); setMobileMenuOpen(false); }}
                    className="block w-full text-left text-3xl font-serif font-medium text-stone-900 hover:text-brand-500 transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
            </div>

            <div className="mt-auto pb-12 border-t border-stone-100 pt-8">
                {!isAuthenticated ? (
                   <div className="space-y-4">
                      <Button fullWidth size="lg" onClick={() => { setView('REGISTER'); setMobileMenuOpen(false); }}>
                        Sign Up <ArrowRight size={18} className="ml-2" />
                      </Button>
                      <Button variant="outline" fullWidth size="lg" onClick={() => { setView('LOGIN'); setMobileMenuOpen(false); }}>
                        Log In
                      </Button>
                   </div>
                ) : (
                  <Button variant="danger" fullWidth onClick={() => { logout(); setView('LOGIN'); setMobileMenuOpen(false); }}>
                    Sign Out
                  </Button>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
