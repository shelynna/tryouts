
import React from 'react';
import { Card } from '../../ui';
import { Basket } from '../../../types';
import { formatDate, formatCurrency } from '../../../lib/utils';
import { CreditCard, Crown, Wallet } from 'lucide-react';

export const HistoryTab: React.FC<{ basket?: Basket }> = ({ basket }) => {
  return (
      <Card noPadding className="min-h-[500px]">
          <div className="p-8 border-b border-stone-100">
              <h3 className="font-serif font-bold text-2xl text-brand-900">Transaction History</h3>
              <p className="text-stone-500">Record of all your deposits and adjustments.</p>
          </div>
          <div className="p-2 overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="text-xs text-stone-500 uppercase bg-stone-50 border-y border-stone-100">
                      <tr>
                          <th className="px-8 py-4 font-bold tracking-wider">Date</th>
                          <th className="px-8 py-4 font-bold tracking-wider">Reference</th>
                          <th className="px-8 py-4 font-bold tracking-wider">Type</th>
                          <th className="px-8 py-4 font-bold tracking-wider text-right">Amount</th>
                          <th className="px-8 py-4 font-bold tracking-wider text-center">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                      {basket?.transactions?.map((tx, i) => (
                          <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                              <td className="px-8 py-5 font-mono text-stone-600">{formatDate(tx.date)}</td>
                              <td className="px-8 py-5 text-stone-400 text-xs font-mono">{tx.id.substring(0, 12)}...</td>
                              <td className="px-8 py-5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-stone-200 text-xs font-bold text-stone-700">
                                      {tx.type === 'PAYMENT' ? <CreditCard size={10}/> : (tx.type === 'SUBSCRIPTION' ? <Crown size={10}/> : <Wallet size={10}/>)}
                                      {tx.type}
                                  </span>
                              </td>
                              <td className="px-8 py-5 text-right font-bold text-brand-900">{formatCurrency(tx.amount)}</td>
                              <td className="px-8 py-5 text-center">
                                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                              </td>
                          </tr>
                      ))}
                      {(!basket?.transactions || basket.transactions.length === 0) && (
                          <tr>
                              <td colSpan={5} className="py-16 text-center text-stone-400">No transactions found for this cycle.</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </Card>
  );
};
