
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdminData } from '../hooks/useAdminData';
import { ASSETS } from '../assets';
import { OverviewTab } from '../components/dashboard/admin/OverviewTab';
import { OrdersTab } from '../components/dashboard/admin/OrdersTab';
import { ProductsTab } from '../components/dashboard/admin/ProductsTab';
import { UsersTab } from '../components/dashboard/admin/UsersTab';
import { DeliveriesTab } from '../components/dashboard/admin/DeliveriesTab';
import { PickupTab } from '../components/dashboard/admin/PickupTab';
import { TopUpsTab } from '../components/dashboard/admin/TopUpsTab';
import { ProcurementTab } from '../components/dashboard/admin/ProcurementTab';
import { ContentTab } from '../components/dashboard/admin/ContentTab';
import { SystemLogsTab } from '../components/dashboard/admin/SystemLogsTab';
import { AssociatesTab } from '../components/dashboard/admin/AssociatesTab';
import { API } from '../lib/api';
import { Button, Modal } from '../components/ui';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const MotionDiv = motion.div as any;

const TABS = [
  { id: 'OVERVIEW', label: 'Overview', iconClass: 'bx bxs-dashboard' },
  { id: 'ORDERS', label: 'Orders', iconClass: 'bx bx-cart' },
  { id: 'PRODUCTS', label: 'Inventory', iconClass: 'bx bx-package' },
  { id: 'USERS', label: 'Users', iconClass: 'bx bx-group' },
  { id: 'ASSOCIATES', label: 'Associates', iconClass: 'bx bx-award' },
  { id: 'TOPUPS', label: 'Top-Ups', iconClass: 'bx bx-up-arrow-circle' },
  { id: 'PROCUREMENT', label: 'Procurement', iconClass: 'bx bx-grid-alt' },
  { id: 'DELIVERIES', label: 'Dispatch', iconClass: 'bx bxs-truck' },
  { id: 'PICKUP', label: 'Quick Scan', iconClass: 'bx bx-qr' },
  { id: 'CONTENT', label: 'Content', iconClass: 'bx bx-file' },
  { id: 'LOGS', label: 'System Logs', iconClass: 'bx bx-pulse' },
];

export const AdminDashboard: React.FC<{ onAction: (msg: string, type?: any) => void }> = ({ onAction }) => {
    const { logout, isAdmin } = useAuth();
    const { 
        settings, products, topUps, procurementList, allOrders, stats, 
        refreshAdminData, isLoading 
    } = useAdminData(isAdmin);

    const [activeTab, setActiveTab] = useState('OVERVIEW');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

    if (isLoading && !settings) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4">
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">Loading Console...</p>
            </div>
        );
    }

    if (!settings && !isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-6 p-6 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="font-bold text-stone-900 text-lg mb-2">Connection Issue</h3>
                    <p className="text-stone-500 text-sm mb-6">
                        We couldn't load the system configuration. This might be due to a network error or missing database setup.
                    </p>
                    <Button onClick={refreshAdminData} className="gap-2 w-full">
                        <RefreshCw size={16} /> Retry Connection
                    </Button>
                </div>
            </div>
        );
    }

    // Dynamic White Logo
    const logoUrl = settings?.branding?.logoWhite || ASSETS.LOGO_WHITE;

    const renderContent = () => {
        // Safe check for settings
        if (!settings) return null;

        switch(activeTab) {
            case 'OVERVIEW': return <OverviewTab stats={stats} />;
            case 'ORDERS': return <OrdersTab orders={allOrders} />;
            case 'PRODUCTS': return <ProductsTab products={products} settings={settings} refreshAdminData={refreshAdminData} notify={onAction} />;
            case 'USERS': return <UsersTab />;
            case 'ASSOCIATES': return <AssociatesTab />;
            case 'DELIVERIES': return <DeliveriesTab />;
            case 'PICKUP': return <PickupTab />;
            case 'TOPUPS': return <TopUpsTab topUps={topUps} refreshAdminData={refreshAdminData} notify={onAction} />;
            case 'PROCUREMENT': return <ProcurementTab procurementList={procurementList} />;
            case 'CONTENT': return <ContentTab settings={settings} onSave={async (s) => { try { await API.saveSettings(s); refreshAdminData(); onAction("Content saved", "success"); } catch(e: any) { onAction(e.message, "error"); } }} />;
            case 'LOGS': return <SystemLogsTab />;
            default: return <OverviewTab stats={stats} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] font-sans flex flex-col lg:flex-row">
            {/* Modal for Logout */}
            <Modal
                isOpen={isLogoutConfirmOpen}
                onClose={() => setIsLogoutConfirmOpen(false)}
                title="Sign Out"
                size="sm"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsLogoutConfirmOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={logout}>Confirm Sign Out</Button>
                    </>
                }
            >
                <p className="text-stone-600">Are you sure you want to sign out of the Admin Console?</p>
            </Modal>

            {/* =======================
                MOBILE HEADERS (STACKED)
               ======================= */}
            
            {/* 1. Brand Top Bar (Fixed) */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-stone-900 px-5 py-3 h-[52px] flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                    <img src={logoUrl} alt="SML" className="h-6 w-auto opacity-90 object-contain" />
                </div>
            </div>

            {/* 2. Controls Sub-Header (Fixed below Brand) */}
            <header className="lg:hidden fixed top-[52px] left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-stone-200 px-5 py-3 h-[68px] flex items-center justify-between shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <h1 className="text-lg font-bold text-stone-900 leading-none">
                            {TABS.find(t => t.id === activeTab)?.label}
                        </h1>
                        {activeTab === 'TOPUPS' && topUps.length > 0 && (
                            <span className="bg-red-50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">{topUps.length}</span>
                        )}
                    </div>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Console</p>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2.5 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200 active:scale-95 transition-all border border-stone-200"
                >
                    <i className='bx bx-grid-alt text-xl'></i>
                </button>
            </header>

            {/* Mobile Menu Dropdown (Replaces Drawer) */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <MotionDiv
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 z-[60] bg-stone-900/60 backdrop-blur-sm lg:hidden"
                        />
                        
                        {/* Dropdown Panel */}
                        <MotionDiv
                            initial={{ y: '-100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '-100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 right-0 z-[70] bg-white rounded-b-[32px] shadow-2xl overflow-hidden lg:hidden flex flex-col max-h-[85vh]"
                        >
                             {/* Header in Menu */}
                             <div className="px-6 py-5 flex items-center justify-between border-b border-stone-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Menu</span>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200 cursor-pointer">
                                    <i className='bx bx-x text-xl'></i>
                                </button>
                             </div>

                             {/* Grid Content */}
                             <div className="p-6 grid grid-cols-3 gap-3 overflow-y-auto">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 aspect-square relative",
                                            activeTab === tab.id 
                                                ? "bg-brand-50 border-brand-200 text-brand-700 shadow-sm" 
                                                : "bg-white border-stone-100 shadow-sm text-stone-600 hover:border-stone-200"
                                        )}
                                    >
                                        <i className={cn("text-2xl mb-2", tab.iconClass, activeTab === tab.id ? "text-brand-600" : "text-stone-400")}></i>
                                        <span className="font-bold text-[10px] uppercase tracking-wide text-center leading-tight">{tab.label}</span>
                                        
                                        {/* Badge for TopUps */}
                                        {tab.id === 'TOPUPS' && topUps.length > 0 && (
                                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">{topUps.length}</span>
                                        )}
                                    </button>
                                ))}
                             </div>
                             
                             {/* Footer Actions */}
                             <div className="p-6 border-t border-stone-100 bg-stone-50/50">
                                <button 
                                    onClick={() => { setIsMobileMenuOpen(false); setIsLogoutConfirmOpen(true); }}
                                    className="w-full flex items-center justify-center gap-2 py-3 text-red-500 font-bold bg-white border border-red-100 rounded-xl hover:bg-red-50 transition-colors shadow-sm"
                                >
                                    <i className='bx bx-log-out text-lg'></i> Sign Out
                                </button>
                             </div>
                        </MotionDiv>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 h-screen sticky top-0 flex-col bg-stone-900 text-stone-400 border-r border-stone-800 shrink-0">
                <div className="p-6 flex flex-col items-center justify-center mb-6 border-b border-white/5 py-8">
                    {/* Logo Only - Centered */}
                    <img src={logoUrl} alt="SML" className="h-10 w-auto opacity-90 mb-2 object-contain" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-500">Admin Console</span>
                </div>

                <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-brand-600 text-white shadow-lg shadow-brand-900/50" 
                                    : "hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <i className={cn("text-lg", tab.iconClass)}></i>
                            {tab.label}
                            {tab.id === 'TOPUPS' && topUps.length > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{topUps.length}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button 
                        onClick={() => setIsLogoutConfirmOpen(true)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <i className='bx bx-log-out text-lg'></i> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 pt-[120px] lg:pt-0">
                <div className="h-full px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};
    