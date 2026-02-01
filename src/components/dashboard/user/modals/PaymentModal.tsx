
import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '../../../ui';
import { formatCurrency } from '../../../../lib/utils';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number; // passed initial amount (from overview)
    remainingBalance?: number; // total remaining
    type: 'PAYMENT' | 'SUBSCRIPTION';
    onConfirm: (amount: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
    isOpen, onClose, amount, remainingBalance = 0, type, onConfirm 
}) => {
    const [enteredAmount, setEnteredAmount] = useState<string>(amount.toString());

    // Sync when props change
    useEffect(() => {
        if(isOpen) setEnteredAmount(amount.toString());
    }, [isOpen, amount]);

    const handleConfirm = () => {
        const val = parseFloat(enteredAmount);
        if (isNaN(val) || val <= 0) return;
        onConfirm(val);
    };

    const setPercentage = (pct: number) => {
        if (remainingBalance <= 0) return;
        const val = Math.ceil(remainingBalance * (pct / 100));
        setEnteredAmount(val.toString());
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={type === 'SUBSCRIPTION' ? "Confirm Subscription" : "Make Payment"}
            size="sm"
        >
           <div className="space-y-6">
              
              {type === 'PAYMENT' && remainingBalance > 0 && (
                  <div className="flex gap-2 mb-4">
                      {[10, 30, 50, 100].map(pct => (
                          <button
                            key={pct}
                            onClick={() => setPercentage(pct)}
                            className="flex-1 py-2 text-[10px] font-bold uppercase bg-stone-50 hover:bg-brand-50 hover:text-brand-600 border border-stone-200 hover:border-brand-200 rounded-lg transition-colors"
                          >
                              {pct === 100 ? 'Full' : `${pct}%`}
                          </button>
                      ))}
                  </div>
              )}

              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 text-center">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Amount to Pay (GHS)</p>
                  <input 
                      type="number" 
                      value={enteredAmount}
                      onChange={e => setEnteredAmount(e.target.value)}
                      className="text-4xl font-mono font-bold text-stone-900 bg-transparent text-center w-full focus:outline-none placeholder:text-stone-300"
                      placeholder="0.00"
                      autoFocus
                  />
              </div>
              
              <div className="text-center px-2">
                  <p className="text-stone-500 text-sm">
                      Secure payment via Mobile Money / Card.
                  </p>
                  {type === 'PAYMENT' && remainingBalance > 0 && (
                      <p className="text-xs text-stone-400 mt-1">
                          Remaining Balance: {formatCurrency(Math.max(0, remainingBalance - (parseFloat(enteredAmount) || 0)))}
                      </p>
                  )}
              </div>

              <div className="flex gap-3">
                  <Button fullWidth variant="ghost" onClick={onClose} className="h-12">Cancel</Button>
                  <Button 
                    fullWidth 
                    onClick={handleConfirm} 
                    className="shadow-lg h-12 bg-stone-900 text-white"
                    disabled={!enteredAmount || parseFloat(enteredAmount) <= 0}
                  >
                    Pay Now
                  </Button>
              </div>
           </div>
        </Modal>
    );
};
