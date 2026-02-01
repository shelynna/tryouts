
import React from 'react';
import { Card } from '../../../ui';
import { Package } from 'lucide-react';

interface OrderHealthProps {
    breakdown: Record<string, number>;
}

export const OrderHealth: React.FC<OrderHealthProps> = ({ breakdown }) => {
  return (
      <Card className="p-5 flex flex-col">
          <div className="flex justify-between items-start mb-6">
             <div>
                <h3 className="font-bold text-stone-900 text-base md:text-lg">Order Health</h3>
                <p className="text-xs text-stone-500">Status breakdown</p>
             </div>
             <Package className="text-stone-300 w-5 h-5" />
          </div>

          <div className="space-y-3 flex-1">
              <div className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-stone-800"></div>
                      <span className="text-sm font-bold text-stone-700">Open / Active</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-stone-900">{breakdown['OPEN'] || 0}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                      <span className="text-sm font-bold text-blue-700">Partial Payment</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-blue-800">{breakdown['PARTIAL'] || 0}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-bold text-emerald-800">Ready for Pickup</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-emerald-700">{breakdown['PAID'] || 0}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                      <span className="text-sm font-bold text-orange-800">Locked (Unpaid)</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-orange-700">{breakdown['LOCKED'] || 0}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-bold text-blue-800">Collected</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-blue-700">{breakdown['COLLECTED'] || 0}</span>
              </div>
          </div>
      </Card>
  );
};
