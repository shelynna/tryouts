
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCycle } from '../hooks/useCycle';
import { useBasket } from '../context/BasketContext';
import { ShoppingPhase } from '../components/user/ShoppingPhase';
import { PaymentModal } from '../components/dashboard/user/modals/PaymentModal';
import { CartDrawer } from '../components/shopping/CartDrawer';
import { API } from '../lib/api';
import { Loader2 } from 'lucide-react';
import { Product } from '../types';
import { useNavigate } from 'react-router-dom';
import { usePaymentProcessor } from '../hooks/usePaymentProcessor';

export const CycleShop: React.FC = () => {
  const { currentCycle, access, loading: cycleLoading, user } = useCycle();
  const { basket, addItem, removeItem } = useBasket();
  const navigate = useNavigate();
  const { processPayment, isProcessing } = usePaymentProcessor();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Fetch Products
  const { data: products = [], isLoading: productsLoading } = useQuery({
      queryKey: ['products'],
      queryFn: () => API.getProducts(),
      enabled: !!user
  });

  if (cycleLoading || productsLoading) {
      return (
          <div className="flex flex-col items-center justify-center py-32 text-stone-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest">Loading Market...</p>
          </div>
      );
  }

  if (!user) return <div className="text-center py-20">Please log in to shop.</div>;
  if (!currentCycle) return <div className="text-center py-20">No active cycle found. Please check back later.</div>;
  if (!access) return <div className="text-center py-20">Unable to verify access permissions.</div>;

  const handleConfirmPayment = async (amount: number) => {
      setIsPaymentModalOpen(false);
      await processPayment(amount, user, basket?.id, 'PAYMENT', () => {
          // Optional: Navigate or show confetti
      });
  };

  const handleAdd = async (product: Product) => {
      const currentItem = basket?.items?.find((i: any) => i.productId === product.id);
      const currentQty = currentItem?.quantity || 0;
      await addItem(product, currentQty + 1);
  };

  const handleRemove = async (productId: string) => {
      const currentItem = basket?.items?.find((i: any) => i.productId === productId);
      const currentQty = currentItem?.quantity || 0;
      if (currentQty > 1) {
          const prod = products.find((p: Product) => p.id === productId);
          if (prod) await addItem(prod, currentQty - 1);
      } else {
          await removeItem(productId);
      }
  };

  // Triggered from CartDrawer Checkout
  const handleCheckout = () => {
      if (!basket || basket.items.length === 0) return;
      const remaining = Math.max(0, basket.totalValue - basket.amountPaid);
      setPaymentAmount(remaining);
      setIsPaymentModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 md:px-8">
      <ShoppingPhase 
        cycle={currentCycle}
        basket={basket}
        access={access}
        products={products}
        onAddToCart={handleAdd}
        onRemoveFromCart={handleRemove}
        onPayment={async (amt) => { setPaymentAmount(amt); setIsPaymentModalOpen(true); }}
        onRollover={async () => {}}
        onRefund={async () => {}}
      />

      <CartDrawer 
          onNavigateToDashboard={() => navigate('/dashboard')}
          onCheckout={handleCheckout} 
      />

      <PaymentModal 
        isOpen={isPaymentModalOpen || isProcessing} // Keep open if processing but show loader inside if needed, or rely on toast
        onClose={() => !isProcessing && setIsPaymentModalOpen(false)}
        amount={paymentAmount}
        remainingBalance={basket ? Math.max(0, basket.totalValue - basket.amountPaid) : 0}
        type="PAYMENT"
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
};
