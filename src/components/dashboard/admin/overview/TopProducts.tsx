
import React from 'react';
import { Card } from '../../../ui';
import { formatCurrency } from '../../../../lib/utils';

interface TopProductsProps {
    products: { name: string; sold: number; revenue: number }[];
}

export const TopProducts: React.FC<TopProductsProps> = ({ products }) => {
  return (
      <Card className="p-0 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-stone-100 bg-stone-50/50">
              <h3 className="font-bold text-stone-900 text-base md:text-lg">Top Performing Products</h3>
          </div>
          
          {/* Mobile List View */}
          <div className="block md:hidden">
              {products.map((p, i) => (
                  <div key={i} className="p-4 border-b border-stone-100 last:border-0 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
                              #{i+1}
                          </div>
                          <div>
                              <p className="font-bold text-stone-900 text-sm">{p.name}</p>
                              <p className="text-xs text-stone-500">{p.sold} units sold</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <p className="font-bold text-emerald-600 text-sm">{formatCurrency(p.revenue)}</p>
                      </div>
                  </div>
              ))}
              {products.length === 0 && (
                   <div className="p-8 text-center text-stone-400 text-sm">No sales data.</div>
              )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="text-xs text-stone-500 uppercase bg-stone-50">
                      <tr>
                          <th className="px-6 py-3">Product Name</th>
                          <th className="px-6 py-3 text-center">Units Sold</th>
                          <th className="px-6 py-3 text-right">Revenue</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                      {products.map((p, i) => (
                          <tr key={i} className="hover:bg-stone-50">
                              <td className="px-6 py-4 font-bold text-stone-900 flex items-center gap-3">
                                  <span className="w-6 h-6 rounded bg-stone-200 flex items-center justify-center text-[10px] text-stone-500 font-mono">#{i+1}</span>
                                  {p.name}
                              </td>
                              <td className="px-6 py-4 text-center">
                                  <span className="bg-brand-50 text-brand-700 font-bold px-2 py-1 rounded text-xs">{p.sold}</span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-stone-600">{formatCurrency(p.revenue)}</td>
                          </tr>
                      ))}
                       {products.length === 0 && (
                           <tr><td colSpan={3} className="p-8 text-center text-stone-400">No product data available.</td></tr>
                       )}
                  </tbody>
              </table>
          </div>
      </Card>
  );
};
