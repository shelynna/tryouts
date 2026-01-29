
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useBasket } from '../../context/BasketContext';

const MotionDiv = motion.div as any;

export const FloatingCart: React.FC<{ itemCount: number; isLocked: boolean }> = ({ itemCount, isLocked }) => {
  const { openCart } = useBasket();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevCountRef = useRef(itemCount);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Watch for count changes to trigger transient visibility
  useEffect(() => {
      if (itemCount > prevCountRef.current && !isLocked) {
          setVisible(true);
          // Reset timer if triggered again
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
              setVisible(false);
          }, 3000);
      }
      prevCountRef.current = itemCount;
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [itemCount, isLocked]);

  if (!mounted) return null;

  return createPortal(
      <AnimatePresence>
        {visible && itemCount > 0 && (
          <MotionDiv 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[9990]"
          >
             <button 
                onClick={openCart}
                className="bg-stone-900 text-white pl-6 pr-2 py-2 rounded-full shadow-2xl flex items-center gap-4 hover:scale-105 transition-transform border border-white/10"
             >
                <span className="font-bold text-sm">{itemCount} items added</span>
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
