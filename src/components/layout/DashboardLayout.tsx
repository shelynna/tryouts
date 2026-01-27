
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { ASSETS } from '../../assets';
import { cn } from '../../lib/utils';
import { BottomNavBar } from './BottomNavBar';
import { AnimatePresence, motion } from 'framer-motion';
import { Modal, Button } from '../ui';
import { Link, useLocation } from '../ui/utils';

// Cast motion for safety
const MotionDiv = motion.div as any;

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  currentView: string; // Kept for backward compat but effectively unused for sidebar active state
  onNavigate: (view: any) => void;
  onLogout: () => void;
}

interface NavContentProps {
    user: User;
    onNavigate: (view: any) => void; // Used for non-link actions
    isMenuOpen: boolean;
    setIsMenuOpen: (v: boolean) => void;
    onLogoutClick: () => void;
    menuRef: React.RefObject<HTMLDivElement>;
}

const NavContent: React.FC<NavContentProps> = ({ 
    user, onNavigate, isMenuOpen, setIsMenuOpen, onLogoutClick, menuRef 
}) => {
    const location = useLocation();
    
    // Explicit paths ensure URL bar matches navigation
    const navItems = [
        { path: '/dashboard', label: 'Overview', iconClass: 'bx bx-grid-alt', exact: true },
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
            {/* Brand */}
            <div className="p-8 pb-8 flex items-center gap-3">
                <img src={ASSETS.LOGO_WHITE} alt="SMM" className="h-8 w-auto opacity-90" />
                <span className="font-heading font-bold text-2xl text-white tracking-tight">SMM.</span>
            </div>

            {/* Primary Action */}
            <div className="px-4 mb-6">
                <Link 
                    to="/shop"
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-brand-900/50"
                >
                    <i className='bx bx-shopping-bag text-lg'></i> Go to Marketplace
                </Link>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const active = isActive(item.path, item.exact);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group",
                                active 
                                    ? "bg-white/10 text-white shadow-sm" 
                                    : "hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <i className={cn(item.iconClass, "text-xl transition-colors", active ? "text-white" : "text-stone-500 group-hover:text-white")}></i>
                            <span className="font-medium text-sm font-heading">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile Footer */}
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
                                <i className='bx bx-user text-base'></i> Update Info
                            </Link>
                            <div className="h-px bg-white/10 mx-2" />
                            <button 
                                onClick={onLogoutClick}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors text-left"
                            >
                                <i className='bx bx-log-out text-base'></i> Log Out
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
                    <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-heading font-bold shadow-lg shrink-0">
                        {user.fullName ? user.fullName.charAt(0) : 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{user.fullName || 'User'}</p>
                        <p className="text-xs text-stone-500 truncate">{user.pickupPoint}</p>
                    </div>
                    <i className={cn("bx bx-chevron-up text-lg text-stone-500 transition-transform duration-300", isMenuOpen && "rotate-180 text-white")} />
                </button>
            </div>
        </div>
    );
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  user, 
  currentView, 
  onNavigate, 
  onLogout 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
      setIsMenuOpen(false);
      setIsLogoutConfirmOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex font-sans">
      
      {/* Logout Confirmation Modal */}
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

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 shrink-0">
        <NavContent 
            user={user} 
            onNavigate={onNavigate} 
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            onLogoutClick={handleLogoutClick}
            menuRef={menuRef}
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 lg:pt-0 pb-36 lg:pb-0">
        <div className="h-full px-4 py-8 md:px-8 md:py-10 max-w-7xl mx-auto">
           {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation - Pass currentView prop strictly for logic but handle internal logic in BottomNavBar if needed */}
      <BottomNavBar currentView={currentView} onNavigate={onNavigate} />
    </div>
  );
};
