
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { Plus, ImageOff, Loader2 } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
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

export const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(({ product, count, isLocked, onIncrement, onClick }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(product.image || ASSETS.PRODUCT_PLACEHOLDER);
  const [hasImageError, setHasImageError] = useState(false);
  
  const isSoldOut = product.stockStatus === 'SOLD_OUT';

  useEffect(() => {
    if (product.image) setImgSrc(product.image);
  }, [product.image]);

  const handleQuickAdd = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isLoading || isLocked || isSoldOut) return;
      
      setIsLoading(true);
      try {
          await onIncrement(product);
      } finally {
          setIsLoading(false);
      }
  };

  return (
      <MotionDiv
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        onClick={() => onClick?.(product)}
        className="group cursor-pointer flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-stone-100 transition-all select-none"
      >
        {/* Image Container */}
        <div className="relative aspect-[1/1] bg-[#F8F8F8] overflow-hidden">
           {hasImageError ? (
               <div className="absolute inset-0 flex items-center justify-center text-stone-300">
                   <ImageOff size={24} />
               </div>
           ) : (
               <img 
                 src={imgSrc} 
                 alt={product.name} 
                 className={cn(
                     "w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110", 
                     isSoldOut ? "grayscale opacity-50" : "mix-blend-multiply"
                 )}
                 onError={() => { setHasImageError(true); setImgSrc(ASSETS.PRODUCT_PLACEHOLDER); }}
               />
           )}
           
           {isSoldOut && (
               <div className="absolute inset-0 bg-stone-900/10 flex items-center justify-center">
                   <span className="bg-stone-900 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-lg">
                       Sold Out
                   </span>
               </div>
           )}

           {/* Count Badge on Image */}
           <AnimatePresence>
             {count > 0 && (
                 <MotionDiv 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute top-2 right-2 bg-stone-900 text-white text-[10px] font-bold h-6 w-6 flex items-center justify-center rounded-full shadow-lg z-10"
                 >
                     {count}
                 </MotionDiv>
             )}
           </AnimatePresence>
        </div>

        {/* Info & Actions */}
        <div className="p-3 flex flex-col flex-1 gap-1">
           <div className="flex-1">
               <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">{product.category}</p>
               <h3 className="font-bold text-stone-900 text-sm leading-tight line-clamp-2 min-h-[2.5em]">{product.name}</h3>
               <p className="text-xs text-stone-500 mt-1">{product.size}</p>
           </div>
           
           <div className="flex items-end justify-between mt-2">
               <span className="font-mono font-bold text-brand-700 text-lg">
                   {formatCurrency(product.price)}
               </span>
               
               {/* Quick Add Button */}
               {!isLocked && !isSoldOut && (
                   <button 
                     onClick={handleQuickAdd}
                     disabled={isLoading}
                     className="w-8 h-8 rounded-full bg-stone-100 hover:bg-brand-900 hover:text-white text-stone-900 flex items-center justify-center transition-colors shadow-sm active:scale-95"
                   >
                       {isLoading ? <Loader2 size={14} className="animate-spin"/> : <Plus size={16} />}
                   </button>
               )}
           </div>
        </div>
      </MotionDiv>
  );
});

ProductCard.displayName = "ProductCard";
