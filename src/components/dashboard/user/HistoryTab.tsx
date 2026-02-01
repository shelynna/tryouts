
import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Badge, ProgressBar } from '../../ui';
import { Basket, Transaction } from '../../../types';
import { API } from '../../../lib/api';
import { formatDate, formatCurrency, generateSmlId } from '../../../lib/utils';
import { 
    CreditCard, Package, ChevronRight, Loader2, RefreshCw, 
    Calendar, Receipt, Download, ShoppingBag, Truck, CheckCircle, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

const TransactionReceiptModal: React.FC<{ isOpen: boolean; onClose: () => void; tx: Transaction | null }> = ({ isOpen, onClose, tx }) => {
    if (!tx) return null;

    const receiptNumber = tx.metadata?.receipt_number || tx.id.substring(tx.id.length - 10);
    const dateStr = new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = new Date(tx.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const mobileEnd = tx.metadata?.authorization?.last4 ? `Ending with ${tx.metadata.authorization.last4}` : 'Mobile Money';
    const channel = tx.metadata?.authorization?.channel || 'momo';

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" className="bg-stone-50">
            <div className="flex flex-col items-center text-center pt-4 pb-8 space-y-6">
                
                {/* Header Amount */}
                <div>
                    <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-1">Amount Paid</p>
                    <h1 className="text-4xl font-mono font-bold text-stone-900">{formatCurrency(tx.amount)}</h1>
                </div>

                <div className="w-full h-px bg-stone-200"></div>

                <div className="w-full space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 mb-4">Transaction Details</h3>
                    
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-stone-500">Reference</span>
                        <span className="font-mono font-bold text-stone-800 text-xs">{tx.id}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-stone-500">Receipt Number</span>
                        <span className="font-mono font-bold text-stone-800">{receiptNumber}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-stone-500">Date & Time</span>
                        <span className="font-bold text-stone-800">{dateStr}, {timeStr}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-stone-500">Payment Method</span>
                        <div className="text-right">
                            <span className="block font-bold text-stone-800 capitalize">{channel}</span>
                            <span className="text-xs text-stone-400">{mobileEnd}</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-stone-500">Status</span>
                        <Badge status={tx.status} size="sm" />
                    </div>
                </div>

                <div className="w-full pt-4">
                    <Button variant="outline" fullWidth onClick={onClose}>Close Receipt</Button>
                </div>
            </div>
        </Modal>
    );
};

export const HistoryTab: React.FC = () => {
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBasket, setSelectedBasket] = useState<Basket | null>(null);
  
  // Transaction viewing state
  const [viewTx, setViewTx] = useState<Transaction | null>(null);

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

  const handleViewDetails = async (basket: Basket) => {
      setSelectedBasket(basket);
  };

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'PAID': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          case 'COLLECTED': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'PARTIAL': return 'bg-amber-100 text-amber-700 border-amber-200';
          case 'OPEN': return 'bg-stone-100 text-stone-700 border-stone-200';
          default: return 'bg-stone-100 text-stone-600 border-stone-200';
      }
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-brand-500" size={32} />
              <p className="text-stone-400 text-sm font-medium">Loading orders...</p>
          </div>
      );
  }

  return (
      <div className="space-y-6 w-full pb-20 font-sans">
          
          <TransactionReceiptModal 
            isOpen={!!viewTx} 
            onClose={() => setViewTx(null)} 
            tx={viewTx} 
          />

          {/* Header */}
          <div className="flex justify-between items-end pb-2">
              <div>
                <h3 className="font-serif font-bold text-3xl text-stone-900">Orders & Payments</h3>
                <p className="text-stone-500 text-sm mt-1">Track your monthly baskets and transactions.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={loadHistory} className="gap-2 text-stone-500">
                  <RefreshCw size={16} /> Refresh
              </Button>
          </div>

          {/* Empty State */}
          {baskets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-stone-200 text-center">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                      <ShoppingBag size={32} className="text-stone-300" />
                  </div>
                  <h4 className="text-lg font-bold text-stone-900">No orders placed yet</h4>
                  <p className="text-stone-500 text-sm max-w-xs mx-auto mt-2 mb-6">
                      Start a basket in the marketplace to see your history here.
                  </p>
              </div>
          ) : (
              <div className="space-y-4">
                  {/* Desktop Table Header */}
                  <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-stone-100/50 rounded-xl text-xs font-bold text-stone-500 uppercase tracking-widest border border-stone-200/50">
                      <div className="col-span-2">Date / Cycle</div>
                      <div className="col-span-3">Order Details</div>
                      <div className="col-span-3">Payment Status</div>
                      <div className="col-span-2 text-right">Total Amount</div>
                      <div className="col-span-2 text-center">Action</div>
                  </div>

                  {/* List Items */}
                  {baskets.map((b) => {
                      const progress = b.totalValue > 0 ? (b.amountPaid / b.totalValue) * 100 : 0;
                      const itemCount = b.items.reduce((acc, i) => acc + i.quantity, 0);
                      const isFullyPaid = b.status === 'PAID' || b.status === 'COLLECTED';

                      return (
                          <MotionDiv 
                            key={b.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                          >
                              {/* Desktop Row */}
                              <div className="hidden md:grid grid-cols-12 gap-4 p-5 items-center">
                                  <div className="col-span-2">
                                      <p className="font-bold text-stone-900">{formatDate(b.pickupTimestamp || new Date().toISOString())}</p>
                                      <p className="text-xs text-stone-500 font-mono mt-1">{b.month}</p>
                                  </div>
                                  <div className="col-span-3">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-stone-500">
                                              <Package size={20} />
                                          </div>
                                          <div>
                                              <p className="font-bold text-stone-900 text-sm">Grocery Basket</p>
                                              <p className="text-xs text-stone-500">{itemCount} items • ID: {b.id.substring(0,8)}</p>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="col-span-3">
                                      <div className="flex flex-col gap-2 max-w-[140px]">
                                          <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md w-fit border ${getStatusColor(b.status)}`}>
                                              {b.status}
                                          </div>
                                          <ProgressBar 
                                              progress={progress} 
                                              className="h-1.5" 
                                              barClassName={isFullyPaid ? 'bg-emerald-500' : 'bg-brand-600'}
                                          />
                                          <p className="text-[10px] text-stone-400 font-medium">
                                              {formatCurrency(b.amountPaid)} of {formatCurrency(b.totalValue)}
                                          </p>
                                      </div>
                                  </div>
                                  <div className="col-span-2 text-right">
                                      <p className="font-mono font-bold text-stone-900">{formatCurrency(b.totalValue)}</p>
                                  </div>
                                  <div className="col-span-2 flex justify-center">
                                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(b)}>
                                          View Details
                                      </Button>
                                  </div>
                              </div>

                              {/* Mobile Card */}
                              <div className="md:hidden p-5 flex flex-col gap-4">
                                  <div className="flex justify-between items-start">
                                      <div className="flex gap-3">
                                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isFullyPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-600'}`}>
                                              {isFullyPaid ? <CheckCircle size={24} /> : <ShoppingBag size={24} />}
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-stone-900">{b.month} Basket</h4>
                                              <p className="text-xs text-stone-500 mt-0.5">{itemCount} items • {formatDate(new Date().toISOString())}</p>
                                          </div>
                                      </div>
                                      <div className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${getStatusColor(b.status)}`}>
                                          {b.status}
                                      </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                          <span className="text-stone-500">Paid Amount</span>
                                          <span className="font-bold text-stone-900">{formatCurrency(b.amountPaid)}</span>
                                      </div>
                                      <ProgressBar progress={progress} className="h-2" barClassName={isFullyPaid ? 'bg-emerald-500' : 'bg-brand-600'} />
                                      <div className="flex justify-between text-xs text-stone-400">
                                          <span>Progress: {Math.round(progress)}%</span>
                                          <span>Total: {formatCurrency(b.totalValue)}</span>
                                      </div>
                                  </div>

                                  <Button variant="secondary" fullWidth onClick={() => handleViewDetails(b)}>
                                      View Order Details
                                  </Button>
                              </div>
                          </MotionDiv>
                      );
                  })}
              </div>
          )}

          {/* ORDER DETAIL MODAL */}
          <Modal
              isOpen={!!selectedBasket}
              onClose={() => setSelectedBasket(null)}
              title="Order Summary"
              size="lg"
              className="bg-stone-50"
              noPadding
          >
              {selectedBasket && (
                  <div className="flex flex-col h-[80vh]">
                      
                      {/* Status Banner */}
                      <div className={`p-6 border-b ${selectedBasket.status === 'PAID' || selectedBasket.status === 'COLLECTED' ? 'bg-emerald-600 text-white' : 'bg-white border-stone-200'}`}>
                          <div className="flex justify-between items-start">
                              <div>
                                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${selectedBasket.status === 'PAID' || selectedBasket.status === 'COLLECTED' ? 'text-emerald-200' : 'text-stone-400'}`}>
                                      Order Status
                                  </p>
                                  <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
                                      {selectedBasket.status}
                                      {(selectedBasket.status === 'PAID' || selectedBasket.status === 'COLLECTED') && <CheckCircle size={24} />}
                                  </h2>
                                  {(selectedBasket.status === 'PAID' || selectedBasket.status === 'COLLECTED') && (
                                      <p className="mt-2 text-sm text-emerald-100 font-medium">
                                          Your items are ready. Pickup code: <strong className="font-mono text-white bg-white/20 px-2 py-0.5 rounded">{selectedBasket.deliveryCode}</strong>
                                      </p>
                                  )}
                              </div>
                              <div className="text-right">
                                  <p className={`text-xs opacity-70 mb-1 ${selectedBasket.status === 'PAID' ? 'text-white' : 'text-stone-500'}`}>Total Order Value</p>
                                  <p className="text-xl font-mono font-bold">{formatCurrency(selectedBasket.totalValue)}</p>
                              </div>
                          </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-8">
                          
                          {/* Items Section */}
                          <section>
                              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Package size={14} /> Itemized List
                              </h4>
                              <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                                  {selectedBasket.items.map((item, i) => (
                                      <div key={i} className="flex justify-between items-center p-4 border-b border-stone-50 last:border-0">
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-stone-100 rounded flex items-center justify-center text-xs font-bold text-stone-600">
                                                  {item.quantity}x
                                              </div>
                                              <div>
                                                  <p className="text-sm font-bold text-stone-900">{item.product?.name || "Product"}</p>
                                                  <p className="text-[10px] text-stone-400 uppercase">{item.product?.size}</p>
                                              </div>
                                          </div>
                                          <span className="font-mono text-sm font-bold text-stone-700">{formatCurrency(item.totalPrice)}</span>
                                      </div>
                                  ))}
                                  <div className="p-4 bg-stone-50 flex justify-between items-center text-sm font-bold text-stone-900">
                                      <span>Subtotal</span>
                                      <span>{formatCurrency(selectedBasket.totalValue)}</span>
                                  </div>
                              </div>
                          </section>

                          {/* Transaction Log */}
                          <section>
                              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Receipt size={14} /> Transaction History
                              </h4>
                              <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                                  {(!selectedBasket.transactions || selectedBasket.transactions.length === 0) ? (
                                      <div className="p-8 text-center text-stone-400 text-sm italic">
                                          No individual transaction records found.
                                      </div>
                                  ) : (
                                      selectedBasket.transactions.map((tx, i) => (
                                          <div 
                                            key={i} 
                                            onClick={() => setViewTx(tx)}
                                            className="flex justify-between items-center p-4 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors cursor-pointer group"
                                          >
                                              <div className="flex items-center gap-3">
                                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                      {tx.status === 'SUCCESS' ? <CheckCircle size={14} /> : <CreditCard size={14} />}
                                                  </div>
                                                  <div>
                                                      <p className="text-sm font-bold text-stone-900 group-hover:text-brand-700 transition-colors">Payment - {formatCurrency(tx.amount)}</p>
                                                      <p className="text-[10px] text-stone-400 font-mono">{new Date(tx.date).toLocaleDateString()} • {tx.id.substring(0,8)}...</p>
                                                  </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  <span className="font-mono text-sm font-bold text-stone-900">{formatCurrency(tx.amount)}</span>
                                                  <ChevronRight size={16} className="text-stone-300 group-hover:text-brand-500" />
                                              </div>
                                          </div>
                                      ))
                                  )}
                              </div>
                          </section>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-4 bg-white border-t border-stone-200">
                          <Button variant="outline" fullWidth onClick={() => setSelectedBasket(null)}>Close Order</Button>
                      </div>
                  </div>
              )}
          </Modal>
      </div>
  );
};
