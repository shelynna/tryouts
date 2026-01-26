
import React, { useState, useEffect } from 'react';
import { API } from '../lib/api';
import { PickupListEntry, ProcurementItem, Product, SystemSettings, TopUpRequest, AdminBasketEntry } from '../types';
import { Tabs, Button } from '../components/ui';
import { LayoutDashboard, Settings, CheckSquare, Truck, ClipboardList, ShoppingCart, FileText, Users, Lock, PieChart } from 'lucide-react';
import { OverviewTab } from '../components/dashboard/admin/OverviewTab';
import { ProductsTab } from '../components/dashboard/admin/ProductsTab';
import { CycleTab } from '../components/dashboard/admin/CycleTab';
import { ContentTab } from '../components/dashboard/admin/ContentTab';
import { TopUpsTab } from '../components/dashboard/admin/TopUpsTab';
import { ProcurementTab } from '../components/dashboard/admin/ProcurementTab';
import { PickupTab } from '../components/dashboard/admin/PickupTab';
import { UsersTab } from '../components/dashboard/admin/UsersTab';
import { OrdersTab } from '../components/dashboard/admin/OrdersTab';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardProps {
    onAction?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onAction }) => {
  const { isAdmin, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [topUps, setTopUps] = useState<TopUpRequest[]>([]);
  const [procurementList, setProcurementList] = useState<ProcurementItem[]>([]);
  const [pickupList, setPickupList] = useState<PickupListEntry[]>([]);
  const [allOrders, setAllOrders] = useState<AdminBasketEntry[]>([]);
  const [pickupFilter, setPickupFilter] = useState<string>('ALL');
  const [products, setProducts] = useState<Product[]>([]);
  const [financials, setFinancials] = useState({ projectedRevenue: 0, collectedRevenue: 0, completionRate: 0 });
  
  // Helper for notifications
  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
      if (onAction) onAction(msg, type);
      else alert(msg);
  };

  useEffect(() => { 
      if (isAdmin) refreshAdminData(); 
  }, [activeTab, pickupFilter, isAdmin]);

  const refreshAdminData = async () => {
      try {
        const settingsData = await API.getSettings();
        setSettings(settingsData);

        const stats = await API.getAdminStats();
        setFinancials(stats);

        if (activeTab === 'PRODUCTS') setProducts(await API.getProducts({ isAdmin: true }));
        if (activeTab === 'ORDERS') setAllOrders(await API.getAllBaskets());
        if (activeTab === 'PROCUREMENT') setProcurementList(await API.getProcurementList());
        if (activeTab === 'PICKUP') setPickupList(await API.getPickupList(pickupFilter === 'ALL' ? undefined : pickupFilter));
        if (activeTab === 'TOPUPS') setTopUps(await API.getTopUpRequests());
      } catch (e) {
          console.error("Failed to load admin data", e);
      }
  };

  const handleSaveSettings = async (newSettings: SystemSettings) => {
      try {
          await API.saveSettings(newSettings);
          setSettings(newSettings);
          notify("Settings & Content Published Successfully!", "success");
      } catch (e: any) {
          notify(e.message || "Failed to save settings", "error");
      }
  };

  if (isLoading) return <div className="p-20 text-center text-stone-400">Verifying privileges...</div>;
  
  // Security Guard
  if (!isAdmin) {
      return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">Access Denied</h2>
              <p className="text-stone-500 max-w-md">You do not have permission to view the administrative console. Please return to the user dashboard.</p>
              <Button onClick={() => window.location.reload()} className="mt-6">Return Home</Button>
          </div>
      );
  }

  const tabs = [
    { id: 'OVERVIEW', label: 'Dashboard', icon: <LayoutDashboard size={16}/> },
    { id: 'ORDERS', label: 'Active Orders', icon: <PieChart size={16}/> }, // NEW
    { id: 'PICKUP', label: 'Distribution', icon: <ClipboardList size={16}/> },
    { id: 'PRODUCTS', label: 'Catalogue', icon: <ShoppingCart size={16}/> },
    { id: 'USERS', label: 'Users', icon: <Users size={16}/> },
    { id: 'PROCUREMENT', label: 'Procurement', icon: <Truck size={16}/> },
    { id: 'TOPUPS', label: 'Top-Ups', icon: <CheckSquare size={16}/> },
    { id: 'CYCLE', label: 'Config', icon: <Settings size={16}/> },
    { id: 'CONTENT', label: 'Content', icon: <FileText size={16}/> },
  ];

  if (!settings) return <div className="p-20 text-center text-stone-400 animate-pulse">Initializing System Control...</div>;

  return (
      <div className="pt-4 pb-20 max-w-7xl mx-auto px-4 md:px-6 space-y-10 animate-in fade-in duration-700 font-sans">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-stone-200 pb-8">
             <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest">Administrator</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
                    </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-900 tracking-tight">System Control</h1>
             </div>
          </div>
          
          <Tabs activeId={activeTab} onChange={setActiveTab} items={tabs} />

          <div className="mt-8">
              {activeTab === 'OVERVIEW' && (
                  <OverviewTab financials={financials} />
              )}

              {activeTab === 'ORDERS' && (
                  <OrdersTab orders={allOrders} />
              )}

              {activeTab === 'USERS' && (
                  <UsersTab />
              )}

              {activeTab === 'CONTENT' && (
                  <ContentTab settings={settings} onSave={handleSaveSettings} />
              )}

              {activeTab === 'CYCLE' && (
                  <CycleTab settings={settings} onSave={handleSaveSettings} />
              )}
            
            {activeTab === 'TOPUPS' && (
                <TopUpsTab 
                    topUps={topUps}
                    onApprove={() => {
                        if(confirm("Approve this request?")) notify("Approval logic would run here.", "info");
                    }}
                    onDeny={() => notify("Denial logic would run here.", "info")}
                />
            )}

              {activeTab === 'PRODUCTS' && (
                 <ProductsTab 
                    products={products}
                    settings={settings}
                    refreshAdminData={refreshAdminData}
                    notify={notify}
                 />
              )}

              {activeTab === 'PROCUREMENT' && (
                 <ProcurementTab procurementList={procurementList} />
              )}

              {activeTab === 'PICKUP' && (
                 <PickupTab 
                    pickupList={pickupList} 
                    pickupFilter={pickupFilter} 
                    onFilterChange={setPickupFilter} 
                 />
              )}
          </div>
      </div>
  );
};
