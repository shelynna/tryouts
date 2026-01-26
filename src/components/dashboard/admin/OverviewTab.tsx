
import React from 'react';
import { Card } from '../../ui';
import { TrendingUp, ShieldCheck, Package, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';

interface OverviewTabProps {
    financials: { projectedRevenue: number, collectedRevenue: number, completionRate: number };
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ financials }) => {
  return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-stone-200 shadow-sm p-6 flex flex-col justify-between min-h-[180px]">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-stone-500 uppercase tracking-widest text-xs">Projected Revenue</h3>
                        <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <p className="text-3xl lg:text-4xl font-serif font-bold text-stone-900 whitespace-nowrap overflow-hidden text-ellipsis">
                        {formatCurrency(financials.projectedRevenue)}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-stone-400 text-xs font-medium mt-4">
                    <ArrowUpRight size={14} /> <span>Based on open baskets</span>
                </div>
            </Card>
            
            <Card className="bg-white border-stone-200 shadow-sm p-6 flex flex-col justify-between min-h-[180px]">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-stone-500 uppercase tracking-widest text-xs">Secured Funds</h3>
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <ShieldCheck size={20} />
                        </div>
                    </div>
                    <p className="text-3xl lg:text-4xl font-serif font-bold text-stone-900 whitespace-nowrap overflow-hidden text-ellipsis">
                        {formatCurrency(financials.collectedRevenue)}
                    </p>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-1.5 mt-4">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(financials.collectedRevenue / Math.max(1, financials.projectedRevenue)) * 100}%` }}></div>
                </div>
            </Card>

            <Card className="bg-white border-stone-200 shadow-sm p-6 flex flex-col justify-between min-h-[180px]">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-stone-500 uppercase tracking-widest text-xs">Completion Rate</h3>
                        <div className="p-2 bg-stone-50 rounded-lg text-stone-600">
                            <Package size={20} />
                        </div>
                    </div>
                    <p className="text-3xl lg:text-4xl font-serif font-bold text-stone-900 whitespace-nowrap">
                        {financials.completionRate.toFixed(1)}%
                    </p>
                </div>
                <p className="text-stone-400 text-xs font-medium mt-4">Baskets fully paid or approved.</p>
            </Card>
      </div>
  );
};
