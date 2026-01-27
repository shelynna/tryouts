
import React from 'react';
import { Card } from '../../../ui';
import { BarChart2 } from 'lucide-react';

interface RevenueChartProps {
    data: { date: string; amount: number }[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const maxRevenue = Math.max(...data.map(d => d.amount), 1);

  return (
      <Card className="lg:col-span-2 p-5 flex flex-col min-h-[250px]">
          <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-stone-900 text-base md:text-lg">Revenue Trend</h3>
                <p className="text-xs text-stone-500">Gross volume (7 days)</p>
              </div>
              <BarChart2 className="text-stone-300 w-5 h-5" />
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 border-b border-stone-100 pb-2 relative">
              {data.map((day, i) => {
                  const height = (day.amount / maxRevenue) * 100;
                  const isEmpty = day.amount === 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative z-10">
                        <div className="relative w-full flex items-end justify-center h-24 md:h-32 bg-stone-50 rounded-t-sm">
                            {!isEmpty && (
                                <div 
                                    className="w-full max-w-[30px] bg-brand-900 rounded-t-md transition-all duration-500 hover:bg-brand-700"
                                    style={{ height: `${height}%` }}
                                ></div>
                            )}
                        </div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase">{day.date.slice(0, 3)}</span>
                    </div>
                  )
              })}
          </div>
      </Card>
  );
};
