
import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
// @ts-ignore
import { Link, useLocation } from 'react-router-dom';

const MotionDiv = motion.div as any;

interface BottomNavBarProps {
    currentView: string;
    onNavigate: (view: any) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = () => {
    const location = useLocation();

    const navItems = [
        { 
            path: '/dashboard',
            label: 'Home', 
            iconClass: 'bx bxs-dashboard',
            exact: true
        },
        { 
            path: '/shop', 
            label: 'Market', 
            iconClass: 'bx bx-shopping-bag'
        },
        { 
            path: '/dashboard/history', 
            label: 'Orders', 
            iconClass: 'bx bx-receipt'
        },
        { 
            path: '/dashboard/settings', 
            label: 'Profile', 
            iconClass: 'bx bx-user'
        },
    ];

    const isActive = (path: string, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
            <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-stone-200/50 p-2 flex justify-between items-center h-[72px]">
                {navItems.map(item => {
                    const active = isActive(item.path, item.exact);
                    const isShop = item.path === '/shop';

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "relative flex flex-1 flex-col items-center justify-center h-full rounded-[1.5rem] transition-all duration-300",
                                active ? "text-brand-900" : "text-stone-400 hover:text-stone-600"
                            )}
                        >
                            {active && (
                                <MotionDiv 
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-brand-50 rounded-[1.5rem]"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            <div className="relative z-10 flex flex-col items-center gap-1">
                                <i className={cn(
                                    "text-2xl transition-transform duration-300",
                                    item.iconClass,
                                    active ? "scale-110 text-brand-600" : "",
                                    isShop && !active ? "text-brand-600" : "" 
                                )}></i>
                                <span className={cn(
                                    "text-[10px] font-medium tracking-wide transition-all duration-300",
                                    active ? "text-brand-900 font-bold translate-y-0" : "text-stone-400"
                                )}>
                                    {item.label}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
