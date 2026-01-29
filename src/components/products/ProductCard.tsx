
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { Plus, ShoppingCart, ImageOff, Loader2 } from 'lucide-react';
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
  
  // Safe initialization to prevent 'blob:...' error on first render
  const getSafeImage = (p: Product) => {
      const img = p.image || (p.images && p.images[0]);
      // Explicitly block local blob URLs that might have been saved erroneously
      if (img && !img.startsWith('blob:')) return img;
      return ASSETS.PRODUCT_PLACEHOLDER;
  };

  const [imgSrc, setImgSrc] = useState<string>(getSafeImage(product));
  const [hasImageError, setHasImageError] = useState(false);
  
  const isSoldOut = product.stockStatus === 'SOLD_OUT';

  // Sync image source if product changes
  useEffect(() => {
    const newSrc = getSafeImage(product);
    if (newSrc !== imgSrc) {
        setImgSrc(newSrc);
        setHasImageError(false);
    }
  }, [product]);

  const handleAdd = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isLoading || isSoldOut) return;
      
      setIsLoading(true);
      try {
          await onIncrement(product);
      } catch (error) {
          console.debug("Increment suppressed", error);
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
           {!isSoldOut && (
               <div className="absolute bottom-3 right-3 z-20">
                   <button 
                     onClick={handleAdd}
                     disabled={isLoading}
                     className={cn(
                         "w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform",
                         isLoading ? "bg-stone-100" : "bg-white hover:bg-brand-900 hover:text-white text-stone-900",
                         count > 0 ? "bg-brand-900 text-white" : ""
                     )}
                   >
                       {isLoading ? (
                           <Loader2 size={20} className="animate-spin text-stone-400" />
                       ) : (
                           <Plus size={24} strokeWidth={2.5} />
                       )}
                   </button>
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
           </div>
        </div>
      </MotionDiv>
  );
});

ProductCard.displayName = "ProductCard";
