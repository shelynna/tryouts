
import React, { useState, useEffect } from 'react';
import { Card, Badge, ProgressBar, Button } from '../../ui';
import { Basket } from '../../../types';
import { API } from '../../../lib/api';
import { formatDate, formatCurrency } from '../../../lib/utils';
import { CreditCard, Package, ChevronDown, ChevronUp, Loader2, Receipt, Calendar, Info, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

export const HistoryTab: React.FC = () => {
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBasket, setExpandedBasket] = useState<string | null>(null);

  useEffect(() => {
      loadHistory();
  }, []);

  const loadHistory = async () => {
      try {
          const data = await API.getUserBaskets();
          setBaskets(data);
          // Auto expand the first one if it exists
          if (data.length > 0 && !expandedBasket) {
              setExpandedBasket(data[0].id);
          }
      } catch (e) {
          console.error("Failed to load history", e);
      } finally {
          setLoading(false);
      }
  };

  const toggleExpand = (id: string) => {
      setExpandedBasket(expandedBasket === id ? null : id);
  };

  if (loading) {
      return (
          <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-brand-500" size={32} />
          </div>
      );
  }

  return (
      <div className="space-y-8 w-full pb-20">
          <div className="flex justify-between items-center pb-4 border-b border-stone-200">
              <div>
                <h3 className="font-heading font-bold text-3xl text-stone-900">Order History</h3>
                <p className="text-stone-500 text-sm mt-1">Track your past cycles and payments.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={loadHistory} className="gap-2">
                  <RefreshCw size={16} /> Refresh
              </Button>
          </div>

          {baskets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-stone-200 text-center">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                      <Package size={32} className="text-stone-300" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-lg font-bold text-stone-900">No orders yet</h4>
                  <p className="text-stone-500 text-sm max-w-xs mx-auto mt-2">
                      Once you start a basket, it will appear here.
                  </p>
              </div>
          ) : (
              <div className="space-y-6">
                  {baskets.map((b) => {
                      const progress = b.totalValue > 0 ? (b.amountPaid / b.totalValue) * 100 : 0;
                      const isExpanded = expandedBasket === b.id;
                      const itemCount = b.items.reduce((acc, i) => acc + i.quantity, 0);
                      const isPaid = b.status === 'PAID' || b.status === 'COLLECTED';

                      return (
                          <MotionDiv 
                            key={b.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                                isPaid ? 'bg-white border-emerald-100 shadow-sm' : 'bg-white border-stone-200 shadow-soft'
                            }`}
                          >
                              {/* Header Summary */}
                              <div 
                                className="p-6 md:p-8 cursor-pointer hover:bg-stone-50/50 transition-colors"
                                onClick={() => toggleExpand(b.id)}
                              >
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                      {/* Left Info */}
                                      <div className="flex items-start gap-4">
                                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                              isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-50 text-brand-600'
                                          }`}>
                                              <Calendar size={24} />
                                          </div>
                                          <div>
                                              <div className="flex items-center gap-3">
                                                  <h4 className="font-heading font-bold text-xl text-stone-900">{b.month}</h4>
                                                  <Badge status={b.status} size="sm" />
                                              </div>
                                              <p className="text-sm text-stone-500 font-medium mt-1 flex items-center gap-2">
                                                  <span>{itemCount} Items</span>
                                                  <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                                                  <span className="font-mono text-xs opacity-70">ID: {b.id.substring(0,8)}</span>
                                              </p>
                                          </div>
                                      </div>

                                      {/* Right Financials */}
                                      <div className="flex flex-col md:items-end gap-1">
                                          <span className="text-3xl font-heading font-bold text-stone-900 tracking-tight">
                                              {formatCurrency(b.totalValue)}
                                          </span>
                                          <div className="flex items-center gap-2 text-sm">
                                              <span className="text-stone-500">Paid:</span>
                                              <span className={`font-bold ${isPaid ? 'text-emerald-600' : 'text-stone-700'}`}>
                                                  {formatCurrency(b.amountPaid)}
                                              </span>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="mt-6 flex items-center gap-4">
                                      <div className="flex-1">
                                          <ProgressBar 
                                              progress={progress} 
                                              className="h-2.5 bg-stone-100" 
                                              barClassName={progress >= 100 ? "bg-emerald-500" : (b.status === 'LOCKED' ? "bg-orange-400" : "bg-brand-600")}
                                          />
                                      </div>
                                      <span className="text-xs font-bold text-stone-500 w-10 text-right">{Math.round(progress)}%</span>
                                      
                                      <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                          <ChevronDown size={20} className="text-stone-400" />
                                      </div>
                                  </div>
                              </div>

                              {/* Expanded Details */}
                              <AnimatePresence>
                                  {isExpanded && (
                                      <MotionDiv 
                                        initial={{ height: 0, opacity: 0 }} 
                                        animate={{ height: 'auto', opacity: 1 }} 
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-stone-100 bg-stone-50/50"
                                      >
                                          <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8 md:gap-12">
                                              
                                              {/* Items List */}
                                              <div>
                                                  <h5 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                      <Package size={14} /> Basket Items
                                                  </h5>
                                                  <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
                                                      {b.items.map((item, idx) => (
                                                          <div key={idx} className="flex justify-between items-center p-4 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                                                              <div className="flex items-center gap-3">
                                                                  <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-xs font-bold text-stone-600">
                                                                      {item.quantity}x
                                                                  </div>
                                                                  <div>
                                                                      <p className="text-sm font-bold text-stone-800">{item.product?.name || "Product"}</p>
                                                                      <p className="text-[10px] text-stone-400 uppercase tracking-wider">{item.product?.size}</p>
                                                                  </div>
                                                              </div>
                                                              <span className="font-mono text-sm font-bold text-stone-600">
                                                                  {formatCurrency(item.totalPrice)}
                                                              </span>
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>

                                              {/* Transactions Log */}
                                              <div>
                                                  <h5 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                      <Receipt size={14} /> Payment Log
                                                  </h5>
                                                  <div className="space-y-3">
                                                      {b.transactions.length === 0 ? (
                                                          <div className="p-6 bg-white rounded-2xl border border-dashed border-stone-200 text-center text-stone-400 text-sm italic">
                                                              No payments recorded.
                                                          </div>
                                                      ) : (
                                                          b.transactions.map((tx) => {
                                                              const dateStr = new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                                                              const timeStr = new Date(tx.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                                              
                                                              return (
                                                                  <div key={tx.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between group hover:border-brand-200 transition-colors">
                                                                      <div className="flex items-center gap-3">
                                                                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                                             {tx.type === 'SUBSCRIPTION' ? <Info size={18}/> : <CreditCard size={18} />}
                                                                         </div>
                                                                         <div>
                                                                             <p className="text-sm font-bold text-stone-900">
                                                                                 {tx.type === 'SUBSCRIPTION' ? 'Plan Upgrade' : 'Momo Payment'}
                                                                             </p>
                                                                             <p className="text-[10px] text-stone-400 font-mono">
                                                                                 {dateStr} • {timeStr}
                                                                             </p>
                                                                         </div>
                                                                      </div>
                                                                      <div className="text-right">
                                                                          <p className="font-bold text-stone-900">{formatCurrency(tx.amount)}</p>
                                                                          <p className={`text-[10px] font-bold uppercase ${tx.status === 'SUCCESS' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                              {tx.status}
                                                                          </p>
                                                                      </div>
                                                                  </div>
                                                              );
                                                          })
                                                      )}
                                                  </div>
                                              </div>
                                          </div>
                                      </MotionDiv>
                                  )}
                              </AnimatePresence>
                          </MotionDiv>
                      );
                  })}
              </div>
          )}
      </div>
  );
};
