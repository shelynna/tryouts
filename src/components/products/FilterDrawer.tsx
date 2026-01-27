
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Select, Button } from '../ui';
import { cn } from '../../lib/utils';

const MotionDiv = motion.div as any;

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  currentCategory: string;
  onCategoryChange: (category: string) => void;
  currentSort: string;
  onSortChange: (sort: string) => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen, onClose, categories, currentCategory, onCategoryChange, currentSort, onSortChange
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[9998]"
          />

          {/* Drawer */}
          <MotionDiv
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-stone-50 rounded-t-3xl shadow-2xl flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-stone-50 rounded-t-3xl">
              <h2 className="font-bold text-lg text-stone-900">Filters</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-900"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 space-y-8">
                {/* Categories */}
                <div>
                    <h3 className="font-bold text-xs uppercase tracking-widest mb-3 text-stone-900">Categories</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {categories.map(cat => (
                          <button 
                            key={cat}
                            onClick={() => onCategoryChange(cat)}
                            className={cn(
                                "py-3 rounded-lg text-sm font-bold transition-colors text-center border",
                                currentCategory === cat ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'
                            )}
                          >
                              {cat}
                          </button>
                      ))}
                    </div>
                </div>

                {/* Sort */}
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-widest mb-3 text-stone-900">Sort By</h3>
                  <Select 
                    options={[
                        { label: 'Featured', value: 'default' },
                        { label: 'Price: Low to High', value: 'price_asc' },
                        { label: 'Price: High to Low', value: 'price_desc' },
                        { label: 'Name: A-Z', value: 'name' }
                    ]}
                    value={currentSort}
                    onChange={(e: any) => onSortChange(e.target.value)}
                    className="w-full"
                  />
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-stone-200 bg-white/50 backdrop-blur-md">
                <Button fullWidth size="lg" onClick={onClose}>
                    Show Results
                </Button>
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
