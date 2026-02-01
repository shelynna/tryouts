
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { ASSETS } from '../../assets';
import { cn } from '../../lib/utils';
import { BottomNavBar } from './BottomNavBar';
import { AnimatePresence, motion } from 'framer-motion';
import { Modal, Button } from '../ui';
// @ts-ignore
import { Link, useLocation } from 'react-router-dom';

const MotionDiv = motion.div as any;

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  currentView: string; 
  onNavigate: (view: any) => void;
  onLogout: () => void;
  logoUrl?: string;
}

interface NavContentProps {
    user: User;
    onNavigate: (view: any) => void; 
    isMenuOpen: boolean;
    setIsMenuOpen: (v: boolean) => void;
    onLogoutClick: () => void;
    menuRef: React.RefObject<HTMLDivElement>;
    logoUrl?: string; 
}

const NavContent: React.FC<NavContentProps> = ({ 
    user, onNavigate, isMenuOpen, setIsMenuOpen, onLogoutClick, menuRef, logoUrl 
}) => {
    const location = useLocation();
    
    const navItems = [
        { path: '/shop', label: 'Marketplace', iconClass: 'bx bx-shopping-bag' },
        { path: '/dashboard', label: 'Dashboard', iconClass: 'bx bxs-dashboard', exact: true },
        { path: '/dashboard/history', label: 'Transactions', iconClass: 'bx bx-history' },
        { path: '/dashboard/settings', label: 'Settings', iconClass: 'bx bx-cog' },
        { path: '/help', label: 'Support', iconClass: 'bx bx-help-circle' },
    ];

    const isActive = (path: string, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="flex flex-col h-full bg-stone-900 text-stone-300 font-sans">
            <div className="p-8 pb-8 flex items-center justify-center">
                <img src={logoUrl || ASSETS.LOGO_WHITE} alt="SML" className="h-10 w-auto opacity-90 object-contain" />
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const active = isActive(item.path, item.exact);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group",
                                active 
                                    ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20" 
                                    : "hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <i className={cn("text-xl transition-colors", item.iconClass, active ? "text-white" : "text-stone-500 group-hover:text-white")}></i>
                            <span className="font-medium text-sm font-heading">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5 mt-auto relative" ref={menuRef}>
                <AnimatePresence>
                    {isMenuOpen && (
                        <MotionDiv
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-full left-4 right-4 mb-2 bg-stone-800 rounded-xl shadow-xl border border-white/10 overflow-hidden z-20"
                        >
                            <Link 
                                to="/dashboard/settings"
                                onClick={() => setIsMenuOpen(false)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                            >
                                <i className='bx bx-user text-lg'></i> Update Info
                            </Link>
                            
                            {/* Updated Link to go to Settings -> Subscription Tab */}
                            <Link 
                                to="/dashboard/settings?tab=subscription"
                                onClick={() => setIsMenuOpen(false)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                            >
                                <i className='bx bx-crown text-lg'></i> My Subscription
                            </Link>

                            <div className="h-px bg-white/10 mx-2" />
                            <button 
                                onClick={onLogoutClick}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors text-left"
                            >
                                <i className='bx bx-log-out text-lg'></i> Log Out
                            </button>
                        </MotionDiv>
                    )}
                </AnimatePresence>

                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={cn(
                        "w-full bg-white/5 hover:bg-white/10 rounded-2xl p-3 flex items-center gap-3 transition-colors text-left group",
                        isMenuOpen && "bg-white/10 ring-1 ring-white/20"
                    )}
                >
                    <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-heading font-bold shadow-lg shrink-0 overflow-hidden">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            user.fullName ? user.fullName.charAt(0) : 'U'
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{user.fullName || 'User'}</p>
                        <p className="text-xs text-stone-500 truncate">{user.pickupPoint}</p>
                    </div>
                    <i className={cn("bx bx-chevron-up text-xl text-stone-500 transition-transform duration-300", isMenuOpen && "rotate-180 text-white")}></i>
                </button>
            </div>
        </div>
    );
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, user, currentView, onNavigate, onLogout, logoUrl
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogoutClick = () => {
      setIsMenuOpen(false);
      setIsLogoutConfirmOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex font-sans">
      <Modal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        title="Sign Out"
        size="sm"
        footer={
            <>
                <Button variant="ghost" onClick={() => setIsLogoutConfirmOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={onLogout}>Confirm Sign Out</Button>
            </>
        }
      >
        <p className="text-stone-600">
            Are you sure you want to sign out of your account?
        </p>
      </Modal>

      <aside className="hidden lg:block w-72 h-screen sticky top-0 shrink-0">
        <NavContent 
            user={user} 
            onNavigate={onNavigate} 
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            onLogoutClick={handleLogoutClick}
            menuRef={menuRef}
            logoUrl={logoUrl}
        />
      </aside>

      <main className="flex-1 min-w-0 lg:pt-0 pb-36 lg:pb-0">
        <div className="h-full w-[90%] max-w-[1600px] mx-auto py-10 md:py-12">
           {children}
        </div>
      </main>
      
      <BottomNavBar currentView={currentView} onNavigate={onNavigate} />
    </div>
  );
};
