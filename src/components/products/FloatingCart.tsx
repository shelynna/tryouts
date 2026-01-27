
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useBasket } from '../../context/BasketContext';

const MotionDiv = motion.div as any;

export const FloatingCart: React.FC<{ itemCount: number; isLocked: boolean }> = ({ itemCount, isLocked }) => {
  const { openCart } = useBasket();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
      <AnimatePresence>
        {itemCount > 0 && !isLocked && (
          <MotionDiv 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[9990]"
          >
             <button 
                onClick={openCart}
                className="bg-brand-900 text-white pl-6 pr-2 py-2 rounded-full shadow-2xl flex items-center gap-4 hover:scale-105 transition-transform"
             >
                <span className="font-medium text-sm">{itemCount} items in basket</span>
                <div className="bg-white/20 w-8 h-8 flex items-center justify-center rounded-full">
                   <ShoppingBag size={16} />
                </div>
             </button>
          </MotionDiv>
        )}
      </AnimatePresence>,
      document.body
  );
};
