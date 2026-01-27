
import React, { useState, useEffect } from 'react';
import { Card, Badge, ProgressBar, Button } from '../../ui';
import { Basket } from '../../../types';
import { API } from '../../../lib/api';
import { formatDate, formatCurrency } from '../../../lib/utils';
import { CreditCard, Package, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
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
      <div className="space-y-6 max-w-3xl mx-auto pb-20">
          <div className="flex justify-between items-center mb-2">
              <h3 className="font-serif font-bold text-2xl text-stone-900">Order History</h3>
              <Button variant="ghost" size="sm" onClick={loadHistory}>Refresh</Button>
          </div>

          {baskets.length === 0 ? (
              <Card className="p-12 text-center text-stone-400 border-dashed">
                  <Package size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No orders found yet.</p>
              </Card>
          ) : (
              baskets.map((b) => {
                  const progress = b.totalValue > 0 ? (b.amountPaid / b.totalValue) * 100 : 0;
                  const isExpanded = expandedBasket === b.id;
                  const itemCount = b.items.reduce((acc, i) => acc + i.quantity, 0);

                  return (
                      <MotionDiv 
                        key={b.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden"
                      >
                          {/* Header Summary */}
                          <div 
                            className="p-5 cursor-pointer hover:bg-stone-50/50 transition-colors"
                            onClick={() => toggleExpand(b.id)}
                          >
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <div className="flex items-center gap-3 mb-1">
                                          <h4 className="font-bold text-lg text-stone-900">{b.month}</h4>
                                          <Badge status={b.status} size="sm" />
                                      </div>
                                      <p className="text-xs text-stone-500 font-mono">ID: {b.id.split('-')[0]}</p>
                                  </div>
                                  <div className="text-right">
                                      <span className="block font-bold text-lg text-stone-900">{formatCurrency(b.totalValue)}</span>
                                      <span className="text-xs text-stone-500">{itemCount} items</span>
                                  </div>
                              </div>

                              <div className="space-y-2">
                                  <div className="flex justify-between text-xs font-bold text-stone-500">
                                      <span>Paid: {formatCurrency(b.amountPaid)}</span>
                                      <span>{Math.round(progress)}%</span>
                                  </div>
                                  <ProgressBar 
                                      progress={progress} 
                                      className="h-2" 
                                      barClassName={progress >= 100 ? "bg-emerald-500" : (b.status === 'LOCKED' ? "bg-orange-400" : "bg-brand-600")}
                                  />
                              </div>
                              
                              <div className="flex justify-center mt-2">
                                  {isExpanded ? <ChevronUp size={16} className="text-stone-300"/> : <ChevronDown size={16} className="text-stone-300"/>}
                              </div>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                              {isExpanded && (
                                  <MotionDiv 
                                    initial={{ height: 0 }} 
                                    animate={{ height: 'auto' }} 
                                    exit={{ height: 0 }}
                                    className="overflow-hidden bg-stone-50 border-t border-stone-100"
                                  >
                                      <div className="p-5 space-y-6">
                                          
                                          {/* Items List */}
                                          <div>
                                              <h5 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Items</h5>
                                              <div className="space-y-2">
                                                  {b.items.map((item, idx) => (
                                                      <div key={idx} className="flex justify-between items-center text-sm">
                                                          <div className="flex items-center gap-2">
                                                              <span className="font-bold text-stone-600">{item.quantity}x</span>
                                                              <span className="text-stone-800">{item.product?.name || "Unknown Item"}</span>
                                                          </div>
                                                          <span className="font-mono text-stone-500">{formatCurrency(item.totalPrice)}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>

                                          {/* Transactions */}
                                          <div>
                                              <h5 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Transactions</h5>
                                              <div className="space-y-2">
                                                  {b.transactions.length === 0 ? (
                                                      <p className="text-xs text-stone-400 italic">No payments recorded.</p>
                                                  ) : (
                                                      b.transactions.map((tx) => (
                                                          <div key={tx.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-stone-200">
                                                              <div className="flex items-center gap-3">
                                                                  <div className={`p-2 rounded-full ${tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                                                                      <CreditCard size={14} />
                                                                  </div>
                                                                  <div>
                                                                      <p className="text-xs font-bold text-stone-700">{formatDate(tx.date)}</p>
                                                                      <p className="text-[10px] text-stone-400 font-mono uppercase">{tx.type}</p>
                                                                  </div>
                                                              </div>
                                                              <span className="font-bold text-sm text-stone-900">{formatCurrency(tx.amount)}</span>
                                                          </div>
                                                      ))
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  </MotionDiv>
                              )}
                          </AnimatePresence>
                      </MotionDiv>
                  );
              })
          )}
      </div>
  );
};
