
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { Plus, Minus, Check } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { ASSETS } from '../../assets';

const MotionDiv = motion.div as any;

interface ProductCardProps {
    product: Product;
    count: number;
    isLocked: boolean;
    onIncrement: (p: Product) => Promise<void>;
    onDecrement: (p: Product) => Promise<void>;
    onClick?: (p: Product) => void;
}

export const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(({ product, count, isLocked, onIncrement, onDecrement, onClick }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const isSoldOut = product.stockStatus === 'SOLD_OUT';

  const handleAdd = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isLoading) return;
      setIsLoading(true);
      try {
          await onIncrement(product);
      } catch (error) {
          // Error is already handled by Context Toast, but we must catch it here to ensure finally runs
          console.debug("Increment suppressed", error);
      } finally {
          setIsLoading(false);
      }
  };

  const handleDecrement = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isLoading) return;
      setIsLoading(true);
      try {
          await onDecrement(product);
      } catch (error) {
          console.debug("Decrement suppressed", error);
      } finally {
          setIsLoading(false);
      }
  };

  return (
      <MotionDiv
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onClick={() => onClick?.(product)}
        className="group cursor-pointer flex flex-col gap-3"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/5] bg-stone-100 rounded-2xl overflow-hidden mb-2">
           <img 
             src={product.image || ASSETS.PRODUCT_PLACEHOLDER} 
             alt={product.name} 
             className={cn(
                 "w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105", 
                 isSoldOut ? "grayscale opacity-60" : ""
             )}
             onError={(e) => { (e.target as HTMLImageElement).src = ASSETS.PRODUCT_PLACEHOLDER }}
           />
           
           {/* Badges */}
           {isSoldOut && (
               <div className="absolute top-4 left-4 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm">
                   Sold Out
               </div>
           )}
           
           {/* Quick Add Button (Floating on Desktop Hover / Always visible if in cart) */}
           {!isLocked && !isSoldOut && (
               <div className={cn(
                   "absolute bottom-4 right-4 transition-all duration-300",
                   count > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0"
               )}>
                   {count === 0 ? (
                       <button 
                         onClick={handleAdd}
                         disabled={isLoading}
                         className={cn(
                             "h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-brand-500 hover:text-white transition-colors text-stone-900",
                             isLoading && "opacity-70 cursor-wait"
                         )}
                       >
                           <Plus size={20} className={isLoading ? "animate-pulse" : ""} />
                       </button>
                   ) : (
                       <div className="flex items-center bg-stone-900 text-white rounded-full p-1 shadow-xl gap-2">
                           <button 
                               onClick={handleDecrement} 
                               disabled={isLoading}
                               className="h-8 w-8 flex items-center justify-center hover:bg-stone-700 rounded-full transition-colors disabled:opacity-50"
                           >
                               <Minus size={16} />
                           </button>
                           <span className="font-mono font-bold text-sm w-4 text-center">
                               {isLoading ? "..." : count}
                           </span>
                           <button 
                               onClick={handleAdd} 
                               disabled={isLoading}
                               className="h-8 w-8 flex items-center justify-center hover:bg-stone-700 rounded-full transition-colors disabled:opacity-50"
                           >
                               <Plus size={16} />
                           </button>
                       </div>
                   )}
               </div>
           )}
        </div>

        {/* Info */}
        <div>
           <div className="flex justify-between items-start">
              <h3 className="font-medium text-stone-900 text-lg leading-tight group-hover:underline decoration-1 underline-offset-4 decoration-stone-300">
                 {product.name}
              </h3>
              <span className="font-serif font-bold text-stone-900">{formatCurrency(product.price)}</span>
           </div>
           <p className="text-stone-500 text-sm mt-1">{product.size} • {product.category}</p>
        </div>
      </MotionDiv>
  );
});

ProductCard.displayName = "ProductCard";
