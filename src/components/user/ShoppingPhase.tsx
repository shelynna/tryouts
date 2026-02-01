
import React, { useState, useMemo } from 'react';
import { ProductCard } from '../products/ProductCard';
import { ProductDetailsModal } from '../products/ProductDetailsModal';
import type { Cycle, Basket, CycleAccess, Product } from '../../types';
import { Button } from '../ui';
import { Search, ShoppingBag, Clock } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '../../lib/constants';
import { useBasket } from '../../context/BasketContext';

interface ShoppingPhaseProps {
  cycle: Cycle;
  basket: Basket | null | undefined;
  access: CycleAccess;
  products: Product[];
  onAddToCart: (product: Product) => Promise<void>;
  onRemoveFromCart: (productId: string) => Promise<void>;
  onPayment: (amount: number) => Promise<void>;
  onRollover: () => Promise<void>;
  onRefund: () => Promise<void>;
}

export const ShoppingPhase: React.FC<ShoppingPhaseProps> = (props) => {
  const { cycle, access, products, onAddToCart, onRemoveFromCart } = props;
  const { openCart, itemCount } = useBasket();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filter Products
  const filteredProducts = useMemo(() => {
      return products.filter(p => {
          const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
          return matchesSearch && matchesCategory;
      });
  }, [products, searchQuery, selectedCategory]);

  const getItemCount = (productId: string) => {
      return props.basket?.items?.find(i => i.productId === productId)?.quantity || 0;
  };

  const isLocked = access.phase === 'locked';

  if (access.phase === 'no_access') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                  <Clock size={32} className="text-stone-400" />
              </div>
              <h2 className="text-xl font-bold text-stone-900 mb-2">Market Closed</h2>
              <p className="text-stone-500 max-w-xs mx-auto">{access.message}</p>
          </div>
      );
  }

  return (
      <div className="pb-24 space-y-6">
          
          {/* 1. COMPACT CYCLE STATUS HEADER */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-stone-100 shadow-sm flex items-center justify-between sticky top-[72px] md:top-[80px] z-30 transition-all">
              <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cycle.status === 'OPEN' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                      <ShoppingBag size={20} />
                  </div>
                  <div>
                      <h2 className="font-bold text-stone-900 text-sm md:text-base leading-tight">
                          {cycle.month_year || cycle.name} Cycle
                      </h2>
                      <p className="text-[10px] md:text-xs text-stone-500 font-medium">
                          {isLocked ? 'Locked for Payment' : 'Open for Orders'}
                      </p>
                  </div>
              </div>
              {/* Cart Trigger */}
              <Button 
                size="sm" 
                onClick={openCart} 
                className="bg-stone-900 text-white rounded-xl px-4 h-10 shadow-lg shadow-stone-900/20 flex items-center gap-2 transition-transform active:scale-95"
              >
                  <ShoppingBag size={16} />
                  {itemCount > 0 && <span className="font-bold">{itemCount}</span>}
              </Button>
          </div>

          {/* 2. SEARCH & FILTERS */}
          <div className="space-y-4 px-1">
              {/* Search Bar */}
              <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                      type="text" 
                      placeholder="Search items (e.g. Rice, Oil)..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none shadow-sm transition-all placeholder:text-stone-400"
                  />
              </div>

              {/* Category Pills - Scrollable */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {['All', ...PRODUCT_CATEGORIES].map(cat => (
                      <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                              selectedCategory === cat 
                                  ? 'bg-stone-900 text-white border-stone-900 shadow-md transform scale-105' 
                                  : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                          }`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
          </div>

          {/* 3. PRODUCT GRID */}
          {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {filteredProducts.map(product => (
                      <ProductCard 
                          key={product.id}
                          product={product}
                          count={getItemCount(product.id)}
                          isLocked={isLocked}
                          onIncrement={async (p) => { await onAddToCart(p); }}
                          onDecrement={async (p) => { await onRemoveFromCart(p.id); }}
                          onClick={(p) => setSelectedProduct(p)}
                      />
                  ))}
              </div>
          ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                      <Search size={32} className="text-stone-300" />
                  </div>
                  <h3 className="font-bold text-stone-900">No items found</h3>
                  <p className="text-stone-500 text-sm mt-1">Try changing your filters.</p>
                  <Button variant="ghost" className="mt-4" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
                      Clear Filters
                  </Button>
              </div>
          )}

          {/* 4. PRODUCT DETAILS MODAL */}
          <ProductDetailsModal 
              isOpen={!!selectedProduct}
              onClose={() => setSelectedProduct(null)}
              product={selectedProduct}
              currentQuantity={selectedProduct ? getItemCount(selectedProduct.id) : 0}
              onIncrement={async () => { if(selectedProduct) await onAddToCart(selectedProduct); }}
              onDecrement={async () => { if(selectedProduct) await onRemoveFromCart(selectedProduct.id); }}
              isLocked={isLocked}
          />
      </div>
  );
};
