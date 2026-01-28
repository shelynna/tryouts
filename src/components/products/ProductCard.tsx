import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { Plus, Minus, RefreshCw, ShoppingCart, ImageOff } from 'lucide-react';
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
  const [imgSrc, setImgSrc] = useState<string>('');
  const [hasImageError, setHasImageError] = useState(false);
  
  const isSoldOut = product.stockStatus === 'SOLD_OUT';

  // Initialize and sync image source
  useEffect(() => {
    const primaryImage = product.image || (product.images && product.images[0]);
    if (primaryImage) {
        setImgSrc(primaryImage);
        setHasImageError(false);
    } else {
        setImgSrc(ASSETS.PRODUCT_PLACEHOLDER);
        setHasImageError(true);
    }
  }, [product]);

  const handleAdd = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isLoading || isLocked || isSoldOut) return;
      setIsLoading(true);
      try {
          await onIncrement(product);
      } catch (error) {
          console.debug("Increment suppressed", error);
      } finally {
          setIsLoading(false);
      }
  };

  const handleDecrement = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isLoading || isLocked) return;
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
        whileHover={{ y: -4 }}
        transition={{ duration: 0.4 }}
        onClick={() => onClick?.(product)}
        className="group cursor-pointer flex flex-col gap-3 h-full"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/5] bg-stone-100 rounded-3xl overflow-hidden mb-1 shadow-sm border border-stone-100">
           {hasImageError ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300">
                   <ImageOff size={32} />
               </div>
           ) : (
               <img 
                 src={imgSrc} 
                 alt={product.name} 
                 className={cn(
                     "w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110", 
                     isSoldOut ? "grayscale opacity-60" : ""
                 )}
                 onError={() => {
                     setHasImageError(true);
                     setImgSrc(ASSETS.PRODUCT_PLACEHOLDER);
                 }}
               />
           )}
           
           {/* Sold Out Badge */}
           {isSoldOut && (
               <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                   <span className="bg-white text-stone-900 text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-xl">
                       Sold Out
                   </span>
               </div>
           )}

           {/* Quantity Indicator Chip (Popping Animation on change) */}
           <AnimatePresence mode="wait">
             {count > 0 && !isSoldOut && (
                 <MotionDiv 
                    key={count}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="absolute top-4 right-4 bg-brand-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2 border border-brand-500/50 backdrop-blur-md z-20"
                 >
                     <ShoppingCart size={12} strokeWidth={2.5} />
                     <span>{count}</span>
                 </MotionDiv>
             )}
           </AnimatePresence>
           
           {/* Actions Overlay */}
           {!isLocked && !isSoldOut && (
               <div className={cn(
                   "absolute bottom-4 right-4 left-4 transition-all duration-300 transform z-20",
                   count > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0"
               )}>
                   <AnimatePresence mode="wait">
                       {count === 0 ? (
                           <MotionDiv
                                key="add-btn"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                           >
                               <button 
                                 onClick={handleAdd}
                                 disabled={isLoading}
                                 className={cn(
                                     "w-full h-12 bg-white/95 backdrop-blur-md rounded-2xl flex items-center justify-center gap-2 shadow-2xl hover:bg-brand-900 hover:text-white transition-all text-stone-900 font-bold text-xs uppercase tracking-widest",
                                     isLoading && "opacity-70 cursor-wait"
                                 )}
                               >
                                   {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                                   Add to Basket
                               </button>
                           </MotionDiv>
                       ) : (
                           <MotionDiv
                                key="stepper"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex items-center bg-stone-900 text-white rounded-2xl p-1 shadow-2xl gap-1 backdrop-blur-md border border-white/10"
                           >
                               <button 
                                   onClick={handleDecrement} 
                                   disabled={isLoading}
                                   className="h-10 w-10 flex items-center justify-center hover:bg-stone-800 rounded-xl transition-colors disabled:opacity-50"
                               >
                                   <Minus size={16} />
                               </button>
                               <div className="flex-1 text-center flex flex-col items-center justify-center h-10">
                                   <MotionDiv 
                                        key={count} 
                                        initial={{ scale: 0.8 }} 
                                        animate={{ scale: 1 }}
                                        className="font-mono font-bold text-sm leading-none"
                                   >
                                       {isLoading ? "..." : `Qty: ${count}`}
                                   </MotionDiv>
                               </div>
                               <button 
                                   onClick={handleAdd} 
                                   disabled={isLoading}
                                   className="h-10 w-10 flex items-center justify-center hover:bg-stone-800 rounded-xl transition-colors disabled:opacity-50"
                               >
                                   <Plus size={16} />
                               </button>
                           </MotionDiv>
                       )}
                   </AnimatePresence>
               </div>
           )}
        </div>

        {/* Info Area */}
        <div className="px-1 flex flex-col gap-1">
           <div className="flex justify-between items-start gap-2">
              <h3 className="font-heading font-bold text-stone-900 text-sm md:text-base leading-tight group-hover:text-brand-700 transition-colors line-clamp-1">
                 {product.name}
              </h3>
              <span className="font-sans font-black text-brand-700 text-sm md:text-base tabular-nums whitespace-nowrap">
                  {formatCurrency(product.price)}
              </span>
           </div>
           <div className="flex items-center justify-between">
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">
                    {product.size} • {product.category}
                </p>
                {count > 0 && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Added
                    </span>
                )}
           </div>
        </div>
      </MotionDiv>
  );
});

ProductCard.displayName = "ProductCard";