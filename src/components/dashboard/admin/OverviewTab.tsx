
import React from 'react';
import { formatCurrency } from '../../../lib/utils';
import { AdminStats } from '../../../types';
import { MetricCard } from './overview/MetricCard';
import { RevenueChart } from './overview/RevenueChart';
import { OrderHealth } from './overview/OrderHealth';
import { TopProducts } from './overview/TopProducts';

interface OverviewTabProps {
    stats: AdminStats;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ stats }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* 1. Primary KPIs - 2x2 Grid on Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <MetricCard 
            title="Total Revenue" 
            value={formatCurrency(stats.projectedRevenue)} 
            subtext="Projected"
            iconClass="bx bx-dollar"
            colorClass="text-brand-600 bg-brand-600"
        />
        <MetricCard 
            title="Collected" 
            value={formatCurrency(stats.collectedRevenue)} 
            subtext={`${stats.completionRate.toFixed(0)}% Rate`}
            iconClass="bx bx-shield-quarter"
            colorClass="text-emerald-600 bg-emerald-600"
            trend={stats.completionRate}
        />
        <MetricCard 
            title="Active Baskets" 
            value={stats.totalOrders} 
            subtext="This Cycle"
            iconClass="bx bx-shopping-bag"
            colorClass="text-blue-600 bg-blue-600"
        />
        <MetricCard 
            title="Avg. Order" 
            value={formatCurrency(stats.avgOrderValue)} 
            subtext="Per Student"
            iconClass="bx bx-trending-up"
            colorClass="text-purple-600 bg-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RevenueChart data={stats.revenueTrend} />
          <OrderHealth breakdown={stats.statusBreakdown} />
      </div>

      <TopProducts products={stats.topProducts} />

      {/* Footer Stat */}
      <div className="bg-stone-900 text-white p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg"><i className='bx bx-group text-lg'></i></div>
              <div>
                  <p className="font-bold text-sm">Total Participants</p>
                  <p className="text-[10px] text-stone-400">Active this cycle</p>
              </div>
          </div>
          <div className="text-2xl font-mono font-bold tracking-widest">{stats.totalOrders}</div>
      </div>
    </div>
  );
};
