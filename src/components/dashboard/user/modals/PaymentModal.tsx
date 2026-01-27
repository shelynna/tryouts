
import React from 'react';
import { Modal, Button } from '../../../ui';
import { formatCurrency } from '../../../../lib/utils';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    type: 'PAYMENT' | 'SUBSCRIPTION';
    onConfirm: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, amount, type, onConfirm }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={type === 'SUBSCRIPTION' ? "Confirm Subscription" : "Confirm Payment"}
            size="sm"
        >
           <div className="space-y-4">
              <p className="text-stone-600">
                  You are about to pay <strong className="text-stone-900">{formatCurrency(amount)}</strong> via Mobile Money.
              </p>
              <div className="flex gap-3 pt-4">
                  <Button fullWidth variant="ghost" onClick={onClose}>Cancel</Button>
                  <Button fullWidth onClick={onConfirm}>Proceed</Button>
              </div>
           </div>
        </Modal>
    );
};
