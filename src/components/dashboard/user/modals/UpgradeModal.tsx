
import React from 'react';
import { Modal, Button } from '../../../ui';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProceed: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onProceed }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Upgrade to Subscriber"
            size="md"
        >
            <div className="space-y-6">
                <div className="p-4 bg-brand-50 rounded-xl border border-brand-100 text-brand-900 text-sm leading-relaxed">
                    <p><strong>Benefits of Subscribing:</strong></p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-brand-800">
                        <li>Access to Top-Up credit facility (pay later).</li>
                        <li>Priority delivery processing.</li>
                        <li>Exclusive discounts on select items.</li>
                    </ul>
                </div>
                <div className="text-center">
                    <p className="text-stone-500 mb-1 text-sm">Subscription Fee (Per Semester)</p>
                    <p className="text-3xl font-heading font-bold text-stone-900">GHS 15.00</p>
                </div>
                <Button fullWidth size="lg" onClick={onProceed} className="shadow-xl">
                    Proceed to Payment
                </Button>
            </div>
        </Modal>
    );
};
